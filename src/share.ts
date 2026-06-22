import type { Cents } from "./money.ts";
import type { Member } from "./domain.ts";

export interface ShareResult {
  /** Share (B) per eligible member id. */
  perMember: Map<string, Cents>;
  /** Balance left over by rounding; stays with the account. */
  unassignedByRounding: Cents;
}

/**
 * Strategy that splits the account balance into per-member shares.
 * This is the single scaling seam between the IST process (equal share)
 * and a Genossenschaft (weighted by Geschäftsanteile). Everything else in
 * the engine is share-strategy agnostic.
 */
export interface ShareStrategy {
  readonly name: string;
  compute(totalBalance: Cents, members: Member[]): ShareResult;
}

/**
 * IST process: every vote-eligible member gets the same share.
 * The source ballot rounds down to whole euros (4.605,56 € / 43 ≈ 107 €),
 * so the default rounding unit is one euro (100 cents). The remainder stays
 * with the account.
 */
export class EqualShareStrategy implements ShareStrategy {
  readonly name = "equal";
  readonly roundToCents: Cents;

  constructor(roundToCents: Cents = 100) {
    this.roundToCents = roundToCents;
  }

  compute(totalBalance: Cents, members: Member[]): ShareResult {
    const eligible = members.filter((m) => m.voteEligible);
    const perMember = new Map<string, Cents>();
    if (eligible.length === 0) {
      return { perMember, unassignedByRounding: totalBalance };
    }
    const raw = Math.floor(totalBalance / eligible.length);
    const share = Math.floor(raw / this.roundToCents) * this.roundToCents;
    for (const m of eligible) perMember.set(m.id, share);
    return {
      perMember,
      unassignedByRounding: totalBalance - share * eligible.length,
    };
  }
}

/**
 * Scaling seam made tangible (NOT used by the IST process): shares
 * proportional to `shareWeight`, e.g. number of Geschäftsanteile in a
 * cooperative. Kept minimal on purpose — governance, roles and audit trail
 * are out of scope for this prototype. Distributes whole cents and assigns
 * any rounding remainder to the account, never to a member.
 */
export class WeightedShareStrategy implements ShareStrategy {
  readonly name = "weighted";

  compute(totalBalance: Cents, members: Member[]): ShareResult {
    const eligible = members.filter((m) => m.voteEligible && m.shareWeight > 0);
    const perMember = new Map<string, Cents>();
    const totalWeight = eligible.reduce((s, m) => s + m.shareWeight, 0);
    if (totalWeight === 0) {
      return { perMember, unassignedByRounding: totalBalance };
    }
    let assigned = 0;
    for (const m of eligible) {
      const share = Math.floor((totalBalance * m.shareWeight) / totalWeight);
      perMember.set(m.id, share);
      assigned += share;
    }
    return { perMember, unassignedByRounding: totalBalance - assigned };
  }
}
