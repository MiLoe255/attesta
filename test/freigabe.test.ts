import { test } from "node:test";
import assert from "node:assert/strict";
import { ermittleFreigaberecht, hatFreigaberecht, type FreigabeClient } from "../src/action/freigabe";

test("REQ-31: admin und write gelten als Freigaberecht, read und none nicht", () => {
  assert.equal(hatFreigaberecht("admin"), true);
  assert.equal(hatFreigaberecht("write"), true);
  assert.equal(hatFreigaberecht("read"), false);
  assert.equal(hatFreigaberecht("none"), false);
});

test("ermittleFreigaberecht fragt die tatsaechliche Kollaborateur-Berechtigung ab", async () => {
  const client: FreigabeClient = {
    rest: {
      repos: {
        async getCollaboratorPermissionLevel(params) {
          return { data: { permission: params.username === "reviewerin" ? "write" : "read" } };
        },
      },
    },
  };
  assert.equal(await ermittleFreigaberecht(client, "o", "r", "reviewerin"), true);
  assert.equal(await ermittleFreigaberecht(client, "o", "r", "aussenstehende"), false);
});
