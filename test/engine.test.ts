import test from "node:test";
import assert from "node:assert/strict";

import { euros } from "../src/money.ts";
import type { Allocation, Donation, Member, Round } from "../src/domain.ts";
import { DistributionError, distribute } from "../src/engine.ts";
import { EqualShareStrategy, WeightedShareStrategy } from "../src/share.ts";
import { allocations, donations, members, round } from "../src/sample-data.ts";

function makeMembers(n: number, weight = 1): Member[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `M${i + 1}`,
    name: `Mitglied ${i + 1}`,
    voteEligible: true,
    shareWeight: weight,
  }));
}

const twoInitiativeRound = (balance: number): Round => ({
  id: "r",
  label: "r",
  date: "2021-01-01",
  totalBalance: euros(balance),
  initiatives: [
    { id: "A", title: "A" },
    { id: "B", title: "B" },
  ],
});

test("equal share rounds down to whole euros, remainder stays with account", () => {
  // Reproduces the source ballot: 4.605,56 € / 43 -> 107 € each.
  const { perMember, unassignedByRounding } = new EqualShareStrategy().compute(
    euros(4605.56),
    makeMembers(43),
  );
  assert.equal(perMember.get("M1"), euros(107));
  assert.equal(perMember.size, 43);
  assert.equal(unassignedByRounding, euros(4605.56) - euros(107) * 43);
});

test("only vote-eligible members receive a share", () => {
  const ms = makeMembers(3);
  ms[2].voteEligible = false;
  const { perMember } = new EqualShareStrategy().compute(euros(300), ms);
  assert.equal(perMember.size, 2);
  assert.equal(perMember.get("M1"), euros(150));
  assert.equal(perMember.get("M3"), undefined);
});

test("funding per initiative is the sum of allocations plus donations", () => {
  const ms = makeMembers(2);
  const r = twoInitiativeRound(200); // 100 € share each
  const allocs: Allocation[] = [
    { memberId: "M1", initiativeId: "A", amount: euros(100) },
    { memberId: "M2", initiativeId: "A", amount: euros(40) },
    { memberId: "M2", initiativeId: "B", amount: euros(60) },
  ];
  const dons: Donation[] = [{ memberId: "M1", initiativeId: "B", amount: euros(25) }];
  const res = distribute(r, ms, allocs, dons);
  const a = res.initiatives.find((i) => i.initiativeId === "A")!;
  const b = res.initiatives.find((i) => i.initiativeId === "B")!;
  assert.equal(a.total, euros(140));
  assert.equal(b.fromShares, euros(60));
  assert.equal(b.fromDonations, euros(25));
  assert.equal(b.total, euros(85));
  assert.equal(res.totalDonations, euros(25));
});

test("unallocated share carries over; donations do not affect carry-over", () => {
  const ms = makeMembers(2);
  const r = twoInitiativeRound(200); // 100 € each
  const allocs: Allocation[] = [
    { memberId: "M1", initiativeId: "A", amount: euros(30) }, // leaves 70
  ];
  const dons: Donation[] = [{ memberId: "M1", initiativeId: "A", amount: euros(500) }];
  const res = distribute(r, ms, allocs, dons);
  // M1 leaves 70, M2 leaves all 100 -> 170 carry-over. Donation is on top.
  assert.equal(res.carryOver, euros(170));
});

test("invariant: carryOver === totalBalance - share-funded total", () => {
  const res = distribute(round, members, allocations, donations);
  const fromShares = res.initiatives.reduce((s, i) => s + i.fromShares, 0);
  assert.equal(res.carryOver, res.totalBalance - fromShares);
});

test("rejects a member allocating more than their share", () => {
  const ms = makeMembers(2);
  const r = twoInitiativeRound(200); // 100 € each
  const allocs: Allocation[] = [
    { memberId: "M1", initiativeId: "A", amount: euros(60) },
    { memberId: "M1", initiativeId: "B", amount: euros(50) }, // 110 > 100
  ];
  assert.throws(() => distribute(r, ms, allocs), DistributionError);
});

test("rejects allocation to an initiative not in the round", () => {
  const ms = makeMembers(1);
  const r = twoInitiativeRound(100);
  const allocs: Allocation[] = [{ memberId: "M1", initiativeId: "X", amount: euros(10) }];
  assert.throws(() => distribute(r, ms, allocs), DistributionError);
});

test("rejects negative amounts", () => {
  const ms = makeMembers(1);
  const r = twoInitiativeRound(100);
  assert.throws(
    () => distribute(r, ms, [{ memberId: "M1", initiativeId: "A", amount: euros(-5) }]),
    DistributionError,
  );
});

test("scaling seam: weighted strategy splits proportional to shareWeight", () => {
  const ms = makeMembers(2);
  ms[0].shareWeight = 3; // e.g. 3 Geschäftsanteile
  ms[1].shareWeight = 1;
  const { perMember, unassignedByRounding } = new WeightedShareStrategy().compute(
    euros(400),
    ms,
  );
  assert.equal(perMember.get("M1"), euros(300));
  assert.equal(perMember.get("M2"), euros(100));
  assert.equal(unassignedByRounding, 0);
});

test("sample round reproduces the documented 107 € share", () => {
  const res = distribute(round, members, allocations, donations);
  assert.equal(res.members[0].share, euros(107));
  assert.ok(res.totalToInitiatives > 0);
});
