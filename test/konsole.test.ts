import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import { initBefehl } from "../src/konsole/init";
import { pruefenBefehl } from "../src/konsole/pruefen";
import { gueteBefehl } from "../src/konsole/guete";
import { kennzahlenBefehl } from "../src/konsole/kennzahlen";
import { fuehreAus } from "../src/konsole/index";
import { formatiereBefund } from "../src/gemeinsam/meldung";

const BEFEHLE = [initBefehl, pruefenBefehl, gueteBefehl, kennzahlenBefehl];

test("REQ-11: jeder Befehl gibt bei --help Eingabe und Ausgabe aus", (t) => {
  for (const befehl of BEFEHLE) {
    const zeilen: string[] = [];
    t.mock.method(console, "log", (zeile: string) => zeilen.push(zeile));
    befehl.hilfe();
    t.mock.restoreAll();
    const text = zeilen.join("\n");
    assert.match(text, /Eingabe/);
    assert.match(text, /Ausgabe/);
  }
});

test("REQ-12: init, pruefen und guete oeffnen keine Netzverbindung", async (t) => {
  let netzAufrufe = 0;
  const zaehle = () => {
    netzAufrufe++;
    throw new Error("Netzaufruf waere hier erfolgt");
  };
  t.mock.method(net.Socket.prototype, "connect", zaehle);
  t.mock.method(http, "request", zaehle);
  t.mock.method(https, "request", zaehle);

  const ziel = mkdtempSync(join(tmpdir(), "attesta-netz-test-"));
  try {
    const zeilen: string[] = [];
    t.mock.method(console, "log", (zeile: string) => zeilen.push(zeile));
    const cwd = process.cwd();
    process.chdir(ziel);
    try {
      writeFileSync("anforderung.md", "> Der Reviewer muss binnen 60 Sekunden pruefen. K2, S2.\n", "utf-8");
      assert.doesNotThrow(() => initBefehl.fuehreAus([]));
      assert.doesNotThrow(() => pruefenBefehl.fuehreAus(["."]));
      assert.doesNotThrow(() => gueteBefehl.fuehreAus(["anforderung.md"]));
    } finally {
      process.chdir(cwd);
    }
  } finally {
    t.mock.restoreAll();
    rmSync(ziel, { recursive: true, force: true });
  }
  assert.equal(netzAufrufe, 0);
});

test("REQ-13: die Meldungsform nennt Regelsatzdatei und Regel", () => {
  const meldung = formatiereBefund({ regelsatzdatei: "unschaerfe.yaml", regel: "Wort: angemessen" });
  assert.match(meldung, /unschaerfe\.yaml/);
  assert.match(meldung, /Wort: angemessen/);
});

test("REQ-11: unbekannter Befehl liefert Rueckgabewert 2", (t) => {
  t.mock.method(console, "error", () => {});
  assert.equal(fuehreAus(["nixda"]), 2);
  t.mock.restoreAll();
});

test("REQ-11: --help auf einen bekannten Befehl liefert Rueckgabewert 0", (t) => {
  t.mock.method(console, "log", () => {});
  assert.equal(fuehreAus(["pruefen", "--help"]), 0);
  t.mock.restoreAll();
});
