import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { API_BASISURL, erzeugeOctokit } from "../src/action/github";

test("REQ-17: die Basis-URL ist fest auf api.github.com gesetzt", () => {
  assert.equal(API_BASISURL, "https://api.github.com");
});

test("REQ-17: erzeugeOctokit ignoriert eine abweichende GITHUB_API_URL aus der Umgebung", () => {
  const vorher = process.env.GITHUB_API_URL;
  process.env.GITHUB_API_URL = "https://andere-plattform.example/api/v3";
  try {
    const octokit = erzeugeOctokit("dummy-token");
    const baseUrl = (octokit.request.endpoint.DEFAULTS as { baseUrl: string }).baseUrl;
    assert.equal(baseUrl, "https://api.github.com");
  } finally {
    if (vorher === undefined) delete process.env.GITHUB_API_URL;
    else process.env.GITHUB_API_URL = vorher;
  }
});

test("REQ-17: kein Modul unter src/action ruft fetch, http oder https direkt auf (nur github.ts darf einen Client erzeugen)", () => {
  const verzeichnis = join(__dirname, "..", "src", "action");
  const verbotenesMuster = /\b(fetch\(|require\(["']node:https?["']\)|from ["']node:https?["']|require\(["']https?["']\)|from ["']https?["'])/;
  for (const datei of readdirSync(verzeichnis)) {
    if (!datei.endsWith(".ts") || datei === "github.ts") continue;
    const inhalt = readFileSync(join(verzeichnis, datei), "utf-8");
    assert.doesNotMatch(inhalt, verbotenesMuster, `${datei} ruft Netzfunktionen direkt auf, statt ueber github.ts zu gehen`);
  }
});
