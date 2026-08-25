# Attesta Zyklus: Inbetriebnahme

**Schritt-für-Schritt-Anleitung für das erste Repository**
Stand 25.08.2026 | gilt für `attesta` ab Commit `ae3e72a`

Diese Anleitung ist einmal vollständig durchgespielt worden, in einem echten
GitHub-Repository, mit echten Workflow-Läufen. Jeder Schritt unten ist belegt
und keine Absichtserklärung. Wo etwas noch fehlt oder hakt, steht es als
solches gekennzeichnet dabei.

**Zeitbedarf:** rund 30 Minuten für Schritt 1 bis 6, danach läuft es.

---

## 0. Was du vorher wissen solltest

### Wo der Regelsatz nachzulesen ist

`docs/regelsatz/index.html` im Repository `attesta` zeigt den vollständigen
Regelsatz als Text: Kritikalität, Delegation, K-mal-S-Matrix, Traceability,
Phasen, Rollen, Unschärfewörter, Ursachencodes, Delegationsreife und
Notfallpfad. Die Seite ist aus `rules/` erzeugt und kann davon nicht
abweichen. Datei herunterladen und im Browser öffnen.

### Der Reifegrad in einem Satz

Der Bausatz läuft im echten Betrieb und erzeugt Kommentare, Check-Runs,
Ursachendateien, Notfalldateien und den Monatsbericht. **Die inhaltliche
Regelprüfung im Pull Request fehlt noch** (siehe Abschnitt 9), der Check-Run
steht deshalb im Grundlauf immer auf `neutral`.

### Drei Dinge, die es heute noch nicht gibt

| Fehlt | Folge für dich | Herkunft |
|---|---|---|
| Marketplace-Eintrag | Der Workflow verweist auf `MiLoe255/attesta@main` statt auf eine Versionsmarke | D1-7, Wortmarke ist vor jeder Veröffentlichung anzumelden |
| Veröffentlichung auf npm | `npx attesta init` funktioniert nicht. Der Weg über den Konfigurator ersetzt es, siehe Schritt 3 | `package.json` trägt `private: true` |
| Veröffentlichte Webseiten | Konfigurator und Regelsatzseite werden lokal geöffnet statt im Web aufgerufen. Beide liegen als HTML im Repository unter `docs/` | GitHub Pages ist für `attesta` nicht eingeschaltet |

### Was der Bausatz an deinem Repository verändert

Er legt Dateien an, immer auf dem Zweig des jeweiligen Pull Requests und
niemals direkt auf dem Hauptzweig:

| Datei | Wann sie entsteht |
|---|---|
| `attesta/profil/*.yaml`, drei Stück | bei der Einrichtung, durch dich |
| `attesta/profil.lock` | bei der Einrichtung, durch dich |
| `attesta/rollen-eigene.yaml` | bei der Einrichtung, danach von dir gepflegt |
| `attesta/ursachen/*.yaml` | sobald jemand einen Ursachencode setzt |
| `attesta/notfaelle/*.yaml` | sobald jemand `/attesta notfall` ruft |
| `attesta/gates/p3-bestanden.yaml` | sobald jemand Gate 3 bestätigt |
| `attesta/BERICHT.md` | monatlich, als eigener Pull Request |

---

## 1. Repository vorbereiten

Du brauchst ein GitHub-Repository, in dem du Administrator bist. Ein frisches
Testrepository ist für den ersten Durchlauf besser als ein laufendes Projekt.

```bash
gh repo create mein-attesta-test --private --clone
cd mein-attesta-test
```

---

## 2. Die eine Einstellung, die sonst später scheitert

**Ohne diesen Schritt bricht der Monatsbericht ab.** Er war der einzige echte
Stolperstein im Testdurchlauf, und die Fehlermeldung nennt die Ursache nicht
sofort.

Über die Oberfläche:

> Settings, Actions, General, Abschnitt "Workflow permissions"
> 1. **Read and write permissions** auswählen
> 2. Haken bei **Allow GitHub Actions to create and approve pull requests** setzen
> 3. Save

Oder über die Konsole:

```bash
gh api -X PUT repos/DEIN-KONTO/mein-attesta-test/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true
```

**Warum das nötig ist:** Der Monatsbericht kommt nach REQ-37 als Pull Request
und nie als direkter Commit. GitHub verbietet Actions das Anlegen von Pull
Requests, solange dieser Haken fehlt. Die Fehlermeldung lautet dann
`GitHub Actions is not permitted to create or approve pull requests`.

