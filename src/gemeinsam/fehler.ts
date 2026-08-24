/** Fehler der Konsole. Traegt den Rueckgabewert nach GR-4.1: 1 Befund, 2 Abbruch durch Fehler. */
export class KonsoleFehler extends Error {
  readonly rueckgabewert: 1 | 2;

  constructor(meldung: string, rueckgabewert: 1 | 2 = 2) {
    super(meldung);
    this.name = "KonsoleFehler";
    this.rueckgabewert = rueckgabewert;
  }
}
