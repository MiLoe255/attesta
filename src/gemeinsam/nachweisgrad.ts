/**
 * Nachweisgrad, REQ-26, GR-8.6/GR-8.7. Minimum aus Kettendeckung,
 * Anforderungsguete und Belegfrische, nie ein Mittelwert.
 *
 * Entscheidung vom 24.08.2026: fehlt ein Bestandteil, ist der Nachweisgrad
 * gesamt "nicht bestimmbar" (nachweisgrad: null), nicht nur der fehlende
 * Bestandteil.
 *
 * Kettendeckung und Belegfrische sind seit dem 28.08.2026 definiert, siehe
 * attesta-plattform/docs/p1/pruefnotiz-kettendeckung-und-belegfrische.md.
 * Beide rechnen hier, die Erhebung ihrer Eingaben liegt woanders.
 *
 * Die frueher hier vermerkte Annahme, Belegfrische sei ein Zeitraum, ab dem
 * ein Beleg als alt gilt, ist verworfen. Eine Frische aus der Uhrzeit briche
 * die Idempotenzregel des Dienstes: dieselbe Eingabe ergaebe morgen eine
 * andere Antwort. Massgeblich ist stattdessen der Zustand, gegen den der
 * Beleg erhoben wurde.
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

/** Knoten der Traceability-Kette, attesta-core/rules/trace-depth.yaml. */
export type Kettenknoten = "intent" | "req" | "spec" | "contract" | "code" | "test" | "outcome" | "pr";

export interface Kettenbefund {
  /** Kennung der Anforderung, deren Kette geprueft wurde. */
  readonly kennung: string;
  /** Die nach der Kritikalitaet geforderten Knoten. Kommt aus trace-depth.yaml, nicht von hier. */
  readonly gefordert: readonly Kettenknoten[];
  /** Die tatsaechlich belegten Knoten. Zusaetzliche schaden nicht, fehlende schon. */
  readonly belegt: readonly Kettenknoten[];
}

export interface Belegbefund {
  /** Kennung der Angabe, deren Frische geprueft wird. */
  readonly kennung: string;
  /**
   * Pruefsumme des Zustands, gegen den die Angabe erhoben wurde. `null` bei einer
   * Angabe ohne Repositoriumsbezug, etwa einer Freigabe: Sie veraltet nicht dadurch,
   * dass sich Code aendert, und gilt deshalb als dauerhaft frisch.
   */
  readonly zustandsanker: string | null;
  /** Pruefsumme des Zustands, gegen den heute geurteilt wird. */
  readonly aktuellerAnker: string;
}

/**
 * Variante B der Pruefnotiz: eine Kette ist gedeckt oder sie ist es nicht.
 *
 * Kein Teilerfuellungsgrad. Der Nachweisgrad ist als Minimum gebaut, also absichtlich
 * pessimistisch, und eine Kennzahl die "teilweise" verrechnet arbeitet gegen diese
 * Konstruktion. Genau dieser Zustand hat im eigenen Verfahren schon vier Gate-Protokolle
 * nacheinander passiert, ohne dass jemand ihn abstellte.
 */
export function istGedeckt(befund: Kettenbefund): boolean {
  if (befund.gefordert.length === 0) {
    /*
     * Eine geforderte Tiefe ohne Knoten kann aus trace-depth.yaml nicht entstehen.
     * Kaeme sie doch, waere still "gedeckt" zu antworten das Schlechteste: Eine
     * Anforderung ohne Anspruch saehe aus wie eine erfuellte. Lauter Abbruch.
     */
    throw new Error(`Kettenbefund "${befund.kennung}" fordert keinen einzigen Knoten. Das ist ein Fehler der Erhebung, nicht der Anforderung.`);
  }
  const belegt = new Set(befund.belegt);
  return befund.gefordert.every((knoten) => belegt.has(knoten));
}

/** Frisch ist ein Beleg, der gegen den heutigen Zustand erhoben wurde. Alter spielt keine Rolle. */
export function istFrisch(befund: Belegbefund): boolean {
  return befund.zustandsanker === null || befund.zustandsanker === befund.aktuellerAnker;
}

/** Nenner 0 (keine Anforderung mit Kette) ist "keine Daten", nicht der Wert 0. */
export function berechneKettendeckung(befunde: readonly Kettenbefund[]): Teilwert | null {
  if (befunde.length === 0) return null;
  const gedeckt = befunde.filter(istGedeckt).length;
  return { wert: Math.round((100 * gedeckt) / befunde.length), nenner: befunde.length };
}

/** Nenner 0 (kein Beleg erhoben) ist "keine Daten", nicht der Wert 0. */
export function berechneBelegfrische(befunde: readonly Belegbefund[]): Teilwert | null {
  if (befunde.length === 0) return null;
  const frisch = befunde.filter(istFrisch).length;
  return { wert: Math.round((100 * frisch) / befunde.length), nenner: befunde.length };
}

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
