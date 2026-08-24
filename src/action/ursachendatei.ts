/**
 * Datenmodell der Ursachendatei, REQ-27, GR-9.1/GR-9.2, K3: der Wert
 * "wollen" ist eine Aussage ueber einen benannten Menschen. Nach der
 * Entscheidung vom 24.08.2026 wird gesetzt_von auch bei "wollen" gefuellt
 * (REQ-31 Abnahme 2, "namentlich dem Reviewer zugeordnet"). Die
 * Aufbewahrungsfrist fuer diese Dateien bleibt offen, siehe D2-13.
 */
import { URSACHEN } from "../gemeinsam/ursachen.generated";

export type UrsachenKennung = (typeof URSACHEN)[number]["kennung"];

/** REQ-31: "wollen" darf nie ein Vorschlag sein. Typebene, nicht nur Laufzeitpruefung. */
export type VorschlagbareKennung = Exclude<UrsachenKennung, "wollen">;

const ZULAESSIGE_WERTE: readonly string[] = URSACHEN.map((ursache) => ursache.kennung);
const VORSCHLAGBARE_WERTE: readonly string[] = ZULAESSIGE_WERTE.filter((wert) => wert !== "wollen");

export function istZulaessigerWert(wert: string): wert is UrsachenKennung {
  return ZULAESSIGE_WERTE.includes(wert);
}

export function istVorschlagbarerWert(wert: string): wert is VorschlagbareKennung {
  return VORSCHLAGBARE_WERTE.includes(wert);
}

export interface Ursachendatei {
  vorgang: string;
  wert: UrsachenKennung;
  zeitpunkt: string;
  gesetzt_von: string;
  vorschlag?: VorschlagbareKennung;
  uebernommen: boolean;
}

export function pfadFuerUrsache(vorgang: string, zeitpunkt: string): string {
  return `attesta/ursachen/${vorgang}-${zeitpunkt.replace(/[:.]/g, "-")}.yaml`;
}

export function erzeugeUrsachendatei(params: {
  vorgang: string;
  wert: UrsachenKennung;
  zeitpunkt: Date;
  gesetztVon: string;
  vorschlag?: VorschlagbareKennung;
}): Ursachendatei {
  return {
    vorgang: params.vorgang,
    wert: params.wert,
    zeitpunkt: params.zeitpunkt.toISOString(),
    gesetzt_von: params.gesetztVon,
    vorschlag: params.vorschlag,
    uebernommen: params.vorschlag !== undefined && params.vorschlag === params.wert,
  };
}

/**
 * REQ-30 GR-9.5: Beobachtungsgroesse, keine Zielgroesse im Regelset. Reine
 * Funktion ueber bereits gelesene Ursachendateien; das Einsammeln der
 * Dateien fuer den Monatsbericht gehoert Arbeitspaket 14.
 */
export function berechneUebernahmequote(ursachen: Ursachendatei[]): number | null {
  const mitVorschlag = ursachen.filter((ursache) => ursache.vorschlag !== undefined);
  if (mitVorschlag.length === 0) return null;
  const uebernommen = mitVorschlag.filter((ursache) => ursache.uebernommen).length;
  return uebernommen / mitVorschlag.length;
}
