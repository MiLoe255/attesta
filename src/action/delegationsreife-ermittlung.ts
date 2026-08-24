/**
 * Ermittelt die Bedingungen fuer die Delegationsreife aus dem Repository,
 * REQ-32. Stufe 1 aus Dateipraesenz, Stufe 2 als Indiz aus der
 * PR-Historie (Entscheidung vom 24.08.2026: Branch-Protection-Abfrage
 * braeuchte administration: read, ein fuenftes Recht gegen REQ-16),
 * Stufe 3: "Leitplanken maschinenlesbar" ist pruefbar, "Gate 3
 * durchlaufen" hat keinen automatischen Nachweis und stuetzt sich auf
 * die Gate-3-Nachweis-Konvention (gate3.ts, Entscheidung vom
 * 24.08.2026): eine Selbstauskunft-Datei, kein objektiver Beleg.
 */
import type { StufenBedingungen } from "../gemeinsam/delegationsreife";
import { GATE3_PFAD } from "./gate3";

export interface ErmittlungsZiel {
  owner: string;
  repo: string;
  branch: string;
}

/** Minimale Schnittstelle des Octokit-Clients, die dieses Modul braucht. Testbar ohne echten Client. */
export interface ErmittlungsClient {
  rest: {
    repos: {
      getContent(params: { owner: string; repo: string; path: string; ref: string }): Promise<{ data: unknown }>;
    };
    pulls: {
      list(params: { owner: string; repo: string; state: "closed"; per_page: number; sort: "updated"; direction: "desc" }): Promise<{
        data: Array<{ number: number; merged_at: string | null }>;
      }>;
      get(params: { owner: string; repo: string; pull_number: number }): Promise<{
        data: { number: number; user: { login: string } | null; merged_at: string | null; merged_by: { login: string } | null; merge_commit_sha: string | null };
      }>;
      listReviews(params: { owner: string; repo: string; pull_number: number }): Promise<{ data: Array<{ state: string; user: { login: string } | null }> }>;
    };
    checks: {
      listForRef(params: { owner: string; repo: string; ref: string }): Promise<{ data: { check_runs: Array<{ conclusion: string | null }> } }>;
    };
  };
}

const STICHPROBENGROESSE = 10;
const MINDESTANZAHL_FUER_INDIZ = 3;

async function existiertDatei(client: ErmittlungsClient, ziel: ErmittlungsZiel, pfad: string): Promise<boolean> {
  try {
    await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: pfad, ref: ziel.branch });
    return true;
  } catch {
    return false;
  }
}

async function ermittleStufe1(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<StufenBedingungen["stufe1"]> {
  const [profilVorhanden, issueFormularVorhanden] = await Promise.all([
    existiertDatei(client, ziel, "attesta/profil.lock"),
    existiertDatei(client, ziel, ".github/ISSUE_TEMPLATE/arbeitspaket.yml"),
  ]);
  return { profilVorhanden, issueFormularVorhanden };
}

/**
 * Indiz statt Zusicherung: prueft die letzten gemergten Pull Requests.
 * Verlangt fuer jede Bedingung, dass ausnahmslos alle Stichproben sie
 * erfuellen; bei zu wenig Historie gilt die Bedingung als nicht belegt.
 */
async function ermittleStufe2(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<StufenBedingungen["stufe2"]> {
  const { data: liste } = await client.rest.pulls.list({ owner: ziel.owner, repo: ziel.repo, state: "closed", per_page: STICHPROBENGROESSE, sort: "updated", direction: "desc" });
  const gemergteNummern = liste.filter((pr) => pr.merged_at).map((pr) => pr.number);

  if (gemergteNummern.length < MINDESTANZAHL_FUER_INDIZ) {
    return { pruefungenVerbindlich: false, vierAugenBelegt: false, keinSelbstMerge: false };
  }

  // merged_by steht nicht in der Listenantwort, nur in der Einzelabfrage.
  const gemergte = await Promise.all(gemergteNummern.map((nummer) => client.rest.pulls.get({ owner: ziel.owner, repo: ziel.repo, pull_number: nummer }).then((r) => r.data)));

  let keinSelbstMerge = true;
  let vierAugenBelegt = true;
  let pruefungenVerbindlich = true;

  for (const pr of gemergte) {
    if (!pr.merged_by || pr.merged_by.login === pr.user?.login) keinSelbstMerge = false;

    const { data: reviews } = await client.rest.pulls.listReviews({ owner: ziel.owner, repo: ziel.repo, pull_number: pr.number });
    if (!reviews.some((r) => r.state === "APPROVED" && r.user?.login !== pr.user?.login)) vierAugenBelegt = false;

    const ref = pr.merge_commit_sha;
    if (!ref) {
      pruefungenVerbindlich = false;
      continue;
    }
    const { data: checks } = await client.rest.checks.listForRef({ owner: ziel.owner, repo: ziel.repo, ref });
    if (checks.check_runs.length === 0 || !checks.check_runs.every((c) => c.conclusion === "success")) {
      pruefungenVerbindlich = false;
    }
  }

  return { pruefungenVerbindlich, vierAugenBelegt, keinSelbstMerge };
}

async function ermittleStufe3(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<StufenBedingungen["stufe3"]> {
  const workflowVerzeichnis = await (async () => {
    try {
      const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: ".github/workflows", ref: ziel.branch });
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  })();
  const [claudeMd, agentsMd, gate3Durchlaufen] = await Promise.all([
    existiertDatei(client, ziel, "CLAUDE.md"),
    existiertDatei(client, ziel, "AGENTS.md"),
    existiertDatei(client, ziel, GATE3_PFAD),
  ]);
  const leitplankenMaschinenlesbar = workflowVerzeichnis && (claudeMd || agentsMd);

  return { leitplankenMaschinenlesbar, gate3Durchlaufen };
}

export async function ermittleStufenBedingungen(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<StufenBedingungen> {
  const [stufe1, stufe2, stufe3] = await Promise.all([ermittleStufe1(client, ziel), ermittleStufe2(client, ziel), ermittleStufe3(client, ziel)]);
  return { stufe1, stufe2, stufe3 };
}
