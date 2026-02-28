export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Bakery',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Words that always indicate the frozen section (matched as whole words)
const FROZEN_OVERRIDES = ['frozen'];

// Words that always indicate the pantry section (matched as whole words)
const PANTRY_OVERRIDES = ['canned', 'jarred'];

// Words that suggest a processed/dried ingredient — used as a fallback when
// no keyword matches, to catch exotic pantry items (e.g. "turmeric extract")
const PANTRY_MODIFIERS = [
  'powder',
  'dried',
  'ground',
  'flakes',
  'extract',
  'seasoning',
  'granulated',
  'granules',
];

// Keyword lists per category. Longer/more specific keywords take priority over
// shorter ones when multiple categories match the same ingredient name.
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Produce: [
    'apple',
    'apples',
    'banana',
    'bananas',
    'orange',
    'oranges',
    'grape',
    'grapes',
    'berry',
    'berries',
    'strawberry',
    'blueberry',
    'blackberry',
    'raspberry',
    'mango',
    'pineapple',
    'watermelon',
    'cantaloupe',
    'peach',
    'pear',
    'plum',
    'cherry',
    'cherries',
    'lettuce',
    'spinach',
    'kale',
    'arugula',
    'cabbage',
    'broccoli',
    'cauliflower',
    'carrot',
    'carrots',
    'celery',
    'onion',
    'onions',
    'garlic',
    'shallot',
    'shallots',
    'leek',
    'leeks',
    'potato',
    'potatoes',
    'sweet potato',
    'yam',
    'tomato',
    'tomatoes',
    'cucumber',
    'zucchini',
    'squash',
    'bell pepper',
    'jalapeño',
    'jalapeno',
    'serrano',
    'habanero',
    'mushroom',
    'mushrooms',
    'avocado',
    'avocados',
    'lemon',
    'lemons',
    'lime',
    'limes',
    'grapefruit',
    'fresh herbs',
    'fresh basil',
    'fresh thyme',
    'fresh rosemary',
    'fresh parsley',
    'fresh cilantro',
    'fresh oregano',
    'fresh mint',
    'fresh dill',
    'fresh ginger',
    'ginger root',
    'basil',
    'cilantro',
    'parsley',
    'rosemary',
    'thyme',
    'oregano',
    'mint',
    'dill',
    'chive',
    'chives',
    'asparagus',
    'artichoke',
    'beet',
    'beets',
    'radish',
    'radishes',
    'turnip',
    'bok choy',
    'snap peas',
    'snow peas',
    'edamame',
    'corn',
    'green beans',
    'brussels sprouts',
  ],
  Dairy: [
    'milk',
    'cream',
    'half and half',
    'heavy cream',
    'butter',
    'buttermilk',
    'cheese',
    'cheddar',
    'mozzarella',
    'parmesan',
    'swiss',
    'feta',
    'goat cheese',
    'cottage cheese',
    'cream cheese',
    'sour cream',
    'yogurt',
    'greek yogurt',
    'eggs',
    'egg',
    'margarine',
  ],
  'Meat & Seafood': [
    'beef',
    'steak',
    'ground beef',
    'beef chuck',
    'beef brisket',
    'roast beef',
    'pork',
    'pork chop',
    'pork chops',
    'bacon',
    'ham',
    'sausage',
    'sausages',
    'chicken',
    'chicken breast',
    'chicken thigh',
    'chicken wings',
    'ground chicken',
    'turkey',
    'ground turkey',
    'turkey breast',
    'salmon',
    'tuna',
    'cod',
    'tilapia',
    'halibut',
    'mahi',
    'catfish',
    'shrimp',
    'crab',
    'lobster',
    'scallops',
    'fish',
    'seafood',
    'anchovy',
    'anchovies',
    'sardine',
    'sardines',
    'duck',
    'lamb',
  ],
  Pantry: [
    'flour',
    'sugar',
    'brown sugar',
    'powdered sugar',
    'salt',
    // Pepper — "pepper" alone means the spice; specific fresh peppers are in Produce
    'pepper',
    'black pepper',
    'black peppercorns',
    'white pepper',
    'cayenne pepper',
    'red pepper flakes',
    'chili powder',
    // Garlic/onion processed forms — raw versions are in Produce
    'garlic powder',
    'garlic salt',
    'garlic flakes',
    'garlic granules',
    'onion powder',
    'onion flakes',
    'onion salt',
    // Oils & vinegars
    'olive oil',
    'vegetable oil',
    'canola oil',
    'coconut oil',
    'sesame oil',
    'vinegar',
    'balsamic vinegar',
    'white vinegar',
    'apple cider vinegar',
    'rice vinegar',
    // Condiments & sauces
    'soy sauce',
    'worcestershire',
    'hot sauce',
    'ketchup',
    'mustard',
    'mayonnaise',
    'fish sauce',
    'oyster sauce',
    'hoisin',
    'tahini',
    'miso',
    // Tomato products (raw tomatoes are in Produce)
    'tomato paste',
    'tomato sauce',
    'tomato puree',
    // Legumes & grains
    'beans',
    'black beans',
    'kidney beans',
    'chickpeas',
    'lentils',
    'rice',
    'pasta',
    'noodles',
    // Bread products for cooking (whole bread items are in Bakery)
    'breadcrumb',
    'bread crumb',
    'panko',
    // Broths & stocks
    'broth',
    'stock',
    'chicken broth',
    'beef broth',
    'vegetable broth',
    // Whole spices & dried herbs
    'paprika',
    'smoked paprika',
    'cumin',
    'ground cumin',
    'coriander',
    'ground coriander',
    'turmeric',
    'curry',
    'cinnamon',
    'ground cinnamon',
    'nutmeg',
    'ginger',
    'ground ginger',
    'dried basil',
    'dried oregano',
    'dried rosemary',
    'dried thyme',
    'dried parsley',
    'dried cilantro',
    'dried mint',
    'dried dill',
    // Baking
    'vanilla',
    'vanilla extract',
    'almond extract',
    'baking soda',
    'baking powder',
    'yeast',
    'cornstarch',
    'corn starch',
    'cocoa powder',
    'chocolate chips',
    // Sweeteners
    'honey',
    'maple syrup',
    'molasses',
    // Spreads & condiments
    'peanut butter',
    'almond butter',
    'jam',
    'jelly',
    // Misc pantry
    'olive',
    'olives',
    'capers',
    'anchovy paste',
  ],
  Frozen: [
    'frozen peas',
    'frozen corn',
    'frozen spinach',
    'frozen broccoli',
    'frozen edamame',
    'frozen vegetables',
    'ice cream',
    'sorbet',
    'gelato',
    'popsicle',
    'popsicles',
    'frozen chicken',
    'frozen fish',
    'frozen shrimp',
    'frozen fruit',
    'frozen berries',
    'frozen mango',
    'frozen pizza',
    'frozen waffles',
  ],
  Bakery: [
    'bread',
    'loaf',
    'baguette',
    'sourdough',
    'whole wheat bread',
    'multigrain bread',
    'croissant',
    'croissants',
    'roll',
    'rolls',
    'bun',
    'buns',
    'hamburger bun',
    'cake',
    'muffin',
    'muffins',
    'cookie',
    'cookies',
    'donut',
    'donuts',
    'bagel',
    'bagels',
    'pita',
    'pita bread',
    'tortilla',
    'tortillas',
    'naan',
  ],
  Other: [],
};

