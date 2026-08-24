import { test } from "node:test";
import assert from "node:assert/strict";
import { RechteFehler, ZeitgrenzeFehler, mitWiederholungBeiRatenbegrenzung, mitZeitgrenze, pruefeAufRechtefehler } from "../src/action/fehlerbehandlung";

test("REQ-16: ein 403 wird als RechteFehler mit dem vermuteten Recht gemeldet", () => {
  assert.throws(
    () => pruefeAufRechtefehler({ status: 403 }, "issues: write"),
    (e: unknown) => e instanceof RechteFehler && e.fehlendesRecht === "issues: write"
  );
});

test("ein Nicht-403-Fehler bleibt unveraendert", () => {
  assert.doesNotThrow(() => pruefeAufRechtefehler({ status: 500 }, "issues: write"));
});

test("Ratenbegrenzung: zwei Wiederholungen mit wachsendem Abstand, dann Erfolg", async () => {
  let versuche = 0;
  const gewartet: number[] = [];
  const ergebnis = await mitWiederholungBeiRatenbegrenzung(
    async () => {
      versuche++;
      if (versuche < 3) {
        const fehler = Object.assign(new Error("rate limit exceeded"), { status: 403 });
        throw fehler;
      }
      return "ok";
    },
    { schlafen: async (ms) => void gewartet.push(ms) }
  );
  assert.equal(ergebnis, "ok");
  assert.equal(versuche, 3);
  assert.deepEqual(gewartet, [1000, 2000]);
});

test("Ratenbegrenzung: nach der letzten Wiederholung wird der Fehler weitergereicht", async () => {
  await assert.rejects(
    () =>
      mitWiederholungBeiRatenbegrenzung(
        async () => {
          throw Object.assign(new Error("rate limit exceeded"), { status: 429 });
        },
        { versuche: 2, schlafen: async () => {} }
      ),
    /rate limit/
  );
});

test("ein Fehler ohne Ratenbegrenzung wird sofort weitergereicht, ohne zu warten", async () => {
  let gewartet = false;
  await assert.rejects(
    () =>
      mitWiederholungBeiRatenbegrenzung(
        async () => {
          throw Object.assign(new Error("nicht gefunden"), { status: 404 });
        },
        { schlafen: async () => void (gewartet = true) }
      ),
    /nicht gefunden/
  );
  assert.equal(gewartet, false);
});

test("REQ-19 GR-6.5: eine Zeitgrenze fuehrt zu ZeitgrenzeFehler statt zu einem haengenden Lauf", async () => {
  await assert.rejects(
    () => mitZeitgrenze(10, () => new Promise((resolve) => setTimeout(resolve, 1000))),
    (e: unknown) => e instanceof ZeitgrenzeFehler
  );
});

test("innerhalb der Zeitgrenze liefert mitZeitgrenze das echte Ergebnis", async () => {
  const ergebnis = await mitZeitgrenze(1000, async () => "fertig");
  assert.equal(ergebnis, "fertig");
});
