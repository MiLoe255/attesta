/**
 * `attesta init`, REQ-07 und REQ-08.
 * Schreibt genau drei Profildateien unter attesta/profil/ und die
 * Herkunftsdatei attesta/profil.lock. Schreibt keine Datei, die bereits
 * existiert, ohne ausdrueckliche Bestaetigung (GR-4.4).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { dump } from "js-yaml";
import { ladeProfilBasis } from "../gemeinsam/regelsatz";
import { formatiereProfildatei } from "../gemeinsam/profildatei";
import { KonsoleFehler } from "../gemeinsam/fehler";
import type { Lock } from "../gemeinsam/profilvergleich";
import type { Befehl } from "./befehl";

export interface InitErgebnis {
  profilVerzeichnis: string;
  lockPfad: string;
  geschriebeneDateien: string[];
}

export interface InitOptionen {
  ueberschreiben?: boolean;
  jetzt?: () => string;
}

export function fuehreInitAus(zielVerzeichnis: string, optionen: InitOptionen = {}): InitErgebnis {
  const ueberschreiben = optionen.ueberschreiben ?? false;
  const jetzt = optionen.jetzt ?? (() => new Date().toISOString());

  const basis = ladeProfilBasis();
  const profilVerzeichnis = join(zielVerzeichnis, "attesta", "profil");
  const lockPfad = join(zielVerzeichnis, "attesta", "profil.lock");

  if (!ueberschreiben) {
    const vorhanden = basis.dateien
      .map((d) => join(profilVerzeichnis, d.dateiname))
      .filter((pfad) => existsSync(pfad));
    if (vorhanden.length > 0) {
      throw new KonsoleFehler(
        `Profil existiert bereits: ${vorhanden.join(", ")}. Mit --ueberschreiben erneut ausfuehren, um zu ersetzen.`,
        1
      );
    }
  }

  mkdirSync(profilVerzeichnis, { recursive: true });
  const zeitpunkt = jetzt();
  const lock: Lock = {};
  const geschriebeneDateien: string[] = [];

  for (const datei of basis.dateien) {
    const inhalt = formatiereProfildatei(datei, basis.basisversion);
    const ziel = join(profilVerzeichnis, datei.dateiname);
    writeFileSync(ziel, inhalt, "utf-8");
    geschriebeneDateien.push(ziel);
    lock[datei.dateiname] = {
      pruefsumme: datei.pruefsumme,
      basisversion: basis.basisversion,
      erzeugt_am: zeitpunkt,
    };
  }

  writeFileSync(lockPfad, dump(lock, { lineWidth: -1, noRefs: true }), "utf-8");

  // SPEC-13 Datenmodell: "zufaellig erzeugt bei init, ohne Bezug zum Namen". Nur einmal
  // erzeugt, bleibt auch bei --ueberschreiben des Profils unveraendert stehen.
  const betriebskennungPfad = join(zielVerzeichnis, "attesta", "betriebskennung");
  if (!existsSync(betriebskennungPfad)) {
    writeFileSync(betriebskennungPfad, randomUUID(), "utf-8");
  }

  return { profilVerzeichnis, lockPfad, geschriebeneDateien };
}

export const initBefehl: Befehl = {
  name: "init",
  hilfe(): void {
    console.log("attesta init [--ueberschreiben]");
    console.log("  Eingabe:  aktuelles Arbeitsverzeichnis als Kundenrepository");
    console.log("  Ausgabe:  attesta/profil/*.yaml (drei Dateien), attesta/profil.lock, attesta/betriebskennung");
  },
  fuehreAus(argv: string[]): number {
    const ergebnis = fuehreInitAus(process.cwd(), { ueberschreiben: argv.includes("--ueberschreiben") });
    for (const datei of ergebnis.geschriebeneDateien) console.log(`geschrieben: ${datei}`);
    console.log(`geschrieben: ${ergebnis.lockPfad}`);
    return 0;
  },
};
