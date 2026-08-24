/**
 * Einstiegspunkt der Action. Arbeitspaket 7 (REQ-16 bis REQ-19),
 * Arbeitspaket 8 (REQ-20, REQ-21), Arbeitspaket 9 (REQ-22, REQ-23) und
 * Arbeitspaket 11 (REQ-27, REQ-30, REQ-31). Vier Rechte, ein Ziel fuer
 * jeden Netzaufruf (api.github.com, siehe github.ts), ein fester
 * Kommentar, ein Check-Run, Notfallpfad und Beobachtungsmodus als
 * Ueberschreibung des Check-Run-Zustands, Ursachencode als Datei.
 *
 * Die eigentliche Regelpruefung (REQ-24 bis REQ-26) ist hier bewusst
 * nicht enthalten, der Zustand des Check-Runs bleibt bis dahin ein
 * Platzhalter. Der Ursachenvorschlag aus Indizien (REQ-30) hat keine
 * Indizien-Engine, weil D3-16 dafuer historische Daten aus rund fuenfzig
 * Gate-Laeufen verlangt, die es noch nicht gibt: vorschlag bleibt bis
 * dahin immer leer, uebernommen entsprechend immer falsch.
 */
import * as core from "@actions/core";
import { context } from "@actions/github";
import { erzeugeOctokit, type Octokit } from "./github";
import { schreibeFestenKommentar } from "./kommentar";
import { erzeugeCheckRun, type CheckZustand } from "./checkrun";
import { formatiereAnkreuzfelder, werteAnkreuzfelderAus } from "./ankreuzfelder";
import { istUrsachenBefehl, werteBefehlAus } from "./befehle";
import { RechteFehler, ZeitgrenzeFehler, mitWiederholungBeiRatenbegrenzung, mitZeitgrenze, pruefeAufRechtefehler } from "./fehlerbehandlung";
import { ladeKonfiguration } from "./konfiguration";
import { erzeugeNotfall, istNotfallBefehl } from "./notfall";
import { ladeOffeneNotfaelle, schreibeNotfall } from "./notfallspeicher";
import { wendeUeberschreibungenAn } from "./zustandsueberschreibung";
import { ermittleFreigaberecht } from "./freigabe";
import { erzeugeUrsachendatei, type UrsachenKennung } from "./ursachendatei";
import { schreibeUrsache } from "./ursachenspeicher";

const ZEITGRENZE_MS = 60_000;
const ATTESTA_YML = "attesta.yml";

function arbeitsverzeichnis(): string {
  return process.env.GITHUB_WORKSPACE ?? process.cwd();
}

async function behandleGrundlauf(octokit: Octokit, owner: string, repo: string, prNummer: number, branch: string, sha: string): Promise<void> {
  const body = ["## Attesta Zyklus", "", "Anforderungspruefung noch nicht implementiert, siehe REQ-24 bis REQ-26.", "", "Ursachencode, ein Klick setzt genau ein Feld:", "", formatiereAnkreuzfelder()].join("\n");

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

  let zusammenfassung = "Regelpruefung noch nicht implementiert, siehe REQ-24 bis REQ-26. Kein Befund ausgewiesen.";
  if (offeneNotfaelle.length > 0) zusammenfassung += " Notfallpfad aktiv, siehe attesta/notfaelle/.";
  if (konfiguration.beobachtungsmodus) zusammenfassung += " Beobachtungsmodus eingeschaltet.";

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
  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNummer });
  const notfall = erzeugeNotfall({ ausgerufenVon, ausgerufenAm: new Date(), pullRequest: prNummer });
  const pfad = await schreibeNotfall(octokit, { owner, repo, branch: pr.head.ref }, notfall);
  core.info(`Notfall ausgerufen, abgelegt unter ${pfad}, Frist ${notfall.frist}`);

  await mitWiederholungBeiRatenbegrenzung(() =>
    erzeugeCheckRun(octokit, { owner, repo, sha: pr.head.sha }, {
      zustand: "neutral",
      titel: "Attesta Zyklus",
      zusammenfassung: `Notfallpfad ausgerufen von ${ausgerufenVon}. Nachdokumentation faellig bis ${notfall.frist}.`,
    })
  );
}

