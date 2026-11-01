"use client";

import { useEffect, useState } from "react";
import { calculate, type AngleUnit } from "@/lib/calculator";
import { FORMULA_PRESETS } from "@/lib/formula-presets";
import {
  EMPTY_WORKSPACE, evaluateFormula, normalizeVariables, validateFormula,
  validateWorkspace, type WorkspaceData,
} from "@/lib/workspace";

const STORAGE_KEY = "atlas-workspace-v1";
const makeId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function WorkspaceLibrary({ expression, angle, onLoad }: {
  expression: string;
  angle: AngleUnit;
  onLoad: (expression: string, angle: AngleUnit) => void;
}) {
  const [data, setData] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"projects" | "formulas">("formulas");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projectName, setProjectName] = useState("");
  const [formulaName, setFormulaName] = useState("");
  const [formulaExpression, setFormulaExpression] = useState("price*qty*(1-discount/100)");
  const [variableText, setVariableText] = useState("price, qty, discount");
  const [selectedFormula, setSelectedFormula] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formulaResult, setFormulaResult] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(validateWorkspace(JSON.parse(raw)));
    } catch { setError("Не удалось прочитать локальное хранилище. Можно импортировать архив JSON."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { setError("Не удалось сохранить данные в браузере. Экспортируйте архив JSON."); }
  }, [data, ready]);

  function success(message: string) { setError(""); setNotice(message); }
  function fail(cause: unknown) { setNotice(""); setError(cause instanceof Error ? cause.message : "Операция не выполнена."); }

  function saveProject(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (data.projects.length >= 50) throw new Error("Лимит — 50 проектов. Экспортируйте архив и удалите старые.");
      if (!projectName.trim() || projectName.trim().length > 60) throw new Error("Введите название до 60 символов.");
      calculate(expression, { angle });
      setData((prev) => ({ ...prev, projects: [{ id: makeId(), name: projectName.trim(), expression, angle, updatedAt: now() }, ...prev.projects] }));
      setProjectName(""); success("Снимок расчёта сохранён локально.");
    } catch (err) { fail(err); }
  }

  function saveFormula(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (data.formulas.length >= 30) throw new Error("Лимит — 30 формул.");
      const variables = normalizeVariables(variableText);
      validateFormula(formulaName, formulaExpression, variables);
      const item = { id: makeId(), name: formulaName.trim(), expression: formulaExpression.trim(), variables, createdAt: now() };
      setData((prev) => ({ ...prev, formulas: [item, ...prev.formulas] }));
      setSelectedFormula(item.id);
      setFormValues(Object.fromEntries(variables.map((name) => [name, "1"])));
      setFormulaName(""); setFormulaResult(""); success("Калькулятор создан. Теперь можно подставлять значения.");
    } catch (err) { fail(err); }
  }

  const formula = data.formulas.find((x) => x.id === selectedFormula);

  function runFormula() {
    if (!formula) return;
    try {
      const values = Object.fromEntries(formula.variables.map((name) => [name, formValues[name] === "" ? NaN : Number(formValues[name])]));
      const output = evaluateFormula(formula.expression, formula.variables, values, angle);
      setFormulaResult(output.formatted); success("Результат рассчитан локально.");
    } catch (err) { setFormulaResult(""); fail(err); }
  }

  function exportJson() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "atlas-workspace.json"; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      success("Архив экспортирован. API-ключи в него не входят.");
    } catch (err) { fail(err); }
  }

  async function importJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 150_000) throw new Error("Файл слишком большой (макс. 150 КБ).");
      const imported = validateWorkspace(JSON.parse(await file.text()));
      if (!window.confirm("Заменить текущие проекты и формулы данными из архива?")) return;
      setData(imported); setSelectedFormula(""); setFormValues({}); setFormulaResult("");
      success("Архив импортирован.");
    } catch (err) { fail(err); }
  }

  return <section className="studio-section" id="studio" aria-label="Конструктор и проекты">
    <div className="section-heading"><div><span className="eyebrow">02 / YOUR WORKSPACE</span><h2>Свои инструменты <span>и проекты</span></h2></div><span className="section-counter">LOCAL FIRST · v0.3</span></div>
    <div className="studio-shell">
      <div className="studio-tabs" role="group" aria-label="Разделы конструктора">
        <button type="button" className={tab === "formulas" ? "active" : ""} onClick={() => setTab("formulas")}>⚙ Конструктор формул <span>{data.formulas.length}</span></button>
        <button type="button" className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>▣ Мои проекты <span>{data.projects.length}</span></button>
        <span className="studio-spacer" />
        <button type="button" onClick={exportJson}>↓ Экспорт JSON</button>
        <label className="studio-import">↑ Импорт JSON <input type="file" accept="application/json,.json" onChange={importJson} aria-label="Импорт JSON архива" /></label>
      </div>
      {tab === "formulas" ? <div className="studio-grid">
        <form className="studio-form" onSubmit={saveFormula}>
          <h3>Новый калькулятор</h3><p>Задайте формулу и переменные, которые пользователь сможет менять. Поддерживаются функции научного калькулятора.</p>
          <div className="preset-list" role="group" aria-label="Готовые шаблоны формул">{FORMULA_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => { setFormulaName(preset.name); setFormulaExpression(preset.expression); setVariableText(preset.variables.join(", ")); setFormulaResult(""); success(`Шаблон «${preset.name}» загружен. Настройте его и сохраните.`); }}>{preset.name}</button>)}</div>
          <label>Название<input maxLength={60} placeholder="Выручка после скидки" value={formulaName} onChange={(e) => setFormulaName(e.target.value)} required /></label>
          <label>Формула<input maxLength={180} spellCheck={false} placeholder="price*qty*(1-discount/100)" value={formulaExpression} onChange={(e) => setFormulaExpression(e.target.value)} required /></label>
          <label>Переменные через запятую<input maxLength={100} spellCheck={false} placeholder="price, qty, discount" value={variableText} onChange={(e) => setVariableText(e.target.value)} required /></label>
          <button className="primary-button" type="submit">+ Создать калькулятор</button>
          <small>Без eval и исполняемого кода. Максимум 6 переменных и 30 формул.</small>
        </form>
        <div className="studio-collection">
          <h3>Сохранённые калькуляторы</h3>
          {!data.formulas.length && <p className="studio-empty">Создайте первую формулу слева. Результаты будут доступны без AI.</p>}
          {data.formulas.map((item) => <div className={`studio-item ${selectedFormula === item.id ? "selected" : ""}`} key={item.id}>
            <div><strong>{item.name}</strong><code>{item.expression}</code><small>{item.variables.join(" · ")}</small></div>
            <div className="studio-actions"><button type="button" onClick={() => { setSelectedFormula(item.id); setFormValues(Object.fromEntries(item.variables.map((n) => [n, "1"]))); setFormulaResult(""); }}>Открыть</button><button type="button" className="delete" aria-label={`Удалить ${item.name}`} onClick={() => { setData((prev) => ({ ...prev, formulas: prev.formulas.filter((x) => x.id !== item.id) })); if (selectedFormula === item.id) setSelectedFormula(""); }}>×</button></div>
          </div>)}
          {formula && <div className="formula-runner"><h4>{formula.name}</h4><code>{formula.expression}</code><div className="formula-inputs">{formula.variables.map((variable) => <label key={variable}>{variable}<input type="number" step="any" value={formValues[variable] ?? ""} onChange={(e) => { setFormValues((prev) => ({ ...prev, [variable]: e.target.value })); setFormulaResult(""); }} /></label>)}</div><button className="primary-button" type="button" onClick={runFormula}>Рассчитать</button>{formulaResult && <output className="formula-result" aria-live="polite">= {formulaResult}</output>}</div>}
        </div>
      </div> : <div className="studio-grid">
        <form className="studio-form" onSubmit={saveProject}><h3>Сохранить расчёт</h3><p>Создайте локальный снимок текущего выражения и единиц угла. Без аккаунта и облака.</p>
          <label>Название проекта<input maxLength={60} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Расчёт проекта А" required /></label>
          <div className="studio-preview"><small>Текущее выражение</small><code>{expression || "Сначала введите выражение в калькуляторе"}</code><small>Режим углов: {angle.toUpperCase()}</small></div>
          <button className="primary-button" disabled={!expression.trim()} type="submit">+ Сохранить проект</button><small>До 50 снимков. Экспортируйте архив для резервной копии.</small>
        </form>
        <div className="studio-collection"><h3>Сохранённые проекты</h3>
          {!data.projects.length && <p className="studio-empty">Сохраните расчёт из основного калькулятора и открывайте его в любой момент.</p>}
          {data.projects.map((item) => <div className="studio-item" key={item.id}><div><strong>{item.name}</strong><code>{item.expression}</code><small>{item.angle.toUpperCase()} · {new Date(item.updatedAt).toLocaleDateString("ru-RU")}</small></div><div className="studio-actions"><button type="button" onClick={() => { onLoad(item.expression, item.angle); document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" }); }}>Открыть</button><button type="button" className="delete" aria-label={`Удалить ${item.name}`} onClick={() => setData((prev) => ({ ...prev, projects: prev.projects.filter((x) => x.id !== item.id) }))}>×</button></div></div>)}
        </div>
      </div>}
      {error && <p className="studio-error" role="alert">{error}</p>}
      {notice && <p className="studio-notice" role="status">✓ {notice}</p>}
    </div>
  </section>;
}
