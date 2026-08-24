import { test } from "node:test";
import assert from "node:assert/strict";
import { berechneAnforderungsguete, berechneNachweisgrad, formatiereNachweisgrad } from "../src/gemeinsam/nachweisgrad";
import type { GueteErgebnis } from "../src/gemeinsam/guete";

function ergebnis(gesamt: GueteErgebnis["gesamt"]): GueteErgebnis {
  return { gesamt, pruefungen: [] };
}

test("REQ-26 Abnahme 1: bei den Werten 90, 40 und 80 lautet das Ergebnis 40", () => {
  const n = berechneNachweisgrad({
    kettendeckung: { wert: 90, nenner: 10 },
    anforderungsguete: { wert: 40, nenner: 10 },
    belegfrische: { wert: 80, nenner: 10 },
  });
  assert.equal(n.nachweisgrad, 40);
});

test("Entscheidung vom 24.08.2026: fehlt ein Bestandteil, ist der Nachweisgrad gesamt nicht bestimmbar", () => {
  const n = berechneNachweisgrad({
    kettendeckung: null,
    anforderungsguete: { wert: 90, nenner: 10 },
    belegfrische: null,
  });
  assert.equal(n.nachweisgrad, null);
});

test("REQ-26 GR-8.6: nie ein Mittelwert, auch bei ungleichen Werten das Minimum", () => {
  const n = berechneNachweisgrad({
    kettendeckung: { wert: 100, nenner: 1 },
    anforderungsguete: { wert: 100, nenner: 1 },
    belegfrische: { wert: 1, nenner: 1 },
  });
  assert.equal(n.nachweisgrad, 1);
});

test("berechneAnforderungsguete: Nenner null ist keine Daten, nicht der Wert null", () => {
  assert.equal(berechneAnforderungsguete([]), null);
});

test("berechneAnforderungsguete: erfuellt zaehlt 100, warnung 50, verletzt 0", () => {
  const teilwert = berechneAnforderungsguete([ergebnis("erfuellt"), ergebnis("warnung"), ergebnis("verletzt"), ergebnis("erfuellt")]);
  assert.deepEqual(teilwert, { wert: Math.round((100 + 50 + 0 + 100) / 4), nenner: 4 });
});

test("REQ-26 Abnahme 2: der formatierte Bericht zeigt alle drei Einzelwerte und den Nenner", () => {
  const n = berechneNachweisgrad({
    kettendeckung: { wert: 90, nenner: 10 },
    anforderungsguete: { wert: 40, nenner: 10 },
    belegfrische: { wert: 80, nenner: 10 },
  });
  const text = formatiereNachweisgrad(n);
  assert.match(text, /Kettendeckung: 90 \(Nenner 10\)/);
  assert.match(text, /Anforderungsguete: 40 \(Nenner 10\)/);
  assert.match(text, /Belegfrische: 80 \(Nenner 10\)/);
  assert.match(text, /Nachweisgrad: 40/);
});

test("GR-8.7: ein Nenner unter fuenf unterdrueckt die Quote", () => {
  const n = berechneNachweisgrad({ kettendeckung: null, anforderungsguete: { wert: 100, nenner: 2 }, belegfrische: null });
  const text = formatiereNachweisgrad(n);
  assert.match(text, /Anforderungsguete: 2 Faelle, zu wenige fuer eine Quote/);
});
