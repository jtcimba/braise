# ADR 002: Recipe Import Method Architecture

**Date:** 2026-07-30
**Status:** Amended 2026-08-04

## Context

Braise supports three user-facing paths for adding a recipe. This document describes the architecture of each as currently implemented, including where processing happens, which services are called, and how data flows into the recipe model.

All three paths converge on the same `Recipe` data model and the same post-save `structure-ingredients` step.

---

## Method 1: Paste a Link

**Entry point:** `AddModal.tsx` → `handleUrlImport`

### Flow

```
User pastes URL
  → isTikTokUrl() check
      → TikTok: async social video path (see Method 4 below)
  → client-side fetch() of page HTML (mobile Safari User-Agent)
  → POST /functions/v1/import-recipe { html, url }
      → fast path: extractJsonLd() — parses Recipe JSON-LD schema, no AI call
      → fallback: Claude Haiku — extracts recipe from stripped/truncated HTML
  → recipeService.createRecipe() → auto-save
  → RecipeDetailsScreen (view mode)
  → POST /functions/v1/structure-ingredients (fire-and-forget, after save)
```

### Key decisions

**Client-side HTML fetch.** The app fetches the page HTML before sending it to the edge function. This avoids SSRF risk in the edge function for arbitrary user-supplied URLs, and crucially allows YouTube URLs to work: YouTube blocks server-side fetches with bot-detection, but device-side fetches with a mobile User-Agent succeed.

**All extraction paths auto-save** (amendment 2026-08-04). Originally JSON-LD auto-saved to view mode while Claude extraction opened an edit-mode review screen. This distinction was removed: all extraction results now auto-save and navigate to view mode, consistent with Method 2 (photo) and social video. Scripts, styles, nav, footer, and SVG tags are still stripped before passing HTML to Claude to reduce token cost and noise.

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

**Always requires review → now auto-saves** (amendment 2026-08-04). Originally photo import opened edit mode; updated to auto-save and navigate to view mode, consistent with all other import paths.

**Base64 over upload.** Images are sent as base64 strings directly in the request body rather than uploaded to storage first. This keeps the flow synchronous and avoids managing temporary file storage. The 3-image limit and resize cap bound the payload size.

**Multi-image synthesis.** Up to 3 images can be submitted together, allowing a recipe spread across multiple pages (e.g. cookbook left/right pages) to be imported in one shot.

---

## Method 3: Social Video — In-App Link (TikTok)

**Entry point:** `AddModal.tsx` → `handleUrlImport` (TikTok branch)

See ADR 001 for the full social video architecture decision. This section covers the in-app variant.

### Flow

```
User pastes TikTok URL
  → POST /functions/v1/process-social-video { url, platform: 'tiktok' }
      → metadata server: yt-dlp --print description --no-download
      → import-from-transcript edge function extracts recipe from caption
      → video_import_jobs row set to ready_for_review or failed
  → AddModal polls video_import_jobs every 3s for up to 60s
      → ready_for_review: recipeService.createRecipe() → view mode RecipeDetailsScreen
      → failed: error alert
      → timeout: leaves pendingSocialJobId in App Group for AppState handler
```

### Key decisions

**In-app polling, not AppState.** When the import is triggered from within the app, the user never backgrounds — so `AppState` change events never fire. The modal polls directly and only falls back to the AppState path on timeout. See ADR 001 for the full polling design.

---

## Method 4: Write Your Own (From Scratch)

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

### `ingredientRowsFromText` (client-side utility)

All import paths that receive an ingredient string from an edge function call `ingredientRowsFromText(ingredients)` before passing to `recipeService.createRecipe`. This splits the newline-delimited string into `{id, amount, name}` row objects expected by `structure-ingredients`. Defined once in `recipeService.ts` and exported; used by `AddModal`, `App.tsx`, and the share extension completion handler.

### `structure-ingredients` (post-save, all methods)

After a recipe is saved to the `recipes` table, all four methods trigger `structure-ingredients` as a fire-and-forget call. This parses the ingredient string into rows in `recipe_ingredients` with fields `name`, `base_name`, `amount`, `unit` — used by the grocery list feature.

### AI model

All AI extraction uses **Claude Haiku** (`claude-haiku-4-5-20251001`). Chosen for speed and cost over Sonnet/Opus; recipe extraction from structured HTML and photos does not require stronger reasoning.

---

## Share Extension

The iOS Share Extension (`RecipeImportShareExtension`) runs out-of-process and routes incoming shares by URL type:

### Regular URLs (recipe websites via Safari or other apps)

```
User shares a recipe URL
  → extension fetches page HTML (URLSession, mobile User-Agent)
  → POST /functions/v1/import-recipe { html, url }
  → auto-saves to Supabase, writes importedRecipe to App Group UserDefaults
  → main app picks up importedRecipe on next foreground, navigates to RecipeDetailsScreen (view mode)
```

Note: both JSON-LD and Claude extraction paths auto-save. The edit-mode review distinction described in the original document was removed in August 2026 to match the uniform auto-save behavior across all import methods.

### TikTok and Instagram URLs

```
User shares a TikTok or Instagram URL
  → POST /functions/v1/process-social-video { url, platform }
  → receives job_id, writes pendingSocialJobId to App Group UserDefaults
  → shows "processing" message, dismisses
  → main app polls on next foreground via AppState handler
```

See ADR 001 for the full async job lifecycle.

### YouTube URLs

YouTube shares arrive as `public.plain-text` (not `public.url`) from the YouTube app. The share extension cannot reliably extract or process these URLs server-side (yt-dlp hits bot-detection), so YouTube is handled via a clipboard fallback:

```
User shares a YouTube URL
  → extension copies URL to UIPasteboard (main thread)
  → shows inline message explaining clipboard copy
  → after 2.5s: opens braise:// to bring app to foreground
  → user pastes into AddModal → Method 1 (URL import) handles it
```

YouTube links work well via Method 1 because device-side HTML fetch bypasses YouTube's server-side bot detection.

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
- All paths auto-save without a confirmation step. A bad extraction lands directly in the recipe list; the user must delete it manually. This is intentionally traded against the friction of a mandatory review step on every import.
- YouTube via share sheet requires the user to take an extra step (paste from clipboard). This is an accepted tradeoff given that YouTube via link works well and the alternative (attempting server-side fetch) reliably fails.
