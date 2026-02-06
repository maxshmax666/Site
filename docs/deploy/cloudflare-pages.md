# Cloudflare Pages: deploy и env

## Минимальные требования
- Node.js: `>=18.18` (рекомендуется LTS 20+).
- Cloudflare Pages project c включенными Pages Functions (`functions/`).

## Обязательные Variables (Settings → Variables and Secrets)

> Важно: Variables задаются **отдельно** для окружений `Production` и `Preview`.
> Нельзя рассчитывать, что значения автоматически копируются между окружениями.

### Runtime Variables (Pages Functions)

Обязательные переменные для `functions/api/*`:

- `SUPABASE_URL` **или** `API_ORIGIN` — origin вашего Supabase проекта (`https://<project-ref>.supabase.co`).
- `SUPABASE_ANON_KEY` — anon/publishable ключ для запросов от API-layer.

Если одна из обязательных переменных отсутствует, API вернет `500`:

```json
{
  "code": "MISCONFIGURED_ENV",
  "error": "Required runtime environment variables are missing",
  "missing": ["SUPABASE_URL|API_ORIGIN", "SUPABASE_ANON_KEY"]
}
```

### Build Variables (Vite client)

Переменные из текущего проекта, которые должны быть заданы на этапе сборки фронтенда:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

## Post-deploy smoke-check

После каждого деплоя (Production/Preview) выполните:

```bash
curl -fsS "https://<your-domain>/api/health"
curl -fsS "https://<your-domain>/api/menu"
curl -i -fsS "https://<your-domain>/api/auth/me"
```

Ожидания:
- `/api/health` → `200` + JSON `{ "ok": true }`.
- `/api/menu` → `200` + JSON с `categories` и `items`.
- `/api/auth/me`:
  - `401` без `Authorization` (это нормальный smoke-check для auth-gateway),
  - `500` с `code=MISCONFIGURED_ENV`, если runtime env не заданы.

## Why так
- Разделение Variables для `Production`/`Preview` снижает риск утечки прод-ключей в preview окружение.
- Явный `MISCONFIGURED_ENV` ускоряет диагностику инцидентов: видно, что проблема в конфиге, а не в бизнес-логике endpoint'а.

## Build/Deploy stability guardrails

`wrangler.toml` для Cloudflare Pages **не обязателен**.

Для этого проекта достаточно настроек в Pages UI:
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: корень репозитория
- Functions directory: `functions`

Если деплой падает с `Failed to publish assets` при успешной сборке:

1. Перезапустите деплой (часто это transient-side issue на стороне Pages).
2. Перепроверьте четыре параметра выше в Settings → Builds & deployments.
3. Сверьте логи: build должен завершаться успешно (`vite build` + артефакты в `dist`).
4. Если ошибка повторяется — приложите deployment ID в тикет Cloudflare Support.

Когда стоит добавлять `wrangler.toml`:
- если хотите хранить часть Pages-конфига в репозитории (IaC-подход),
- или использовать локальные wrangler-сценарии/валидацию.
