/**
 * Listet und liest alle YAML-Dateien eines Verzeichnisses im Kundenrepository.
 * Gemeinsamer Baustein fuer Notfall- und Ursachendateien, die beide unter
 * attesta/ als eine Datei je Vorgang abgelegt werden (REQ-22, REQ-27) und
 * fuer den Monatsbericht wieder eingesammelt werden muessen (Arbeitspaket 14).
 */
import { load } from "js-yaml";

export interface VerzeichnisZiel {
  owner: string;
  repo: string;
  branch: string;
}

export interface VerzeichnisClient {
  rest: {
    repos: {
      getContent(params: { owner: string; repo: string; path: string; ref: string }): Promise<{ data: unknown }>;
    };
  };
}

interface VerzeichnisEintrag {
  name: string;
  path: string;
  type: string;
}

export async function ladeYamlDateien<T>(client: VerzeichnisClient, ziel: VerzeichnisZiel, verzeichnis: string): Promise<T[]> {
  let eintraege: VerzeichnisEintrag[];
  try {
    const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: verzeichnis, ref: ziel.branch });
    if (!Array.isArray(data)) return [];
    eintraege = data as VerzeichnisEintrag[];
  } catch {
    return [];
  }

  const ergebnisse: T[] = [];
  for (const eintrag of eintraege) {
    if (eintrag.type !== "file") continue;
    const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: eintrag.path, ref: ziel.branch });
    const inhalt = data as { content?: string };
    if (!inhalt.content) continue;
    const geparst = load(Buffer.from(inhalt.content, "base64").toString("utf-8"));
    if (geparst && typeof geparst === "object") ergebnisse.push(geparst as T);
  }
  return ergebnisse;
}
