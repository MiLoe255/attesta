/**
 * Kernbibliothek, AP-M01 aus docs/ideen/fremdagentenzugang-api-und-mcp.md
 * (attesta-plattform).
 *
 * Zweck: die Urteilslogik so nutzbar machen, dass ein Dienst sie einbinden kann,
 * ohne Action, Konsole, Dateisystem oder Netz mitzunehmen. Der Fremdagentenzugang
 * ruft dieselben Funktionen wie die Action, damit dieselbe Anforderung an beiden
 * Stellen dasselbe Urteil bekommt. Zwei Auswertungen waeren zwei Wahrheiten.
 *
 * **Diese Datei ist eine Grenze, kein Sammelpunkt.** Was hier steht, ist rein:
 * gleiche Eingabe, gleiche Ausgabe, keine Seitenwirkung. Was Dateien liest,
 * gehoert nicht hierher, sondern bleibt Aufgabe des Aufrufers. Konkret bleiben
 * draussen: `eigene-rollen.ts`, `ergaenzungen.ts` und `profilvergleich.ts`. Sie
 * lesen aus dem Kundenrepositorium und reichen ihr Ergebnis als Parameter herein,
 * `pruefeAnforderungMitRegelsatz(text, eigeneRollen)` ist genau dafuer gebaut.
 *
 * Die Grenze wird nicht behauptet, sondern geprueft: `test/kern.test.ts` laeuft den
 * Importgraphen ab diesem Modul ab und laesst den Lauf fehlschlagen, sobald ein
 * Dateisystem- oder Netzzugriff hereinkommt. Eine Grenze ohne Test ist ein Vorsatz.
 *
 * Nicht enthalten und bewusst nicht: das Gate-Urteil. Es braucht Zustand und liegt
 * im Dienst, nicht in einer Bibliothek.
 */

// Anforderungsguete, sechs Pruefungen in fester Reihenfolge, GR-8.1.
export { pruefeAnforderung, pruefeAnforderungMitRegelsatz } from "../gemeinsam/guete";
export type { GueteErgebnis, GueteRegelsatz, PruefungsBefund, PruefungsZustand } from "../gemeinsam/guete";

// Nachweisgrad als Minimum dreier Teilwerte, GR-8.6.
export { berechneAnforderungsguete, berechneBelegfrische, berechneKettendeckung, berechneNachweisgrad, formatiereNachweisgrad, istFrisch, istGedeckt, NACHWEISGRAD_FORMELVERSION } from "../gemeinsam/nachweisgrad";
export type { Belegbefund, Kettenbefund, Kettenknoten, Nachweisgrad, Teilwert } from "../gemeinsam/nachweisgrad";

// Delegationsreife und zulaessige Stufe.
export { bestimmeDelegationsreife, bestimmeZulaessigeDelegation, formatierePruefung, minimumSStufe } from "../gemeinsam/delegationsreife";
export type { DelegationsPruefung, DelegationsreifeErgebnis, DelegationsreifeStufe, SStufe, StufenBedingungen } from "../gemeinsam/delegationsreife";

/*
 * Einstufung und Matrixobergrenze liegen heute in `action/arbeitspaket.ts`. Der
 * Inhalt ist rein, die Ablage ist es nicht: eine Bibliothek sollte nicht in die
 * Action greifen. Ein Verschieben nach `gemeinsam/` beruehrt Action-Code und Tests
 * und gehoert deshalb in ein eigenes Arbeitspaket, nicht in dieses. Bis dahin
 * dieser Wiederausfuhr mit Vermerk, damit die Abhaengigkeit sichtbar bleibt statt
 * sich zu setzen.
 */
export { kritikalitaetMitRueckfall, leseEinstufung, matrixObergrenze } from "../action/arbeitspaket";
export type { Einstufung, KStufe } from "../action/arbeitspaket";
