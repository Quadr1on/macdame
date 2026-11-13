-- History and private notes for orders, shown on the admin order page.
--
-- One row per thing that happened to an order through the admin: a status
-- change, a tracking ID change, or a note an admin wrote. "Order placed" is not
-- stored; the page derives it from orders.created_at.
--
-- RLS is on with NO policies: only the service role (used by /api/admin/*
-- routes and admin pages) can read or write. Notes are internal and must never
-- reach a customer through the anon or authenticated keys.

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('status', 'tracking', 'note')),
  from_value text,
  to_value text,
  note text check (note is null or char_length(note) between 1 and 2000),
  actor_email text,
  created_at timestamptz not null default now(),
  check (kind <> 'note' or note is not null)
);

create index if not exists order_events_order_id_created_at_idx
  on public.order_events (order_id, created_at desc);

alter table public.order_events enable row level security;
