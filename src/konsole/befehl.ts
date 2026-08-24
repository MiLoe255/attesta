/**
 * Gemeinsame Form aller vier Befehle, REQ-11.
 * fuehreAus() gibt den Rueckgabewert nach GR-4.1 zurueck: 0 ohne Befund,
 * 1 Befund, 2 Abbruch durch Fehler. Ein KonsoleFehler aus fuehreAus() wird
 * vom Einstiegspunkt zentral in 1 oder 2 uebersetzt, siehe index.ts.
 */
export interface Befehl {
  readonly name: string;
  hilfe(): void;
  fuehreAus(argv: string[]): number;
}
