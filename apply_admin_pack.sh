#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Writing admin pack files..."

mkdir -p src/pages/admin src/lib src/components/admin

# --- role helpers ---
cat > src/lib/roles.ts <<'TS'
export type Role = "guest" | "admin" | "manager" | "courier" | "engineer";

export const roleRank: Record<Role, number> = {
  guest: 0,
  courier: 10,
  manager: 20,
  engineer: 30,
  admin: 40,
};

export function hasRole(userRole: Role | null | undefined, minRole: Role) {
  const r = (userRole ?? "guest") as Role;
  return (roleRank[r] ?? 0) >= (roleRank[minRole] ?? 0);
}
TS

# --- admin gate ---
cat > src/components/admin/AdminGate.tsx <<'TS'
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { hasRole, type Role } from "../../lib/roles";

export function AdminGate({ minRole, children }: { minRole: Role; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const role = (user?.user_metadata?.role as Role | undefined) ?? "guest";

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

# --- Admin layout ---
cat > src/pages/admin/AdminLayout.tsx <<'TS'
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";

const tabs = [
  { to: "/admin/orders", label: "Заказы" },
  { to: "/admin/kitchen", label: "Кухня" },
  { to: "/admin/couriers", label: "Курьеры" },
  { to: "/admin/users", label: "Пользователи" },
];

export function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Админ</h1>
          <div className="text-white/70 mt-1">
            Заказы, статусы, кухня, курьеры. Роли: admin / manager / courier / engineer.
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-card border border-white/10 shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
TS

# --- types for orders ---
cat > src/pages/admin/admin.types.ts <<'TS'
export type OrderStatus =
  | "NEW"
  | "COOKING"
  | "READY"
  | "COURIER"
  | "DELIVERED"
  | "CANCELLED";

export const statusLabel: Record<OrderStatus, string> = {
  NEW: "Новый",
  COOKING: "Готовится",
  READY: "Готово",
  COURIER: "У курьера",
  DELIVERED: "Доставлено",
  CANCELLED: "Отменено",
};

export const statusFlow: OrderStatus[] = ["NEW", "COOKING", "READY", "COURIER", "DELIVERED"];
TS

# --- Admin Orders page ---
cat > src/pages/admin/AdminOrdersPage.tsx <<'TS'
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { OrderStatus, statusLabel, statusFlow } from "./admin.types";

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  comment: string | null;
  status: OrderStatus;
  total: number;
};

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

export function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const totals = useMemo(() => {
    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
    return by;
  }, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("orders")
      .select("id,created_at,customer_name,customer_phone,address,comment,status,total")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  }

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {(["NEW", "COOKING", "READY", "COURIER", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((s) => (
            <div key={s} className="text-white/80">
              {statusLabel[s]}: <span className="text-white font-bold">{totals[s] ?? 0}</span>
            </div>
          ))}
        </div>

        <Button variant="soft" onClick={load} disabled={loading}>
          Обновить
        </Button>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
          <div className="text-white/70 mt-1">
            Скорее всего ты ещё не выполнил SQL-setup в Supabase. Он лежит в <code>supabase_admin.sql</code>.
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {loading && <div className="text-white/70">Загрузка…</div>}

        {!loading && rows.length === 0 && (
          <div className="text-white/70">Пока заказов нет. Можно добавить тестовые через SQL (см. файл).</div>
        )}

        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl p-4 bg-black/20 border border-white/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-white/70">{fmt(r.created_at)}</div>
              <Badge>{statusLabel[r.status]}</Badge>
            </div>

            <div className="mt-2 font-bold">
              {r.customer_name ?? "Без имени"}{" "}
              <span className="text-white/70 font-normal">{r.customer_phone ?? ""}</span>
            </div>

            <div className="mt-1 text-white/80 text-sm">{r.address ?? "Адрес не указан"}</div>
            {r.comment && <div className="mt-1 text-white/60 text-sm">Комментарий: {r.comment}</div>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-black text-lg">{Math.round(r.total)} ₽</div>

              <div className="flex flex-wrap gap-2">
                {statusFlow.map((s) => (
                  <Button
                    key={s}
                    variant={r.status === s ? "primary" : "soft"}
                    onClick={() => setStatus(r.id, s)}
                  >
                    {statusLabel[s]}
                  </Button>
                ))}
                <Button variant="danger" onClick={() => setStatus(r.id, "CANCELLED")}>
                  Отменить
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
TS

# --- Kitchen page ---
cat > src/pages/admin/AdminKitchenPage.tsx <<'TS'
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Badge } from "../../components/ui/Badge";
import type { OrderStatus } from "./admin.types";
import { statusLabel } from "./admin.types";

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string | null;
  total: number;
};

export function AdminKitchenPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("orders")
      .select("id,created_at,status,customer_name,total")
      .in("status", ["NEW", "COOKING", "READY"])
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, OrderRow[]> = { NEW: [], COOKING: [], READY: [] };
    for (const r of rows) g[r.status]?.push(r);
    return g;
  }, [rows]);

  return (
    <div>
      <div className="text-white/70">Экран кухни: NEW / COOKING / READY. Автообновление каждые 5 секунд.</div>
      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
        </div>
      )}

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        {(["NEW", "COOKING", "READY"] as OrderStatus[]).map((s) => (
          <div key={s} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="font-black">{statusLabel[s]}</div>
              <Badge>{grouped[s]?.length ?? 0}</Badge>
            </div>

            <div className="mt-3 grid gap-2">
              {(grouped[s] ?? []).map((r) => (
                <div key={r.id} className="rounded-xl p-3 bg-black/30 border border-white/10">
                  <div className="text-sm text-white/70">{new Date(r.created_at).toLocaleTimeString()}</div>
                  <div className="font-bold mt-1">{r.customer_name ?? "Без имени"}</div>
                  <div className="text-white font-black mt-1">{Math.round(r.total)} ₽</div>
                </div>
              ))}
              {(grouped[s] ?? []).length === 0 && <div className="text-white/60 text-sm">Пусто</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
TS

# --- Couriers page ---
cat > src/pages/admin/AdminCouriersPage.tsx <<'TS'
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import type { OrderStatus } from "./admin.types";
import { statusLabel } from "./admin.types";

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string | null;
  address: string | null;
  total: number;
  courier_id: string | null;
};

export function AdminCouriersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("orders")
      .select("id,created_at,status,customer_name,address,total,courier_id")
      .in("status", ["READY", "COURIER", "DELIVERED"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
  }

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-white/70">Экран курьеров: READY → COURIER → DELIVERED</div>
        <Button variant="soft" onClick={load}>Обновить</Button>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-white/70">{new Date(r.created_at).toLocaleString()}</div>
              <Badge>{statusLabel[r.status]}</Badge>
            </div>
            <div className="mt-2 font-bold">{r.customer_name ?? "Без имени"}</div>
            <div className="mt-1 text-white/80 text-sm">{r.address ?? "Адрес не указан"}</div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-black text-lg">{Math.round(r.total)} ₽</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="soft" onClick={() => setStatus(r.id, "COURIER")}>У курьера</Button>
                <Button variant="primary" onClick={() => setStatus(r.id, "DELIVERED")}>Доставлено</Button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-white/60">Пока пусто</div>}
      </div>
    </div>
  );
}
TS

# --- Users page (roles) ---
cat > src/pages/admin/AdminUsersPage.tsx <<'TS'
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
TS

# --- Export admin pages ---
# We will create barrel exports in src/pages/index.ts if not exists, but easiest is to import directly in router.

# --- Patch router to add /admin routes ---
cat > src/app/router.tsx <<'TS'
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./layout/RootLayout";
import { HomePage } from "../pages/HomePage";
import { MenuPage } from "../pages/MenuPage";
import { PizzaPage } from "../pages/PizzaPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { CateringPage } from "../pages/CateringPage";
import { ContactsPage } from "../pages/ContactsPage";
import { LoyaltyPage } from "../pages/LoyaltyPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AuthGate } from "../components/AuthGate";
import { AdminGate } from "../components/admin/AdminGate";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminKitchenPage } from "../pages/admin/AdminKitchenPage";
import { AdminCouriersPage } from "../pages/admin/AdminCouriersPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "pizza/:id", element: <PizzaPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "login", element: <LoginPage /> },
      {
        path: "profile",
        element: (
          <AuthGate>
            <ProfilePage />
          </AuthGate>
        ),
      },
      { path: "catering", element: <CateringPage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "loyalty", element: <LoyaltyPage /> },

      // ADMIN (мин. роль engineer, как просил)
      {
        path: "admin",
        element: (
          <AdminGate minRole="engineer">
            <AdminLayout />
          </AdminGate>
        ),
        children: [
          { index: true, element: <AdminOrdersPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "kitchen", element: <AdminKitchenPage /> },
          { path: "couriers", element: <AdminCouriersPage /> },
          { path: "users", element: <AdminUsersPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
TS

# --- Add admin link in header for engineer+ ---
# We'll patch Header.tsx minimally: show "Админ" if role >= engineer
# If your Header.tsx differs, we overwrite with safe version.
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
  const user = useAuthStore((s) => s.user);
  const role = (user?.user_metadata?.role as Role | undefined) ?? "guest";
  const showAdmin = hasRole(role, "engineer");

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

# --- SQL setup file (tables + RLS + triggers) ---
cat > supabase_admin.sql <<'SQL'
-- ================
-- Tagil Pizza Admin Pack (orders + profiles + roles)
-- Run this once in Supabase SQL Editor.
-- ================

-- 1) roles enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('guest','courier','manager','engineer','admin');
  end if;
end$$;

-- 2) profiles table (one row per auth user)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role app_role not null default 'guest',
  created_at timestamptz not null default now()
);

-- 3) orders table
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('NEW','COOKING','READY','COURIER','DELIVERED','CANCELLED');
  end if;
