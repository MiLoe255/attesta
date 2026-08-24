/**
 * Einzige Stelle, die einen GitHub-API-Client erzeugt, REQ-17. Die
 * Basis-URL ist fest auf api.github.com gesetzt und wird nicht aus der
 * Umgebung uebernommen (kein GHES-Support geplant). Jeder andere Aufruf
 * im Action-Code muss ueber den hier erzeugten Client laufen, siehe
 * test/github.test.ts fuer die strukturelle Pruefung, dass kein Modul
 * unter src/action direkt fetch/http/https verwendet.
 */
import { getOctokit } from "@actions/github";

export const API_BASISURL = "https://api.github.com";

export function erzeugeOctokit(token: string) {
  return getOctokit(token, { baseUrl: API_BASISURL });
}

export type Octokit = ReturnType<typeof erzeugeOctokit>;
