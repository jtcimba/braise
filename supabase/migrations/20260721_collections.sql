-- collections: user-scoped recipe collections (folders)
create table if not exists public.collections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  cover_image_url text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.collections (user_id, sort_order);

alter table public.collections enable row level security;

create policy "Users can read own collections"
  on public.collections for select
  using (user_id = auth.uid());

create policy "Users can insert own collections"
  on public.collections for insert
  with check (user_id = auth.uid());

create policy "Users can update own collections"
  on public.collections for update
  using (user_id = auth.uid());

create policy "Users can delete own collections"
  on public.collections for delete
  using (user_id = auth.uid());

-- recipe_collections: join table linking recipes to collections
create table if not exists public.recipe_collections (
  recipe_id     bigint not null references public.recipes(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  added_at      timestamptz not null default now(),
  sort_order    integer not null default 0,
  primary key (recipe_id, collection_id)
);

create index on public.recipe_collections (collection_id, sort_order);

alter table public.recipe_collections enable row level security;

create policy "Users can read own recipe_collections"
  on public.recipe_collections for select
  using ((select user_id from public.collections where id = collection_id) = auth.uid());

create policy "Users can insert own recipe_collections"
  on public.recipe_collections for insert
  with check ((select user_id from public.collections where id = collection_id) = auth.uid());

create policy "Users can delete own recipe_collections"
  on public.recipe_collections for delete
  using ((select user_id from public.collections where id = collection_id) = auth.uid());
