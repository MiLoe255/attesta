/**
 * Grenztest der Kernbibliothek, AP-M01 AK-1 und AK-3.
 *
 * Die Zusage der Bibliothek lautet: sie laeuft ohne Dateisystem und ohne Netz. Eine
 * solche Zusage haelt nicht dadurch, dass sie im Kommentar steht. Dieser Test laeuft
 * den Importgraphen ab `src/kern/index.ts` ab und faellt, sobald ein Modul
 * hereinkommt, das liest oder sendet.
 *
 * **Nur Wertimporte werden verfolgt.** `import type` verschwindet beim Uebersetzen und
 * kann zur Laufzeit nichts oeffnen. Das ist kein Schlupfloch, sondern der Grund, warum
 * `guete.ts` einen Typ aus `regelsatz.ts` beziehen darf, obwohl dieses Modul den
 * Regelsatz aus dem Dateisystem laedt.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EINSTIEG = resolve(WURZEL, "src/kern/index.ts");

/** Was eine reine Bibliothek nicht anfassen darf. */
const VERBOTENE_BAUSTEINE = ["node:fs", "node:fs/promises", "node:path", "node:http", "node:https", "node:net", "node:dgram", "node:child_process", "node:os", "node:worker_threads"];

/** Fremdpakete, die die Bibliothek mitnehmen darf. Leer, und das ist die Aussage. */
const ERLAUBTE_PAKETE: string[] = [];

interface Fund {
  readonly modul: string;
  readonly ziel: string;
}

/**
 * Liest die Importe einer Datei. Kommentare werden vorher entfernt, damit ein
 * erklaerender Kommentar wie der oben stehende den Test nicht selbst ausloest.
 */
function importeVon(datei: string): { relativ: string[]; fremd: string[] } {
  const quelltext = readFileSync(datei, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

  const relativ: string[] = [];
  const fremd: string[] = [];

  // Wertimporte und Wiederausfuhren. `import type` und `export type` bleiben aussen vor.
  const muster = /(?:^|\n)\s*(?:import|export)\s+(?!type\s)([\s\S]*?)from\s+["']([^"']+)["']/g;
  for (const treffer of quelltext.matchAll(muster)) {
    const spezifizierer = treffer[2];
    // `export { type A, wert }` ist ein Wertimport, `import { type A }` allein nicht.
    // Der Vereinfachung halber gilt jeder nicht als `type` markierte Import als Wert.
    if (spezifizierer.startsWith(".")) relativ.push(spezifizierer);
    else fremd.push(spezifizierer);
  }
  return { relativ, fremd };
}

/** Loest einen relativen Spezifizierer ohne Endung auf, wie die Bundler-Aufloesung es tut. */
function aufloesen(vonDatei: string, spezifizierer: string): string {
  const roh = resolve(dirname(vonDatei), spezifizierer);
  for (const kandidat of [roh, `${roh}.ts`, `${roh}/index.ts`]) {
    if (existsSync(kandidat) && kandidat.endsWith(".ts")) return kandidat;
  }
  throw new Error(`Import "${spezifizierer}" aus ${relative(WURZEL, vonDatei)} ist nicht aufloesbar.`);
}

function graphAblaufen(): { module: string[]; fremdfunde: Fund[] } {
  const gesehen = new Set<string>();
  const fremdfunde: Fund[] = [];
  const offen = [EINSTIEG];

  while (offen.length > 0) {
    const datei = offen.pop() as string;
    if (gesehen.has(datei)) continue;
    gesehen.add(datei);

    const { relativ, fremd } = importeVon(datei);
    for (const ziel of fremd) fremdfunde.push({ modul: relative(WURZEL, datei), ziel });
    for (const ziel of relativ) offen.push(aufloesen(datei, ziel));
  }
  return { module: [...gesehen].map((d) => relative(WURZEL, d)), fremdfunde };
}

test("AK-1: die Kernbibliothek zieht kein Modul mit Dateisystem- oder Netzzugriff herein", () => {
  const { fremdfunde } = graphAblaufen();
  const verboten = fremdfunde.filter((f) => VERBOTENE_BAUSTEINE.includes(f.ziel));
  assert.deepEqual(
    verboten,
    [],
    `Die Bibliothek darf nicht lesen oder senden. Gefunden: ${verboten.map((f) => `${f.ziel} in ${f.modul}`).join(", ")}`,
  );
});

test("AK-1: die Kernbibliothek nimmt kein Fremdpaket mit", () => {
  const { fremdfunde } = graphAblaufen();
  const ungewollt = fremdfunde.filter((f) => !ERLAUBTE_PAKETE.includes(f.ziel) && !f.ziel.startsWith("node:"));
  assert.deepEqual(
    ungewollt,
    [],
    `Jedes Fremdpaket wird beim Einbinden mitgeliefert und ist Angriffsflaeche. Gefunden: ${ungewollt.map((f) => `${f.ziel} in ${f.modul}`).join(", ")}`,
  );
});

test("AK-3: kein Modul der Bibliothek stammt aus der Konsole", () => {
  const { module } = graphAblaufen();
  const ausKonsole = module.filter((m) => m.startsWith("src/konsole/"));
  assert.deepEqual(ausKonsole, [], `Die Bibliothek darf nicht in die Konsole greifen. Gefunden: ${ausKonsole.join(", ")}`);
});

test("die drei dateilesenden Module bleiben ausserhalb der Bibliothek", () => {
  const { module } = graphAblaufen();
  for (const draussen of ["src/gemeinsam/eigene-rollen.ts", "src/gemeinsam/ergaenzungen.ts", "src/gemeinsam/profilvergleich.ts"]) {
    assert.equal(module.includes(draussen), false, `${draussen} liest aus dem Kundenrepositorium und gehoert nicht in die Bibliothek.`);
  }
});

test("der Grenztest prueft tatsaechlich einen Graphen und nicht nur die Einstiegsdatei", () => {
  const { module } = graphAblaufen();
  assert.ok(module.length >= 6, `Erwartet wurden mindestens sechs Module, gefunden ${module.length}: ${module.join(", ")}`);
  assert.ok(module.includes("src/gemeinsam/guete.ts"));
  assert.ok(module.includes("src/gemeinsam/guete-regelsatz.generated.ts"));
});
