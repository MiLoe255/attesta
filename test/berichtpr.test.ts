import { test } from "node:test";
import assert from "node:assert/strict";
import { berichtsbranch, stelleBerichtBereit, type BerichtPrClient } from "../src/action/berichtpr";

function erzeugeFakeClient(optionen: { branchExistiertSchon?: boolean; offenerPr?: number } = {}) {
  const aufrufe: string[] = [];
  const client: BerichtPrClient = {
    rest: {
      repos: {
        async getContent() {
          throw Object.assign(new Error("Not Found"), { status: 404 });
        },
        async createOrUpdateFileContents(params) {
          aufrufe.push(`schreiben:${params.branch}:${params.path}`);
        },
      },
      git: {
        async getRef(params) {
          aufrufe.push(`getRef:${params.ref}`);
          if (params.ref.includes("bericht-") && !optionen.branchExistiertSchon) {
            throw Object.assign(new Error("Not Found"), { status: 404 });
          }
          return { data: { object: { sha: "sha-main" } } };
        },
        async createRef(params) {
          aufrufe.push(`createRef:${params.ref}`);
        },
      },
      pulls: {
        async list() {
          aufrufe.push("list");
          return { data: optionen.offenerPr ? [{ number: optionen.offenerPr }] : [] };
        },
        async create(params) {
          aufrufe.push(`create:${params.title}`);
          return { data: { number: 42 } };
        },
      },
    },
  };
  return { client, aufrufe };
}

test("REQ-37: der Branch traegt den Monat, kein Commit auf den Hauptzweig", () => {
  assert.equal(berichtsbranch("2026-08"), "attesta/bericht-2026-08");
});

test("REQ-37: legt Branch und PR neu an, wenn beides fehlt", async () => {
  const { client, aufrufe } = erzeugeFakeClient();
  const ergebnis = await stelleBerichtBereit(client, { owner: "o", repo: "r", standardBranch: "main" }, "2026-08", "Inhalt");
  assert.equal(ergebnis.neu, true);
  assert.equal(ergebnis.prNummer, 42);
  assert.ok(aufrufe.includes("createRef:refs/heads/attesta/bericht-2026-08"));
  assert.ok(aufrufe.some((a) => a.startsWith("create:Attesta Zyklus: Monatsbericht 2026-08")));
});

test("REQ-37 Abnahme 2: der Pull-Request-Titel traegt den Monat", async () => {
  const { client, aufrufe } = erzeugeFakeClient();
  await stelleBerichtBereit(client, { owner: "o", repo: "r", standardBranch: "main" }, "2026-08", "Inhalt");
  assert.ok(aufrufe.some((a) => a === "create:Attesta Zyklus: Monatsbericht 2026-08"));
});

test("GR-12.5: ein vorhandener offener PR wird wiederverwendet, kein zweiter angelegt", async () => {
  const { client, aufrufe } = erzeugeFakeClient({ branchExistiertSchon: true, offenerPr: 17 });
  const ergebnis = await stelleBerichtBereit(client, { owner: "o", repo: "r", standardBranch: "main" }, "2026-08", "Inhalt");
  assert.equal(ergebnis.neu, false);
  assert.equal(ergebnis.prNummer, 17);
  assert.ok(!aufrufe.some((a) => a.startsWith("create:")));
  assert.ok(!aufrufe.some((a) => a.startsWith("createRef:")));
});
