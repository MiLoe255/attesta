/**
 * Kopfzeile fuer jede Datei, die in ein Kundenrepository geschrieben wird
 * (REQ-02, SPEC-01 GR-1.1). Drei Zeilen: Urheberrechtsvermerk, Lizenzkennung
 * nach SPDX, Herkunftsversion nach SemVer.
 */
export const URHEBER = "PROSTRUCTIVE® Consulting & Management";

export type Lizenzkennung = "FSL-1.1-Apache-2.0" | "PolyForm-Internal-Use-1.0.0";

export interface KopfzeileFelder {
  lizenz: Lizenzkennung;
  herkunft: string;
}

export function formatiereKopfzeile(felder: KopfzeileFelder): string {
  return [`# Urheber: ${URHEBER}`, `# Lizenz: ${felder.lizenz}`, `# Herkunft: ${felder.herkunft}`].join("\n") + "\n";
}
