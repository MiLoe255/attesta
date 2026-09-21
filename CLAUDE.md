# Arbeiten an diesem Repository

**Rolle dieses Repositoriums:** Öffentliche Nachweisschicht, geparkt bis 01.03.2027; bezieht den Regelsatz aus `attesta-core`. Hoheit über alle fünf Repositorien: `attesta-plattform/docs/produktisierung/hoheit.md`.

Dieses Repositorium ist öffentlich. Es enthält keinen Methodiktext und keine Regelquelle; beides wird über `scripts/generate-*.ts` aus `attesta-core` erzeugt (`npm run generate`). Änderungen am Regelinhalt gehören dorthin, nicht hierher.

**Prüfbefehl:** `npm test`. Node 22 oder neuer. Voraussetzung ist `../attesta-core`, gebaut, als Nachbarordner (siehe `package-lock.json` und `.github/workflows/pruefen.yml`).

**Historie:** Am 21.09.2026 umgeschrieben, siehe `HERKUNFT.md`.
