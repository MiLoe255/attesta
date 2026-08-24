import { test } from "node:test";
import assert from "node:assert/strict";
import { dump } from "js-yaml";
import { ladeOffeneNotfaelle, schreibeNotfall } from "../src/action/notfallspeicher";
import { erzeugeNotfall } from "../src/action/notfall";
import type { DateiablageClient } from "../src/action/dateiablage";

function b64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

test("schreibeNotfall legt die Datei unter attesta/notfaelle ab", async () => {
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
  const notfall = erzeugeNotfall({ ausgerufenVon: "dev", ausgerufenAm: new Date("2026-08-20T10:00:00.000Z"), pullRequest: 7 });
  const pfad = await schreibeNotfall(client, { owner: "o", repo: "r", branch: "feature" }, notfall);
  assert.match(pfad, /^attesta\/notfaelle\/pr-7-/);
  const geschrieben = aufrufe[0] as { path: string };
  assert.equal(geschrieben.path, pfad);
});

test("ladeOffeneNotfaelle findet nur aktive Notfaelle des angefragten Pull Requests", async () => {
  const aktiv = erzeugeNotfall({ ausgerufenVon: "dev", ausgerufenAm: new Date("2026-08-20T10:00:00.000Z"), pullRequest: 7 });
  const nachdokumentiert = { ...erzeugeNotfall({ ausgerufenVon: "dev", ausgerufenAm: new Date("2026-08-01T10:00:00.000Z"), pullRequest: 7 }), nachdokumentiert_am: "2026-08-02T00:00:00.000Z" };
  const andererPr = erzeugeNotfall({ ausgerufenVon: "dev", ausgerufenAm: new Date("2026-08-20T10:00:00.000Z"), pullRequest: 9 });

  const dateien: Record<string, string> = {
    "attesta/notfaelle/pr-7-a.yaml": dump(aktiv),
    "attesta/notfaelle/pr-7-b.yaml": dump(nachdokumentiert),
    "attesta/notfaelle/pr-9-c.yaml": dump(andererPr),
  };

  const client: DateiablageClient = {
    rest: {
      repos: {
        async getContent(params) {
          if (params.path === "attesta/notfaelle") {
            return {
              data: Object.keys(dateien).map((pfad) => ({ name: pfad.split("/").pop(), path: pfad, type: "file" })),
            };
          }
          return { data: { content: b64(dateien[params.path]) } };
        },
        async createOrUpdateFileContents() {},
      },
    },
  };

  const gefunden = await ladeOffeneNotfaelle(client, { owner: "o", repo: "r", branch: "feature" }, 7);
  assert.equal(gefunden.length, 1);
  assert.equal(gefunden[0].pull_request, 7);
});

test("ladeOffeneNotfaelle liefert eine leere Liste, wenn das Verzeichnis fehlt", async () => {
  const client: DateiablageClient = {
    rest: {
      repos: {
        async getContent() {
          throw Object.assign(new Error("Not Found"), { status: 404 });
        },
        async createOrUpdateFileContents() {},
      },
    },
  };
  assert.deepEqual(await ladeOffeneNotfaelle(client, { owner: "o", repo: "r", branch: "feature" }, 7), []);
});
