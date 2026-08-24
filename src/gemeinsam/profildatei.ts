/**
 * Formatiert eine Profildatei so, wie sie ins Kundenrepository geschrieben
 * wird: Kopfzeile (REQ-02) plus Pruefsumme (REQ-08) plus Rumpf aus der
 * Profilbasis. Eine einzige Stelle fuer diese Formatierung, die sowohl
 * `attesta init` (Arbeitspaket 4) als auch die Konfigurationsseite
 * (Arbeitspaket 16) verwenden: GR-14.5 verlangt byteweise gleiche
 * Ausgabe bei gleicher Auswahl, und das laesst sich nur garantieren,
 * wenn beide denselben Code aufrufen statt ihn zu duplizieren.
 */
import { formatiereKopfzeile, type Lizenzkennung } from "./kopfzeile";
import type { ProfilBasisDatei } from "./regelsatz";

export const PROFIL_LIZENZ: Lizenzkennung = "PolyForm-Internal-Use-1.0.0";

export function formatiereProfildatei(datei: ProfilBasisDatei, basisversion: string): string {
  return formatiereKopfzeile({ lizenz: PROFIL_LIZENZ, herkunft: basisversion }) + `# Pruefsumme: ${datei.pruefsumme}\n\n` + datei.inhalt;
}
