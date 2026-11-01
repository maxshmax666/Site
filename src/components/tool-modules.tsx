"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/calculator";
import { convertUnits, loanPayment, percentageChange, statistics, UNIT_FAMILIES, type UnitFamily } from "@/lib/modules";

type ModuleId = "units" | "percent" | "loan" | "statistics";
const MODULES: Array<{ id: ModuleId; icon: string; title: string; description: string }> = [
  { id: "units", icon: "⇄", title: "Конвертер", description: "Длина, масса, скорость" },
  { id: "percent", icon: "%", title: "Проценты", description: "Рост и изменение" },
  { id: "loan", icon: "₽", title: "Кредит", description: "Аннуитетный платёж" },
  { id: "statistics", icon: "▥", title: "Статистика", description: "Среднее и медиана" },
];

function numberFromInput(value: string): number {
  if (!value.trim()) throw new Error("Введите число.");
  const number = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(number)) throw new Error("Используйте числовое значение.");
  return number;
}
function Output({ title, rows, error, footnote }: { title: string; rows: Array<[string, string]>; error: string; footnote?: string }) {
  return <div className="module-output" aria-live="polite">
    <span className="module-output-label">{title}</span>
    {error ? <p className="module-error" role="alert">{error}</p> : rows.map(([label, value], index) => <div className={`module-output-row ${index === 0 ? "lead" : ""}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}
    {footnote && <small>{footnote}</small>}
  </div>;
}

export function ToolModules() {
  const [active, setActive] = useState<ModuleId>("units");
  const [family, setFamily] = useState<UnitFamily>("length");
  const [from, setFrom] = useState("km");
  const [to, setTo] = useState("m");
  const [input, setInput] = useState("1");
  const [before, setBefore] = useState("1200");
  const [after, setAfter] = useState("1470");
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("12");
  const [months, setMonths] = useState("12");
  const [sample, setSample] = useState("12; 16; 21; 15; 18");
  const currentUnits = UNIT_FAMILIES[family].units;

  const conversion = useMemo(() => {
    try {
      const value = convertUnits(numberFromInput(input), family, from, to);
      return { error: "", rows: [["Результат", `${formatNumber(value)} ${currentUnits[to]?.label ?? ""}`]] as Array<[string,string]> };
    } catch (error) { return { error: error instanceof Error ? error.message : "Ошибка преобразования.", rows: [] }; }
  }, [input, family, from, to, currentUnits]);
  const percent = useMemo(() => {
    try {
      const start = numberFromInput(before);
      const end = numberFromInput(after);
      return { error: "", rows: [["Изменение", `${formatNumber(percentageChange(start, end))}%`], ["Разница", formatNumber(end - start)]] as Array<[string,string]> };
    } catch (error) { return { error: error instanceof Error ? error.message : "Ошибка расчёта.", rows: [] }; }
  }, [before, after]);
  const credit = useMemo(() => {
    try {
      const data = loanPayment(numberFromInput(principal), numberFromInput(rate), numberFromInput(months));
      return { error: "", rows: [["Платёж в месяц", formatNumber(data.payment)], ["Всего выплат", formatNumber(data.total)], ["Переплата", formatNumber(data.overpayment)]] as Array<[string,string]> };
    } catch (error) { return { error: error instanceof Error ? error.message : "Ошибка расчёта.", rows: [] }; }
  }, [principal, rate, months]);
  const stats = useMemo(() => {
    try {
      if (sample.length > 12000) throw new Error("Слишком длинный список чисел.");
      const values = sample.split(/[;\s]+/).filter(Boolean).map(numberFromInput);
      const data = statistics(values);
      return { error: "", rows: [["Среднее", formatNumber(data.average)], ["Медиана", formatNumber(data.median)], ["Сумма", formatNumber(data.sum)], ["Минимум / максимум", `${formatNumber(data.minimum)} / ${formatNumber(data.maximum)}`], ["Чисел", String(data.count)]] as Array<[string,string]> };
    } catch (error) { return { error: error instanceof Error ? error.message : "Ошибка анализа.", rows: [] }; }
  }, [sample]);

  return <section className="modules-section" id="modules" aria-label="Модули калькулятора">
    <div className="section-heading"><div><span className="eyebrow">РАСШИРЯЙТЕ ВОЗМОЖНОСТИ</span><h2>Модули <span>ATLAS</span></h2><p>Четыре инструмента уже работают прямо в браузере — без регистрации и AI.</p></div><span className="section-counter">04 / ИНСТРУМЕНТА</span></div>
    <div className="modules-grid" role="group" aria-label="Выберите модуль">{MODULES.map((tool) => <button type="button" key={tool.id} className={`module-card ${active === tool.id ? "active" : ""}`} onClick={() => setActive(tool.id)} aria-pressed={active === tool.id} aria-controls="active-module"><span className="module-symbol" aria-hidden="true">{tool.icon}</span><strong>{tool.title}</strong><small>{tool.description}</small><span className="module-card-arrow" aria-hidden="true">↗</span></button>)}</div>
    <div id="active-module" className="module-detail">
      <div className="module-detail-heading"><h3>{MODULES.find((tool) => tool.id === active)?.title}</h3><span>ЛОКАЛЬНЫЙ РАСЧЁТ</span></div>
      <div className="module-detail-grid">
        <div className="module-fields">
          {active === "units" && <>
            <label>Категория<select value={family} onChange={(e) => {
              const next = e.target.value as UnitFamily;
              const choices = Object.keys(UNIT_FAMILIES[next].units);
              setFamily(next); setFrom(choices[0]); setTo(choices[1]);
            }}>{Object.entries(UNIT_FAMILIES).map(([key, data]) => <option key={key} value={key}>{data.label}</option>)}</select></label>
            <label>Значение<input type="text" inputMode="decimal" value={input} onChange={(e) => setInput(e.target.value)} /></label>
            <div className="unit-choices"><label>Из<select value={from} onChange={(e) => setFrom(e.target.value)}>{Object.entries(currentUnits).map(([key, unit]) => <option key={key} value={key}>{unit.label}</option>)}</select></label><button type="button" className="swap-button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Поменять единицы местами">⇄</button><label>В<select value={to} onChange={(e) => setTo(e.target.value)}>{Object.entries(currentUnits).map(([key, unit]) => <option key={key} value={key}>{unit.label}</option>)}</select></label></div>
          </>}
          {active === "percent" && <><label>Было<input type="text" inputMode="decimal" value={before} onChange={(e) => setBefore(e.target.value)} /></label><label>Стало<input type="text" inputMode="decimal" value={after} onChange={(e) => setAfter(e.target.value)} /></label></>}
          {active === "loan" && <><label>Сумма кредита<input type="text" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></label><label>Ставка, % годовых<input type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} /></label><label>Срок в месяцах<input type="text" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} /></label></>}
          {active === "statistics" && <label>Числа через пробел или ;<textarea rows={5} maxLength={12000} value={sample} onChange={(e) => setSample(e.target.value)} placeholder="12; 16; 21; 15; 18" /><small>Для дробных чисел используйте запятую или точку: 1,5; 2,75.</small></label>}
        </div>
        {active === "units" && <Output title="КОНВЕРТАЦИЯ" {...conversion} />}
        {active === "percent" && <Output title="ДИНАМИКА" {...percent} />}
        {active === "loan" && <Output title="ОЦЕНКА ПЛАТЕЖЕЙ" {...credit} footnote="Оценочный аннуитетный расчёт без комиссий, страховок и округления платежей банком." />}
        {active === "statistics" && <Output title="ПОКАЗАТЕЛИ" {...stats} />}
      </div>
    </div>
  </section>;
}
