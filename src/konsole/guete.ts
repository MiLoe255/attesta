/**
 * `attesta guete`, Teil von REQ-11. Der Befehl existiert und erfuellt die
 * CLI-Vertraege aus Arbeitspaket 5. Die sechs Pruefungen der
 * Anforderungsguete (REQ-24 bis REQ-26) sind ein eigenes, spaeteres
 * Arbeitspaket.
 */
import type { Befehl } from "./befehl";

export const gueteBefehl: Befehl = {
  name: "guete",
  hilfe(): void {
    console.log("attesta guete <Pfad|Issue-Nummer>");
    console.log("  Eingabe:  Pfad im Repository oder Issue-Nummer");
    console.log("  Ausgabe:  Gueteliste je Anforderung, Rueckgabewert 0 ohne Befund, 1 bei Befund");
  },
  fuehreAus(): number {
    console.log("attesta guete: sechs Pruefungen noch nicht implementiert, siehe REQ-24 bis REQ-26");
    return 0;
  },
};
