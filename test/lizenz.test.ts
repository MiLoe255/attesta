import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import {
  formatiereLizenzhinweis,
  istHinweisDringend,
  pruefeLizenz,
  pruefeSignatur,
  signiereLizenz,
  type Lizenzdaten,
} from "../src/gemeinsam/lizenz";

function erzeugeSchluesselpaar() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    oeffentlich: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privat: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

const BEISPIEL_DATEN: Lizenzdaten = {
  empfaenger: "kunde@example.com",
  gueltig_bis: "2027-01-01T00:00:00.000Z",
  stufe: "standard",
  ausgestellt_am: "2026-01-01T00:00:00.000Z",
};

test("REQ-34 Abnahme 1: ein mit dem echten privaten Schluessel signierter Schluessel wird angenommen", () => {
  const { oeffentlich, privat } = erzeugeSchluesselpaar();
  const schluessel = signiereLizenz(BEISPIEL_DATEN, privat);
  const geprueft = pruefeSignatur(schluessel, oeffentlich);
  assert.deepEqual(geprueft, BEISPIEL_DATEN);
});

test("REQ-34 Abnahme 2: ein selbst erzeugter Schluessel (falsches Schluesselpaar) wird abgelehnt", () => {
  const echtes = erzeugeSchluesselpaar();
  const gefaelschtes = erzeugeSchluesselpaar();
  const schluessel = signiereLizenz(BEISPIEL_DATEN, gefaelschtes.privat);
  assert.equal(pruefeSignatur(schluessel, echtes.oeffentlich), null);
});

test("eine manipulierte Nutzlast bei sonst gueltiger Signatur wird abgelehnt", () => {
  const { oeffentlich, privat } = erzeugeSchluesselpaar();
  const schluessel = signiereLizenz(BEISPIEL_DATEN, privat);
  const [, signaturTeil] = schluessel.split(".");
  const manipuliert = `${Buffer.from(JSON.stringify({ ...BEISPIEL_DATEN, stufe: "premium" })).toString("base64url")}.${signaturTeil}`;
  assert.equal(pruefeSignatur(manipuliert, oeffentlich), null);
});

test("kein Schluesselformat, keine Ausnahme, Zustand fehlt oder ungueltig", () => {
  const { oeffentlich } = erzeugeSchluesselpaar();
  assert.deepEqual(pruefeLizenz(undefined, new Date(), oeffentlich), { zustand: "fehlt" });
  assert.deepEqual(pruefeLizenz("kein-gueltiges-format", new Date(), oeffentlich), { zustand: "ungueltig" });
});

test("Zustand gueltig innerhalb, abgelaufen ausserhalb der Gueltigkeit", () => {
  const { oeffentlich, privat } = erzeugeSchluesselpaar();
  const schluessel = signiereLizenz(BEISPIEL_DATEN, privat);

  const gueltig = pruefeLizenz(schluessel, new Date("2026-06-01T00:00:00.000Z"), oeffentlich);
  assert.equal(gueltig.zustand, "gueltig");

  const abgelaufen = pruefeLizenz(schluessel, new Date("2027-06-01T00:00:00.000Z"), oeffentlich);
  assert.equal(abgelaufen.zustand, "abgelaufen");
});

test("REQ-35: formatiereLizenzhinweis nennt das Ablaufdatum, kein Hinweis bei gueltiger Lizenz", () => {
  assert.equal(formatiereLizenzhinweis({ zustand: "gueltig" }), null);
  assert.match(formatiereLizenzhinweis({ zustand: "abgelaufen", daten: BEISPIEL_DATEN })!, /2027-01-01/);
  assert.ok(formatiereLizenzhinweis({ zustand: "fehlt" }));
  assert.ok(formatiereLizenzhinweis({ zustand: "ungueltig" }));
});

test("REQ-35 GR-11.5: der Hinweis wird erst nach dreissig Tagen dringend", () => {
  const ergebnis = { zustand: "abgelaufen" as const, daten: BEISPIEL_DATEN };
  assert.equal(istHinweisDringend(ergebnis, new Date("2027-01-15T00:00:00.000Z")), false);
  assert.equal(istHinweisDringend(ergebnis, new Date("2027-02-15T00:00:00.000Z")), true);
});
