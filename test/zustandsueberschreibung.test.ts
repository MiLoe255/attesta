import { test } from "node:test";
import assert from "node:assert/strict";
import { wendeUeberschreibungenAn } from "../src/action/zustandsueberschreibung";

test("REQ-22: ein aktiver Notfall erzwingt neutral, auch wenn die Pruefung erfolg ergaebe", () => {
  assert.equal(wendeUeberschreibungenAn("erfolg", { notfallAktiv: true, beobachtungsmodus: false }), "neutral");
});

test("REQ-22: ein aktiver Notfall erzwingt neutral, auch wenn die Pruefung fehlschlag ergaebe", () => {
  assert.equal(wendeUeberschreibungenAn("fehlschlag", { notfallAktiv: true, beobachtungsmodus: false }), "neutral");
});

test("REQ-23: der Beobachtungsmodus haelt jeden Check-Run auf neutral", () => {
  for (const roh of ["erfolg", "fehlschlag", "neutral", "unbekannt"] as const) {
    assert.equal(wendeUeberschreibungenAn(roh, { notfallAktiv: false, beobachtungsmodus: true }), "neutral");
  }
});

test("ohne Notfall und ohne Beobachtungsmodus bleibt der rohe Zustand unveraendert", () => {
  assert.equal(wendeUeberschreibungenAn("fehlschlag", { notfallAktiv: false, beobachtungsmodus: false }), "fehlschlag");
  assert.equal(wendeUeberschreibungenAn("erfolg", { notfallAktiv: false, beobachtungsmodus: false }), "erfolg");
});
