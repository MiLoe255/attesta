/**
 * Einstiegspunkt der Action. Arbeitspaket 7 (REQ-16 bis REQ-19),
 * Arbeitspaket 8 (REQ-20, REQ-21), Arbeitspaket 9 (REQ-22, REQ-23),
 * Arbeitspaket 11 (REQ-27, REQ-30, REQ-31), Arbeitspaket 13 (REQ-34,
 * REQ-35), Arbeitspaket 14 (REQ-36 bis REQ-38), Arbeitspaket 10
 * (REQ-24, REQ-25) und Arbeitspaket 12 (REQ-32, Stufen 1 bis 3). Vier
 * Rechte, ein Ziel fuer jeden Netzaufruf
 * (api.github.com, siehe github.ts), ein fester Kommentar, ein
 * Check-Run, Notfallpfad und Beobachtungsmodus als Ueberschreibung des
 * Check-Run-Zustands, Ursachencode als Datei, Lizenzhinweis,
 * Monatsbericht als Pull Request, Anforderungsguete auf Issue-Texten,
 * Gate-3-Nachweis per Selbstauskunft (/attesta gate3 bestanden, siehe
 * gate3.ts), Nachweisgrad und Delegationsgrenze im Issue-Kommentar
 * (REQ-26, REQ-33).
 *
 * Zwei Groessen bleiben strukturell offen und werden als solche
 * ausgewiesen statt geraten:
 * - Kettendeckung und Belegfrische fehlen, deshalb ist der Nachweisgrad
 *   als Minimum der drei Werte immer "nicht bestimmbar" (GR-8.6). Die
 *   Anforderungsguete darin ist echt und stammt aus der Pruefung des
 *   jeweiligen Issue-Textes.
 * - Der Ursachenvorschlag aus Indizien (REQ-30) hat keine
 *   Indizien-Engine, weil D3-16 dafuer historische Daten aus rund
 *   fuenfzig Gate-Laeufen verlangt, die es noch nicht gibt: vorschlag
 *   bleibt bis dahin immer leer, uebernommen entsprechend immer falsch.
 *
 * Der Zustand des Grundlauf-Check-Runs am Pull Request bleibt ein
 * Platzhalter: welche Dateien eines Pull Requests als "Anforderungen" zu
 * pruefen sind, legt keine Anforderung im 47er-Bestand fest.
 */
import * as core from "@actions/core";
import { context } from "@actions/github";
import { erzeugeOctokit, type Octokit } from "./github";
import { schreibeFestenKommentar } from "./kommentar";
import { erzeugeCheckRun, type CheckZustand } from "./checkrun";
import { formatiereAnkreuzfelder, werteAnkreuzfelderAus } from "./ankreuzfelder";
import { istUrsachenBefehl, werteBefehlAus, type BefehlErgebnis } from "./befehle";
import { RechteFehler, ZeitgrenzeFehler, mitWiederholungBeiRatenbegrenzung, mitZeitgrenze, pruefeAufRechtefehler } from "./fehlerbehandlung";
import { ladeKonfiguration } from "./konfiguration";
import { erzeugeNotfall, istNotfallBefehl } from "./notfall";
import { ladeAlleNotfaelle, ladeOffeneNotfaelle, schreibeNotfall } from "./notfallspeicher";
import { wendeUeberschreibungenAn } from "./zustandsueberschreibung";
import { ermittleFreigaberecht } from "./freigabe";
import { erzeugeUrsachendatei, type UrsachenKennung } from "./ursachendatei";
import { ladeAlleUrsachen, schreibeUrsache } from "./ursachenspeicher";
import { formatiereLizenzhinweis, istHinweisDringend, pruefeLizenz } from "../gemeinsam/lizenz";
import { erzeugeBerichtsinhalt } from "./bericht";
import { stelleBerichtBereit, type BerichtPrClient } from "./berichtpr";
import { PROFILBASIS } from "../gemeinsam/profilbasis.generated";
import { vergleicheProfilVerzeichnis, type ProfilBefund } from "../gemeinsam/profilvergleich";
import { pruefeAnforderungMitRegelsatz } from "../gemeinsam/guete";
import { leseEigeneRollen } from "../gemeinsam/eigene-rollen";
import { erhebeErgaenzungen, type Ergaenzungsbefund } from "../gemeinsam/ergaenzungen";
import { formatiereBefund } from "../gemeinsam/meldung";
import { bestimmeDelegationsreife, bestimmeZulaessigeDelegation, formatierePruefung } from "../gemeinsam/delegationsreife";
import { kritikalitaetMitRueckfall, leseEinstufung, matrixObergrenze } from "./arbeitspaket";
import { berechneAnforderungsguete, berechneNachweisgrad, formatiereNachweisgrad } from "../gemeinsam/nachweisgrad";
import { ermittleStufenBedingungen } from "./delegationsreife-ermittlung";
import { erzeugeGate3Attest, GATE3_PFAD, istGate3Befehl, leseBegruendung } from "./gate3";
import { schreibeGate3Attest } from "./gate3speicher";

