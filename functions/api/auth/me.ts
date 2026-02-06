import { createClient } from "@supabase/supabase-js";
import { ensureRequiredApiEnv, resolveSupabaseOrigin, type ApiEnv, json } from "../_utils";

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export const onRequestGet: PagesFunction<ApiEnv> = async ({ request, env }) => {
  const envError = ensureRequiredApiEnv(env);
  if (envError) {
    return envError;
  }

  const token = getBearerToken(request);
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseOrigin = resolveSupabaseOrigin(env);
  if (!supabaseOrigin || !env.SUPABASE_ANON_KEY) {
    return json({ code: "MISCONFIGURED_ENV", error: "Required runtime environment variables are missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseOrigin, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return json(
    {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        role: data.user.role ?? null,
      },
    },
    { status: 200 },
  );
};
