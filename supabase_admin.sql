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
-- alter table public.profiles owner to supabase_admin;

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
security definer
set search_path = public, auth
set row_security = off
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'guest'::app_role
  );
$$;
-- alter function public.current_role() owner to supabase_admin;

-- 5.1) helper: current user's role without triggering profiles RLS
create or replace function public.current_role_unrestricted()
returns app_role
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'guest'::app_role
  );
$$;
-- alter function public.current_role_unrestricted() owner to supabase_admin;

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

-- 6.1) backfill profiles for existing users (важно для аккаунтов до триггера)
insert into public.profiles(user_id, email, role)
select u.id, u.email, 'guest'::app_role
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
);

-- 6.2) назначение роли конкретному пользователю (email/uuid)
-- по email (создаст строку в profiles, если её нет)
insert into public.profiles(user_id, email, role)
select u.id, u.email, 'admin'::app_role
from auth.users u
where u.email = 'admin@example.com'
on conflict (user_id) do update
set role = excluded.role,
    email = excluded.email;

-- по uuid (предполагается, что пользователь уже существует в auth.users)
update public.profiles
set role = 'admin'::app_role
where user_id = '00000000-0000-0000-0000-000000000000'::uuid;

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
using (public.current_role_unrestricted() in ('admin','engineer','manager'));

drop policy if exists "profiles_admin_update_roles" on public.profiles;
create policy "profiles_admin_update_roles"
on public.profiles
for update
using (public.current_role_unrestricted() in ('admin','engineer'))
with check (public.current_role_unrestricted() in ('admin','engineer'));

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
