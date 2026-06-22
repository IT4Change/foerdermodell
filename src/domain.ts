import type { Cents } from "./money.ts";

/**
 * Domain model of the "Initiativkonto" funding process.
 *
 * Existing process (IST):
 *   - A shared account collects monthly contributions from members.
 *   - Three times a year a `Round` (Stichtag) opens. Members submit
 *     `Initiative`s; every member receives the same equal share of the
 *     account balance and freely distributes it across the initiatives.
 *   - Funding per initiative = sum of all member allocations to it.
 *   - Unallocated share falls back to the account (carry-over to next round).
 *
 * Scaling seam (Genossenschaft): the only part that differs for a cooperative
 * is *how the share is computed* (equal vs. weighted by Geschäftsanteile).
 * That is isolated behind `ShareStrategy` (see share.ts); the rest of the
 * model is reused unchanged. `Member.shareWeight` exists for that future
 * weighting and is always 1 in the equal-share IST process.
 */
export interface Member {
  id: string;
  name: string;
  /** ISO date the member joined; informational. */
  joinedAt?: string;
  /** stimmberechtigt — only eligible members receive a share. */
  voteEligible: boolean;
  /** IST: always 1. Seam for weighted shares / Geschäftsanteile (Geno). */
  shareWeight: number;
}

export interface Initiative {
  id: string;
  title: string;
  description?: string;
  /**
   * Optional target fund deviating from the main account, e.g. the
   * self-managed credit fund "Sonderfonds Aktion Hasenerde" (S.A.H.).
   */
  fund?: string;
}

/** A Stichtag: one funding round. */
export interface Round {
  id: string;
  label: string;
  /** ISO date of the Stichtag. */
  date: string;
  /** Total account balance at the Stichtag (line A on the ballot). */
  totalBalance: Cents;
  initiatives: Initiative[];
}

/**
 * A member's assignment of part of their share (B) to an initiative.
 * The sum of a member's allocations must not exceed their share.
 */
export interface Allocation {
  memberId: string;
  initiativeId: string;
  amount: Cents;
}

/**
 * Free additional donation — does NOT count against the share (B).
 * Corresponds to the "freie zusätzliche Spende" column in the contribution
 * statement. It is added on top of the share-funded amount.
 */
export interface Donation {
  memberId: string;
  initiativeId: string;
  amount: Cents;
}
