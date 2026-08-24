/**
 * Lizenzpruefung offline, REQ-34, REQ-35, SPEC-11. Ed25519-Signatur gegen
 * den eingebetteten oeffentlichen Schluessel, kein gemeinsames Geheimnis
 * (Praezisierung gegenueber B2, das nur von einem eingebetteten Schluessel
 * spricht). Signaturverfahren und Schluessellaenge sind laut SPEC-11 nicht
 * spezifiziert, Vorschlag Ed25519 [E] wurde hier umgesetzt.
 */
import { sign, verify } from "node:crypto";
import { LIZENZ_OEFFENTLICHER_SCHLUESSEL } from "./lizenz-oeffentlicher-schluessel";

/** GR-11.3: Empfaenger, Gueltigkeit bis, Stufe, Ausstellungszeitpunkt. */
export interface Lizenzdaten {
  empfaenger: string;
  gueltig_bis: string;
  stufe: string;
  ausgestellt_am: string;
}

export type LizenzZustand = "gueltig" | "abgelaufen" | "ungueltig" | "fehlt";

export interface LizenzErgebnis {
  zustand: LizenzZustand;
  daten?: Lizenzdaten;
}

/** Signiert einen Lizenzschluessel. Werkzeugfunktion fuer den Betreiber, nicht Teil des ausgelieferten Bausatzes. */
export function signiereLizenz(daten: Lizenzdaten, privaterSchluesselPem: string): string {
  const nutzlast = Buffer.from(JSON.stringify(daten), "utf-8");
  const signatur = sign(null, nutzlast, privaterSchluesselPem);
  return `${nutzlast.toString("base64url")}.${signatur.toString("base64url")}`;
}

/** Prueft die Signatur, gibt bei Erfolg die Nutzlast zurueck, sonst null. Wirft nie. */
export function pruefeSignatur(schluessel: string, oeffentlicherSchluesselPem: string): Lizenzdaten | null {
  const teile = schluessel.split(".");
  if (teile.length !== 2) return null;
  try {
    const nutzlast = Buffer.from(teile[0], "base64url");
    const signatur = Buffer.from(teile[1], "base64url");
    if (!verify(null, nutzlast, oeffentlicherSchluesselPem, signatur)) return null;
    const daten = JSON.parse(nutzlast.toString("utf-8"));
    if (typeof daten !== "object" || daten === null) return null;
    if (typeof daten.empfaenger !== "string" || typeof daten.gueltig_bis !== "string" || typeof daten.stufe !== "string" || typeof daten.ausgestellt_am !== "string") {
      return null;
    }
    return daten as Lizenzdaten;
  } catch {
    return null;
  }
}

/**
 * GR-11.1: gegen den eingebetteten oeffentlichen Schluessel, sofern keiner
 * uebergeben wird. `schluessel` fehlt -> Zustand `fehlt`. Signatur nicht
 * pruefbar -> `ungueltig`. Datum ueberschritten -> `abgelaufen`.
 */
export function pruefeLizenz(schluessel: string | undefined, jetzt: Date = new Date(), oeffentlicherSchluesselPem: string = LIZENZ_OEFFENTLICHER_SCHLUESSEL): LizenzErgebnis {
  if (!schluessel) return { zustand: "fehlt" };

  const daten = pruefeSignatur(schluessel, oeffentlicherSchluesselPem);
  if (!daten) return { zustand: "ungueltig" };

  if (new Date(daten.gueltig_bis).getTime() < jetzt.getTime()) {
    return { zustand: "abgelaufen", daten };
  }
  return { zustand: "gueltig", daten };
}

const DREISSIG_TAGE_MS = 30 * 24 * 60 * 60 * 1000;

/** REQ-35: kein Hinweis bei gueltiger Lizenz. `fehlt` und `ungueltig` verhalten sich wie `abgelaufen`. */
export function formatiereLizenzhinweis(ergebnis: LizenzErgebnis): string | null {
  if (ergebnis.zustand === "gueltig") return null;
  if (ergebnis.zustand === "fehlt") return "Kein Lizenzschluessel hinterlegt.";
  if (ergebnis.zustand === "ungueltig") return "Lizenzschluessel ungueltig, Signatur nicht pruefbar.";
  return `Lizenz abgelaufen am ${ergebnis.daten?.gueltig_bis}.`;
}

/** GR-11.5: nach dreissig Tagen wandert der Hinweis an den Kopf des Kommentars. Nur fuer `abgelaufen` auswertbar. */
export function istHinweisDringend(ergebnis: LizenzErgebnis, jetzt: Date = new Date()): boolean {
  if (ergebnis.zustand !== "abgelaufen" || !ergebnis.daten) return false;
  const ablauf = new Date(ergebnis.daten.gueltig_bis).getTime();
  return jetzt.getTime() - ablauf > DREISSIG_TAGE_MS;
}
