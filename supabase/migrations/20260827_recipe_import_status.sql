ALTER TABLE recipes
  ADD COLUMN import_status text NOT NULL DEFAULT 'complete';
