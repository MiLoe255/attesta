import { test } from "node:test";
import assert from "node:assert/strict";
import { erzeugeHtml, sammleDateien } from "../src/gemeinsam/konfigurator";
import { formatiereProfildatei } from "../src/gemeinsam/profildatei";
import { ladeProfilBasis } from "../src/gemeinsam/regelsatz";

test("REQ-43: liefert fuenf Dateien, drei Profildateien plus Workflow plus Issue-Formular", () => {
  const dateien = sammleDateien();
  assert.equal(dateien.length, 5);
  assert.ok(dateien.some((d) => d.pfad === ".github/workflows/attesta.yml"));
  assert.ok(dateien.some((d) => d.pfad === ".github/ISSUE_TEMPLATE/arbeitspaket.yml"));
  assert.ok(dateien.some((d) => d.pfad === "attesta/profil/wortlisten.yaml"));
});

test("GR-14.5: die Profildateien sind byteweise identisch mit attesta init (formatiereProfildatei)", () => {
  const basis = ladeProfilBasis();
  const dateien = sammleDateien(basis);
  for (const basisDatei of basis.dateien) {
    const erwartet = formatiereProfildatei(basisDatei, basis.basisversion);
    const gefunden = dateien.find((d) => d.pfad === `attesta/profil/${basisDatei.dateiname}`);
    assert.equal(gefunden?.inhalt, erwartet);
  }
});

test("REQ-45: die Seite enthaelt genau ein Eingabefeld, und das ist nicht fuer einen Lizenzschluessel", () => {
  const html = erzeugeHtml(sammleDateien());
  const eingabefelder = [...html.matchAll(/<input\b[^>]*>/g)];
  assert.equal(eingabefelder.length, 1);
  assert.doesNotMatch(eingabefelder[0][0], /lizenz|schluessel|license|key/i);
  assert.match(html, /ATTESTA_LIZENZSCHLUESSEL/);
});

test("REQ-44: die Seite legt nichts in Browserspeicher oder Keksen ab", () => {
  const html = erzeugeHtml(sammleDateien());
  assert.doesNotMatch(html, /localStorage|sessionStorage|document\.cookie|indexedDB/);
});

test("REQ-43 GR-14.1: die Seite ruft nach dem Laden kein fetch/XMLHttpRequest auf", () => {
  const html = erzeugeHtml(sammleDateien());
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest/);
});

test("Fehlerverhalten: ohne JavaScript verweist die Seite auf die Konsole", () => {
  const html = erzeugeHtml(sammleDateien());
  assert.match(html, /<noscript>[\s\S]*attesta init[\s\S]*<\/noscript>/);
});

test("jede Datei erscheint mit Pfad und Inhalt in der erzeugten Seite", () => {
  const dateien = [{ pfad: "a/b.yaml", inhalt: "wert: 1" }];
  const html = erzeugeHtml(dateien);
  assert.match(html, /a\/b\.yaml/);
  assert.match(html, /wert: 1/);
});
