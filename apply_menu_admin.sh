#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Adding Admin Menu editor..."

mkdir -p src/pages/admin

# 1) AdminMenuPage.tsx — CRUD редактор
cat > src/pages/admin/AdminMenuPage.tsx <<'TS'
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

type Category = "pizza" | "snacks" | "drinks" | "desserts" | "other";

type MenuItem = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  category: Category;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort: number;
};

const categories: { value: Category; label: string }[] = [
  { value: "pizza", label: "Пицца" },
  { value: "snacks", label: "Закуски" },
  { value: "drinks", label: "Напитки" },
  { value: "desserts", label: "Десерты" },
  { value: "other", label: "Другое" },
];

function money(n: number) {
  if (!Number.isFinite(n)) return "0 ₽";
  return `${Math.round(n)} ₽`;
}

export function AdminMenuPage() {
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("pizza");
  const [price, setPrice] = useState<string>("590");
  const [imageUrl, setImageUrl] = useState("");
  const [sort, setSort] = useState<string>("100");
  const [isActive, setIsActive] = useState(true);

  const activeCount = useMemo(() => rows.filter((r) => r.is_active).length, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("menu_items")
      .select("id,created_at,title,description,category,price,image_url,is_active,sort")
      .order("category", { ascending: true })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  }

  async function createItem() {
    const p = Number(price);
    const s = Number(sort);

    if (!title.trim()) return alert("Название обязательно");
    if (!Number.isFinite(p) || p <= 0) return alert("Цена должна быть > 0");

    const payload = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      category,
      price: p,
      image_url: imageUrl.trim() ? imageUrl.trim() : null,
      is_active: !!isActive,
      sort: Number.isFinite(s) ? s : 100,
    };

    const { error } = await supabase.from("menu_items").insert(payload);
    if (error) return alert(error.message);

    setTitle("");
    setDescription("");
    setImageUrl("");
    setPrice("590");
    setSort("100");
    setIsActive(true);

    await load();
  }

  async function updateItem(id: string, patch: Partial<MenuItem>) {
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить позицию?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-white/70">
          Редактор меню (таблица <code>menu_items</code>). Активных:{" "}
          <span className="text-white font-bold">{activeCount}</span> / {rows.length}
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={load} disabled={loading}>
            Обновить
          </Button>
        </div>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
          <div className="text-white/70 mt-1">
            Скорее всего ты ещё не выполнил SQL-setup для меню. Он лежит в <code>supabase_menu.sql</code>.
          </div>
        </div>
      )}

      {/* Create */}
      <div className="mt-5 rounded-2xl p-4 bg-black/20 border border-white/10">
        <div className="font-bold">Добавить позицию</div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Input placeholder="Название (например: Пепперони)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input
              placeholder="Описание (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Ссылка на фото (опционально)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">
              Категория
              <select
                className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Цена ₽" value={price} onChange={(e) => setPrice(e.target.value)} />
              <Input placeholder="Сортировка" value={sort} onChange={(e) => setSort(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Активно (видно клиентам)
            </label>

            <Button onClick={createItem}>Добавить</Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-5 grid gap-3">
        {loading && <div className="text-white/70">Загрузка…</div>}
        {!loading && rows.length === 0 && !err && <div className="text-white/60">Пока пусто</div>}

        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-lg">{r.title}</div>
                  <Badge>{categories.find((c) => c.value === r.category)?.label ?? r.category}</Badge>
                  {!r.is_active && <Badge>СКРЫТО</Badge>}
                </div>
                {r.description && <div className="text-white/70 text-sm mt-1">{r.description}</div>}
                {r.image_url && (
                  <div className="text-white/60 text-xs mt-1 break-all">
                    {r.image_url}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-white font-black text-lg">{money(r.price)}</div>
                <div className="text-white/60 text-xs">sort: {r.sort}</div>
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-4 gap-2">
              <Button
                variant={r.is_active ? "soft" : "primary"}
                onClick={() => updateItem(r.id, { is_active: !r.is_active })}
              >
                {r.is_active ? "Скрыть" : "Показать"}
              </Button>

              <Button
                variant="soft"
                onClick={() => {
                  const v = prompt("Новая цена ₽", String(r.price));
                  if (v === null) return;
                  const n = Number(v);
                  if (!Number.isFinite(n) || n <= 0) return alert("Неверная цена");
                  void updateItem(r.id, { price: n });
                }}
              >
                Изменить цену
              </Button>

              <Button
                variant="soft"
                onClick={() => {
                  const v = prompt("Сортировка (меньше = выше)", String(r.sort));
                  if (v === null) return;
                  const n = Number(v);
                  if (!Number.isFinite(n)) return alert("Неверная сортировка");
                  void updateItem(r.id, { sort: n });
                }}
              >
                Сортировка
              </Button>

              <Button variant="danger" onClick={() => removeItem(r.id)}>
                Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
TS

# 2) Патчим AdminLayout: добавляем вкладку "Меню"
cat > src/pages/admin/AdminLayout.tsx <<'TS'
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";

const tabs = [
  { to: "/admin/orders", label: "Заказы" },
  { to: "/admin/kitchen", label: "Кухня" },
  { to: "/admin/couriers", label: "Курьеры" },
  { to: "/admin/menu", label: "Меню" },
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

# 3) Патчим router: добавляем /admin/menu
# Полностью перезапишем router.tsx безопасной версией с menu-страницей
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
import { AdminMenuPage } from "../pages/admin/AdminMenuPage";

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

      // ADMIN (мин. роль engineer+)
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
          { path: "menu", element: <AdminMenuPage /> },
          { path: "users", element: <AdminUsersPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
TS

# 4) SQL для таблицы меню + RLS
cat > supabase_menu.sql <<'SQL'
-- =========================
-- Tagil Pizza Menu (menu_items)
-- Run this once in Supabase SQL Editor (after supabase_admin.sql)
-- =========================

-- category enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'menu_category') then
    create type menu_category as enum ('pizza','snacks','drinks','desserts','other');
  end if;
end$$;

-- menu_items table
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  title text not null,
  description text,
  category menu_category not null default 'pizza',
  price numeric not null default 0,
  image_url text,
  is_active boolean not null default true,
  sort int not null default 100
);

-- RLS
alter table public.menu_items enable row level security;

-- Anyone can read active menu (public)
drop policy if exists "menu_public_read_active" on public.menu_items;
create policy "menu_public_read_active"
on public.menu_items
for select
using (is_active = true);

-- Staff can read all menu (including hidden)
drop policy if exists "menu_staff_read_all" on public.menu_items;
create policy "menu_staff_read_all"
on public.menu_items
for select
using (public.current_role() in ('admin','engineer','manager'));

-- Only admin/engineer/manager can insert/update/delete
drop policy if exists "menu_staff_insert" on public.menu_items;
create policy "menu_staff_insert"
on public.menu_items
for insert
with check (public.current_role() in ('admin','engineer','manager'));

drop policy if exists "menu_staff_update" on public.menu_items;
create policy "menu_staff_update"
on public.menu_items
for update
using (public.current_role() in ('admin','engineer','manager'))
with check (public.current_role() in ('admin','engineer','manager'));

drop policy if exists "menu_staff_delete" on public.menu_items;
create policy "menu_staff_delete"
on public.menu_items
for delete
using (public.current_role() in ('admin','engineer','manager'));

-- Optional seed (uncomment to add demo items)
-- insert into public.menu_items(title, description, category, price, is_active, sort)
-- values
-- ('Пепперони', 'Соус, сыр, пепперони', 'pizza', 590, true, 10),
-- ('Маргарита', 'Соус, сыр, базилик', 'pizza', 520, true, 20),
-- ('Кола 0.5', null, 'drinks', 120, true, 10);
SQL

echo "✅ Admin Menu editor added."
echo
echo "NEXT:"
echo "1) Run SQL in Supabase: supabase_menu.sql"
echo "2) Restart dev server: Ctrl+C then npm run dev"
echo "3) Open /admin/menu"
