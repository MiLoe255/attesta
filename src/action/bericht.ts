/**
 * Erzeugt den Inhalt von attesta/BERICHT.md, REQ-36, GR-12.1: sieben
 * Abschnitte in fester Reihenfolge, der siebte bleibt leer. Reine
 * Funktion, keine Ein-/Ausgabe.
 *
 * Nachweisgrad und Erstdurchlaufquote sind noch nicht ermittelbar: sie
 * brauchen REQ-24 bis REQ-26 (Anforderungsguete) beziehungsweise eine
 * Delegationsreife-Historie, die nirgends aufgezeichnet wird. Verzichte
 * sind ueberhaupt nicht spezifiziert: das technische Konzept nennt einen
 * Befehl /attesta verzicht, die 47 Anforderungen definieren ihn nicht.
 * Diese drei Abschnitte zeigen das ehrlich statt erfundene Werte.
 */
import { URSACHEN } from "../gemeinsam/ursachen.generated";
import { bestimmeZustand, type Notfall } from "./notfall";
import type { Ursachendatei } from "./ursachendatei";
import type { ProfilBefund } from "../gemeinsam/profilvergleich";

export interface BerichtDaten {
  monat: string;
  ursachen: Ursachendatei[];
  notfaelle: Notfall[];
  profilBefunde: ProfilBefund[];
  jetzt: Date;
}

function abschnittKopf(): string {
  return ["## Nachweisgrad", "", "Kettendeckung, Anforderungsguete und Belegfrische sind noch nicht ermittelbar, siehe REQ-24 bis REQ-26."].join("\n");
}

function abschnittErstdurchlauf(): string {
  return [
    "## Erstdurchlauf je Delegationsstufe",
    "",
    "| Stufe | Nenner | Quote |",
    "|---|---|---|",
    "| S1 | 0 | |",
    "| S2 | 0 | |",
    "| S3 | 0 | |",
    "| S4 | 0 | |",
    "",
    "Noch keine Daten: die Erstdurchlaufquote braucht eine Delegationsreife-Historie, die noch nicht aufgezeichnet wird.",
  ].join("\n");
}

function abschnittUrsachenverteilung(ursachen: Ursachendatei[]): string {
  const zeilen = URSACHEN.map((ursache) => {
    const anzahl = ursachen.filter((eintrag) => eintrag.wert === ursache.kennung).length;
    return `| ${ursache.label} | ${anzahl} |`;
  });
  return ["## Ursachenverteilung", "", "| Ursache | Anzahl |", "|---|---|", ...zeilen].join("\n");
}

function abschnittVerzichte(): string {
  return ["## Verzichte", "", "Kein Verzichtsmechanismus spezifiziert. Das technische Konzept nennt einen Befehl /attesta verzicht, die Anforderungsliste (REQ-Attesta-Zyklus.md) definiert ihn nicht."].join("\n");
}

function abschnittNotfaelle(notfaelle: Notfall[], jetzt: Date): string {
  const offene = notfaelle.filter((notfall) => bestimmeZustand(notfall, jetzt) !== "nachdokumentiert");
  if (offene.length === 0) {
    return ["## Notfaelle", "", "keine offenen Notfaelle"].join("\n");
  }
  const zeilen = offene.map((notfall) => `| ${notfall.ausgerufen_von} | ${notfall.frist} | ${bestimmeZustand(notfall, jetzt)} |`);
  return ["## Notfaelle", "", "| Ausgerufen von | Frist | Zustand |", "|---|---|---|", ...zeilen].join("\n");
}

function abschnittProfil(profilBefunde: ProfilBefund[]): string {
  if (profilBefunde.length === 0) {
    return ["## Profil", "", "kein Profil installiert"].join("\n");
  }
  const zeilen = profilBefunde.map((befund) => `| ${befund.dateiname} | ${befund.zustand} |`);
  return ["## Profil", "", "| Datei | Zustand |", "|---|---|", ...zeilen].join("\n");
}

function abschnittWasDarausFolgt(): string {
  return "## Was daraus folgt";
}

export function erzeugeBerichtsinhalt(daten: BerichtDaten): string {
  return [
    `# Attesta Zyklus: Monatsbericht ${daten.monat}`,
    "",
    abschnittKopf(),
    "",
    abschnittErstdurchlauf(),
    "",
    abschnittUrsachenverteilung(daten.ursachen),
    "",
    abschnittVerzichte(),
    "",
    abschnittNotfaelle(daten.notfaelle, daten.jetzt),
    "",
    abschnittProfil(daten.profilBefunde),
    "",
    abschnittWasDarausFolgt(),
    "",
  ].join("\n");
}
