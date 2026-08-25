/**
 * `attesta guete <Pfad>`, REQ-24, REQ-25 (Fundort Datei). Behandelt den
 * gesamten Dateiinhalt als eine zu pruefende Anforderung: die 47
 * Anforderungen dieses Vorhabens selbst folgen derselben Regel, eine
 * REQ je Abschnitt in einer Datei mit vielen Abschnitten ist der
 * Sonderfall des Framework-eigenen Bestands, nicht die Norm fuer ein
 * Kundenrepository (dort ein REQ je Datei, siehe docs/05-traceability.md
 * im Framework-Repo).
 */
import { existsSync, readFileSync } from "node:fs";
import { pruefeAnforderungMitRegelsatz } from "../gemeinsam/guete";
import { leseEigeneRollen } from "../gemeinsam/eigene-rollen";
import { formatiereBefund } from "../gemeinsam/meldung";
import { KonsoleFehler } from "../gemeinsam/fehler";
import type { Befehl } from "./befehl";

export const gueteBefehl: Befehl = {
  name: "guete",
  hilfe(): void {
    console.log("attesta guete <Pfad>");
    console.log("  Eingabe:  Pfad zu einer Datei im Repository");
    console.log("  Ausgabe:  Gueteliste je Pruefung, Rueckgabewert 0 ohne Befund, 1 bei Befund");
  },
  fuehreAus(argv: string[]): number {
    const pfad = argv[0];
    if (!pfad) {
      throw new KonsoleFehler("Aufruf: attesta guete <Pfad>", 2);
    }
    if (!existsSync(pfad)) {
      throw new KonsoleFehler(`Pfad nicht gefunden: ${pfad}`, 2);
    }
    const text = readFileSync(pfad, "utf-8");
    const eigene = leseEigeneRollen(process.cwd());
    for (const befund of eigene.befunde) console.log(`Hinweis: ${befund}`);
    const ergebnis = pruefeAnforderungMitRegelsatz(text, eigene.rollen);

    let befundGefunden = false;
    for (const pruefung of ergebnis.pruefungen) {
      if (pruefung.zustand === "erfuellt") continue;
      befundGefunden = true;
      const regel = pruefung.details ? `${pruefung.pruefung}: ${pruefung.details}` : pruefung.pruefung;
      console.log(formatiereBefund({ regelsatzdatei: pfad, regel }));
    }
    if (!befundGefunden) {
      console.log(`${pfad}: sechs Pruefungen ohne Befund`);
    }
    return befundGefunden ? 1 : 0;
  },
};