**Zur Einordnung:** Der zweite Haken erlaubt einer Action auch das Freigeben
fremder Pull Requests. Wenn dein Betrieb das nicht will, lass ihn weg. Dann
läuft alles außer dem Monatsbericht, und der scheitert mit der oben genannten
Meldung, ohne etwas kaputt zu machen.

---

## 3. Profil und Vorlagen erzeugen

Zwei Wege führen zum selben Ergebnis. Die erzeugten Dateien sind byteweise
identisch, das ist durch einen Test abgesichert (GR-14.5).

### Weg A: Konfigurator im Browser, für jeden geeignet

1. Datei `docs/konfigurator/index.html` aus dem Repository `MiLoe255/attesta`
   herunterladen
2. Im Browser öffnen, per Doppelklick, ohne Webserver
3. Oben dein Repository eintragen, etwa `dein-konto/mein-attesta-test`
4. Je Datei entweder **Kopieren** und von Hand anlegen oder
   **Datei im Repository anlegen** klicken

Die Seite erzeugt sechs Dateien: drei Profildateien, die Datei für
betriebseigene Rollen, den Workflow und das Issue-Formular. Sie sendet dabei nichts an den Betreiber und speichert nichts
im Browser, ein Neuladen leert alle Felder.

### Weg B: Konsole, nur mit Zugriff auf `attesta-core`

Dieser Weg setzt das private Paket `@miloe255/attesta-core` voraus und
funktioniert deshalb heute nur für den Betreiber, nicht für Kunden.

```bash
# einmalig, im Verzeichnis von attesta-core
npm link

# im Verzeichnis von attesta
npm link @miloe255/attesta-core
npm run build

# im Kundenrepository
node /pfad/zu/attesta/dist/konsole.js init
```

Die Konsole schreibt dieselben drei Profildateien, dazu `attesta/profil.lock`
und `attesta/betriebskennung`. Ein zweiter Lauf bricht ab, statt Bestehendes zu
überschreiben. Mit `--ueberschreiben` ersetzt er es ausdrücklich.

---

## 4. Workflow einsetzen

Lege `.github/workflows/attesta.yml` an:

```yaml
name: Attesta Zyklus

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created, edited]
  workflow_dispatch: {}
  schedule:
    - cron: "0 6 1 * *"

permissions:
  contents: write
  issues: write
  pull-requests: write
  checks: write

jobs:
  attesta:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: MiLoe255/attesta@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Zu `contents: write`:** Die Action legt Dateien in deinem Repository ab,
deshalb genügt Lesezugriff hier nicht. Es bleiben vier Rechte, ein fünftes
kommt nicht hinzu.

Der Lizenzschlüssel ist an dieser Stelle bewusst weggelassen. Er ist optional,
und ohne ihn läuft alles weiter, siehe Abschnitt 7.

---

## 5. Erster Durchlauf, Grundlauf am Pull Request

```bash
git checkout -b test-1
mkdir -p docs/specs
cat > docs/specs/req-01.md <<'EOF'
### REQ-01 · Beispielanforderung
> Der Reviewer muss binnen 60 Sekunden antworten.
K2 · Muss
EOF
git add -A && git commit -m "Beispielanforderung"
git push -u origin test-1
gh pr create --title "Erster Test" --body "Inbetriebnahme"
```

**Was du binnen einer Minute sehen solltest:**

1. Ein Kommentar am Pull Request mit der Überschrift `## Attesta Zyklus` und
   sieben Ankreuzfeldern
2. Ein Check-Run namens `attesta` im Zustand `neutral`, mit der Zeile
   `Delegationsreife: Stufe 1`

Bleibt beides aus, sieh unter Actions in den Lauf. Die häufigste Ursache ist
ein Tippfehler im Workflow oder eine fehlende Berechtigung aus Schritt 2.

---

## 6. Die Bedienung ausprobieren

Alle vier Bedienwege sind im Testdurchlauf bestätigt worden.

### Ursachencode über ein Ankreuzfeld

Klicke im festen Kommentar genau ein Ankreuzfeld an, etwa **Klarheit**.
Binnen einer Minute entsteht `attesta/ursachen/pr-1-<zeitstempel>.yaml` auf dem
Zweig des Pull Requests, mit deinem Namen als setzender Person.

**Zwei Felder gleichzeitig führen zu keinem Eintrag**, das ist Absicht
(GR-7.2). Der Lauf meldet dann eine Rückfrage im Protokoll.

### Ursachencode über einen Befehl

Als Kommentar am Pull Request:

```
/attesta ursache koennen
```

