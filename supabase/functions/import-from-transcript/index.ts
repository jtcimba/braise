import '@supabase/functions-js/edge-runtime.d.ts';
import {
  callClaudeApi,
  assembleRecipeResult,
  extractJsonLd,
  formatRecipeFromJsonLd,
  logImportAttempt,
  getUserIdFromJwt,
  RecipeResult,
} from '../_shared/recipeUtils.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SOCIAL_DOMAINS = [
  'tiktok.com',
  'vm.tiktok.com',
  'instagram.com',
  'youtube.com',
  'youtu.be',
];

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const CAPTION_SYSTEM_PROMPT = `You are a recipe extraction assistant. Given the text of a social media video caption, extract a recipe if one is present. Return ONLY a valid JSON object with these exact fields:

- "title": string (recipe title, or derive from context, empty string if not found)
- "author": string (empty string)
- "categories": string (comma-separated categories, e.g. "dinner,italian", empty string if not found)
- "image": string (empty string — no image available from caption)
- "ingredients": string (each ingredient on its own line, separated by \\n; preserve original text exactly)
- "instructions": string (each distinct step on its own line, separated by \\n)
- "total_time": string (numeric string, e.g. "30", empty string if not found)
- "total_time_unit": string ("min" or "hr", empty string if not found)
- "servings": string (numeric string, e.g. "4", empty string if not found)
- "about": string (brief description, empty string if not found)

If the caption does not contain a recipe, return empty strings for ingredients and instructions.
Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

const HTML_SYSTEM_PROMPT = `You are a recipe extraction assistant. Given raw HTML from a recipe webpage, extract the recipe data and return ONLY a valid JSON object with these exact fields:

- "title": string (recipe title)
- "author": string (recipe author, empty string if not found)
- "categories": string (comma-separated categories, e.g. "dinner,italian")
- "image": string (URL of the main recipe image, empty string if not found)
- "ingredients": string (each ingredient on its own line, separated by \\n; preserve the original text exactly — do not add, remove, or duplicate parentheses)
- "instructions": string (each distinct step on its own line, separated by \\n; if the source has numbered steps split them into separate lines, never combine multiple steps into one)
- "total_time": string (numeric string of total time, e.g. "30", empty string if not found)
- "total_time_unit": string ("min" or "hr", empty string if not found)
- "servings": string (numeric string, e.g. "4", empty string if not found)
- "about": string (brief description of the recipe, empty string if not found)

Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

function isSocialUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return SOCIAL_DOMAINS.some(
      d => parsed.hostname === d || parsed.hostname.endsWith('.' + d),
    );
  } catch {
    return false;
  }
}

function extractFirstNonSocialUrl(text: string): string | null {
  const urlPattern = /https?:\/\/[^\s)>\]"']+/g;
  const matches = text.match(urlPattern);
  if (!matches) {
    return null;
  }
  return matches.find(url => !isSocialUrl(url)) ?? null;
}

function recipeIsEmpty(recipe: RecipeResult): boolean {
  return !recipe.ingredients && !recipe.instructions;
}

function stripNonContentHTML(html: string): string {
  let cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
  const tagsToRemove = [
    'script',
    'style',
    'nav',
    'footer',
    'header',
    'svg',
    'noscript',
  ];
  for (const tag of tagsToRemove) {
    cleaned = cleaned.replace(
      new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi'),
      '',
    );
  }
  return cleaned.replace(/\s{2,}/g, ' ');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
}

type CaptionResult =
  | {ok: true; recipe: RecipeResult; lowConfidence: boolean}
  | {ok: false; status: number; error: string};

