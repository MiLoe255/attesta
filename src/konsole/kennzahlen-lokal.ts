/**
 * Liest die Grundlage fuer den Kennzahlversand-Probelauf aus dem lokalen
 * Arbeitsverzeichnis, ohne Netzzugriff und ohne GitHub-Token: die
 * Konsole hat typischerweise keins. REQ-12 verlangt kein netzfreies
 * kennzahlen ausdruecklich, aber die Datenquellen liegen ohnehin lokal
 * im Repository, ein Netzaufruf waere unnoetig.
 *
 * Stufe 2 und Stufe 4 der Delegationsreife stuetzen sich auf die
 * PR-Historie ueber die GitHub-API und sind lokal grundsaetzlich nicht
 * ermittelbar. Beide bleiben hier unerfuellt, die ermittelte Reife
 * deckelt sich dadurch praktisch bei Stufe 1, ausser die Action selbst
 * berichtet spaeter einen echten Wert.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import type { Ursachendatei } from "../action/ursachendatei";
import type { Notfall } from "../action/notfall";
import type { StufenBedingungen } from "../gemeinsam/delegationsreife";

function leseYamlVerzeichnis<T>(pfad: string): T[] {
  if (!existsSync(pfad)) return [];
  const ergebnisse: T[] = [];
  for (const datei of readdirSync(pfad)) {
    if (!datei.endsWith(".yaml") && !datei.endsWith(".yml")) continue;
    const geparst = load(readFileSync(join(pfad, datei), "utf-8"));
    if (geparst && typeof geparst === "object") ergebnisse.push(geparst as T);
  }
  return ergebnisse;
}

export function liesUrsachenLokal(wurzel: string): Ursachendatei[] {
  return leseYamlVerzeichnis<Ursachendatei>(join(wurzel, "attesta", "ursachen"));
}

export function liesNotfaelleLokal(wurzel: string): Notfall[] {
  return leseYamlVerzeichnis<Notfall>(join(wurzel, "attesta", "notfaelle"));
}

export function liesBetriebskennung(wurzel: string): string | undefined {
  const pfad = join(wurzel, "attesta", "betriebskennung");
  return existsSync(pfad) ? readFileSync(pfad, "utf-8").trim() || undefined : undefined;
}

export function ermittleStufenBedingungenLokal(wurzel: string): StufenBedingungen {
  const existiert = (relativerPfad: string) => existsSync(join(wurzel, relativerPfad));
  return {
    stufe1: {
      profilVorhanden: existiert("attesta/profil.lock"),
      issueFormularVorhanden: existiert(".github/ISSUE_TEMPLATE/arbeitspaket.yml"),
    },
    stufe2: { pruefungenVerbindlich: false, vierAugenBelegt: false, keinSelbstMerge: false },
    stufe3: {
      leitplankenMaschinenlesbar: existiert(".github/workflows") && (existiert("CLAUDE.md") || existiert("AGENTS.md")),
      gate3Durchlaufen: existiert("attesta/gates/p3-bestanden.yaml"),
    },
    stufe4: { historieNachgewiesen: false },
  };
}
