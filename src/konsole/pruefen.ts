/**
 * `attesta pruefen`, Teil von REQ-11. Der Befehl existiert und erfuellt
 * die CLI-Vertraege aus Arbeitspaket 5 (Rueckgabewert, --help, kein Netz).
 * Die fachliche Pruefung selbst ist nicht Teil dieses Arbeitspakets und
 * steht noch nicht im REQ-Bestand fest.
 */
import type { Befehl } from "./befehl";

export const pruefenBefehl: Befehl = {
  name: "pruefen",
  hilfe(): void {
    console.log("attesta pruefen <Pfad>");
    console.log("  Eingabe:  Pfad im Kundenrepository");
    console.log("  Ausgabe:  Befundliste, Rueckgabewert 0 ohne Befund, 1 bei Befund");
  },
  fuehreAus(): number {
    console.log("attesta pruefen: fachliche Pruefung noch nicht implementiert");
    return 0;
  },
};
