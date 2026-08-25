/**
 * Vergleicht das Kundenprofil gegen die installierte Profilbasis, SPEC-03.
 * Reine Funktionen, ohne Netzzugriff. Traeger fuer REQ-09 (Teilmengenpruefung
 * durch die Action, sobald der Kommentar-Mechanismus aus Arbeitspaket 7 bis 9
 * steht) und fuer die Auflistung bei einem Basiswechsel (REQ-10).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { pruefsumme, type ProfilBasis, type ProfilBasisDatei } from "./regelsatz";

export type ProfilZustand = "deckungsgleich" | "abgewichen" | "unbekannter_wert" | "basis_veraltet" | "unlesbar";

export interface ProfilBefund {
  dateiname: string;
  zustand: ProfilZustand;
  details?: string;
}

export interface LockEintrag {
  pruefsumme: string;
  basisversion: string;
  erzeugt_am: string;
}

export type Lock = Record<string, LockEintrag>;

function ohneKommentarzeilen(inhalt: string): string {
  return inhalt
    .split("\n")
    .filter((zeile) => !zeile.trimStart().startsWith("#"))
    .join("\n");
}

function sammleLeafWerte(knoten: unknown, ziel: Set<string>): void {
  if (knoten === null || knoten === undefined) return;
  if (Array.isArray(knoten)) {
    for (const eintrag of knoten) sammleLeafWerte(eintrag, ziel);
    return;
  }
  if (typeof knoten === "object") {
    for (const wert of Object.values(knoten as Record<string, unknown>)) sammleLeafWerte(wert, ziel);
    return;
  }
  ziel.add(String(knoten));
}

export function ladeLock(lockPfad: string): Lock {
  if (!existsSync(lockPfad)) return {};
  try {
    return (load(readFileSync(lockPfad, "utf-8")) as Lock) ?? {};
  } catch {
    return {};
  }
}

export function vergleicheDatei(params: {
  dateiname: string;
  profilInhalt: string | null;
  basisDatei: ProfilBasisDatei;
  lockEintrag: LockEintrag | undefined;
  aktuelleBasisversion: string;
}): ProfilBefund {
  const { dateiname, profilInhalt, basisDatei, lockEintrag, aktuelleBasisversion } = params;

  if (profilInhalt === null) {
    return { dateiname, zustand: "unlesbar", details: "Datei fehlt" };
  }

  let profilDaten: unknown;
  try {
    profilDaten = load(ohneKommentarzeilen(profilInhalt));
  } catch {
    return { dateiname, zustand: "unlesbar", details: "kein gueltiges YAML" };
  }
  if (profilDaten === null || typeof profilDaten !== "object") {
    return { dateiname, zustand: "unlesbar", details: "kein gueltiges YAML-Objekt" };
  }

  if (!lockEintrag) {
    return { dateiname, zustand: "unlesbar", details: "kein Eintrag in profil.lock" };
  }
  if (lockEintrag.basisversion !== aktuelleBasisversion) {
    return {
      dateiname,
      zustand: "basis_veraltet",
      details: `profil.lock nennt ${lockEintrag.basisversion}, installiert ist ${aktuelleBasisversion}`,
    };
  }

  if (pruefsumme(profilInhalt) === basisDatei.pruefsumme) {
    return { dateiname, zustand: "deckungsgleich" };
  }

  const basisWerte = new Set<string>();
  sammleLeafWerte(load(ohneKommentarzeilen(basisDatei.inhalt)), basisWerte);
  const profilWerte = new Set<string>();
  sammleLeafWerte(profilDaten, profilWerte);
  for (const wert of profilWerte) {
    if (!basisWerte.has(wert)) {
      return { dateiname, zustand: "unbekannter_wert", details: `Wert "${wert}" liegt ausserhalb der Basis` };
    }
  }
  return { dateiname, zustand: "abgewichen" };
}

export function vergleicheProfilVerzeichnis(profilVerzeichnis: string, lockPfad: string, basis: ProfilBasis): ProfilBefund[] {
  const lock = ladeLock(lockPfad);
  return basis.dateien.map((basisDatei) => {
    const ziel = join(profilVerzeichnis, basisDatei.dateiname);
    const profilInhalt = existsSync(ziel) ? readFileSync(ziel, "utf-8") : null;
    return vergleicheDatei({
      dateiname: basisDatei.dateiname,
      profilInhalt,
      basisDatei,
      lockEintrag: lock[basisDatei.dateiname],
      aktuelleBasisversion: basis.basisversion,
    });
  });
}

/**
 * REQ-10: listet vor einem Basiswechsel die vorhandenen Abweichungen je Datei.
 * Baut nur die Auflistung, keine Zusammenfuehrung, siehe D3-17.
 */
export interface BasiswechselEintrag {
  dateiname: string;
  aendertSich: boolean;
  alteBasisversion: string | undefined;
  neueBasisversion: string;
  altePruefsumme: string | undefined;
  neuePruefsumme: string;
}

export function listeBasiswechsel(lockPfad: string, neueBasis: ProfilBasis): BasiswechselEintrag[] {
  const lock = ladeLock(lockPfad);
  return neueBasis.dateien.map((datei) => {
    const eintrag = lock[datei.dateiname];
    return {
      dateiname: datei.dateiname,
      aendertSich: eintrag?.pruefsumme !== datei.pruefsumme,
      alteBasisversion: eintrag?.basisversion,
      neueBasisversion: neueBasis.basisversion,
      altePruefsumme: eintrag?.pruefsumme,
      neuePruefsumme: datei.pruefsumme,
    };
  });
}
