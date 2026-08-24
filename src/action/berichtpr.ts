/**
 * Reicht den Monatsbericht als Pull Request ein, REQ-37, GR-12.2/GR-12.5.
 * Kein direkter Commit in den Hauptzweig: die Datei landet auf einem
 * eigenen Branch je Monat, der wiederverwendet wird, solange der PR
 * offen ist, statt einen zweiten anzulegen.
 */
import { legeDateiAb, type DateiablageClient } from "./dateiablage";

export interface BerichtPrClient extends DateiablageClient {
  rest: DateiablageClient["rest"] & {
    git: {
      getRef(params: { owner: string; repo: string; ref: string }): Promise<{ data: { object: { sha: string } } }>;
      createRef(params: { owner: string; repo: string; ref: string; sha: string }): Promise<unknown>;
    };
    pulls: {
      list(params: { owner: string; repo: string; head: string; state: "open" }): Promise<{ data: Array<{ number: number }> }>;
      create(params: { owner: string; repo: string; title: string; head: string; base: string; body: string }): Promise<{ data: { number: number } }>;
    };
  };
}

export interface BerichtZiel {
  owner: string;
  repo: string;
  standardBranch: string;
}

export interface BerichtErgebnis {
  branch: string;
  prNummer: number;
  neu: boolean;
}

export function berichtsbranch(monat: string): string {
  return `attesta/bericht-${monat}`;
}

async function existiertBranch(client: BerichtPrClient, owner: string, repo: string, branch: string): Promise<boolean> {
  try {
    await client.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
    return true;
  } catch {
    return false;
  }
}

async function stelleBranchSicher(client: BerichtPrClient, ziel: BerichtZiel, branch: string): Promise<void> {
  if (await existiertBranch(client, ziel.owner, ziel.repo, branch)) return;
  const { data } = await client.rest.git.getRef({ owner: ziel.owner, repo: ziel.repo, ref: `heads/${ziel.standardBranch}` });
  await client.rest.git.createRef({ owner: ziel.owner, repo: ziel.repo, ref: `refs/heads/${branch}`, sha: data.object.sha });
}

export async function stelleBerichtBereit(client: BerichtPrClient, ziel: BerichtZiel, monat: string, inhalt: string): Promise<BerichtErgebnis> {
  const branch = berichtsbranch(monat);
  await stelleBranchSicher(client, ziel, branch);
  await legeDateiAb(client, { owner: ziel.owner, repo: ziel.repo, branch, pfad: "attesta/BERICHT.md" }, inhalt, `Monatsbericht ${monat}`);

  const vorhandene = await client.rest.pulls.list({ owner: ziel.owner, repo: ziel.repo, head: `${ziel.owner}:${branch}`, state: "open" });
  if (vorhandene.data.length > 0) {
    return { branch, prNummer: vorhandene.data[0].number, neu: false };
  }

  const { data: pr } = await client.rest.pulls.create({
    owner: ziel.owner,
    repo: ziel.repo,
    title: `Attesta Zyklus: Monatsbericht ${monat}`,
    head: branch,
    base: ziel.standardBranch,
    body: "Automatisch erzeugter Monatsbericht. Siehe attesta/BERICHT.md.",
  });
  return { branch, prNummer: pr.number, neu: true };
}
