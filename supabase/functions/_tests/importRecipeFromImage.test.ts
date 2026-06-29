// Tests for import-recipe-from-image Edge Function.
//
// Structural/error tests run with no setup.
// The content test (happy path) requires a fixture:
//   Add any JPEG of a recipe card to:
//   supabase/functions/_tests/fixtures/recipe-card.jpg
//
// Run: npm run test:functions:image

import {assertEquals, assert} from '@std/assert';

const FUNCTION_URL =
  'http://127.0.0.1:54321/functions/v1/import-recipe-from-image';

// Valid non-empty base64 string — not a real image, used for structural tests.
const DUMMY_BASE64 = 'dGVzdA==';

async function loadFixture(): Promise<string | null> {
  try {
    const bytes = await Deno.readFile(
      new URL('./fixtures/recipe-from-book.jpeg', import.meta.url),
    );
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Structural / error cases — no recipe image needed
// ---------------------------------------------------------------------------

Deno.test('image - returns 405 for GET request', async () => {
  const res = await fetch(FUNCTION_URL, {method: 'GET'});
  assertEquals(res.status, 405);
});

Deno.test('image - returns 204 for CORS preflight', async () => {
  const res = await fetch(FUNCTION_URL, {method: 'OPTIONS'});
  assertEquals(res.status, 204);
  assert(
    res.headers.get('Access-Control-Allow-Origin') !== null,
    'CORS header should be present',
  );
});

Deno.test('image - returns 400 for missing images field', async () => {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 400);
});

Deno.test('image - returns 400 for empty images array', async () => {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({images: []}),
  });
  assertEquals(res.status, 400);
});

Deno.test('image - returns 400 for more than 3 images', async () => {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      images: [DUMMY_BASE64, DUMMY_BASE64, DUMMY_BASE64, DUMMY_BASE64],
    }),
  });
  assertEquals(res.status, 400);
});

Deno.test('image - returns 400 for empty string in images array', async () => {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({images: ['']}),
  });
  assertEquals(res.status, 400);
});

Deno.test('image - returns 400 for invalid JSON body', async () => {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: 'not valid json',
  });
  assertEquals(res.status, 400);
});

// ---------------------------------------------------------------------------
// Content test — requires fixtures/recipe-card.jpg
// Add any JPEG photo of a recipe card or cookbook page to that path.
// ---------------------------------------------------------------------------

Deno.test('image - extracts recipe from recipe card photo', async () => {
  const base64 = await loadFixture();
  if (!base64) {
    console.warn(
      'Skipping content test: add a recipe card JPEG to supabase/functions/_tests/fixtures/recipe-card.jpg',
    );
    return;
  }

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({images: [base64]}),
  });

  assertEquals(res.status, 200);
  const recipe = await res.json();

  assert(
    typeof recipe.title === 'string' && recipe.title.length > 0,
    `expected non-empty title, got: "${recipe.title}"`,
  );
  assert(
    typeof recipe.ingredients === 'string' && recipe.ingredients.length > 0,
    'expected non-empty ingredients',
  );
  assert(
    typeof recipe.instructions === 'string' && recipe.instructions.length > 0,
    'expected non-empty instructions',
  );
  assert(
    recipe.ingredients.includes('\n'),
    `ingredients should have multiple lines, got: "${recipe.ingredients.slice(
      0,
      80,
    )}"`,
  );
  assert(
    recipe.instructions.includes('\n'),
    `instructions should have multiple lines, got: "${recipe.instructions.slice(
      0,
      80,
    )}"`,
  );
});
