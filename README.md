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
