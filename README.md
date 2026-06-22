# Fördermodell — Initiativkonto

Prototyp des Förderprozesses „Initiativkonto für selbstbestimmtes Handeln durch
Gegenseitigkeit". Dieser erste Schritt ist der **Domänenkern + die Rechen-Engine**
(kein UI). Er bildet den bestehenden Prozess ab und ist so geschnitten, dass die
Hochskalierung auf eine **Genossenschaft** eine Erweiterung statt eines Rewrites ist.

## Der Prozess (IST)

Ein Gemeinschaftskonto (GLS Bank, z. Zt. ~40 Mitglieder, Mindestbeitrag 15 €/Monat).

1. **3× im Jahr ein Stichtag** (`Round`). Mitglieder reichen **Initiativen**
   (`Initiative`) beim Treuhänder ein; alle erhalten die Darstellungen zugeschickt.
2. **Gleicher Anteil pro Kopf**: Gesamtkontostand ÷ stimmberechtigte Mitglieder,
   abgerundet auf ganze Euro (im Quelldokument: 4.605,56 € / 43 ≈ **107 €**).
   Kein Mehrheitsentscheid — jedes Mitglied verfügt nur über den **eigenen Anteil**.
3. Jedes Mitglied **verteilt seinen Anteil frei** auf die Initiativen (`Allocation`).
   Die Summe der eigenen Zuweisungen darf den Anteil nicht übersteigen.
4. **Förderbetrag je Initiative = Summe aller Zuweisungen** an sie.
5. **Nicht vergebene Anteile fallen ans Konto** → Übertrag zum nächsten Stichtag.
6. Ergänzungen: **freie Zusatzspende** (`Donation`, zählt *zusätzlich*, nicht gegen
   den Anteil) und der Kreditfonds **„Sonderfonds Aktion Hasenerde" (S.A.H.)** als
   Initiative mit eigenem Zieltopf.

## Architektur

| Datei | Inhalt |
|---|---|
| `src/money.ts` | Geld als Integer-Cents (keine Float-Drift), DE-Formatierung. |
| `src/domain.ts` | Typen: `Member`, `Initiative`, `Round`, `Allocation`, `Donation`. |
| `src/share.ts` | **`ShareStrategy`** — der einzige Skalierungs-Schnitt (s. u.). |
| `src/engine.ts` | `distribute()`: Validierung + Aggregation → `DistributionResult`. |
| `src/sample-data.ts` | Kleine Rekonstruktion des 81. Stichtags (Okt. 2021) für Tests/Report. |
| `src/report.ts` | Druckt den Beispiel-Lauf als Tabelle. |
| `src/dataset.ts` | **Größerer geteilter Demo-Datensatz** (45 Mitglieder mit Beiträgen) für die UI. |
| `src/generate-ui-data.ts` | Rechnet den Datensatz durch die Engine → schreibt `ui/dataset.js`. |
| `ui/` | **Statische UI-Muster** (s. u.). |
| `test/engine.test.ts` | 10 Tests inkl. dokumentierter 107-€-Anteil + Invarianten. |

**Invariante:** `carryOver === totalBalance − (Förderung aus Anteilen)`.
Spenden sind additiv und berühren weder Saldo noch Übertrag.

## Skalierung auf Genossenschaft

Der einzige fachliche Unterschied ist **wie der Anteil berechnet wird**. Das steckt
hinter `ShareStrategy`:

- `EqualShareStrategy` — IST: gleicher Anteil für alle Stimmberechtigten
  (genossenschaftliches „one member, one vote"-Prinzip ist bereits abgebildet).
- `WeightedShareStrategy` — Beispiel-Seam: Anteil proportional zu `Member.shareWeight`
  (z. B. Anzahl Geschäftsanteile). Bewusst minimal — **Governance, Rollen, Beitrags-
  Buchhaltung und Audit-Trail sind noch nicht ausgebaut** (nächste Iterationen).

`Member.shareWeight` existiert genau für diesen Zweck und ist im IST-Prozess immer 1.

## Datenschutz-Hinweis zu den Quell-PDFs

Die „GESCHWÄRZT"-PDFs unter `pdf-quellen/` sind **technisch korrekt** geschwärzt
(je 1 eingebranntes Rasterbild, keine Textebene/Overlay — nicht rückgängig zu machen),
aber **inhaltlich unvollständig**: Bankverbindung und Klarnamen im Fließtext sind
sichtbar. Nicht ungeprüft weitergeben. Dieser Prototyp verwendet **keine echten
Personendaten** — alle Mitglieder/Stimmen in `sample-data.ts` sind synthetisch.

## UI-Muster (`ui/`)

Statische HTML-Ansichten zum Zeigen — **kein Build, kein Server, keine Frameworks**.
Alle Seiten teilen sich das generierte `ui/dataset.js` (`window.DATASET`, aus dem
Domänenkern, daher konsistent zur Engine). Einfach `ui/index.html` im Browser öffnen.

Stil: warm & gemeinschaftlich (grün/beige, runde Karten). Sieben Ansichten:
Übersicht, Initiativen, Verteilbogen, Ergebnis, Mitglieder, Projekt-Mitglieder,
Mein Profil. Rein statisch (vorbefüllt), Perspektive eines Beispiel-Mitglieds.

Daten neu generieren (nach Änderung an `dataset.ts`):

```bash
npm run ui:data
```

## Ausführen

Benötigt **Node ≥ 23.6** (native TypeScript-Ausführung, keine Dependencies/Build).

```bash
npm test        # Engine-Tests
npm run report  # Beispiel-Lauf (81. Stichtag) ausgeben
npm run ui:data # ui/dataset.js neu generieren, dann ui/index.html öffnen
```
