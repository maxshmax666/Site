import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-3xl p-8 bg-card border border-white/10 shadow-soft">
          <div className="text-white/80">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
