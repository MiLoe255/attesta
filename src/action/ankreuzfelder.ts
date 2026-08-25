/**
 * Liest den Ursachencode aus den sieben Ankreuzfeldern des festen
 * Kommentars, REQ-20, GR-7.1/GR-7.2. Reihenfolge und Beschriftung kommen
 * aus rules/ursachen.yaml (ursachen.generated.ts, siehe scripts/generate-ursachen.ts).
 */
import { URSACHEN } from "../gemeinsam/ursachen.generated";
import { werteKennungenAus, type AuswertungsErgebnis } from "../gemeinsam/ursachenauswertung";
import { maskiere } from "../gemeinsam/regex";

function istGesetzt(zeilen: string[], label: string): boolean {
  const muster = new RegExp(`^-\\s*\\[(x|X)\\]\\s*${maskiere(label)}:`);
  return zeilen.some((zeile) => muster.test(zeile));
}

export function leseGesetzteKennungen(kommentarBody: string): string[] {
  const zeilen = kommentarBody.split("\n").map((zeile) => zeile.trim());
  return URSACHEN.filter((ursache) => istGesetzt(zeilen, ursache.label)).map((ursache) => ursache.kennung);
}

export function werteAnkreuzfelderAus(kommentarBody: string): AuswertungsErgebnis {
  return werteKennungenAus(leseGesetzteKennungen(kommentarBody));
}

/** Die sieben Ankreuzfelder in der Reihenfolge von rules/ursachen.yaml, fuer den festen Kommentar. */
export function formatiereAnkreuzfelder(): string {
  return URSACHEN.map((ursache) => `- [ ] ${ursache.label}: ${ursache.beschreibung}`).join("\n");
}
