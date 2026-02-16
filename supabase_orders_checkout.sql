-- Checkout transactional RPC + idempotency support.
alter table public.orders
  add column if not exists client_request_key text;

alter table public.orders
  add column if not exists payment_method text not null default 'cash',
  add column if not exists payment_code text;

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check check (payment_method in ('cash', 'sberbank_code'));

create unique index if not exists orders_created_by_request_key_uidx
  on public.orders (created_by, client_request_key)
  where client_request_key is not null;

create or replace function public.create_order_with_items(
  p_total numeric,
  p_customer_name text,
  p_customer_phone text,
  p_address text,
  p_comment text,
  p_payment_method text,
  p_payment_code text,
  p_items jsonb,
  p_idempotency_key text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_existing_order_id uuid;
  v_item jsonb;
  v_qty int;
  v_price numeric;
  v_title text;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'Idempotency key is required';
  end if;

  select o.id
  into v_existing_order_id
  from public.orders o
  where o.created_by = auth.uid()
    and o.client_request_key = p_idempotency_key
  limit 1;

  if v_existing_order_id is not null then
    return v_existing_order_id;
  end if;

  insert into public.orders (
    created_by,
    total,
    customer_name,
    customer_phone,
    address,
    comment,
    payment_method,
    payment_code,
    client_request_key
  )
  values (
    auth.uid(),
    p_total,
    p_customer_name,
    p_customer_phone,
    p_address,
    p_comment,
    case when coalesce(nullif(trim(p_payment_method), ''), 'cash') in ('cash', 'sberbank_code')
      then coalesce(nullif(trim(p_payment_method), ''), 'cash')
      else 'cash'
    end,
    p_payment_code,
    p_idempotency_key
  )
  returning id into v_order_id;

  for v_item in select jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    v_price := coalesce((v_item->>'price')::numeric, 0);
    v_title := coalesce(nullif(v_item->>'title', ''), '');

    if v_qty <= 0 or v_price < 0 or v_title = '' then
      raise exception 'Invalid order item payload';
    end if;

    insert into public.order_items (order_id, title, qty, price)
    values (v_order_id, v_title, v_qty, v_price);
  end loop;

  if not exists (select 1 from public.order_items oi where oi.order_id = v_order_id) then
    raise exception 'Order must contain at least one item';
  end if;

  return v_order_id;
end;
$$;

grant execute on function public.create_order_with_items(numeric, text, text, text, text, text, text, jsonb, text) to authenticated;
