import { test } from "node:test";
import assert from "node:assert/strict";
import { erzeugeCheckRun, type CheckRunClient } from "../src/action/checkrun";

test("REQ-19: erzeugt genau einen Check-Run mit Namen attesta und passender Konklusion", async () => {
  const aufrufe: unknown[] = [];
  const client: CheckRunClient = {
    rest: {
      checks: {
        async create(params) {
          aufrufe.push(params);
          return { data: { id: 42 } };
        },
      },
    },
  };
  const id = await erzeugeCheckRun(client, { owner: "o", repo: "r", sha: "abc" }, { zustand: "neutral", titel: "T", zusammenfassung: "Z" });
  assert.equal(id, 42);
  assert.equal(aufrufe.length, 1);
  assert.deepEqual(aufrufe[0], {
    owner: "o",
    repo: "r",
    head_sha: "abc",
    name: "attesta",
    status: "completed",
    conclusion: "neutral",
    output: { title: "T", summary: "Z" },
  });
});

test("die Zustaende erfolg/fehlschlag/neutral/unbekannt bilden auf gueltige API-Konklusionen ab", async () => {
  const konklusionen: string[] = [];
  const client: CheckRunClient = {
    rest: {
      checks: {
        async create(params) {
          konklusionen.push(params.conclusion);
          return { data: { id: 1 } };
        },
      },
    },
  };
  for (const zustand of ["erfolg", "fehlschlag", "neutral", "unbekannt"] as const) {
    await erzeugeCheckRun(client, { owner: "o", repo: "r", sha: "s" }, { zustand, titel: "t", zusammenfassung: "z" });
  }
  assert.deepEqual(konklusionen, ["success", "failure", "neutral", "neutral"]);
});
