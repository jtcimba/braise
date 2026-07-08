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
  const backfillSecret = Deno.env.get('BACKFILL_SECRET');
  if (
    !backfillSecret ||
    !authHeader ||
    authHeader !== `Bearer ${backfillSecret}`
  ) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), {
      status: 401,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {autoRefreshToken: false, persistSession: false},
    });

    const {data: structured, error: structuredError} = await adminClient
      .from('recipe_ingredients')
      .select('recipe_id');

    if (structuredError) {
      return new Response(
        JSON.stringify({
          error: 'fetch structured failed',
          detail: structuredError.message,
        }),
        {
          status: 500,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }

    const structuredIds = new Set(
      (structured || []).map((r: {recipe_id: number}) => r.recipe_id),
    );

    const {data: allRecipes, error: fetchError} = await adminClient
      .from('recipes')
      .select('id, ingredients');

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: 'fetch recipes failed',
          detail: fetchError.message,
        }),
        {
          status: 500,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }

    const recipes = (allRecipes || []).filter(
      (r: {id: number}) => !structuredIds.has(r.id),
    );

    const results = {
      total: recipes.length,
      succeeded: 0,
      failed: 0,
      failures: [] as {recipe_id: number; error: string}[],
    };

    for (const recipe of recipes) {
      if (!recipe.ingredients?.trim()) {
        results.succeeded++;
        continue;
      }

      const lines = (recipe.ingredients as string)
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        results.succeeded++;
        continue;
      }

      const structureResult = await structureIngredients(
        anthropicApiKey,
        lines,
      );

      await adminClient.from('structuring_logs').insert({
        recipe_id: recipe.id,
        input_lines: lines,
        output_json: structureResult.ok ? structureResult.data : null,
        error: structureResult.ok ? null : structureResult.error,
      });

      if (!structureResult.ok) {
        results.failed++;
        results.failures.push({
          recipe_id: recipe.id,
          error: structureResult.error,
        });
        continue;
      }

      const rows = structureResult.data.map((item, i) => ({
        recipe_id: recipe.id,
        display_text: item.display_text,
        base_name: item.base_name,
        prep: item.prep ?? null,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        sort_order: i,
      }));

      const {error: insertError} = await adminClient
        .from('recipe_ingredients')
        .insert(rows);

      if (insertError) {
        results.failed++;
        results.failures.push({
          recipe_id: recipe.id,
          error: insertError.message,
        });
      } else {
        results.succeeded++;
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Unhandled error:', message);
    return new Response(
      JSON.stringify({error: 'Unhandled error', detail: message}),
      {
        status: 500,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }
});
