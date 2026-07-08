// Live tests for structureIngredients() in _shared/recipeUtils.ts.
//
// Requirements:
//   - supabase/.env must contain ANTHROPIC_API_KEY
//   - Internet access (hits the Claude API directly)
//
// Run:  npm run test:functions

import {assertEquals, assert} from '@std/assert';
import {structureIngredients} from '../_shared/recipeUtils.ts';

function loadApiKey(): string {
  const env = Deno.readTextFileSync(
    new URL('../../../supabase/.env', import.meta.url),
  );
  const match = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (!match) {
    throw new Error('ANTHROPIC_API_KEY not found in supabase/.env');
  }
  return match[1].trim();
}

const API_KEY = loadApiKey();

// ---------------------------------------------------------------------------
// Core behavior
// ---------------------------------------------------------------------------

Deno.test(
  'structureIngredients - returns same-length array as input',
  async () => {
    const lines = [
      '2 cups tomatoes, diced',
      '1 tsp red pepper flakes',
      '1 lb ground beef',
    ];
    const result = await structureIngredients(API_KEY, lines);
    assert(result.ok, `expected ok, got error: ${!result.ok && result.error}`);
    assertEquals(result.ok && result.data.length, lines.length);
  },
);

Deno.test('structureIngredients - preserves display_text exactly', async () => {
  const lines = ['3 cloves garlic, minced', '1/2 cup olive oil'];
  const result = await structureIngredients(API_KEY, lines);
  assert(result.ok);
  if (!result.ok) {
    return;
  }
  assertEquals(result.data[0].display_text, lines[0]);
  assertEquals(result.data[1].display_text, lines[1]);
});

Deno.test(
  'structureIngredients - strips prep from base_name (diced tomatoes)',
  async () => {
    const result = await structureIngredients(API_KEY, [
      '2 cups tomatoes, diced',
    ]);
    assert(result.ok);
    if (!result.ok) {
      return;
    }
    const item = result.data[0];
    assertEquals(item.base_name, 'tomatoes');
    assertEquals(item.prep, 'diced');
    assertEquals(item.quantity, '2');
    assertEquals(item.unit, 'cup');
  },
);

Deno.test(
  'structureIngredients - strips prep from base_name (garlic, minced)',
  async () => {
    const result = await structureIngredients(API_KEY, [
      '2 cloves garlic, minced',
    ]);
    assert(result.ok);
    if (!result.ok) {
      return;
    }
    const item = result.data[0];
    assertEquals(item.base_name, 'garlic');
    assertEquals(item.prep, 'minced');
  },
);

Deno.test(
  'structureIngredients - keeps packaging-form in base_name (ground beef)',
  async () => {
    const result = await structureIngredients(API_KEY, ['1 lb ground beef']);
    assert(result.ok);
    if (!result.ok) {
      return;
    }
    const item = result.data[0];
    assertEquals(item.base_name, 'ground beef');
    assertEquals(item.prep, null);
  },
);

Deno.test(
  'structureIngredients - keeps packaging-form in base_name (shredded parmesan)',
  async () => {
    const result = await structureIngredients(API_KEY, [
      '1 cup shredded parmesan',
    ]);
    assert(result.ok);
    if (!result.ok) {
      return;
    }
    const item = result.data[0];
    assertEquals(item.base_name, 'shredded parmesan');
    assertEquals(item.prep, null);
  },
);

Deno.test(
  'structureIngredients - multi-word ingredient with no quantity (red pepper flakes)',
  async () => {
    const result = await structureIngredients(API_KEY, [
      '1 tsp red pepper flakes',
    ]);
    assert(result.ok);
    if (!result.ok) {
      return;
    }
    const item = result.data[0];
    assertEquals(item.base_name, 'red pepper flakes');
    assertEquals(item.prep, null);
    assertEquals(item.quantity, '1');
  },
);

Deno.test(
  'structureIngredients - ingredient with no quantity or unit',
  async () => {
    const result = await structureIngredients(API_KEY, [
      'salt and pepper to taste',
    ]);
    assert(result.ok);

    if (!result.ok) {
      return;
    }
    const item = result.data[0];
    assert(item.base_name.length > 0, 'base_name should not be empty');
    assertEquals(item.quantity, null);
    assertEquals(item.unit, null);
  },
);

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

Deno.test(
  'structureIngredients - empty input returns empty array',
  async () => {
    const result = await structureIngredients(API_KEY, []);
    assert(result.ok);
    if (!result.ok) {
      return;
    }
    assertEquals(result.data.length, 0);
  },
);

Deno.test(
  'structureIngredients - handles a full recipe ingredient list',
  async () => {
    const lines = [
      '1 lb spaghetti',
      '4 oz pancetta, diced',
      '4 large eggs',
      '1 cup grated pecorino romano',
      '4 cloves garlic, minced',
      '2 tbsp olive oil',
      'salt and black pepper to taste',
    ];
    const result = await structureIngredients(API_KEY, lines);
    assert(result.ok, `expected ok, got error: ${!result.ok && result.error}`);
    if (!result.ok) {
      return;
    }
    assertEquals(result.data.length, lines.length);
    // Every item must have a non-empty base_name
    for (const item of result.data) {
      assert(
        typeof item.base_name === 'string' && item.base_name.length > 0,
        `empty base_name for: ${item.display_text}`,
      );
    }
  },
);
