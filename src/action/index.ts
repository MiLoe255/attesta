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
 * gate3.ts).
 *
 * Der Zustand des Grundlauf-Check-Runs bleibt weiterhin ein Platzhalter:
 * REQ-26 (Nachweisgrad) ist als reine Funktion gebaut und getestet
 * (gemeinsam/nachweisgrad.ts), aber nicht in den PR-Grundlauf verdrahtet,
 * weil keine Anforderung im 47er-Bestand festlegt, welche Dateien eines
 * Pull Requests als "Anforderungen" zu pruefen sind. Der Ursachenvorschlag
 * aus Indizien (REQ-30) hat keine Indizien-Engine, weil D3-16 dafuer
 * historische Daten aus rund fuenfzig Gate-Laeufen verlangt, die es noch
 * nicht gibt: vorschlag bleibt bis dahin immer leer, uebernommen
 * entsprechend immer falsch.
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
import { formatiereBefund } from "../gemeinsam/meldung";
import { bestimmeDelegationsreife } from "../gemeinsam/delegationsreife";
import { ermittleStufenBedingungen } from "./delegationsreife-ermittlung";
import { erzeugeGate3Attest, GATE3_PFAD, istGate3Befehl, leseBegruendung } from "./gate3";
import { schreibeGate3Attest } from "./gate3speicher";

const ZEITGRENZE_MS = 60_000;
const ATTESTA_YML = "attesta.yml";

function arbeitsverzeichnis(): string {
  return process.env.GITHUB_WORKSPACE ?? process.cwd();
}

async function behandleGrundlauf(octokit: Octokit, owner: string, repo: string, prNummer: number, branch: string, sha: string): Promise<void> {
  const teile = ["## Attesta Zyklus", "", "Anforderungspruefung noch nicht implementiert, siehe REQ-24 bis REQ-26.", "", "Ursachencode, ein Klick setzt genau ein Feld:", "", formatiereAnkreuzfelder()];

  // REQ-35: eine abgelaufene, ungueltige oder fehlende Lizenz haelt den Lauf nicht an (GR-11.4),
  // nur ein Hinweis, der nach dreissig Tagen an den Kopf des Kommentars wandert (GR-11.5).
  const lizenzErgebnis = pruefeLizenz(core.getInput("lizenzschluessel") || undefined);
  const lizenzHinweis = formatiereLizenzhinweis(lizenzErgebnis);
  if (lizenzHinweis && istHinweisDringend(lizenzErgebnis)) {
    teile.unshift(`**${lizenzHinweis}**`, "");
  } else if (lizenzHinweis) {
    teile.push("", `_${lizenzHinweis}_`);
  }
  const body = teile.join("\n");

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

  // REQ-32 Abnahme 3: die Delegationsreife erscheint als Zeile im Check-Run.
  try {
    const bedingungen = await ermittleStufenBedingungen(octokit, { owner, repo, branch });
    const reife = bestimmeDelegationsreife(bedingungen);
    zusammenfassung += ` Delegationsreife: Stufe ${reife.stufe}.`;
  } catch (e) {
    core.warning(`Delegationsreife nicht ermittelbar: ${e instanceof Error ? e.message : String(e)}`);
  }

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

/**
 * Gate-3-Nachweis-Konvention (Entscheidung vom 24.08.2026). Selbstauskunft,
 * kein objektiver Beleg: dieselbe Freigaberecht-Pruefung wie beim
 * Ursachenwert "wollen". Fehlerverhalten: fehlt die Begruendung, wird das
 * fehlende Feld benannt statt den Befehl schweigend zu verwerfen.
 */
async function behandleGate3Befehl(octokit: Octokit, owner: string, repo: string, prNummer: number, kommentarBody: string, bestaetigtVon: string): Promise<void> {
  const berechtigt = await ermittleFreigaberecht(octokit, owner, repo, bestaetigtVon);
  if (!berechtigt) {
    core.warning(`Ablehnung: Gate-3-Bestaetigung erfordert Freigaberecht (admin oder write). ${bestaetigtVon} hat es nicht.`);
    return;
  }
  const begruendung = leseBegruendung(kommentarBody);
  if (!begruendung) {
    core.warning('Gate-3-Bestaetigung ohne Begruendung. Aufruf: /attesta gate3 bestanden <Begruendung>');
    return;
  }
  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNummer });
  const attest = erzeugeGate3Attest({ bestaetigtVon, datum: new Date(), begruendung });
  await schreibeGate3Attest(octokit, { owner, repo, branch: pr.head.ref }, attest);
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

  if (istGate3Befehl(comment.body)) {
    await behandleGate3Befehl(octokit, owner, repo, issue.number, comment.body, gesetztVon);
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

/**
 * Anforderungsguete auf Issue-Texten, REQ-25, zweiter Fundort neben der
 * Konsole (die Dateien lokal ohne Netz prueft). Ruft denselben
 * Programmteil auf wie `attesta guete <Pfad>`, siehe gemeinsam/guete.ts.
 */
async function behandleIssueEreignis(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const issue = context.payload.issue as { number: number; body?: string | null } | undefined;
  if (!issue?.body) {
    core.info("Issue ohne Text, nichts zu pruefen");
    return;
  }

  const ergebnis = pruefeAnforderungMitRegelsatz(issue.body);
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
  try {
    const wurzel = arbeitsverzeichnis();
    profilBefunde = vergleicheProfilVerzeichnis(`${wurzel}/attesta/profil`, `${wurzel}/attesta/profil.lock`, PROFILBASIS);
  } catch (e) {
    core.warning(`Profilvergleich fuer den Bericht nicht moeglich: ${e instanceof Error ? e.message : String(e)}`);
  }

  const inhalt = erzeugeBerichtsinhalt({ monat, ursachen, notfaelle, profilBefunde, jetzt: new Date() });
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
