# Contributing

## Минимальные требования
- Node.js `>=18.18` (рекомендуется 20 LTS).
- npm `>=9`.

## Локальный quality gate (обязателен перед PR)

```bash
npm ci
npm run lint
npm run typecheck
npm run test:ci
```

### Почему это важно
- `lint` ловит регрессии в React hooks (`exhaustive-deps`) и unsafe TypeScript-паттерны до ревью.
- `typecheck` в режиме `--noEmit` гарантирует корректность типов без побочных артефактов сборки.
- `test:ci` проверяет unit/integration и e2e поведение в одном прогоне.

## CI и merge policy
- Workflow: `.github/workflows/ci.yml`.
- Job/check name: `CI / install → lint → typecheck → test`.
- Для ветки по умолчанию настройте Branch protection (или Rulesets):
  - `Require status checks to pass before merging`.
  - Добавьте required check: `CI / install → lint → typecheck → test`.

Любое падение шагов `install`, `lint`, `typecheck` или `test` должно блокировать merge.
