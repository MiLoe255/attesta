/**
 * Erzeugt docs/regelsatz/index.html, D4-21 und REQ-46 Abnahme 2.
 *
 * Warum es diese Seite gibt: attesta-core ist privat, ein Interessent
 * kann den Regelsatz vor der Installation nicht im Repository lesen
 * (technisches Konzept A2). Diese Seite ersetzt die Einsehbarkeit. Der
 * Schutz liegt in der Lizenz, nicht in der Geheimhaltung.
 *
 * Erzeugt, nicht getippt: die Seite kann nicht vom Regelsatz abweichen.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  ladeMeta, ladeCriticality, ladeDelegation, ladeKsMatrix, ladeTraceDepth,
  ladePhasen, ladeRollen, ladeUnschaerfe, ladeUrsachen, ladeTechnologien,
  ladeDelegationsreife, ladeNotfall,
} from "@miloe255/attesta-core";

const ZIEL = join(__dirname, "..", "docs", "regelsatz", "index.html");

function esc(t: unknown): string {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function tabelle(kopf: string[], zeilen: string[][]): string {
  return `<table><thead><tr>${kopf.map((k) => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${zeilen
    .map((z) => `<tr>${z.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}
function abschnitt(id: string, titel: string, inhalt: string): string {
  return `<section id="${id}"><h2>${esc(titel)}</h2>${inhalt}</section>`;
}
function liste(werte: readonly unknown[]): string {
  return `<p>${werte.map((w) => `<code>${esc(w)}</code>`).join(", ")}</p>`;
}

/**
 * Stellt einen Regelwert lesbar dar.
 *
 * Hier stand JSON.stringify. Damit war ausgerechnet die K-mal-S-Matrix, der
 * Kern des Verfahrens, die einzige Tabelle dieser Seite, in der die
 * Datenstruktur durchschlug: `{"wert":"S4"}` statt S4, bei K3 eine dreizeilige
 * Struktur. Rollen, Unschaerfewoerter, Ursachen und Notfall daneben waren von
 * Anfang an aufbereitet. Da die Seite fuer Interessenten die Einsehbarkeit des
 * privaten Regelsatzes ersetzt, ist sie die einzige Fassung, die sie zu sehen
 * bekommen.
 *
 * Generisch statt ein Sonderfall je Dimension: Die Dimensionen tragen
 * verschiedene Schluessel (wert, pflicht, modi, umfang, verweis, ausnahme),
 * aber alle dieselbe Form, naemlich einen Hauptwert und benannte Zusaetze.
 * Kommt eine Dimension hinzu, faellt sie hier nicht durch.
 */
const HAUPTSCHLUESSEL = ["wert", "pflicht", "modi", "pfad", "verweis"];

function klartext(wert: unknown): string {
  if (wert === null || wert === undefined) return "";
  if (typeof wert === "boolean") return wert ? "ja" : "nein";
  if (typeof wert === "string") return wert.replaceAll("_", " ");
  if (Array.isArray(wert)) return wert.map(klartext).join(", ");
  if (typeof wert !== "object") return String(wert);

  const eintraege = Object.entries(wert as Record<string, unknown>).filter(([k]) => k !== "label");
  const haupt = eintraege.filter(([k]) => HAUPTSCHLUESSEL.includes(k));
  const zusatz = eintraege.filter(([k]) => !HAUPTSCHLUESSEL.includes(k));

  // Ein Pfad ist eine Folge, keine Aufzaehlung. Das ist der einzige Schluessel,
  // dessen Bedeutung die Darstellung aendert.
  const hauptteil = haupt
    .map(([k, v]) => (k === "pfad" && Array.isArray(v) ? v.map(klartext).join(" \u2192 ") : klartext(v)))
    .join(", ");
  const zusatzteil = zusatz.map(([k, v]) => `${k.replaceAll("_", " ")}: ${klartext(v)}`).join("; ");

  return [hauptteil, zusatzteil].filter(Boolean).join(". ");
}

function zelle(wert: unknown): string {
  return esc(klartext(wert));
}

