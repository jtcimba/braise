-- households: one per user, created lazily on first grocery list use
create table if not exists public.households (
  id                     uuid primary key default gen_random_uuid(),
  primary_user_id        uuid not null references auth.users(id) on delete cascade,
  invite_code            text,
  invite_code_created_at timestamptz,
  created_at             timestamptz not null default now()
);

create unique index on public.households (primary_user_id);

-- household_members: primary user also gets a row (uniform membership checks)
create table if not exists public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text,
  joined_at    timestamptz not null default now(),
  unique (user_id)
);

create index on public.household_members (household_id);

-- grocery_list_items: replaces AsyncStorage, scoped to household
create table if not exists public.grocery_list_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  amount       text,
  category     text,
  completed    boolean not null default false,
  created_by   uuid references auth.users(id),
  updated_at   timestamptz not null default now()
);

create index on public.grocery_list_items (household_id, updated_at desc);

-- Security-definer helper to get the calling user's household_id.
-- security definer + stable avoids per-row RLS recursion when household_members
-- policies need to reference themselves.
create or replace function public.user_household_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select household_id from public.household_members where user_id = auth.uid() limit 1
$$;

-- ── households RLS ──────────────────────────────────────────────────────────
alter table public.households enable row level security;

create policy "Members can read own household"
  on public.households for select
  using (id = public.user_household_id());

-- Client-side auto-creation: primary inserts their own household
create policy "Authenticated users can create household"
  on public.households for insert
  with check (primary_user_id = auth.uid());

-- Only the primary can update (invite_code refreshes)
create policy "Primary can update household"
  on public.households for update
  using (primary_user_id = auth.uid());

-- ── household_members RLS ───────────────────────────────────────────────────
alter table public.household_members enable row level security;

create policy "Members can read household members"
  on public.household_members for select
  using (household_id = public.user_household_id());

-- Primary can insert their own membership row when creating a household
create policy "Primary can insert self as member"
  on public.household_members for insert
  with check (
    user_id = auth.uid()
    and (select primary_user_id from public.households where id = household_id) = auth.uid()
  );

-- ── grocery_list_items RLS ──────────────────────────────────────────────────
alter table public.grocery_list_items enable row level security;

create policy "Members can select grocery list items"
  on public.grocery_list_items for select
  using (household_id = public.user_household_id());

create policy "Members can insert grocery list items"
  on public.grocery_list_items for insert
  with check (household_id = public.user_household_id());

create policy "Members can update grocery list items"
  on public.grocery_list_items for update
  using (household_id = public.user_household_id());

create policy "Members can delete grocery list items"
  on public.grocery_list_items for delete
  using (household_id = public.user_household_id());
