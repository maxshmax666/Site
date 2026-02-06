import { ReactNode, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../../lib/roles";
import type { Role } from "../../lib/roles";
import { useAuthStore } from "../../store/auth.store";
import { Toast } from "../ui/Toast";

export function AdminGate({
  children,
  minRole = "engineer",
}: {
  children: ReactNode;
  minRole?: Role;
}) {
  const loading = useAuthStore((s) => s.loading);
  const role = useAuthStore((s) => s.role);
  const roleError = useAuthStore((s) => s.roleError);

  const allowed = useMemo(() => hasRole(role, minRole), [role, minRole]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-white/70">
        Проверяем доступ…
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="max-w-3xl mx-auto mt-6">
        <Toast
          inline
          title="Админ-доступ не проверился"
          message={(
            <>
              Ошибка чтения <code>public.profiles</code>: <b>{roleError}</b>
              <div className="mt-2 text-white/70">
                Проверь backfill/триггер в <code>supabase_admin.sql</code> и RLS-политики для таблицы профилей.
              </div>
            </>
          )}
        />
      </div>
    );
  }

  if (!allowed) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
