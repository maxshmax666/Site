export type ApiEnv = {
  API_ORIGIN?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function methodNotAllowed(allow: string): Response {
  return json(
    {
      error: "Method Not Allowed",
    },
    {
      status: 405,
      headers: {
        allow,
      },
    },
  );
}

export function resolveSupabaseOrigin(env: ApiEnv): string | null {
  return env.SUPABASE_URL ?? env.API_ORIGIN ?? null;
}

export function ensureRequiredApiEnv(env: ApiEnv): Response | null {
  const missing: string[] = [];

  if (!resolveSupabaseOrigin(env)) {
    missing.push("SUPABASE_URL|API_ORIGIN");
  }

  if (!env.SUPABASE_ANON_KEY) {
    missing.push("SUPABASE_ANON_KEY");
  }

  if (!missing.length) {
    return null;
  }

  return json(
    {
      code: "MISCONFIGURED_ENV",
      error: "Required runtime environment variables are missing",
      missing,
    },
    { status: 500 },
  );
}
