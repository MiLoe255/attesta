/**
 * Befehls-Dispatch der Konsole, Arbeitspaket 5 (REQ-11 bis REQ-13).
 * Vier Befehle, einheitlicher Rueckgabewert (GR-4.1): 0 ohne Befund,
 * 1 Befund, 2 Abbruch durch Fehler. Reine Funktionen, kein Seiteneffekt
 * beim Import, damit Tests sie ohne echten Prozessaufruf pruefen koennen.
 * Der ausfuehrbare Einstiegspunkt ist cli.ts.
 */
import { initBefehl } from "./init";
import { pruefenBefehl } from "./pruefen";
import { gueteBefehl } from "./guete";
import { kennzahlenBefehl } from "./kennzahlen";
import { KonsoleFehler } from "../gemeinsam/fehler";
import type { Befehl } from "./befehl";

const BEFEHLE: Befehl[] = [initBefehl, pruefenBefehl, gueteBefehl, kennzahlenBefehl];

function findeBefehl(name: string | undefined): Befehl | undefined {
  return BEFEHLE.find((b) => b.name === name);
}

export function fuehreAus(argv: string[]): number {
  const [name, ...rest] = argv;
  const befehl = findeBefehl(name);

  if (!befehl) {
    console.error(`Unbekannter Befehl. Verfuegbar: ${BEFEHLE.map((b) => b.name).join(", ")}`);
    return 2;
  }
  if (rest.includes("--help")) {
    befehl.hilfe();
    return 0;
  }
  return befehl.fuehreAus(rest);
}

/** Fuehrt einen Aufruf aus und uebersetzt einen KonsoleFehler in den Rueckgabewert. Fuer cli.ts. */
export function fuehreAusMitFehlerbehandlung(argv: string[]): number {
  try {
    return fuehreAus(argv);
  } catch (e) {
    if (e instanceof KonsoleFehler) {
      console.error(`Befund: ${e.message}`);
      return e.rueckgabewert;
    }
    throw e;
  }
}
