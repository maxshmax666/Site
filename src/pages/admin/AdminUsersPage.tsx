import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import type { Role } from "../../lib/roles";

type ProfileRow = {
  user_id: string;
  email: string | null;
  role: Role;
  created_at: string;
};

const roles: Role[] = ["courier", "manager", "engineer", "admin"];

export function AdminUsersPage() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,email,role,created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
  }

  async function setRole(user_id: string, role: Role) {
    const { error } = await supabase.from("profiles").update({ role }).eq("user_id", user_id);
    if (error) return alert(error.message);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-white/70">
          Роли пользователей (admin/manager/courier/engineer). Для работы нужен SQL-setup.
        </div>
        <Button variant="soft" onClick={load}>Обновить</Button>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
          <div className="text-white/70 mt-1">
            Скорее всего не выполнен SQL из <code>supabase_admin.sql</code>.
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {rows.map((r) => (
          <div key={r.user_id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold">{r.email ?? r.user_id}</div>
              <Badge>{r.role}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((role) => (
                <Button
                  key={role}
                  variant={r.role === role ? "primary" : "soft"}
                  onClick={() => setRole(r.user_id, role)}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-white/60">Пока пусто</div>}
      </div>
    </div>
  );
}
