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
