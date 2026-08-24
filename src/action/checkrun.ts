/**
 * Genau ein Check-Run je Lauf, REQ-19, GR-6.4. Der Zustand `unbekannt`
 * deckt "System antwortet nicht" ab und wird als `neutral` gemeldet,
 * damit ein Ausfall beim Betreiber den Bau beim Kunden nicht anhaelt.
 */
export type CheckZustand = "erfolg" | "fehlschlag" | "neutral" | "unbekannt";

const KONKLUSION: Record<CheckZustand, "success" | "failure" | "neutral"> = {
  erfolg: "success",
  fehlschlag: "failure",
  neutral: "neutral",
  unbekannt: "neutral",
};

export interface CheckRunZiel {
  owner: string;
  repo: string;
  sha: string;
}

export interface CheckRunInhalt {
  zustand: CheckZustand;
  titel: string;
  zusammenfassung: string;
}

/** Minimale Schnittstelle des Octokit-Clients, die dieses Modul braucht. Testbar ohne echten Client. */
export interface CheckRunClient {
  rest: {
    checks: {
      create(params: {
        owner: string;
        repo: string;
        head_sha: string;
        name: string;
        status: "completed";
        conclusion: "success" | "failure" | "neutral";
        output: { title: string; summary: string };
      }): Promise<{ data: { id: number } }>;
    };
  };
}

export async function erzeugeCheckRun(client: CheckRunClient, ziel: CheckRunZiel, inhalt: CheckRunInhalt): Promise<number> {
  const { data } = await client.rest.checks.create({
    owner: ziel.owner,
    repo: ziel.repo,
    head_sha: ziel.sha,
    name: "attesta",
    status: "completed",
    conclusion: KONKLUSION[inhalt.zustand],
    output: { title: inhalt.titel, summary: inhalt.zusammenfassung },
  });
  return data.id;
}
