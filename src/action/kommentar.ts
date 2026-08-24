/**
 * Der feste Kommentar ueber eine Marke, REQ-18, GR-6.3. Genau ein
 * Kommentar je Pull Request, bei jedem Lauf gefunden und ueberschrieben.
 */
export const MARKE = "<!-- attesta:v1 -->";

export interface KommentarZiel {
  owner: string;
  repo: string;
  pullNummer: number;
}

/** Minimale Schnittstelle des Octokit-Clients, die dieses Modul braucht. Testbar ohne echten Client. */
export interface KommentarClient {
  rest: {
    issues: {
      listComments(params: {
        owner: string;
        repo: string;
        issue_number: number;
        per_page: number;
      }): Promise<{ data: Array<{ id: number; body?: string | null }> }>;
      updateComment(params: { owner: string; repo: string; comment_id: number; body: string }): Promise<unknown>;
      createComment(params: { owner: string; repo: string; issue_number: number; body: string }): Promise<{
        data: { id: number };
      }>;
    };
  };
}

export async function findeFestenKommentar(
  client: KommentarClient,
  ziel: KommentarZiel
): Promise<{ id: number; body?: string | null } | undefined> {
  const { data } = await client.rest.issues.listComments({
    owner: ziel.owner,
    repo: ziel.repo,
    issue_number: ziel.pullNummer,
    per_page: 100,
  });
  return data.find((kommentar) => kommentar.body?.includes(MARKE));
}

/** Erzeugt oder ueberschreibt den festen Kommentar. Gibt die Kommentar-ID zurueck. */
export async function schreibeFestenKommentar(client: KommentarClient, ziel: KommentarZiel, inhalt: string): Promise<number> {
  const body = inhalt.includes(MARKE) ? inhalt : `${inhalt}\n\n${MARKE}`;
  const vorhanden = await findeFestenKommentar(client, ziel);

  if (vorhanden) {
    await client.rest.issues.updateComment({
      owner: ziel.owner,
      repo: ziel.repo,
      comment_id: vorhanden.id,
      body,
    });
    return vorhanden.id;
  }

  const { data } = await client.rest.issues.createComment({
    owner: ziel.owner,
    repo: ziel.repo,
    issue_number: ziel.pullNummer,
    body,
  });
  return data.id;
}
