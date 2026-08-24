/**
 * Fehlerverhalten aus SPEC-06: Recht fehlt bricht ab und nennt das Recht,
 * eine Ratenbegrenzung bekommt zwei Wiederholungen mit wachsendem
 * Abstand, danach gilt der Lauf als `unbekannt` statt als Fehlschlag.
 */
export class RechteFehler extends Error {
  readonly fehlendesRecht: string;

  constructor(fehlendesRecht: string) {
    super(`Recht fehlt: ${fehlendesRecht}. Erforderlich: contents: read, issues: write, pull-requests: write, checks: write.`);
    this.name = "RechteFehler";
    this.fehlendesRecht = fehlendesRecht;
  }
}

interface HttpFehler {
  status?: number;
  message?: string;
}

function istHttpFehler(e: unknown): e is HttpFehler {
  return typeof e === "object" && e !== null && "status" in e;
}

export function pruefeAufRechtefehler(e: unknown, vermutetesRecht: string): void {
  if (istHttpFehler(e) && e.status === 403) {
    throw new RechteFehler(vermutetesRecht);
  }
}

function istRatenbegrenzung(e: unknown): boolean {
  if (!istHttpFehler(e)) return false;
  if (e.status === 429) return true;
  return e.status === 403 && /rate limit/i.test(e.message ?? "");
}

export interface WiederholungOptionen {
  versuche?: number;
  wartenMs?: (versuch: number) => number;
  schlafen?: (ms: number) => Promise<void>;
}

/** Zwei Wiederholungen mit wachsendem Abstand bei Ratenbegrenzung, sonst sofortiger Abbruch. */
export async function mitWiederholungBeiRatenbegrenzung<T>(aufruf: () => Promise<T>, optionen: WiederholungOptionen = {}): Promise<T> {
  const versuche = optionen.versuche ?? 3;
  const wartenMs = optionen.wartenMs ?? ((versuch: number) => versuch * 1000);
  const schlafen = optionen.schlafen ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let letzterFehler: unknown;
  for (let versuch = 1; versuch <= versuche; versuch++) {
    try {
      return await aufruf();
    } catch (e) {
      letzterFehler = e;
      if (!istRatenbegrenzung(e) || versuch === versuche) {
        throw e;
      }
      await schlafen(wartenMs(versuch));
    }
  }
  throw letzterFehler;
}

export class ZeitgrenzeFehler extends Error {
  constructor() {
    super("Zeitgrenze von sechzig Sekunden ueberschritten.");
    this.name = "ZeitgrenzeFehler";
  }
}

export async function mitZeitgrenze<T>(ms: number, aufruf: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const zeitlimit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ZeitgrenzeFehler()), ms);
  });
  try {
    return await Promise.race([aufruf(), zeitlimit]);
  } finally {
    clearTimeout(timer!);
  }
}
