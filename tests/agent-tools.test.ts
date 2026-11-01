import assert from "node:assert/strict";
import test from "node:test";
import { executeAgentPlan, parseAgentPlan } from "../src/lib/agent-tools.ts";

const response = (obj: unknown) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });
test("agent has a bounded set of deterministic read-only tools", () => {
  const plan = parseAgentPlan(response({ action: "percentage_change", args: { from: 100, to: 115 }, explanation: "Сравнение" }));
  assert.equal(executeAgentPlan(plan, "deg").result, "15 %");
  const conversion = parseAgentPlan(response({ action: "convert_units", args: { family: "length", value: 1, from: "km", to: "m" }, explanation: "Перевод" }));
  assert.equal(executeAgentPlan(conversion, "rad").result, "1 000");
});
test("agent cannot select executable/shell/network action or invalid args", () => {
  assert.throws(() => parseAgentPlan(response({ action: "shell", args: { command: "rm -rf" }, explanation: "x" })));
  assert.throws(() => executeAgentPlan({ action: "calculate", args: { expression: "__proto__.constructor" }, explanation: "" }, "rad"));
  assert.throws(() => executeAgentPlan({ action: "statistics", args: { values: Array(1001).fill(3) }, explanation: "" }, "rad"));
});
