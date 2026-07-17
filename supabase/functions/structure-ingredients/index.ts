import '@supabase/functions-js/edge-runtime.d.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {structureIngredients} from '../_shared/recipeUtils.ts';

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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), {
      status: 401,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
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

  // Verify caller's JWT
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
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

  let recipe_id: string;
  let ingredient_lines: string[];
  try {
    const body = await req.json();
    const rawId = body.recipe_id;
    ingredient_lines = body.ingredient_lines;
    if (
      (typeof rawId !== 'string' && typeof rawId !== 'number') ||
      !rawId ||
      !Array.isArray(ingredient_lines)
    ) {
      throw new Error('invalid body');
    }
    recipe_id = String(rawId);
  } catch {
    return new Response(JSON.stringify({error: 'Invalid request body'}), {
      status: 400,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {autoRefreshToken: false, persistSession: false},
  });

  // Verify recipe ownership
  const {data: recipe} = await adminClient
    .from('recipes')
    .select('user_id')
    .eq('id', recipe_id)
    .single();

  if (!recipe || recipe.user_id !== user.id) {
    return new Response(JSON.stringify({error: 'Recipe not found'}), {
      status: 404,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const filteredLines = ingredient_lines.filter((l: string) => l.trim());

  if (filteredLines.length === 0) {
    await adminClient
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipe_id);
    return new Response(JSON.stringify({ok: true, ingredients: []}), {
      status: 200,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const result = await structureIngredients(anthropicApiKey, filteredLines);

  // Log every call for QA review
  await adminClient.from('structuring_logs').insert({
    recipe_id,
    input_lines: filteredLines,
    output_json: result.ok ? result.data : null,
    error: result.ok ? null : result.error,
  });

  if (!result.ok) {
    console.error('Structuring failed for recipe', recipe_id, result.error);
    return new Response(JSON.stringify({error: result.error}), {
      status: 502,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const rows = result.data.map((item, i) => ({
    recipe_id,
    name: item.name,
    base_name: item.base_name,
    amount: item.amount ?? null,
    unit: item.unit ?? null,
    sort_order: i,
  }));

  // Atomic replace: only delete after structuring succeeds
  const {error: deleteError} = await adminClient
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', recipe_id);

  if (deleteError) {
    console.error('Failed to delete existing rows:', deleteError);
    return new Response(
      JSON.stringify({error: 'Failed to update ingredients'}),
      {
        status: 500,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  const {data: inserted, error: insertError} = await adminClient
    .from('recipe_ingredients')
    .insert(rows)
    .select();

  if (insertError) {
    console.error('Failed to insert ingredient rows:', insertError);
    return new Response(JSON.stringify({error: 'Failed to save ingredients'}), {
      status: 500,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  return new Response(JSON.stringify({ok: true, ingredients: inserted}), {
    status: 200,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
});
