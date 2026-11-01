import { calculate, type AngleUnit, type Calculation } from "./calculator.ts";

export type CustomFormula = {
  id: string;
  name: string;
  expression: string;
  variables: string[];
  createdAt: string;
};
export type SavedProject = {
  id: string;
  name: string;
  expression: string;
  angle: AngleUnit;
  updatedAt: string;
};
export type WorkspaceData = { version: 1; formulas: CustomFormula[]; projects: SavedProject[] };
export const EMPTY_WORKSPACE: WorkspaceData = { version: 1, formulas: [], projects: [] };

const RESERVED = new Set([
  "sqrt", "sin", "cos", "tan", "asin", "acos", "atan", "log", "ln",
  "abs", "exp", "floor", "ceil", "round", "pi", "e", "ans",
]);
const VARIABLE_PATTERN = /^[a-z][a-z0-9]*$/;

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 100;
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 35 && Number.isFinite(Date.parse(value));
}

export function normalizeVariables(source: string): string[] {
  const variables = source.split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (variables.length < 1 || variables.length > 6 || new Set(variables).size !== variables.length ||
      variables.some((s) => s.length > 12 || !VARIABLE_PATTERN.test(s) || RESERVED.has(s))) {
    throw new Error("Укажите 1–6 уникальных переменных латиницей (например: price, qty).");
  }
  return variables;
}

/** Variable replacement only at full identifier boundaries; math is still parsed by calculate() (no eval). */
export function evaluateFormula(expression: string, variables: string[], values: Record<string, number>, angle: AngleUnit = "rad"): Calculation {
  if (expression.length === 0 || expression.length > 180) throw new Error("Формула должна быть длиной до 180 символов.");
  const names = normalizeVariables(variables.join(","));
  const substitutions = new Map<string, number>();
  for (const name of names) {
    const value = values[name];
    if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1e12) {
      throw new Error(`Введите корректное значение переменной ${name} (до ±1 трлн).`);
    }
    substitutions.set(name, value);
  }
  const used = new Set<string>();
  const compiled = expression.replace(/[A-Za-z][A-Za-z0-9]*/g, (token) => {
    const lower = token.toLowerCase();
    if (!substitutions.has(lower)) return token;
    used.add(lower);
    return `(${substitutions.get(lower)})`;
  });
  const unused = names.filter((name) => !used.has(name));
  if (unused.length) throw new Error(`Переменные не используются: ${unused.join(", ")}.`);
  if (compiled.length > 220) throw new Error("После подстановки формула слишком длинная.");
  return calculate(compiled, { angle });
}

export function validateFormula(name: string, expression: string, variables: string[]): void {
  if (!name.trim() || name.trim().length > 60) throw new Error("Название формулы: 1–60 символов.");
  evaluateFormula(expression, variables, Object.fromEntries(variables.map((variable) => [variable, 1])));
}

export function validateWorkspace(raw: unknown): WorkspaceData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Неверный формат проекта.");
  const object = raw as Record<string, unknown>;
  if (object.version !== 1 || !Array.isArray(object.formulas) || !Array.isArray(object.projects) ||
      object.formulas.length > 30 || object.projects.length > 50) throw new Error("Неподдерживаемая версия или слишком большой архив.");
  const formulas: CustomFormula[] = [];
  const projects: SavedProject[] = [];
  for (const entry of object.formulas) {
    if (!entry || typeof entry !== "object") throw new Error("Некорректная формула.");
    const item = entry as Partial<CustomFormula>;
    if (!validId(item.id) || typeof item.name !== "string" || typeof item.expression !== "string" ||
        !Array.isArray(item.variables) || item.variables.some((x) => typeof x !== "string") || !validDate(item.createdAt)) {
      throw new Error("Некорректные данные формулы.");
    }
    const variables = normalizeVariables(item.variables.join(","));
    validateFormula(item.name, item.expression, variables);
    formulas.push({ id: item.id, name: item.name, expression: item.expression, variables, createdAt: item.createdAt });
  }
  for (const entry of object.projects) {
    if (!entry || typeof entry !== "object") throw new Error("Некорректный проект.");
    const item = entry as Partial<SavedProject>;
    if (!validId(item.id) || typeof item.name !== "string" || item.name.trim().length < 1 || item.name.length > 60 ||
        typeof item.expression !== "string" || item.expression.length > 220 ||
        (item.angle !== "deg" && item.angle !== "rad") || !validDate(item.updatedAt)) {
      throw new Error("Некорректные данные проекта.");
    }
    calculate(item.expression, { angle: item.angle });
    projects.push({ id: item.id, name: item.name, expression: item.expression, angle: item.angle, updatedAt: item.updatedAt });
  }
  if (new Set(formulas.map((x) => x.id)).size !== formulas.length ||
      new Set(projects.map((x) => x.id)).size !== projects.length) throw new Error("Повторяющиеся ID в архиве.");
  return { version: 1, formulas, projects };
}
