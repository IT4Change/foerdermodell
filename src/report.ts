import { fmt } from "./money.ts";
import { distribute } from "./engine.ts";
import { allocations, donations, members, round } from "./sample-data.ts";

const result = distribute(round, members, allocations, donations);
const titleById = new Map(round.initiatives.map((i) => [i.id, i.title]));

console.log(`\n${result.round}`);
console.log(`Verteilstrategie: ${result.shareStrategy}`);
console.log(`Gesamtkontostand: ${fmt(result.totalBalance)}`);
console.log(`Stimmberechtigte: ${members.filter((m) => m.voteEligible).length}`);
const share = result.members[0]?.share ?? 0;
console.log(`Anteil je Mitglied: ${fmt(share)}\n`);

console.log("Förderung je Initiative");
console.log("─".repeat(72));
for (const i of result.initiatives) {
  const title = titleById.get(i.initiativeId) ?? i.initiativeId;
  const extra = i.fromDonations > 0 ? `  (davon Spende ${fmt(i.fromDonations)})` : "";
  console.log(`${fmt(i.total).padStart(12)}  ${title}${extra}`);
}
console.log("─".repeat(72));
console.log(`${fmt(result.totalToInitiatives).padStart(12)}  Summe an Initiativen`);
console.log(`${fmt(result.totalDonations).padStart(12)}  davon freie Spenden`);
console.log(`${fmt(result.carryOver).padStart(12)}  Übertrag → nächster Stichtag`);

const voted = result.members.filter((m) => m.allocated > 0).length;
console.log(
  `\n${voted}/${result.members.length} Mitglieder haben abgestimmt; ` +
    `der Rest beließ den Anteil dem Konto.\n`,
);
