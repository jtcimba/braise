# ADR 001: Social Video Import Architecture

**Date:** 2026-07-30
**Status:** Amended 2026-08-04

## Context

Users want to import recipes from TikTok, Instagram, and YouTube videos shared via the iOS share sheet. A spike was conducted to determine what data the iOS Share Extension actually receives from each platform, and what the feasible extraction path is.

## Spike findings

Physical device testing (iOS Share Extension with TRUEPREDICATE activation, logging all UTIs) revealed:

| Platform | UTI offered | Payload |
|----------|-------------|---------|
| TikTok | `public.url` | Video page URL only |
| Instagram | `public.url` | Video page URL only |
| YouTube | `public.plain-text` | Video page URL as plain text |

No platform passes a video file, audio file, or caption text to the share extension. The extension receives only the URL in all cases.

## Options considered

### Option 1: Client-side og:description fetch
Fetch the TikTok/Instagram/YouTube page HTML from within the extension and extract the caption from `og:description`. No server required.

**Ruled out.** TikTok blocks client-side `URLSession` requests despite a mobile Safari User-Agent. Instagram requires authentication. Client-side fetch returned no usable content.

### Option 2: Server-side video download + audio transcription
A server runs yt-dlp to download the video, extracts audio with ffmpeg, transcribes with OpenAI Whisper, then passes the transcript to the recipe extraction LLM.

**Deferred.** High cost (~$0.01/min of audio), slow (30-60s per video), and requires the full async job infrastructure before any value is delivered. Revisit if metadata-only proves insufficient.

### Option 3: Server-side metadata fetch (decided)
A server runs `yt-dlp --print description --no-download` to retrieve the video caption/description without downloading the video. The caption is then passed to the recipe extraction LLM. If the caption contains a link to a recipe website, the existing HTML import flow handles it.

**Selected.** ~2 second latency, minimal cost, no video download. Recipe creators on TikTok typically put the recipe text or a recipe site link in the caption.

## Decision

**Option 3: server-side metadata fetch, with Option 2 (transcription) as a fallback if captions prove insufficient.**

### Architecture

```
Share Extension
  → checks Pro status from App Group UserDefaults (isPro key) — exits to paywall if false
  → detects social URL (tiktok.com, instagram.com, youtube.com, youtu.be)
  → POST /functions/v1/process-social-video { url, platform } with JWT
  → receives job_id immediately
  → writes job_id to App Group UserDefaults (pendingSocialJobId key)
  → dismisses with "Processing…" UI

Metadata server (Fly.io or Railway, Node.js + yt-dlp)
  → yt-dlp --print description --no-download <url>
  → returns { description, title }

Supabase Edge Function: process-social-video
  → inserts row into video_import_jobs (status: processing)
  → calls metadata server → gets { description, title }
  → calls import-from-transcript edge function
  → stores extracted recipe JSON in video_import_jobs.extracted_recipe
  → sets status: ready_for_review (or failed)

Supabase Edge Function: import-from-transcript
  → receives caption text + title
  → if caption contains a non-social URL: fetches that page, uses existing HTML import flow
  → otherwise: sends caption text to LLM for recipe extraction
  → returns { recipe, lowConfidence }

Main app (on foreground)
  → reads pendingSocialJobId from App Group UserDefaults
  → if present: queries video_import_jobs for that id
  → if status = ready_for_review: clears UserDefaults key, auto-saves recipe,
    navigates to RecipeDetailsScreen (view mode) — see amendment below
  → if status = failed: shows alert, clears key
```

### `video_import_jobs` schema