const ZEITGRENZE_MS = 60_000;
const ATTESTA_YML = "attesta.yml";

function arbeitsverzeichnis(): string {
  return process.env.GITHUB_WORKSPACE ?? process.cwd();
}

/**
 * Kopf des Pull Requests: der Zweig, auf dem die Action Dateien ablegt,
 * und der Commit, an dem der Check-Run haengt. Die Ablage erfolgt immer
 * auf diesem Zweig und niemals direkt auf dem Hauptzweig (Leitfaden
 * Abschnitt 8, hartes Verbot).
 */
async function holePrKopf(octokit: Octokit, owner: string, repo: string, prNummer: number): Promise<{ ablage: { owner: string; repo: string; branch: string }; sha: string }> {
  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNummer });
  return { ablage: { owner, repo, branch: pr.head.ref }, sha: pr.head.sha };
}

/**
 * Der feste Kommentar am Pull Request. REQ-35: eine abgelaufene,
 * ungueltige oder fehlende Lizenz haelt den Lauf nicht an (GR-11.4), sie
 * erzeugt nur einen Hinweis. Nach dreissig Tagen wandert er an den Kopf
 * des Kommentars (GR-11.5).
 */
function baueGrundlaufKommentar(): string {
  const teile = ["## Attesta Zyklus", "", "Anforderungspruefung noch nicht implementiert, siehe REQ-24 bis REQ-26.", "", "Ursachencode, ein Klick setzt genau ein Feld:", "", formatiereAnkreuzfelder()];

  const lizenzErgebnis = pruefeLizenz(core.getInput("lizenzschluessel") || undefined);
  const lizenzHinweis = formatiereLizenzhinweis(lizenzErgebnis);
  if (lizenzHinweis && istHinweisDringend(lizenzErgebnis)) {
    teile.unshift(`**${lizenzHinweis}**`, "");
  } else if (lizenzHinweis) {
    teile.push("", `_${lizenzHinweis}_`);
  }
  return teile.join("\n");
}

/**
 * REQ-32 Abnahme 3: die Delegationsreife erscheint als Zeile im
 * Check-Run. Sie ist eine Zusatzangabe: laesst sie sich nicht ermitteln,
 * bleibt die Zeile leer und der Lauf geht weiter.
 */
async function baueReifeZeile(octokit: Octokit, owner: string, repo: string, branch: string): Promise<string> {
  try {
    const bedingungen = await ermittleStufenBedingungen(octokit, { owner, repo, branch });
    return `Delegationsreife: Stufe ${bestimmeDelegationsreife(bedingungen).stufe}.`;
  } catch (e) {
    core.warning(`Delegationsreife nicht ermittelbar: ${e instanceof Error ? e.message : String(e)}`);
    return "";
  }
}

