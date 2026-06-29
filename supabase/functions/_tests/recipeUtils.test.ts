import {assertEquals, assertNotEquals, assert} from '@std/assert';
import {
  extractJsonLd,
  formatRecipeFromJsonLd,
  cleanIngredients,
  splitNumberedInstructions,
} from '../_shared/recipeUtils.ts';

// ---------------------------------------------------------------------------
// extractJsonLd
// ---------------------------------------------------------------------------

Deno.test('extractJsonLd - finds Recipe from direct @type', () => {
  const html = `<html><body>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Recipe","name":"Cookies"}
    </script></body></html>`;
  const result = extractJsonLd(html);
  assertNotEquals(result, null);
  assert(result!.includes('"Recipe"'));
});

Deno.test('extractJsonLd - finds Recipe from @type array', () => {
  const html = `<script type="application/ld+json">
    {"@type":["Recipe","Thing"],"name":"Cake"}
    </script>`;
  const result = extractJsonLd(html);
  assertNotEquals(result, null);
});

Deno.test('extractJsonLd - finds Recipe inside @graph', () => {
  const html = `<script type="application/ld+json">
    {"@graph":[{"@type":"WebPage"},{"@type":"Recipe","name":"Pasta"}]}
    </script>`;
  const result = extractJsonLd(html);
  assertNotEquals(result, null);
  assert(result!.includes('"Recipe"'));
});

Deno.test('extractJsonLd - finds Recipe in JSON-LD array', () => {
  const html = `<script type="application/ld+json">
    [{"@type":"BreadcrumbList"},{"@type":"Recipe","name":"Cake"}]
    </script>`;
  const result = extractJsonLd(html);
  assertNotEquals(result, null);
});

Deno.test('extractJsonLd - skips non-Recipe scripts', () => {
  const html = `<script type="application/ld+json">
    {"@type":"WebPage","name":"Home"}
    </script>`;
  assertEquals(extractJsonLd(html), null);
});

Deno.test('extractJsonLd - returns null for plain HTML', () => {
  assertEquals(
    extractJsonLd('<html><body><p>No recipe</p></body></html>'),
    null,
  );
});

Deno.test(
  'extractJsonLd - returns first Recipe when multiple scripts present',
  () => {
    const html = `
    <script type="application/ld+json">{"@type":"WebPage"}</script>
    <script type="application/ld+json">{"@type":"Recipe","name":"First"}</script>
    <script type="application/ld+json">{"@type":"Recipe","name":"Second"}</script>`;
    const result = extractJsonLd(html);
    assertNotEquals(result, null);
    assert(result!.includes('"First"'));
  },
);

// ---------------------------------------------------------------------------
// formatRecipeFromJsonLd - full recipe parsing
// ---------------------------------------------------------------------------

const FULL_RECIPE_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Classic Chocolate Chip Cookies',
  author: {'@type': 'Person', name: 'Jane Smith'},
  description: 'The best cookies ever.',
  image: 'https://example.com/cookies.jpg',
  recipeIngredient: ['2 cups flour', '1 cup butter', '2 cups chocolate chips'],
  recipeInstructions: [
    {'@type': 'HowToStep', text: 'Preheat oven to 375°F.'},
    {'@type': 'HowToStep', text: 'Mix butter and sugar.'},
    {'@type': 'HowToStep', text: 'Bake for 12 minutes.'},
  ],
  totalTime: 'PT30M',
  recipeYield: '24 cookies',
  recipeCategory: 'Dessert',
  recipeCuisine: 'American',
});

Deno.test('formatRecipeFromJsonLd - parses all fields correctly', () => {
  const result = formatRecipeFromJsonLd(
    FULL_RECIPE_JSONLD,
    'https://example.com/cookies',
  );
  assertNotEquals(result, null);
  assertEquals(result!.title, 'Classic Chocolate Chip Cookies');
  assertEquals(result!.author, 'Jane Smith');
  assertEquals(result!.about, 'The best cookies ever.');
  assertEquals(result!.image, 'https://example.com/cookies.jpg');
  assertEquals(result!.original_url, 'https://example.com/cookies');
  assertEquals(result!.host_url, 'https://example.com');
  assertEquals(result!.host_name, 'example.com');
  assertEquals(result!.total_time, 30);
  assertEquals(result!.total_time_unit, 'min');
  assertEquals(result!.servings, 24);
});