```sql
CREATE TABLE video_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  platform TEXT NOT NULL,         -- 'tiktok', 'instagram', 'youtube'
  status TEXT NOT NULL DEFAULT 'processing',  -- 'processing', 'ready_for_review', 'failed'
  extracted_recipe JSONB,         -- populated when status = ready_for_review
  low_confidence BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

The extracted recipe JSON is stored in `video_import_jobs`, not in the `recipes` table. A row in `recipes` is created when the app processes the completed job (auto-save). This keeps speculative data out of the recipe table until extraction confirms a result. See the UX amendment below for the change from manual save to auto-save.

### ToS note

yt-dlp metadata fetch (no video download) is a significantly lower-risk operation than video downloading. No copyrighted content is transferred. The description/caption text is public information. This is an accepted risk given the metadata-only scope; revisit if the transcription path is ever added.

### YouTube: clipboard fallback (amendment 2026-08-04)

After implementation, YouTube via share sheet was routed through the async metadata path (same as TikTok/Instagram), but this did not work: the YouTube app does not reliably expose an extractable URL from the `NSItemProvider` payload in the share extension context. `yt-dlp` also intermittently fails on YouTube URLs due to bot-detection.

**Decision:** YouTube share sheet imports are handled via a clipboard fallback, not the async job pipeline:

```
Share extension receives YouTube URL (public.plain-text or public.url)
  → copy URL to UIPasteboard on main thread
  → show inline message: "YouTube videos can't be imported from the share sheet.
     Your link has been copied — open Braise and paste it to import."
  → after 2.5s: open braise:// deep link to bring app to foreground
  → user pastes URL into AddModal → normal URL import flow handles it
```

This is intentionally a graceful degradation: YouTube via link works well (the app fetches the page HTML device-side, bypassing bot detection), and the clipboard hand-off preserves the URL without losing it.

## UX: Auto-save and review (amendment 2026-08-04)

Social video extraction auto-saves the recipe and navigates to `RecipeDetailsScreen` in view mode — the same as all other import paths. The earlier plan to open in edit mode (requiring explicit user save) was reversed to match the uniform behavior across import methods.

The view screen includes:
- Source attribution: "Imported from [Platform] · [tappable source URL]"
- Low-confidence banner when the edge function returns `lowConfidence: true`: "Some details may be missing — check before saving"

The `lowConfidence` flag is set by the edge function when the caption text is short, missing key recipe fields, or the LLM response includes hedging language. This is a signal to the user, not a hard block.

If the edge function returns `NEEDS_IMAGE_IMPORT` (caption contains a photo of a recipe rather than text), surface a user-facing message directing them to use the photo import method instead.

## In-app TikTok polling (amendment 2026-08-04)

When a TikTok URL is pasted into the in-app AddModal (rather than shared via the share extension), `AppState`-based polling cannot complete the import: the user never leaves the app, so the `active` transition never fires.

**Decision:** `AddModal.handleUrlImport` includes a direct polling loop for the TikTok path:

```
POST process-social-video → receives job_id
  → writes job_id to App Group UserDefaults (pendingSocialJobId)
  → polls video_import_jobs every 3s for up to 60s
      → if ready_for_review: clears key, auto-saves, navigates to RecipeDetailsScreen
      → if failed: clears key, shows error alert
  → on timeout: leaves key stored (AppState handler will pick it up on next foreground)
               shows gentle "taking a moment" message, closes modal
```

The `pendingSocialJobId` key therefore serves two purposes: in-app polling uses it as state, and AppState polling uses it as a resumption handle if the user backgrounds the app before the job completes.

## Subscription gate

Social video import is a Pro feature. The share extension reads an `isPro` boolean from App Group UserDefaults (`group.com.braise.recipe`) before processing. If false or absent, it dismisses immediately and opens a paywall deep link.

The main app is responsible for writing `isPro` to the App Group on every auth and subscription state change (in `storeSupabaseCredentials` and in the RevenueCat `customerInfoUpdated` listener). This ensures the extension always has a fresh value without needing a network call of its own.

## Consequences

- A new persistent server is required (Fly.io/Railway), adding infrastructure to maintain.
- Recipe import from social video is inherently async; the extension UX shows "processing" rather than immediate confirmation.
- Social video import auto-saves on completion (same as all other import paths). The recipe appears directly in the list without a manual save step.
- If a creator does not put the recipe in the caption, import will fail gracefully. Transcription (Option 2) remains available as a future upgrade path.
- Instagram captions are not publicly accessible without authentication; Instagram support may be limited to caption links only.
