/**
 * Prueft, ob eine Person Freigaberecht hat, REQ-31: der Wert "wollen"
 * darf nur von einer Person mit Freigaberecht gesetzt werden. Fragt die
 * tatsaechliche Kollaborateur-Berechtigung ab statt der author_association
 * des Kommentars, weil die Person, die ein Ankreuzfeld anklickt oder einen
 * Befehl tippt, nicht die urspruengliche Kommentarautorin sein muss.
 */
export type Berechtigungsstufe = "admin" | "write" | "read" | "none";

const FREIGABESTUFEN = new Set<Berechtigungsstufe>(["admin", "write"]);

export function hatFreigaberecht(stufe: Berechtigungsstufe): boolean {
  return FREIGABESTUFEN.has(stufe);
}

/** Minimale Schnittstelle des Octokit-Clients, die dieses Modul braucht. Testbar ohne echten Client. */
export interface FreigabeClient {
  rest: {
    repos: {
      getCollaboratorPermissionLevel(params: {
        owner: string;
        repo: string;
        username: string;
      }): Promise<{ data: { permission: string } }>;
    };
  };
}

export async function ermittleFreigaberecht(client: FreigabeClient, owner: string, repo: string, username: string): Promise<boolean> {
  const { data } = await client.rest.repos.getCollaboratorPermissionLevel({ owner, repo, username });
  return hatFreigaberecht(data.permission as Berechtigungsstufe);
}
