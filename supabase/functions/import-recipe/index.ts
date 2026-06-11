import '@supabase/functions-js/edge-runtime.d.ts';
import {
  cleanIngredients,
  splitNumberedInstructions,
  extractJsonLd,
  formatRecipeFromJsonLd,
} from '../_shared/recipeUtils.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function stripNonContentHTML(html: string): string {
  let cleaned = html;

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove non-content tags and their contents
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
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  // Collapse whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned;
}

function assertPublicUrl(urlString: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed');
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (host === 'localhost' || host === '::1' || host === '0.0.0.0') {
    throw new Error('Private URLs are not allowed');
  }

  if (host.startsWith('fe80')) {
    throw new Error('Private URLs are not allowed');
  }

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 127 ||
      a === 10 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    ) {
      throw new Error('Private URLs are not allowed');
    }
  }
}

async function fetchHtmlFromUrl(url: string): Promise<string> {
  assertPublicUrl(url);
  const response = await fetch(url, {
    headers: {'User-Agent': USER_AGENT},
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }
  return response.text();
}

Deno.serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS_HEADERS});
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({error: 'Method not allowed'}), {
      status: 405,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  let html: string;
  let sourceUrl = '';

  try {
    const body = await req.json();

    if (body.html && typeof body.html === 'string') {
      html = body.html;
      if (body.url && typeof body.url === 'string') {
        sourceUrl = body.url;
      }
    } else if (body.url && typeof body.url === 'string') {
      // Server-side fetch — kept for backwards compatibility with share extension fallback
      sourceUrl = body.url;
      try {
        html = await fetchHtmlFromUrl(sourceUrl);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to fetch URL:', message);
        return new Response(
          JSON.stringify({error: `Failed to fetch recipe page: ${message}`}),
          {
            status: 422,
            headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
          },
        );
      }
    } else {
      return new Response(
        JSON.stringify({error: "Request body must include 'html' or 'url'"}),
        {
          status: 400,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }
  } catch {
    return new Response(JSON.stringify({error: 'Invalid JSON body'}), {
      status: 400,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  // Fast path: JSON-LD extraction (no AI call needed)
  const jsonld = extractJsonLd(html);
  if (jsonld) {
    const recipe = formatRecipeFromJsonLd(jsonld, sourceUrl);
    if (recipe) {
      return new Response(JSON.stringify(recipe), {
        status: 200,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      });
    }
  }

  // Fallback: Claude AI extraction
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({error: 'ANTHROPIC_API_KEY not configured'}),
      {
        status: 500,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  // Strip non-content HTML and truncate
  const strippedHTML = stripNonContentHTML(html);
  const truncatedHTML = strippedHTML.slice(0, 100_000);

  const systemPrompt = `You are a recipe extraction assistant. Given raw HTML from a recipe webpage, extract the recipe data and return ONLY a valid JSON object with these exact fields:

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

  try {
    const claudeResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Extract the recipe from this HTML:\n\n${truncatedHTML}`,
            },
          ],
        }),
      },
    );

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return new Response(JSON.stringify({error: 'Recipe extraction failed'}), {
        status: 502,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      });
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({error: 'No response from extraction service'}),
        {
          status: 502,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }

    // Strip potential code fences
    let jsonString = content.trim();
    jsonString = jsonString
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '');

    let recipe;
    try {
      recipe = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse Claude response as JSON:', jsonString);
      return new Response(
        JSON.stringify({error: 'Failed to parse extracted recipe'}),
        {
          status: 502,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }

    // Derive URL fields if a source URL was provided
    let hostUrl = '';
    let hostName = '';
    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        hostUrl = `${parsed.protocol}//${parsed.host}`;
        hostName = parsed.hostname;
      } catch {
        // invalid URL — leave blank
      }
    }

    const result = {
      title: recipe.title || '',
      author: recipe.author || '',
      original_url: sourceUrl,
      host_url: hostUrl,
      host_name: hostName,
      categories: recipe.categories || '',
      image: recipe.image || '',
      ingredients: cleanIngredients(recipe.ingredients || ''),
      instructions: splitNumberedInstructions(recipe.instructions || ''),
      total_time: recipe.total_time || '',
      total_time_unit: recipe.total_time_unit || '',
      servings: recipe.servings || '',
      about: recipe.about || '',
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({error: 'Internal server error'}), {
      status: 500,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }
});
