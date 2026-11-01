"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AI_PROVIDERS, type AiProvider } from "@/lib/ai-providers";
import { calculate, type AngleUnit, type Calculation } from "@/lib/calculator";
import { createAiRequest, parseAiResponse } from "@/lib/ai-protocol";
import { GraphWorkspace } from "./graph-workspace";
import { WorkspaceLibrary } from "./workspace-library";
import { createAgentRequest, executeAgentPlan, parseAgentPlan, type AgentExecution } from "@/lib/agent-tools";
import { ToolModules } from "./tool-modules";

type HistoryItem = { id: string; expression: string; value: number; formatted: string; date: string };
type Connection = { provider: AiProvider; model: string; apiKey: string; baseUrl: string; transport: "browser" | "proxy" };
type AiAnswer = { expression: string; explanation: string; result: Calculation | null };

const MAIN_KEYS: Array<{ label: string; value: string; tone?: string }> = [
  { label: "AC", value: "clear", tone: "utility" }, { label: "( )", value: "paren", tone: "utility" },
  { label: "%", value: "%", tone: "utility" }, { label: "÷", value: "/", tone: "operator" },
  { label: "7", value: "7" }, { label: "8", value: "8" }, { label: "9", value: "9" }, { label: "×", value: "*", tone: "operator" },
  { label: "4", value: "4" }, { label: "5", value: "5" }, { label: "6", value: "6" }, { label: "−", value: "-", tone: "operator" },
  { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "+", value: "+", tone: "operator" },
  { label: "⌫", value: "backspace", tone: "utility" }, { label: "0", value: "0" },
  { label: ".", value: "." }, { label: "=", value: "equals", tone: "equals" },
];
const ADVANCED_KEYS = [
  ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["√", "sqrt("],
  ["x²", "^2"], ["xʸ", "^"], ["log", "log("], ["ln", "ln("],
  ["π", "pi"], ["e", "e"], ["n!", "!"], ["Ans", "ans"],
] as const;

const SUGGESTIONS = [
  "Сколько будет 18% от 2450?",
  "На сколько процентов выросло число с 1200 до 1470?",
];

