/**
 * Schreibt die Ursachenliste aus @miloe255/attesta-core als statische
 * Quelldatei. Die Action wird fuer den Marketplace vollstaendig gebuendelt
 * (kein node_modules zur Laufzeit), das private Paket liest seine
 * rules/-Dateien aber relativ zum eigenen __dirname. Gebuendelt wuerde das
 * denselben Fehler wiederholen wie bei der Konsole (siehe Arbeitspaket 4).
 * Deshalb wird die Ursachenliste hier, zur Build-Zeit, als reine
 * TypeScript-Konstante eingefroren.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ladeUrsachen } from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "ursachen.generated.ts");

function main(): void {
  const ursachen = ladeUrsachen();
  const inhalt = [
    `// ERZEUGT AUS @miloe255/attesta-core, Version ${ursachen.version}.`,
    "// Nicht von Hand aendern, siehe scripts/generate-ursachen.ts.",
    "",
    `export const URSACHEN_VERSION = ${JSON.stringify(ursachen.version)};`,
    "",
    `export const URSACHEN = ${JSON.stringify(ursachen.werte, null, 2)} as const;`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
