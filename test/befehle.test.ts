import { test } from "node:test";
import assert from "node:assert/strict";
import { istUrsachenBefehl, werteBefehlAus } from "../src/action/befehle";

test("REQ-21: /attesta ursache klarheit erzeugt denselben Eintrag wie das Ankreuzfeld", () => {
  assert.equal(istUrsachenBefehl("/attesta ursache klarheit"), true);
  assert.deepEqual(werteBefehlAus("/attesta ursache klarheit"), { art: "eintrag", kennung: "klarheit" });
});

test("ein unbekannter Wert meldet die Liste der sieben zulaessigen Werte", () => {
  const ergebnis = werteBefehlAus("/attesta ursache erfunden");
  assert.equal(ergebnis.art, "unbekannter_wert");
  if (ergebnis.art === "unbekannter_wert") {
    assert.equal(ergebnis.wert, "erfunden");
    assert.equal(ergebnis.zulaessig.length, 7);
  }
});

test("kein Ursachenbefehl liefert kein_eintrag", () => {
  assert.deepEqual(werteBefehlAus("irgendein Kommentar"), { art: "kein_eintrag" });
  assert.equal(istUrsachenBefehl("irgendein Kommentar"), false);
});
