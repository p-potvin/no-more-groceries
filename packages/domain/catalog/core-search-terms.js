/**
 * Core search terms and category quotas for the benchmark basket.
 * These define the canonical weekly grocery basket for 1 person.
 * Quantities scale with household size.
 */

/**
 * @typedef {Object} CoreSearchTerm
 * @property {string} term           - Search term to use against the product catalog
 * @property {string} category       - One of: dairy, protein, produce, grains, pantry, snacks, household
 * @property {string} canonicalItem  - Canonical name for this basket slot
 * @property {number} baseQuantity   - Quantity for 1 person per week
 * @property {string} unit           - Unit of measure
 * @property {string[]} [aliases]    - Alternative search terms for substitution
 */

/** @type {CoreSearchTerm[]} */
export const CORE_SEARCH_TERMS = [
  // DAIRY
  { term: 'milk 2L',         category: 'dairy',     canonicalItem: 'milk',        baseQuantity: 1, unit: 'each',   aliases: ['milk 4L', 'whole milk', 'skim milk'] },
  { term: 'eggs 12ct',       category: 'dairy',     canonicalItem: 'eggs',        baseQuantity: 1, unit: 'dozen',  aliases: ['large eggs', 'brown eggs', 'free range eggs'] },
  { term: 'yogurt',          category: 'dairy',     canonicalItem: 'yogurt',      baseQuantity: 1, unit: 'each',   aliases: ['greek yogurt', 'plain yogurt'] },
  { term: 'cheddar cheese',  category: 'dairy',     canonicalItem: 'cheese',      baseQuantity: 1, unit: 'each',   aliases: ['mozzarella', 'cheese slices'] },

  // PROTEIN
  { term: 'chicken breast',  category: 'protein',   canonicalItem: 'chicken',     baseQuantity: 1, unit: 'pack',   aliases: ['chicken thighs', 'whole chicken', 'chicken drumsticks'] },
  { term: 'ground beef',     category: 'protein',   canonicalItem: 'beef',        baseQuantity: 1, unit: 'pack',   aliases: ['extra lean beef', 'beef patties'] },
  { term: 'fish fillet',     category: 'protein',   canonicalItem: 'fish',        baseQuantity: 1, unit: 'pack',   aliases: ['salmon', 'tilapia', 'cod fillet'] },

  // PRODUCE
  { term: 'banana',          category: 'produce',   canonicalItem: 'banana',      baseQuantity: 1, unit: 'bunch',  aliases: ['organic banana'] },
  { term: 'spinach lettuce', category: 'produce',   canonicalItem: 'lettuce',     baseQuantity: 1, unit: 'each',   aliases: ['romaine', 'iceberg lettuce', 'baby spinach', 'mixed greens'] },
  { term: 'carrots',         category: 'produce',   canonicalItem: 'carrots',     baseQuantity: 1, unit: 'bag',    aliases: ['baby carrots', 'carrot bag'] },
  { term: 'apples',          category: 'produce',   canonicalItem: 'apple',       baseQuantity: 1, unit: 'bag',    aliases: ['gala apples', 'honeycrisp', 'fuji apple'] },

  // GRAINS
  { term: 'bread loaf',      category: 'grains',    canonicalItem: 'bread',       baseQuantity: 1, unit: 'loaf',   aliases: ['whole wheat bread', 'white bread', 'multigrain bread'] },
  { term: 'rice',            category: 'grains',    canonicalItem: 'rice',        baseQuantity: 1, unit: 'bag',    aliases: ['long grain rice', 'white rice', 'basmati'] },
  { term: 'pasta',           category: 'grains',    canonicalItem: 'pasta',       baseQuantity: 1, unit: 'pack',   aliases: ['penne', 'spaghetti', 'fusilli'] },

  // PANTRY
  { term: 'cooking oil',     category: 'pantry',    canonicalItem: 'oil',         baseQuantity: 1, unit: 'bottle', aliases: ['vegetable oil', 'canola oil', 'olive oil'] },
  { term: 'canned tomatoes', category: 'pantry',    canonicalItem: 'tomatoes',    baseQuantity: 1, unit: 'can',    aliases: ['diced tomatoes', 'crushed tomatoes', 'tomato sauce'] },
  { term: 'canned beans',    category: 'pantry',    canonicalItem: 'beans',       baseQuantity: 1, unit: 'can',    aliases: ['chickpeas', 'black beans', 'kidney beans', 'lentils'] },

  // SNACKS
  { term: 'granola bars',    category: 'snacks',    canonicalItem: 'granola_bar', baseQuantity: 1, unit: 'box',    aliases: ['cereal bars', 'protein bars', 'crackers'] },

  // HOUSEHOLD
  { term: 'dish soap',       category: 'household', canonicalItem: 'dish_soap',   baseQuantity: 1, unit: 'bottle', aliases: ['dishwashing liquid', 'dish detergent'] },
  { term: 'paper towel',     category: 'household', canonicalItem: 'paper_towel', baseQuantity: 1, unit: 'pack',   aliases: ['bounty towels', 'paper towels'] },
];

/**
 * @typedef {Object} CategoryQuota
 * @property {string[]} items            - Canonical items in this category
 * @property {number} baseQuantityFactor - Multiplied against baseQuantity for budget allocation
 */

/** @type {Record<string, CategoryQuota>} */
export const CATEGORY_QUOTAS = {
  dairy:     { items: ['milk', 'eggs', 'yogurt', 'cheese'],         baseQuantityFactor: 1.0 },
  protein:   { items: ['chicken', 'beef', 'fish'],                  baseQuantityFactor: 1.5 },
  produce:   { items: ['banana', 'lettuce', 'carrots', 'apple'],    baseQuantityFactor: 1.2 },
  grains:    { items: ['bread', 'rice', 'pasta'],                   baseQuantityFactor: 1.1 },
  pantry:    { items: ['oil', 'tomatoes', 'beans'],                 baseQuantityFactor: 1.0 },
  snacks:    { items: ['granola_bar'],                               baseQuantityFactor: 1.0 },
  household: { items: ['dish_soap', 'paper_towel'],                 baseQuantityFactor: 1.0 },
};

/** All unique categories */
export const CATEGORIES = Object.keys(CATEGORY_QUOTAS);

/** Scale factor for household size N (economies of scale for N > 1) */
export function householdScaleFactor(n) {
  if (n <= 1) return 1;
  return Math.max(1, n * 0.75);
}
