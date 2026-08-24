/**
 * Friert die Profilbasis aus @miloe255/attesta-core zur Build-Zeit als
 * TypeScript-Konstante ein, aus demselben Grund wie
 * generate-ursachen.ts und generate-guete-regelsatz.ts: im gebuendelten
 * Action-Code loest das private Paket seine rules/-Pfade relativ zum
 * eigenen __dirname auf, das im Bundle nicht mehr stimmt. Live beim
 * End-to-End-Test am 24.08.2026 im Monatsbericht gefunden: "meta.yaml:
 * Feld * ist nicht lesbar" beim Profilvergleich.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ladeProfilBasis } from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "profilbasis.generated.ts");

function main(): void {
  const basis = ladeProfilBasis();
  const inhalt = [
    `// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-profilbasis.ts.`,
    `import type { ProfilBasis } from "./regelsatz";`,
    "",
    `export const PROFILBASIS: ProfilBasis = ${JSON.stringify(basis, null, 2)};`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
