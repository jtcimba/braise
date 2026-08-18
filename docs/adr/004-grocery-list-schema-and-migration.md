# ADR 004: Grocery List Schema, Field Naming, and Migration Strategy

**Date:** 2026-08-11
**Status:** Accepted

## Context

The grocery list is currently stored in AsyncStorage under the key `grocery_list_items`. The existing client-side shape is:

```ts
interface GroceryItem {
  id: string;
  name: string;
  category: string;   // Produce | Dairy | Meat & Seafood | Pantry | Frozen | Bakery | Other
  completed: boolean;
  amount: string;
  recipeId?: string;
  recipeTitle?: string;
}
```

Moving to Supabase requires defining a schema. The initial brief proposed:

```
name, quantity, checked, created_by
```

This has three issues against the existing shape:
- `quantity` → existing field is `amount`
- `checked` → existing field is `completed`
- `category` is omitted, but it is used for the "sort by category" feature in `GroceryListScreen`

## Decisions

### Field naming

Use `amount` and `completed` to match the existing local data model. Avoids a dual rename that has no benefit.

### `category` field

Include `category text` in `grocery_list_items`. The sort-by-category UI in `GroceryListScreen` is a shipped feature; omitting this column would require removing or silently breaking that feature. Category assignment is already handled by `categoryService.categorizeIngredient()` — it can be called on insert just as it is today.

### Recipe linkage (`recipeId`, `recipeTitle`)

Drop for v1 Supabase schema. The existing local fields `recipeId` and `recipeTitle` are soft metadata (not used for access control or merging). Recipe-linked meal planning is explicitly deferred. These fields will be re-added in that future milestone. The merge logic in `GroceryListModal` deduplicates by `name + recipeId`; with recipeId removed, deduplication falls back to `name` alone, which is acceptable for v1.

### Migration of existing local data

No migration. On app update, the AsyncStorage list is abandoned; users start with an empty Supabase-backed list. Rationale: current user base is small enough that the one-time disruption is acceptable, and migration would require a coordinated client/server read-then-write with no rollback path.

### Sync strategy

No Supabase Realtime in v1. `GroceryListScreen` re-fetches from Supabase when the screen gains focus, matching the existing AsyncStorage on-focus read pattern. Pull-to-refresh also triggers a full re-fetch. Last-write-wins is the conflict model — acceptable at 2-person scale with on-focus sync. Realtime will be added in a follow-up when the user base warrants it.

### Final `grocery_list_items` schema

```sql
id          uuid        primary key default gen_random_uuid()
household_id uuid       not null references households(id) on delete cascade
name        text        not null
amount      text
category    text
completed   boolean     not null default false
created_by  uuid        references auth.users(id)
updated_at  timestamptz not null default now()
```

## Consequences

- `GroceryListScreen` and `GroceryListModal` need to be updated to read/write Supabase instead of AsyncStorage. The service and context layers stay the same shape.
- Sort-by-category continues to work without UI changes.
- Users lose their current local grocery list on upgrade. No in-app notice is strictly required, but a one-time empty-state message ("Your grocery list is now shared with your household") would soften this.
