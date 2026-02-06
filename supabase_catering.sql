-- Catering requests storage + strict constraints.
create table if not exists public.catering_requests (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  event_at timestamptz not null,
  guests integer not null check (guests between 1 and 5000),
  comment text null check (comment is null or char_length(comment) <= 1000),
  source text not null default 'site',
  request_ip text null,
  user_agent text null
);

create index if not exists catering_requests_created_at_idx on public.catering_requests (created_at desc);
create index if not exists catering_requests_phone_created_at_idx on public.catering_requests (phone, created_at desc);
create index if not exists catering_requests_event_at_idx on public.catering_requests (event_at);

alter table public.catering_requests enable row level security;

-- No public insert/read policies: writes go through Edge Function with service role.
