-- Backfill recipe_ingredients for any recipes that have ingredients text
-- but no structured rows yet. Each line becomes a raw ingredient with no
-- amount/unit parsed (structure-ingredients edge function handles parsing).
INSERT INTO recipe_ingredients (recipe_id, name, base_name, amount, unit, sort_order)
SELECT
  r.id AS recipe_id,
  trim(line) AS name,
  trim(line) AS base_name,
  NULL AS amount,
  NULL AS unit,
  (row_number() OVER (PARTITION BY r.id ORDER BY ordinality)) - 1 AS sort_order
FROM recipes r,
     unnest(string_to_array(r.ingredients, E'\n')) WITH ORDINALITY AS t(line, ordinality)
WHERE r.ingredients IS NOT NULL
  AND trim(r.ingredients) <> ''
  AND trim(line) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id
  );
