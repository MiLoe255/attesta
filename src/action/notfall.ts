/**
 * Notfallpfad, REQ-22, GR-7.4/GR-7.5. `/attesta notfall` setzt den
 * Check-Run auf neutral und erzeugt eine Frist von drei Arbeitstagen zur
 * Nachdokumentation. Der Zaehler je Quartal ist eine reine Funktion ueber
 * bereits gelesene Notfall-Datensaetze; das Einsammeln der Dateien selbst
 * gehoert dem Monatsbericht (Arbeitspaket 14).
 */
export const NOTFALL_BEFEHL = /^\/attesta\s+notfall\b/i;

export function istNotfallBefehl(kommentarBody: string): boolean {
  return NOTFALL_BEFEHL.test(kommentarBody.trim());
}

export type NotfallZustand = "offen" | "nachdokumentiert" | "ueberfaellig";

export interface Notfall {
  ausgerufen_von: string;
  ausgerufen_am: string;
  pull_request: number;
  frist: string;
  zustand: NotfallZustand;
  nachdokumentiert_am?: string;
}

/** Drei Arbeitstage ab dem Ausrufen, Samstag und Sonntag zaehlen nicht. Feiertage sind nicht beruecksichtigt. */
export function berechneFrist(ausgerufenAm: Date, arbeitstage = 3): Date {
  const ergebnis = new Date(ausgerufenAm);
  let hinzugefuegt = 0;
  while (hinzugefuegt < arbeitstage) {
    ergebnis.setUTCDate(ergebnis.getUTCDate() + 1);
    const wochentag = ergebnis.getUTCDay();
    if (wochentag !== 0 && wochentag !== 6) {
      hinzugefuegt++;
    }
  }
  return ergebnis;
}

export function erzeugeNotfall(params: { ausgerufenVon: string; ausgerufenAm: Date; pullRequest: number }): Notfall {
  return {
    ausgerufen_von: params.ausgerufenVon,
    ausgerufen_am: params.ausgerufenAm.toISOString(),
    pull_request: params.pullRequest,
    frist: berechneFrist(params.ausgerufenAm).toISOString(),
    zustand: "offen",
  };
}

export function bestimmeZustand(notfall: Notfall, jetzt: Date): NotfallZustand {
  if (notfall.nachdokumentiert_am) return "nachdokumentiert";
  if (jetzt.getTime() > new Date(notfall.frist).getTime()) return "ueberfaellig";
  return "offen";
}

/** Ein Notfall ist aktiv (loest die Zustandsueberschreibung aus), solange er nicht nachdokumentiert ist. */
export function istAktiv(notfall: Notfall, jetzt: Date): boolean {
  return bestimmeZustand(notfall, jetzt) !== "nachdokumentiert";
}

export function zaehleJeQuartal(notfaelle: Notfall[], jahr: number, quartal: 1 | 2 | 3 | 4): number {
  return notfaelle.filter((notfall) => {
    const datum = new Date(notfall.ausgerufen_am);
    return datum.getUTCFullYear() === jahr && Math.floor(datum.getUTCMonth() / 3) + 1 === quartal;
  }).length;
}

export function pfadFuerNotfall(notfall: Notfall): string {
  const zeitstempel = notfall.ausgerufen_am.replace(/[:.]/g, "-");
  return `attesta/notfaelle/pr-${notfall.pull_request}-${zeitstempel}.yaml`;
}
