import type { Cents } from "./money.ts";
import { fmt } from "./money.ts";
import type { Allocation, Donation, Member, Round } from "./domain.ts";
import { EqualShareStrategy, type ShareStrategy } from "./share.ts";

export class DistributionError extends Error {}

export interface MemberOutcome {
  memberId: string;
  share: Cents;
  /** Sum of this member's allocations (from share). */
  allocated: Cents;
  /** share - allocated; falls back to the account / next round. */
  remaining: Cents;
}

export interface InitiativeOutcome {
  initiativeId: string;
  /** Funding from member shares. */
  fromShares: Cents;
  /** Funding from free donations (on top of shares). */
  fromDonations: Cents;
  total: Cents;
}

export interface DistributionResult {
  round: string;
  shareStrategy: string;
  totalBalance: Cents;
  members: MemberOutcome[];
  initiatives: InitiativeOutcome[];
  /** Unallocated shares + rounding remainder; carries to the next Stichtag. */
  carryOver: Cents;
  /** Total free donations (not drawn from the balance). */
  totalDonations: Cents;
  /** Total flowing to initiatives = share-funded + donations. */
  totalToInitiatives: Cents;
}

/**
 * Run one funding round: validate inputs, compute per-member shares via the
 * chosen strategy, sum allocations and donations per initiative, and derive
 * the carry-over.
 *
 * Invariant: carryOver === totalBalance - sum(fromShares). Donations are
 * additive and never affect the balance or carry-over.
 */
export function distribute(
  round: Round,
  members: Member[],
  allocations: Allocation[],
  donations: Donation[] = [],
  strategy: ShareStrategy = new EqualShareStrategy(),
): DistributionResult {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const initiativeIds = new Set(round.initiatives.map((i) => i.id));

  const { perMember, unassignedByRounding } = strategy.compute(
    round.totalBalance,
    members,
  );

  // --- validation -----------------------------------------------------
  const allocatedByMember = new Map<string, Cents>();
  for (const a of allocations) {
    if (!memberById.has(a.memberId)) {
      throw new DistributionError(`Unknown member: ${a.memberId}`);
    }
    if (!initiativeIds.has(a.initiativeId)) {
      throw new DistributionError(
        `Allocation references initiative not in round: ${a.initiativeId}`,
      );
    }
    if (a.amount < 0) {
      throw new DistributionError(
        `Negative allocation by ${a.memberId} to ${a.initiativeId}`,
      );
    }
    allocatedByMember.set(
      a.memberId,
      (allocatedByMember.get(a.memberId) ?? 0) + a.amount,
    );
  }
  for (const [memberId, allocated] of allocatedByMember) {
    const share = perMember.get(memberId) ?? 0;
    if (allocated > share) {
      throw new DistributionError(
        `Member ${memberId} allocated ${fmt(allocated)} > share ${fmt(share)}`,
      );
    }
  }
  for (const d of donations) {
    if (!memberById.has(d.memberId)) {
      throw new DistributionError(`Unknown member: ${d.memberId}`);
    }
    if (!initiativeIds.has(d.initiativeId)) {
      throw new DistributionError(
        `Donation references initiative not in round: ${d.initiativeId}`,
      );
    }
    if (d.amount < 0) {
      throw new DistributionError(
        `Negative donation by ${d.memberId} to ${d.initiativeId}`,
      );
    }
  }

  // --- aggregation ----------------------------------------------------
  const fromShares = new Map<string, Cents>();
  for (const a of allocations) {
    fromShares.set(a.initiativeId, (fromShares.get(a.initiativeId) ?? 0) + a.amount);
  }
  const fromDonations = new Map<string, Cents>();
  for (const d of donations) {
    fromDonations.set(
      d.initiativeId,
      (fromDonations.get(d.initiativeId) ?? 0) + d.amount,
    );
  }

  const memberOutcomes: MemberOutcome[] = [];
  for (const [memberId, share] of perMember) {
    const allocated = allocatedByMember.get(memberId) ?? 0;
    memberOutcomes.push({ memberId, share, allocated, remaining: share - allocated });
  }

  const initiativeOutcomes: InitiativeOutcome[] = round.initiatives.map((i) => {
    const s = fromShares.get(i.id) ?? 0;
    const d = fromDonations.get(i.id) ?? 0;
    return { initiativeId: i.id, fromShares: s, fromDonations: d, total: s + d };
  });

  const totalRemaining = memberOutcomes.reduce((s, m) => s + m.remaining, 0);
  const totalDonations = initiativeOutcomes.reduce((s, i) => s + i.fromDonations, 0);
  const totalFromShares = initiativeOutcomes.reduce((s, i) => s + i.fromShares, 0);

  return {
    round: round.label,
    shareStrategy: strategy.name,
    totalBalance: round.totalBalance,
    members: memberOutcomes,
    initiatives: initiativeOutcomes,
    carryOver: totalRemaining + unassignedByRounding,
    totalDonations,
    totalToInitiatives: totalFromShares + totalDonations,
  };
}
