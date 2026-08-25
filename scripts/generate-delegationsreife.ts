/**
 * Friert die Historie-Bedingung fuer Delegationsreife Stufe 4 aus
 * rules/delegationsreife.yaml ein (D3-26, entschieden am 25.08.2026).
 * Gleiche Begruendung wie bei den uebrigen Generatoren: die Action wird
 * vollstaendig gebuendelt, und kein Wert aus rules/ darf als Konstante
 * im Code stehen.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ladeDelegationsreife } from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "delegationsreife.generated.ts");

function main(): void {
  const regeln = ladeDelegationsreife();
  const inhalt = [
    "// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-delegationsreife.ts.",
    "",
    `export const REIFE_HISTORIE = ${JSON.stringify(regeln.historie, null, 2)} as const;`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
