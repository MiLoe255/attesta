#!/usr/bin/env node
/**
 * Einstiegspunkt der Konsole. `init` ist aus Arbeitspaket 4 (REQ-07, REQ-08)
 * vollstaendig. `pruefen`, `guete` und `kennzahlen` folgen in Arbeitspaket 5
 * (REQ-11 bis REQ-13) und sind hier bewusst nur Platzhalter, damit REQ-11
 * "vier Befehle" spaeter ohne Bruch in der Aufrufform ergaenzt wird.
 */
import { fuehreInitAus } from "./init";
import { KonsoleFehler } from "../gemeinsam/fehler";

function druckeHilfeInit(): void {
  console.log("attesta init [--ueberschreiben]");
  console.log("  Eingabe:  aktuelles Arbeitsverzeichnis als Kundenrepository");
  console.log("  Ausgabe:  attesta/profil/*.yaml (drei Dateien), attesta/profil.lock");
}

function fuehreAus(argv: string[]): number {
  const [befehl, ...rest] = argv;

  if (befehl === "init") {
    if (rest.includes("--help")) {
      druckeHilfeInit();
      return 0;
    }
    const ergebnis = fuehreInitAus(process.cwd(), { ueberschreiben: rest.includes("--ueberschreiben") });
    for (const datei of ergebnis.geschriebeneDateien) console.log(`geschrieben: ${datei}`);
    console.log(`geschrieben: ${ergebnis.lockPfad}`);
    return 0;
  }

  if (befehl === "pruefen" || befehl === "guete" || befehl === "kennzahlen") {
    console.log(`attesta ${befehl}: noch nicht implementiert, siehe Arbeitspaket 5 (REQ-11 bis REQ-13)`);
    return 0;
  }

  console.error("Unbekannter Befehl. Verfuegbar: init, pruefen, guete, kennzahlen");
  return 2;
}

function main(): void {
  try {
    process.exitCode = fuehreAus(process.argv.slice(2));
  } catch (e) {
    if (e instanceof KonsoleFehler) {
      console.error(`Befund: ${e.message}`);
      process.exitCode = e.rueckgabewert;
      return;
    }
    throw e;
  }
}

main();
