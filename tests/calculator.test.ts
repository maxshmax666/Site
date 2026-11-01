import test from "node:test";
import assert from "node:assert/strict";
import { calculate, CalculatorError } from "../src/lib/calculator.ts";

const eq = (expression: string, expected: number, angle: "rad" | "deg" = "rad") => {
  assert.ok(Math.abs(calculate(expression, { angle }).value - expected) < 1e-9, expression);
};

test("basic precedence and parentheses", () => {
  eq("2+3*4", 14);
  eq("(2+3)*4", 20);
  eq("-2^2", -4);
  eq("2^3^2", 512);
  eq("8/4/2", 1);
});

test("scientific and implicit multiply", () => {
  eq("sqrt(9)+2pi", 3 + 2 * Math.PI);
  eq("sin(90)", 1, "deg");
  eq("cos(0)", 1);
  eq("log(100)", 2);
  eq("ln(e)", 1);
  eq("5!", 120);
  eq("25%", 0.25);
  eq("2(3+4)", 14);

});

test("ans", () => {
  assert.equal(calculate("ans*2", { ans: 10 }).value, 20);
});

test("invalid and hostile expressions are rejected", () => {
  for (const expression of ["", "1/0", "sqrt(-1)", "constructor(1)", "x=2", "1;2", "2^10000", "171!", "2+", "Math.random()", "1e309"]) {
    assert.throws(() => calculate(expression), CalculatorError, expression);
  }
});
