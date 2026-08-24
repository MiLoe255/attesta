/**
 * Datenmodell des Kennzahlversand-Datensatzes, SPEC-13. Reine Funktion,
 * kein Versand: der Versand selbst (REQ-39 bis REQ-41) ist gesperrt,
 * D2-13, die Auftragsverarbeitung und sogar der Empfaenger sind
 * anwaltlich zu klaeren. Gebaut wird nur, was REQ-42 (Probelauf) ohne
 * diese Klaerung schon zulaesst: den Datensatz zeigen, ohne ihn zu
 * senden.
 *
 * GR-13.3 verlangt ein Schema ohne Freitext, nur Zahl, Wahrheitswert
 * oder feste Aufzaehlung. Zwei Felder sind deshalb mit 0 statt mit
 * "nicht ermittelbar" belegt, weil ein Nullwert im Schema nicht
 * vorgesehen ist:
 * - erstdurchlauf_je_stufe: keine Anforderung im 47er-Bestand zeichnet
 *   eine Delegationsreife-Historie auf (dieselbe Luecke wie im
 *   Monatsbericht, Arbeitspaket 14).
 * - nachweisgrad: in der Praxis immer "nicht bestimmbar"
 *   (gemeinsam/nachweisgrad.ts), weil Kettendeckung und Belegfrische
 *   fehlen. 0 ist hier eine Verlegenheitsloesung und keine echte Note,
 *   siehe formatiereProbe() fuer den Klartext-Hinweis darauf.
 */
import { URSACHEN } from "./ursachen.generated";
import type { Ursachendatei } from "../action/ursachendatei";
import type { Notfall } from "../action/notfall";
import { bestimmeDelegationsreife, type StufenBedingungen } from "./delegationsreife";

export const KENNZAHLEN_FORMELVERSION = "1.0.0";

export interface KennzahlenDatensatz {
  betriebskennung: string;
  formelversion: string;
  arbeitspakete: number;
  erstdurchlauf_je_stufe: { S1: number; S2: number; S3: number; S4: number };
  ursachenverteilung: Record<string, number>;
  nachweisgrad: number;
  delegationsreife: number;
  notfaelle: number;
}

export function erzeugeKennzahlenDatensatz(params: {
  betriebskennung: string;
  ursachen: Ursachendatei[];
  notfaelle: Notfall[];
  stufenBedingungen: StufenBedingungen;
}): KennzahlenDatensatz {
  const ursachenverteilung: Record<string, number> = {};
  for (const ursache of URSACHEN) {
    ursachenverteilung[ursache.kennung] = params.ursachen.filter((eintrag) => eintrag.wert === ursache.kennung).length;
  }
  const { stufe } = bestimmeDelegationsreife(params.stufenBedingungen);

  return {
    betriebskennung: params.betriebskennung,
    formelversion: KENNZAHLEN_FORMELVERSION,
    arbeitspakete: params.ursachen.length,
    erstdurchlauf_je_stufe: { S1: 0, S2: 0, S3: 0, S4: 0 },
    ursachenverteilung,
    nachweisgrad: 0,
    delegationsreife: stufe,
    notfaelle: params.notfaelle.length,
  };
}
