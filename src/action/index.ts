/**
 * Einstiegspunkt der Action. Arbeitspaket 7 (REQ-16 bis REQ-19),
 * Arbeitspaket 8 (REQ-20, REQ-21) und Arbeitspaket 9 (REQ-22, REQ-23).
 * Vier Rechte, ein Ziel fuer jeden Netzaufruf (api.github.com, siehe
 * github.ts), ein fester Kommentar, ein Check-Run, Notfallpfad und
 * Beobachtungsmodus als Ueberschreibung des Check-Run-Zustands.
 *
 * Die eigentliche Regelpruefung (REQ-24 bis REQ-26) und das Schreiben der
 * Ursachendatei fuer den Ankreuzfeld-Wert (REQ-27, Arbeitspaket 11, K3)
 * sind hier bewusst nicht enthalten. Ankreuzfeld und Befehl werden
 * erkannt und ausgewertet, ihre Persistenz folgt in Arbeitspaket 11.
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

async function behandleKommentarEreignis(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const comment = context.payload.comment as { body?: string; user?: { login: string } } | undefined;
  const issue = context.payload.issue as { pull_request?: unknown; number: number } | undefined;
  if (!comment?.body || !issue?.pull_request) {
    core.info("kein Kommentar an einem Pull Request, nichts zu tun");
    return;
  }

  if (context.payload.action === "edited") {
    const ergebnis = werteAnkreuzfelderAus(comment.body);
    core.info(`Ankreuzfelder-Ergebnis: ${JSON.stringify(ergebnis)}`);
    if (ergebnis.art === "rueckfrage") {
      core.warning(`Mehrere Ankreuzfelder gesetzt: ${ergebnis.kandidaten.join(", ")}. Kein Eintrag, Rueckfrage noetig.`);
    }
    // Schreiben der Ursachendatei folgt in Arbeitspaket 11 (REQ-27).
    return;
  }

  if (context.payload.action !== "created") return;

  if (istNotfallBefehl(comment.body)) {
    await behandleNotfallBefehl(octokit, owner, repo, issue.number, comment.user?.login ?? "unbekannt");
    return;
  }

  if (istUrsachenBefehl(comment.body)) {
    const ergebnis = werteBefehlAus(comment.body);
    core.info(`Befehl-Ergebnis: ${JSON.stringify(ergebnis)}`);
    if (ergebnis.art === "unbekannter_wert") {
      core.warning(`Unbekannter Wert "${ergebnis.wert}". Zulaessig: ${ergebnis.zulaessig.join(", ")}.`);
    }
    // Schreiben der Ursachendatei folgt in Arbeitspaket 11 (REQ-27).
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