function validatedBrowserUrl(raw: string): string {
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new Error("Некорректный URL API."); }
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const localPage = typeof window !== "undefined" && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  if ((url.protocol !== "https:" && !(localHost && localPage && url.protocol === "http:")) ||
      url.username || url.password || url.search || url.hash || raw.length > 300) {
    throw new Error("Требуется HTTPS URL; HTTP localhost разрешён только при локальном запуске сайта.");
  }
  return url.href.replace(/\/$/, "");
}

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function BadgeIcon({ kind }: { kind: "spark" | "clock" | "sliders" | "bolt" | "shield" }) {
  const paths: Record<typeof kind, React.ReactNode> = {
    spark: <><path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1Z" /><path d="m19 2 .6 2.4L22 5l-2.4.6L19 8l-.6-2.4L16 5l2.4-.6Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    sliders: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="16" cy="17" r="2" /></>,
    bolt: <path d="m13 2-9 11h7l-1 9 10-12h-7l0-8Z" />,
    shield: <><path d="M12 2 4.5 5v6c0 5 3 8.5 7.5 11 4.5-2.5 7.5-6 7.5-11V5L12 2Z"/><path d="m9 11 2 2 4-4"/></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export function CalculatorWorkspace() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<Calculation | null>(null);
  const [error, setError] = useState("");
  const [ans, setAns] = useState(0);
  const [angle, setAngle] = useState<AngleUnit>("deg");
  const [mode, setMode] = useState<"basic" | "scientific" | "graph">("scientific");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [config, setConfig] = useState<Connection>({
    provider: "openrouter", model: AI_PROVIDERS.openrouter.model, apiKey: "", baseUrl: "", transport: "browser",
  });
  const [showKey, setShowKey] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AiAnswer | null>(null);
  const [aiTask, setAiTask] = useState<"solve" | "agent">("solve");
  const [agentAnswer, setAgentAnswer] = useState<AgentExecution | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActionWasEquals = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("atlas-history-v1") ?? "[]") as unknown;
      if (Array.isArray(saved)) {
        setHistory(saved.filter((row): row is HistoryItem =>
          row && typeof row === "object" && typeof row.expression === "string" &&
          typeof row.value === "number" && Number.isFinite(row.value) &&
          typeof row.formatted === "string" && typeof row.date === "string" &&
          typeof row.id === "string"
        ).slice(0, 25));
      }
    } catch { /* corrupted local storage: start with empty history */ }
    setLoadedHistory(true);
  }, []);

  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem("atlas-draft-v1") ?? "null");
      if (raw && typeof raw === "object") {
        const item = raw as Record<string, unknown>;
        if (typeof item.expression === "string" && item.expression.length <= 220) setExpression(item.expression);
        if (item.angle === "deg" || item.angle === "rad") setAngle(item.angle);
        if (item.mode === "basic" || item.mode === "scientific" || item.mode === "graph") setMode(item.mode);
      }
    } catch { /* invalid draft: use initial defaults */ }
    setLoadedDraft(true);
  }, []);

  useEffect(() => {
    if (!loadedDraft) return;
    try { localStorage.setItem("atlas-draft-v1", JSON.stringify({ expression, angle, mode })); }
    catch { /* private browsing or storage disabled */ }
  }, [expression, angle, mode, loadedDraft]);

  useEffect(() => {
    if (!loadedHistory) return;
    try { localStorage.setItem("atlas-history-v1", JSON.stringify(history)); }
    catch { /* private browser mode or storage limit */ }
  }, [history, loadedHistory]);

  const preview = useMemo(() => {
    if (!expression.trim()) return null;
    try { return calculate(expression, { ans, angle }); }
    catch { return null; }
  }, [expression, ans, angle]);

  function updateExpression(value: string) {
    setExpression(value.slice(0, 220));
    setResult(null);
    setError("");
    lastActionWasEquals.current = false;
  }

  function calculateNow() {
    try {
      const next = calculate(expression, { ans, angle });
      setResult(next);
      setAns(next.value);
      setError("");
      lastActionWasEquals.current = true;
      setHistory((items) => [{
        id: newId(), expression: expression.trim(), value: next.value,
        formatted: next.formatted, date: new Date().toISOString(),
      }, ...items].slice(0, 25));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Невозможно вычислить выражение.");
      setResult(null);
    }
  }

  function pressKey(key: string) {
    if (key === "equals") { calculateNow(); return; }
    if (key === "clear") {
      updateExpression("");
      inputRef.current?.focus();
      return;
    }
    if (key === "backspace") {
      updateExpression(expression.slice(0, -1));
      inputRef.current?.focus();
      return;
    }
    if (key === "paren") {
      const opening = (expression.match(/\(/g) ?? []).length;
      const closing = (expression.match(/\)/g) ?? []).length;
      key = opening > closing && /[\d)a-zπ%!]/i.test(expression.at(-1) ?? "") ? ")" : "(";
    }
    const startsNew = lastActionWasEquals.current && (/^[\d.]$/.test(key) || key === "(" || /^[a-z]+\($/.test(key));
    const next = startsNew ? key : expression + key;
    updateExpression(next);
    inputRef.current?.focus();
  }

  function chooseHistory(item: HistoryItem) {
    setExpression(item.expression);
    setResult({ value: item.value, formatted: item.formatted });
    setAns(item.value);
    setError("");
    lastActionWasEquals.current = true;
  }

  function selectProvider(provider: AiProvider) {
    setConfig((previous) => ({
      ...previous,
      provider,
      apiKey: "", // never carry an existing provider's credentials to a different endpoint
      model: provider === "custom" ? "" : AI_PROVIDERS[provider].model,
    }));
    setConfigured(false);
  }

  function updateConfig(patch: Partial<Connection>) {
    setConfig((previous) => ({ ...previous, ...patch }));
    setConfigured(false);
  }

  function saveConnection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyRequired = config.provider !== "custom" || config.transport === "proxy";
    if ((keyRequired && !config.apiKey.trim()) || !config.model.trim() || (config.provider === "custom" && !config.baseUrl.trim())) {
      setAiError("Заполните модель, адрес API (для своего endpoint) и ключ, если он требуется.");
      return;
    }
    if (config.provider === "custom") {
      try {
        const url = validatedBrowserUrl(config.baseUrl);
        if (config.transport === "proxy" && !url.startsWith("https://")) {
          throw new Error("Для серверного прокси требуется HTTPS URL.");
        }
      } catch (error) {
        setAiError(error instanceof Error ? error.message : "Недопустимый URL API.");
        return;
      }
    }
    setConfigured(true);
    setSettingsOpen(false);
    setAiError("");
    setAiAnswer(null);
  }

  async function askAi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setSettingsOpen(true);
      setAiError("Сначала укажите параметры своего AI.");
      return;
    }
    if (prompt.trim().length < 3) {
      setAiError("Опишите задачу немного подробнее.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiAnswer(null);
    setAgentAnswer(null);
    try {
      if (config.provider === "custom" && config.transport === "browser") {
        const baseUrl = validatedBrowserUrl(config.baseUrl);
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey.trim() ? { "Authorization": `Bearer ${config.apiKey.trim()}` } : {}),
          },
          body: JSON.stringify(aiTask === "agent" ? createAgentRequest(config.model.trim(), prompt, angle) : createAiRequest(config.model.trim(), prompt, angle)),
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) throw new Error(`Ваш API вернул HTTP ${response.status}. Проверьте ключ, модель и URL.`);
        const raw: unknown = await response.json();
        if (aiTask === "agent") {
          const plan = parseAgentPlan(raw);
          if (plan.action === "calculate" && plan.args.expression === "") {
            setAgentAnswer({ action: "calculate", result: "Недостаточно данных", explanation: plan.explanation });
          } else setAgentAnswer(executeAgentPlan(plan, angle));
        } else {
          const ai = parseAiResponse(raw);
          const verified = ai.expression ? calculate(ai.expression, { angle }) : null;
          setAiAnswer({ ...ai, result: verified });
        }
        return;
      }
      const response = await fetch("/api/ai/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          provider: config.provider, model: config.model.trim(), apiKey: config.apiKey.trim(),
          baseUrl: config.baseUrl.trim(), prompt: prompt.trim(), angle, task: aiTask,
        }),
      });
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") throw new Error("Некорректный ответ сервера.");
      const payload = data as Record<string, unknown>;
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "AI недоступен.");
      if (aiTask === "agent") {
        if (typeof payload.action !== "string" || typeof payload.result !== "string" || typeof payload.explanation !== "string") {
          throw new Error("Некорректный ответ AI-агента.");
        }
        setAgentAnswer({ action: payload.action as AgentExecution["action"], result: payload.result, explanation: payload.explanation });
        return;
      }
      if (typeof payload.expression !== "string" || typeof payload.explanation !== "string") {
        throw new Error("Некорректный ответ модели.");
      }
      const calculation = payload.result as Calculation | null;
      if (calculation !== null && (!calculation || typeof calculation.value !== "number" || typeof calculation.formatted !== "string")) {
        throw new Error("Модель вернула некорректный результат.");
      }
      setAiAnswer({ expression: payload.expression, explanation: payload.explanation, result: calculation });
    } catch (e) {
      setAiError(e instanceof TypeError && config.provider === "custom" && config.transport === "browser"
        ? "Браузер не смог обратиться к AI. Проверьте CORS на своём сервере, HTTPS и URL API."
        : e instanceof Error ? e.message : "Не получилось связаться с AI.");
    } finally {
      setAiLoading(false);
    }
  }

  function insertAiExpression() {
    if (!aiAnswer?.expression) return;
    updateExpression(aiAnswer.expression);
    inputRef.current?.focus();
  }

  const display = result?.formatted ?? preview?.formatted ?? (expression ? "—" : "0");

  return (
    <div className="atlas-app">
      <header className="atlas-header">
        <div className="brand"><span className="brand-glyph" aria-hidden="true">△</span><span className="brand-name">ATLAS <span>Calculator</span></span><span className="version-pill">v0.3.1</span></div>
        <nav className="top-navigation" aria-label="Основная навигация">
          <button className="nav-active" type="button" onClick={() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" })}><BadgeIcon kind="bolt" /> Калькулятор</button>
          <button type="button" onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}>▦ <span>Модули</span></button>
          <button type="button" onClick={() => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" })}>▣ <span>Проекты</span></button>
          <button type="button" onClick={() => document.getElementById("ai-assistant")?.scrollIntoView({ behavior: "smooth" })}><BadgeIcon kind="spark" /> AI</button>
          <button type="button" onClick={() => document.getElementById("calc-history")?.scrollIntoView({ behavior: "smooth" })}><BadgeIcon kind="clock" /> <span>История</span></button>
        </nav>
        <span className="header-status"><span className="green-dot" /> Локальные вычисления</span>
      </header>

      <main className="atlas-main">
        <div className="product-heading"><div><span className="eyebrow">УМНАЯ ВЫЧИСЛИТЕЛЬНАЯ СРЕДА</span><h1>Считай больше. <span>Думай шире.</span></h1><p>От обычной арифметики до функций, графиков и задач с вашим AI.</p></div><span className="heading-aside">01 / WORKSPACE</span></div>
        <div className="main-grid">
          <aside className="mode-sidebar" aria-label="Режим калькулятора">
            <span className="side-title">РЕЖИМ</span>
            <button type="button" className={`mode-link ${mode === "basic" ? "active" : ""}`} aria-pressed={mode === "basic"} onClick={() => setMode("basic")}>▦ <span>Обычный</span></button>
            <button type="button" className={`mode-link ${mode === "scientific" ? "active" : ""}`} aria-pressed={mode === "scientific"} onClick={() => setMode("scientific")}>⚗ <span>Научный</span></button>
            <button type="button" className={`mode-link ${mode === "graph" ? "active" : ""}`} aria-pressed={mode === "graph"} onClick={() => setMode("graph")}>⌁ <span>Графики</span></button>
            <div className="sidebar-divider" />
            <span className="side-title">ПОДКЛЮЧЕНИЕ</span>
            <button type="button" className="mode-link" onClick={() => { setSettingsOpen(true); document.getElementById("ai-assistant")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><BadgeIcon kind="spark" /><span>Мой AI</span></button>
            <span className="sidebar-help">Ваш ключ. Ваша модель. Ваши правила.</span>
            <div className="sidebar-bottom"><span className="green-dot" /> Данные расчётов локально</div>
          </aside>

          <section className="calculator-panel" id="calculator" aria-label="Калькулятор">
            <div className="calc-panel-head"><div className="panel-title"><span className="panel-icon">{mode === "graph" ? "⌁" : "ƒ"}</span><div><strong>{mode === "graph" ? "Построение графиков" : mode === "scientific" ? "Научный калькулятор" : "Калькулятор"}</strong><small>{mode === "graph" ? "Функции и визуализация" : "Точный результат · без AI"}</small></div></div><span className="function-count">{mode === "scientific" ? "12 ФУНКЦИЙ" : mode === "graph" ? "2D PLOT" : "STANDARD"}</span></div>
            {mode === "graph" ? <GraphWorkspace /> : <>
              <div className="calc-screen">
                <div className="calc-screen-top"><span>ВЫРАЖЕНИЕ</span><span>{angle === "deg" ? "ГРАДУСЫ" : "РАДИАНЫ"}</span></div>
                <label className="sr-only" htmlFor="calc-expression">Введите математическое выражение</label>
                <input id="calc-expression" ref={inputRef} className="calc-expression" autoComplete="off" spellCheck={false} value={expression} maxLength={220} placeholder="Например, 2 × (8 + 4)" onChange={(e) => updateExpression(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); calculateNow(); } else if (e.key === "Escape") updateExpression(""); }} />
                <div className="calc-divider" />
                <div className="calc-result-caption"><span>РЕЗУЛЬТАТ</span><span>{result ? "✓ ПРОВЕРЕН" : preview ? "ПРЕДПРОСМОТР" : ""}</span></div>
                <div className={`calc-result ${display === "—" ? "muted" : ""}`} aria-live="polite">{display}</div>
                {error && <p className="calc-error" role="alert">{error}</p>}
              </div>
              <div className="calculation-toolbar"><div className="calc-shortcuts"><kbd>Enter</kbd> вычислить <kbd>Esc</kbd> очистить</div><div className="angle-toggle" role="group" aria-label="Единицы углов"><button type="button" aria-pressed={angle === "deg"} className={angle === "deg" ? "selected" : ""} onClick={() => { setAngle("deg"); setResult(null); setAiAnswer(null); }}>DEG</button><button type="button" aria-pressed={angle === "rad"} className={angle === "rad" ? "selected" : ""} onClick={() => { setAngle("rad"); setResult(null); setAiAnswer(null); }}>RAD</button></div></div>
              {mode === "scientific" && <div className="advanced-grid" aria-label="Научные функции">{ADVANCED_KEYS.map(([label, value]) => <button type="button" key={label} onClick={() => pressKey(value)}>{label}</button>)}</div>}
              <div className="key-grid" aria-label="Клавиатура калькулятора">{MAIN_KEYS.map((key) => <button type="button" key={`${key.label}-${key.value}`} className={`calc-key ${key.tone ?? ""}`} onClick={() => pressKey(key.value)} aria-label={key.value === "backspace" ? "Удалить символ" : key.value === "clear" ? "Очистить" : key.value === "equals" ? "Вычислить" : key.label}>{key.label}</button>)}</div>
              <div className="calc-foot"><span><BadgeIcon kind="shield" /> Обработка на вашем устройстве</span><span>∞ БЕЗ ЛИМИТОВ</span></div>
            </>}
          </section>

          <div className="context-column">
            <section className="history-panel" id="calc-history" aria-label="История вычислений"><div className="aside-head"><div className="aside-heading"><BadgeIcon kind="clock" /><strong>История</strong></div>{history.length > 0 && <button type="button" onClick={() => setHistory([])}>Очистить</button>}</div>
              {history.length === 0 ? <div className="history-empty"><span>◷</span><strong>История пока пуста</strong><small>Нажмите =, чтобы сохранить расчёт.</small></div> : <div className="history-list">{history.map((item) => <button type="button" key={item.id} className="history-row" onClick={() => { chooseHistory(item); setMode("scientific"); document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" }); }} title="Вернуть выражение в калькулятор"><div><span>{item.expression}</span><small>{new Date(item.date).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div><strong>{item.formatted}</strong></button>)}</div>}
            </section>

            <section className="ai-panel" id="ai-assistant" aria-label="AI-ассистент">
              <div className="aside-head"><div className="aside-heading"><span className="ai-head-icon"><BadgeIcon kind="spark" /></span><strong>AI-помощник</strong></div><span className={`status-pill ${configured ? "ready" : ""}`}><span className="status-dot" /> {configured ? "Подключён" : "Не подключён"}</span></div>
              <p className="ai-intro">Решайте задачи обычным языком, подключив свою модель.</p>
              <div className="ai-provider-card"><div className="provider-symbol">✦</div><div className="ai-provider-details"><strong>{configured ? config.provider === "custom" ? "Свой сервер" : AI_PROVIDERS[config.provider].label : "Ваш AI"}</strong><small>{configured ? config.model : "OpenAI · OpenRouter · Groq · Ollama"}</small></div><button type="button" className="ai-settings-trigger" onClick={() => { setSettingsOpen((value) => !value); setAiError(""); }} aria-expanded={settingsOpen}>{settingsOpen ? "Закрыть" : "Настроить"}</button></div>
              {!settingsOpen && <div className="ai-task-switch" role="group" aria-label="Режим AI"><button type="button" aria-pressed={aiTask === "solve"} className={aiTask === "solve" ? "active" : ""} onClick={() => { setAiTask("solve"); setAiAnswer(null); setAgentAnswer(null); }}>Формула</button><button type="button" aria-pressed={aiTask === "agent"} className={aiTask === "agent" ? "active" : ""} onClick={() => { setAiTask("agent"); setAiAnswer(null); setAgentAnswer(null); }}>Агент · 5 инструментов</button></div>}
              {settingsOpen ? <form className="connection-form" onSubmit={saveConnection}>
                <div className="field-group"><label htmlFor="ai-provider">Провайдер</label><select id="ai-provider" value={config.provider} onChange={(e) => selectProvider(e.target.value as AiProvider)}><option value="openrouter">OpenRouter</option><option value="openai">OpenAI</option><option value="groq">Groq</option><option value="custom">Свой OpenAI-compatible API</option></select></div>
                {config.provider === "custom" && <><div className="field-group"><label htmlFor="ai-transport">Способ подключения</label><select id="ai-transport" value={config.transport} onChange={(e) => updateConfig({ transport: e.target.value as "browser" | "proxy" })}><option value="browser">Напрямую из браузера (CORS)</option><option value="proxy">Через сервер сайта (allowlist)</option></select></div><div className="field-group"><label htmlFor="ai-baseurl">API base URL</label><input id="ai-baseurl" type="url" value={config.baseUrl} placeholder="https://llm.example.com/v1" onChange={(e) => updateConfig({ baseUrl: e.target.value })} required /><small>{config.transport === "browser" ? "Для локального Ollama используйте http://localhost:11434/v1 при локальном запуске сайта." : "Адрес должен быть разрешён на сервере через AI_ALLOWED_ORIGINS."}</small></div></>}
                <div className="field-group"><label htmlFor="ai-model">Модель</label><input id="ai-model" value={config.model} placeholder="ID модели" onChange={(e) => updateConfig({ model: e.target.value })} autoComplete="off" required /></div>
                <div className="field-group"><label htmlFor="ai-key">API-ключ {config.provider === "custom" && config.transport === "browser" ? "(необязательно)" : ""}</label><div className="key-input-wrap"><input id="ai-key" value={config.apiKey} type={showKey ? "text" : "password"} placeholder="Ваш API-ключ" onChange={(e) => updateConfig({ apiKey: e.target.value })} autoComplete="off" required={config.provider !== "custom" || config.transport === "proxy"} /><button type="button" onClick={() => setShowKey((value) => !value)}>{showKey ? "Скрыть" : "Показать"}</button></div></div>
                <p className="key-privacy">🔒 Ключ находится только в памяти вкладки. {config.provider === "custom" && config.transport === "browser" ? "Отправляется напрямую на ваш API." : "При запросе передаётся через сервер сайта провайдеру."}</p>
                <button className="primary-button" type="submit">Сохранить подключение →</button>
                <button className="disconnect-button" type="button" onClick={() => { setConfig((previous) => ({ ...previous, apiKey: "" })); setConfigured(false); setAiAnswer(null); setSettingsOpen(false); setAiError(""); }}>Отключить и очистить ключ</button>
              </form> : <><form className="ai-query-form" onSubmit={askAi}><label htmlFor="ai-prompt" className="sr-only">Математический вопрос для AI</label><textarea id="ai-prompt" maxLength={1500} rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Например: сколько будет 18% от 2450?" /><button type="submit" className="primary-button" disabled={aiLoading}><BadgeIcon kind="spark" /> {aiLoading ? "AI выполняет…" : aiTask === "agent" ? "Вызвать инструмент" : "Решить с AI"} <span>↗</span></button></form>
                {!aiAnswer && !agentAnswer && <div className="ai-suggestions">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)}>{suggestion} <span>↗</span></button>)}</div>}
              </>}
              {aiError && <p className="ai-error" role="alert">{aiError}</p>}
              {agentAnswer && !settingsOpen && <div className="ai-answer" aria-live="polite"><span className="ai-answer-label">⚙ ВЫЗОВ ИНСТРУМЕНТА · {agentAnswer.action}</span><div className="agent-result">{agentAnswer.result}</div><p>{agentAnswer.explanation}</p><small>Результат пересчитан инструментом ATLAS. Агент не имеет доступа к произвольному коду.</small></div>}
              {aiAnswer && !settingsOpen && <div className="ai-answer" aria-live="polite"><span className="ai-answer-label">✦ ОТВЕТ AI</span>{aiAnswer.result && <><div className="ai-answer-value">{aiAnswer.result.formatted}</div><code className="ai-answer-expression">{aiAnswer.expression}</code></>}<p>{aiAnswer.explanation}</p>{aiAnswer.result && <button type="button" className="transfer-button" onClick={() => { insertAiExpression(); setMode("scientific"); document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" }); }}>Перенести в калькулятор →</button>}</div>}
              <div className="ai-footnote">AI выбирает инструмент или предлагает формулу. Результат проверяет ATLAS.</div>
            </section>
          </div>
        </div>
        <ToolModules />
        <WorkspaceLibrary expression={expression} angle={angle} onLoad={(savedExpression, savedAngle) => { updateExpression(savedExpression); setAngle(savedAngle); setMode("scientific"); }} />
        <footer className="atlas-footer"><span>© 2026 ATLAS LAB · Ваши расчёты — ваши данные.</span><span>BUILD · CALCULATE · EXPLORE</span></footer>
      </main>
    </div>
  );
}
