/**
 * Betriebseigene Rollen, REQ-14 erweitert am 25.08.2026.
 *
 * Der Grundbestand steht in rules/rollen.yaml und ist generisch: er muss
 * auf jedes Kundenprojekt passen. Betriebseigene Rollennamen wie
 * "Produktionsleiter" oder "Schichtleitung" stehen dort nicht und lassen
 * sich dort auch nicht ergaenzen, weil das Profil laut GR-3.2 eine
 * Teilmenge der Basis sein muss.
 *
 * Aufloesung: eine eigene, additive Datei im Kundenrepository. Sie ist
 * ausdruecklich **kein Teil des Profils** und wird deshalb nicht gegen
 * die Basis geprueft. Die Teilmengenregel aus GR-3.2 bleibt damit
 * unangetastet, und der Drift-Vergleich in profilvergleich.ts sieht diese
 * Datei nie.
 *
 * Eine unlesbare oder fehlerhafte Datei haelt keinen Lauf an: sie fuehrt
 * zu einem benannten Befund, und geprueft wird mit dem Grundbestand
 * weiter. Ein Tippfehler in einer Kundendatei darf die Anforderungspruefung
 * nicht abschalten.
 */
import { existsSync, readFileSync } from "node:fs";
import { load } from "js-yaml";
import { GUETE_ROLLEN } from "./guete-regelsatz.generated";

export const EIGENE_ROLLEN_PFAD = "attesta/rollen-eigene.yaml";

export interface EigeneRolle {
  kennung: string;
  anzeigename: string;
  definition: string;
}

export interface EigeneRollenErgebnis {
  /** Anzeigenamen der gueltigen eigenen Rollen, ohne den Grundbestand. */
  rollen: string[];
  /** Was an der Datei zu beanstanden war. Leer, wenn alles stimmt oder die Datei fehlt. */
  befunde: string[];
}

const KENNUNG_MUSTER = /^[a-z][a-z0-9_]*$/;
const MINDESTWOERTER_DEFINITION = 5;

function grundbestandKennungen(): Set<string> {
  // Der Grundbestand fuehrt Anzeigenamen; die Kennung leitet sich daraus ab.
  return new Set(GUETE_ROLLEN.map((name) => name.toLowerCase().replace(/\s+/g, "_")));
}

/** Prueft eine einzelne Rolle nach denselben Regeln wie GR-5.1 fuer den Grundbestand. */
function pruefeRolle(roh: Partial<EigeneRolle>, index: number, bekannt: Set<string>, belegt: Set<string>): { rolle?: EigeneRolle; befund?: string } {
  const stelle = `${EIGENE_ROLLEN_PFAD}, Eintrag ${index + 1}`;
  const { kennung, anzeigename, definition } = roh;

  if (!kennung || !KENNUNG_MUSTER.test(kennung)) {
    return { befund: `${stelle}: kennung fehlt oder enthaelt andere Zeichen als Kleinbuchstaben, Ziffern und Unterstrich` };
  }
  if (bekannt.has(kennung)) {
    return { befund: `${stelle}: kennung "${kennung}" gehoert bereits zum Grundbestand und wird nicht ueberschrieben` };
  }
  if (belegt.has(kennung)) {
    return { befund: `${stelle}: kennung "${kennung}" kommt in der Datei mehrfach vor` };
  }
  if (!anzeigename || anzeigename.trim().length === 0) {
    return { befund: `${stelle}: anzeigename fehlt` };
  }
  if (!definition || definition.trim().split(/\s+/).length < MINDESTWOERTER_DEFINITION) {
    return { befund: `${stelle}: definition fehlt oder umfasst weniger als ${MINDESTWOERTER_DEFINITION} Woerter` };
  }
  return { rolle: { kennung, anzeigename: anzeigename.trim(), definition } };
}

export function leseEigeneRollen(wurzel: string): EigeneRollenErgebnis {
  const pfad = `${wurzel}/${EIGENE_ROLLEN_PFAD}`;
  if (!existsSync(pfad)) return { rollen: [], befunde: [] };

  let geparst: unknown;
  try {
    geparst = load(readFileSync(pfad, "utf-8"));
  } catch {
    return { rollen: [], befunde: [`${EIGENE_ROLLEN_PFAD}: kein gueltiges YAML, der Grundbestand gilt weiter`] };
  }
  if (geparst === null || geparst === undefined) return { rollen: [], befunde: [] };
  if (typeof geparst !== "object") {
    return { rollen: [], befunde: [`${EIGENE_ROLLEN_PFAD}: kein YAML-Objekt, der Grundbestand gilt weiter`] };
  }

  const liste = (geparst as { rollen?: unknown }).rollen;
  if (liste === undefined || liste === null) return { rollen: [], befunde: [] };
  if (!Array.isArray(liste)) {
    return { rollen: [], befunde: [`${EIGENE_ROLLEN_PFAD}: das Feld "rollen" ist keine Liste`] };
  }

  const bekannt = grundbestandKennungen();
  const belegt = new Set<string>();
  const rollen: string[] = [];
  const befunde: string[] = [];

  liste.forEach((roh, index) => {
    const { rolle, befund } = pruefeRolle((roh ?? {}) as Partial<EigeneRolle>, index, bekannt, belegt);
    if (befund) {
      befunde.push(befund);
      return;
    }
    if (rolle) {
      belegt.add(rolle.kennung);
      rollen.push(rolle.anzeigename);
    }
  });

  return { rollen, befunde };
}

/** Die Vorlage, die `attesta init` anlegt. Leer, aber erklaert. */
export const EIGENE_ROLLEN_VORLAGE = `# Betriebseigene Rollen, zusaetzlich zum Grundbestand aus rules/rollen.yaml.
#
# Diese Datei gehoert dir. Sie ist kein Teil des Profils und wird nicht
# gegen die Profilbasis geprueft. Traege hier die Rollennamen ein, die in
# deinem Betrieb tatsaechlich vorkommen, damit sie in Anforderungen als
# benannter Akteur gelten.
#
# Regeln je Eintrag:
#   kennung      Kleinbuchstaben, Ziffern und Unterstrich, nicht aus dem Grundbestand
#   anzeigename  wie die Rolle in einer Anforderung geschrieben wird
#   definition   mindestens fuenf Woerter
#
# Beispiel:
# rollen:
#   - kennung: produktionsleiter
#     anzeigename: "Produktionsleiter"
#     definition: "verantwortet die laufende Fertigung und den Ausschuss einer Schicht"

rollen: []
`;