Deno.test('formatRecipeFromJsonLd - ingredients joined by newlines', () => {
  const result = formatRecipeFromJsonLd(FULL_RECIPE_JSONLD, '');
  const lines = result!.ingredients.split('\n');
  assertEquals(lines.length, 3);
  assertEquals(lines[0], '2 cups flour');
  assertEquals(lines[1], '1 cup butter');
});

Deno.test(
  'formatRecipeFromJsonLd - HowToStep instructions joined by newlines',
  () => {
    const result = formatRecipeFromJsonLd(FULL_RECIPE_JSONLD, '');
    const steps = result!.instructions.split('\n');
    assertEquals(steps.length, 3);
    assertEquals(steps[0], 'Preheat oven to 375°F.');
    assertEquals(steps[2], 'Bake for 12 minutes.');
  },
);

Deno.test('formatRecipeFromJsonLd - handles HowToSection nested steps', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    recipeInstructions: [
      {
        '@type': 'HowToSection',
        name: 'Prep',
        itemListElement: [
          {'@type': 'HowToStep', text: 'Chop vegetables.'},
          {'@type': 'HowToStep', text: 'Season with salt.'},
        ],
      },
      {'@type': 'HowToStep', text: 'Cook for 20 minutes.'},
    ],
  });
  const result = formatRecipeFromJsonLd(jsonld, '');
  const steps = result!.instructions.split('\n');
  assertEquals(steps.length, 3);
  assertEquals(steps[0], 'Chop vegetables.');
  assertEquals(steps[1], 'Season with salt.');
  assertEquals(steps[2], 'Cook for 20 minutes.');
});

Deno.test('formatRecipeFromJsonLd - parses ISO8601 duration PT1H30M', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    totalTime: 'PT1H30M',
  });
  const result = formatRecipeFromJsonLd(jsonld, '');
  assertEquals(result!.total_time, 90);
  assertEquals(result!.total_time_unit, 'min');
});

Deno.test('formatRecipeFromJsonLd - parses ISO8601 duration PT45M', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    totalTime: 'PT45M',
  });
  const result = formatRecipeFromJsonLd(jsonld, '');
  assertEquals(result!.total_time, 45);
  assertEquals(result!.total_time_unit, 'min');
});

Deno.test(
  'formatRecipeFromJsonLd - sums prepTime and cookTime when no totalTime',
  () => {
    const jsonld = JSON.stringify({
      '@type': 'Recipe',
      name: 'Test',
      prepTime: 'PT15M',
      cookTime: 'PT30M',
    });
    const result = formatRecipeFromJsonLd(jsonld, '');
    assertEquals(result!.total_time, 45);
    assertEquals(result!.total_time_unit, 'min');
  },
);

Deno.test('formatRecipeFromJsonLd - parses recipeYield as number', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    recipeYield: 6,
  });
  assertEquals(formatRecipeFromJsonLd(jsonld, '')!.servings, 6);
});

Deno.test(
  'formatRecipeFromJsonLd - parses recipeYield as string with text',
  () => {
    const jsonld = JSON.stringify({
      '@type': 'Recipe',
      name: 'Test',
      recipeYield: '12 cookies',
    });
    assertEquals(formatRecipeFromJsonLd(jsonld, '')!.servings, 12);
  },
);

Deno.test('formatRecipeFromJsonLd - parses recipeYield as array', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    recipeYield: ['8 servings', '8'],
  });
  assertEquals(formatRecipeFromJsonLd(jsonld, '')!.servings, 8);
});

Deno.test('formatRecipeFromJsonLd - finds Recipe inside @graph', () => {
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'WebPage', name: 'Test'},
      {'@type': 'Recipe', name: 'Spaghetti Carbonara', recipeYield: '4'},
    ],
  });
  const result = formatRecipeFromJsonLd(jsonld, '');
  assertEquals(result!.title, 'Spaghetti Carbonara');
  assertEquals(result!.servings, 4);
});

Deno.test('formatRecipeFromJsonLd - handles author as string', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    author: 'Cookbook Author',
  });
  assertEquals(formatRecipeFromJsonLd(jsonld, '')!.author, 'Cookbook Author');
});

