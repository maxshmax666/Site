#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Patching auth store to load role from public.profiles..."

cat > src/store/auth.store.ts <<'TS'
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Role } from "../lib/roles";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;

  // ✅ роль берём из public.profiles
  role: Role;

  init: () => Promise<void>;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

async function fetchRole(): Promise<Role> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (error) {
    // если таблицы ещё нет / RLS / нет профиля — пусть будет guest
    console.warn("profiles.role fetch error:", error.message);
    return "guest";
  }
  return (data?.role as Role) ?? "guest";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  role: "guest",

  init: async () => {
    // 1) initial session
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("supabase.getSession error:", error);
    const session = data.session ?? null;
    set({ session, user: session?.user ?? null, loading: false });

    // 2) load role if logged in
    if (session?.user) {
      const role = await fetchRole();
      set({ role });
    } else {
      set({ role: "guest" });
    }

    // 3) subscribe
    supabase.auth.onAuthStateChange(async (_event, session2) => {
      set({ session: session2 ?? null, user: session2?.user ?? null, loading: false });

      if (session2?.user) {
        const role = await fetchRole();
        set({ role });
      } else {
        set({ role: "guest" });
      }
    });
  },

  refreshRole: async () => {
    const user = get().user;
    if (!user) return set({ role: "guest" });
    const role = await fetchRole();
    set({ role });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, role: "guest" });
  },
}));
TS

echo "==> Patching AdminGate to use store.role..."

cat > src/components/admin/AdminGate.tsx <<'TS'
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { hasRole, type Role } from "../../lib/roles";

export function AdminGate({ minRole, children }: { minRole: Role; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-3xl p-8 bg-card border border-white/10 shadow-soft">
          <div className="text-white/80">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(role, minRole)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
TS

echo "==> Patching Header to show Admin link based on store.role..."

cat > src/app/layout/Header.tsx <<'TS'
import { NavLink } from "react-router-dom";
import { useCartStore } from "../../store/cart.store";
import { cn } from "../../lib/cn";
import { useAuthStore } from "../../store/auth.store";
import { hasRole, type Role } from "../../lib/roles";

const nav = [
  { to: "/", label: "Главная" },
  { to: "/menu", label: "Меню" },
  { to: "/loyalty", label: "Лояльность" },
  { to: "/catering", label: "Кейтеринг" },
  { to: "/contacts", label: "Контакты" },
];

export function Header() {
  const count = useCartStore((s) => s.count());
  const role = useAuthStore((s) => s.role);
  const showAdmin = hasRole(role as Role, "engineer"); // engineer+ видят админку

  return (
    <header className="sticky top-0 z-[40] backdrop-blur bg-bg/75 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <NavLink to="/" className="font-black tracking-wide text-lg">
          <span className="text-orange">Tagil</span>{" "}
          <span className="text-green">Pizza</span>{" "}
          <span className="text-yellow">🍕</span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {nav.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              {x.label}
            </NavLink>
          ))}

          {showAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              Админ
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NavLink
            to="/login"
            className="px-3 py-2 rounded-xl text-sm hover:bg-white/5 text-white/85"
          >
            Войти
          </NavLink>
          <NavLink
            to="/cart"
            className="relative px-4 py-2 rounded-xl text-sm bg-orange text-black font-semibold hover:opacity-90"
          >
            Корзина
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow text-black text-xs font-black flex items-center justify-center">
                {count}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
TS

echo "✅ Role source fixed: UI now uses public.profiles.role"
echo "Restart dev server: Ctrl+C then npm run dev"
