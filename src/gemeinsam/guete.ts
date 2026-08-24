/**
 * Anforderungsguete, sechs Pruefungen, REQ-24, GR-8.1 bis GR-8.4.
 * Reine Funktionen. `pruefeAnforderungMitRegelsatz` ist der einzige
 * Unterschied zwischen den beiden Fundorten aus REQ-25 (Issue-Text,
 * Datei): beide rufen dieselbe Funktion mit demselben Text auf.
 *
 * Drei Merkmale der eigenen Norm bleiben menschliches Urteil und werden
 * hier nicht behauptet: notwendig, korrekt, angemessen (siehe
 * REQ-Attesta-Zyklus.md, Kopf).
 *
 * Auslegungen, die das Quellmaterial offen laesst:
 * - "Messbarkeit" (GR-8.3) deckt Zahl-mit-Einheit und Vergleichsoperatoren
 *   ab. "Zustandsname aus dem Zustandsmodell" ist domaenenspezifisch und
 *   generisch nicht entscheidbar, deshalb nicht geprueft.
 * - "Pflichtfelder gefuellt" wird als K- und S-Kennzeichnung im Text
 *   ausgelegt (die zwei strukturellen Felder aus REQ-28, die in Issue und
 *   Datei gleichermassen pruefbar sind. "Begruendung" ist Freitext und
 *   nicht separat pruefbar).
 * - Die Modalverbliste (muss, soll, kann) ist fest im Code, keine eigene
 *   Regelsatzdatei: sie ist Teil der REQ-Schreibkonvention selbst, nicht
 *   projektspezifisch wie Rollen oder Unschaerfewoerter.
 *
 * pruefeAnforderungMitRegelsatz() liest Rollen, Unschaerfewoerter und
 * Technologien aus guete-regelsatz.generated.ts statt live ueber
 * ladeRollen()/ladeUnschaerfe()/ladeTechnologien() aus attesta-core: die
 * Action wird vollstaendig gebuendelt, und das private Paket loest seine
 * rules/-Pfade relativ zum eigenen __dirname auf. Gebuendelt bricht das
 * mit "Feld * ist nicht lesbar" (live beim End-to-End-Test am 24.08.2026
 * auf dem Issue-Fundort gefunden, siehe scripts/generate-guete-regelsatz.ts).
 */
import type { UnschaerfeWort } from "./regelsatz";
import { GUETE_ROLLEN, GUETE_TECHNOLOGIEN, GUETE_UNSCHAERFE } from "./guete-regelsatz.generated";

export type PruefungsZustand = "erfuellt" | "warnung" | "verletzt";

export interface PruefungsBefund {
  pruefung: string;
  zustand: PruefungsZustand;
  details?: string;
}

export interface GueteErgebnis {
  gesamt: PruefungsZustand;
  pruefungen: PruefungsBefund[];
}

export interface GueteRegelsatz {
  rollen: string[];
  unschaerfe: UnschaerfeWort[];
  technologien: string[];
}

const MODALVERBEN = ["muss", "soll", "kann"];

/**
 * Der normative Satz ist die zitierte Zeile ("> ..."), falls vorhanden.
 * Ohne sie (z. B. ein Issue-Text ohne Blockquote) gilt der ganze Text.
 * Ohne diese Eingrenzung zaehlt "K2 · Muss" in der Metadatenzeile jeder
 * REQ als zweites Modalverb mit und erzeugt einen Fehlalarm gegen die
 * eigene Schreibkonvention (im Dogfooding gegen REQ-Attesta-Zyklus.md
 * gefunden).
 */
function normativerSatz(text: string): string {
  const zeilen = text.split("\n").filter((zeile) => zeile.trim().startsWith(">"));
  return zeilen.length > 0 ? zeilen.join(" ") : text;
}

function pruefeModalverb(text: string): PruefungsBefund {
  const satz = normativerSatz(text);
  const treffer = MODALVERBEN.filter((wort) => new RegExp(`\\b${wort}\\b`, "i").test(satz));
  const anzahl = treffer.reduce((summe, wort) => summe + (satz.match(new RegExp(`\\b${wort}\\b`, "gi")) ?? []).length, 0);
  if (anzahl === 0) {
    return { pruefung: "Modalverb", zustand: "verletzt", details: "kein Modalverb (muss, soll, kann) gefunden" };
  }
  if (anzahl > 1) {
    return { pruefung: "Modalverb", zustand: "verletzt", details: `${anzahl} Modalverben gefunden, genau eines erwartet` };
  }
  return { pruefung: "Modalverb", zustand: "erfuellt" };
}

