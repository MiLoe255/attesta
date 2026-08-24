/**
 * Schreibt Rollen, Unschaerfewoerter und Technologien aus
 * @miloe255/attesta-core als statische Quelldatei, aus demselben Grund
 * wie scripts/generate-ursachen.ts: die Action wird vollstaendig
 * gebuendelt, das private Paket liest seine rules/-Dateien aber relativ
 * zum eigenen __dirname. Gebuendelt bricht das mit "Feld * ist nicht
 * lesbar" (live beim End-to-End-Test am 24.08.2026 gefunden, siehe
 * gemeinsam/guete.ts).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ladeRollen, ladeUnschaerfe, ladeTechnologien } from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "guete-regelsatz.generated.ts");

function main(): void {
  const rollen = ladeRollen();
  const unschaerfe = ladeUnschaerfe();
  const technologien = ladeTechnologien();

  const inhalt = [
    `// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-guete-regelsatz.ts.`,
    "",
    `export const GUETE_ROLLEN = ${JSON.stringify(rollen.rollen.map((r) => r.anzeigename), null, 2)} as const;`,
    "",
    `export const GUETE_UNSCHAERFE = ${JSON.stringify(unschaerfe.woerter, null, 2)} as const;`,
    "",
    `export const GUETE_TECHNOLOGIEN = ${JSON.stringify(technologien.woerter, null, 2)} as const;`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
