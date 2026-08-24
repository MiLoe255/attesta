import { test } from "node:test";
import assert from "node:assert/strict";
import { formatiereAnkreuzfelder, leseGesetzteKennungen, werteAnkreuzfelderAus } from "../src/action/ankreuzfelder";
import { URSACHEN } from "../src/gemeinsam/ursachen.generated";

test("REQ-20: der feste Kommentar traegt sieben Ankreuzfelder in der Reihenfolge von ursachen.yaml", () => {
  const text = formatiereAnkreuzfelder();
  const zeilen = text.split("\n");
  assert.equal(zeilen.length, 7);
  URSACHEN.forEach((ursache, i) => {
    assert.match(zeilen[i], new RegExp(`^- \\[ \\] ${ursache.label}:`));
  });
});

test("kein Feld gesetzt liefert kein_eintrag", () => {
  const ergebnis = werteAnkreuzfelderAus(formatiereAnkreuzfelder());
  assert.deepEqual(ergebnis, { art: "kein_eintrag" });
});

test("genau ein gesetztes Feld liefert einen Eintrag", () => {
  const text = formatiereAnkreuzfelder().replace("- [ ] Klarheit:", "- [x] Klarheit:");
  assert.deepEqual(leseGesetzteKennungen(text), ["klarheit"]);
  assert.deepEqual(werteAnkreuzfelderAus(text), { art: "eintrag", kennung: "klarheit" });
});

test("zwei gesetzte Felder liefern eine Rueckfrage und keinen Eintrag", () => {
  const text = formatiereAnkreuzfelder()
    .replace("- [ ] Klarheit:", "- [x] Klarheit:")
    .replace("- [ ] Kontrolle:", "- [X] Kontrolle:");
  const ergebnis = werteAnkreuzfelderAus(text);
  assert.equal(ergebnis.art, "rueckfrage");
  if (ergebnis.art === "rueckfrage") {
    assert.deepEqual(ergebnis.kandidaten, ["klarheit", "kontrolle"]);
  }
});
