/**
 * Baut den Inhalt der Konfigurationsseite, Arbeitspaket 16 (REQ-43 bis
 * REQ-45). Reine Funktionen ohne Ein-/Ausgabe, damit sie ohne einen
 * echten Dateisystemzugriff testbar sind. scripts/generate-konfigurator.ts
 * ruft sie auf und schreibt das Ergebnis.
 *
 * Die drei Profildateien werden mit derselben Funktion formatiert wie bei
 * `attesta init` (formatiereProfildatei), damit GR-14.5 (byteweise gleiche
 * Ausgabe) strukturell gilt statt nur behauptet zu sein. Workflow und
 * Issue-Formular sind statische Vorlagen ohne Abhaengigkeit von rules/.
 *
 * Die erzeugte Seite selbst enthaelt kein Eingabefeld fuer einen
 * Lizenzschluessel (REQ-45) und legt nichts in Browserspeicher oder
 * Keksen ab (REQ-44). Alles laeuft nach dem Laden ohne weitere
 * Netzanfrage an den Betreiber (REQ-43, GR-14.1); die "Datei anlegen"-Links
 * sind eine Nutzer-initiierte Navigation zu github.com, keine Anfrage
 * dieser Seite an den Betreiber.
 */
import { ladeProfilBasis, type ProfilBasis } from "./regelsatz";
import { formatiereProfildatei } from "./profildatei";
import { WORKFLOW_PFAD, WORKFLOW_VORLAGE, ISSUE_FORMULAR_PFAD, ISSUE_FORMULAR_VORLAGE } from "./vorlagen";
import { EIGENE_ROLLEN_PFAD, EIGENE_ROLLEN_VORLAGE } from "./eigene-rollen";

export interface Datei {
  pfad: string;
  inhalt: string;
}

export function sammleDateien(basis: ProfilBasis = ladeProfilBasis()): Datei[] {
  const profilDateien: Datei[] = basis.dateien.map((datei) => ({
    pfad: `attesta/profil/${datei.dateiname}`,
    inhalt: formatiereProfildatei(datei, basis.basisversion),
  }));
  return [
    ...profilDateien,
    { pfad: EIGENE_ROLLEN_PFAD, inhalt: EIGENE_ROLLEN_VORLAGE },
    { pfad: WORKFLOW_PFAD, inhalt: WORKFLOW_VORLAGE },
    { pfad: ISSUE_FORMULAR_PFAD, inhalt: ISSUE_FORMULAR_VORLAGE },
  ];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function abschnitt(datei: Datei, index: number): string {
  const id = `datei-${index}`;
  return `
      <section class="datei">
        <h2><code>${escapeHtml(datei.pfad)}</code></h2>
        <div class="werkzeuge">
          <button type="button" data-kopieren="${id}">Kopieren</button>
          <a href="#" data-anlegen="${id}" data-pfad="${escapeHtml(datei.pfad)}">Datei im Repository anlegen</a>
        </div>
        <pre id="${id}"><code>${escapeHtml(datei.inhalt)}</code></pre>
      </section>`;
}

export function erzeugeHtml(dateien: Datei[]): string {
  const abschnitte = dateien.map(abschnitt).join("\n");
  const dateienJson = JSON.stringify(dateien.map((d) => ({ pfad: d.pfad, inhalt: d.inhalt })));

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Attesta Zyklus: Konfigurator</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 60rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { margin-bottom: 0.2rem; }
  .marke { color: #2A4046; font-weight: 600; }
  .hinweis { border: 1px solid currentColor; border-radius: 0.4rem; padding: 0.8rem 1rem; margin: 1rem 0; }
  .datei { margin: 2rem 0; }
  .datei h2 { font-size: 1rem; }
  .werkzeuge { display: flex; gap: 0.75rem; align-items: center; margin: 0.4rem 0; }
  pre { overflow-x: auto; padding: 0.8rem; border: 1px solid #8884; border-radius: 0.4rem; }
  button { cursor: pointer; }
  label { display: block; margin-top: 1.5rem; font-weight: 600; }
  input[type="text"] { width: 100%; box-sizing: border-box; padding: 0.4rem; margin-top: 0.3rem; }
  footer { margin-top: 3rem; font-size: 0.9rem; opacity: 0.8; }
</style>
</head>
<body>
<noscript>
  <p><strong>Diese Seite braucht JavaScript.</strong> Ohne JavaScript nutze stattdessen die Konsole: <code>npx attesta init</code> im eigenen Repository.</p>
</noscript>

<h1><span class="marke">Attesta Zyklus</span>: Konfigurator</h1>
<p>Erzeugt Profil, Workflow und Issue-Formular vollstaendig in diesem Browser. Nach dem Laden dieser Seite verlaesst keine Anfrage deinen Rechner in Richtung des Betreibers, und nichts wird hier dauerhaft gespeichert: ein Neuladen leert alle Felder.</p>

<div class="hinweis">
  <strong>Kein Feld fuer einen Lizenzschluessel.</strong> Der Schluessel gehoert als Repository-Geheimnis <code>ATTESTA_LIZENZSCHLUESSEL</code> unter <em>Settings, Secrets and variables, Actions</em> in dein eigenes Repository, niemals auf eine fremde Seite.
</div>

<label for="repo">Repository (optional, nur fuer die Anlegen-Links unten, wird nirgends gespeichert)</label>
<input type="text" id="repo" placeholder="dein-konto/dein-repository" autocomplete="off">

${abschnitte}

<footer>
  PROSTRUCTIVE&reg; Consulting &amp; Management. Lizenz siehe LICENSE im Repository <code>attesta</code>.
</footer>

<script>
(function () {
  "use strict";
  var dateien = ${dateienJson};

  function repo() {
    var feld = document.getElementById("repo");
    return feld && feld.value.trim();
  }

  document.querySelectorAll("[data-kopieren]").forEach(function (knopf) {
    knopf.addEventListener("click", function () {
      var ziel = document.getElementById(knopf.getAttribute("data-kopieren"));
      var text = ziel ? ziel.textContent : "";
      if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).then(function () {
          var alt = knopf.textContent;
          knopf.textContent = "Kopiert";
          setTimeout(function () { knopf.textContent = alt; }, 1500);
        });
      }
    });
  });

  document.querySelectorAll("[data-anlegen]").forEach(function (link) {
    link.addEventListener("click", function (ereignis) {
      var name = repo();
      if (!name) {
        ereignis.preventDefault();
        window.alert("Repository-Feld ausfuellen, zum Beispiel dein-konto/dein-repository.");
        return;
      }
      var pfad = link.getAttribute("data-pfad");
      var eintrag = dateien.filter(function (d) { return d.pfad === pfad; })[0];
      var inhalt = eintrag ? eintrag.inhalt : "";
      link.setAttribute(
        "href",
        "https://github.com/" + encodeURIComponent(name).replace(/%2F/g, "/") +
          "/new/main?filename=" + encodeURIComponent(pfad) + "&value=" + encodeURIComponent(inhalt)
      );
    });
  });
})();
</script>
</body>
</html>
`;
}