async function extractFromCaption(
  caption: string,
  title: string,
  sourceUrl: string,
  apiKey: string,
): Promise<CaptionResult> {
  if (!caption || caption.length < 20) {
    return {
      ok: false,
      status: 422,
      error: 'Caption too short to extract a recipe',
    };
  }

  const content = title
    ? `Video title: ${title}\n\nCaption:\n${caption}`
    : caption;

  const claudeResult = await callClaudeApi(
    apiKey,
    CAPTION_SYSTEM_PROMPT,
    content,
  );
  if (!claudeResult.ok) {
    return {ok: false, status: claudeResult.status, error: claudeResult.error};
  }

  const recipe = assembleRecipeResult(
    claudeResult.data,
    sourceUrl,
    'caption_text',
  );
  const lowConfidence = caption.length < 100 || recipeIsEmpty(recipe);

  return {ok: true, recipe, lowConfidence};
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS_HEADERS});
  }

  if (req.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({error: 'Unauthorized'}, 401);
  }

  let caption: string;
  let title: string;
  let sourceUrl: string;
  let platform: string;

  try {
    const body = await req.json();
    caption = typeof body.caption === 'string' ? body.caption : '';
    title = typeof body.title === 'string' ? body.title : '';
    sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl : '';
    platform = typeof body.platform === 'string' ? body.platform : 'tiktok';
  } catch {
    return jsonResponse({error: 'Invalid JSON body'}, 400);
  }

  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({error: 'ANTHROPIC_API_KEY not configured'}, 503);
  }

  const startTime = Date.now();
  const userId = getUserIdFromJwt(authHeader);
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const captionUrl = extractFirstNonSocialUrl(caption);

  if (captionUrl) {
    let html: string;
    try {
      const pageResponse = await fetch(captionUrl, {
        headers: {'User-Agent': USER_AGENT},
        signal: AbortSignal.timeout(15_000),
      });
      if (!pageResponse.ok) {
        throw new Error(`HTTP ${pageResponse.status}`);
      }
      html = await pageResponse.text();
    } catch {
      const result = await extractFromCaption(
        caption,
        title,
        sourceUrl,
        ANTHROPIC_API_KEY,
      );
      await logImportAttempt({
        supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SERVICE_ROLE_KEY,
        userId,
        platform,
        extractionMethod: 'caption_text',
        success: result.ok,
        latencyMs: Date.now() - startTime,
        error: result.ok ? null : result.error,
      });
      if (!result.ok) {
        return jsonResponse({error: result.error}, result.status);
      }
      return jsonResponse({
        recipe: result.recipe,
        lowConfidence: result.lowConfidence,
      });
    }

    const jsonld = extractJsonLd(html);
    if (jsonld) {
      const recipe = formatRecipeFromJsonLd(jsonld, captionUrl);
      if (recipe) {
        await logImportAttempt({
          supabaseUrl: SUPABASE_URL,
          serviceRoleKey: SERVICE_ROLE_KEY,
          userId,
          platform,
          extractionMethod: 'caption_url',
          success: true,
          latencyMs: Date.now() - startTime,
        });
        return jsonResponse({
          recipe: {...recipe, extractionMethod: 'caption_url' as const},
          lowConfidence: false,
        });
      }
    }

    const strippedHTML = stripNonContentHTML(html).slice(0, 100_000);
    const claudeResult = await callClaudeApi(
      ANTHROPIC_API_KEY,
      HTML_SYSTEM_PROMPT,
      `Extract the recipe from this HTML:\n\n${strippedHTML}`,
    );
    if (!claudeResult.ok) {
      await logImportAttempt({
        supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SERVICE_ROLE_KEY,
        userId,
        platform,
        extractionMethod: 'caption_url',
        success: false,
        latencyMs: Date.now() - startTime,
        error: claudeResult.error,
      });
      return jsonResponse({error: claudeResult.error}, claudeResult.status);
    }
    const recipe = assembleRecipeResult(
      claudeResult.data,
      captionUrl,
      'caption_url',
    );
    await logImportAttempt({
      supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SERVICE_ROLE_KEY,
      userId,
      platform,
      extractionMethod: 'caption_url',
      success: true,
      latencyMs: Date.now() - startTime,
    });
    return jsonResponse({recipe, lowConfidence: recipeIsEmpty(recipe)});
  }

  const result = await extractFromCaption(
    caption,
    title,
    sourceUrl,
    ANTHROPIC_API_KEY,
  );
  await logImportAttempt({
    supabaseUrl: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    userId,
    platform,
    extractionMethod: 'caption_text',
    success: result.ok,
    latencyMs: Date.now() - startTime,
    error: result.ok ? null : result.error,
  });
  if (!result.ok) {
    return jsonResponse({error: result.error}, result.status);
  }
  return jsonResponse({
    recipe: result.recipe,
    lowConfidence: result.lowConfidence,
  });
});
