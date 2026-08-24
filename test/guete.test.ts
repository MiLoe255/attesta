import { test } from "node:test";
import assert from "node:assert/strict";
import { pruefeAnforderung, type GueteRegelsatz } from "../src/gemeinsam/guete";

const REGELSATZ: GueteRegelsatz = {
  rollen: ["Reviewer", "Entwicklung"],
  unschaerfe: [
    { wort: "schnell", stufe: "verstoss" },
    { wort: "angemessen", stufe: "warnung" },
  ],
  technologien: ["github"],
};

function findePruefung(ergebnis: ReturnType<typeof pruefeAnforderung>, name: string) {
  return ergebnis.pruefungen.find((p) => p.pruefung === name);
}

test("REQ-24 GR-8.1: liefert sechs Pruefungen in fester Reihenfolge", () => {
  const ergebnis = pruefeAnforderung("Der Reviewer muss binnen 60 Sekunden pruefen. K2, S2.", REGELSATZ);
  assert.equal(ergebnis.pruefungen.length, 6);
  assert.deepEqual(
    ergebnis.pruefungen.map((p) => p.pruefung),
    ["Modalverb", "benannter Akteur", "messbares Abnahmekriterium", "kein Unschaerfewort", "keine Technologievorgabe", "Pflichtfelder gefuellt"]
  );
});

test("eine vollstaendig konforme Anforderung ist gesamt erfuellt", () => {
  const ergebnis = pruefeAnforderung("Der Reviewer muss binnen 60 Sekunden pruefen. K2, S2.", REGELSATZ);
  assert.equal(ergebnis.gesamt, "erfuellt");
});

test("REQ-24 GR-8.2: kein Modalverb und mehr als eines fuehren beide zu verletzt", () => {
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer prueft binnen 60 Sekunden. K2, S2.", REGELSATZ), "Modalverb")?.zustand, "verletzt");
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer muss und soll binnen 60 Sekunden pruefen. K2, S2.", REGELSATZ), "Modalverb")?.zustand, "verletzt");
});

test("ein fehlender Akteur aus rollen.yaml fuehrt zu verletzt", () => {
  const befund = findePruefung(pruefeAnforderung("Es muss binnen 60 Sekunden geprueft werden. K2, S2.", REGELSATZ), "benannter Akteur");
  assert.equal(befund?.zustand, "verletzt");
});

test("REQ-24 GR-8.3: eine Zahl mit Einheit oder ein Vergleichsoperator erfuellt die Messbarkeit", () => {
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer muss in unter 200 ms antworten. K2, S2.", REGELSATZ), "messbares Abnahmekriterium")?.zustand, "erfuellt");
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer muss mindestens einmal pruefen. K2, S2.", REGELSATZ), "messbares Abnahmekriterium")?.zustand, "erfuellt");
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer muss gut pruefen. K2, S2.", REGELSATZ), "messbares Abnahmekriterium")?.zustand, "verletzt");
});

test("REQ-24: ein Verstoss-Unschaerfewort (auch als Wortstamm) fuehrt zu verletzt", () => {
  const befund = findePruefung(pruefeAnforderung("Der Reviewer muss schnelle Rueckmeldung geben. K2, S2.", REGELSATZ), "kein Unschaerfewort");
  assert.equal(befund?.zustand, "verletzt");
  assert.match(befund?.details ?? "", /schnell/);
});

test("REQ-24: ein Warnung-Unschaerfewort fuehrt zu warnung, nicht zu verletzt", () => {
  const befund = findePruefung(pruefeAnforderung("Der Reviewer muss angemessen reagieren. K2, S2.", REGELSATZ), "kein Unschaerfewort");
  assert.equal(befund?.zustand, "warnung");
});

test("GR-8.4: eine Technologienennung fuehrt zu warnung, nie zu verletzt", () => {
  const ergebnis = pruefeAnforderung("Der Reviewer muss GitHub-Kommentare binnen 60 Sekunden pruefen. K2, S2.", REGELSATZ);
  const befund = findePruefung(ergebnis, "keine Technologievorgabe");
  assert.equal(befund?.zustand, "warnung");
  assert.notEqual(ergebnis.gesamt, "verletzt");
});

test("Pflichtfelder: K und S muessen beide vorkommen", () => {
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer muss binnen 60 Sekunden pruefen. K2.", REGELSATZ), "Pflichtfelder gefuellt")?.zustand, "verletzt");
  assert.equal(findePruefung(pruefeAnforderung("Der Reviewer muss binnen 60 Sekunden pruefen. S2.", REGELSATZ), "Pflichtfelder gefuellt")?.zustand, "verletzt");
});

test("das Gesamtergebnis ist der schlechteste Einzelbefund", () => {
  // kein Modalverb (verletzt) + Technologienennung (warnung) -> gesamt verletzt
  const ergebnis = pruefeAnforderung("Der Reviewer prueft GitHub-Kommentare in unter 60 ms. K2, S2.", REGELSATZ);
  assert.equal(ergebnis.gesamt, "verletzt");
});

test("Dogfooding-Fund: die K/P-Zeile \"K2 - Muss\" zaehlt nicht als zweites Modalverb", () => {
  const text = "> Der Reviewer muss binnen 60 Sekunden pruefen.\n\nK2 - Muss - haengt an keiner";
  assert.equal(findePruefung(pruefeAnforderung(text, REGELSATZ), "Modalverb")?.zustand, "erfuellt");
});

test("REQ-24 GR-8.2: zwei Laeufe ueber denselben Text liefern dasselbe Ergebnis", () => {
  const text = "Der Reviewer muss binnen 60 Sekunden pruefen. K2, S2.";
  assert.deepEqual(pruefeAnforderung(text, REGELSATZ), pruefeAnforderung(text, REGELSATZ));
});
