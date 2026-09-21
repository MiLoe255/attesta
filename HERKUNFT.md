# Herkunft der Commit-Historie

Dieses Repositorium hat am 21.09.2026 eine dokumentierte Umschreibung seiner Commit-Historie erfahren. Diese Datei hält fest, was geändert wurde, warum, und wo der vorherige Stand gesichert ist. Der Inhalt der Commits (Dateibäume) ist unverändert, das ist je Commit über den Baumhash belegt.

Dieses Repositorium ist öffentlich. Wer es vor dem 21.09.2026 geklont hat, trägt die alte Historie und muss neu klonen oder auf `origin/main` zurücksetzen. Zum Zeitpunkt der Umschreibung gab es keine Forks.

## Was geändert wurde

| Feld | vorher | nachher |
|---|---|---|
| Autor und Committer, Name | `MichaelLoebbecke` | `Michael Löbbecke` |
| Autor und Committer, Adresse | `michael@snipe-solutions.de` | `michael.loebbecke@prostructive.de` |
| Betroffene Commits | 46 von 46 | |
| Tag `v0.1.0` (annotiert) | Tagger `michael@snipe-solutions.de`, Tagobjekt `8d87b99` auf Commit `290401b` | Tagger `michael.loebbecke@prostructive.de`, Tagobjekt `ac86908` auf Commit `4287373` |
| Ko-Autorenzeilen `Co-Authored-By: Claude ...` | 16 Commits | unverändert erhalten |
| Dateibäume | | unverändert, 46 von 46 Baumhashes identisch |
| Signaturen | keine | keine |
| `docs/inbetriebnahme.md` | verweist auf `ae3e72a` | verweist auf `8e96e38`, alter Hash in Klammern |

## Warum

Die Adresse `michael@snipe-solutions.de` gehört zu einem beendeten Mandat. Das Werk stammt von Michael Löbbecke und wird unter dem Konto `MiLoe255` mit der Adresse `michael.loebbecke@prostructive.de` geführt. Die Umschreibung ändert nur die Anzeige der Urheberschaft, nicht die Rechtslage. Sie ist Paket ID-04 des Produktisierungsplans in `attesta-plattform/docs/produktisierung/PRODUKTISIERUNGSPLAN.md`.

## Wie

`git filter-repo --mailmap` (Version 2.47.0) auf einem frischen Klon des Spiegelklons, mit der `.mailmap`, die seit dieser Umschreibung im Repositorium liegt. Danach `npm ci` und `npm test`: 206 Tests, alle grün, wie vor der Umschreibung. Dann Force-Push nach schriftlicher Freigabe.

Beim Prüflauf aufgefallen, nicht Teil dieser Umschreibung: Ein frischer Klon von `attesta` läuft nur, wenn `../attesta-core` daneben liegt und gebaut ist (`package-lock.json` führt das Paket als lokalen Link). Das ist Befund für DEP-02 im Produktisierungsplan.

## Sicherung des vorherigen Stands

| Angabe | Wert |
|---|---|
| Spiegelklon vor der Umschreibung | `~/Entwicklungsprojekte/_geparkt/spiegel-2026-09/attesta.git`, angelegt 21.09.2026 10:43, `git fsck` ohne Befund, 46 Commits, 3 Refs |
| Kopie außerhalb des Rechners | OneDrive PROSTRUCTIVE, Ordner Sicherungskopien, angelegt 21.09.2026 |
| Freigabe Force-Push | Michael Löbbecke, 21.09.2026, festgehalten in `attesta-plattform/docs/produktisierung/identitaet-bestand.md` Abschnitt 9 |

## Zuordnung alter zu neuer Commit-Hashes

| Ref | vorher | nachher |
|---|---|---|
| `main` | `4c07d60` | `2e8dc05` |
| `ap-m01-kernbibliothek` | `dd21b86` | `3b6ffd7` |
| `v0.1.0` | `290401b` | `4287373` |

Vollständige Liste, alt nach neu:

- `0e5caaf` nach `1d49a0e`
- `0f41807` nach `60d4f2a`
- `151de34` nach `684ba35`
- `1cc6acd` nach `267437f`
- `25ab6e1` nach `5d43e45`
- `290401b` nach `4287373`
- `3218dcc` nach `ae976e4`
- `375f965` nach `7fc2086`
- `38072b8` nach `604c4cc`
- `3b10fea` nach `4b3c556`
- `3d7cf4a` nach `ade6784`
- `3e752ea` nach `c97e00d`
- `3edf6a8` nach `bdb8c00`
- `42f25e3` nach `5958208`
- `463568d` nach `45fe91e`
- `4c07d60` nach `2e8dc05`
- `4c6c593` nach `d8b4f72`
- `4ce9fb7` nach `e85f6d6`
- `6980cbc` nach `aaff66e`
- `6d8f7f3` nach `8e45568`
- `77d4dc6` nach `0ec3224`
- `8015e2b` nach `f752f08`
- `81ec949` nach `9920c1e`
- `87f7eb8` nach `08698bf`
- `8b8f711` nach `dab39f0`
- `94cce00` nach `642ab32`
- `a180699` nach `9385216`
- `a29a983` nach `bdacbb4`
- `ae3e72a` nach `8e96e38`
- `b20123e` nach `2e7a76f`
- `b3b9122` nach `643a6aa`
- `c1e1b83` nach `8b850eb`
- `c2c62bc` nach `98dd710`
- `d7f450e` nach `cfa7280`
- `dd21b86` nach `3b6ffd7`
- `de79e7d` nach `9319cc5`
- `df2c437` nach `0ed2763`
- `e025ee9` nach `248f49a`
- `e09ab4b` nach `943f7cd`
- `e199152` nach `60d4354`
- `e78fb12` nach `a3e080f`
- `ed1a31d` nach `d0810df`
- `ed69f2e` nach `39026bc`
- `f484db7` nach `89eedff`
- `f9a3066` nach `76977af`
- `fbf00a1` nach `3292370`