async function behandleGrundlauf(octokit: Octokit, owner: string, repo: string, prNummer: number, branch: string, sha: string): Promise<void> {
  // Einmal bauen, nicht je Wiederholungsversuch erneut.
  const body = baueGrundlaufKommentar();
  try {
    await mitWiederholungBeiRatenbegrenzung(() => schreibeFestenKommentar(octokit, { owner, repo, pullNummer: prNummer }, body));
  } catch (e) {
    pruefeAufRechtefehler(e, "issues: write");
    throw e;
  }

  const konfiguration = ladeKonfiguration(`${arbeitsverzeichnis()}/${ATTESTA_YML}`);
  const offeneNotfaelle = await ladeOffeneNotfaelle(octokit, { owner, repo, branch }, prNummer);
  const roherZustand: CheckZustand = "neutral"; // Platzhalter, bis REQ-24 bis REQ-26 stehen.
  const zustand = wendeUeberschreibungenAn(roherZustand, {
    notfallAktiv: offeneNotfaelle.length > 0,
    beobachtungsmodus: konfiguration.beobachtungsmodus,
  });

  const zusammenfassung = [
    "Regelpruefung noch nicht implementiert, siehe REQ-24 bis REQ-26. Kein Befund ausgewiesen.",
    offeneNotfaelle.length > 0 ? "Notfallpfad aktiv, siehe attesta/notfaelle/." : "",
    konfiguration.beobachtungsmodus ? "Beobachtungsmodus eingeschaltet." : "",
    await baueReifeZeile(octokit, owner, repo, branch),
  ]
    .filter(Boolean)
    .join(" ");

  try {
    await mitWiederholungBeiRatenbegrenzung(() =>
      erzeugeCheckRun(octokit, { owner, repo, sha }, { zustand, titel: "Attesta Zyklus", zusammenfassung })
    );
  } catch (e) {
    pruefeAufRechtefehler(e, "checks: write");
    throw e;
  }
}

async function behandleNotfallBefehl(octokit: Octokit, owner: string, repo: string, prNummer: number, ausgerufenVon: string): Promise<void> {
  const { ablage, sha } = await holePrKopf(octokit, owner, repo, prNummer);
  const notfall = erzeugeNotfall({ ausgerufenVon, ausgerufenAm: new Date(), pullRequest: prNummer });
  const pfad = await schreibeNotfall(octokit, ablage, notfall);
  core.info(`Notfall ausgerufen, abgelegt unter ${pfad}, Frist ${notfall.frist}`);

  await mitWiederholungBeiRatenbegrenzung(() =>
    erzeugeCheckRun(octokit, { owner, repo, sha }, {
      zustand: "neutral",
      titel: "Attesta Zyklus",
      zusammenfassung: `Notfallpfad ausgerufen von ${ausgerufenVon}. Nachdokumentation faellig bis ${notfall.frist}.`,
    })
  );
}

/**
 * Freigaberecht als Vorbedingung, mit einheitlicher Ablehnungsmeldung.
 * Zwei Vorgaenge brauchen sie: der Ursachenwert "wollen" (REQ-31) und die
 * Gate-3-Bestaetigung. Beide sind Aussagen ueber einen benannten Menschen.
 */
async function darfFreigeben(octokit: Octokit, owner: string, repo: string, person: string, vorgang: string): Promise<boolean> {
  const berechtigt = await ermittleFreigaberecht(octokit, owner, repo, person);
  if (!berechtigt) {
    core.warning(`Ablehnung: ${vorgang} erfordert Freigaberecht (admin oder write). ${person} hat es nicht.`);
  }
  return berechtigt;
}

/** Wer an welchem Pull Request etwas setzt. Buendelt die Angaben, die jeder Bedienvorgang am Kommentar braucht. */
interface Vorgang {
  octokit: Octokit;
  owner: string;
  repo: string;
  prNummer: number;
  gesetztVon: string;
}

/**
 * REQ-27, REQ-31: legt die Ursachendatei ab. Bei "wollen" erst nach
 * bestaetigtem Freigaberecht der setzenden Person, sonst Ablehnung mit
 * Nennung der noetigen Rolle (Fehlerverhalten aus SPEC-09).
 */
