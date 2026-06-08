import '@supabase/functions-js/edge-runtime.d.ts';
import {
  cleanIngredients,
  splitNumberedInstructions,
} from '../_shared/recipeUtils.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS_HEADERS});
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({error: 'Method not allowed'}), {
      status: 405,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  let images: string[];
  try {
    const body = await req.json();
    images = body.images;
    console.log(
      'Received images count:',
      Array.isArray(images) ? images.length : typeof images,
    );
    if (!Array.isArray(images) || images.length === 0 || images.length > 3) {
      console.error('Invalid images field:', images);
      return new Response(
        JSON.stringify({
          error: 'images must be an array of 1–3 base64 strings',
        }),
        {
          status: 400,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }
    for (const img of images) {
      if (typeof img !== 'string' || !img) {
        console.error('Invalid image entry, type:', typeof img, 'empty:', !img);
        return new Response(
          JSON.stringify({
            error: 'Each image must be a non-empty base64 string',
          }),
          {
            status: 400,
            headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
          },
        );
      }
    }
    console.log(
      'Image sizes (chars):',
      images.map(img => img.length),
    );
  } catch (err) {
    console.error('Failed to parse request body:', err);
    return new Response(JSON.stringify({error: 'Invalid JSON body'}), {
      status: 400,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

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

  const systemPrompt = `You are a recipe extraction assistant. Given one or more photos of a recipe (from a cookbook, recipe card, or handwritten note), extract the recipe data and return ONLY a valid JSON object with these exact fields:

- "title": string (recipe title)
- "author": string (recipe author, empty string if not found)
- "categories": string (comma-separated categories, e.g. "dinner,italian")
- "ingredients": string (each ingredient on its own line, separated by \\n; preserve the original text exactly — do not add, remove, or duplicate parentheses)
- "instructions": string (each distinct step on its own line, separated by \\n; if the source has numbered steps split them into separate lines, never combine multiple steps into one)
- "total_time": string (numeric string of total time, e.g. "30", empty string if not found)
- "total_time_unit": string ("min" or "hr", empty string if not found)
- "servings": string (numeric string, e.g. "4", empty string if not found)
- "about": string (brief description of the recipe, empty string if not found)

If multiple images are provided, synthesize them into a single recipe.
Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

  const messageContent: object[] = images.map(base64 => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: base64,
    },
  }));
  messageContent.push({
    type: 'text',
    text: 'Extract the recipe from these photos.',
  });

  console.log(
    'Sending request to Claude with',
    messageContent.length,
    'content blocks',
  );
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
          messages: [{role: 'user', content: messageContent}],
        }),
      },
    );

    console.log('Claude response status:', claudeResponse.status);
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
    console.log('Claude response content length:', content?.length ?? 0);

    if (!content) {
      return new Response(
        JSON.stringify({error: 'No response from extraction service'}),
        {
          status: 502,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }

    let jsonString = content.trim();
    jsonString = jsonString
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '');

    console.log('Cleaned JSON string:', jsonString);
    let recipe;
    try {
      recipe = JSON.parse(jsonString);
      console.log('Parsed recipe title:', recipe.title);
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

    const result = {
      title: recipe.title || '',
      author: recipe.author || '',
      original_url: '',
      host_url: '',
      host_name: '',
      categories: recipe.categories || '',
      image: '',
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
