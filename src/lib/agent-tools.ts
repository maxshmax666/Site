import { calculate, formatNumber, type AngleUnit } from "./calculator.ts";
import { convertUnits, loanPayment, percentageChange, statistics, type UnitFamily } from "./modules.ts";

export const AGENT_ACTIONS = ["calculate", "convert_units", "percentage_change", "loan_payment", "statistics"] as const;
export type AgentAction = typeof AGENT_ACTIONS[number];
export type AgentPlan = { action: AgentAction; args: Record<string, unknown>; explanation: string };
export type AgentExecution = { action: AgentAction; result: string; explanation: string };

const finite = (value: unknown, name: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1e12) throw new Error(`Проверьте аргумент ${name}.`);
  return value;
};
const text = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length > 100) throw new Error(`Проверьте аргумент ${name}.`);
  return value;
};

/** Whitelisted, deterministic, read-only execution. No network, scripts, filesystem or arbitrary tool calls. */
export function executeAgentPlan(plan: AgentPlan, angle: AngleUnit): AgentExecution {
  if (!AGENT_ACTIONS.includes(plan.action) || !plan.args || typeof plan.args !== "object" || Array.isArray(plan.args)) {
    throw new Error("AI запросил недоступный инструмент.");
  }
  const a = plan.args;
  let result: string;
  switch (plan.action) {
    case "calculate": result = calculate(text(a.expression, "expression"), { angle }).formatted; break;
    case "convert_units": {
      const family = text(a.family, "family");
      if (!["length", "mass", "temperature", "speed"].includes(family)) throw new Error("Неизвестная группа единиц.");
      result = formatNumber(convertUnits(finite(a.value, "value"), family as UnitFamily, text(a.from, "from"), text(a.to, "to")));
      break;
    }
    case "percentage_change": result = formatNumber(percentageChange(finite(a.from, "from"), finite(a.to, "to"))) + " %"; break;
    case "loan_payment": {
      const payment = loanPayment(finite(a.principal, "principal"), finite(a.annualPercent, "annualPercent"), finite(a.months, "months"));
      result = `Платёж в месяц: ${formatNumber(payment.payment)}; всего: ${formatNumber(payment.total)}; переплата: ${formatNumber(payment.overpayment)}`;
      break;
    }
    case "statistics": {
      if (!Array.isArray(a.values)) throw new Error("Ожидается массив чисел.");
      const summary = statistics(a.values.map((v, i) => finite(v, `values[${i}]`)));
      result = `n=${summary.count}; сумма=${formatNumber(summary.sum)}; среднее=${formatNumber(summary.average)}; медиана=${formatNumber(summary.median)}; мин=${formatNumber(summary.minimum)}; макс=${formatNumber(summary.maximum)}`;
      break;
    }
  }
  return { action: plan.action, result, explanation: plan.explanation.slice(0, 800) };
}

export const AGENT_SYSTEM_PROMPT = `Ты маршрутизатор математических задач в ATLAS. Выбери ровно один инструмент и верни ТОЛЬКО JSON без markdown: {"action":"calculate","args":{"expression":"2+2"},"explanation":"Почему выбран инструмент"}.
Допустимые action и args:
calculate: {"expression":"..."} — синтаксис + - * / ^ ( ) % ! и функции sin cos tan sqrt log ln abs и константы pi e; длина <=220.
convert_units: {"value":1,"family":"length|mass|temperature|speed","from":"km","to":"m"}; length: m km cm mm mi ft in; mass: kg g t lb oz; temperature: C F K; speed: ms kmh mph knot.
percentage_change: {"from":100,"to":120}.
loan_payment: {"principal":100000,"annualPercent":12,"months":24}.
statistics: {"values":[1,2,3]} — от 1 до 1000 чисел.
Не выдумывай недостающие числа. Если данных недостаточно, выбери calculate с expression:"" и объясни, каких данных не хватает. Не создавай другие инструменты и не запускай код. Итог вычисляет ATLAS.`;

export function createAgentRequest(model: string, prompt: string, angle: AngleUnit) {
  return { model, temperature: 0, max_tokens: 500, messages: [
    { role: "system", content: AGENT_SYSTEM_PROMPT + `\nУглы: ${angle === "deg" ? "градусы" : "радианы"}.` },
    { role: "user", content: prompt.trim() },
  ] };
}

export function parseAgentPlan(payload: unknown): AgentPlan {
  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> } | null)?.choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length > 10_000) throw new Error("AI вернул пустой ответ.");
  let parsed: unknown;
  try { parsed = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); }
  catch { throw new Error("AI вернул некорректный JSON."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Некорректный план AI.");
  const v = parsed as Record<string, unknown>;
  if (typeof v.action !== "string" || !AGENT_ACTIONS.includes(v.action as AgentAction) ||
      !v.args || typeof v.args !== "object" || Array.isArray(v.args) ||
      typeof v.explanation !== "string" || v.explanation.length > 1600) throw new Error("AI выбрал неизвестный инструмент или аргументы.");
  return { action: v.action as AgentAction, args: v.args as Record<string, unknown>, explanation: v.explanation };
}
