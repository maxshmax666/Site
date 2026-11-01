import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleGraph } from "../src/lib/graph.ts";

test("graph uses safe expression parser, keeps to finite paths", () => {
  const wave = sampleGraph("sin(x)", 10, 60);
  assert.ok(wave.validPoints >= 60);
  assert.ok(wave.paths[0].startsWith("M"));
  assert.ok(!wave.paths.join(" ").includes("NaN"));
  assert.throws(() => sampleGraph("process.exit()", 10));
  assert.throws(() => sampleGraph("sin(x)", -3));
});
