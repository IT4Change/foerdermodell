import { euros } from "./money.ts";
import type { Allocation, Donation, Member, Round } from "./domain.ts";

/**
 * Reconstruction of the "81. Stichtag" (October 2021) from the source PDFs.
 *
 * Real values taken from the documents:
 *   - total balance: 4.605,56 €
 *   - 43 vote-eligible members  ->  equal share ≈ 107 € (rounded down)
 *   - the seven initiative titles
 *
 * Member names and their individual allocations are NOT in the documents
 * (the name column and signatures are redacted). They are SYNTHETIC here —
 * deliberately no real personal data — chosen only to exercise the engine:
 * 8 of the 43 members cast votes, the rest leave their share to the account.
 */

const MEMBER_COUNT = 43;

export const members: Member[] = Array.from({ length: MEMBER_COUNT }, (_, i) => ({
  id: `M${String(i + 1).padStart(2, "0")}`,
  name: `Mitglied ${i + 1}`,
  voteEligible: true,
  shareWeight: 1,
}));

export const round: Round = {
  id: "stichtag-81",
  label: "81. Stichtag (Oktober 2021)",
  date: "2021-11-01",
  totalBalance: euros(4605.56),
  initiatives: [
    { id: "I1", title: "Computer für Video-Berichterstattung u.a." },
    { id: "I2", title: "Fahrtkostenzuschuss" },
    { id: "I3", title: "Unterstützung: Weg der Heilung" },
    {
      id: "I4",
      title: "Sonderfonds Aktion Hasenerde",
      description: "Einzahlung in den selbstverwalteten Kreditfonds.",
      fund: "S.A.H.",
    },
    { id: "I5", title: "Das Initiativkonto als Initiative" },
    { id: "I6", title: "Buchvorstellung / Gespräch in Berlin (Edition Immanente)" },
    { id: "I7", title: "Veranstaltungen an der Werkstattbühne" },
  ],
};

/**
 * Synthetic ballots: each listed member spends up to their 107 € share.
 * Some leave a remainder, which falls back to the account.
 */
export const allocations: Allocation[] = [
  // M01 spends full share across three initiatives
  { memberId: "M01", initiativeId: "I1", amount: euros(50) },
  { memberId: "M01", initiativeId: "I3", amount: euros(30) },
  { memberId: "M01", initiativeId: "I7", amount: euros(27) },
  // M02 all on the credit fund
  { memberId: "M02", initiativeId: "I4", amount: euros(107) },
  // M03 partial — leaves 47 € to the account
  { memberId: "M03", initiativeId: "I2", amount: euros(60) },
  // M04 split
  { memberId: "M04", initiativeId: "I5", amount: euros(57) },
  { memberId: "M04", initiativeId: "I6", amount: euros(50) },
  // M05 full on one
  { memberId: "M05", initiativeId: "I1", amount: euros(107) },
  // M06 small partial — leaves 87 €
  { memberId: "M06", initiativeId: "I3", amount: euros(20) },
  // M07 split across many
  { memberId: "M07", initiativeId: "I2", amount: euros(20) },
  { memberId: "M07", initiativeId: "I3", amount: euros(20) },
  { memberId: "M07", initiativeId: "I6", amount: euros(20) },
  { memberId: "M07", initiativeId: "I7", amount: euros(47) },
  // M08 full on the book event
  { memberId: "M08", initiativeId: "I6", amount: euros(107) },
];

/**
 * Free additional donations (column "freie zusätzliche Spende" in Dok 1),
 * on top of the share. Sample values mirror that column (105 / 460 / 480).
 */
export const donations: Donation[] = [
  { memberId: "M01", initiativeId: "I3", amount: euros(105) },
  { memberId: "M05", initiativeId: "I1", amount: euros(460) },
  { memberId: "M08", initiativeId: "I6", amount: euros(480) },
];
