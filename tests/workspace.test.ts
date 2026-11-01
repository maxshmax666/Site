import assert from "node:assert/strict";
import test from "node:test";
import { evaluateFormula, normalizeVariables, validateFormula, validateWorkspace, EMPTY_WORKSPACE } from "../src/lib/workspace.ts";

test("formula builder calculates named variables with a safe math engine", () => {
  const vars = normalizeVariables("price, qty, discount");
  assert.equal(evaluateFormula("price*qty*(1-discount/100)", vars, { price: 100, qty: 3, discount: 20 }).value, 240);
  validateFormula("Выручка", "price*qty", ["price", "qty"]);
});
test("formula builder refuses reserved names and code execution", () => {
  assert.throws(() => normalizeVariables("sin"));
  assert.throws(() => validateFormula("x", "process.exit(1)", ["price"]));
  assert.throws(() => evaluateFormula("price+qty", ["price", "qty"], { price: 2, qty: Infinity }));
  assert.throws(() => evaluateFormula("x+y", ["x", "y"], { x: 1, y: 2e13 }));
});
test("import is strictly validated", () => {
  assert.deepEqual(validateWorkspace(EMPTY_WORKSPACE), EMPTY_WORKSPACE);
  assert.throws(() => validateWorkspace({ version: 1, formulas: [], projects: [{ expression: "evil" }] }));
  assert.throws(() => validateWorkspace({ version: 99, formulas: [], projects: [] }));
});
