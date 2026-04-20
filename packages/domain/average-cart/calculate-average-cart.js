/**
 * Benchmark Average Cart Calculator
 *
 * Computes a weekly grocery cart total for a given household size
 * using the canonical benchmark basket items.
 */

import { CORE_SEARCH_TERMS, householdScaleFactor } from '../catalog/core-search-terms.js';

const BASKET_VERSION = 'benchmark-v1';

/**
 * Score a product match against a search term (higher = better match).
 * @param {string} term
 * @param {string} productName
 * @returns {number}
 */
function matchScore(term, productName) {
  const words = term.toLowerCase().split(/\s+/);
  const name  = productName.toLowerCase();
  return words.reduce((acc, w) => acc + (name.includes(w) ? 1 : 0), 0);
}

/**
 * Find the best-matching product for a search term.
 * Returns null if no match found.
 * @param {string} term
 * @param {Object[]} products
 * @returns {Object|null}
 */
function findBestMatch(term, products) {
  let best = null;
  let bestScore = 0;

  for (const p of products) {
    const s = matchScore(term, p.name);
    if (s > bestScore) { bestScore = s; best = p; }
  }

  return bestScore > 0 ? best : null;
}

/**
 * Find the best match, with fallback through alias terms.
 */
function findWithFallback(coreItem, products) {
  // Try primary term
  let match = findBestMatch(coreItem.term, products);
  if (match) return { product: match, matchType: 'exact' };

  // Try alias terms
  for (const alias of (coreItem.aliases ?? [])) {
    match = findBestMatch(alias, products);
    if (match) return { product: match, matchType: 'substitute' };
  }

  // Try category-level fallback across other core items in same category
  for (const other of CORE_SEARCH_TERMS) {
    if (other.canonicalItem === coreItem.canonicalItem) continue;
    if (other.category !== coreItem.category) continue;
    match = findBestMatch(other.term, products);
    if (match) return { product: match, matchType: 'substitute' };
  }

  return { product: null, matchType: 'unavailable' };
}

/**
 * Calculate the benchmark average cart for a store's products and a household size.
 *
 * @param {Object[]} products  - Normalized products from product-search adapter
 * @param {number} householdSize
 * @param {Object} [options]
 * @returns {{
 *   householdSize: number,
 *   coverageScore: number,
 *   total: number,
 *   currency: string,
 *   lineItems: Object[],
 *   basketVersion: string,
 *   summary: string
 * }}
 */
export function calculateAverageCart(products, householdSize, options = {}) {
  const factor    = householdScaleFactor(householdSize);
  const lineItems = [];
  let matched     = 0;

  for (const coreItem of CORE_SEARCH_TERMS) {
    const { product, matchType } = findWithFallback(coreItem, products);

    if (product) {
      matched++;
      const unitPrice  = product.salePrice ?? product.regularPrice ?? product.price ?? 0;
      const quantity   = Math.max(1, Math.ceil(coreItem.baseQuantity * factor));
      const lineTotal  = Number((quantity * unitPrice).toFixed(2));

      lineItems.push({
        category:           coreItem.category,
        canonicalItem:      coreItem.canonicalItem,
        matchedProductId:   product.productId ?? product.id,
        matchedProductName: product.name,
        matchType,
        unitType:           coreItem.unit,
        quantity,
        unitPrice,
        lineTotal,
        pricingSourceDate:  options.date ?? new Date().toISOString().slice(0, 10),
      });
    } else {
      lineItems.push({
        category:      coreItem.category,
        canonicalItem: coreItem.canonicalItem,
        matchType:     'unavailable',
        quantity:      Math.max(1, Math.ceil(coreItem.baseQuantity * factor)),
        unitType:      coreItem.unit,
      });
    }
  }

  const coverageScore = CORE_SEARCH_TERMS.length > 0 ? matched / CORE_SEARCH_TERMS.length : 0;
  const total = lineItems.reduce((s, item) => s + (item.lineTotal ?? 0), 0);

  return {
    householdSize,
    coverageScore: Number(coverageScore.toFixed(4)),
    total:         Number(total.toFixed(2)),
    currency:      'CAD',
    lineItems,
    basketVersion: BASKET_VERSION,
    summary: `Estimated benchmark weekly cart for ${householdSize} person${householdSize !== 1 ? 's' : ''}.`,
  };
}
