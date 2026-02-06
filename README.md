# Пицца Тагил — сайт (React + TS + Vite + Tailwind)

## Запуск
```bash
npm install
npm run dev
```

## Сборка
```bash
npm run build
npm run preview
```

## Cloudflare Pages (SPA)
- Build command: `npm run build`
- Output directory: `dist`
- Functions directory: `functions` (Cloudflare Pages Functions enabled автоматически, если директория существует в репозитории)
- Для Cloudflare Pages Functions используется `_routes.json`, чтобы ограничить запуск Worker только на `/api/*` и не проксировать статические ассеты через Functions.

### API на Pages Functions

В репозитории добавлены endpoint'ы:

- `GET /api/health` → `{ "ok": true }`
- `GET /api/menu` → JSON-меню (`categories` + `items`)
- `GET /api/auth/me` → профиль текущего пользователя по `Authorization: Bearer <jwt>` или `401`

Все endpoint'ы явно отвечают `content-type: application/json; charset=utf-8`.

Для `GET /api/auth/me` в Cloudflare Pages нужно задать env vars:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Проверка после деплоя:

```bash
curl -i https://tagil.pizza/api/health
curl -i https://tagil.pizza/api/menu
curl -i https://tagil.pizza/api/auth/me
```

Ожидаемо: JSON-ответы (без `<!doctype html>` в body).

Пример `public/_routes.json`:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

## Категории меню (public + admin)
- Категории и баннеры хранятся в таблице `public.menu_categories` (seed есть в `supabase_menu.sql`).
- `public.menu_items.category` связан FK с `menu_categories.key`, поэтому у каждой позиции теперь обязательная валидная категория.
- Чтобы добавить новую категорию: добавьте значение в enum `menu_category`, затем создайте запись в `menu_categories` (key/label/full_label/image_url/fallback_background/sort).

- Runbook (безопасное добавление/переименование категорий без поломки legacy-данных):
  1. Перед изменениями снимите распределение текущих ключей: `select category::text as category, count(*) from public.menu_items group by 1 order by 2 desc;`.
  2. В `supabase_menu.sql` обновите mapping в блоке `case category::text ... end` (явно перечислите все legacy-ключи + fallback).
  3. Выполните data-fix: `update public.menu_items set category = ... where category::text in (...);` с тем же mapping (миграция идемпотентна).
  4. Только после data-fix меняйте/расширяйте enum `menu_category` и seed в `menu_categories` (key/label/full_label/image_url/fallback_background/sort).
  5. Проверьте схему: `menu_items.category` имеет тип `menu_category`, а FK `menu_items_category_fkey` ссылается на `menu_categories(key)`.
  6. Повторно выполните диагностический select и убедитесь, что остались только валидные enum-ключи.

## Кейтеринг: форма + endpoint контракт

## Назначение первой admin-роли вручную

После применения `supabase_admin.sql` назначение первой admin-роли выполняется **отдельно вручную** через `supabase_admin_role_grants.sql`.

⚠️ Важно по безопасности:
- не храните реальные production email/UUID в репозитории;
- перед запуском оператор должен вручную подставить целевые `email`/`user_id` в CTE `params`.

Явный SQL (из runbook, с плейсхолдерами):

```sql
begin;

with params as (
  select
    'change-me-admin@example.com'::text as target_email,
    '00000000-0000-0000-0000-000000000000'::uuid as target_user_id
),
upsert_from_email as (
  insert into public.profiles(user_id, email, role)
  select u.id, u.email, 'admin'::app_role
  from auth.users u
  join params p on u.email = p.target_email
  on conflict (user_id) do update
  set role = excluded.role,
      email = excluded.email
  returning user_id
),
update_from_uuid as (
  update public.profiles p
  set role = 'admin'::app_role
  from params prm
  where p.user_id = prm.target_user_id
  returning p.user_id
)
select
  (select count(*) from upsert_from_email) as granted_by_email,
  (select count(*) from update_from_uuid) as granted_by_uuid;

commit;
```

### Минимальные требования
- Node.js: `>=18.18` (рекомендуется LTS 20+).
- `@supabase/supabase-js`: `^2.93.3`.
- Развернутый Supabase project (Database + Edge Functions).

### Что развернуть
1. Применить SQL:
   ```bash
   # SQL файл в репозитории
   psql "$SUPABASE_DB_URL" -f supabase_catering.sql
   ```
2. Задеплоить Edge Function:
   ```bash
   supabase functions deploy catering-request
   ```
3. Убедиться, что фронтенд получает `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.

### Контракт `POST /functions/v1/catering-request`

Запрос (`application/json`):
```json
{
  "name": "Иван",
  "phone": "+79991234567",
  "eventDateTime": "2026-02-07T15:00:00.000Z",
  "guests": 30,
  "comment": "Нужна доставка к 16:00"
}
```

Поля и ограничения:
- `name`: обязательное, `1..80` символов.
- `phone`: обязательное, формат `+79991234567` (допускаются скобки/пробелы/дефисы на входе, нормализуются).
- `eventDateTime`: обязательное, ISO timestamp, минимум `+60 минут` от текущего момента.
- `guests`: обязательное целое число, диапазон `1..5000`.
- `comment`: опционально, до `1000` символов.

Ответы:
- `200 { "ok": true }` — заявка сохранена.
- `400` — ошибка валидации payload.
- `429` — rate limit превышен (больше 3 заявок за 15 минут на один телефон).
- `500` — внутренняя ошибка (БД/конфиг).

### SLA и операционные ожидания
- Целевой SLA ответа endpoint: `p95 < 700ms`, timeout клиента: `5s`.
- Повтор отправки на фронте: только вручную пользователем (без автоповтора, чтобы не дублировать заявки).
- Данные пишутся в `public.catering_requests`; публичных RLS policy на insert/read нет — запись только через service-role в Edge Function.
