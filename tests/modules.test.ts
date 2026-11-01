import { test } from "node:test";
import assert from "node:assert/strict";
import { convertUnits, loanPayment, percentageChange, statistics } from "../src/lib/modules.ts";

test("unit conversion works across metric, imperial and temperature", () => {
  assert.equal(convertUnits(1, "length", "km", "m"), 1000);
  assert.ok(Math.abs(convertUnits(0, "temperature", "C", "F") - 32) < 1e-10);
  assert.ok(Math.abs(convertUnits(32, "temperature", "F", "C")) < 1e-10);
  assert.throws(() => convertUnits(-300, "temperature", "C", "K"));
  assert.ok(Math.abs(convertUnits(36, "speed", "kmh", "ms") - 10) < 1e-10);
});
test("loan payments include zero interest and amortization", () => {
  assert.equal(loanPayment(1200, 0, 12).payment, 100);
  const paid = loanPayment(100000, 12, 12);
  assert.ok(paid.payment > 8884 && paid.payment < 8885);
  assert.ok(paid.total > 100000);
  assert.throws(() => loanPayment(100, -2, 12));
});
test("percentage change handles negative and zero base", () => {
  assert.equal(percentageChange(100, 125), 25);
  assert.equal(percentageChange(100, 75), -25);
  assert.throws(() => percentageChange(0, 100));
});
test("statistics returns average, median, and bounds", () => {
  assert.deepEqual(statistics([4, 1, 7, 2]), { count: 4, sum: 14, average: 3.5, median: 3, minimum: 1, maximum: 7 });
  assert.throws(() => statistics([]));
});
