/** Schreibt das Gate-3-Attest ins Kundenrepository, ueber den Dateiablage-Baustein aus Arbeitspaket 9. */
import { dump } from "js-yaml";
import { legeDateiAb, type DateiablageClient, type DateiZiel } from "./dateiablage";
import { GATE3_PFAD, type Gate3Attest } from "./gate3";

export async function schreibeGate3Attest(client: DateiablageClient, ziel: Omit<DateiZiel, "pfad">, attest: Gate3Attest): Promise<void> {
  await legeDateiAb(client, { ...ziel, pfad: GATE3_PFAD }, dump(attest, { lineWidth: -1 }), `Gate 3 bestaetigt von ${attest.bestaetigt_von}`);
}