end$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  status order_status not null default 'NEW',
  total numeric not null default 0,

  customer_name text,
  customer_phone text,
  address text,
  comment text,

  courier_id uuid references auth.users(id) on delete set null
);

-- 4) simple order items (optional now, useful later)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  title text not null,
  qty int not null default 1,
  price numeric not null default 0
);

-- 5) helper: current user's role
create or replace function public.current_role()
returns app_role
language sql
stable
as $$
  select coalesce((select role from public.profiles where user_id = auth.uid()), 'guest'::app_role);
$$;

-- 6) trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(user_id, email, role)
  values (new.id, new.email, 'guest')
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 7) RLS
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles policies
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles
for select
using (user_id = auth.uid());

drop policy if exists "profiles_admin_read_all" on public.profiles;
create policy "profiles_admin_read_all"
on public.profiles
for select
using (public.current_role() in ('admin','engineer','manager'));

drop policy if exists "profiles_admin_update_roles" on public.profiles;
create policy "profiles_admin_update_roles"
on public.profiles
for update
using (public.current_role() in ('admin','engineer'))
with check (public.current_role() in ('admin','engineer'));

-- Orders policies:
-- customers can create their own orders
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders
for insert
with check (created_by = auth.uid());

-- customers can read their own orders
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders
for select
using (created_by = auth.uid());

