import { test } from "node:test";
import assert from "node:assert/strict";
import { schreibeUrsache } from "../src/action/ursachenspeicher";
import { erzeugeUrsachendatei } from "../src/action/ursachendatei";
import type { DateiablageClient } from "../src/action/dateiablage";

test("REQ-27: schreibeUrsache legt die Datei unter attesta/ursachen ab", async () => {
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
  const ursache = erzeugeUrsachendatei({ vorgang: "pr-7", wert: "klarheit", zeitpunkt: new Date("2026-08-24T10:00:00.000Z"), gesetztVon: "reviewerin" });
  const pfad = await schreibeUrsache(client, { owner: "o", repo: "r", branch: "feature" }, ursache);
  assert.equal(pfad, "attesta/ursachen/pr-7-2026-08-24T10-00-00-000Z.yaml");
  const geschrieben = aufrufe[0] as { path: string; branch: string };
  assert.equal(geschrieben.path, pfad);
  assert.equal(geschrieben.branch, "feature");
});
