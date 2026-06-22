import { euros } from "./money.ts";
import type { Allocation, Donation, Initiative, Member, Round } from "./domain.ts";

/**
 * Larger, shared demo dataset for the UI samples. Reproduces the documented
 * figures of the 81. Stichtag (balance 4.605,56 € / 43 eligible -> 107 € share)
 * but enriches members with synthetic contribution data so the member-facing
 * screens (profile, member list, ballots) have something to show.
 *
 * DELIBERATELY no real personal data — names, cities and contributions are
 * fictional and generated deterministically (fixed seed) so the demo is stable
 * across regenerations. The names found in the source PDFs are intentionally
 * NOT reused.
 */

// --- deterministic PRNG (so the demo data never shifts between runs) -------
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(81);
const pick = <T>(xs: T[]): T => xs[Math.floor(rng() * xs.length)];
const pickInt = (min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

const FIRST = [
  "Anna", "Bernd", "Clara", "David", "Elke", "Falk", "Greta", "Hanno", "Ida",
  "Jonas", "Karin", "Lars", "Mara", "Nils", "Olga", "Paul", "Rosa", "Sven",
  "Tilda", "Udo", "Vera", "Wim", "Yara", "Zora", "Bea", "Cem", "Dora", "Emil",
  "Fina", "Götz", "Heidi", "Ilan", "Juna", "Knut", "Lena", "Mats", "Nora",
  "Ove", "Pia", "Ruben", "Sina", "Theo", "Uta", "Veit", "Wanda",
];
const LAST = [
  "Ahrend", "Bauer", "Cordes", "Dahl", "Engel", "Frei", "Grimm", "Haas",
  "Iversen", "Jung", "Kern", "Loos", "Mohr", "Nolte", "Ott", "Petz", "Quint",
  "Roth", "Sauer", "Thiel", "Uhl", "Voss", "Welk", "Zink", "Arend", "Behr",
  "Cramer", "Dorn", "Ernst", "Funk", "Gabel", "Hein", "Imhof", "Jahn", "Kraus",
  "Linde", "Merz", "Nau", "Opitz", "Pohl", "Reich", "Stein", "Traub", "Ueltz",
  "Wirth",
];
const CITIES = [
  "Cottbus", "Berlin", "Leipzig", "Dresden", "Potsdam", "Bautzen", "Görlitz",
  "Wien", "Halle", "Jena", "Erfurt", "Magdeburg", "Frankfurt (Oder)", "Chemnitz",
];

const TOTAL_MEMBERS = 45; // 43 eligible + 2 not yet eligible (recently joined)
const ELIGIBLE = 43;

export interface MemberContribution {
  /** Monthly contribution in cents (min 15 €). */
  monthly: number;
  /** Total paid in since 1 January (cents). */
  paidSinceJan: number;
  /** Current balance vs. expected (cents, may be negative). */
  balance: number;
  /** Free additional donation pledged this round (cents). */
  freeDonation: number;
}

export interface DemoMember extends Member {
  city: string;
  contribution: MemberContribution;
}

export const members: DemoMember[] = Array.from({ length: TOTAL_MEMBERS }, (_, i) => {
  const eligible = i < ELIGIBLE;
  const monthly = euros(pick([15, 15, 20, 20, 25, 30, 40]));
  const months = eligible ? pickInt(8, 10) : pickInt(1, 3);
  const paidSinceJan = monthly * months;
  const balance = euros(pick([0, 0, 30, 60, 90, -30, -45, 120, -15]));
  const freeDonation = 0; // set below for a few members
  return {
    id: `M${String(i + 1).padStart(2, "0")}`,
    name: `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`,
    city: pick(CITIES),
    joinedAt: eligible ? `${pickInt(2014, 2020)}-0${pickInt(1, 9)}-15` : "2021-09-15",
    voteEligible: eligible,
    shareWeight: 1,
    contribution: { monthly, paidSinceJan, balance, freeDonation },
  };
});

export const round: Round = {
  id: "stichtag-81",
  label: "81. Stichtag (Oktober 2021)",
  date: "2021-11-01",
  totalBalance: euros(4605.56),
  initiatives: [
    {
      id: "I1",
      title: "Computer für Video-Berichterstattung u.a.",
      description: "Anschaffung von Technik für die Video-Berichterstattung von Aktionen und Treffen.",
    },
    {
      id: "I2",
      title: "Fahrtkostenzuschuss",
      description: "Zuschuss zu Reisekosten für Mitglieder, die an Treffen und Aktionen teilnehmen.",
    },
    {
      id: "I3",
      title: "Unterstützung: Weg der Heilung",
      description: "Begleitung und Unterstützung auf dem Weg der Heilung, u. a. Naturheilkunde.",
    },
    {
      id: "I4",
      title: "Sonderfonds Aktion Hasenerde",
      description: "Einzahlung in den selbstverwalteten Kreditfonds (S.A.H.).",
      fund: "S.A.H.",
    },
    {
      id: "I5",
      title: "Das Initiativkonto als Initiative",
      description: "Stärkung und Bewerbung des Initiativkontos selbst.",
    },
    {
      id: "I6",
      title: "Buchvorstellung / Gespräch in Berlin (Edition Immanente)",
      description: "Lesung und Gespräch zu einer Neuerscheinung der Edition Immanente.",
    },
    {
      id: "I7",
      title: "Veranstaltungen an der Werkstattbühne",
      description: "Kulturveranstaltungen an der kleinen Werkstattbühne.",
    },
  ] satisfies Initiative[],
};

/** Member id who submitted each initiative (informational, for the UI). */
export const applicantByInitiative: Record<string, string> = {
  I1: "M03",
  I2: "M07",
  I3: "M11",
  I4: "M02",
  I5: "M01",
  I6: "M05",
  I7: "M09",
};

const SHARE = euros(107);
const initiativeIds = round.initiatives.map((i) => i.id);

// --- ballots ---------------------------------------------------------------
// The viewer (M01) gets a fixed, fully-distributed ballot so the profile and
// ballot screens are predictable. The rest are generated; about a quarter of
// eligible members abstain, and many leave a remainder -> carry-over.
const allocations: Allocation[] = [
  { memberId: "M01", initiativeId: "I1", amount: euros(40) },
  { memberId: "M01", initiativeId: "I3", amount: euros(30) },
  { memberId: "M01", initiativeId: "I7", amount: euros(37) },
];

for (const m of members) {
  if (!m.voteEligible || m.id === "M01") continue;
  if (rng() < 0.25) continue; // abstain
  // how much of the 107 € share this member spends (some leave a remainder)
  let budget = pick([SHARE, SHARE, SHARE, euros(90), euros(80), euros(60), euros(100)]);
  const k = pickInt(1, 4);
  const chosen = new Set<string>();
  while (chosen.size < k) chosen.add(pick(initiativeIds));
  const ids = [...chosen];
  for (let j = 0; j < ids.length; j++) {
    if (budget <= 0) break;
    const last = j === ids.length - 1;
    let amount: number;
    if (last) {
      amount = budget;
    } else {
      // a chunk in whole euros, leaving room for the rest
      const maxChunk = Math.max(euros(10), budget - euros(10) * (ids.length - j - 1));
      amount = euros(pickInt(10, Math.max(10, Math.floor(maxChunk / 100))));
      if (amount > budget) amount = budget;
    }
    if (amount > 0) allocations.push({ memberId: m.id, initiativeId: ids[j], amount });
    budget -= amount;
  }
}

// --- free donations (mirror the "freie zusätzliche Spende" column) ---------
const donationPlan: Array<[string, string, number]> = [
  ["M01", "I3", euros(105)],
  ["M05", "I6", euros(480)],
  ["M14", "I1", euros(460)],
  ["M21", "I4", euros(60)],
];
export const donations: Donation[] = donationPlan.map(([memberId, initiativeId, amount]) => ({
  memberId,
  initiativeId,
  amount,
}));
for (const [memberId, , amount] of donationPlan) {
  const m = members.find((x) => x.id === memberId);
  if (m) m.contribution.freeDonation = amount;
}

export { allocations };

/** The member whose perspective the member-facing screens take. */
export const viewerId = "M01";
