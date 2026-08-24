/** Schreibt und liest Ursachendateien im Kundenrepository. Ein-/Ausgabe auf ursachendatei.ts aufgesetzt. */
import { dump } from "js-yaml";
import { legeDateiAb, type DateiablageClient } from "./dateiablage";
import { ladeYamlDateien, type VerzeichnisZiel } from "./verzeichnislistung";
import { pfadFuerUrsache, type Ursachendatei } from "./ursachendatei";

export type UrsacheZiel = VerzeichnisZiel;

const URSACHEN_VERZEICHNIS = "attesta/ursachen";

export async function schreibeUrsache(client: DateiablageClient, ziel: UrsacheZiel, ursache: Ursachendatei): Promise<string> {
  const pfad = pfadFuerUrsache(ursache.vorgang, ursache.zeitpunkt);
  await legeDateiAb(client, { ...ziel, pfad }, dump(ursache, { lineWidth: -1 }), `Ursachencode gesetzt: ${ursache.wert} fuer ${ursache.vorgang}`);
  return pfad;
}

/** Alle Ursachendateien des Repositorys, ungefiltert. Fuer den Monatsbericht (Arbeitspaket 14). */
export async function ladeAlleUrsachen(client: DateiablageClient, ziel: UrsacheZiel): Promise<Ursachendatei[]> {
  return ladeYamlDateien<Ursachendatei>(client, ziel, URSACHEN_VERZEICHNIS);
}
