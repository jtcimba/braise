import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are a recipe assistant. Given a list of ingredients with their amounts and units, and a set of recipe directions, rewrite the directions so that each step includes the specific quantity and unit for each ingredient it uses.

Rules:
- Only insert quantities for ingredients that appear in that step — do not move ingredients between steps
- Keep the directions natural and readable; do not mechanically append quantities
- Wrap each ingredient reference (including its quantity and unit) in **double asterisks** so it can be rendered bold — e.g. "Add **2 cups flour** and **1 tsp salt**"
- Preserve the original step count and order exactly — one step per line
- Do not add step numbers, bullets, or any prefix — output only the step text, one per line
- If a step mentions an ingredient that has no quantity (e.g. "salt to taste"), still wrap it: "Add **salt to taste**"
- Return only the enhanced directions with each step on its own line, no extra commentary`;

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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), {
      status: 401,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    return new Response(
      JSON.stringify({error: 'ANTHROPIC_API_KEY not configured'}),
      {
        status: 500,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: {headers: {Authorization: authHeader}},
    auth: {autoRefreshToken: false, persistSession: false},
  });
  const {
    data: {user},
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), {
      status: 401,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  let body: {
    recipeId?: string;
    instructions?: string;
    ingredients?: {name: string; amount: string | null; unit: string | null}[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({error: 'Invalid request body'}), {
      status: 400,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const {recipeId, instructions, ingredients} = body;
  if (!recipeId || !instructions?.trim() || !ingredients?.length) {
    return new Response(
      JSON.stringify({
        error: 'recipeId, instructions and ingredients are required',
      }),
      {
        status: 400,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  const ingredientList = ingredients
    .map(i => {
      const qty = [i.amount, i.unit].filter(Boolean).join(' ');
      return qty ? `${qty} ${i.name}` : i.name;
    })
    .join('\n');

  const userMessage = `Ingredients:\n${ingredientList}\n\nDirections:\n${instructions}`;

  let claudeResponse: Response;
  try {
    claudeResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{role: 'user', content: userMessage}],
      }),
    });
  } catch {
    return new Response(
      JSON.stringify({error: 'Enhancement service unavailable'}),
      {
        status: 502,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  if (!claudeResponse.ok) {
    return new Response(JSON.stringify({error: 'Enhancement service error'}), {
      status: 502,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const claudeData = await claudeResponse.json();
  const enhanced: string | undefined = claudeData.content?.[0]?.text;
  if (!enhanced) {
    return new Response(
      JSON.stringify({error: 'No response from enhancement service'}),
      {
        status: 502,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  const trimmed = enhanced.trim();

  await userClient
    .from('recipes')
    .update({enhanced_instructions: trimmed})
    .eq('id', recipeId);

  return new Response(JSON.stringify({instructions: trimmed}), {
    status: 200,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
});
