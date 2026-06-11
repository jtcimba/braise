export function cleanIngredients(ingredients: string): string {
  return ingredients
    .replace(/\(,\s*((?:[^\n()]*|\([^\n()]*\))*)\)/g, ', $1')
    .replace(/\(\(/g, '(')
    .replace(/\)\)/g, ')');
}

export function splitNumberedInstructions(instructions: string): string {
  if (instructions.includes('\n')) {
    return instructions;
  }
  if (!/^\s*1\.\s/.test(instructions)) {
    return instructions;
  }
  const parts = instructions
    .split(/(?<=[.!?])\s*(?=\d+\.\s)/)
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 0);
  return parts.length > 1 ? parts.join('\n') : instructions;
}

export interface RecipeResult {
  title: string;
  author: string;
  original_url: string;
  host_url: string;
  host_name: string;
  categories: string;
  image: string;
  ingredients: string;
  instructions: string;
  total_time: string;
  total_time_unit: string;
  servings: string;
  about: string;
}

// --- JSON-LD extraction ---

export function extractJsonLd(html: string): string | null {
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const block = match[1];
    if (block.includes('"Recipe"') || block.includes('"@type":"Recipe"')) {
      return block;
    }
  }
  return null;
}

export function formatRecipeFromJsonLd(
  jsonld: string,
  sourceUrl: string,
): RecipeResult | null {
  let jsonAny: unknown;
  try {
    jsonAny = JSON.parse(jsonld);
  } catch {
    return null;
  }

  const recipeObj = findRecipeObject(jsonAny);
  if (!recipeObj) return null;

  let originalUrl = sourceUrl;
  let hostUrl = '';
  let hostName = '';
  try {
    const parsed = new URL(sourceUrl);
    hostUrl = `${parsed.protocol}//${parsed.host}`;
    hostName = parsed.hostname;
  } catch {
    // invalid URL — leave blank
  }

  const title = extractString('name', recipeObj);
  const author = extractAuthor(recipeObj);
  const categories = extractCategories(recipeObj, title);
  const image = extractImage(recipeObj);
  const ingredientsArray = extractStringArray('recipeIngredient', recipeObj);
  const ingredients = ingredientsArray.map(i => cleanIngredients(i)).join('\n');
  const instructions = extractInstructions(recipeObj);
  const [totalTime, totalTimeUnit] = extractTime(recipeObj);
  const servings = extractServings(recipeObj);
  const about = extractString('description', recipeObj);

  return {
    title,
    author,
    original_url: originalUrl,
    host_url: hostUrl,
    host_name: hostName,
    categories,
    image,
    ingredients,
    instructions,
    total_time: totalTime,
    total_time_unit: totalTimeUnit,
    servings,
    about,
  };
}

type JsonObject = Record<string, unknown>;

function isRecipeType(obj: JsonObject): boolean {
  const type = obj['@type'];
  if (typeof type === 'string') return type === 'Recipe';
  if (Array.isArray(type)) return (type as string[]).includes('Recipe');
  return false;
}

function findRecipeObject(json: unknown): JsonObject | null {
  if (Array.isArray(json)) {
    return (json as JsonObject[]).find(isRecipeType) ?? null;
  }
  if (json && typeof json === 'object') {
    const obj = json as JsonObject;
    if (isRecipeType(obj)) return obj;
    const graph = obj['@graph'];
    if (Array.isArray(graph)) {
      return (graph as JsonObject[]).find(isRecipeType) ?? null;
    }
    const items = obj['itemListElement'];
    if (Array.isArray(items)) {
      for (const item of items as JsonObject[]) {
        const inner = item['item'] as JsonObject | undefined;
        if (inner && isRecipeType(inner)) return inner;
      }
    }
  }
  return null;
}

function extractString(key: string, obj: JsonObject): string {
  const val = obj[key];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  return '';
}

function extractStringArray(key: string, obj: JsonObject): string[] {
  const val = obj[key];
  if (Array.isArray(val)) {
    return (val as unknown[])
      .map(v => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') {
          const o = v as JsonObject;
          return (o['@value'] ?? o['name'] ?? '') as string;
        }
        return '';
      })
      .filter(s => s.length > 0);
  }
  if (typeof val === 'string') return [val];
  return [];
}

function extractAuthor(obj: JsonObject): string {
  const author = obj['author'];
  if (Array.isArray(author) && author.length > 0) {
    return extractString('name', author[0] as JsonObject);
  }
  if (author && typeof author === 'object') {
    return extractString('name', author as JsonObject);
  }
  return extractString('author', obj);
}

