/**
 * `attesta kennzahlen --probe`, Teil von REQ-11. Der Befehl existiert und
 * erfuellt die CLI-Vertraege aus Arbeitspaket 5. Der tatsaechliche
 * Datensatz (REQ-39 bis REQ-42) ist gesperrt, bis die Auftragsverarbeitung
 * beim Kennzahlversand anwaltlich geklaert ist (D2-13).
 */
import type { Befehl } from "./befehl";

export const kennzahlenBefehl: Befehl = {
  name: "kennzahlen",
  hilfe(): void {
    console.log("attesta kennzahlen --probe");
    console.log("  Eingabe:  keine");
    console.log("  Ausgabe:  Datensatz im Klartext, sendet nichts");
  },
  fuehreAus(argv: string[]): number {
    if (!argv.includes("--probe")) {
      console.log("attesta kennzahlen: nur --probe ist unterstuetzt, es wird nichts gesendet");
      return 0;
    }
    console.log("attesta kennzahlen --probe: Datensatz noch nicht implementiert, gesperrt durch D2-13");
    return 0;
  },
};