Erzeugt denselben Eintrag wie das Ankreuzfeld. Ein unbekannter Wert führt zu
einer Meldung mit der Liste der sieben zulässigen Werte.

**Der Wert `wollen` ist ein Sonderfall.** Er wird nie maschinell
vorgeschlagen und nur von einer Person mit Schreib- oder Administratorrecht
angenommen. Er ist eine Aussage über einen benannten Menschen, deshalb diese
Hürde.

### Notfallpfad

```
/attesta notfall
```

Legt `attesta/notfaelle/pr-1-<zeitstempel>.yaml` an, setzt den Check-Run auf
`neutral` und nennt eine Frist von drei Arbeitstagen zur Nachdokumentation.
Der Check-Run wechselt dabei nie auf `erfolg`, auch nicht auf `fehlschlag`:
ein blockierendes Gate soll umgehbar sein, ohne dass daraus ein grünes Gate
wird.

**Wie ein Notfall wieder geschlossen wird, ist noch offen**, siehe Abschnitt 9,
offener Punkt 3.

### Gate 3 bestätigen

```
/attesta gate3 bestanden Pipeline laeuft seit drei Wochen gruen
```

Legt `attesta/gates/p3-bestanden.yaml` an. Setzt Schreib- oder
Administratorrecht voraus, und die Begründung ist Pflicht.

**Das ist eine Selbstauskunft und kein objektiver Nachweis.** Der Bausatz
prüft nicht, ob Gate 3 wirklich durchlaufen wurde, nur dass eine berechtigte
Person es behauptet hat.

---

## 6b. Eigene Rollen eintragen

Die Anforderungsprüfung verlangt einen benannten Akteur. Der generische
Grundbestand führt neun Rollen: Auftraggeber, Fachexperte, technische Leitung,
Entwicklung, Reviewer, Qualitätssicherung, Betrieb, Endnutzer, KI-Agent.

**Rollennamen aus deinem Betrieb trägst du selbst ein**, in
`attesta/rollen-eigene.yaml`:

```yaml
rollen:
  - kennung: produktionsleiter
    anzeigename: "Produktionsleiter"
    definition: "verantwortet die laufende Fertigung und den Ausschuss einer Schicht"
```

| Regel je Eintrag | |
|---|---|
| `kennung` | Kleinbuchstaben, Ziffern, Unterstrich. Nicht aus dem Grundbestand |
| `anzeigename` | so, wie die Rolle in einer Anforderung geschrieben wird |
| `definition` | mindestens fünf Wörter |

**Diese Datei gehört dir.** Sie ist kein Teil des Profils, wird bei einem
Basiswechsel nie überschrieben und nicht gegen die Profilbasis geprüft. Ein
Tippfehler darin hält keinen Lauf an: der Befund wird benannt, und geprüft wird
mit dem Grundbestand weiter.

---

## 7. Anforderungsgüte ausprobieren

Lege ein Issue an, mit einem absichtlich schlechten Anforderungstext:

```
> Man sollte das System irgendwie schnell und angemessen verbessern.
```

Der Bausatz antwortet mit einem Kommentar, der die verletzten Prüfungen nennt,
etwa:

