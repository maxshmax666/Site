import assert from "node:assert/strict";
import test from "node:test";
import { FORMULA_PRESETS } from "../src/lib/formula-presets.ts";
import { evaluateFormula, validateFormula } from "../src/lib/workspace.ts";

test("built-in formula templates compile using the deterministic engine", () => {
  assert.equal(FORMULA_PRESETS.length, 4);
  for (const preset of FORMULA_PRESETS) {
    assert.doesNotThrow(() => validateFormula(preset.name, preset.expression, [...preset.variables]));
  }
  const discount = FORMULA_PRESETS[0];
  assert.equal(evaluateFormula(discount.expression, [...discount.variables], { price: 200, discount: 25 }).value, 150);
});
