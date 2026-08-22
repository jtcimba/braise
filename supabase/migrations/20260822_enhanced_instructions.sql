alter table public.recipes
  add column if not exists enhanced_instructions text;
