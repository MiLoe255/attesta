/**
 * Wendet Notfallpfad (REQ-22) und Beobachtungsmodus (REQ-23) auf den
 * rohen Check-Run-Zustand an. Beide erzwingen `neutral`, unabhaengig
 * davon, was die eigentliche Pruefung ergeben haette: der Notfallpfad
 * "niemals erfolg" ist nur die eine Haelfte, die andere ist "niemals
 * fehlschlag", sonst waere ein blockierendes Gate gar nicht umgangen.
 * Die Befunde selbst bleiben unveraendert, nur die Ampel aendert sich.
 */
import type { CheckZustand } from "./checkrun";

export interface UeberschreibungsGrund {
  notfallAktiv: boolean;
  beobachtungsmodus: boolean;
}

export function wendeUeberschreibungenAn(roherZustand: CheckZustand, grund: UeberschreibungsGrund): CheckZustand {
  if (grund.notfallAktiv || grund.beobachtungsmodus) {
    return "neutral";
  }
  return roherZustand;
}
