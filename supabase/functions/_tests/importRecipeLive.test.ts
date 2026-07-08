// Live URL integration tests for import-recipe Edge Function.
//
// These tests hit real websites and require:
//   1. Local Supabase running:  npx supabase start
//   2. Functions served:        npm run serve:functions
//   3. Internet access
//   4. ANTHROPIC_API_KEY set   (for sites without JSON-LD)
//
// Run:  npm run test:functions:live
//
// URLs can be swapped for any equivalent site in the same category.

import {assertEquals, assert} from '@std/assert';

const FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/import-recipe';

async function importFromUrl(url: string): Promise<Response> {
  return fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({url}),
  });
}

function assertValidRecipe(recipe: Record<string, string>, site: string): void {
  assert(
    typeof recipe.title === 'string' && recipe.title.length > 0,
    `[${site}] expected non-empty title, got: "${recipe.title}"`,
  );
  assert(
    typeof recipe.ingredients === 'string' && recipe.ingredients.length > 0,
    `[${site}] expected non-empty ingredients`,
  );
  assert(
    typeof recipe.instructions === 'string' && recipe.instructions.length > 0,
    `[${site}] expected non-empty instructions`,
  );
  assert(
    recipe.ingredients.includes('\n'),
    `[${site}] ingredients should have multiple lines (got: "${recipe.ingredients.slice(
      0,
      80,
    )}")`,
  );
  assert(
    recipe.instructions.includes('\n'),
    `[${site}] instructions should have multiple lines (got: "${recipe.instructions.slice(
      0,
      80,
    )}")`,
  );
}

// ---------------------------------------------------------------------------
// Recipe blogs — JSON-LD fast path (no AI call)
// ---------------------------------------------------------------------------

Deno.test('live - allrecipes.com (JSON-LD)', async () => {
  const res = await importFromUrl(
    'https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/',
  );
  assertEquals(res.status, 200);
  const recipe = await res.json();
  assertValidRecipe(recipe, 'allrecipes');
  assertEquals(recipe.host_name, 'www.allrecipes.com');
  assert(
    recipe.title.toLowerCase().includes('chocolate chip'),
    `unexpected title: "${recipe.title}"`,
  );
});

Deno.test('live - simplyrecipes.com (JSON-LD)', async () => {
  const res = await importFromUrl(
    'https://www.simplyrecipes.com/recipes/homemade_pizza/',
  );
  assertEquals(res.status, 200);
  const recipe = await res.json();
  assertValidRecipe(recipe, 'simplyrecipes');
  assertEquals(recipe.host_name, 'www.simplyrecipes.com');
});

// ---------------------------------------------------------------------------
// Substack — AI fallback path (Substack posts have no recipe JSON-LD)
// Update the URL to any free Substack recipe post if this one becomes unavailable.
// ---------------------------------------------------------------------------

Deno.test('live - substack recipe post (AI fallback)', async () => {
  const res = await importFromUrl(
    'https://shredhappens.substack.com/p/chipotle-lime-chicken-pasta-salad',
  );
  if (res.status === 503) {
    console.log(
      'Skipping AI fallback test: ANTHROPIC_API_KEY not configured in edge runtime',
    );
    return;
  }
  assertEquals(res.status, 200);
  const recipe = await res.json();
  assertValidRecipe(recipe, 'substack/shredhappens');
});

// ---------------------------------------------------------------------------
// Paywalled page — NYT Cooking
// The server fetches whatever HTML the paywall serves back.
// Expected: no 500; response is well-formed JSON with a title or error field.
// ---------------------------------------------------------------------------

Deno.test('live - paywalled page (NYT Cooking) does not crash', async () => {
  const res = await importFromUrl(
    'https://cooking.nytimes.com/recipes/1027093-tomato-basil-chicken-breasts',
  );
  assert(res.status !== 500, `unexpected server error: ${res.status}`);
  const body = await res.json();
  assert(
    'title' in body || 'error' in body,
    'response should have a title or error field',
  );
});

// ---------------------------------------------------------------------------
// Non-recipe page
// Expected: no crash; response is well-formed JSON.
// The AI may return empty fields or attempt to extract something — either is acceptable.
// ---------------------------------------------------------------------------

Deno.test('live - non-recipe page does not crash', async () => {
  const res = await importFromUrl(
    'https://en.wikipedia.org/wiki/Python_(programming_language)',
  );
  assert(res.status !== 500, `unexpected server error: ${res.status}`);
  if (res.status === 200) {
    const recipe = await res.json();
    assert(typeof recipe.title === 'string', 'title should be a string');
    assert(
      typeof recipe.ingredients === 'string',
      'ingredients should be a string',
    );
    assert(
      typeof recipe.instructions === 'string',
      'instructions should be a string',
    );
  }
});

// ---------------------------------------------------------------------------
// Direct image URL
// The server fetches binary content; JSON-LD extraction finds nothing.
// AI receives non-HTML data and may return empty fields or an error.
// Expected: no 500.
// ---------------------------------------------------------------------------

Deno.test('live - image URL does not crash', async () => {
  const res = await importFromUrl(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Mac_hamburger.jpg/800px-Big_Mac_hamburger.jpg',
  );
  assert(res.status !== 500, `unexpected server error: ${res.status}`);
});
