import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump } from "js-yaml";
import { ermittleStufenBedingungenLokal, liesBetriebskennung, liesNotfaelleLokal, liesUrsachenLokal } from "../src/konsole/kennzahlen-lokal";
import { erzeugeUrsachendatei } from "../src/action/ursachendatei";

function neuesVerzeichnis(): string {
  return mkdtempSync(join(tmpdir(), "attesta-kennzahlen-lokal-"));
}

test("liesBetriebskennung liefert undefined, wenn die Datei fehlt", () => {
  const wurzel = neuesVerzeichnis();
  try {
    assert.equal(liesBetriebskennung(wurzel), undefined);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("liesUrsachenLokal liest alle YAML-Dateien aus attesta/ursachen", () => {
  const wurzel = neuesVerzeichnis();
  try {
    mkdirSync(join(wurzel, "attesta", "ursachen"), { recursive: true });
    const ursache = erzeugeUrsachendatei({ vorgang: "pr-1", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "a" });
    writeFileSync(join(wurzel, "attesta", "ursachen", "pr-1-a.yaml"), dump(ursache), "utf-8");
    const gelesen = liesUrsachenLokal(wurzel);
    assert.equal(gelesen.length, 1);
    assert.equal(gelesen[0].wert, "klarheit");
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("liesNotfaelleLokal liefert eine leere Liste ohne Verzeichnis", () => {
  const wurzel = neuesVerzeichnis();
  try {
    assert.deepEqual(liesNotfaelleLokal(wurzel), []);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("ermittleStufenBedingungenLokal: Stufe 2 ist lokal grundsaetzlich unerfuellt", () => {
  const wurzel = neuesVerzeichnis();
  try {
    const b = ermittleStufenBedingungenLokal(wurzel);
    assert.deepEqual(b.stufe2, { pruefungenVerbindlich: false, vierAugenBelegt: false, keinSelbstMerge: false });
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("ermittleStufenBedingungenLokal erkennt vorhandene lokale Dateien fuer Stufe 1 und 3", () => {
  const wurzel = neuesVerzeichnis();
  try {
    mkdirSync(join(wurzel, ".github", "workflows"), { recursive: true });
    mkdirSync(join(wurzel, "attesta"), { recursive: true });
    writeFileSync(join(wurzel, "attesta", "profil.lock"), "{}", "utf-8");
    writeFileSync(join(wurzel, "CLAUDE.md"), "#", "utf-8");
    const b = ermittleStufenBedingungenLokal(wurzel);
    assert.equal(b.stufe1.profilVorhanden, true);
    assert.equal(b.stufe3.leitplankenMaschinenlesbar, true);
    assert.equal(b.stufe3.gate3Durchlaufen, false);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});
