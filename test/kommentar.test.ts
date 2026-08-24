import { test } from "node:test";
import assert from "node:assert/strict";
import { MARKE, schreibeFestenKommentar, type KommentarClient } from "../src/action/kommentar";

function erzeugeFakeClient(vorhandeneKommentare: Array<{ id: number; body?: string }>) {
  const aufrufe: string[] = [];
  const client: KommentarClient = {
    rest: {
      issues: {
        async listComments() {
          aufrufe.push("listComments");
          return { data: vorhandeneKommentare };
        },
        async updateComment(params) {
          aufrufe.push(`updateComment:${params.comment_id}`);
          const eintrag = vorhandeneKommentare.find((k) => k.id === params.comment_id);
          if (eintrag) eintrag.body = params.body;
        },
        async createComment(params) {
          aufrufe.push("createComment");
          const neu = { id: 999, body: params.body };
          vorhandeneKommentare.push(neu);
          return { data: { id: neu.id } };
        },
      },
    },
  };
  return { client, aufrufe };
}

test("REQ-18: ohne vorhandenen Kommentar wird einer angelegt, mit Marke", async () => {
  const { client, aufrufe } = erzeugeFakeClient([]);
  const id = await schreibeFestenKommentar(client, { owner: "o", repo: "r", pullNummer: 1 }, "Inhalt");
  assert.equal(id, 999);
  assert.deepEqual(aufrufe, ["listComments", "createComment"]);
});

test("REQ-18: ein vorhandener Kommentar mit Marke wird ueberschrieben, kein zweiter angelegt", async () => {
  const { client, aufrufe } = erzeugeFakeClient([
    { id: 5, body: `alter Inhalt\n\n${MARKE}` },
    { id: 6, body: "fremder Kommentar ohne Marke" },
  ]);
  const id = await schreibeFestenKommentar(client, { owner: "o", repo: "r", pullNummer: 1 }, "neuer Inhalt");
  assert.equal(id, 5);
  assert.deepEqual(aufrufe, ["listComments", "updateComment:5"]);
});
