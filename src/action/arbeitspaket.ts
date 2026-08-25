/**
 * Liest Kritikalitaet und Delegationsstufe aus dem Text eines
 * Arbeitspakets, REQ-28. Das Issue-Formular liefert sie als
 * Auswahlwerte ("K2 standard", "S3 Unterstuetzen"); gelesen wird nur die
 * Kennung am Wortanfang, damit ein von Hand geschriebener Text mit
 * derselben Kennung ebenfalls erkannt wird.
 */
import { KS_MAX_DELEGATION } from "../gemeinsam/ksmatrix.generated";
import type { SStufe } from "../gemeinsam/delegationsreife";

export type KStufe = keyof typeof KS_MAX_DELEGATION;

export interface Einstufung {
  kritikalitaet: KStufe | null;
  delegation: SStufe | null;
}

export function leseEinstufung(text: string): Einstufung {
  const k = text.match(/\bK([123])\b/);
  const s = text.match(/\bS([1-4])\b/);
  return {
    kritikalitaet: k ? (`K${k[1]}` as KStufe) : null,
    delegation: s ? (`S${s[1]}` as SStufe) : null,
  };
}

/**
 * REQ-29, GR-9.6: ein Arbeitspaket ohne die Pflichtfelder wird als K3
 * behandelt. Eine Regel, die sich durch Weglassen umgehen laesst, wird
 * weggelassen.
 */
export function kritikalitaetMitRueckfall(einstufung: Einstufung): { stufe: KStufe; ausRueckfall: boolean } {
  if (einstufung.kritikalitaet) return { stufe: einstufung.kritikalitaet, ausRueckfall: false };
  return { stufe: "K3", ausRueckfall: true };
}

/** Die Obergrenze der K-mal-S-Matrix zur Kritikalitaetsstufe, aus rules/ks-matrix.yaml erzeugt. */
export function matrixObergrenze(stufe: KStufe): SStufe {
  return KS_MAX_DELEGATION[stufe] as SStufe;
}
