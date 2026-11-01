class ModuleError extends Error {}

export type UnitFamily = "length" | "mass" | "temperature" | "speed";
export const UNIT_FAMILIES: Record<UnitFamily, { label: string; units: Record<string, { label: string; factor?: number }> }> = {
  length: { label: "Длина", units: {
    m: { label: "Метры", factor: 1 }, km: { label: "Километры", factor: 1000 },
    cm: { label: "Сантиметры", factor: 0.01 }, mm: { label: "Миллиметры", factor: 0.001 },
    mi: { label: "Мили", factor: 1609.344 }, ft: { label: "Футы", factor: 0.3048 },
    in: { label: "Дюймы", factor: 0.0254 },
  } },
  mass: { label: "Масса", units: {
    kg: { label: "Килограммы", factor: 1 }, g: { label: "Граммы", factor: 0.001 },
    t: { label: "Тонны", factor: 1000 }, lb: { label: "Фунты", factor: 0.45359237 },
    oz: { label: "Унции", factor: 0.028349523125 },
  } },
  temperature: { label: "Температура", units: {
    C: { label: "Цельсий" }, F: { label: "Фаренгейт" }, K: { label: "Кельвин" },
  } },
  speed: { label: "Скорость", units: {
    ms: { label: "м/с", factor: 1 }, kmh: { label: "км/ч", factor: 1 / 3.6 },
    mph: { label: "миль/ч", factor: 0.44704 }, knot: { label: "Узлы", factor: 0.514444444444 },
  } },
};

export function convertUnits(value: number, family: UnitFamily, from: string, to: string): number {
  if (!Number.isFinite(value)) throw new ModuleError("Введите конечное число.");
  const units = UNIT_FAMILIES[family]?.units;
  if (!units?.[from] || !units[to]) throw new ModuleError("Неизвестная единица измерения.");
  if (family === "temperature") {
    const kelvin = from === "C" ? value + 273.15 : from === "F" ? (value - 32) * 5 / 9 + 273.15 : value;
    if (kelvin < -1e-9) throw new ModuleError("Температура ниже абсолютного нуля.");
    return to === "C" ? kelvin - 273.15 : to === "F" ? (kelvin - 273.15) * 9 / 5 + 32 : kelvin;
  }
  const result = value * (units[from].factor ?? 1) / (units[to].factor ?? 1);
  if (!Number.isFinite(result)) throw new ModuleError("Результат вне диапазона.");
  return result;
}

/** An indicative fixed-rate amortized monthly payment, not a lending quote. */
export function loanPayment(principal: number, annualPercent: number, months: number): { payment: number; total: number; overpayment: number } {
  if (!Number.isFinite(principal) || principal <= 0 || principal > 1e12) throw new ModuleError("Сумма должна быть от 0 до 1 трлн.");
  if (!Number.isFinite(annualPercent) || annualPercent < 0 || annualPercent > 100) throw new ModuleError("Ставка должна быть от 0 до 100%.");
  if (!Number.isInteger(months) || months < 1 || months > 600) throw new ModuleError("Срок должен быть от 1 до 600 месяцев.");
  const r = annualPercent / 1200;
  const payment = r === 0 ? principal / months : principal * r / (1 - Math.pow(1 + r, -months));
  const total = payment * months;
  return { payment, total, overpayment: total - principal };
}

export function percentageChange(from: number, to: number): number {
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new ModuleError("Введите числа.");
  if (from === 0) throw new ModuleError("Для нулевой базы процентное изменение не определено.");
  const result = (to - from) / Math.abs(from) * 100;
  if (!Number.isFinite(result)) throw new ModuleError("Результат вне диапазона.");
  return result;
}

export function statistics(values: number[]): { count: number; sum: number; average: number; median: number; minimum: number; maximum: number } {
  if (!values.length || values.length > 1000 || values.some((value) => !Number.isFinite(value) || Math.abs(value) > 1e12)) {
    throw new ModuleError("Введите от 1 до 1000 чисел в диапазоне ±1 трлн.");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, value) => acc + value, 0);
  const mid = Math.floor(values.length / 2);
  return { count: values.length, sum, average: sum / values.length, median: values.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2, minimum: sorted[0], maximum: sorted[sorted.length - 1] };
}
