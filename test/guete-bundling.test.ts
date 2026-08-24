import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regressionstest fuer den beim End-to-End-Test am 24.08.2026 gefundenen
 * Fehler: pruefeAnforderungMitRegelsatz() rief ladeRollen()/ladeUnschaerfe()/
 * ladeTechnologien() live aus @miloe255/attesta-core auf. Im gebuendelten
 * Action-Code loest das Paket seine rules/-Pfade relativ zum eigenen
 * __dirname auf, das im Bundle nicht mehr stimmt: "Feld * ist nicht
 * lesbar". guete.ts muss stattdessen die zur Build-Zeit eingefrorenen
 * Konstanten aus guete-regelsatz.generated.ts verwenden.
 */
test("gemeinsam/guete.ts importiert ladeRollen/ladeUnschaerfe/ladeTechnologien nicht aus regelsatz.ts", () => {
  const inhalt = readFileSync(join(__dirname, "..", "src", "gemeinsam", "guete.ts"), "utf-8");
  const importZeilen = inhalt.split("\n").filter((zeile) => zeile.trim().startsWith("import"));
  for (const zeile of importZeilen) {
    if (zeile.includes('"./regelsatz"')) {
      assert.doesNotMatch(zeile, /ladeRollen|ladeUnschaerfe|ladeTechnologien/);
    }
  }
  assert.match(inhalt, /guete-regelsatz\.generated/);
});

test("action/index.ts ruft ladeProfilBasis() nicht live auf, nutzt profilbasis.generated stattdessen", () => {
  const inhalt = readFileSync(join(__dirname, "..", "src", "action", "index.ts"), "utf-8");
  assert.doesNotMatch(inhalt, /ladeProfilBasis\(\)/);
  assert.match(inhalt, /profilbasis\.generated/);
});
