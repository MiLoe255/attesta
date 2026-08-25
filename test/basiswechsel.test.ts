import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump, load } from "js-yaml";
import { fuehreInitAus, initBefehl } from "../src/konsole/init";
import { listeBasiswechsel, vergleicheProfilVerzeichnis, type Lock } from "../src/gemeinsam/profilvergleich";
import { ladeProfilBasis } from "../src/gemeinsam/regelsatz";

function neuesTestverzeichnis(): string {
  return mkdtempSync(join(tmpdir(), "attesta-basiswechsel-test-"));
}

/** Setzt in profil.lock eine falsche Pruefsumme, damit eine echte Abweichung entsteht. */
function verfaelscheLock(wurzel: string, dateiname: string): void {
  const lockPfad = join(wurzel, "attesta", "profil.lock");
  const lock = load(readFileSync(lockPfad, "utf-8")) as Lock;
  lock[dateiname] = { ...lock[dateiname], pruefsumme: "sha256:veraltet", basisversion: "0.9.0" };
  writeFileSync(lockPfad, dump(lock, { lineWidth: -1 }), "utf-8");
}

test("listeBasiswechsel meldet ohne Abweichung fuer jede Datei aendertSich false", () => {
  const wurzel = neuesTestverzeichnis();
  try {
    fuehreInitAus(wurzel);
    const eintraege = listeBasiswechsel(join(wurzel, "attesta", "profil.lock"), ladeProfilBasis());
    assert.equal(eintraege.length, 3);
    assert.ok(eintraege.every((e) => e.aendertSich === false));
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("listeBasiswechsel meldet eine verfaelschte Datei als aendertSich, die uebrigen nicht", () => {
  const wurzel = neuesTestverzeichnis();
  try {
    fuehreInitAus(wurzel);
    verfaelscheLock(wurzel, "wortlisten.yaml");
    const eintraege = listeBasiswechsel(join(wurzel, "attesta", "profil.lock"), ladeProfilBasis());
    const betroffen = eintraege.filter((e) => e.aendertSich);
    assert.equal(betroffen.length, 1);
    assert.equal(betroffen[0].dateiname, "wortlisten.yaml");
    assert.equal(betroffen[0].altePruefsumme, "sha256:veraltet");
    assert.equal(betroffen[0].alteBasisversion, "0.9.0");
    assert.notEqual(betroffen[0].neuePruefsumme, "sha256:veraltet");
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("REQ-10 Abnahme 1: init --ueberschreiben zeigt je Abweichung Datei, alten und neuen Wert", (t) => {
  const wurzel = neuesTestverzeichnis();
  const cwd = process.cwd();
  try {
    fuehreInitAus(wurzel);
    verfaelscheLock(wurzel, "wortlisten.yaml");

    process.chdir(wurzel);
    const zeilen: string[] = [];
    t.mock.method(console, "log", (zeile: string) => zeilen.push(zeile));
    assert.equal(initBefehl.fuehreAus(["--ueberschreiben"]), 0);
    t.mock.restoreAll();

    const ausgabe = zeilen.join("\n");
    assert.match(ausgabe, /Basiswechsel: 1 Abweichung/);
    assert.match(ausgabe, /wortlisten\.yaml/);
    assert.match(ausgabe, /alt: Basis 0\.9\.0, sha256:veraltet/);
    assert.match(ausgabe, /neu: Basis \d+\.\d+\.\d+, sha256:[0-9a-f]{64}/);
  } finally {
    t.mock.restoreAll();
    process.chdir(cwd);
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("ohne Abweichung sagt init --ueberschreiben das ausdruecklich", (t) => {
  const wurzel = neuesTestverzeichnis();
  const cwd = process.cwd();
  try {
    fuehreInitAus(wurzel);
    process.chdir(wurzel);
    const zeilen: string[] = [];
    t.mock.method(console, "log", (zeile: string) => zeilen.push(zeile));
    initBefehl.fuehreAus(["--ueberschreiben"]);
    t.mock.restoreAll();
    assert.match(zeilen.join("\n"), /keine Abweichung/);
  } finally {
    t.mock.restoreAll();
    process.chdir(cwd);
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("REQ-10 Abnahme 2: ohne --ueberschreiben wird nichts gezeigt und nichts geschrieben", (t) => {
  const wurzel = neuesTestverzeichnis();
  const cwd = process.cwd();
  try {
    fuehreInitAus(wurzel);
    verfaelscheLock(wurzel, "wortlisten.yaml");
    const lockVorher = readFileSync(join(wurzel, "attesta", "profil.lock"), "utf-8");

    process.chdir(wurzel);
    const zeilen: string[] = [];
    t.mock.method(console, "log", (zeile: string) => zeilen.push(zeile));
    assert.throws(() => initBefehl.fuehreAus([]));
    t.mock.restoreAll();

    assert.doesNotMatch(zeilen.join("\n"), /Basiswechsel/);
    assert.equal(readFileSync(join(wurzel, "attesta", "profil.lock"), "utf-8"), lockVorher);
  } finally {
    t.mock.restoreAll();
    process.chdir(cwd);
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("Live-Fund: ein frisch angelegtes Profil ist deckungsgleich, nicht abgewichen", () => {
  const wurzel = neuesTestverzeichnis();
  try {
    fuehreInitAus(wurzel);
    const befunde = vergleicheProfilVerzeichnis(join(wurzel, "attesta", "profil"), join(wurzel, "attesta", "profil.lock"), ladeProfilBasis());
    assert.equal(befunde.length, 3);
    for (const befund of befunde) {
      assert.equal(befund.zustand, "deckungsgleich", `${befund.dateiname} sollte unveraendert deckungsgleich sein`);
    }
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

test("eine vom Kunden geaenderte Profildatei wird als abgewichen gemeldet", () => {
  const wurzel = neuesTestverzeichnis();
  try {
    fuehreInitAus(wurzel);
    const datei = join(wurzel, "attesta", "profil", "wortlisten.yaml");
    writeFileSync(datei, readFileSync(datei, "utf-8").replace("- kennung: reviewer", "- kennung: reviewer\n    zusatz: geaendert"), "utf-8");
    const befunde = vergleicheProfilVerzeichnis(join(wurzel, "attesta", "profil"), join(wurzel, "attesta", "profil.lock"), ladeProfilBasis());
    const wortlisten = befunde.find((b) => b.dateiname === "wortlisten.yaml");
    assert.notEqual(wortlisten?.zustand, "deckungsgleich");
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});
