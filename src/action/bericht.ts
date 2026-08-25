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
import { bestimmeZustand, zaehleJeQuartal, type Notfall } from "./notfall";
import { berechneUebernahmequote, type Ursachendatei } from "./ursachendatei";
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

/**
 * GR-9.5: die Uebernahmequote wird je Monat ausgewiesen. Sie ist eine
 * Beobachtung und keine Zielgroesse im Regelsatz. Solange REQ-30 keine
 * Indizien-Engine hat (D3-16 verlangt dafuer rund fuenfzig Gate-Laeufe),
 * gibt es keine Vorschlaege und damit keinen Nenner.
 */
function zeileUebernahmequote(ursachen: Ursachendatei[]): string {
  const quote = berechneUebernahmequote(ursachen);
  if (quote === null) {
    return "Uebernahmequote: nicht bestimmbar, es wurde kein Ursachencode vorgeschlagen (REQ-30 ohne Indizien-Engine, siehe D3-16).";
  }
  const mitVorschlag = ursachen.filter((eintrag) => eintrag.vorschlag !== undefined).length;
  return `Uebernahmequote: ${Math.round(quote * 100)} Prozent (Nenner ${mitVorschlag}). Beobachtung, keine Zielgroesse.`;
}

function abschnittUrsachenverteilung(ursachen: Ursachendatei[]): string {
  const zeilen = URSACHEN.map((ursache) => {
    const anzahl = ursachen.filter((eintrag) => eintrag.wert === ursache.kennung).length;
    return `| ${ursache.label} | ${anzahl} |`;
  });
  return ["## Ursachenverteilung", "", "| Ursache | Anzahl |", "|---|---|", ...zeilen, "", zeileUebernahmequote(ursachen)].join("\n");
}

function abschnittVerzichte(): string {
  return ["## Verzichte", "", "Kein Verzichtsmechanismus spezifiziert. Das technische Konzept nennt einen Befehl /attesta verzicht, die Anforderungsliste (REQ-Attesta-Zyklus.md) definiert ihn nicht."].join("\n");
}

/**
 * REQ-22 Abnahme 3: der Zaehler je Quartal erscheint im Bericht. Die
 * Begruendung der Anforderung nennt die Schwelle: ab dem dritten Notfall
 * im Quartal ist es kein Notfall mehr, sondern ein Muster. Gezaehlt wird
 * das laufende Quartal, unabhaengig davon, ob die Notfaelle inzwischen
 * nachdokumentiert sind.
 */
function zeileQuartalszaehler(notfaelle: Notfall[], jetzt: Date): string {
  const jahr = jetzt.getUTCFullYear();
  const quartal = (Math.floor(jetzt.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const anzahl = zaehleJeQuartal(notfaelle, jahr, quartal);
  const nachsatz = anzahl >= 3 ? " Ab dem dritten Notfall im Quartal ist es kein Notfall mehr." : "";
  return `Notfaelle im laufenden Quartal (Q${quartal} ${jahr}): ${anzahl}.${nachsatz}`;
}

function abschnittNotfaelle(notfaelle: Notfall[], jetzt: Date): string {
  const zaehler = zeileQuartalszaehler(notfaelle, jetzt);
  const offene = notfaelle.filter((notfall) => bestimmeZustand(notfall, jetzt) !== "nachdokumentiert");
  if (offene.length === 0) {
    return ["## Notfaelle", "", "keine offenen Notfaelle", "", zaehler].join("\n");
  }
  const zeilen = offene.map((notfall) => `| ${notfall.ausgerufen_von} | ${notfall.frist} | ${bestimmeZustand(notfall, jetzt)} |`);
  return ["## Notfaelle", "", "| Ausgerufen von | Frist | Zustand |", "|---|---|---|", ...zeilen, "", zaehler].join("\n");
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