function main(): void {
  const meta = ladeMeta();
  const crit = ladeCriticality();
  const deleg = ladeDelegation();
  const matrix = ladeKsMatrix();
  const trace = ladeTraceDepth();
  const phasen = ladePhasen();
  const rollen = ladeRollen();
  const unschaerfe = ladeUnschaerfe();
  const ursachen = ladeUrsachen();
  const technologien = ladeTechnologien();
  const reife = ladeDelegationsreife();
  const notfall = ladeNotfall();

  const dim = matrix.dimensionen as Record<string, Record<string, unknown>>;
  const abschnitte = [
    abschnitt("kritikalitaet", "Kritikalität, K1 bis K3",
      tabelle(["Stufe", "Definition", "Typische Fälle"],
        (["K1", "K2", "K3"] as const).map((k) => [`<b>${esc(crit.stufen[k].label)}</b>`, esc(crit.stufen[k].definition), esc(crit.stufen[k].typische_faelle.join(", "))])) +
      `<p><b>Einstufungsfragen, in dieser Reihenfolge:</b></p><ol>${crit.einstufungsfragen.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>`),

    abschnitt("delegation", "Delegationsstufen, S1 bis S4",
      tabelle(["Stufe", "Modus", "KI-Rolle", "Mensch-Rolle"],
        (["S1", "S2", "S3", "S4"] as const).map((s) => [`<b>${esc(deleg.stufen[s].label)}</b>`, esc(deleg.stufen[s].modus), esc(deleg.stufen[s].ki_rolle), esc(deleg.stufen[s].mensch_rolle)])) +
      `<p class="regel"><b>Harte Regel:</b> ${esc(deleg.guardrail_regel.bedingung)} ist die höchste zulässige Stufe <b>${esc(deleg.guardrail_regel.obergrenze)}</b>, unabhängig von K. ${esc(deleg.reifegrundsatz)}</p>`),

    abschnitt("matrix", "K-mal-S-Matrix",
      tabelle(["Dimension", "K1", "K2", "K3"],
        Object.keys(dim).map((name) => [`<b>${esc((dim[name] as { label: string }).label)}</b>`,
          zelle(dim[name].K1), zelle(dim[name].K2), zelle(dim[name].K3)]))),

    abschnitt("traceability", "Traceability-Tiefe",
      `<p>Knoten: ${trace.knoten.map((k) => `<code>${esc(k)}</code>`).join(" → ")}</p>` +
      tabelle(["K-Stufe", "Pflichttiefe"], Object.entries(trace.stufen).map(([k, v]) => [`<b>${esc(k)}</b>`, zelle(v)]))),

    abschnitt("phasen", "Phasenfolge P0 bis P6",
      tabelle(["Phase", "Zweck", "Gate"], Object.entries(phasen.phasen).map(([p, v]) => [`<b>${esc(p)}</b>`, esc(v.zweck), esc(v.gate)])) +
      `<p><b>Statusfluss P4:</b> ${esc(phasen.statusfluss_p4.join(" → "))}</p>`),

    abschnitt("rollen", "Rollen, zulässige Akteure einer Anforderung",
      tabelle(["Kennung", "Anzeigename", "Definition"], rollen.rollen.map((r) => [`<code>${esc(r.kennung)}</code>`, esc(r.anzeigename), esc(r.definition)]))),

    abschnitt("unschaerfe", "Unschärfewörter",
      tabelle(["Wort", "Stufe", "Hinweis"], unschaerfe.woerter.map((w) => [`<code>${esc(w.wort)}</code>`, `<b>${esc(w.stufe)}</b>`, esc(w.hinweis ?? "")])) +
      `<p class="regel">Ein Wort der Stufe <code>warnung</code> färbt den Check-Run neutral und blockiert nicht. Ein Wort der Stufe <code>verstoss</code> blockiert.</p>`),

    abschnitt("ursachen", "Ursachencodes",
      tabelle(["Kennung", "Label", "Beschreibung"], ursachen.werte.map((u) => [`<code>${esc(u.kennung)}</code>`, esc(u.label), esc(u.beschreibung) + (u.nur_reviewer ? ' <b>(nur mit Freigaberecht, nie maschinell vorgeschlagen)</b>' : "")]))),

    abschnitt("reife", "Delegationsreife",
      tabelle(["Stufe", "Trägt bis", "Bedingungen"], Object.entries(reife.stufen).map(([s, v]) => [`<b>${esc(s)}</b>`, `<code>${esc(v.traegt_bis)}</code>`, v.bedingungen.map((b) => `<code>${esc(b)}</code>`).join(", ")])) +
      `<p class="regel"><b>Belegte Historie für Stufe 4:</b> ${esc(reife.historie.arbeitspakete_in_folge)} Arbeitspakete in Folge, ohne Notfall und ohne Ursachencode <code>werkzeugfehler</code>. Die Zahl ist gesetzt und nicht gemessen.</p>`),

    abschnitt("notfall", "Notfallpfad",
      tabelle(["Feld", "Wert"], [
        ["Befehl", `<code>${esc(notfall.befehl)}</code>`],
        ["Zustand des Check-Runs", `<code>${esc(notfall.check_run_zustand)}</code>`],
        ["Frist zur Nachdokumentation", `${esc(notfall.frist.arbeitstage)} Arbeitstage, Wochenende zählt ${notfall.frist.wochenende_zaehlt ? "mit" : "nicht"}`],
        ["Schwelle je Quartal", esc(notfall.schwelle_je_quartal)],
      ]) +
      tabelle(["Zustand", "Bedeutung"], notfall.zustaende.map((z) => [`<code>${esc(z.kennung)}</code>`, esc(z.beschreibung)]))),

    abschnitt("technologien", "Technologiebegriffe",
      `<p>Eine Nennung dieser Begriffe in einer Anforderung führt zu einer Warnung, nicht zu einem Verstoß: sie deutet auf eine Lösung im Anforderungsgewand.</p>` + liste(technologien.woerter)),
  ].join("\n");

  const nav = [
    ["kritikalitaet", "Kritikalität"], ["delegation", "Delegation"], ["matrix", "K-mal-S-Matrix"],
    ["traceability", "Traceability"], ["phasen", "Phasen"], ["rollen", "Rollen"],
    ["unschaerfe", "Unschärfe"], ["ursachen", "Ursachen"], ["reife", "Delegationsreife"],
    ["notfall", "Notfallpfad"], ["technologien", "Technologien"],
  ].map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join(" · ");

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Attesta Zyklus: der Regelsatz</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 68rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; }
  h1 { margin-bottom: .2rem; } h2 { margin-top: 2.5rem; border-bottom: 1px solid #8884; padding-bottom: .3rem; }
  .marke { color: #2A4046; font-weight: 600; }
  nav { margin: 1rem 0 2rem; font-size: .9rem; }
  nav a { margin-right: .2rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; display: block; overflow-x: auto; }
  th, td { border: 1px solid #8884; padding: .45rem .6rem; text-align: left; vertical-align: top; font-size: .92rem; }
  th { background: #8881; }
  code { font-size: .88em; }
  .regel { border-left: 3px solid currentColor; padding-left: .8rem; }
  .hinweis { border: 1px solid currentColor; border-radius: .4rem; padding: .8rem 1rem; margin: 1rem 0; }
  footer { margin-top: 3rem; font-size: .9rem; opacity: .8; }
</style>
</head>
<body>
<h1><span class="marke">Attesta Zyklus</span>: der Regelsatz</h1>
<p>Regelsatzversion <b>${esc(meta.version)}</b>. Diese Seite ist vollständig aus <code>rules/</code> erzeugt und kann vom Regelsatz nicht abweichen.</p>

<div class="hinweis">
  <b>Lizenz.</b> Der Regelsatz steht unter PolyForm Internal Use 1.0.0: Nutzung und Änderung für den eigenen Betrieb sind erlaubt, die Weitergabe an Dritte nicht. Diese Seite zeigt ihn vollständig, damit vor der Installation lesbar ist, worauf man sich einlässt. Der Schutz liegt in der Lizenz, nicht in der Geheimhaltung.
</div>

<nav>${nav}</nav>
${abschnitte}

<footer>PROSTRUCTIVE&reg; Consulting &amp; Management. Erzeugt aus dem Regelsatz, Version ${esc(meta.version)}.</footer>
</body>
</html>
`;
  mkdirSync(join(__dirname, "..", "docs", "regelsatz"), { recursive: true });
  writeFileSync(ZIEL, html, "utf-8");
  console.log(`geschrieben: ${ZIEL}`);
}

main();
