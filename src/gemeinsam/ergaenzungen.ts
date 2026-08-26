/**
 * Ergaenzungsdateien, Profilverfahren Variante B, freigegeben am 26.08.2026.
 *
 * Ein Kundenprofil ist laut GR-3.2 eine Teilmenge der Basis. Damit kann ein Betrieb
 * weglassen, aber nichts hinzufuegen. Der erste reale Anpassungswunsch, betriebseigene
 * Rollennamen, hat deshalb eine additive Datei ausserhalb des geprueften Bereichs
 * erzwungen: attesta/rollen-eigene.yaml.
 *
 * Das bleibt so. Diese Datei aendert daran nichts, sie macht nur zweierlei:
 *
 *   1. Sie legt die Namenskonvention fest, damit der zweite und dritte Fall nicht
 *      jeweils eine neue erfinden: attesta/<gegenstand>-eigene.yaml, darin eine Liste
 *      unter dem Feld <gegenstand>.
 *   2. Sie erhebt, welche dieser Dateien vorhanden sind und wie viele Eintraege sie
 *      tragen, damit der Monatsbericht es auffuehren kann.
 *
 * Was hier ausdruecklich NICHT geschieht: eine Pruefung des Inhalts gegen die
 * Profilbasis. Diese Dateien sind kein Teil des Profils, der Driftvergleich sieht sie
 * nie, und GR-3.2 bleibt unangetastet. Sichtbarkeit ist die Mindestanforderung, nicht
 * die Loesung. Eine ungeprueft ergaenzte Regel, die im Bericht steht, ist etwas anderes
 * als eine, die niemand sieht.
 *
 * Die geprueffaehige Abweichungsschicht ist Variante C und wird gebaut, wenn ein
 * zweiter Anpassungstyp auftritt, der keine Verengung ist.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";

/** Verzeichnis, in dem Ergaenzungsdateien liegen. */
export const ERGAENZUNGEN_VERZEICHNIS = "attesta";

/**
 * Die bekannten Gegenstaende. Bewusst eine feste Liste und kein Glob: eine Datei, die
 * niemand liest, soll nicht dadurch Gewicht bekommen, dass sie im Bericht auftaucht.
 * Ein neuer Gegenstand wird hier eingetragen, wenn er ausgewertet wird.
 */
export const ERGAENZUNGSGEGENSTAENDE = ["rollen"] as const;

export type Ergaenzungsgegenstand = (typeof ERGAENZUNGSGEGENSTAENDE)[number];

export interface Ergaenzungsbefund {
  gegenstand: Ergaenzungsgegenstand;
  dateiname: string;
  /** vorhanden, leer, unlesbar. Nie "geprueft": geprueft wird hier nichts. */
  zustand: "vorhanden" | "leer" | "unlesbar";
  eintraege: number;
}

export function dateiname(gegenstand: Ergaenzungsgegenstand): string {
  return `${ERGAENZUNGEN_VERZEICHNIS}/${gegenstand}-eigene.yaml`;
}

function zaehleEintraege(pfad: string, gegenstand: string): number | "unlesbar" {
  let geparst: unknown;
  try {
    geparst = load(readFileSync(pfad, "utf-8"));
  } catch {
    return "unlesbar";
  }
  if (geparst === null || geparst === undefined || typeof geparst !== "object") return 0;
  const liste = (geparst as Record<string, unknown>)[gegenstand];
  if (!Array.isArray(liste)) return 0;
  return liste.length;
}

/**
 * Erhebt die vorhandenen Ergaenzungsdateien. Eine fehlende Datei ist kein Befund:
 * Ergaenzungen sind der Ausnahmefall, nicht die Erwartung.
 */
export function erhebeErgaenzungen(wurzel: string): Ergaenzungsbefund[] {
  const befunde: Ergaenzungsbefund[] = [];
  for (const gegenstand of ERGAENZUNGSGEGENSTAENDE) {
    const name = dateiname(gegenstand);
    const pfad = join(wurzel, ...name.split("/"));
    if (!existsSync(pfad)) continue;
    const ergebnis = zaehleEintraege(pfad, gegenstand);
    if (ergebnis === "unlesbar") {
      befunde.push({ gegenstand, dateiname: name, zustand: "unlesbar", eintraege: 0 });
      continue;
    }
    befunde.push({
      gegenstand,
      dateiname: name,
      zustand: ergebnis === 0 ? "leer" : "vorhanden",
      eintraege: ergebnis,
    });
  }
  return befunde;
}
