/**
 * Friert die Delegations-Obergrenze je Kritikalitaetsstufe aus
 * rules/ks-matrix.yaml ein. Zwei Gruende, wie bei den anderen
 * Generatoren: die Action wird vollstaendig gebuendelt, und
 * @miloe255/attesta-core loest seine rules/-Pfade relativ zum eigenen
 * __dirname auf. Zugleich bleibt damit die harte Regel gewahrt, dass
 * kein Wert aus rules/ als Konstante im Code steht: der Wert wird
 * erzeugt, nicht getippt.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ladeKsMatrix } from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "ksmatrix.generated.ts");

function main(): void {
  const matrix = ladeKsMatrix();
  const dimension = matrix.dimensionen.max_delegation as unknown as Record<string, { wert?: string }>;
  const obergrenzen: Record<string, string> = {};
  for (const stufe of ["K1", "K2", "K3"]) {
    const wert = dimension[stufe]?.wert;
    if (!wert) throw new Error(`ks-matrix.yaml: max_delegation.${stufe}.wert fehlt`);
    obergrenzen[stufe] = wert;
  }

  const inhalt = [
    "// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-ksmatrix.ts.",
    "",
    `export const KS_MAX_DELEGATION = ${JSON.stringify(obergrenzen, null, 2)} as const;`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
