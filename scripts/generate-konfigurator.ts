/** Schreibt docs/konfigurator/index.html. Inhalt und Logik stehen in src/gemeinsam/konfigurator.ts. */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { sammleDateien, erzeugeHtml } from "../src/gemeinsam/konfigurator";

const ZIEL = join(__dirname, "..", "docs", "konfigurator", "index.html");

function main(): void {
  mkdirSync(join(__dirname, "..", "docs", "konfigurator"), { recursive: true });
  writeFileSync(ZIEL, erzeugeHtml(sammleDateien()), "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