Deno.test('formatRecipeFromJsonLd - handles image as object with url', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    image: {'@type': 'ImageObject', url: 'https://example.com/img.jpg'},
  });
  assertEquals(
    formatRecipeFromJsonLd(jsonld, '')!.image,
    'https://example.com/img.jpg',
  );
});

Deno.test('formatRecipeFromJsonLd - handles image as array of strings', () => {
  const jsonld = JSON.stringify({
    '@type': 'Recipe',
    name: 'Test',
    image: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
  });
  assertEquals(
    formatRecipeFromJsonLd(jsonld, '')!.image,
    'https://example.com/a.jpg',
  );
});

Deno.test(
  'formatRecipeFromJsonLd - extracts categories from recipeCategory and recipeCuisine',
  () => {
    const jsonld = JSON.stringify({
      '@type': 'Recipe',
      name: 'Test',
      recipeCategory: 'Dessert',
      recipeCuisine: 'American',
    });
    const cats = formatRecipeFromJsonLd(jsonld, '')!.categories.split(',');
    assert(cats.includes('dessert'));
    assert(cats.includes('american'));
  },
);

Deno.test('formatRecipeFromJsonLd - returns null for invalid JSON', () => {
  assertEquals(formatRecipeFromJsonLd('not valid json', ''), null);
});

Deno.test(
  'formatRecipeFromJsonLd - returns null when no Recipe type found',
  () => {
    const jsonld = JSON.stringify({'@type': 'WebPage', name: 'Test'});
    assertEquals(formatRecipeFromJsonLd(jsonld, ''), null);
  },
);

Deno.test(
  'formatRecipeFromJsonLd - handles empty source URL gracefully',
  () => {
    const result = formatRecipeFromJsonLd(
      JSON.stringify({'@type': 'Recipe', name: 'Test'}),
      '',
    );
    assertNotEquals(result, null);
    assertEquals(result!.original_url, '');
    assertEquals(result!.host_url, '');
    assertEquals(result!.host_name, '');
  },
);

// ---------------------------------------------------------------------------
// cleanIngredients
// ---------------------------------------------------------------------------

Deno.test('cleanIngredients - removes double opening parens', () => {
  assertEquals(cleanIngredients('((kosher)) salt'), '(kosher) salt');
});

Deno.test('cleanIngredients - fixes (,text) duplication pattern', () => {
  assertEquals(cleanIngredients('salt (, kosher)'), 'salt, kosher');
});

Deno.test('cleanIngredients - leaves normal parens untouched', () => {
  assertEquals(cleanIngredients('1 cup (240ml) milk'), '1 cup (240ml) milk');
});

Deno.test('cleanIngredients - handles nested parens in (, ...) pattern', () => {
  assertEquals(
    cleanIngredients('butter (, unsalted (room temp))'),
    'butter, unsalted (room temp)',
  );
});

// ---------------------------------------------------------------------------
// splitNumberedInstructions
// ---------------------------------------------------------------------------

Deno.test('splitNumberedInstructions - splits inline numbered steps', () => {
  const input = '1. Preheat oven. 2. Mix ingredients. 3. Bake for 20 minutes.';
  const lines = splitNumberedInstructions(input).split('\n');
  assertEquals(lines.length, 3);
  assertEquals(lines[0], 'Preheat oven.');
  assertEquals(lines[1], 'Mix ingredients.');
  assertEquals(lines[2], 'Bake for 20 minutes.');
});

Deno.test(
  'splitNumberedInstructions - passes through already-newlined steps',
  () => {
    const input = 'Preheat oven.\nMix ingredients.\nBake.';
    assertEquals(splitNumberedInstructions(input), input);
  },
);

Deno.test(
  'splitNumberedInstructions - passes through text not starting with 1.',
  () => {
    const input = 'Mix all ingredients. Add salt to taste. Serve immediately.';
    assertEquals(splitNumberedInstructions(input), input);
  },
);

Deno.test(
  'splitNumberedInstructions - strips leading step numbers from split parts',
  () => {
    const input = '1. First step. 2. Second step.';
    const lines = splitNumberedInstructions(input).split('\n');
    assertEquals(lines[0], 'First step.');
    assertEquals(lines[1], 'Second step.');
  },
);
