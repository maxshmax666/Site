export type AiProvider = "openai" | "openrouter" | "groq" | "custom";

export const AI_PROVIDERS: Record<Exclude<AiProvider, "custom">, { label: string; baseUrl: string; model: string }> = {
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini" },
  groq: { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
};

/** Custom endpoints must be explicitly allowlisted on the server to prevent SSRF. */
export function resolveBaseUrl(provider: string, customUrl?: string): string {
  if (Object.hasOwn(AI_PROVIDERS, provider)) {
    return AI_PROVIDERS[provider as Exclude<AiProvider, "custom">].baseUrl;
  }
  if (provider !== "custom") throw new Error("Неизвестный провайдер.");
  if (!customUrl || customUrl.length > 300) throw new Error("Укажите корректный URL API.");
  let url: URL;
  try { url = new URL(customUrl); }
  catch { throw new Error("Некорректный URL API."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("Нужен HTTPS URL без логина, параметров и фрагментов.");
  }
  const allowed = (process.env.AI_ALLOWED_ORIGINS ?? "")
    .split(",").map((v) => v.trim()).filter(Boolean);
  if (!allowed.includes(url.origin)) {
    throw new Error("Адрес не разрешён сервером. Добавьте HTTPS origin в AI_ALLOWED_ORIGINS.");
  }
  return url.href.replace(/\/$/, "");
}
