# ADR 005: Recipe Import Pending State — Stub Row Pattern

**Date:** 2026-08-11
**Status:** Accepted

## Context

All import paths (URL, image, social video) currently navigate the user to `RecipeDetailsScreen` immediately after a recipe is created. Two changes are being made:

1. Post-import navigation moves to `RecipesScreen` (not `RecipeDetailsScreen`), and newly created recipes show a "New" badge until first opened.
2. Social video imports — which run as background jobs taking 30–60s — should be visible in the recipe list as a grayed-out, non-interactive pending item while the job runs, rather than being invisible until completion.

The question is where the pending state lives: client-only (React state) or persisted (Supabase row).

## Options considered

**Option A — Client-only placeholder:** Track pending imports in a Redux slice or React state. Render a fake list item while the import runs.
- Rejected: the placeholder disappears if the app is backgrounded or killed, which is the common case for a 30–60s social video import. On the next foreground, the user has no visual indication the import is still running.

**Option B — `import_status` column on `recipes` (chosen):** Create a minimal stub row in `recipes` at the moment a social video job is kicked off, with `import_status = 'pending'`. Update the row in place when the job completes.
- Survives app backgrounding — on foreground, the AppState handler finds both the job ID and the stub recipe ID in App Group storage, updates the row, and the list refreshes.
- Keeps the recipe list as the single source of truth for all recipes, including in-progress ones.
- Schema change is small and backward-compatible (default `'complete'` means all existing recipes are unaffected).

## Decision

Add `import_status text NOT NULL DEFAULT 'complete'` to `recipes`. Values: `'pending'` | `'complete'`.

This column is only set to `'pending'` for social video imports, where the gap between job initiation and completion is long enough to warrant visible list feedback. URL and image imports remain blocking in the modal (5–15s) — they navigate to `RecipesScreen` with `refresh: true` on completion, with no stub row needed.

## Stub row lifecycle

1. `process-social-video` returns a `job_id` → client creates stub recipe: `{ title: 'Importing recipe…', import_status: 'pending', user_id }`.
2. Both `pendingSocialJobId` and `pendingRecipeId` are written to iOS App Group storage.
3. User is navigated to `RecipesScreen` with `refresh: true`. Stub appears at top of list, grayed out and non-tappable.
4. On job completion (in-modal poll or AppState foreground handler):
   - Call `recipeService.completeImport(pendingRecipeId, fullRecipeData)` → updates the stub row with real data + `import_status = 'complete'`.
   - Clear both App Group keys.
   - Navigate to `RecipesScreen` with `refresh: true`. The recipe now shows with "New" badge.
5. On job failure:
   - Delete the stub row (`recipeService.deleteRecipe(pendingRecipeId)`).
   - Clear both App Group keys.
   - Show the existing failure Alert.

## Orphaned stub mitigation

If App Group storage is cleared (reinstall, storage eviction) while a job is in-flight, the stub row will remain in `recipes` with `import_status = 'pending'` indefinitely. Deferred for v1 — the affected user count is negligible and the failure mode is a stuck grayed-out item that can be cleared by pull-to-refresh with a future cleanup query.

## "New" badge

`viewed_at IS NULL` is the signal. This requires no schema changes — `viewed_at` already exists and is set on `RecipeDetailsScreen` mount. Applies to all recipes regardless of import path, including manually created ones.
