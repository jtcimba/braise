// Helper function to parse fraction to decimal
export const parseFraction = (fraction: string): number => {
  if (!fraction) {
    return 0;
  }
  if (fraction.includes('/')) {
    const [num, den] = fraction.split('/').map(Number);
    return den !== 0 ? num / den : 0;
  }
  return parseFloat(fraction) || 0;
};

// Helper function to convert decimal back to fraction
export const decimalToFraction = (decimal: number): string => {
  const tolerance = 0.01;
  for (let den = 1; den <= 100; den++) {
    for (let num = 0; num <= den; num++) {
      const value = num / den;
      if (Math.abs(decimal - value) < tolerance) {
        if (num === 0) {
          return '0';
        }
        if (num === den) {
          return '1';
        }
        if (num === 1 && den === 2) {
          return '½';
        }
        if (num === 1 && den === 3) {
          return '⅓';
        }
        if (num === 2 && den === 3) {
          return '⅔';
        }
        if (num === 1 && den === 4) {
          return '¼';
        }
        if (num === 3 && den === 4) {
          return '¾';
        }
        return `${num}/${den}`;
      }
    }
  }
  return decimal.toFixed(2).replace(/\.00$/, '');
};

// Helper function to check if two amounts are combinable (same unit)
export const isAmountCombinable = (
  amount1: string,
  amount2: string,
): boolean => {
  if (!amount1 || !amount2) {
    return false;
  }

  // Extract units from amounts
  const unit1 = amount1.replace(/[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞\s/.,]+/g, '').trim();
  const unit2 = amount2.replace(/[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞\s/.,]+/g, '').trim();

  // If both have the same unit (case-insensitive), they're combinable
  if (unit1 && unit2 && unit1.toLowerCase() === unit2.toLowerCase()) {
    return true;
  }

  // If both have no units, they're combinable
  if (!unit1 && !unit2) {
    return true;
  }

  return false;
};

// Helper function to combine two amounts
export const combineAmounts = (amount1: string, amount2: string): string => {
  if (!isAmountCombinable(amount1, amount2)) {
    // If not combinable, return both amounts combined with " + "
    return `${amount1} + ${amount2}`;
  }

  // Extract the numeric part and unit
  const numericPart1 = amount1.replace(/[^\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞/.,]+/g, '').trim();
  const numericPart2 = amount2.replace(/[^\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞/.,]+/g, '').trim();
  const unit = amount1.replace(/[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞\s/.,]+/g, '').trim();

  if (!numericPart1 || !numericPart2) {
    return `${amount1} + ${amount2}`;
  }

  // Convert to decimal, add, and convert back
  const decimal1 = parseFraction(numericPart1);
  const decimal2 = parseFraction(numericPart2);
  const combined = decimal1 + decimal2;

  const combinedNumeric = decimalToFraction(combined);
  return unit ? `${combinedNumeric} ${unit}` : combinedNumeric;
};
