import { test } from "node:test";
import assert from "node:assert/strict";
import { berechneAnforderungsguete, berechneBelegfrische, berechneKettendeckung, berechneNachweisgrad, formatiereNachweisgrad, istFrisch, istGedeckt } from "../src/gemeinsam/nachweisgrad";
import type { Belegbefund, Kettenbefund, Kettenknoten } from "../src/gemeinsam/nachweisgrad";
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

/*
 * Kettendeckung und Belegfrische, Entscheidung vom 28.08.2026, Variante B in beiden
 * Faellen. Siehe attesta-plattform/docs/p1/pruefnotiz-kettendeckung-und-belegfrische.md.
 */

const K2_PFAD: Kettenknoten[] = ["req", "spec", "pr"];

function kette(kennung: string, belegt: Kettenknoten[]): Kettenbefund {
  return { kennung, gefordert: K2_PFAD, belegt };
}

test("Kettendeckung: eine vollstaendige Kette ist gedeckt, eine mit einer fehlenden Kante nicht", () => {
  assert.equal(istGedeckt(kette("REQ-01", ["req", "spec", "pr"])), true);
  assert.equal(istGedeckt(kette("REQ-02", ["req", "spec"])), false);
});

test("Variante B: teilweise gedeckt zaehlt nicht anteilig, sondern gar nicht", () => {
  // Zwei von drei Knoten belegt waeren bei Variante A oder C ein Teilerfolg.
  const d = berechneKettendeckung([kette("REQ-01", ["req", "spec"])]);
  assert.deepEqual(d, { wert: 0, nenner: 1 });
});

test("Kettendeckung: die Reihenfolge der Belege spielt keine Rolle", () => {
  assert.equal(istGedeckt(kette("REQ-01", ["pr", "req", "spec"])), true);
});

test("Kettendeckung: zusaetzlich belegte Knoten schaden nicht", () => {
  assert.equal(istGedeckt(kette("REQ-01", ["req", "spec", "pr", "test", "outcome"])), true);
});

test("Kettendeckung: eine Anforderung ohne jede Kante gilt als ungedeckt, nicht als unbewertbar", () => {
  // Sonst verbesserte Nichtstun die Quote.
  assert.deepEqual(berechneKettendeckung([kette("REQ-01", [])]), { wert: 0, nenner: 1 });
});

test("Kettendeckung: zwei von vier gedeckt ergibt 50 bei Nenner 4", () => {
  const d = berechneKettendeckung([
    kette("REQ-01", ["req", "spec", "pr"]),
    kette("REQ-02", ["req", "spec", "pr"]),
    kette("REQ-03", ["req", "spec"]),
    kette("REQ-04", []),
  ]);
  assert.deepEqual(d, { wert: 50, nenner: 4 });
});

test("Kettendeckung: keine Befunde sind keine Daten, nicht der Wert 0", () => {
  assert.equal(berechneKettendeckung([]), null);
});

test("Kettendeckung: eine geforderte Tiefe ohne Knoten bricht laut ab, statt gedeckt zu melden", () => {
  assert.throws(() => istGedeckt({ kennung: "REQ-99", gefordert: [], belegt: [] }), /keinen einzigen Knoten/);
});

test("Belegfrische: der Anker entscheidet, nicht das Alter", () => {
  assert.equal(istFrisch({ kennung: "prueflauf", zustandsanker: "abc", aktuellerAnker: "abc" }), true);
  assert.equal(istFrisch({ kennung: "prueflauf", zustandsanker: "alt", aktuellerAnker: "abc" }), false);
});

test("Belegfrische: eine Angabe ohne Repositoriumsbezug gilt als dauerhaft frisch", () => {
  assert.equal(istFrisch({ kennung: "freigabe", zustandsanker: null, aktuellerAnker: "abc" }), true);
});

test("Belegfrische: zwei von drei aktuell ergibt 67 bei Nenner 3", () => {
  const f = berechneBelegfrische([
    { kennung: "a", zustandsanker: "abc", aktuellerAnker: "abc" },
    { kennung: "b", zustandsanker: null, aktuellerAnker: "abc" },
    { kennung: "c", zustandsanker: "veraltet", aktuellerAnker: "abc" },
  ]);
  assert.deepEqual(f, { wert: 67, nenner: 3 });
});

test("Belegfrische: kein Beleg erhoben sind keine Daten, nicht der Wert 0", () => {
  assert.equal(berechneBelegfrische([]), null);
});

test("REQ-M-06: mit allen drei Teilwerten ist der Nachweisgrad bestimmbar und das Minimum", () => {
  const n = berechneNachweisgrad({
    kettendeckung: berechneKettendeckung([kette("REQ-01", ["req", "spec", "pr"])]),
    anforderungsguete: berechneAnforderungsguete([ergebnis("warnung")]),
    belegfrische: berechneBelegfrische([{ kennung: "a", zustandsanker: "abc", aktuellerAnker: "abc" }]),
  });
  assert.deepEqual([n.kettendeckung?.wert, n.anforderungsguete?.wert, n.belegfrische?.wert], [100, 50, 100]);
  assert.equal(n.nachweisgrad, 50);
});
