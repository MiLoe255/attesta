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
import { ladeYamlDateien } from "./verzeichnislistung";
import { REIFE_HISTORIE } from "../gemeinsam/delegationsreife.generated";
import type { Notfall } from "./notfall";
import type { Ursachendatei } from "./ursachendatei";

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
async function holeGemergteNummern(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<number[]> {
  const { data: liste } = await client.rest.pulls.list({ owner: ziel.owner, repo: ziel.repo, state: "closed", per_page: STICHPROBENGROESSE, sort: "updated", direction: "desc" });
  return liste.filter((pr) => pr.merged_at).map((pr) => pr.number);
}

/**
 * Stufe 4, D3-26 entschieden am 25.08.2026: eine feste Zahl gemergter
 * Arbeitspakete in Folge ohne Notfall und ohne Ursachencode
 * werkzeugfehler. Reicht die Historie nicht aus, gilt die Bedingung als
 * nicht belegt, nicht als erfuellt.
 */
async function ermittleStufe4(client: ErmittlungsClient, ziel: ErmittlungsZiel, gemergteNummern: number[]): Promise<StufenBedingungen["stufe4"]> {
  const benoetigt = REIFE_HISTORIE.arbeitspakete_in_folge;
  if (gemergteNummern.length < benoetigt) return { historieNachgewiesen: false };
  const betrachtet = gemergteNummern.slice(0, benoetigt);

  const [notfaelle, ursachen] = await Promise.all([
    ladeYamlDateien<Notfall>(client, ziel, "attesta/notfaelle"),
    ladeYamlDateien<Ursachendatei>(client, ziel, "attesta/ursachen"),
  ]);

  const mitNotfall = new Set(notfaelle.map((notfall) => notfall.pull_request));
  const mitWerkzeugfehler = new Set(
    ursachen.filter((u) => u.wert === "werkzeugfehler").map((u) => Number(u.vorgang.replace(/^pr-/, "")))
  );

  const sauber = betrachtet.every(
    (nummer) => (!REIFE_HISTORIE.ohne_notfall || !mitNotfall.has(nummer)) && (!REIFE_HISTORIE.ohne_werkzeugfehler || !mitWerkzeugfehler.has(nummer))
  );
  return { historieNachgewiesen: sauber };
}

async function ermittleStufe2(client: ErmittlungsClient, ziel: ErmittlungsZiel, gemergteNummern: number[]): Promise<StufenBedingungen["stufe2"]> {
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

/** Ein Verzeichnis zaehlt nur als vorhanden, wenn es mindestens eine Datei enthaelt. */
async function enthaeltDateien(client: ErmittlungsClient, ziel: ErmittlungsZiel, pfad: string): Promise<boolean> {
  try {
    const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: pfad, ref: ziel.branch });
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

async function ermittleStufe3(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<StufenBedingungen["stufe3"]> {
  const workflowVerzeichnis = await enthaeltDateien(client, ziel, ".github/workflows");
  const [claudeMd, agentsMd, gate3Durchlaufen] = await Promise.all([
    existiertDatei(client, ziel, "CLAUDE.md"),
    existiertDatei(client, ziel, "AGENTS.md"),
    existiertDatei(client, ziel, GATE3_PFAD),
  ]);
  const leitplankenMaschinenlesbar = workflowVerzeichnis && (claudeMd || agentsMd);

  return { leitplankenMaschinenlesbar, gate3Durchlaufen };
}

export async function ermittleStufenBedingungen(client: ErmittlungsClient, ziel: ErmittlungsZiel): Promise<StufenBedingungen> {
  const gemergteNummern = await holeGemergteNummern(client, ziel);
  const [stufe1, stufe2, stufe3, stufe4] = await Promise.all([
    ermittleStufe1(client, ziel),
    ermittleStufe2(client, ziel, gemergteNummern),
    ermittleStufe3(client, ziel),
    ermittleStufe4(client, ziel, gemergteNummern),
  ]);
  return { stufe1, stufe2, stufe3, stufe4 };
}