// Categorize an ingredient based on its name using a two-pass algorithm:
// 1. Hard overrides for "frozen" and "canned/jarred" always win.
// 2. Specificity-first matching: the longest keyword match wins, so
//    "garlic powder" (Pantry, 12 chars) beats "garlic" (Produce, 6 chars).
// 3. Modifier fallback: if nothing matched but the name contains a processing
//    word (powder, dried, ground, etc.), default to Pantry.
export const categorizeIngredient = (ingredientName: string): Category => {
  const lowerName = ingredientName.toLowerCase().trim();
  const words = lowerName.split(/\s+/);

  // Pass 1: hard overrides — check for standalone modifier words
  if (FROZEN_OVERRIDES.some(w => words.includes(w))) {
    return 'Frozen';
  }
  if (PANTRY_OVERRIDES.some(w => words.includes(w))) {
    return 'Pantry';
  }

  // Pass 2: specificity-first keyword matching — longest match wins
  let bestCategory: Category | null = null;
  let bestLength = 0;

  for (const category of CATEGORIES) {
    if (category === 'Other') {
      continue;
    }
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (lowerName.includes(keyword) && keyword.length > bestLength) {
        bestLength = keyword.length;
        bestCategory = category;
      }
    }
  }

  if (bestCategory) {
    return bestCategory;
  }

  // Pass 3: modifier fallback — catches exotic pantry items with no keyword match
  if (PANTRY_MODIFIERS.some(w => lowerName.includes(w))) {
    return 'Pantry';
  }

  return 'Other';
};
