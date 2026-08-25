import { test } from "node:test";
import assert from "node:assert/strict";
import { dump } from "js-yaml";
import { ermittleStufenBedingungen, type ErmittlungsClient } from "../src/action/delegationsreife-ermittlung";
import { REIFE_HISTORIE } from "../src/gemeinsam/delegationsreife.generated";

const ZIEL = { owner: "o", repo: "r", branch: "main" };

function b64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

/**
 * Baut einen Client mit sauberer Stufe-1-bis-3-Lage und einer frei
 * waehlbaren Historie, damit allein Stufe 4 den Unterschied macht.
 */
function erzeugeClient(optionen: { anzahlPrs: number; notfallBeiPr?: number; werkzeugfehlerBeiPr?: number }): ErmittlungsClient {
  const nummern = Array.from({ length: optionen.anzahlPrs }, (_, i) => i + 1);
  const dateien: Record<string, string> = {};
  if (optionen.notfallBeiPr !== undefined) {
    dateien[`attesta/notfaelle/pr-${optionen.notfallBeiPr}-x.yaml`] = dump({
      ausgerufen_von: "dev",
      ausgerufen_am: "2026-08-01T00:00:00.000Z",
      pull_request: optionen.notfallBeiPr,
      frist: "2026-08-05T00:00:00.000Z",
      zustand: "offen",
    });
  }
  if (optionen.werkzeugfehlerBeiPr !== undefined) {
    dateien[`attesta/ursachen/pr-${optionen.werkzeugfehlerBeiPr}-x.yaml`] = dump({
      vorgang: `pr-${optionen.werkzeugfehlerBeiPr}`,
      wert: "werkzeugfehler",
      zeitpunkt: "2026-08-01T00:00:00.000Z",
      gesetzt_von: "dev",
      uebernommen: false,
    });
  }

  return {
    rest: {
      repos: {
        async getContent(params) {
          if (params.path === "attesta/notfaelle" || params.path === "attesta/ursachen") {
            const treffer = Object.keys(dateien).filter((p) => p.startsWith(`${params.path}/`));
            if (treffer.length === 0) throw Object.assign(new Error("Not Found"), { status: 404 });
            return { data: treffer.map((p) => ({ name: p.split("/").pop(), path: p, type: "file" })) };
          }
          if (dateien[params.path]) return { data: { content: b64(dateien[params.path]) } };
          if (params.path === ".github/workflows") return { data: [{ name: "ci.yml" }] };
          if (["attesta/profil.lock", ".github/ISSUE_TEMPLATE/arbeitspaket.yml", "CLAUDE.md", "attesta/gates/p3-bestanden.yaml"].includes(params.path)) {
            return { data: { sha: "x" } };
          }
          throw Object.assign(new Error("Not Found"), { status: 404 });
        },
      },
      pulls: {
        async list() {
          return { data: nummern.map((n) => ({ number: n, merged_at: "2026-08-01T00:00:00.000Z" })) };
        },
        async get(params) {
          return {
            data: {
              number: params.pull_number,
              user: { login: "autorin" },
              merged_at: "2026-08-01T00:00:00.000Z",
              merged_by: { login: "reviewerin" },
              merge_commit_sha: `sha-${params.pull_number}`,
            },
          };
        },
        async listReviews() {
          return { data: [{ state: "APPROVED", user: { login: "reviewerin" } }] };
        },
      },
      checks: {
        async listForRef() {
          return { data: { check_runs: [{ conclusion: "success" }] } };
        },
      },
    },
  };
}

test("D3-26: genug saubere Arbeitspakete belegen die Historie", async () => {
  const client = erzeugeClient({ anzahlPrs: REIFE_HISTORIE.arbeitspakete_in_folge });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe4.historieNachgewiesen, true);
});

test("D3-26: zu wenig Historie gilt als nicht belegt, nicht als erfuellt", async () => {
  const client = erzeugeClient({ anzahlPrs: REIFE_HISTORIE.arbeitspakete_in_folge - 1 });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe4.historieNachgewiesen, false);
});

test("D3-26: ein Notfall im betrachteten Zeitraum bricht die Historie", async () => {
  const client = erzeugeClient({ anzahlPrs: REIFE_HISTORIE.arbeitspakete_in_folge, notfallBeiPr: 3 });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe4.historieNachgewiesen, false);
});

test("D3-26: ein Ursachencode werkzeugfehler bricht die Historie", async () => {
  const client = erzeugeClient({ anzahlPrs: REIFE_HISTORIE.arbeitspakete_in_folge, werkzeugfehlerBeiPr: 7 });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe4.historieNachgewiesen, false);
});

test("die Schwelle stammt aus rules/delegationsreife.yaml, nicht aus dem Code", () => {
  assert.equal(typeof REIFE_HISTORIE.arbeitspakete_in_folge, "number");
  assert.ok(REIFE_HISTORIE.arbeitspakete_in_folge >= 1);
  assert.equal(REIFE_HISTORIE.ohne_notfall, true);
  assert.equal(REIFE_HISTORIE.ohne_werkzeugfehler, true);
});
