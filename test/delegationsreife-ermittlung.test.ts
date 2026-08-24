import { test } from "node:test";
import assert from "node:assert/strict";
import { ermittleStufenBedingungen, type ErmittlungsClient } from "../src/action/delegationsreife-ermittlung";

function erzeugeFakeClient(optionen: {
  dateien?: string[];
  prs?: Array<{ number: number; autor: string; mergendeR: string | null; hatFreigabe: boolean; checksGruen: boolean }>;
}) {
  const dateien = new Set(optionen.dateien ?? []);
  const prs = optionen.prs ?? [];
  const client: ErmittlungsClient = {
    rest: {
      repos: {
        async getContent(params) {
          if (params.path === ".github/workflows") {
            return dateien.has(".github/workflows") ? { data: [{ name: "ci.yml" }] } : (() => { throw Object.assign(new Error("Not Found"), { status: 404 }); })();
          }
          if (dateien.has(params.path)) return { data: { sha: "x" } };
          throw Object.assign(new Error("Not Found"), { status: 404 });
        },
      },
      pulls: {
        async list() {
          return { data: prs.map((pr) => ({ number: pr.number, merged_at: "2026-08-01T00:00:00.000Z" })) };
        },
        async get(params) {
          const pr = prs.find((p) => p.number === params.pull_number)!;
          return {
            data: {
              number: pr.number,
              user: { login: pr.autor },
              merged_at: "2026-08-01T00:00:00.000Z",
              merged_by: pr.mergendeR ? { login: pr.mergendeR } : null,
              merge_commit_sha: `sha-${pr.number}`,
            },
          };
        },
        async listReviews(params) {
          const pr = prs.find((p) => p.number === params.pull_number);
          return { data: pr?.hatFreigabe ? [{ state: "APPROVED", user: { login: "reviewerin" } }] : [] };
        },
      },
      checks: {
        async listForRef(params) {
          const nummer = Number(params.ref.replace("sha-", ""));
          const pr = prs.find((p) => p.number === nummer);
          return { data: { check_runs: [{ conclusion: pr?.checksGruen ? "success" : "failure" }] } };
        },
      },
    },
  };
  return client;
}

const ZIEL = { owner: "o", repo: "r", branch: "main" };

test("Stufe 1: profil.lock und Issue-Formular vorhanden", async () => {
  const client = erzeugeFakeClient({ dateien: ["attesta/profil.lock", ".github/ISSUE_TEMPLATE/arbeitspaket.yml"] });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe1.profilVorhanden, true);
  assert.equal(b.stufe1.issueFormularVorhanden, true);
});

test("Stufe 1: fehlende Dateien werden erkannt", async () => {
  const client = erzeugeFakeClient({ dateien: [] });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe1.profilVorhanden, false);
  assert.equal(b.stufe1.issueFormularVorhanden, false);
});

test("Stufe 2: zu wenig PR-Historie gilt als nicht belegt", async () => {
  const client = erzeugeFakeClient({ prs: [{ number: 1, autor: "a", mergendeR: "b", hatFreigabe: true, checksGruen: true }] });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe2.pruefungenVerbindlich, false);
  assert.equal(b.stufe2.vierAugenBelegt, false);
  assert.equal(b.stufe2.keinSelbstMerge, false);
});

test("Stufe 2: ausnahmslos konforme PR-Historie erfuellt alle drei Bedingungen", async () => {
  const prs = [1, 2, 3].map((n) => ({ number: n, autor: "a", mergendeR: "b", hatFreigabe: true, checksGruen: true }));
  const client = erzeugeFakeClient({ prs });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe2.pruefungenVerbindlich, true);
  assert.equal(b.stufe2.vierAugenBelegt, true);
  assert.equal(b.stufe2.keinSelbstMerge, true);
});

test("Stufe 2: ein einziger Selbst-Merge in der Stichprobe reicht, um die Bedingung zu verletzen", async () => {
  const prs = [
    { number: 1, autor: "a", mergendeR: "b", hatFreigabe: true, checksGruen: true },
    { number: 2, autor: "a", mergendeR: "a", hatFreigabe: true, checksGruen: true },
    { number: 3, autor: "a", mergendeR: "b", hatFreigabe: true, checksGruen: true },
  ];
  const client = erzeugeFakeClient({ prs });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe2.keinSelbstMerge, false);
});

test("Stufe 3: Leitplanken brauchen Workflows plus CLAUDE.md oder AGENTS.md, Gate 3 bleibt immer unerfuellt", async () => {
  const client = erzeugeFakeClient({ dateien: [".github/workflows", "CLAUDE.md"] });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe3.leitplankenMaschinenlesbar, true);
  assert.equal(b.stufe3.gate3Durchlaufen, false);
});

test("Stufe 3: ohne Workflow-Verzeichnis keine Leitplanken, auch mit CLAUDE.md", async () => {
  const client = erzeugeFakeClient({ dateien: ["CLAUDE.md"] });
  const b = await ermittleStufenBedingungen(client, ZIEL);
  assert.equal(b.stufe3.leitplankenMaschinenlesbar, false);
});
