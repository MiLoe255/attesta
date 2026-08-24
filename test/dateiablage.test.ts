import { test } from "node:test";
import assert from "node:assert/strict";
import { legeDateiAb, type DateiablageClient } from "../src/action/dateiablage";
import { ladeKonfiguration, KONFIGURATION_STANDARD } from "../src/action/konfiguration";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function erzeugeFakeClient(vorhandeneShas: Record<string, string>) {
  const aufrufe: unknown[] = [];
  const client: DateiablageClient = {
    rest: {
      repos: {
        async getContent(params) {
          aufrufe.push({ art: "getContent", ...params });
          const sha = vorhandeneShas[params.path];
          if (!sha) throw Object.assign(new Error("Not Found"), { status: 404 });
          return { data: { sha } };
        },
        async createOrUpdateFileContents(params) {
          aufrufe.push({ art: "createOrUpdateFileContents", ...params });
        },
      },
    },
  };
  return { client, aufrufe };
}

test("legt eine neue Datei ohne sha an, wenn keine vorhandene existiert", async () => {
  const { client, aufrufe } = erzeugeFakeClient({});
  await legeDateiAb(client, { owner: "o", repo: "r", branch: "feature", pfad: "attesta/notfaelle/x.yaml" }, "inhalt", "notfall: x");
  const schreibaufruf = aufrufe.find((a: any) => a.art === "createOrUpdateFileContents") as any;
  assert.equal(schreibaufruf.sha, undefined);
  assert.equal(Buffer.from(schreibaufruf.content, "base64").toString("utf-8"), "inhalt");
  assert.equal(schreibaufruf.branch, "feature");
});

test("aktualisiert eine vorhandene Datei mit ihrer sha", async () => {
  const { client, aufrufe } = erzeugeFakeClient({ "attesta/notfaelle/x.yaml": "abc123" });
  await legeDateiAb(client, { owner: "o", repo: "r", branch: "feature", pfad: "attesta/notfaelle/x.yaml" }, "neu", "notfall: x");
  const schreibaufruf = aufrufe.find((a: any) => a.art === "createOrUpdateFileContents") as any;
  assert.equal(schreibaufruf.sha, "abc123");
});

test("REQ-23: ladeKonfiguration liefert den Standard, wenn attesta.yml fehlt", () => {
  const konfiguration = ladeKonfiguration(join(tmpdir(), "attesta-nicht-vorhanden.yml"));
  assert.deepEqual(konfiguration, KONFIGURATION_STANDARD);
});

test("REQ-23: ladeKonfiguration liest den Beobachtungsmodus aus attesta.yml", () => {
  const verzeichnis = mkdtempSync(join(tmpdir(), "attesta-konfiguration-test-"));
  const pfad = join(verzeichnis, "attesta.yml");
  try {
    writeFileSync(pfad, "beobachtungsmodus: true\n", "utf-8");
    assert.deepEqual(ladeKonfiguration(pfad), { beobachtungsmodus: true });
  } finally {
    rmSync(verzeichnis, { recursive: true, force: true });
  }
});
