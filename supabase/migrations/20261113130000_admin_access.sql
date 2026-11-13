-- Roles and members for the admin Access page.
--
-- Owners are still the emails in the ADMIN_EMAILS environment variable; they
-- are never stored here and always have every permission, so nobody can be
-- locked out by editing roles. Everyone else gets in through admin_members,
-- with the union of their roles' permissions.
--
-- RLS is on with NO policies on every table: only the service role (used by
-- the admin pages and /api/admin/* routes) can read or write them.

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  -- Higher position = more senior. A member can only manage roles below
  -- their own highest role, as in Discord.
  position integer not null default 0,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and email like '%_@_%'),
  added_by text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_member_roles (
  member_id uuid not null references public.admin_members(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  primary key (member_id, role_id)
);

create index if not exists admin_member_roles_role_id_idx on public.admin_member_roles (role_id);

-- Who changed access, and how. Kept as plain text so entries survive the
-- member or role they mention being deleted.
create table if not exists public.admin_access_events (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_access_events_created_at_idx on public.admin_access_events (created_at desc);

alter table public.admin_roles enable row level security;
alter table public.admin_members enable row level security;
alter table public.admin_member_roles enable row level security;
alter table public.admin_access_events enable row level security;

-- Starter roles. Editable and deletable from the Access page.
insert into public.admin_roles (name, color, position, permissions)
select * from (values
  ('Manager', '#7c3aed', 30, array[
    'dashboard.view', 'orders.view', 'orders.update', 'orders.cancel', 'orders.notes',
    'customers.view', 'products.view', 'products.edit', 'products.delete', 'collections.manage'
  ]),
  ('Catalogue editor', '#0891b2', 20, array['products.view', 'products.edit', 'collections.manage']),
  ('Packer', '#d97706', 10, array['orders.view', 'orders.update', 'orders.notes'])
) as starter(name, color, position, permissions)
where not exists (select 1 from public.admin_roles);
