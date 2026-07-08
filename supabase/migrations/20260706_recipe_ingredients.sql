-- recipe_ingredients: structured per-recipe ingredient rows
create table if not exists public.recipe_ingredients (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    bigint not null references public.recipes(id) on delete cascade,
  display_text text not null,
  base_name    text not null,
  prep         text,
  quantity     text,
  unit         text,
  sort_order   integer not null,
  created_at   timestamptz not null default now()
);

create index on public.recipe_ingredients (recipe_id, sort_order);

alter table public.recipe_ingredients enable row level security;

create policy "Users can read own recipe ingredients"
  on public.recipe_ingredients for select
  using ((select user_id from public.recipes where id = recipe_id) = auth.uid());

create policy "Users can insert own recipe ingredients"
  on public.recipe_ingredients for insert
  with check ((select user_id from public.recipes where id = recipe_id) = auth.uid());

create policy "Users can update own recipe ingredients"
  on public.recipe_ingredients for update
  using ((select user_id from public.recipes where id = recipe_id) = auth.uid());

create policy "Users can delete own recipe ingredients"
  on public.recipe_ingredients for delete
  using ((select user_id from public.recipes where id = recipe_id) = auth.uid());

-- structuring_logs: audit trail for every LLM structuring call
create table if not exists public.structuring_logs (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    bigint references public.recipes(id) on delete set null,
  input_lines  jsonb not null,
  output_json  jsonb,
  error        text,
  created_at   timestamptz not null default now()
);

create index on public.structuring_logs (recipe_id, created_at desc);