```
- Verstoss gegen `Issue #2`, Modalverb: kein Modalverb (muss, soll, kann) gefunden
- Verstoss gegen `Issue #2`, benannter Akteur: keine Rolle aus rollen.yaml gefunden
- Verstoss gegen `Issue #2`, kein Unschaerfewort: Wort: schnell
```

Sechs Prüfungen laufen: ein Modalverb, benannter Akteur, messbares
Abnahmekriterium, kein Unschärfewort, keine Technologievorgabe, Pflichtfelder
gefüllt.

**Drei Merkmale bleiben menschliches Urteil und werden nicht behauptet:**
notwendig, korrekt, angemessen.

Dieselbe Prüfung läuft über die Konsole auf einer Datei:

```bash
node /pfad/zu/attesta/dist/konsole.js guete docs/specs/req-01.md
```

Rückgabewert 0 ohne Befund, 1 bei Befund. Ohne Netzverbindung.

---

## 8. Monatsbericht auslösen

Der Bericht läuft automatisch am ersten Kalendertag um 6 Uhr. Zum Ausprobieren
löst du ihn von Hand aus:

> Actions, Attesta Zyklus, Run workflow

Oder:

```bash
gh workflow run attesta.yml --repo DEIN-KONTO/mein-attesta-test --ref main
```

**Ergebnis:** ein Pull Request mit dem Titel `Attesta Zyklus: Monatsbericht
2026-08`, der `attesta/BERICHT.md` mit sieben Abschnitten enthält.

Ein zweiter Lauf im selben Monat ergänzt diesen Pull Request und legt keinen
zweiten an.

**Der letzte Abschnitt "Was daraus folgt" ist absichtlich leer.** Er ist der
eigentliche Grund für das ganze Artefakt: der Bericht ist ein Arbeitsblatt und
keine Anzeige. Was dort eingetragen wird, ist der Rohstoff für das
Outcome-Review.

**Der Bericht liest ausschließlich vom Hauptzweig.** Ursachen- und
Notfalldateien, die noch in einem offenen Pull Request liegen, erscheinen erst
nach dem Merge.

---

## 9. Was heute noch nicht funktioniert

Ehrlich benannt, damit du es nicht selbst suchen musst.

| # | Offener Punkt | Auswirkung |
|---|---|---|
| 1 | **Die Regelprüfung im Pull Request fehlt** | Der Check-Run im Grundlauf steht immer auf `neutral`. Welche Dateien eines Pull Requests als Anforderungen zu prüfen sind, legt keine Anforderung fest |
| 2 | **Ein Notfall lässt sich nicht schließen** | Das Feld `nachdokumentiert_am` wird ausgewertet, aber von keinem Befehl gesetzt. Bis dahin von Hand in die Datei eintragen |
| 3 | **Nachweisgrad ist nie bestimmbar** | Kettendeckung und Belegfrische fehlen. Der Bericht sagt das offen, statt eine Zahl zu erfinden |
| 4 | **Erstdurchlaufquote je Delegationsstufe ist immer null** | Keine Anforderung zeichnet eine Delegationsreife-Historie auf |
| 5 | **Verzichte fehlen ganz** | `/attesta verzicht` steht im technischen Konzept, ist aber in keiner der 47 Anforderungen definiert |
| 6 | **Kennzahlversand sendet nichts** | `attesta kennzahlen --probe` zeigt den Datensatz, der Versand selbst ist gesperrt, bis die Auftragsverarbeitung geklärt ist (D2-13) |
| 7 | **Delegationsreife bleibt praktisch bei Stufe 1 oder 2** | Stufe 2 verlangt mindestens drei gemergte Pull Requests mit lückenloser Vier-Augen-Historie |

---

## 10. Beobachtungsmodus, der sanfte Einstieg

Wenn der Bausatz in einem laufenden Projekt zunächst nur mitlesen soll, lege
`attesta.yml` in der Wurzel deines Repositorys an:

```yaml
beobachtungsmodus: true
```

**Wirkung:** Jeder Check-Run bleibt im Zustand `neutral`, unabhängig vom
Befund. Die Befunde selbst erscheinen unverändert im Kommentar. Niemand wird
blockiert, alle sehen, was der Bausatz sehen würde.

Das ist ein Schalter und kein Zeitraum. Du kannst ihn später wieder
einschalten, etwa nach einer Regeländerung.

---

## 11. Lizenzschlüssel hinterlegen, optional

Der Bausatz läuft ohne Lizenzschlüssel vollständig. Ein fehlender, abgelaufener
oder ungültiger Schlüssel führt zu einem Hinweis im Kommentar und ändert den
Zustand des Check-Runs nicht.

Ein Werkzeug, das den Bau eines Kunden anhält, weil eine Rechnung offen ist,
wird ausgebaut und nicht bezahlt.

Wenn du einen Schlüssel hast:

> Settings, Secrets and variables, Actions, New repository secret
> Name: `ATTESTA_LIZENZSCHLUESSEL`

Und im Workflow ergänzen:

```yaml
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          lizenzschluessel: ${{ secrets.ATTESTA_LIZENZSCHLUESSEL }}
```

**Der Schlüssel gehört ausschließlich in das Repository-Geheimnis.** Der
Konfigurator hat bewusst kein Eingabefeld dafür: ein Schlüsselfeld auf einer
fremden Seite ist eine Gewöhnung, die später gegen den Kunden arbeitet.

---

## 12. Rückbau

Der Bausatz hinterlässt nur Dateien, kein Konto und keine Verbindung nach
außen.

```bash
rm .github/workflows/attesta.yml
rm -rf attesta/
rm .github/ISSUE_TEMPLATE/arbeitspaket.yml
```

Die erzeugten Ursachen- und Notfalldateien sind auch ohne den Bausatz lesbar
und auswertbar. Das ist Absicht.

---

PROSTRUCTIVE® Consulting & Management. Lizenz siehe `LICENSE`.
