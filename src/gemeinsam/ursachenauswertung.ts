/**
 * Der eine Auswerteschritt fuer Ankreuzfeld und Befehl, GR-7.2/GR-7.3:
 * genau ein gesetztes Feld fuehrt zum Eintrag, null Felder aendern nichts,
 * zwei oder mehr fuehren zu einer Rueckfrage. Ankreuzfelder und Befehl
 * (ankreuzfelder.ts, befehle.ts) rufen beide ausschliesslich diese
 * Funktion auf, damit sie garantiert dasselbe Ergebnis liefern.
 */
export type AuswertungsErgebnis =
  | { art: "kein_eintrag" }
  | { art: "eintrag"; kennung: string }
  | { art: "rueckfrage"; kandidaten: string[] };

export function werteKennungenAus(kennungen: string[]): AuswertungsErgebnis {
  if (kennungen.length === 0) return { art: "kein_eintrag" };
  if (kennungen.length === 1) return { art: "eintrag", kennung: kennungen[0] };
  return { art: "rueckfrage", kandidaten: kennungen };
}
