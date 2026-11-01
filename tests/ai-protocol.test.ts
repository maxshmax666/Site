import test from "node:test";
import assert from "node:assert/strict";
import { createAiRequest, parseAiResponse } from "../src/lib/ai-protocol.ts";
import { resolveBaseUrl } from "../src/lib/ai-providers.ts";

test("OpenAI-compatible request is well-formed", () => {
  const req = createAiRequest("my-model", "  Сколько будет 4+5? ", "deg");
  assert.equal(req.model, "my-model");
  assert.equal(req.messages[1].content, "Сколько будет 4+5?");
  assert.match(req.messages[0].content, /градусах/);
});

test("AI response parsing accepts fenced JSON but not arbitrary prose", () => {
  const input = { choices: [{ message: { content: '```json\n{"expression":"4+5","explanation":"Сумма"}\n```' } }] };
  assert.deepEqual(parseAiResponse(input), { expression: "4+5", explanation: "Сумма" });
  assert.throws(() => parseAiResponse({ choices: [{ message: { content: "Пример 4 + 5 = 9" } }] }));
});

test("Custom proxy requires exact HTTPS allowlisted origin", () => {
  const old = process.env.AI_ALLOWED_ORIGINS;
  try {
    process.env.AI_ALLOWED_ORIGINS = "https://llm.example.com";
    assert.equal(resolveBaseUrl("openai"), "https://api.openai.com/v1");
    assert.equal(resolveBaseUrl("custom", "https://llm.example.com/v1"), "https://llm.example.com/v1");
    assert.throws(() => resolveBaseUrl("custom", "https://llm.example.com.evil.net/v1"));
    assert.throws(() => resolveBaseUrl("custom", "http://localhost:11434/v1"));
    assert.throws(() => resolveBaseUrl("custom", "https://user:pass@llm.example.com/v1"));
  } finally {
    if (old === undefined) delete process.env.AI_ALLOWED_ORIGINS;
    else process.env.AI_ALLOWED_ORIGINS = old;
  }
});
