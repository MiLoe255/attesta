import { test } from "node:test";
import assert from "node:assert/strict";
import {
  berechneUebernahmequote,
  erzeugeUrsachendatei,
  istVorschlagbarerWert,
  istZulaessigerWert,
  pfadFuerUrsache,
} from "../src/action/ursachendatei";

test("REQ-27 GR-9.1: je Vorgang entsteht ein Pfad mit Kennung und Zeitpunkt", () => {
  const pfad = pfadFuerUrsache("pr-7", "2026-08-24T10:00:00.000Z");
  assert.equal(pfad, "attesta/ursachen/pr-7-2026-08-24T10-00-00-000Z.yaml");
});

test("REQ-27: die erzeugte Datei traegt Wert, Zeitpunkt, setzende Person", () => {
  const ursache = erzeugeUrsachendatei({
    vorgang: "pr-7",
    wert: "klarheit",
    zeitpunkt: new Date("2026-08-24T10:00:00.000Z"),
    gesetztVon: "reviewerin",
  });
  assert.equal(ursache.wert, "klarheit");
  assert.equal(ursache.gesetzt_von, "reviewerin");
  assert.equal(ursache.zeitpunkt, "2026-08-24T10:00:00.000Z");
  assert.equal(ursache.uebernommen, false);
});

test("uebernommen ist wahr, wenn Vorschlag und Wert uebereinstimmen", () => {
  const ursache = erzeugeUrsachendatei({
    vorgang: "pr-7",
    wert: "klarheit",
    zeitpunkt: new Date(),
    gesetztVon: "reviewerin",
    vorschlag: "klarheit",
  });
  assert.equal(ursache.uebernommen, true);
});

test("REQ-31: wollen entscheidet sich per Entscheidung vom 24.08.2026 fuer namentliche Zuordnung", () => {
  const ursache = erzeugeUrsachendatei({
    vorgang: "pr-7",
    wert: "wollen",
    zeitpunkt: new Date(),
    gesetztVon: "reviewerin",
  });
  assert.equal(ursache.gesetzt_von, "reviewerin");
});

test("istZulaessigerWert erkennt alle sieben Werte und lehnt Unbekanntes ab", () => {
  for (const wert of ["klarheit", "komplexitaet", "koennen", "kontrolle", "konsequenz", "wollen", "werkzeugfehler"]) {
    assert.equal(istZulaessigerWert(wert), true);
  }
  assert.equal(istZulaessigerWert("erfunden"), false);
});

test("istVorschlagbarerWert lehnt wollen ab, akzeptiert die uebrigen sechs", () => {
  assert.equal(istVorschlagbarerWert("wollen"), false);
  assert.equal(istVorschlagbarerWert("klarheit"), true);
});

test("REQ-30 GR-9.5: die Uebernahmequote zaehlt nur Eintraege mit Vorschlag", () => {
  const basis = { vorgang: "p", zeitpunkt: new Date(), gesetztVon: "x" } as const;
  const ursachen = [
    erzeugeUrsachendatei({ ...basis, wert: "klarheit", vorschlag: "klarheit" }),
    erzeugeUrsachendatei({ ...basis, wert: "kontrolle", vorschlag: "klarheit" }),
    erzeugeUrsachendatei({ ...basis, wert: "wollen" }),
  ];
  assert.equal(berechneUebernahmequote(ursachen), 0.5);
});

test("die Uebernahmequote ist null ohne einen einzigen Vorschlag", () => {
  const ursache = erzeugeUrsachendatei({ vorgang: "p", wert: "wollen", zeitpunkt: new Date(), gesetztVon: "x" });
  assert.equal(berechneUebernahmequote([ursache]), null);
});
