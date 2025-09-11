export const MEASUREMENT_UNITS = [
  // Volume
  'cup',
  'cups',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'tbsp.',
  'tbs',
  'teaspoon',
  'teaspoons',
  'tsp',
  'tsp.',
  'fluid ounce',
  'fluid ounces',
  'fl oz',
  'fl. oz.',
  'pint',
  'pints',
  'pt',
  'pt.',
  'quart',
  'quarts',
  'qt',
  'qt.',
  'gallon',
  'gallons',
  'gal',
  'gal.',
  'milliliter',
  'milliliters',
  'ml',
  'ml.',
  'liter',
  'liters',
  'l',
  'l.',

  // Weight
  'ounce',
  'ounces',
  'oz',
  'oz.',
  'pound',
  'pounds',
  'lb',
  'lb.',
  'lbs',
  'lbs.',
  'gram',
  'grams',
  'g',
  'g.',
  'kilogram',
  'kilograms',
  'kg',
  'kg.',

  // Length
  'inch',
  'inches',
  'in',
  'in.',
  'centimeter',
  'centimeters',
  'cm',
  'cm.',
  'meter',
  'meters',
  'm',
  'm.',

  // Count
  'piece',
  'pieces',
  'pc',
  'pc.',
  'pinch',
  'dash',
  'to taste',

  // Common abbreviations
  't',
  't.',
  'T',
  'T.',
  'c',
  'c.',
  'pt',
  'pt.',
  'qt',
  'qt.',
  'gal',
  'gal.',
  'oz',
  'oz.',
  'lb',
  'lb.',
  'g',
  'g.',
  'kg',
  'kg.',
  'ml',
  'ml.',
  'l',
  'l.',
];

export const convertUnicodeFraction = (fraction: string): string => {
  const unicodeFractions: {[key: string]: string} = {
    '½': '1/2',
    '⅓': '1/3',
    '⅔': '2/3',
    '¼': '1/4',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅐': '1/7',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
  };
  return unicodeFractions[fraction] || fraction;
};

export const convertToAbbreviation = (unit: string): string => {
  const unitMap = {
    // Volume
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    'fluid ounce': 'fl oz',
    'fluid ounces': 'fl oz',
    pint: 'pt',
    pints: 'pt',
    quart: 'qt',
    quarts: 'qt',
    gallon: 'gal',
    gallons: 'gal',
    milliliter: 'ml',
    milliliters: 'ml',
    liter: 'l',
    liters: 'l',

    // Weight
    ounce: 'oz',
    ounces: 'oz',
    pound: 'lb',
    pounds: 'lb',
    gram: 'g',
    grams: 'g',
    kilogram: 'kg',
    kilograms: 'kg',

    // Length
    inch: 'in',
    inches: 'in',
    centimeter: 'cm',
    centimeters: 'cm',
    meter: 'm',
    meters: 'm',

    // Count
    piece: 'pc',
    pieces: 'pc',
  } as const;

  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit as keyof typeof unitMap] || unit;
};

export interface ParsedIngredient {
  quantity: string;
  unit: string;
  text: string;
}

export const parseIngredient = (ingredient: string): ParsedIngredient => {
  const quantityMatch = ingredient.match(
    /^(\d+\s*\d*\/\d+|\d+\.\d+|\d+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])?/,
  );
  const quantity = quantityMatch
    ? convertUnicodeFraction(quantityMatch[1]?.trim() || '')
    : '';

  if (!quantity) {
    return {quantity: '', unit: '', text: ingredient};
  }

  const remainingText = ingredient
    .substring(quantityMatch?.[0]?.length || 0)
    .trim();

  const words = remainingText.split(/\s+/);
  let unit = '';
  let text = remainingText;

  if (words.length > 0) {
    if (MEASUREMENT_UNITS.includes(words[0].toLowerCase())) {
      unit = convertToAbbreviation(words[0]);
      text = words.slice(1).join(' ');
    } else if (
      words.length > 1 &&
      MEASUREMENT_UNITS.includes(`${words[0]} ${words[1]}`.toLowerCase())
    ) {
      unit = convertToAbbreviation(`${words[0]} ${words[1]}`);
      text = words.slice(2).join(' ');
    }
  }

  return {quantity, unit, text};
};
