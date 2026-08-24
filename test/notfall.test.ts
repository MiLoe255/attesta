import { test } from "node:test";
import assert from "node:assert/strict";
import { berechneFrist, bestimmeZustand, erzeugeNotfall, istAktiv, istNotfallBefehl, zaehleJeQuartal } from "../src/action/notfall";

test("erkennt /attesta notfall, auch mit weiterem Text danach", () => {
  assert.equal(istNotfallBefehl("/attesta notfall"), true);
  assert.equal(istNotfallBefehl("/attesta notfall wegen Produktionsausfall"), true);
  assert.equal(istNotfallBefehl("/attesta pruefen"), false);
});

test("REQ-22 GR-7.5: die Frist liegt drei Arbeitstage nach dem Ausrufen, Wochenende zaehlt nicht", () => {
  // Donnerstag, 2026-08-20 -> Fr, (Sa, So uebersprungen), Mo, Di = drei Arbeitstage -> Di 2026-08-25
  const donnerstag = new Date("2026-08-20T10:00:00.000Z");
  const frist = berechneFrist(donnerstag);
  assert.equal(frist.toISOString().slice(0, 10), "2026-08-25");
});

test("bestimmeZustand: offen vor der Frist, ueberfaellig danach, nachdokumentiert wenn belegt", () => {
  const notfall = erzeugeNotfall({ ausgerufenVon: "dev", ausgerufenAm: new Date("2026-08-20T10:00:00.000Z"), pullRequest: 7 });

  assert.equal(bestimmeZustand(notfall, new Date("2026-08-21T10:00:00.000Z")), "offen");
  assert.equal(bestimmeZustand(notfall, new Date("2026-08-26T10:00:00.000Z")), "ueberfaellig");
  assert.equal(bestimmeZustand({ ...notfall, nachdokumentiert_am: "2026-08-21T00:00:00.000Z" }, new Date("2026-08-26T10:00:00.000Z")), "nachdokumentiert");
});

test("istAktiv ist wahr, solange nicht nachdokumentiert, auch wenn ueberfaellig", () => {
  const notfall = erzeugeNotfall({ ausgerufenVon: "dev", ausgerufenAm: new Date("2026-08-20T10:00:00.000Z"), pullRequest: 7 });
  assert.equal(istAktiv(notfall, new Date("2026-08-26T10:00:00.000Z")), true);
  assert.equal(istAktiv({ ...notfall, nachdokumentiert_am: "2026-08-21T00:00:00.000Z" }, new Date("2026-08-26T10:00:00.000Z")), false);
});

test("REQ-22 GR-7.5: der Zaehler je Quartal zaehlt nur Notfaelle im angefragten Zeitraum", () => {
  const notfaelle = [
    erzeugeNotfall({ ausgerufenVon: "a", ausgerufenAm: new Date("2026-01-15T00:00:00.000Z"), pullRequest: 1 }),
    erzeugeNotfall({ ausgerufenVon: "b", ausgerufenAm: new Date("2026-02-10T00:00:00.000Z"), pullRequest: 2 }),
    erzeugeNotfall({ ausgerufenVon: "c", ausgerufenAm: new Date("2026-04-01T00:00:00.000Z"), pullRequest: 3 }),
    erzeugeNotfall({ ausgerufenVon: "d", ausgerufenAm: new Date("2025-01-15T00:00:00.000Z"), pullRequest: 4 }),
  ];
  assert.equal(zaehleJeQuartal(notfaelle, 2026, 1), 2);
  assert.equal(zaehleJeQuartal(notfaelle, 2026, 2), 1);
  assert.equal(zaehleJeQuartal(notfaelle, 2025, 1), 1);
  assert.equal(zaehleJeQuartal(notfaelle, 2026, 3), 0);
});
