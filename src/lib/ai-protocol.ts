import type { AngleUnit } from "./calculator";

/** Common, OpenAI-compatible Chat Completions contract (client + server). */
export const MATH_SYSTEM_PROMPT = `Ты преобразуешь математические запросы в выражения для калькулятора.
Отвечай ТОЛЬКО корректным JSON-объектом без markdown:
{"expression":"...","explanation":"Короткое объяснение на русском языке"}
Допустимы + - * / ^ ( ) % !; константы pi, e; функции sqrt(x), sin(x), cos(x), tan(x), asin(x), acos(x), atan(x), log(x) (десятичный), ln(x), abs(x), exp(x), floor(x), ceil(x), round(x).
Не используй внешние данные, переменные или присваивания. Проценты: x% это x/100.
Не выдумывай исходные значения, если запрос не содержит достаточно чисел. В таком случае expression оставь пустым и кратко объясни, что нужно уточнить.
Выражение всегда должно вычисляться математическим движком, не рассчитывай итог самостоятельно.`;

export function createAiRequest(model: string, prompt: string, angle: AngleUnit) {
  return {
    model,
    temperature: 0,
    max_tokens: 500,
    messages: [
      { role: "system", content: MATH_SYSTEM_PROMPT + `\nУглы интерпретируй в ${angle === "deg" ? "градусах" : "радианах"}.` },
      { role: "user", content: prompt.trim() },
    ],
  };
}

export function parseAiResponse(payload: unknown): { expression: string; explanation: string } {
  const value = payload as { choices?: Array<{ message?: { content?: unknown } }> } | null;
  const content = value?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length > 10_000) throw new Error("Модель вернула пустой или некорректный ответ.");
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let obj: unknown;
  try { obj = JSON.parse(trimmed); }
  catch { throw new Error("Модель ответила невалидным JSON. Повторите запрос или смените модель."); }
  if (!obj || typeof obj !== "object" ||
      typeof (obj as Record<string, unknown>).expression !== "string" ||
      typeof (obj as Record<string, unknown>).explanation !== "string") {
    throw new Error("Модель ответила невалидным JSON. Повторите запрос или смените модель.");
  }
  const answer = obj as { expression: string; explanation: string };
  return { expression: answer.expression.trim(), explanation: answer.explanation.slice(0, 1200) };
}
