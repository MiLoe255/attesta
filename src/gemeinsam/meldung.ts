/**
 * Einheitliche Meldungsform, REQ-13: jede Beanstandung nennt die verletzte
 * Regel und die Regelsatzdatei. Format nach Leitfaden Abschnitt 9:
 * "Verstoss gegen `unschaerfe.yaml`, Wort: angemessen".
 */
export interface BefundFelder {
  regelsatzdatei: string;
  regel: string;
  fundort?: string;
}

export function formatiereBefund(felder: BefundFelder): string {
  const basis = `Verstoss gegen \`${felder.regelsatzdatei}\`, ${felder.regel}`;
  return felder.fundort ? `${basis} (${felder.fundort})` : basis;
}
