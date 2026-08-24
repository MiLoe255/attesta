/**
 * Ablage und Lesen der Notfalldateien im Kundenrepository. Die reine
 * Logik (Frist, Zustand, Zaehler) steht in notfall.ts, hier nur die
 * Ein-/Ausgabe darauf aufgesetzt.
 */
import { dump, load } from "js-yaml";
import { legeDateiAb, type DateiablageClient } from "./dateiablage";
import { istAktiv, pfadFuerNotfall, type Notfall } from "./notfall";

export interface NotfallZiel {
  owner: string;
  repo: string;
  branch: string;
}

export async function schreibeNotfall(client: DateiablageClient, ziel: NotfallZiel, notfall: Notfall): Promise<string> {
  const pfad = pfadFuerNotfall(notfall);
  await legeDateiAb(client, { ...ziel, pfad }, dump(notfall, { lineWidth: -1 }), `Notfall ausgerufen fuer PR #${notfall.pull_request}`);
  return pfad;
}

interface VerzeichnisEintrag {
  name: string;
  path: string;
  type: string;
}

/** Alle noch aktiven (nicht nachdokumentierten) Notfaelle eines Pull Requests. */
export async function ladeOffeneNotfaelle(client: DateiablageClient, ziel: NotfallZiel, pullNummer: number): Promise<Notfall[]> {
  let eintraege: VerzeichnisEintrag[];
  try {
    const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: "attesta/notfaelle", ref: ziel.branch });
    if (!Array.isArray(data)) return [];
    eintraege = data as VerzeichnisEintrag[];
  } catch {
    return [];
  }

  const notfaelle: Notfall[] = [];
  for (const eintrag of eintraege) {
    if (eintrag.type !== "file" || !eintrag.name.startsWith(`pr-${pullNummer}-`)) continue;
    const { data } = await client.rest.repos.getContent({ owner: ziel.owner, repo: ziel.repo, path: eintrag.path, ref: ziel.branch });
    const inhalt = data as { content?: string };
    if (!inhalt.content) continue;
    const geparst = load(Buffer.from(inhalt.content, "base64").toString("utf-8"));
    if (geparst && typeof geparst === "object") notfaelle.push(geparst as Notfall);
  }
  return notfaelle.filter((notfall) => istAktiv(notfall, new Date()));
}