async function verarbeiteUrsachenEintrag(vorgang: Vorgang, wert: UrsachenKennung): Promise<void> {
  const { octokit, owner, repo, prNummer, gesetztVon } = vorgang;
  if (wert === "wollen" && !(await darfFreigeben(octokit, owner, repo, gesetztVon, '"wollen"'))) {
    return;
  }

  const { ablage } = await holePrKopf(octokit, owner, repo, prNummer);
  const ursache = erzeugeUrsachendatei({ vorgang: `pr-${prNummer}`, wert, zeitpunkt: new Date(), gesetztVon });
  const pfad = await schreibeUrsache(octokit, ablage, ursache);
  core.info(`Ursachencode ${wert} abgelegt unter ${pfad}, gesetzt von ${gesetztVon}`);
}

/**
 * Verarbeitet ein Auswerteergebnis, gleich ob es aus einem Ankreuzfeld
 * oder aus einem getippten Befehl stammt. GR-7.3 verlangt, dass beide
 * Wege denselben Auswerteschritt nutzen und dasselbe Ergebnis liefern;
 * das gilt hier auch fuer die Reaktion darauf.
 */
async function verarbeiteAuswertung(vorgang: Vorgang, ergebnis: BefehlErgebnis, herkunft: string): Promise<void> {
  core.info(`${herkunft}: ${JSON.stringify(ergebnis)}`);
  switch (ergebnis.art) {
    case "eintrag":
      await verarbeiteUrsachenEintrag(vorgang, ergebnis.kennung as UrsachenKennung);
      return;
    case "rueckfrage":
      core.warning(`Mehrere Ankreuzfelder gesetzt: ${ergebnis.kandidaten.join(", ")}. Kein Eintrag, Rueckfrage noetig.`);
      return;
    case "unbekannter_wert":
      core.warning(`Unbekannter Wert "${ergebnis.wert}". Zulaessig: ${ergebnis.zulaessig.join(", ")}.`);
      return;
    case "kein_eintrag":
      return;
  }
}

/**
 * Gate-3-Nachweis-Konvention (Entscheidung vom 24.08.2026). Selbstauskunft,
 * kein objektiver Beleg: dieselbe Freigaberecht-Pruefung wie beim
 * Ursachenwert "wollen". Fehlerverhalten: fehlt die Begruendung, wird das
 * fehlende Feld benannt statt den Befehl schweigend zu verwerfen.
 */
async function behandleGate3Befehl(octokit: Octokit, owner: string, repo: string, prNummer: number, kommentarBody: string, bestaetigtVon: string): Promise<void> {
  if (!(await darfFreigeben(octokit, owner, repo, bestaetigtVon, "Gate-3-Bestaetigung"))) {
    return;
  }
  const begruendung = leseBegruendung(kommentarBody);
  if (!begruendung) {
    core.warning("Gate-3-Bestaetigung ohne Begruendung. Aufruf: /attesta gate3 bestanden <Begruendung>");
    return;
  }
  const { ablage } = await holePrKopf(octokit, owner, repo, prNummer);
  const attest = erzeugeGate3Attest({ bestaetigtVon, datum: new Date(), begruendung });
  await schreibeGate3Attest(octokit, ablage, attest);
  core.info(`Gate 3 bestaetigt von ${bestaetigtVon}, abgelegt unter ${GATE3_PFAD}`);
}

