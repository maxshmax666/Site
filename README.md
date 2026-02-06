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
- Для SPA-роутинга используется `_routes.json` (а не `_redirects`).
  `_redirects` на Pages конфликтует с HTML-нормализацией (strip `.html`/`/index`) и может приводить к loop, поэтому применяем нативный механизм маршрутизации.

Пример `public/_routes.json`:
```json
{
  "include": ["/*"],
  "exclude": [
    "/assets/*",
    "/*.css",
    "/*.js",
    "/*.map",
    "/favicon.ico"
  ]
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
