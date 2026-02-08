-- =========================
-- Tagil Pizza Menu (menu_items)
-- Run this once in Supabase SQL Editor (after supabase_admin.sql)
-- =========================

-- 0) Diagnostic (run before migration; helps to discover historical category keys)
-- select category::text as category, count(*) from public.menu_items group by 1 order by 2 desc;

-- category enum
do $$
begin
  if exists (select 1 from pg_type where typname = 'menu_category') then
    if not exists (select 1 from pg_type where typname = 'menu_category_v2') then
      create type menu_category_v2 as enum (
        'classic',
        'signature',
        'roman',
        'seasonal',
        'cold',
        'fried',
        'desserts',
        'drinks'
      );
    end if;
  else
    create type menu_category as enum (
      'classic',
      'signature',
      'roman',
      'seasonal',
      'cold',
      'fried',
      'desserts',
      'drinks'
    );
  end if;
end$$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'menu_category_v2') then
    -- Drop old enum default first, otherwise PG may fail casting default expression
    -- from menu_category -> menu_category_v2 during ALTER COLUMN TYPE.
    alter table if exists public.menu_items
      alter column category drop default;

    alter table if exists public.menu_items
      alter column category type menu_category_v2
      using (
        case category::text
          -- legacy values
          when 'pizza' then 'classic'
          when 'pizzas' then 'classic'
          when 'traditional' then 'classic'
          when 'classic_pizza' then 'classic'

          when 'firm' then 'signature'
          when 'special' then 'signature'
          when 'signature_pizza' then 'signature'

          when 'rome' then 'roman'
          when 'roma' then 'roman'
          when 'roman_pizza' then 'roman'

          when 'season' then 'seasonal'
          when 'promo' then 'seasonal'
          when 'other' then 'seasonal'
          when 'other_pizza' then 'seasonal'

          when 'cold_pizza' then 'cold'

          when 'snacks' then 'fried'
          when 'hot_snacks' then 'fried'
          when 'fried_snacks' then 'fried'

          when 'dessert' then 'desserts'
          when 'sweet' then 'desserts'

          when 'drink' then 'drinks'
          when 'beverages' then 'drinks'

          -- already valid enum values
          when 'classic' then 'classic'
          when 'signature' then 'signature'
          when 'roman' then 'roman'
          when 'seasonal' then 'seasonal'
          when 'cold' then 'cold'
          when 'fried' then 'fried'
          when 'desserts' then 'desserts'
          when 'drinks' then 'drinks'

          -- defensive fallback: prevent cast failures on unknown historical values
          when '' then 'classic'
          when 'null' then 'classic'
          when 'undefined' then 'classic'
          when 'unknown' then 'classic'
          else 'classic'
        end
      )::menu_category_v2;
    drop type if exists menu_category;
    alter type menu_category_v2 rename to menu_category;

    alter table if exists public.menu_items
      alter column category set default 'classic'::menu_category;
  end if;
end$$;

-- 1) One-off data fix for legacy textual keys (safe to run repeatedly)
update public.menu_items
set category = (
  case category::text
    when 'pizza' then 'classic'
    when 'pizzas' then 'classic'
    when 'traditional' then 'classic'
    when 'classic_pizza' then 'classic'

    when 'firm' then 'signature'
    when 'special' then 'signature'
    when 'signature_pizza' then 'signature'

    when 'rome' then 'roman'
    when 'roma' then 'roman'
    when 'roman_pizza' then 'roman'

    when 'season' then 'seasonal'
    when 'promo' then 'seasonal'
    when 'other' then 'seasonal'
    when 'other_pizza' then 'seasonal'

    when 'cold_pizza' then 'cold'

    when 'snacks' then 'fried'
    when 'hot_snacks' then 'fried'
    when 'fried_snacks' then 'fried'

    when 'dessert' then 'desserts'
    when 'sweet' then 'desserts'

    when 'drink' then 'drinks'
    when 'beverages' then 'drinks'

    when '' then 'classic'
    when 'null' then 'classic'
    when 'undefined' then 'classic'
    when 'unknown' then 'classic'

    else category::text
  end
)::menu_category
where category::text in (
  'pizza','pizzas','traditional','classic_pizza',
  'firm','special','signature_pizza',
  'rome','roma','roman_pizza',
  'season','promo','other','other_pizza',
  'cold_pizza',
  'snacks','hot_snacks','fried_snacks',
  'dessert','sweet',
  'drink','beverages',
  '','null','undefined','unknown'
);