async function behandleKommentarEreignis(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const comment = context.payload.comment as { body?: string; user?: { login: string } } | undefined;
  const issue = context.payload.issue as { pull_request?: unknown; number: number } | undefined;
  if (!comment?.body || !issue?.pull_request) {
    core.info("kein Kommentar an einem Pull Request, nichts zu tun");
    return;
  }
  const absender = context.payload.sender as { login?: string } | undefined;
  const vorgang: Vorgang = {
    octokit,
    owner,
    repo,
    prNummer: issue.number,
    gesetztVon: absender?.login ?? comment.user?.login ?? "unbekannt",
  };

  if (context.payload.action === "edited") {
    await verarbeiteAuswertung(vorgang, werteAnkreuzfelderAus(comment.body), "Ankreuzfelder-Ergebnis");
    return;
  }

  if (context.payload.action !== "created") return;

  if (istNotfallBefehl(comment.body)) {
    await behandleNotfallBefehl(octokit, owner, repo, issue.number, vorgang.gesetztVon);
    return;
  }

  if (istGate3Befehl(comment.body)) {
    await behandleGate3Befehl(octokit, owner, repo, issue.number, comment.body, vorgang.gesetztVon);
    return;
  }

  if (istUrsachenBefehl(comment.body)) {
    await verarbeiteAuswertung(vorgang, werteBefehlAus(comment.body), "Befehl-Ergebnis");
  }
}

/**
 * Anforderungsguete auf Issue-Texten, REQ-25, zweiter Fundort neben der
 * Konsole (die Dateien lokal ohne Netz prueft). Ruft denselben
 * Programmteil auf wie `attesta guete <Pfad>`, siehe gemeinsam/guete.ts.
 */
/**
 * REQ-33: die zulaessige Delegationsstufe ist das Minimum aus
 * Delegationsreife und K-mal-S-Matrix. Eine ueberschreitende Angabe wird
 * abgelehnt und begruendet (GR-10.4, beide Grenzen und die engere
 * davon). Fehlt die Kritikalitaet, greift REQ-29: strengste Stufe.
 * Fehlt die Delegationsangabe, gibt es nichts zu pruefen.
 */
async function baueDelegationsabschnitt(octokit: Octokit, owner: string, repo: string, issueText: string): Promise<string[]> {
  const einstufung = leseEinstufung(issueText);
  if (!einstufung.delegation) return [];

  const { stufe: kStufe, ausRueckfall } = kritikalitaetMitRueckfall(einstufung);
  const { data: repoDaten } = await octokit.rest.repos.get({ owner, repo });
  const bedingungen = await ermittleStufenBedingungen(octokit, { owner, repo, branch: repoDaten.default_branch });
  const reife = bestimmeDelegationsreife(bedingungen);

  const pruefung = bestimmeZulaessigeDelegation(einstufung.delegation, reife.stufe, matrixObergrenze(kStufe));
  const zeilen = ["", "### Delegationsgrenze", "", formatierePruefung(pruefung)];
  if (ausRueckfall) {
    zeilen.push("", "Keine Kritikalitaet angegeben, deshalb als K3 behandelt (REQ-29).");
  }
  return zeilen;
}