-- admin/engineer/manager/courier can read orders (courier sees assigned + READY/COURIER/DELIVERED)
drop policy if exists "orders_staff_select" on public.orders;
create policy "orders_staff_select"
on public.orders
for select
using (
  public.current_role() in ('admin','engineer','manager')
  or (
    public.current_role() = 'courier'
    and (courier_id = auth.uid() or status in ('READY','COURIER','DELIVERED'))
  )
);

-- staff can update status/assignment
drop policy if exists "orders_staff_update" on public.orders;
create policy "orders_staff_update"
on public.orders
for update
using (public.current_role() in ('admin','engineer','manager','courier'))
with check (public.current_role() in ('admin','engineer','manager','courier'));

-- Order items:
drop policy if exists "order_items_select_via_order" on public.order_items;
create policy "order_items_select_via_order"
on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (
        o.created_by = auth.uid()
        or public.current_role() in ('admin','engineer','manager')
        or (public.current_role()='courier' and (o.courier_id=auth.uid() or o.status in ('READY','COURIER','DELIVERED')))
      )
  )
);

drop policy if exists "order_items_insert_via_order" on public.order_items;
create policy "order_items_insert_via_order"
on public.order_items
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.created_by = auth.uid()
  )
);

-- 8) Optional: create a couple test orders (uncomment if you want demo)
-- insert into public.orders(created_by, status, total, customer_name, customer_phone, address, comment)
-- values
--   (auth.uid(), 'NEW', 990, 'Тест', '+7 900 000-00-00', 'Юности 45', 'без лука'),
--   (auth.uid(), 'COOKING', 1290, 'Тест 2', '+7 900 000-00-01', 'Юности 45', 'остро');

SQL

echo "✅ Admin pack applied."
echo
echo "==> NEXT STEP:"
echo "1) Open Supabase -> SQL Editor and run: supabase_admin.sql"
echo "2) Then promote your account to admin/engineer with SQL (I will give you commands)."
echo
