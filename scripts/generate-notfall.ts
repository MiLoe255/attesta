/**
 * Friert die Notfall-Regelwerte aus rules/notfall.yaml ein (D1-6).
 * Frist und Quartalsschwelle standen vorher als Zahl im Code und
 * verletzten damit die Regel, dass kein Wert aus rules/ als Konstante
 * im Code steht.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ladeNotfall } from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "notfall.generated.ts");

function main(): void {
  const regeln = ladeNotfall();
  const inhalt = [
    "// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-notfall.ts.",
    "",
    `export const NOTFALL_REGELN = ${JSON.stringify({ befehl: regeln.befehl, frist: regeln.frist, schwelle_je_quartal: regeln.schwelle_je_quartal }, null, 2)} as const;`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
