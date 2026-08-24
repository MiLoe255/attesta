/**
 * `attesta kennzahlen --probe`, REQ-42 (nur der nicht gesperrte Teil).
 * Zeigt den Datensatz im Klartext, sendet nichts. Der echte Versand
 * (REQ-39 bis REQ-41) ist gesperrt, D2-13: weder Empfaenger noch
 * Auftragsverarbeitung sind geklaert. Entscheidung vom 24.08.2026: nur
 * den Probelauf bauen.
 */
import { dump } from "js-yaml";
import { erzeugeKennzahlenDatensatz } from "../gemeinsam/kennzahlen";
import { liesBetriebskennung, liesNotfaelleLokal, liesUrsachenLokal, ermittleStufenBedingungenLokal } from "./kennzahlen-lokal";
import { KonsoleFehler } from "../gemeinsam/fehler";
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
      console.log("attesta kennzahlen: nur --probe ist unterstuetzt. Echter Versand (REQ-39 bis REQ-41) ist gesperrt, siehe D2-13.");
      return 0;
    }

    const wurzel = process.cwd();
    const betriebskennung = liesBetriebskennung(wurzel);
    if (!betriebskennung) {
      throw new KonsoleFehler("Profil fehlt. Erst attesta init ausfuehren.", 2);
    }

    const datensatz = erzeugeKennzahlenDatensatz({
      betriebskennung,
      ursachen: liesUrsachenLokal(wurzel),
      notfaelle: liesNotfaelleLokal(wurzel),
      stufenBedingungen: ermittleStufenBedingungenLokal(wurzel),
    });

    console.log(dump(datensatz, { lineWidth: -1, noRefs: true }));
    console.log("Nichts gesendet. Echter Versand ist gesperrt, siehe D2-13.");
    return 0;
  },
};
