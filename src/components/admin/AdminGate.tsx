import { ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type AppRole = "guest" | "courier" | "manager" | "engineer" | "admin";

const rank: Record<AppRole, number> = {
  guest: 0,
  courier: 1,
  manager: 2,
  engineer: 3,
  admin: 4,
};

function formatRoleError(error: { code?: string; message?: string }) {
  if (error.code === "PGRST116") {
    return "Нет строки в profiles для текущего пользователя. Нужен backfill/триггер.";
  }
  return error.message ?? "Не удалось прочитать роль из profiles.";
}

async function fetchRole(): Promise<{ role: AppRole; error?: string }> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userRes?.user;

  if (userErr) return { role: "guest", error: userErr.message };
  if (!user) return { role: "guest" };

  // читаем роль из public.profiles (единственный источник правды)
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error) return { role: "guest", error: formatRoleError(error) };

  const r = (data?.role as AppRole) || "guest";
  return { role: r };
}

export function AdminGate({
  children,
  minRole = "engineer",
}: {
  children: ReactNode;
  minRole?: AppRole;
}) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>("guest");
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(() => rank[role] >= rank[minRole], [role, minRole]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const res = await fetchRole();
      if (!alive) return;

      setRole(res.role);
      setError(res.error ?? null);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [minRole]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-white/70">
        Проверяем доступ…
      </div>
    );
  }

  // если есть ошибка — покажем её (важно для RLS/профиля)
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-6 rounded-3xl bg-danger/15 border border-danger/30 text-white">
        <div className="text-2xl font-black">Админ-доступ не проверился</div>
        <div className="mt-2 text-white/80">
          Ошибка чтения <code>public.profiles</code>: <b>{error}</b>
        </div>
        <div className="mt-3 text-white/70 text-sm">
          Если видишь “нет строки”, создай профиль через backfill в <code>supabase_admin.sql</code> или убедись,
          что триггер на <code>auth.users</code> включён. Если строки есть — проверь RLS.
        </div>
        <div className="mt-4">
          <a className="underline text-white/90" href="/login">Перезайти</a>
        </div>
      </div>
    );
  }

  if (!allowed) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
