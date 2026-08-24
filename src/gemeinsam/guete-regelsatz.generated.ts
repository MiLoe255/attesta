// ERZEUGT AUS @miloe255/attesta-core. Nicht von Hand aendern, siehe scripts/generate-guete-regelsatz.ts.

export const GUETE_ROLLEN = [
  "Auftraggeber",
  "Fachexperte",
  "technische Leitung",
  "Entwicklung",
  "Reviewer",
  "Qualitaetssicherung",
  "Betrieb",
  "Endnutzer",
  "KI-Agent"
] as const;

export const GUETE_UNSCHAERFE = [
  {
    "wort": "schnell",
    "stufe": "verstoss",
    "hinweis": "Zahl mit Einheit nennen, zum Beispiel Antwortzeit unter 200 ms"
  },
  {
    "wort": "langsam",
    "stufe": "verstoss",
    "hinweis": "oberen Schwellwert mit Einheit nennen"
  },
  {
    "wort": "benutzerfreundlich",
    "stufe": "verstoss",
    "hinweis": "pruefbares Kriterium nennen, zum Beispiel Aufgabe in unter drei Klicks abschliessbar"
  },
  {
    "wort": "performant",
    "stufe": "verstoss",
    "hinweis": "Durchsatz- oder Latenzzahl nennen"
  },
  {
    "wort": "robust",
    "stufe": "verstoss",
    "hinweis": "konkreten Fehlerfall und erwartetes Verhalten nennen"
  },
  {
    "wort": "intuitiv",
    "stufe": "verstoss",
    "hinweis": "pruefbares Nutzerverhalten nennen, zum Beispiel ohne Schulung bedienbar"
  },
  {
    "wort": "zeitnah",
    "stufe": "verstoss",
    "hinweis": "Frist mit Einheit nennen"
  },
  {
    "wort": "angemessen",
    "stufe": "warnung",
    "hinweis": "wo moeglich durch eine Zahl oder einen Verweis auf eine Norm ersetzen, Fachbegriff in Normtexten"
  },
  {
    "wort": "möglichst",
    "stufe": "verstoss",
    "hinweis": "verbindliche Formulierung ohne Einschraenkung waehlen"
  },
  {
    "wort": "gegebenenfalls",
    "stufe": "verstoss",
    "hinweis": "Bedingung explizit nennen, unter der der Satz gilt"
  },
  {
    "wort": "einfach",
    "stufe": "verstoss",
    "hinweis": "konkretes Kriterium nennen, was Einfachheit hier bedeutet"
  },
  {
    "wort": "flexibel",
    "stufe": "verstoss",
    "hinweis": "konkrete Variationsbreite nennen"
  },
  {
    "wort": "modern",
    "stufe": "verstoss",
    "hinweis": "konkrete Technologie oder Version nennen"
  },
  {
    "wort": "sicher",
    "stufe": "warnung",
    "hinweis": "wo moeglich durch eine Zahl, einen Standard oder eine Kontrollliste ersetzen, Fachbegriff in Normtexten"
  }
] as const;

export const GUETE_TECHNOLOGIEN = [
  "github",
  "gitlab",
  "azure",
  "aws",
  "react",
  "angular",
  "vue",
  "node.js",
  "python",
  "typescript",
  "java",
  "kubernetes",
  "docker",
  "postgresql",
  "mongodb",
  "redis",
  "kafka"
] as const;