function pruefeAkteur(text: string, rollen: string[]): PruefungsBefund {
  const gefunden = rollen.find((rolle) => new RegExp(`\\b${rolle}\\b`, "i").test(text));
  if (!gefunden) {
    return { pruefung: "benannter Akteur", zustand: "verletzt", details: "keine Rolle aus rollen.yaml gefunden" };
  }
  return { pruefung: "benannter Akteur", zustand: "erfuellt", details: gefunden };
}

const ZAHL_MIT_EINHEIT = /\d+([.,]\d+)?\s*(ms|s|sekunden?|minuten?|stunden?|tage?|wochen?|prozent|%|euro|€|mb|gb|kb|kilometer|km)\b/i;
const VERGLEICHSOPERATOR = /(mindestens|h(ö|oe)chstens|maximal|minimal|genau|weniger als|mehr als|unter|über|ueber)\b|[<>]=?|(?<![a-zA-Z])=(?![a-zA-Z])/i;

function pruefeMessbarkeit(text: string): PruefungsBefund {
  if (ZAHL_MIT_EINHEIT.test(text) || VERGLEICHSOPERATOR.test(text)) {
    return { pruefung: "messbares Abnahmekriterium", zustand: "erfuellt" };
  }
  return { pruefung: "messbares Abnahmekriterium", zustand: "verletzt", details: "keine Zahl mit Einheit und kein Vergleichsoperator gefunden" };
}

function findeWortstamm(text: string, wort: string): boolean {
  return new RegExp(`\\b${wort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*`, "i").test(text);
}

function pruefeUnschaerfe(text: string, unschaerfe: UnschaerfeWort[]): PruefungsBefund {
  const verstoss = unschaerfe.find((w) => w.stufe === "verstoss" && findeWortstamm(text, w.wort));
  if (verstoss) {
    return { pruefung: "kein Unschaerfewort", zustand: "verletzt", details: `Wort: ${verstoss.wort}` };
  }
  const warnung = unschaerfe.find((w) => w.stufe === "warnung" && findeWortstamm(text, w.wort));
  if (warnung) {
    return { pruefung: "kein Unschaerfewort", zustand: "warnung", details: `Wort: ${warnung.wort}` };
  }
  return { pruefung: "kein Unschaerfewort", zustand: "erfuellt" };
}

function pruefeTechnologie(text: string, technologien: string[]): PruefungsBefund {
  const gefunden = technologien.find((wort) => findeWortstamm(text, wort));
  if (gefunden) {
    return { pruefung: "keine Technologievorgabe", zustand: "warnung", details: `Begriff: ${gefunden}` };
  }
  return { pruefung: "keine Technologievorgabe", zustand: "erfuellt" };
}

function pruefePflichtfelder(text: string): PruefungsBefund {
  const hatK = /\bK[123]\b/.test(text);
  const hatS = /\bS[1-4]\b/.test(text);
  if (hatK && hatS) {
    return { pruefung: "Pflichtfelder gefuellt", zustand: "erfuellt" };
  }
  const fehlend = [!hatK && "Kritikalitaet (K1 bis K3)", !hatS && "Delegationsstufe (S1 bis S4)"].filter(Boolean).join(", ");
  return { pruefung: "Pflichtfelder gefuellt", zustand: "verletzt", details: `fehlt: ${fehlend}` };
}

const RANG: Record<PruefungsZustand, number> = { erfuellt: 0, warnung: 1, verletzt: 2 };

/** GR-8.1: sechs Pruefungen in fester Reihenfolge. GR-8.2 zwei Laeufe ueber denselben Text liefern dasselbe Ergebnis, weil die Funktion rein ist. */
export function pruefeAnforderung(text: string, regelsatz: GueteRegelsatz): GueteErgebnis {
  const pruefungen: PruefungsBefund[] = [
    pruefeModalverb(text),
    pruefeAkteur(text, regelsatz.rollen),
    pruefeMessbarkeit(text),
    pruefeUnschaerfe(text, regelsatz.unschaerfe),
    pruefeTechnologie(text, regelsatz.technologien),
    pruefePflichtfelder(text),
  ];
  const gesamt = pruefungen.reduce<PruefungsZustand>((schlechtester, p) => (RANG[p.zustand] > RANG[schlechtester] ? p.zustand : schlechtester), "erfuellt");
  return { gesamt, pruefungen };
}

/** REQ-25: derselbe Programmteil fuer Issue-Text und Datei, hier mit dem zur Build-Zeit eingefrorenen Regelsatz aus attesta-core. */
export function pruefeAnforderungMitRegelsatz(text: string): GueteErgebnis {
  return pruefeAnforderung(text, {
    rollen: [...GUETE_ROLLEN],
    unschaerfe: GUETE_UNSCHAERFE as unknown as UnschaerfeWort[],
    technologien: [...GUETE_TECHNOLOGIEN],
  });
}
