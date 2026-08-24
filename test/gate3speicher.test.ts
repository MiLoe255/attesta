import { test } from "node:test";
import assert from "node:assert/strict";
import { schreibeGate3Attest } from "../src/action/gate3speicher";
import { erzeugeGate3Attest, GATE3_PFAD } from "../src/action/gate3";
import type { DateiablageClient } from "../src/action/dateiablage";

test("schreibeGate3Attest legt die Datei unter attesta/gates/p3-bestanden.yaml ab", async () => {
  const aufrufe: unknown[] = [];
  const client: DateiablageClient = {
    rest: {
      repos: {
        async getContent() {
          throw Object.assign(new Error("Not Found"), { status: 404 });
        },
        async createOrUpdateFileContents(params) {
          aufrufe.push(params);
        },
      },
    },
  };
  const attest = erzeugeGate3Attest({ bestaetigtVon: "reviewerin", datum: new Date("2026-08-24T10:00:00.000Z"), begruendung: "Pipeline gruen" });
  await schreibeGate3Attest(client, { owner: "o", repo: "r", branch: "feature" }, attest);
  const geschrieben = aufrufe[0] as { path: string; branch: string; message: string };
  assert.equal(geschrieben.path, GATE3_PFAD);
  assert.equal(geschrieben.branch, "feature");
  assert.match(geschrieben.message, /reviewerin/);
});
