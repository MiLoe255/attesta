/**
 * Rueckfallweg ueber einen getippten Befehl, REQ-21. Nutzt denselben
 * Auswerteschritt wie die Ankreuzfelder (GR-7.3).
 */
import { URSACHEN } from "../gemeinsam/ursachen.generated";
import { werteKennungenAus, type AuswertungsErgebnis } from "../gemeinsam/ursachenauswertung";

export type BefehlErgebnis = AuswertungsErgebnis | { art: "unbekannter_wert"; wert: string; zulaessig: string[] };

const BEFEHL_MUSTER = /^\/attesta\s+ursache\s+(\S+)/i;

export function istUrsachenBefehl(kommentarBody: string): boolean {
  return BEFEHL_MUSTER.test(kommentarBody.trim());
}

export function werteBefehlAus(kommentarBody: string): BefehlErgebnis {
  const treffer = kommentarBody.trim().match(BEFEHL_MUSTER);
  if (!treffer) return { art: "kein_eintrag" };

  const wert = treffer[1].toLowerCase();
  const zulaessig: string[] = URSACHEN.map((ursache) => ursache.kennung);
  if (!zulaessig.includes(wert)) {
    return { art: "unbekannter_wert", wert, zulaessig };
  }
  return werteKennungenAus([wert]);
}
