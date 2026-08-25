import { test } from "node:test";
import assert from "node:assert/strict";
import { kritikalitaetMitRueckfall, leseEinstufung, matrixObergrenze } from "../src/action/arbeitspaket";
import { bestimmeZulaessigeDelegation, formatierePruefung } from "../src/gemeinsam/delegationsreife";

const FORMULARTEXT = `### Kritikalitaet

K2 standard

### Delegationsstufe

S3 Unterstuetzen

### Begruendung der Einstufung

Kundenfeature, Fehler ist behebbar.`;

test("REQ-28: liest Kritikalitaet und Delegationsstufe aus dem Issue-Formular", () => {
  assert.deepEqual(leseEinstufung(FORMULARTEXT), { kritikalitaet: "K2", delegation: "S3" });
});

test("fehlende Angaben werden als null gemeldet, nicht geraten", () => {
  assert.deepEqual(leseEinstufung("Ein Text ohne Einstufung."), { kritikalitaet: null, delegation: null });
});

test("REQ-29 GR-9.6: ohne Kritikalitaet wird als K3 behandelt", () => {
  assert.deepEqual(kritikalitaetMitRueckfall({ kritikalitaet: null, delegation: "S3" }), { stufe: "K3", ausRueckfall: true });
  assert.deepEqual(kritikalitaetMitRueckfall({ kritikalitaet: "K1", delegation: "S3" }), { stufe: "K1", ausRueckfall: false });
});

test("die Matrixobergrenze kommt aus rules/ks-matrix.yaml, nicht aus dem Code", () => {
  assert.equal(matrixObergrenze("K1"), "S4");
  assert.equal(matrixObergrenze("K2"), "S3");
  assert.equal(matrixObergrenze("K3"), "S2");
});

test("REQ-33 Abnahme 1: Reife drei und K1 ergeben S3", () => {
  const einstufung = leseEinstufung("K1 leicht, S3 Unterstuetzen");
  const { stufe } = kritikalitaetMitRueckfall(einstufung);
  const pruefung = bestimmeZulaessigeDelegation(einstufung.delegation!, 3, matrixObergrenze(stufe));
  assert.equal(pruefung.zulaessig, "S3");
  assert.equal(pruefung.akzeptiert, true);
});

test("REQ-33 Abnahme 3: eine ueberschreitende Angabe wird abgelehnt und nennt beide Grenzen", () => {
  const einstufung = leseEinstufung("K3 kritisch, S4 Delegieren");
  const { stufe } = kritikalitaetMitRueckfall(einstufung);
  const pruefung = bestimmeZulaessigeDelegation(einstufung.delegation!, 3, matrixObergrenze(stufe));
  assert.equal(pruefung.akzeptiert, false);
  const text = formatierePruefung(pruefung);
  assert.match(text, /S4 abgelehnt/);
  assert.match(text, /Delegationsreife erlaubt bis S3/);
  assert.match(text, /K-mal-S-Matrix erlaubt bis S2/);
  assert.match(text, /engere Grenze: K-mal-S-Matrix \(S2\)/);
});

test("ein Arbeitspaket ohne Kritikalitaet wird gegen die strengste Matrixgrenze geprueft", () => {
  const einstufung = leseEinstufung("S4 Delegieren, ohne Angabe der Kritikalitaet");
  const { stufe, ausRueckfall } = kritikalitaetMitRueckfall(einstufung);
  assert.equal(ausRueckfall, true);
  assert.equal(matrixObergrenze(stufe), "S2");
  assert.equal(bestimmeZulaessigeDelegation(einstufung.delegation!, 3, matrixObergrenze(stufe)).akzeptiert, false);
});
