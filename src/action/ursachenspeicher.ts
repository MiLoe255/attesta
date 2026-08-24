/** Schreibt eine Ursachendatei ins Kundenrepository. Ein-/Ausgabe auf ursachendatei.ts aufgesetzt. */
import { dump } from "js-yaml";
import { legeDateiAb, type DateiablageClient } from "./dateiablage";
import { pfadFuerUrsache, type Ursachendatei } from "./ursachendatei";

export interface UrsacheZiel {
  owner: string;
  repo: string;
  branch: string;
}

export async function schreibeUrsache(client: DateiablageClient, ziel: UrsacheZiel, ursache: Ursachendatei): Promise<string> {
  const pfad = pfadFuerUrsache(ursache.vorgang, ursache.zeitpunkt);
  await legeDateiAb(client, { ...ziel, pfad }, dump(ursache, { lineWidth: -1 }), `Ursachencode gesetzt: ${ursache.wert} fuer ${ursache.vorgang}`);
  return pfad;
}
