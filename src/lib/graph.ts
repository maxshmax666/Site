import { calculate } from "./calculator.ts";

export type GraphResult = { paths: string[]; rangeY: number; validPoints: number };

/** Sample a real-valued function using the same sandboxed arithmetic parser. */
export function sampleGraph(expression: string, rangeX: number, samples = 240): GraphResult {
  if (!/\bx\b/i.test(expression)) throw new Error("Введите формулу с переменной x, например sin(x).");
  if (!Number.isFinite(rangeX) || rangeX < 1 || rangeX > 100) throw new Error("Недопустимый диапазон графика.");
  if (!Number.isInteger(samples) || samples < 2 || samples > 500) throw new Error("Недопустимое число точек.");
  if (expression.length > 110) throw new Error("Формула слишком длинная.");
  const raw: Array<{ x: number; y: number } | null> = [];
  for (let i = 0; i <= samples; i++) {
    const x = -rangeX + 2 * rangeX * i / samples;
    try {
      const substituted = expression.replace(/\bx\b/gi, `(${x})`);
      const y = calculate(substituted, { angle: "rad" }).value;
      raw.push(Math.abs(y) <= 1e9 ? { x, y } : null);
    } catch { raw.push(null); }
  }
  const valid = raw.filter((point): point is { x: number; y: number } => point !== null);
  if (valid.length < 2) throw new Error("Не удалось построить график для выбранного диапазона.");
  const absolute = valid.map((point) => Math.abs(point.y)).sort((a, b) => a - b);
  const upperQuantile = absolute[Math.floor((absolute.length - 1) * 0.90)];
  const rangeY = Math.max(1, Math.min(1e9, upperQuantile * 1.35 || 1));
  const paths: string[] = [];
  let current = "";
  let prev: { x: number; y: number } | null = null;
  for (const point of raw) {
    if (!point || Math.abs(point.y) > rangeY || (prev && Math.abs(point.y - prev.y) > rangeY * 0.9)) {
      if (current) paths.push(current);
      current = "";
      prev = null;
      continue;
    }
    const sx = 20 + (point.x + rangeX) / (2 * rangeX) * 660;
    const sy = 150 - point.y / rangeY * 128;
    current += `${current ? " L" : "M"}${sx.toFixed(2)} ${sy.toFixed(2)}`;
    prev = point;
  }
  if (current) paths.push(current);
  return { paths, rangeY, validPoints: valid.length };
}
