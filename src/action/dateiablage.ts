/**
 * Legt eine Datei im Kundenrepository ab, ueber die Contents API auf dem
 * Kopf-Branch des Pull Requests. Kein direkter Commit auf den Hauptzweig
 * (Leitfaden Abschnitt 8, hartes Verbot) und keine eigene PR fuer eine
 * einzelne kleine Datei: der Commit landet auf demselben Branch, auf den
 * die Entwicklerin ohnehin schon pusht, und wird dort mitbegutachtet.
 * Gemeinsamer Baustein fuer die Notfalldatei (REQ-22) und spaeter die
 * Ursachendatei (REQ-27).
 */
export interface DateiZiel {
  owner: string;
  repo: string;
  branch: string;
  pfad: string;
}

/** Minimale Schnittstelle des Octokit-Clients, die dieses Modul braucht. Testbar ohne echten Client. */
export interface DateiablageClient {
  rest: {
    repos: {
      getContent(params: { owner: string; repo: string; path: string; ref: string }): Promise<{ data: unknown }>;
      createOrUpdateFileContents(params: {
        owner: string;
        repo: string;
        path: string;
        branch: string;
        message: string;
        content: string;
        sha?: string;
      }): Promise<unknown>;
    };
  };
}

async function findeVorhandeneSha(client: DateiablageClient, ziel: DateiZiel): Promise<string | undefined> {
  try {
    const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: ziel.pfad, ref: ziel.branch });
    return (data as { sha?: string }).sha;
  } catch {
    return undefined;
  }
}

export async function legeDateiAb(client: DateiablageClient, ziel: DateiZiel, inhalt: string, commitNachricht: string): Promise<void> {
  const sha = await findeVorhandeneSha(client, ziel);
  await client.rest.repos.createOrUpdateFileContents({
    owner: ziel.owner,
    repo: ziel.repo,
    path: ziel.pfad,
    branch: ziel.branch,
    message: commitNachricht,
    content: Buffer.from(inhalt, "utf-8").toString("base64"),
    sha,
  });
}
