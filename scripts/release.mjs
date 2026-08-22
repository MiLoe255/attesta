// Freigabeskript, REQ-03 und REQ-04. Setzt Version, Git-Marke und gebündelte Datei gemeinsam.
// Bricht mit Rückgabewert ungleich null ab, wenn das Arbeitsverzeichnis unsauber ist, die Marke
// bereits vergeben ist oder das Bündel nach dem Bau älter als die Quelle bleibt.
// Pusht nichts von selbst. Der Aufruf von `git push` bleibt ein eigener, bestätigter Schritt.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function abort(meldung) {
  console.error(`Abbruch: ${meldung}`);
  process.exit(1);
}

const ziel = process.argv[2];
if (!ziel || !/^\d+\.\d+\.\d+$/.test(ziel)) {
  abort("Aufruf: node scripts/release.mjs <SemVer, z. B. 0.2.0>");
}

const status = run("git status --porcelain");
if (status !== "") {
  abort("Arbeitsverzeichnis unsauber. Erst committen oder stashen.");
}

const tagVorhanden = run(`git tag -l v${ziel}`);
if (tagVorhanden === `v${ziel}`) {
  abort(`Marke v${ziel} bereits vergeben.`);
}

const pkgPfad = "package.json";
const pkg = JSON.parse(readFileSync(pkgPfad, "utf8"));
pkg.version = ziel;
writeFileSync(pkgPfad, JSON.stringify(pkg, null, 2) + "\n");

run("npm run build");

function neuesteMtimeUnter(verzeichnis) {
  let neueste = 0;
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    const pfad = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) {
      neueste = Math.max(neueste, neuesteMtimeUnter(pfad));
    } else {
      neueste = Math.max(neueste, statSync(pfad).mtimeMs);
    }
  }
  return neueste;
}

const bundleMtime = statSync("dist/index.js").mtimeMs;
const quellMtime = neuesteMtimeUnter("src");
if (bundleMtime < quellMtime) {
  abort("Bündel dist/index.js ist älter als die Quelle in src/.");
}

run(`git add package.json dist/index.js`);
run(`git commit -m "release: v${ziel}"`);
run(`git tag -a v${ziel} -m "v${ziel}"`);

const hauptversion = ziel.split(".")[0];
const beweglicheMarke = `v${hauptversion}`;
run(`git tag -f ${beweglicheMarke} v${ziel}`);

console.log(`Freigabe v${ziel} vorbereitet, ${beweglicheMarke} zeigt jetzt auf v${ziel}.`);
console.log("Nicht automatisch gepusht. Zum Veröffentlichen von Hand:");
console.log(`  git push origin main v${ziel} && git push origin ${beweglicheMarke} --force`);
