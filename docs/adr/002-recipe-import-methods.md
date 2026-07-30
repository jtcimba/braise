# ADR 002: Recipe Import Method Architecture

**Date:** 2026-07-30
**Status:** Implemented

## Context

Braise supports three user-facing paths for adding a recipe. This document describes the architecture of each as currently implemented, including where processing happens, which services are called, and how data flows into the recipe model.

All three paths converge on the same `Recipe` data model and the same post-save `structure-ingredients` step.

---

## Method 1: Paste a Link

**Entry point:** `AddModal.tsx` → `handleUrlImport`

### Flow

```
User pastes URL
  → client-side fetch() of page HTML (mobile Safari User-Agent)
  → POST /functions/v1/import-recipe { html, url }
      → fast path: extractJsonLd() — parses Recipe JSON-LD schema, no AI call
      → fallback: Claude Haiku — extracts recipe from stripped/truncated HTML
  → Recipe model → RecipeDetailsScreen (edit mode)
  → POST /functions/v1/structure-ingredients (fire-and-forget, after save)
```

### Key decisions

**Client-side HTML fetch.** The app fetches the page HTML before sending it to the edge function. This avoids SSRF risk in the edge function for arbitrary user-supplied URLs (the edge function does validate URLs if called with `url`-only for backwards compatibility, but the primary path sends pre-fetched HTML).

**JSON-LD fast path → auto-save.** Most recipe websites embed `application/ld+json` with `@type: Recipe`. The edge function extracts and formats this without an AI call and returns `extractionMethod: 'jsonld'`. The app saves immediately and navigates to the recipe in view mode.

**Claude Haiku fallback → review screen.** For pages without JSON-LD, Claude Haiku processes the stripped, truncated HTML (100k char limit). The edge function returns `extractionMethod: 'claude'`. The app routes to RecipeDetailsScreen in edit mode — the user must review and save manually. Scripts, styles, nav, footer, and SVG tags are stripped first to reduce token cost and noise.

---

## Method 2: Snap a Photo

**Entry point:** `AddModal.tsx` → `handleSnapPhoto` → `handleImagesSelected`

### Flow

```
User takes photo or picks from library (1–3 images, max 2000x2000, 0.8 quality)
  → base64-encode images client-side (react-native-image-picker)
  → POST /functions/v1/import-recipe-from-image { images: [base64, ...] }
      → Claude Haiku with vision — reads image(s) directly, extracts recipe
  → Recipe model → RecipeDetailsScreen (edit mode)
  → POST /functions/v1/structure-ingredients (fire-and-forget, after save)
```

### Key decisions

**Always requires review.** Photos have no structured metadata, so every extraction goes through Claude Haiku vision. The app always routes to RecipeDetailsScreen in edit mode — there is no auto-save path for photo import.

**Base64 over upload.** Images are sent as base64 strings directly in the request body rather than uploaded to storage first. This keeps the flow synchronous and avoids managing temporary file storage. The 3-image limit and resize cap bound the payload size.

**Multi-image synthesis.** Up to 3 images can be submitted together, allowing a recipe spread across multiple pages (e.g. cookbook left/right pages) to be imported in one shot.

---

## Method 3: Write Your Own (From Scratch)

**Entry point:** `AddModal.tsx` → `handleClose` + `navigation.navigate('RecipeDetailsScreen', { item: emptyRecipe })`

### Flow

```
User taps "Write your own"
  → navigate to RecipeDetailsScreen with empty Recipe object (edit mode)
  → user fills fields manually
  → save → POST /rest/v1/recipes
  → POST /functions/v1/structure-ingredients (fire-and-forget, after save)
```

### Key decisions

**No AI, no server round-trip.** The entry point is a direct navigation call with a blank recipe object. No processing happens until the user explicitly saves.

---

## Shared Infrastructure

### `recipeUtils.ts`

Shared module used by both `import-recipe` and `import-recipe-from-image`:

| Export | Purpose |
|--------|---------|
| `extractJsonLd` | Finds `@type: Recipe` JSON-LD block in HTML |
| `formatRecipeFromJsonLd` | Maps JSON-LD fields to `RecipeResult` |
| `callClaudeApi` | Calls Claude Haiku, parses JSON response |
| `assembleRecipeResult` | Normalises raw Claude output to `RecipeResult` |
| `cleanIngredients` | Fixes double-parenthesis artefacts from some sources |
| `splitNumberedInstructions` | Splits run-on numbered steps into separate lines |
| `structureIngredients` | Called by `structure-ingredients` edge function |

### `structure-ingredients` (post-save, all methods)

After a recipe is saved to the `recipes` table, all three methods trigger `structure-ingredients` as a fire-and-forget call. This parses the ingredient string into rows in `recipe_ingredients` with fields `name`, `base_name`, `amount`, `unit` — used by the grocery list feature.

### AI model

All AI extraction uses **Claude Haiku** (`claude-haiku-4-5-20251001`). Chosen for speed and cost over Sonnet/Opus; recipe extraction from structured HTML and photos does not require stronger reasoning.

---

## Share Extension (URL import variant)

The iOS Share Extension (`RecipeImportShareExtension`) mirrors Method 1 but runs out-of-process:

```
User shares a recipe URL from Safari or another app
  → extension fetches page HTML (URLSession, mobile User-Agent)
  → POST /functions/v1/import-recipe { html, url }
  → saves directly to Supabase (bypasses RecipeDetailsScreen)
  → writes importedRecipe to App Group UserDefaults
  → opens braise://import-complete deep link
```

The same JSON-LD vs Claude rule applies here: JSON-LD extraction auto-saves and the deep link opens the recipe in view mode; Claude extraction opens RecipeDetailsScreen in edit mode for review before saving. Social video URLs (TikTok, Instagram, YouTube) are detected and routed differently — see ADR 001.

---

## Observability

All AI-assisted import attempts (Methods 1, 2, and share extension) must be logged for monitoring extraction success rates and diagnosing platform-specific failures.

### `import_logs` table

```sql
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  platform TEXT,          -- 'url', 'photo', 'share_extension', 'tiktok', 'instagram', 'youtube'
  extraction_method TEXT, -- 'jsonld', 'claude_html', 'claude_vision', 'caption_text', 'caption_url'
  success BOOLEAN,
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Logged from each edge function after every attempt. RLS restricts reads to service role only — no user-facing log access needed. **PII policy: do not store source URLs or recipe content.**

---

## Consequences

- All AI-assisted paths depend on Anthropic API availability. No offline fallback exists.
- The JSON-LD fast path means common recipe sites (NYT Cooking, Serious Eats, AllRecipes) incur no AI cost.
- Base64 image payloads can be large for high-quality photos. The 3-image cap and resize limit bound this, but very large payloads may approach Supabase Edge Function limits.
- `structure-ingredients` runs asynchronously after save. If it fails, the recipe is still saved but the grocery list will not have structured ingredient data until a backfill is run.
