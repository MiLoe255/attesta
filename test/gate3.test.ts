import { test } from "node:test";
import assert from "node:assert/strict";
import { erzeugeGate3Attest, istGate3Befehl, leseBegruendung } from "../src/action/gate3";

test("erkennt /attesta gate3 bestanden mit Begruendung", () => {
  assert.equal(istGate3Befehl("/attesta gate3 bestanden Pipeline laeuft seit drei Wochen gruen"), true);
  assert.equal(istGate3Befehl("/attesta gate3 bestanden"), false);
  assert.equal(istGate3Befehl("/attesta notfall"), false);
});

test("leseBegruendung liefert den Text nach \"bestanden\"", () => {
  assert.equal(leseBegruendung("/attesta gate3 bestanden Pipeline laeuft gruen"), "Pipeline laeuft gruen");
});

test("Fehlerverhalten: eine fehlende Begruendung liefert null statt eines leeren Strings", () => {
  assert.equal(leseBegruendung("/attesta gate3 bestanden"), null);
  assert.equal(leseBegruendung("/attesta gate3 bestanden   "), null);
});

test("erzeugeGate3Attest traegt Person, Zeitpunkt und Begruendung", () => {
  const attest = erzeugeGate3Attest({ bestaetigtVon: "reviewerin", datum: new Date("2026-08-24T10:00:00.000Z"), begruendung: "Pipeline gruen" });
  assert.deepEqual(attest, { bestaetigt_von: "reviewerin", datum: "2026-08-24T10:00:00.000Z", begruendung: "Pipeline gruen" });
});
