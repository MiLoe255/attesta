/**
 * Maskiert Sonderzeichen, damit ein Wort aus dem Regelsatz nie als
 * Regex-Ausdruck wirkt. Eine Stelle fuer alle Wortsuchen, damit eine
 * spaetere Korrektur nicht nur die Haelfte der Fundstellen erreicht:
 * Rollen, Unschaerfewoerter, Technologien und die Beschriftungen der
 * Ankreuzfelder kommen alle aus rules/ und sind damit aenderbar.
 */
export function maskiere(wort: string): string {
  return wort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
