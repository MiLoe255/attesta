/**
 * Delegationsreife, REQ-32, REQ-33, SPEC-10. Reine Funktionen: nehmen
 * bereits ermittelte Bedingungen entgegen und liefern die Stufe
 * beziehungsweise die zulaessige Delegation. Die Ermittlung der
 * Bedingungen selbst (Repository-Zugriffe) steht in
 * src/action/delegationsreife-ermittlung.ts.
 *
 * Stufe 4 ist seit dem 25.08.2026 entschieden (vorher D3-26 gesperrt):
 * sie verlangt zusaetzlich zu Stufe 3 eine belegte Historie, naemlich
 * eine feste Zahl gemergter Arbeitspakete in Folge ohne Notfall und ohne
 * Ursachencode werkzeugfehler. Die Zahl steht in
 * rules/delegationsreife.yaml und ist gesetzt, nicht gemessen: sie
 * gehoert nach dem ersten Pilotbetrieb kalibriert.
 */
import { REIFE_HISTORIE } from "./delegationsreife.generated";

export type DelegationsreifeStufe = 1 | 2 | 3 | 4;
export type SStufe = "S1" | "S2" | "S3" | "S4";

const S_RANG: Record<SStufe, number> = { S1: 1, S2: 2, S3: 3, S4: 4 };

export function minimumSStufe(a: SStufe, b: SStufe): SStufe {
  return S_RANG[a] <= S_RANG[b] ? a : b;
}

export interface StufenBedingungen {
  stufe1: { profilVorhanden: boolean; issueFormularVorhanden: boolean };
  stufe2: { pruefungenVerbindlich: boolean; vierAugenBelegt: boolean; keinSelbstMerge: boolean };
  stufe3: { leitplankenMaschinenlesbar: boolean; gate3Durchlaufen: boolean };
  stufe4: { historieNachgewiesen: boolean };
}

export interface DelegationsreifeErgebnis {
  stufe: DelegationsreifeStufe;
  fehlend: string[];
}

/**
 * GR-10.1: die Stufe ist die hoechste, deren Bedingungen vollstaendig
 * erfuellt sind, eine teilweise erfuellte Stufe zaehlt nicht. GR-10.2
 * (Leitplanken fehlen -> hoechstens Stufe 2) folgt daraus von selbst,
 * weil Stufe 3 die Leitplanken-Bedingung als eine von zwei verlangt.
 * REQ-32 legt die Spanne auf eins bis vier fest, Stufe 1 ist also immer
 * die Talsohle, auch wenn ihre eigenen Bedingungen fehlen
 * (Fehlerverhalten SPEC-10: "Bedingungen nicht auswertbar -> Stufe 1,
 * Hinweis auf die fehlende Angabe").
 */
export function bestimmeDelegationsreife(b: StufenBedingungen): DelegationsreifeErgebnis {
  const fehlend: string[] = [];
  if (!b.stufe1.profilVorhanden) fehlend.push("Profil (attesta/profil/)");
  if (!b.stufe1.issueFormularVorhanden) fehlend.push("Issue-Formular (.github/ISSUE_TEMPLATE/arbeitspaket.yml)");
  const stufe1 = b.stufe1.profilVorhanden && b.stufe1.issueFormularVorhanden;

  if (!b.stufe2.pruefungenVerbindlich) fehlend.push("verbindliche Pruefungen (Indiz aus PR-Historie)");
  if (!b.stufe2.vierAugenBelegt) fehlend.push("belegte Vier-Augen-Freigabe");
  if (!b.stufe2.keinSelbstMerge) fehlend.push("kein Selbst-Merge");
  const stufe2 = stufe1 && b.stufe2.pruefungenVerbindlich && b.stufe2.vierAugenBelegt && b.stufe2.keinSelbstMerge;

  if (!b.stufe3.leitplankenMaschinenlesbar) fehlend.push("maschinenlesbare Leitplanken");
  if (!b.stufe3.gate3Durchlaufen) fehlend.push("durchlaufenes Gate 3 (Selbstauskunft ueber /attesta gate3 bestanden <Begruendung>)");
  const stufe3 = stufe2 && b.stufe3.leitplankenMaschinenlesbar && b.stufe3.gate3Durchlaufen;

  if (!b.stufe4.historieNachgewiesen) {
    fehlend.push(`belegte Historie (${REIFE_HISTORIE.arbeitspakete_in_folge} Arbeitspakete in Folge ohne Notfall und ohne Werkzeugfehler)`);
  }
  const stufe4 = stufe3 && b.stufe4.historieNachgewiesen;

  const stufe: DelegationsreifeStufe = stufe4 ? 4 : stufe3 ? 3 : stufe2 ? 2 : 1;
  return { stufe, fehlend };
}

export interface DelegationsPruefung {
  angefragt: SStufe;
  reifeGrenze: SStufe;
  matrixGrenze: SStufe;
  zulaessig: SStufe;
  akzeptiert: boolean;
}

/** REQ-33 GR-10.3: das Minimum aus Stufe und Matrixobergrenze. Reife 1 bis 3 traegt bis S1 bis S3, siehe Stufenmodell. */
export function bestimmeZulaessigeDelegation(angefragt: SStufe, reife: DelegationsreifeStufe, matrixObergrenze: SStufe): DelegationsPruefung {
  const reifeGrenze = (`S${reife}`) as SStufe;
  const zulaessig = minimumSStufe(reifeGrenze, matrixObergrenze);
  return { angefragt, reifeGrenze, matrixGrenze: matrixObergrenze, zulaessig, akzeptiert: S_RANG[angefragt] <= S_RANG[zulaessig] };
}

/** GR-10.4: die Ablehnung nennt beide Grenzen und die engere davon. */
export function formatierePruefung(p: DelegationsPruefung): string {
  if (p.akzeptiert) return `${p.angefragt} akzeptiert (zulaessig bis ${p.zulaessig}).`;
  const engere = p.reifeGrenze === p.zulaessig ? "Delegationsreife" : "K-mal-S-Matrix";
  return `${p.angefragt} abgelehnt. Delegationsreife erlaubt bis ${p.reifeGrenze}, K-mal-S-Matrix erlaubt bis ${p.matrixGrenze}, engere Grenze: ${engere} (${p.zulaessig}).`;
}
