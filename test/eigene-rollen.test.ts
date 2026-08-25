import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EIGENE_ROLLEN_PFAD, EIGENE_ROLLEN_VORLAGE, leseEigeneRollen } from "../src/gemeinsam/eigene-rollen";
import { pruefeAnforderungMitRegelsatz } from "../src/gemeinsam/guete";

function mitDatei(inhalt: string | null, pruefung: (wurzel: string) => void): void {
  const wurzel = mkdtempSync(join(tmpdir(), "attesta-eigene-rollen-"));
  try {
    if (inhalt !== null) {
      mkdirSync(join(wurzel, "attesta"), { recursive: true });
      writeFileSync(join(wurzel, ...EIGENE_ROLLEN_PFAD.split("/")), inhalt, "utf-8");
    }
    pruefung(wurzel);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
}

const GUELTIG = `rollen:
  - kennung: produktionsleiter
    anzeigename: "Produktionsleiter"
    definition: "verantwortet die laufende Fertigung und den Ausschuss einer Schicht"
`;

test("ohne Datei gibt es weder eigene Rollen noch Befunde", () => {
  mitDatei(null, (wurzel) => assert.deepEqual(leseEigeneRollen(wurzel), { rollen: [], befunde: [] }));
});

test("die von init angelegte Vorlage ist gueltig und noch leer", () => {
  mitDatei(EIGENE_ROLLEN_VORLAGE, (wurzel) => assert.deepEqual(leseEigeneRollen(wurzel), { rollen: [], befunde: [] }));
});

test("eine gueltige eigene Rolle wird uebernommen", () => {
  mitDatei(GUELTIG, (wurzel) => assert.deepEqual(leseEigeneRollen(wurzel).rollen, ["Produktionsleiter"]));
});

test("REQ-14 erweitert: eine Anforderung mit eigener Rolle besteht die Akteurspruefung", () => {
  mitDatei(GUELTIG, (wurzel) => {
    const text = "> Das System muss den Produktionsleiter binnen 60 Sekunden alarmieren.\n\nK2, S2";
    const ohne = pruefeAnforderungMitRegelsatz(text);
    const mit = pruefeAnforderungMitRegelsatz(text, leseEigeneRollen(wurzel).rollen);
    assert.equal(ohne.pruefungen.find((p) => p.pruefung === "benannter Akteur")?.zustand, "verletzt");
    assert.equal(mit.pruefungen.find((p) => p.pruefung === "benannter Akteur")?.zustand, "erfuellt");
    assert.equal(mit.gesamt, "erfuellt");
  });
});

test("eine Kennung aus dem Grundbestand wird nicht ueberschrieben", () => {
  const kollision = `rollen:
  - kennung: reviewer
    anzeigename: "Pruefinstanz"
    definition: "soll den Grundbestand ueberschreiben und darf das nicht"
`;
  mitDatei(kollision, (wurzel) => {
    const ergebnis = leseEigeneRollen(wurzel);
    assert.deepEqual(ergebnis.rollen, []);
    assert.match(ergebnis.befunde[0], /gehoert bereits zum Grundbestand/);
  });
});

test("eine zu kurze Definition wird benannt und der Eintrag verworfen", () => {
  const kurz = `rollen:
  - kennung: schichtleitung
    anzeigename: "Schichtleitung"
    definition: "leitet die Schicht"
`;
  mitDatei(kurz, (wurzel) => {
    const ergebnis = leseEigeneRollen(wurzel);
    assert.deepEqual(ergebnis.rollen, []);
    assert.match(ergebnis.befunde[0], /weniger als 5 Woerter/);
  });
});

test("ein Tippfehler in der Kundendatei haelt die Pruefung nicht an", () => {
  mitDatei("rollen: [ das ist kein gueltiges yaml", (wurzel) => {
    const ergebnis = leseEigeneRollen(wurzel);
    assert.deepEqual(ergebnis.rollen, []);
    assert.equal(ergebnis.befunde.length, 1);
    // Der Grundbestand gilt weiter, die Pruefung laeuft.
    assert.equal(pruefeAnforderungMitRegelsatz("> Der Reviewer muss binnen 60 Sekunden pruefen. K2, S2", ergebnis.rollen).gesamt, "erfuellt");
  });
});

test("doppelte Kennungen in der Datei werden gemeldet, die erste zaehlt", () => {
  const doppelt = `rollen:
  - kennung: schichtleitung
    anzeigename: "Schichtleitung"
    definition: "leitet eine Schicht und verantwortet deren Ergebnis"
  - kennung: schichtleitung
    anzeigename: "Schichtfuehrung"
    definition: "dieselbe Kennung ein zweites Mal, das ist ein Fehler"
`;
  mitDatei(doppelt, (wurzel) => {
    const ergebnis = leseEigeneRollen(wurzel);
    assert.deepEqual(ergebnis.rollen, ["Schichtleitung"]);
    assert.match(ergebnis.befunde[0], /mehrfach/);
  });
});
