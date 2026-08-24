import { test } from "node:test";
import assert from "node:assert/strict";
import { vergleicheDatei } from "../src/gemeinsam/profilvergleich";
import { pruefsumme } from "../src/gemeinsam/regelsatz";
import type { ProfilBasisDatei } from "../src/gemeinsam/regelsatz";

const basisInhalt = "# ERZEUGT AUS rules/\nrollen:\n  - kennung: reviewer\nunschaerfe:\n  - wort: schnell\n";
const basisDatei: ProfilBasisDatei = {
  dateiname: "wortlisten.yaml",
  inhalt: basisInhalt,
  pruefsumme: pruefsumme(basisInhalt),
};

test("deckungsgleich, wenn die Pruefsumme uebereinstimmt", () => {
  const befund = vergleicheDatei({
    dateiname: "wortlisten.yaml",
    profilInhalt: basisDatei.inhalt,
    basisDatei,
    lockEintrag: { pruefsumme: basisDatei.pruefsumme, basisversion: "1.0.0", erzeugt_am: "2026-01-01" },
    aktuelleBasisversion: "1.0.0",
  });
  assert.equal(befund.zustand, "deckungsgleich");
});

test("unlesbar, wenn die Datei fehlt", () => {
  const befund = vergleicheDatei({
    dateiname: "wortlisten.yaml",
    profilInhalt: null,
    basisDatei,
    lockEintrag: undefined,
    aktuelleBasisversion: "1.0.0",
  });
  assert.equal(befund.zustand, "unlesbar");
});

test("basis_veraltet, wenn profil.lock eine andere Basisversion nennt", () => {
  const befund = vergleicheDatei({
    dateiname: "wortlisten.yaml",
    profilInhalt: "rollen:\n  - kennung: reviewer\n",
    basisDatei,
    lockEintrag: { pruefsumme: "sha256:alt", basisversion: "0.9.0", erzeugt_am: "2026-01-01" },
    aktuelleBasisversion: "1.0.0",
  });
  assert.equal(befund.zustand, "basis_veraltet");
});

test("abgewichen, wenn nur Eintraege der Basis entfernt wurden", () => {
  const befund = vergleicheDatei({
    dateiname: "wortlisten.yaml",
    profilInhalt: "rollen:\n  - kennung: reviewer\n",
    basisDatei,
    lockEintrag: { pruefsumme: "sha256:test", basisversion: "1.0.0", erzeugt_am: "2026-01-01" },
    aktuelleBasisversion: "1.0.0",
  });
  assert.equal(befund.zustand, "abgewichen");
});

test("unbekannter_wert, wenn ein Wert ausserhalb der Basis liegt", () => {
  const befund = vergleicheDatei({
    dateiname: "wortlisten.yaml",
    profilInhalt: "rollen:\n  - kennung: erfundene_rolle\n",
    basisDatei,
    lockEintrag: { pruefsumme: "sha256:test", basisversion: "1.0.0", erzeugt_am: "2026-01-01" },
    aktuelleBasisversion: "1.0.0",
  });
  assert.equal(befund.zustand, "unbekannter_wert");
});
