/**
 * Friert Vorlagensatz und Bedienhilfen aus attesta-core ein, damit
 * `attesta init` sie ins Kundenrepository schreiben kann (technisches
 * Konzept A3: docs/vorlagen/*.md plus docs/vorlagen/BEDIENUNG.md).
 *
 * Gleiche Begruendung wie bei den uebrigen Generatoren: die Konsole soll
 * ohne Zugriff auf das private Paket zur Laufzeit auskommen.
 *
 * Zur Grenze aus D3-14: ausgeliefert wird die Bedienung, nicht die
 * Beratung. Die Bedienhilfen erklaeren, wie ein Feld auszufuellen ist.
 * Die sieben Skill-Vollfassungen bleiben Bestandteil des
 * Einfuehrungsmandats und werden nicht ausgeliefert (Lizenztabelle A1).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ZIEL = join(__dirname, "..", "src", "gemeinsam", "vorlagen.generated.ts");
const CORE = dirname(require.resolve("@miloe255/attesta-core/package.json"));

function lies(verzeichnis: string): Array<{ name: string; inhalt: string }> {
  const pfad = join(CORE, verzeichnis);
  return readdirSync(pfad)
    .filter((d) => d.endsWith(".md"))
    .sort()
    .map((name) => ({ name, inhalt: readFileSync(join(pfad, name), "utf-8") }));
}

const KOPF_BEDIENUNG = `# Bedienung des Vorlagensatzes

Zu jeder der dreizehn Vorlagen unter \`docs/vorlagen/\` steht hier eine
Bedienhilfe: wofür sie da ist, wann sie ausgefüllt wird, was in jedes Feld
gehört, ein ausgefülltes Beispiel, die häufigen Fehler und was die Maschine
davon prüft.

**Was hier steht:** die Bedienung. Wie ein Feld auszufüllen ist.

**Was hier nicht steht:** die Beratung. Wie ein Intake-Gespräch moderiert wird,
wie ein Umfang verhandelt wird, wie ein Team durch einen K3-Fall begleitet
wird. Das ist Bestandteil eines Einführungsmandats und nicht des Bausatzes.

Alle Beispiele folgen einem durchgehenden Fall: ein Kunststoffverarbeiter mit
zwölf Spritzgussmaschinen, der gewarnt werden will, wenn Messwerte aus dem
Toleranzband laufen.

---

`;

function main(): void {
  const vorlagen = lies("templates");
  const bedienhilfen = lies("bedienhilfen");

  const bedienung =
    KOPF_BEDIENUNG +
    bedienhilfen
      .map((b) => b.inhalt.split("\n").filter((z) => !z.startsWith("# Urheber:") && !z.startsWith("# Lizenz:")).join("\n").trim())
      .join("\n\n---\n\n") +
    "\n";

  const inhalt = [
    "// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-vorlagen.ts.",
    "",
    `export const VORLAGEN = ${JSON.stringify(vorlagen, null, 2)} as const;`,
    "",
    `export const BEDIENUNG = ${JSON.stringify(bedienung)};`,
    "",
  ].join("\n");
  writeFileSync(ZIEL, inhalt, "utf-8");
  console.log(`geschrieben: ${ZIEL} (${vorlagen.length} Vorlagen, ${bedienhilfen.length} Bedienhilfen)`);
}

main();
