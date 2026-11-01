import { NextRequest, NextResponse } from "next/server";
import { calculate, type AngleUnit } from "@/lib/calculator";
import { resolveBaseUrl } from "@/lib/ai-providers";
import { createAiRequest, parseAiResponse } from "@/lib/ai-protocol";
import { createAgentRequest, executeAgentPlan, parseAgentPlan } from "@/lib/agent-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SolveRequest = {
  provider?: unknown;
  apiKey?: unknown;
  model?: unknown;
  baseUrl?: unknown;
  prompt?: unknown;
  angle?: unknown;
  task?: unknown;
};

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function readLimitedBody(request: NextRequest): Promise<string> {
  if (!request.body) throw new Error("EMPTY_BODY");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16_384) {
      await reader.cancel();
      throw new Error("TOO_LARGE");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export async function POST(request: NextRequest) {
  // Reject requests from cross-site pages. Not a replacement for authentication/rate limiting.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return fail("Запрос с другого сайта запрещён.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) return fail("Слишком большой запрос.", 413);

  let body: SolveRequest;
  try {
    const text = await readLimitedBody(request);
    body = JSON.parse(text) as SolveRequest;
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Ожидается JSON-объект.");
  } catch (error) {
    if (error instanceof Error && error.message === "TOO_LARGE") return fail("Слишком большой запрос.", 413);
    return fail("Ожидается JSON.");
  }

  if (typeof body.prompt !== "string" || body.prompt.trim().length < 3 || body.prompt.length > 1500) {
    return fail("Введите вопрос длиной от 3 до 1500 символов.");
  }
  if (typeof body.model !== "string" || !/^[\w./:+-]{1,120}$/.test(body.model)) {
    return fail("Укажите корректный идентификатор модели.");
  }
  if (typeof body.apiKey !== "string" || body.apiKey.length < 4 || body.apiKey.length > 600 || /[\r\n]/.test(body.apiKey)) {
    return fail("Укажите API-ключ.");
  }
  if (typeof body.provider !== "string") return fail("Укажите провайдера.");
  if (body.angle !== "deg" && body.angle !== "rad") return fail("Некорректный режим углов.");
  const angle: AngleUnit = body.angle;
  if (body.task !== undefined && body.task !== "solve" && body.task !== "agent") return fail("Некорректный режим AI.");
  const task = body.task === "agent" ? "agent" : "solve";

  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(body.provider, typeof body.baseUrl === "string" ? body.baseUrl : undefined);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Некорректный URL провайдера.");
  }
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${body.apiKey}`,
        ...(body.provider === "openrouter" ? { "HTTP-Referer": request.nextUrl.origin, "X-Title": "Atlas Calculator" } : {}),
      },
      body: JSON.stringify(task === "agent" ? createAgentRequest(body.model, body.prompt.trim(), angle) : createAiRequest(body.model, body.prompt.trim(), angle)),
    });
    if (!upstream.ok) return fail(`Провайдер вернул HTTP ${upstream.status}. Проверьте ключ, модель и баланс.`, 502);
    const data: unknown = await upstream.json();
    if (task === "agent") {
      try {
        const plan = parseAgentPlan(data);
        const result = plan.action === "calculate" && plan.args.expression === ""
          ? { action: "calculate", result: "Недостаточно данных", explanation: plan.explanation }
          : executeAgentPlan(plan, angle);
        return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
      } catch (e) {
        return fail(e instanceof Error ? e.message : "AI предложил неподдерживаемое действие.", 422);
      }
    }
    let ai: { expression: string; explanation: string };
    try { ai = parseAiResponse(data); }
    catch (e) { return fail(e instanceof Error ? e.message : "Некорректный ответ модели.", 502); }
    if (!ai.expression) return NextResponse.json({ expression: "", explanation: ai.explanation, result: null }, { headers: { "Cache-Control": "no-store" } });
    try {
      const result = calculate(ai.expression, { angle });
      return NextResponse.json({ expression: ai.expression, explanation: ai.explanation, result }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return fail("Модель предложила неподдерживаемое выражение. Переформулируйте задачу.", 422);
    }
  } catch {
    return fail("Не удалось связаться с AI. Проверьте сеть и URL провайдера.", 502);
  }
}
