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
