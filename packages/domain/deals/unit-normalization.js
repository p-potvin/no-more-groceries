/**
 * Unit Price Normalization
 * Converts product prices + package sizes to a comparable normalized unit price.
 */

const LIQUID_UNITS = new Set(['l', 'ml', 'litre', 'liter', 'litres', 'liters', 'fl oz', 'floz']);
const WEIGHT_UNITS = new Set(['g', 'kg', 'gr', 'gram', 'grams', 'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces']);
const COUNT_UNITS  = new Set(['each', 'pack', 'bag', 'box', 'count', 'ct', 'roll', 'rolls', 'piece', 'pieces', 'bunch', 'can', 'bottle', 'loaf', 'dozen']);

/** @param {string} unit */
export function isLiquidUnit(unit) {
  return LIQUID_UNITS.has((unit ?? '').toLowerCase().trim());
}

/** @param {string} unit */
export function isWeightUnit(unit) {
  return WEIGHT_UNITS.has((unit ?? '').toLowerCase().trim());
}

/**
 * Parse a packageSize string like "2L", "500g", "12 pack", "4 roll"
 * @param {string|null} sizeStr
 * @returns {{ quantity: number, unit: string }|null}
 */
export function parsePackageSize(sizeStr) {
  if (!sizeStr) return null;
  const str = sizeStr.trim();

  // Match: "2L", "500g", "1.42L", "12.5 kg", "4 roll", "12 pack", "3 pack"
  const m = str.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/);
  if (!m) return null;

  const quantity = parseFloat(m[1]);
  const unit = m[2].toLowerCase().trim();

  if (!isFinite(quantity) || quantity <= 0) return null;

  return { quantity, unit };
}

/**
 * Normalize a product's effective price to a per-unit equivalent.
 * - Liquids → per L (convert ml → L)
 * - Weights → per 100g (convert kg/lb/oz → g)
 * - Counted → per each
 *
 * @param {{ regularPrice: number, salePrice?: number|null, packageSize?: string|null, unit?: string|null }} product
 * @returns {{ normalizedUnitPrice: number, normalizedUnitLabel: string, effectivePrice: number }}
 */
export function normalizeUnitPrice(product) {
  const effectivePrice = (product.salePrice != null && product.salePrice > 0)
    ? product.salePrice
    : product.regularPrice;

  const parsed = parsePackageSize(product.packageSize);

  if (!parsed || parsed.quantity <= 0) {
    // Fallback: treat as single unit
    return {
      normalizedUnitPrice: effectivePrice,
      normalizedUnitLabel: 'each',
      effectivePrice,
    };
  }

  const { quantity, unit } = parsed;

  if (isLiquidUnit(unit)) {
    // Normalize to per-L
    let totalLitres = quantity;
    if (unit === 'ml') totalLitres = quantity / 1000;
    else if (unit === 'fl oz' || unit === 'floz') totalLitres = quantity * 0.0295735;
    // else already in L

    const normalizedUnitPrice = totalLitres > 0 ? Number((effectivePrice / totalLitres).toFixed(4)) : effectivePrice;
    return { normalizedUnitPrice, normalizedUnitLabel: 'per L', effectivePrice };
  }

  if (isWeightUnit(unit)) {
    // Normalize to per 100g
    let totalGrams = quantity;
    if (unit === 'kg')                             totalGrams = quantity * 1000;
    else if (unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds') totalGrams = quantity * 453.592;
    else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') totalGrams = quantity * 28.3495;
    // else already in g

    const normalizedUnitPrice = totalGrams > 0 ? Number((effectivePrice / totalGrams * 100).toFixed(4)) : effectivePrice;
    return { normalizedUnitPrice, normalizedUnitLabel: 'per 100g', effectivePrice };
  }

  // Counted unit → per each
  const normalizedUnitPrice = quantity > 0 ? Number((effectivePrice / quantity).toFixed(4)) : effectivePrice;
  return { normalizedUnitPrice, normalizedUnitLabel: `per ${unit}`, effectivePrice };
}