function extractCategories(obj: JsonObject, title: string): string {
  const cats: string[] = [];

  for (const key of ['recipeCategory', 'recipeCuisine']) {
    if (cats.length >= 2) break;
    for (const val of extractStringArray(key, obj).map(s => s.toLowerCase())) {
      if (val && !cats.includes(val)) {
        cats.push(val);
        if (cats.length >= 2) break;
      }
    }
  }

  if (cats.length < 2) {
    const keywords = extractString('keywords', obj)
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);
    for (const kw of keywords) {
      if (cats.length >= 2) break;
      if (!cats.includes(kw)) cats.push(kw);
    }
  }

  if (cats.length < 2 && title) {
    const stopWords = new Set([
      'delicious',
      'easy',
      'quick',
      'best',
      'homemade',
      'perfect',
      'simple',
      'amazing',
      'the',
      'a',
      'an',
      'and',
      'or',
      'with',
      'for',
      'in',
      'to',
      'of',
      'my',
      'dish',
      'bowl',
      'recipe',
      'meal',
      'food',
    ]);
    const words = title
      .split(/[^a-zA-Z]+/)
      .map(w => w.toLowerCase())
      .filter(w => w.length >= 3 && !stopWords.has(w));
    for (const word of words) {
      if (cats.length >= 2) break;
      if (!cats.includes(word)) cats.push(word);
    }
  }

  return cats.join(',');
}

function extractImage(obj: JsonObject): string {
  const image = obj['image'];
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      return extractString('url', first as JsonObject);
    }
  }
  if (image && typeof image === 'object') {
    return extractString('url', image as JsonObject);
  }
  return '';
}

function extractInstructions(obj: JsonObject): string {
  const raw = obj['recipeInstructions'];
  let joined: string;

  if (Array.isArray(raw)) {
    const steps = (raw as unknown[])
      .flatMap(step => {
        if (typeof step === 'string') return [step];
        if (step && typeof step === 'object') {
          const s = step as JsonObject;
          // HowToSection — recurse into itemListElement
          if (Array.isArray(s['itemListElement'])) {
            return (s['itemListElement'] as JsonObject[])
              .map(sub => (sub['text'] ?? sub['name'] ?? '') as string)
              .filter(t => t.length > 0);
          }
          return [(s['text'] ?? s['@value'] ?? s['name'] ?? '') as string];
        }
        return [''];
      })
      .filter(s => s.length > 0);
    joined = steps.join('\n');
  } else if (typeof raw === 'string') {
    joined = raw;
  } else {
    return '';
  }

  return splitNumberedInstructions(joined);
}

function parseISO8601Duration(
  duration: string,
): {minutes: number; unit: string} | null {
  const match = duration.match(
    /P(?:\d+Y)?(?:\d+M)?(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:\d+(?:\.\d+)?S)?/,
  );
  if (!match) return null;
  const hours = parseInt(match[1] ?? '0', 10) || 0;
  const minutes = parseInt(match[2] ?? '0', 10) || 0;
  const total = hours * 60 + minutes;
  return total > 0 ? {minutes: total, unit: 'min'} : null;
}

function extractFirstNumber(s: string): number | null {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function extractTime(obj: JsonObject): [string, string] {
  const totalTime = obj['totalTime'];
  if (typeof totalTime === 'string') {
    const parsed = parseISO8601Duration(totalTime);
    if (parsed) return [String(parsed.minutes), parsed.unit];
    if (!totalTime.startsWith('P')) {
      const num = totalTime.replace(/\D/g, '');
      if (num) {
        const unit = /H|HOUR/i.test(totalTime) ? 'hr' : 'min';
        return [num, unit];
      }
    }
  }

  const prepTime = obj['prepTime'];
  const cookTime = obj['cookTime'];
  if (typeof prepTime === 'string' && typeof cookTime === 'string') {
    const prepMins = parseISO8601Duration(prepTime)?.minutes ?? 0;
    const cookMins = parseISO8601Duration(cookTime)?.minutes ?? 0;
    if (prepMins > 0 || cookMins > 0) {
      const total = prepMins + cookMins;
      return [String(total), 'min'];
    }
    const num = cookTime.replace(/\D/g, '');
    if (num) {
      const unit = /H|HOUR/i.test(cookTime) ? 'hr' : 'min';
      return [num, unit];
    }
  }

  return ['', ''];
}

function extractServings(obj: JsonObject): string {
  const raw = obj['recipeYield'];
  if (typeof raw === 'string') {
    const n = extractFirstNumber(raw);
    return n !== null ? String(n) : '';
  }
  if (typeof raw === 'number') return String(Math.round(raw));
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === 'number') return String(Math.round(first));
    if (typeof first === 'string') {
      const n = extractFirstNumber(first);
      return n !== null ? String(n) : '';
    }
  }
  return '';
}
