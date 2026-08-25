import { test } from "node:test";
import assert from "node:assert/strict";
import { bestimmeDelegationsreife, bestimmeZulaessigeDelegation, formatierePruefung, minimumSStufe, type StufenBedingungen } from "../src/gemeinsam/delegationsreife";

const ALLES_ERFUELLT: StufenBedingungen = {
  stufe1: { profilVorhanden: true, issueFormularVorhanden: true },
  stufe2: { pruefungenVerbindlich: true, vierAugenBelegt: true, keinSelbstMerge: true },
  stufe3: { leitplankenMaschinenlesbar: true, gate3Durchlaufen: true },
  stufe4: { historieNachgewiesen: true },
};

test("REQ-32 GR-10.1: alle Bedingungen erfuellt ergibt Stufe 4", () => {
  assert.equal(bestimmeDelegationsreife(ALLES_ERFUELLT).stufe, 4);
});

test("D3-26: ohne belegte Historie bleibt es bei Stufe 3", () => {
  const ohneHistorie: StufenBedingungen = { ...ALLES_ERFUELLT, stufe4: { historieNachgewiesen: false } };
  const ergebnis = bestimmeDelegationsreife(ohneHistorie);
  assert.equal(ergebnis.stufe, 3);
  assert.ok(ergebnis.fehlend.some((f) => f.includes("belegte Historie")));
});

test("D3-26: eine belegte Historie hebt eine fehlende Stufe-3-Bedingung nicht auf", () => {
  const ohneGate3: StufenBedingungen = {
    ...ALLES_ERFUELLT,
    stufe3: { leitplankenMaschinenlesbar: true, gate3Durchlaufen: false },
  };
  assert.equal(bestimmeDelegationsreife(ohneGate3).stufe, 2);
});

test("REQ-32: Reife folgt der schwaechsten erfuellten Bedingung, eine teilweise erfuellte Stufe zaehlt nicht", () => {
  const teilweise: StufenBedingungen = { ...ALLES_ERFUELLT, stufe2: { ...ALLES_ERFUELLT.stufe2, keinSelbstMerge: false } };
  const ergebnis = bestimmeDelegationsreife(teilweise);
  assert.equal(ergebnis.stufe, 1);
  assert.ok(ergebnis.fehlend.some((f) => f.includes("Selbst-Merge")));
});

test("REQ-32 GR-10.2: ohne maschinenlesbare Leitplanken hoechstens Stufe 2, unabhaengig von Gate 3", () => {
  const ohneLeitplanken: StufenBedingungen = { ...ALLES_ERFUELLT, stufe3: { leitplankenMaschinenlesbar: false, gate3Durchlaufen: true } };
  assert.equal(bestimmeDelegationsreife(ohneLeitplanken).stufe, 2);
});

test("Fehlerverhalten: ohne jede Bedingung bleibt die Stufe bei eins, nie null", () => {
  const nichts: StufenBedingungen = {
    stufe1: { profilVorhanden: false, issueFormularVorhanden: false },
    stufe2: { pruefungenVerbindlich: false, vierAugenBelegt: false, keinSelbstMerge: false },
    stufe3: { leitplankenMaschinenlesbar: false, gate3Durchlaufen: false },
    stufe4: { historieNachgewiesen: false },
  };
  const ergebnis = bestimmeDelegationsreife(nichts);
  assert.equal(ergebnis.stufe, 1);
  assert.equal(ergebnis.fehlend.length, 8);
});

test("minimumSStufe liefert die niedrigere Stufe", () => {
  assert.equal(minimumSStufe("S3", "S4"), "S3");
  assert.equal(minimumSStufe("S1", "S4"), "S1");
});

test("REQ-33 Abnahme 1: bei Reife drei und K1 (Matrixobergrenze S4) lautet das Ergebnis S3", () => {
  const p = bestimmeZulaessigeDelegation("S3", 3, "S4");
  assert.equal(p.zulaessig, "S3");
  assert.equal(p.akzeptiert, true);
});

test("REQ-33 Abnahme 2: bei Reife vier und K3 (Matrixobergrenze S2) lautet das Ergebnis S2", () => {
  const p = bestimmeZulaessigeDelegation("S2", 4, "S2");
  assert.equal(p.zulaessig, "S2");
});

test("REQ-33 GR-10.4: eine ueberschreitende Angabe wird abgelehnt und nennt beide Grenzen und die engere", () => {
  const p = bestimmeZulaessigeDelegation("S4", 2, "S3");
  assert.equal(p.akzeptiert, false);
  const text = formatierePruefung(p);
  assert.match(text, /Delegationsreife erlaubt bis S2/);
  assert.match(text, /K-mal-S-Matrix erlaubt bis S3/);
  assert.match(text, /engere Grenze: Delegationsreife \(S2\)/);
});

test("eine akzeptierte Angabe wird als solche formatiert", () => {
  const p = bestimmeZulaessigeDelegation("S1", 3, "S4");
  assert.match(formatierePruefung(p), /S1 akzeptiert/);
});
