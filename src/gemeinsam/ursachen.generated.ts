// ERZEUGT AUS @miloe255/attesta-core, Version 1.0.0.
// Nicht von Hand aendern, siehe scripts/generate-ursachen.ts.

export const URSACHEN_VERSION = "1.0.0";

export const URSACHEN = [
  {
    "kennung": "klarheit",
    "label": "Klarheit",
    "beschreibung": "Das Abnahmekriterium war nie messbar formuliert"
  },
  {
    "kennung": "komplexitaet",
    "label": "Komplexitaet",
    "beschreibung": "Umfang oder Werkzeug haben die Aufgabe unterschaetzt"
  },
  {
    "kennung": "koennen",
    "label": "Koennen",
    "beschreibung": "Fachwissen oder eine Vorlage fehlten"
  },
  {
    "kennung": "kontrolle",
    "label": "Kontrolle",
    "beschreibung": "Niemand hat frueh genug geprueft, bis das Gate lief"
  },
  {
    "kennung": "konsequenz",
    "label": "Konsequenz",
    "beschreibung": "Der Verstoss blieb wiederholt folgenlos, die Regel wurde nicht durchgesetzt"
  },
  {
    "kennung": "wollen",
    "label": "Wollen",
    "beschreibung": "Der Mensch wusste es und hat es unterlassen",
    "nur_reviewer": true
  },
  {
    "kennung": "werkzeugfehler",
    "label": "Werkzeugfehler",
    "beschreibung": "Das Gate wurde zu Unrecht rot, kein tatsaechlicher Verstoss"
  }
] as const;
