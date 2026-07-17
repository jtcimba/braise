-- Add NOT NULL constraint to recipe_ingredients.name after the LLM backfill
-- has populated all rows. Run this only after confirming the backfill completed
-- with zero failures.

alter table public.recipe_ingredients alter column name set not null;
