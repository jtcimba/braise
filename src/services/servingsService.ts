import {parseIngredient} from './unitService';

export const scaleQuantity = (
  quantity: string,
  scaleFactor: number,
): string => {
  if (!quantity || quantity === '-') {
    return quantity;
  }

  // Handle fractions
  if (quantity.includes('/')) {
    const [numerator, denominator] = quantity.split('/');
    const num = parseFloat(numerator);
    const den = parseFloat(denominator);
    const result = (num / den) * scaleFactor;
    return formatQuantity(result);
  }

  // Handle decimal numbers
  const num = parseFloat(quantity);
  if (isNaN(num)) {
    return quantity;
  }

  const result = num * scaleFactor;
  return formatQuantity(result);
};

export const formatQuantity = (num: number): string => {
  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  // If it's a whole number, return as integer
  if (rounded % 1 === 0) {
    return rounded.toString();
  }

  // If it's close to common fractions, convert to fraction
  const fractions = [
    {value: 0.125, fraction: '1/8'},
    {value: 0.25, fraction: '1/4'},
    {value: 0.33, fraction: '1/3'},
    {value: 0.5, fraction: '1/2'},
    {value: 0.67, fraction: '2/3'},
    {value: 0.75, fraction: '3/4'},
  ];

  for (const frac of fractions) {
    if (Math.abs(rounded - frac.value) < 0.01) {
      return frac.fraction;
    }
  }

  // Return as decimal with up to 2 decimal places
  return rounded.toFixed(2).replace(/\.?0+$/, '');
};

export const scaleIngredients = (
  ingredients: string,
  newServings: string,
  originalServings: string,
): string => {
  if (
    !ingredients ||
    newServings === '-' ||
    originalServings === '-' ||
    newServings === originalServings
  ) {
    return ingredients;
  }

  const originalNum = parseFloat(originalServings);
  const newNum = parseFloat(newServings);

  if (isNaN(originalNum) || isNaN(newNum) || originalNum === 0) {
    return ingredients;
  }

  const scaleFactor = newNum / originalNum;

  return ingredients
    .split('\n')
    .map(ingredient => {
      const {quantity, unit, text} = parseIngredient(ingredient);

      if (!quantity) {
        return ingredient;
      }

      const scaledQuantity = scaleQuantity(quantity, scaleFactor);
      return `${scaledQuantity}${unit ? ' ' + unit : ''} ${text}`.trim();
    })
    .join('\n');
};
