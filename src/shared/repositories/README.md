# Repository source-of-truth policy

## Primary source
- `menuRepository`: primary source is `/api/menu`.
- `ordersRepository` and `loyaltyRepository`: primary source is Supabase (RLS-protected user-scoped data).

## Fallback rules
- Public menu data may fallback to Supabase when API fails (`menuRepository.fetchFromSupabase`).
- Menu categories may fallback to static defaults when both API and Supabase are unavailable.

## Fallback forbidden
- User-scoped data (`orders`, `loyalty`) must never fallback to public/static sources.
- Rationale: fallback can bypass authorization boundaries and return stale or чужие данные.
