import { test } from "node:test";
import assert from "node:assert/strict";
import { erzeugeKennzahlenDatensatz } from "../src/gemeinsam/kennzahlen";
import { erzeugeUrsachendatei } from "../src/action/ursachendatei";
import { erzeugeNotfall } from "../src/action/notfall";
import type { StufenBedingungen } from "../src/gemeinsam/delegationsreife";

const KEINE_BEDINGUNGEN: StufenBedingungen = {
  stufe1: { profilVorhanden: false, issueFormularVorhanden: false },
  stufe2: { pruefungenVerbindlich: false, vierAugenBelegt: false, keinSelbstMerge: false },
  stufe3: { leitplankenMaschinenlesbar: false, gate3Durchlaufen: false },
  stufe4: { historieNachgewiesen: false },
};

test("REQ-41 GR-13.3: der Datensatz enthaelt ausschliesslich Zahlen und Text, kein Freitextfeld", () => {
  const datensatz = erzeugeKennzahlenDatensatz({ betriebskennung: "abc-123", ursachen: [], notfaelle: [], stufenBedingungen: KEINE_BEDINGUNGEN });
  assert.equal(typeof datensatz.betriebskennung, "string");
  assert.equal(typeof datensatz.arbeitspakete, "number");
  assert.equal(typeof datensatz.nachweisgrad, "number");
  assert.equal(typeof datensatz.delegationsreife, "number");
  assert.equal(typeof datensatz.notfaelle, "number");
  assert.equal(Object.keys(datensatz.ursachenverteilung).length, 7);
});

test("GR-13.4: der Datensatz enthaelt keinen Repositoriumsnamen und keine Personenkennung", () => {
  const ursache = erzeugeUrsachendatei({ vorgang: "pr-7", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "eine-person" });
  const datensatz = erzeugeKennzahlenDatensatz({ betriebskennung: "abc-123", ursachen: [ursache], notfaelle: [], stufenBedingungen: KEINE_BEDINGUNGEN });
  const alsText = JSON.stringify(datensatz);
  assert.doesNotMatch(alsText, /eine-person/);
  assert.doesNotMatch(alsText, /pr-7/);
});

test("die Ursachenverteilung zaehlt reale Eintraege je Wert", () => {
  const ursachen = [
    erzeugeUrsachendatei({ vorgang: "pr-1", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "a" }),
    erzeugeUrsachendatei({ vorgang: "pr-2", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "b" }),
    erzeugeUrsachendatei({ vorgang: "pr-3", wert: "wollen", zeitpunkt: new Date(), gesetztVon: "c" }),
  ];
  const datensatz = erzeugeKennzahlenDatensatz({ betriebskennung: "x", ursachen, notfaelle: [], stufenBedingungen: KEINE_BEDINGUNGEN });
  assert.equal(datensatz.ursachenverteilung.klarheit, 2);
  assert.equal(datensatz.ursachenverteilung.wollen, 1);
  assert.equal(datensatz.arbeitspakete, 3);
});

test("die Notfallzahl zaehlt reale Eintraege", () => {
  const notfaelle = [erzeugeNotfall({ ausgerufenVon: "a", ausgerufenAm: new Date(), pullRequest: 1 })];
  const datensatz = erzeugeKennzahlenDatensatz({ betriebskennung: "x", ursachen: [], notfaelle, stufenBedingungen: KEINE_BEDINGUNGEN });
  assert.equal(datensatz.notfaelle, 1);
});

test("die Delegationsreife wird aus den uebergebenen Bedingungen bestimmt", () => {
  const stufe1: StufenBedingungen = { ...KEINE_BEDINGUNGEN, stufe1: { profilVorhanden: true, issueFormularVorhanden: true } };
  const datensatz = erzeugeKennzahlenDatensatz({ betriebskennung: "x", ursachen: [], notfaelle: [], stufenBedingungen: stufe1 });
  assert.equal(datensatz.delegationsreife, 1);
});