-- menu_items table
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  title text not null,
  description text,
  category menu_category not null default 'classic',
  price numeric not null default 0,
  image_url text,
  is_active boolean not null default true,
  sort int not null default 100
);



-- categories table for public menu banners/admin select
create table if not exists public.menu_categories (
  key menu_category primary key,
  label text not null,
  full_label text not null,
  image_url text,
  fallback_background text not null default 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
  sort int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Backward-compatible columns for old installations
alter table if exists public.menu_categories
  add column if not exists full_label text,
  add column if not exists image_url text,
  add column if not exists fallback_background text,
  add column if not exists sort int,
  add column if not exists is_active boolean;

alter table if exists public.menu_categories
  alter column full_label set default '',
  alter column fallback_background set default 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
  alter column sort set default 100,
  alter column is_active set default true;

update public.menu_categories
set full_label = coalesce(nullif(trim(full_label), ''), label),
    fallback_background = coalesce(nullif(trim(fallback_background), ''), 'linear-gradient(135deg, #334155 0%, #0f172a 100%)'),
    sort = coalesce(sort, 100),
    is_active = coalesce(is_active, true);

alter table if exists public.menu_categories
  alter column full_label set not null,
  alter column fallback_background set not null,
  alter column sort set not null,
  alter column is_active set not null;

insert into public.menu_categories(key, label, full_label, image_url, fallback_background, sort, is_active)
values
  ('classic','Классические','Классические пиццы','https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',10,true),
  ('signature','Фирменные','Фирменные пиццы','https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #9a3412 0%, #7f1d1d 100%)',20,true),
  ('roman','Римские','Римские пиццы','https://images.unsplash.com/photo-1598023696416-0193a0bcd302?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #713f12 0%, #422006 100%)',30,true),
  ('seasonal','Сезонные','Сезонные пиццы','https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #166534 0%, #14532d 100%)',40,true),
  ('cold','Холодные','Холодная пицца','https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',50,true),
  ('fried','Жареные','Жареные закуски','https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',60,true),
  ('desserts','Сладости','Сладости','https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #db2777 0%, #9d174d 100%)',70,true),
  ('drinks','Напитки','Напитки','https://images.unsplash.com/photo-1551024709-8f23befc6cf7?auto=format&fit=crop&w=1600&q=80','linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',80,true)
on conflict (key) do update
set label = excluded.label,
    full_label = excluded.full_label,
    image_url = excluded.image_url,
    fallback_background = excluded.fallback_background,
    sort = excluded.sort;

alter table public.menu_items
  drop constraint if exists menu_items_category_fkey;

alter table public.menu_items
  add constraint menu_items_category_fkey
  foreign key (category) references public.menu_categories(key) on update cascade;

-- 2) Post-fix verification checks (type + FK integrity)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'menu_items'
      and column_name = 'category'
      and udt_name = 'menu_category'
  ) then
    raise exception 'menu_items.category is not typed as menu_category';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'menu_items_category_fkey'
      and n.nspname = 'public'
      and t.relname = 'menu_items'
      and pg_get_constraintdef(c.oid) ilike '%foreign key (category) references public.menu_categories(key)%'
  ) then
    raise exception 'menu_items_category_fkey is missing or points to wrong target';
  end if;
end$$;

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
-- ('Маргарита', 'Соус, сыр, базилик', 'classic', 520, true, 10),
-- ('Пепперони', 'Соус, сыр, пепперони', 'classic', 590, true, 20),
-- ('Кола 0.5', null, 'drinks', 120, true, 10);


alter table public.menu_categories enable row level security;

drop policy if exists "menu_categories_public_read_active" on public.menu_categories;
create policy "menu_categories_public_read_active"
on public.menu_categories
for select
using (is_active = true);

drop policy if exists "menu_categories_staff_manage" on public.menu_categories;
create policy "menu_categories_staff_manage"
on public.menu_categories
for all
using (public.current_role() in ('admin','engineer','manager'))
with check (public.current_role() in ('admin','engineer','manager'));
