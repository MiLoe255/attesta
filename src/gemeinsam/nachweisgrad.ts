/**
 * Nachweisgrad, REQ-26, GR-8.6/GR-8.7. Minimum aus Kettendeckung,
 * Anforderungsguete und Belegfrische, nie ein Mittelwert.
 *
 * Kettendeckung (Traceability-Graph-Auswertung) und Belegfrische (der
 * Zeitraum, ab dem ein Beleg als alt gilt, ist laut SPEC-08 selbst nicht
 * spezifiziert) sind nicht berechenbar. Entscheidung vom 24.08.2026:
 * fehlt ein Bestandteil, ist der Nachweisgrad gesamt "nicht bestimmbar"
 * (nachweisgrad: null), nicht nur der fehlende Bestandteil. Nur
 * Anforderungsguete wird hier tatsaechlich berechnet.
 */
import type { GueteErgebnis } from "./guete";

export interface Teilwert {
  wert: number;
  nenner: number;
}

export interface Nachweisgrad {
  kettendeckung: Teilwert | null;
  anforderungsguete: Teilwert | null;
  belegfrische: Teilwert | null;
  nachweisgrad: number | null;
  formelversion: string;
}

export const NACHWEISGRAD_FORMELVERSION = "1.0.0";

const PUNKTE: Record<GueteErgebnis["gesamt"], number> = { erfuellt: 100, warnung: 50, verletzt: 0 };

/** Nenner 0 (keine Anforderung geprueft) ist der Zustand "keine Daten", nicht der Wert 0. */
export function berechneAnforderungsguete(ergebnisse: GueteErgebnis[]): Teilwert | null {
  if (ergebnisse.length === 0) return null;
  const summe = ergebnisse.reduce((s, e) => s + PUNKTE[e.gesamt], 0);
  return { wert: Math.round(summe / ergebnisse.length), nenner: ergebnisse.length };
}

export function berechneNachweisgrad(teile: { kettendeckung: Teilwert | null; anforderungsguete: Teilwert | null; belegfrische: Teilwert | null }): Nachweisgrad {
  const werte = [teile.kettendeckung, teile.anforderungsguete, teile.belegfrische];
  const nachweisgrad = werte.some((teilwert) => teilwert === null) ? null : Math.min(...(werte as Teilwert[]).map((t) => t.wert));
  return { ...teile, nachweisgrad, formelversion: NACHWEISGRAD_FORMELVERSION };
}

const NENNER_MINDESTGROESSE = 5;

/** GR-8.7: ein Nenner unter fuenf unterdrueckt die Quote und zeigt die absoluten Zahlen. */
function formatiereTeilwert(name: string, teilwert: Teilwert | null): string {
  if (teilwert === null) return `${name}: nicht ermittelbar`;
  if (teilwert.nenner < NENNER_MINDESTGROESSE) return `${name}: ${teilwert.nenner} Faelle, zu wenige fuer eine Quote`;
  return `${name}: ${teilwert.wert} (Nenner ${teilwert.nenner})`;
}

export function formatiereNachweisgrad(n: Nachweisgrad): string {
  const zeilen = [
    n.nachweisgrad === null ? "Nachweisgrad: nicht bestimmbar" : `Nachweisgrad: ${n.nachweisgrad}`,
    formatiereTeilwert("Kettendeckung", n.kettendeckung),
    formatiereTeilwert("Anforderungsguete", n.anforderungsguete),
    formatiereTeilwert("Belegfrische", n.belegfrische),
    `Formelversion: ${n.formelversion}`,
  ];
  return zeilen.join("\n");
}