/**
 * REQ-27, REQ-31: legt die Ursachendatei ab. Bei "wollen" erst nach
 * bestaetigtem Freigaberecht der setzenden Person, sonst Ablehnung mit
 * Nennung der noetigen Rolle (Fehlerverhalten aus SPEC-09).
 */
async function verarbeiteUrsachenEintrag(octokit: Octokit, owner: string, repo: string, prNummer: number, wert: UrsachenKennung, gesetztVon: string): Promise<void> {
  if (wert === "wollen") {
    const berechtigt = await ermittleFreigaberecht(octokit, owner, repo, gesetztVon);
    if (!berechtigt) {
      core.warning(`Ablehnung: "wollen" erfordert Freigaberecht (admin oder write). ${gesetztVon} hat es nicht.`);
      return;
    }
  }

  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNummer });
  const ursache = erzeugeUrsachendatei({ vorgang: `pr-${prNummer}`, wert, zeitpunkt: new Date(), gesetztVon });
  const pfad = await schreibeUrsache(octokit, { owner, repo, branch: pr.head.ref }, ursache);
  core.info(`Ursachencode ${wert} abgelegt unter ${pfad}, gesetzt von ${gesetztVon}`);
}

async function behandleKommentarEreignis(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const comment = context.payload.comment as { body?: string; user?: { login: string } } | undefined;
  const issue = context.payload.issue as { pull_request?: unknown; number: number } | undefined;
  if (!comment?.body || !issue?.pull_request) {
    core.info("kein Kommentar an einem Pull Request, nichts zu tun");
    return;
  }
  const absender = context.payload.sender as { login?: string } | undefined;
  const gesetztVon = absender?.login ?? comment.user?.login ?? "unbekannt";

  if (context.payload.action === "edited") {
    const ergebnis = werteAnkreuzfelderAus(comment.body);
    core.info(`Ankreuzfelder-Ergebnis: ${JSON.stringify(ergebnis)}`);
    if (ergebnis.art === "rueckfrage") {
      core.warning(`Mehrere Ankreuzfelder gesetzt: ${ergebnis.kandidaten.join(", ")}. Kein Eintrag, Rueckfrage noetig.`);
    } else if (ergebnis.art === "eintrag") {
      await verarbeiteUrsachenEintrag(octokit, owner, repo, issue.number, ergebnis.kennung as UrsachenKennung, gesetztVon);
    }
    return;
  }

  if (context.payload.action !== "created") return;

  if (istNotfallBefehl(comment.body)) {
    await behandleNotfallBefehl(octokit, owner, repo, issue.number, gesetztVon);
    return;
  }

  if (istUrsachenBefehl(comment.body)) {
    const ergebnis = werteBefehlAus(comment.body);
    core.info(`Befehl-Ergebnis: ${JSON.stringify(ergebnis)}`);
    if (ergebnis.art === "unbekannter_wert") {
      core.warning(`Unbekannter Wert "${ergebnis.wert}". Zulaessig: ${ergebnis.zulaessig.join(", ")}.`);
    } else if (ergebnis.art === "eintrag") {
      await verarbeiteUrsachenEintrag(octokit, owner, repo, issue.number, ergebnis.kennung as UrsachenKennung, gesetztVon);
    }
  }
}

async function fuehreAus(): Promise<void> {
  const token = core.getInput("github-token") || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new RechteFehler("contents: read (kein Token uebergeben)");
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

  core.info(`Ereignis ${context.eventName}/${context.payload.action ?? ""} wird nicht behandelt`);
}

mitZeitgrenze(ZEITGRENZE_MS, fuehreAus).catch((e) => {
  if (e instanceof ZeitgrenzeFehler) {
    core.warning(e.message);
    return;
  }
  core.setFailed(e instanceof Error ? e.message : String(e));
});
