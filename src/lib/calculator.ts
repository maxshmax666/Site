/** Deterministic, dependency-free arithmetic engine. Never uses eval/Function. */
export type AngleUnit = "deg" | "rad";
export type Calculation = { value: number; formatted: string };

type Token = { type: "number" | "name" | "symbol" | "end"; text: string };
const FUNCTIONS = new Set([
  "sqrt", "sin", "cos", "tan", "asin", "acos", "atan",
  "log", "ln", "abs", "exp", "floor", "ceil", "round",
]);

export class CalculatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalculatorError";
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) throw new CalculatorError("Результат вне допустимого диапазона.");
  const rounded = Number(value.toPrecision(12));
  if (rounded !== 0 && (Math.abs(rounded) >= 1e12 || Math.abs(rounded) < 1e-7)) {
    return rounded.toExponential(6).replace("e+", "e");
  }
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 10, useGrouping: true }).format(rounded);
}

function tokenize(raw: string): Token[] {
  const normalized = raw
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/π/g, "pi").replace(/,/g, ".").trim();
  if (!normalized) throw new CalculatorError("Введите выражение.");
  if (normalized.length > 220) throw new CalculatorError("Выражение слишком длинное (до 220 символов).");

  const tokens: Token[] = [];
  let i = 0;
  while (i < normalized.length) {
    if (/\s/.test(normalized[i])) { i++; continue; }
    const chunk = normalized.slice(i);
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(chunk);
    if (number) {
      tokens.push({ type: "number", text: number[0] });
      i += number[0].length;
    } else {
      const name = /^[A-Za-z]+/.exec(chunk);
      if (name) {
        tokens.push({ type: "name", text: name[0].toLowerCase() });
        i += name[0].length;
      } else if ("+-*/^()%!".includes(normalized[i])) {
        tokens.push({ type: "symbol", text: normalized[i] });
        i++;
      } else {
        throw new CalculatorError(`Недопустимый символ: ${normalized[i]}`);
      }
    }
    if (tokens.length > 180) throw new CalculatorError("Слишком сложное выражение.");
  }
  tokens.push({ type: "end", text: "" });
  return tokens;
}

class Parser {
  private at = 0;
  private depth = 0;
  private readonly tokens: Token[];
  private readonly ans: number;
  private readonly angle: AngleUnit;
  constructor(tokens: Token[], ans: number, angle: AngleUnit) {
    this.tokens = tokens;
    this.ans = ans;
    this.angle = angle;
  }

  private peek(): Token { return this.tokens[this.at]; }
  private take(text: string): boolean {
    if (this.peek().text === text && this.peek().type !== "end") { this.at++; return true; }
    return false;
  }
  private expect(text: string): void {
    if (!this.take(text)) throw new CalculatorError(`Ожидается «${text}».`);
  }
  private finite(v: number): number {
    if (!Number.isFinite(v)) throw new CalculatorError("Невозможно вычислить: деление на ноль или переполнение.");
    return v;
  }
  parse(): number {
    const result = this.sum();
    if (this.peek().type !== "end") throw new CalculatorError(`Лишний элемент: ${this.peek().text}`);
    return this.finite(result);
  }
  private enter(): void {
    this.depth++;
    if (this.depth > 32) throw new CalculatorError("Слишком глубокая вложенность.");
  }
  private leave(): void { this.depth--; }

  private sum(): number {
    let result = this.product();
    while (this.peek().text === "+" || this.peek().text === "-") {
      const op = this.tokens[this.at++].text;
      const right = this.product();
      result = this.finite(op === "+" ? result + right : result - right);
    }
    return result;
  }
  private product(): number {
    let result = this.unary();
    while (true) {
      if (this.take("*")) result = this.finite(result * this.unary());
      else if (this.take("/")) {
        const divisor = this.unary();
        if (divisor === 0) throw new CalculatorError("Деление на ноль.");
        result = this.finite(result / divisor);
      } else if (this.peek().type === "number" || this.peek().type === "name" || this.peek().text === "(") {
        // 2pi and 2(3+4) work as implicit multiplication.
        result = this.finite(result * this.unary());
      } else break;
    }
    return result;
  }
  private unary(): number {
    this.enter();
    try {
      if (this.take("+")) return this.unary();
      if (this.take("-")) return this.finite(-this.unary());
      return this.power();
    } finally { this.leave(); }
  }
  private power(): number {
    let result = this.postfix();
    if (this.take("^")) {
      const exponent = this.unary(); // right associative: 2^3^2 = 512
      if (Math.abs(exponent) > 1000) throw new CalculatorError("Слишком большая степень.");
      result = this.finite(Math.pow(result, exponent));
    }
    return result;
  }
  private postfix(): number {
    let result = this.primary();
    while (true) {
      if (this.take("%")) result = this.finite(result / 100);
      else if (this.take("!")) {
        if (!Number.isInteger(result) || result < 0 || result > 170) {
          throw new CalculatorError("Факториал определён для целых чисел от 0 до 170.");
        }
        let n = 1;
        for (let i = 2; i <= result; i++) n *= i;
        result = this.finite(n);
      } else break;
    }
    return result;
  }
  private primary(): number {
    const token = this.peek();
    if (token.type === "number") {
      this.at++;
      return this.finite(Number(token.text));
    }
    if (this.take("(")) {
      this.enter();
      try {
        const result = this.sum();
        this.expect(")");
        return result;
      } finally { this.leave(); }
    }
    if (token.type === "name") {
      this.at++;
      if (token.text === "pi") return Math.PI;
      if (token.text === "e") return Math.E;
      if (token.text === "ans") return this.ans;
      if (!FUNCTIONS.has(token.text)) throw new CalculatorError(`Неизвестная функция: ${token.text}`);
      this.expect("(");
      this.enter();
      let arg: number;
      try { arg = this.sum(); this.expect(")"); }
      finally { this.leave(); }
      return this.call(token.text, arg);
    }
    throw new CalculatorError("Ожидается число, функция или открывающая скобка.");
  }
  private call(name: string, value: number): number {
    const radians = this.angle === "deg" ? value * Math.PI / 180 : value;
    const degrees = (v: number) => this.angle === "deg" ? v * 180 / Math.PI : v;
    const functions: Record<string, () => number> = {
      sqrt: () => Math.sqrt(value), sin: () => Math.sin(radians), cos: () => Math.cos(radians),
      tan: () => Math.tan(radians), asin: () => degrees(Math.asin(value)),
      acos: () => degrees(Math.acos(value)), atan: () => degrees(Math.atan(value)),
      log: () => Math.log10(value), ln: () => Math.log(value), abs: () => Math.abs(value),
      exp: () => Math.exp(value), floor: () => Math.floor(value), ceil: () => Math.ceil(value),
      round: () => Math.round(value),
    };
    return this.finite(functions[name]());
  }
}

export function calculate(expression: string, opts: { ans?: number; angle?: AngleUnit } = {}): Calculation {
  const ans = opts.ans ?? 0;
  if (!Number.isFinite(ans)) throw new CalculatorError("Некорректное значение Ans.");
  const value = new Parser(tokenize(expression), ans, opts.angle ?? "rad").parse();
  return { value, formatted: formatNumber(value) };
}
