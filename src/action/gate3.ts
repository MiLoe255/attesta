/**
 * Gate-3-Nachweis-Konvention, Ergaenzung zu Arbeitspaket 12. "Gate 3
 * durchlaufen" hat keinen automatischen Nachweis-Mechanismus im
 * 47er-Bestand (siehe delegationsreife-ermittlung.ts). Entscheidung vom
 * 24.08.2026: eine Datei-basierte Selbstauskunft, analog zur
 * Notfall- und Ursachendatei. Kein objektiver Nachweis, nur eine
 * namentliche Behauptung durch eine Person mit Freigaberecht, an derselben
 * Stelle geprueft wie der Ursachenwert "wollen" (freigabe.ts).
 */
export const GATE3_BEFEHL = /^\/attesta\s+gate3\s+bestanden\s+(.+)$/i;
export const GATE3_PFAD = "attesta/gates/p3-bestanden.yaml";

export function istGate3Befehl(kommentarBody: string): boolean {
  return GATE3_BEFEHL.test(kommentarBody.trim());
}

export interface Gate3Attest {
  bestaetigt_von: string;
  datum: string;
  begruendung: string;
}

/** Gibt null zurueck, wenn der Befehl keine Begruendung traegt (Fehlerverhalten: fehlendes Feld benennen statt schweigend ablehnen, siehe Aufrufer). */
export function leseBegruendung(kommentarBody: string): string | null {
  const treffer = kommentarBody.trim().match(GATE3_BEFEHL);
  const begruendung = treffer?.[1]?.trim();
  return begruendung ? begruendung : null;
}

export function erzeugeGate3Attest(params: { bestaetigtVon: string; datum: Date; begruendung: string }): Gate3Attest {
  return { bestaetigt_von: params.bestaetigtVon, datum: params.datum.toISOString(), begruendung: params.begruendung };
}
