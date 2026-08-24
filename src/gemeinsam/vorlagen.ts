/**
 * Statische Vorlagen fuer Workflow und Issue-Formular. Haengen nicht von
 * rules/ ab, deshalb hier und nicht in attesta-core.
 */
export const WORKFLOW_PFAD = ".github/workflows/attesta.yml";

export const WORKFLOW_VORLAGE = `# Ersetze <ORG> durch den Marketplace-Eintrag, sobald er steht (siehe D1-7).
# Bis dahin: Fork oder Kopie dieses Repositorys referenzieren.
name: Attesta Zyklus

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created, edited]
  workflow_dispatch: {}
  schedule:
    # Nicht spezifiziert (SPEC-12): der genaue Tag im Monat. Vorschlag
    # "erster Werktag" ist in reinem Cron nicht ausdrueckbar, deshalb
    # vereinfacht auf den ersten Kalendertag.
    - cron: "0 6 1 * *"

permissions:
  contents: read
  issues: write
  pull-requests: write
  checks: write

jobs:
  attesta:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: <ORG>/attesta@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          # Optional. Ohne Schluessel oder mit abgelaufenem Schluessel laeuft
          # attesta weiter, siehe REQ-35. Anlegen unter Settings, Secrets and
          # variables, Actions.
          lizenzschluessel: \${{ secrets.ATTESTA_LIZENZSCHLUESSEL }}
`;

export const ISSUE_FORMULAR_PFAD = ".github/ISSUE_TEMPLATE/arbeitspaket.yml";

export const ISSUE_FORMULAR_VORLAGE = `name: Arbeitspaket
description: Arbeitspaket nach dem K-und-S-Rahmenwerk
labels: ["arbeitspaket"]
body:
  - type: dropdown
    id: kritikalitaet
    attributes:
      label: Kritikalitaet
      options:
        - "K1 leicht"
        - "K2 standard"
        - "K3 kritisch"
    validations:
      required: true
  - type: dropdown
    id: delegation
    attributes:
      label: Delegationsstufe
      options:
        - "S1 Anweisen"
        - "S2 Coachen"
        - "S3 Unterstuetzen"
        - "S4 Delegieren"
    validations:
      required: true
  - type: textarea
    id: begruendung
    attributes:
      label: Begruendung der Einstufung
      description: mindestens ein bis zwei Saetze
    validations:
      required: true
`;
