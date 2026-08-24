/**
 * Ablage und Lesen der Notfalldateien im Kundenrepository. Die reine
 * Logik (Frist, Zustand, Zaehler) steht in notfall.ts, hier nur die
 * Ein-/Ausgabe darauf aufgesetzt.
 */
import { dump } from "js-yaml";
import { legeDateiAb, type DateiablageClient } from "./dateiablage";
import { ladeYamlDateien, type VerzeichnisZiel } from "./verzeichnislistung";
import { istAktiv, pfadFuerNotfall, type Notfall } from "./notfall";

export type NotfallZiel = VerzeichnisZiel;

const NOTFALL_VERZEICHNIS = "attesta/notfaelle";

export async function schreibeNotfall(client: DateiablageClient, ziel: NotfallZiel, notfall: Notfall): Promise<string> {
  const pfad = pfadFuerNotfall(notfall);
  await legeDateiAb(client, { ...ziel, pfad }, dump(notfall, { lineWidth: -1 }), `Notfall ausgerufen fuer PR #${notfall.pull_request}`);
  return pfad;
}

/** Alle Notfaelle des Repositorys, ungefiltert. Fuer den Monatsbericht (Arbeitspaket 14). */
export async function ladeAlleNotfaelle(client: DateiablageClient, ziel: NotfallZiel): Promise<Notfall[]> {
  return ladeYamlDateien<Notfall>(client, ziel, NOTFALL_VERZEICHNIS);
}

/** Alle noch aktiven (nicht nachdokumentierten) Notfaelle eines Pull Requests. */
export async function ladeOffeneNotfaelle(client: DateiablageClient, ziel: NotfallZiel, pullNummer: number): Promise<Notfall[]> {
  const alle = await ladeAlleNotfaelle(client, ziel);
  return alle.filter((notfall) => notfall.pull_request === pullNummer && istAktiv(notfall, new Date()));
}
