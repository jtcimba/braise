-- Refactor recipe_ingredients to {amount, unit, name, base_name} schema
-- - rename quantity → amount
-- - add name (ingredient description without amount/unit, e.g. "garlic, minced")
-- - drop display_text and prep (display_text was the full original line; name replaces it
--   scoped to just the ingredient description; prep is folded into name)
--
-- name is populated from existing data before display_text and prep are dropped so
-- there is no window where rows have a null name. The LLM backfill then replaces
-- these interim values with properly structured ones.
-- After the backfill runs, apply 20260712_recipe_ingredients_name_not_null.sql.

alter table public.recipe_ingredients rename column quantity to amount;

alter table public.recipe_ingredients add column name text;

-- Populate name from existing columns before dropping them.
-- Reconstructs "garlic, minced" from base_name + prep as a safe interim value.
-- The backfill edge function will replace these with LLM-structured values.
update public.recipe_ingredients
set name = base_name || coalesce(', ' || prep, '');

alter table public.recipe_ingredients drop column display_text;
alter table public.recipe_ingredients drop column prep;
