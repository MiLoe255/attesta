/**
 * Liest attesta.yml aus dem Kundenrepository, REQ-23, T8 im Konzept:
 * Beobachtungsmodus als Schalter statt als Zeitraum, damit ein Betrieb ihn
 * spaeter wieder einschalten kann, etwa nach einer Regelaenderung.
 */
import { existsSync, readFileSync } from "node:fs";
import { load } from "js-yaml";

export interface AttestaKonfiguration {
  beobachtungsmodus: boolean;
}

export const KONFIGURATION_STANDARD: AttestaKonfiguration = { beobachtungsmodus: false };

export function ladeKonfiguration(pfad: string): AttestaKonfiguration {
  if (!existsSync(pfad)) return { ...KONFIGURATION_STANDARD };

  const roh = load(readFileSync(pfad, "utf-8"));
  if (roh === null || typeof roh !== "object") return { ...KONFIGURATION_STANDARD };

  const daten = roh as Record<string, unknown>;
  return {
    beobachtungsmodus: typeof daten.beobachtungsmodus === "boolean" ? daten.beobachtungsmodus : KONFIGURATION_STANDARD.beobachtungsmodus,
  };
}