async function behandleIssueEreignis(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const issue = context.payload.issue as { number: number; body?: string | null } | undefined;
  if (!issue?.body) {
    core.info("Issue ohne Text, nichts zu pruefen");
    return;
  }

  const eigene = leseEigeneRollen(arbeitsverzeichnis());
  for (const befund of eigene.befunde) core.warning(befund);
  const ergebnis = pruefeAnforderungMitRegelsatz(issue.body, eigene.rollen);
  const zeilen = ["## Attesta Zyklus: Anforderungsguete", ""];
  const befunde = ergebnis.pruefungen.filter((p) => p.zustand !== "erfuellt");
  if (befunde.length === 0) {
    zeilen.push("Sechs Pruefungen ohne Befund.");
  } else {
    for (const befund of befunde) {
      const regel = befund.details ? `${befund.pruefung}: ${befund.details}` : befund.pruefung;
      zeilen.push(`- ${formatiereBefund({ regelsatzdatei: `Issue #${issue.number}`, regel })}`);
    }
  }

  // REQ-26 Abnahme 2: der Kommentar zeigt alle drei Einzelwerte und den Nenner.
  // Kettendeckung und Belegfrische sind nicht ermittelbar, deshalb ist der
  // Nachweisgrad als Minimum der drei ebenfalls nicht bestimmbar (GR-8.6).
  const nachweisgrad = berechneNachweisgrad({
    kettendeckung: null,
    anforderungsguete: berechneAnforderungsguete([ergebnis]),
    belegfrische: null,
  });
  zeilen.push("", "### Nachweisgrad", "", "```", formatiereNachweisgrad(nachweisgrad), "```");

  zeilen.push(...(await baueDelegationsabschnitt(octokit, owner, repo, issue.body)));

  await mitWiederholungBeiRatenbegrenzung(() => schreibeFestenKommentar(octokit, { owner, repo, pullNummer: issue.number }, zeilen.join("\n")));
}

/**
 * Monatsbericht, Arbeitspaket 14 (REQ-36 bis REQ-38). Wird von einem
 * planbaren Ereignis ausgeloest (schedule oder workflow_dispatch); der
 * eigentliche Zeitplan (Tag im Monat, SPEC-12 nicht spezifiziert, erster
 * Werktag vorgeschlagen) steht in der Workflow-Datei des Kunden, die
 * dieses Arbeitspaket nicht erzeugt.
 */
async function behandleMonatsbericht(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const berichtClient = octokit as unknown as BerichtPrClient;
  const { data: repoDaten } = await octokit.rest.repos.get({ owner, repo });
  const standardBranch = repoDaten.default_branch;
  const monat = new Date().toISOString().slice(0, 7);

  const [ursachen, notfaelle] = await Promise.all([
    ladeAlleUrsachen(octokit, { owner, repo, branch: standardBranch }),
    ladeAlleNotfaelle(octokit, { owner, repo, branch: standardBranch }),
  ]);

  let profilBefunde: ProfilBefund[] = [];
  let ergaenzungen: Ergaenzungsbefund[] = [];
  try {
    const wurzel = arbeitsverzeichnis();
    profilBefunde = vergleicheProfilVerzeichnis(`${wurzel}/attesta/profil`, `${wurzel}/attesta/profil.lock`, PROFILBASIS);
    ergaenzungen = erhebeErgaenzungen(wurzel);
  } catch (e) {
    core.warning(`Profilvergleich fuer den Bericht nicht moeglich: ${e instanceof Error ? e.message : String(e)}`);
  }

  const inhalt = erzeugeBerichtsinhalt({ monat, ursachen, notfaelle, profilBefunde, ergaenzungen, jetzt: new Date() });
  const ergebnis = await stelleBerichtBereit(berichtClient, { owner, repo, standardBranch }, monat, inhalt);
  core.info(`Monatsbericht ${ergebnis.neu ? "erstellt" : "aktualisiert"}: PR #${ergebnis.prNummer} auf ${ergebnis.branch}`);
}

async function fuehreAus(): Promise<void> {
  const token = core.getInput("github-token") || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new RechteFehler("contents: write (kein Token uebergeben)");
  }
  const octokit = erzeugeOctokit(token);
  const { owner, repo } = context.repo;

  if (context.eventName === "pull_request") {
    const pr = context.payload.pull_request as { number: number; head: { sha: string; ref: string } } | undefined;
    if (!pr) {
      core.setFailed("kein pull_request im Ereignis");
      return;
    }
    await behandleGrundlauf(octokit, owner, repo, pr.number, pr.head.ref, pr.head.sha);
    return;
  }

  if (context.eventName === "issue_comment") {
    await behandleKommentarEreignis(octokit, owner, repo);
    return;
  }

  if (context.eventName === "issues") {
    await behandleIssueEreignis(octokit, owner, repo);
    return;
  }

  if (context.eventName === "schedule" || context.eventName === "workflow_dispatch") {
    await behandleMonatsbericht(octokit, owner, repo);
    return;
  }

  core.info(`Ereignis ${context.eventName}/${context.payload.action ?? ""} wird nicht behandelt`);
}

mitZeitgrenze(ZEITGRENZE_MS, fuehreAus).catch((e) => {
  if (e instanceof ZeitgrenzeFehler) {
    core.warning(e.message);
    return;
  }
  core.setFailed(e instanceof Error ? e.message : String(e));
});
