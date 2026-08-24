/**
 * Einstiegspunkt der Action, Arbeitspaket 7 (REQ-16 bis REQ-19) und
 * Arbeitspaket 8 (REQ-20, REQ-21). Vier Rechte, ein Ziel fuer jeden
 * Netzaufruf (api.github.com, siehe github.ts), ein fester Kommentar,
 * ein Check-Run.
 *
 * Die eigentliche Regelpruefung (REQ-24 bis REQ-26) und das Schreiben der
 * Ursachendatei (REQ-27, Arbeitspaket 11, K3) sind hier bewusst nicht
 * enthalten. Ankreuzfeld und Befehl werden erkannt und ausgewertet, die
 * Persistenz folgt in Arbeitspaket 11.
 */
import * as core from "@actions/core";
import { context } from "@actions/github";
import { erzeugeOctokit } from "./github";
import { schreibeFestenKommentar } from "./kommentar";
import { erzeugeCheckRun } from "./checkrun";
import { formatiereAnkreuzfelder, werteAnkreuzfelderAus } from "./ankreuzfelder";
import { istUrsachenBefehl, werteBefehlAus } from "./befehle";
import { RechteFehler, ZeitgrenzeFehler, mitWiederholungBeiRatenbegrenzung, mitZeitgrenze, pruefeAufRechtefehler } from "./fehlerbehandlung";

const ZEITGRENZE_MS = 60_000;

async function behandleGrundlauf(octokit: ReturnType<typeof erzeugeOctokit>, owner: string, repo: string, prNummer: number, sha: string): Promise<void> {
  const body = ["## Attesta Zyklus", "", "Anforderungspruefung noch nicht implementiert, siehe REQ-24 bis REQ-26.", "", "Ursachencode, ein Klick setzt genau ein Feld:", "", formatiereAnkreuzfelder()].join("\n");

  try {
    await mitWiederholungBeiRatenbegrenzung(() => schreibeFestenKommentar(octokit, { owner, repo, pullNummer: prNummer }, body));
  } catch (e) {
    pruefeAufRechtefehler(e, "issues: write");
    throw e;
  }

  try {
    await mitWiederholungBeiRatenbegrenzung(() =>
      erzeugeCheckRun(octokit, { owner, repo, sha }, {
        zustand: "neutral",
        titel: "Attesta Zyklus",
        zusammenfassung: "Regelpruefung noch nicht implementiert, siehe REQ-24 bis REQ-26. Kein Befund ausgewiesen.",
      })
    );
  } catch (e) {
    pruefeAufRechtefehler(e, "checks: write");
    throw e;
  }
}

function behandleKommentarEreignis(): void {
  const comment = context.payload.comment as { body?: string } | undefined;
  const issue = context.payload.issue as { pull_request?: unknown } | undefined;
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

  if (context.payload.action === "created" && istUrsachenBefehl(comment.body)) {
    const ergebnis = werteBefehlAus(comment.body);
    core.info(`Befehl-Ergebnis: ${JSON.stringify(ergebnis)}`);
    if (ergebnis.art === "unbekannter_wert") {
      core.warning(`Unbekannter Wert "${ergebnis.wert}". Zulaessig: ${ergebnis.zulaessig.join(", ")}.`);
    }
    // Schreiben der Ursachendatei folgt in Arbeitspaket 11 (REQ-27).
    return;
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
    const pr = context.payload.pull_request as { number: number; head: { sha: string } } | undefined;
    if (!pr) {
      core.setFailed("kein pull_request im Ereignis");
      return;
    }
    await behandleGrundlauf(octokit, owner, repo, pr.number, pr.head.sha);
    return;
  }

  if (context.eventName === "issue_comment") {
    behandleKommentarEreignis();
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
