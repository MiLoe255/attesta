import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { erhebeErgaenzungen, dateiname } from "../src/gemeinsam/ergaenzungen";
import { erzeugeBerichtsinhalt } from "../src/action/bericht";

function wurzelMit(inhalt?: string): string {
  const wurzel = mkdtempSync(join(tmpdir(), "attesta-erg-"));
  mkdirSync(join(wurzel, "attesta"), { recursive: true });
  if (inhalt !== undefined) writeFileSync(join(wurzel, "attesta", "rollen-eigene.yaml"), inhalt, "utf-8");
  return wurzel;
}

test("Namenskonvention: attesta/<gegenstand>-eigene.yaml", () => {
  assert.equal(dateiname("rollen"), "attesta/rollen-eigene.yaml");
});

test("eine fehlende Ergaenzungsdatei ist kein Befund", () => {
  assert.deepEqual(erhebeErgaenzungen(wurzelMit()), []);
});

test("vorhandene Eintraege werden gezaehlt", () => {
  const wurzel = wurzelMit('rollen:\n  - kennung: schichtleitung\n    anzeigename: "Schichtleitung"\n    definition: "fuehrt die Schicht und gibt Arbeit frei"\n');
  const [befund] = erhebeErgaenzungen(wurzel);
  assert.equal(befund?.zustand, "vorhanden");
  assert.equal(befund?.eintraege, 1);
});

test("eine Datei ohne Eintraege gilt als leer, nicht als fehlend", () => {
  const [befund] = erhebeErgaenzungen(wurzelMit("rollen: []\n"));
  assert.equal(befund?.zustand, "leer");
  assert.equal(befund?.eintraege, 0);
});

test("unlesbares YAML haelt nichts an, es wird als unlesbar gemeldet", () => {
  const [befund] = erhebeErgaenzungen(wurzelMit("rollen:\n  - [unausgeglichen\n"));
  assert.equal(befund?.zustand, "unlesbar");
});

test("der Bericht fuehrt Ergaenzungen unter dem Profil auf", () => {
  const inhalt = erzeugeBerichtsinhalt({
    monat: "2026-08", ursachen: [], notfaelle: [], profilBefunde: [],
    ergaenzungen: [{ gegenstand: "rollen", dateiname: "attesta/rollen-eigene.yaml", zustand: "vorhanden", eintraege: 2 }],
    jetzt: new Date("2026-08-26T00:00:00Z"),
  });
  assert.match(inhalt, /Ergaenzungen ausserhalb des Profils/);
  assert.match(inhalt, /attesta\/rollen-eigene\.yaml \| vorhanden \| 2/);
});

test("ohne Ergaenzungen sagt der Bericht das ausdruecklich", () => {
  const inhalt = erzeugeBerichtsinhalt({
    monat: "2026-08", ursachen: [], notfaelle: [], profilBefunde: [], ergaenzungen: [],
    jetzt: new Date("2026-08-26T00:00:00Z"),
  });
  assert.match(inhalt, /Ergaenzungen ausserhalb des Profils: keine\./);
});

test("GR-12.1: es bleiben genau sieben Abschnitte", () => {
  const inhalt = erzeugeBerichtsinhalt({
    monat: "2026-08", ursachen: [], notfaelle: [], profilBefunde: [],
    ergaenzungen: [{ gegenstand: "rollen", dateiname: "attesta/rollen-eigene.yaml", zustand: "vorhanden", eintraege: 1 }],
    jetzt: new Date("2026-08-26T00:00:00Z"),
  });
  assert.equal((inhalt.match(/^## /gm) ?? []).length, 7);
});
