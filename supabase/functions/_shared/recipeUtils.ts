export function cleanIngredients(ingredients: string): string {
  return ingredients
    .replace(/\(,\s*((?:[^\n()]*|\([^\n()]*\))*)\)/g, ', $1')
    .replace(/\(\(/g, '(')
    .replace(/\)\)/g, ')');
}

export function splitNumberedInstructions(instructions: string): string {
  if (instructions.includes('\n')) return instructions;
  if (!/^\s*1\.\s/.test(instructions)) return instructions;
  const parts = instructions
    .split(/(?<=[.!?])\s*(?=\d+\.\s)/)
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 0);
  return parts.length > 1 ? parts.join('\n') : instructions;
}
