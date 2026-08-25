import { test } from "node:test";
import assert from "node:assert/strict";
import { erzeugeBerichtsinhalt } from "../src/action/bericht";
import { erzeugeUrsachendatei } from "../src/action/ursachendatei";
import { erzeugeNotfall } from "../src/action/notfall";

const LEER: Parameters<typeof erzeugeBerichtsinhalt>[0] = {
  monat: "2026-08",
  ursachen: [],
  notfaelle: [],
  profilBefunde: [],
  jetzt: new Date("2026-08-24T00:00:00.000Z"),
};

test("REQ-36 GR-12.1: der Bericht enthaelt genau sieben Abschnitte in fester Reihenfolge", () => {
  const inhalt = erzeugeBerichtsinhalt(LEER);
  const ueberschriften = [...inhalt.matchAll(/^## (.+)$/gm)].map((treffer) => treffer[1]);
  assert.deepEqual(ueberschriften, [
    "Nachweisgrad",
    "Erstdurchlauf je Delegationsstufe",
    "Ursachenverteilung",
    "Verzichte",
    "Notfaelle",
    "Profil",
    "Was daraus folgt",
  ]);
});

test("REQ-36 Abnahme 2: der Abschnitt \"Was daraus folgt\" bleibt leer", () => {
  const inhalt = erzeugeBerichtsinhalt(LEER);
  const nachDerUeberschrift = inhalt.split("## Was daraus folgt")[1];
  assert.equal(nachDerUeberschrift.trim(), "");
});

test("der Titel traegt den Monat", () => {
  assert.match(erzeugeBerichtsinhalt(LEER), /^# Attesta Zyklus: Monatsbericht 2026-08/);
});

test("die Ursachenverteilung zaehlt alle sieben Werte, auch mit null Eintraegen", () => {
  const ursachen = [
    erzeugeUrsachendatei({ vorgang: "pr-1", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "a" }),
    erzeugeUrsachendatei({ vorgang: "pr-2", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "b" }),
    erzeugeUrsachendatei({ vorgang: "pr-3", wert: "wollen", zeitpunkt: new Date(), gesetztVon: "c" }),
  ];
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, ursachen });
  assert.match(inhalt, /\| Klarheit \| 2 \|/);
  assert.match(inhalt, /\| Wollen \| 1 \|/);
  assert.match(inhalt, /\| Komplexitaet \| 0 \|/);
});

test("ohne offene Notfaelle steht ein klarer Hinweis statt einer leeren Tabelle", () => {
  const inhalt = erzeugeBerichtsinhalt(LEER);
  assert.match(inhalt, /keine offenen Notfaelle/);
});

test("ein offener Notfall erscheint namentlich mit Frist und Zustand", () => {
  const notfall = erzeugeNotfall({ ausgerufenVon: "devin", ausgerufenAm: new Date("2026-08-01T00:00:00.000Z"), pullRequest: 3 });
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, notfaelle: [notfall] });
  assert.match(inhalt, /devin/);
});

test("ein nachdokumentierter Notfall erscheint nicht mehr in der Liste", () => {
  const notfall = { ...erzeugeNotfall({ ausgerufenVon: "devin", ausgerufenAm: new Date("2026-08-01T00:00:00.000Z"), pullRequest: 3 }), nachdokumentiert_am: "2026-08-02T00:00:00.000Z" };
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, notfaelle: [notfall] });
  assert.doesNotMatch(inhalt, /devin/);
  assert.match(inhalt, /keine offenen Notfaelle/);
});

test("ohne Profilbefunde steht ein klarer Hinweis", () => {
  assert.match(erzeugeBerichtsinhalt(LEER), /kein Profil installiert/);
});

test("Profilbefunde erscheinen je Datei mit Zustand", () => {
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, profilBefunde: [{ dateiname: "wortlisten.yaml", zustand: "abgewichen" }] });
  assert.match(inhalt, /\| wortlisten\.yaml \| abgewichen \|/);
});

test("REQ-22 Abnahme 3: der Zaehler je Quartal erscheint im Bericht", () => {
  const notfaelle = [
    erzeugeNotfall({ ausgerufenVon: "a", ausgerufenAm: new Date("2026-08-01T00:00:00.000Z"), pullRequest: 1 }),
    erzeugeNotfall({ ausgerufenVon: "b", ausgerufenAm: new Date("2026-09-01T00:00:00.000Z"), pullRequest: 2 }),
    erzeugeNotfall({ ausgerufenVon: "c", ausgerufenAm: new Date("2026-02-01T00:00:00.000Z"), pullRequest: 3 }),
  ];
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, notfaelle });
  // August liegt in Q3, der Februar-Notfall zaehlt nicht mit.
  assert.match(inhalt, /Notfaelle im laufenden Quartal \(Q3 2026\): 2\./);
});

test("REQ-22: ab dem dritten Notfall im Quartal nennt der Bericht die Schwelle", () => {
  const notfaelle = [1, 2, 3].map((n) =>
    erzeugeNotfall({ ausgerufenVon: `dev${n}`, ausgerufenAm: new Date("2026-08-01T00:00:00.000Z"), pullRequest: n })
  );
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, notfaelle });
  assert.match(inhalt, /Q3 2026\): 3\. Ab dem dritten Notfall im Quartal ist es kein Notfall mehr\./);
});

test("der Quartalszaehler erscheint auch, wenn kein Notfall offen ist", () => {
  const inhalt = erzeugeBerichtsinhalt(LEER);
  assert.match(inhalt, /keine offenen Notfaelle/);
  assert.match(inhalt, /Notfaelle im laufenden Quartal \(Q3 2026\): 0\./);
});

test("REQ-30 GR-9.5: ohne Vorschlaege weist der Bericht die Uebernahmequote als nicht bestimmbar aus", () => {
  const ursachen = [erzeugeUrsachendatei({ vorgang: "pr-1", wert: "klarheit", zeitpunkt: new Date(), gesetztVon: "a" })];
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, ursachen });
  assert.match(inhalt, /Uebernahmequote: nicht bestimmbar/);
});

test("REQ-30 GR-9.5: mit Vorschlaegen weist der Bericht Quote und Nenner aus", () => {
  const basis = { vorgang: "pr-1", zeitpunkt: new Date(), gesetztVon: "a" } as const;
  const ursachen = [
    erzeugeUrsachendatei({ ...basis, wert: "klarheit", vorschlag: "klarheit" }),
    erzeugeUrsachendatei({ ...basis, wert: "kontrolle", vorschlag: "klarheit" }),
  ];
  const inhalt = erzeugeBerichtsinhalt({ ...LEER, ursachen });
  assert.match(inhalt, /Uebernahmequote: 50 Prozent \(Nenner 2\)\. Beobachtung, keine Zielgroesse\./);
});
