// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-notfall.ts.

export const NOTFALL_REGELN = {
  "befehl": "/attesta notfall",
  "frist": {
    "arbeitstage": 3,
    "wochenende_zaehlt": false
  },
  "schwelle_je_quartal": 3
} as const;
