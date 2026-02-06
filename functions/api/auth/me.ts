import { createClient } from "@supabase/supabase-js";
import { json } from "../_utils";

type Env = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = getBearerToken(request);
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
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
