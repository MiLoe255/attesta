import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";
import { fuehreInitAus } from "../src/konsole/init";
import { KonsoleFehler } from "../src/gemeinsam/fehler";
import { PROFIL_DATEINAMEN } from "../src/gemeinsam/regelsatz";

function neuesTestverzeichnis(): string {
  return mkdtempSync(join(tmpdir(), "attesta-init-test-"));
}

test("init schreibt genau drei Profildateien mit Kopfzeile aus Version und Pruefsumme", () => {
  const ziel = neuesTestverzeichnis();
  try {
    const ergebnis = fuehreInitAus(ziel, { jetzt: () => "2026-01-01T00:00:00.000Z" });
    assert.equal(ergebnis.geschriebeneDateien.length, PROFIL_DATEINAMEN.length);
    for (const dateiname of PROFIL_DATEINAMEN) {
      const inhalt = readFileSync(join(ergebnis.profilVerzeichnis, dateiname), "utf-8");
      assert.match(inhalt, /^# Urheber: PROSTRUCTIVE/);
      assert.match(inhalt, /^# Lizenz: PolyForm-Internal-Use-1\.0\.0$/m);
      assert.match(inhalt, /^# Herkunft: \d+\.\d+\.\d+$/m);
      assert.match(inhalt, /^# Pruefsumme: sha256:[0-9a-f]{64}$/m);
    }
    const lock = load(readFileSync(ergebnis.lockPfad, "utf-8")) as Record<string, { pruefsumme: string; basisversion: string }>;
    for (const dateiname of PROFIL_DATEINAMEN) {
      assert.ok(lock[dateiname].pruefsumme.startsWith("sha256:"));
      assert.ok(lock[dateiname].basisversion);
    }
  } finally {
    rmSync(ziel, { recursive: true, force: true });
  }
});

test("init bricht ohne --ueberschreiben ab, wenn das Profil schon existiert", () => {
  const ziel = neuesTestverzeichnis();
  try {
    fuehreInitAus(ziel);
    assert.throws(() => fuehreInitAus(ziel), (e: unknown) => e instanceof KonsoleFehler && e.rueckgabewert === 1);
  } finally {
    rmSync(ziel, { recursive: true, force: true });
  }
});

test("init mit --ueberschreiben schreibt erneut", () => {
  const ziel = neuesTestverzeichnis();
  try {
    fuehreInitAus(ziel);
    assert.doesNotThrow(() => fuehreInitAus(ziel, { ueberschreiben: true }));
  } finally {
    rmSync(ziel, { recursive: true, force: true });
  }
});
