/**
 * Weekly Cart Recommendation Engine
 *
 * Generates a recommended 7-day grocery cart for a household size,
 * optimizing for lowest acceptable unit price within each category.
 */

import { CORE_SEARCH_TERMS, CATEGORIES, householdScaleFactor } from '../catalog/core-search-terms.js';

const POLICY_VERSION  = 'weekly-cart-policy-v1';
const BASKET_VERSION  = 'benchmark-v1';

function matchScore(term, productName) {
  const words = term.toLowerCase().split(/\s+/);
  const name  = productName.toLowerCase();
  return words.reduce((acc, w) => acc + (name.includes(w) ? 1 : 0), 0);
}

/** Find best-value (lowest price, sufficient match) product for a term */
function findBestValue(term, products) {
  const candidates = products
    .map((p) => ({ product: p, score: matchScore(term, p.name) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const priceA = a.product.salePrice ?? a.product.regularPrice ?? a.product.price ?? Infinity;
      const priceB = b.product.salePrice ?? b.product.regularPrice ?? b.product.price ?? Infinity;
      return priceA - priceB; // prefer cheaper
    });

  return candidates[0]?.product ?? null;
}

function findBestValueWithFallback(coreItem, products) {
  let match = findBestValue(coreItem.term, products);
  if (match) return { product: match, matchType: 'exact', reason: null };

  for (const alias of (coreItem.aliases ?? [])) {
    match = findBestValue(alias, products);
    if (match) return {
      product:   match,
      matchType: 'substitute',
      reason:    `Direct match for "${coreItem.canonicalItem}" not found; using "${alias}" substitute.`,
    };
  }

  for (const other of CORE_SEARCH_TERMS) {
    if (other.canonicalItem === coreItem.canonicalItem) continue;
    if (other.category !== coreItem.category) continue;
    match = findBestValue(other.term, products);
    if (match) return {
      product:   match,
      matchType: 'substitute',
      reason:    `"${coreItem.canonicalItem}" unavailable; substituted with "${other.canonicalItem}" from same category.`,
    };
  }

  return { product: null, matchType: 'unavailable', reason: null };
}

/**
 * Generate a recommended 7-day grocery cart.
 *
 * @param {Object[]} products  - Normalized products from product-search adapter
 * @param {number} householdSize
 * @param {Object} [options]
 * @returns {{
 *   householdSize: number,
 *   confidenceLevel: 'high'|'medium'|'low',
 *   categoryCoverage: Record<string, boolean>,
 *   total: number,
 *   currency: string,
 *   lineItems: Object[],
 *   policyVersion: string,
 *   basketVersion: string
 * }}
 */
export function generateWeeklyCart(products, householdSize, options = {}) {
  const factor           = householdScaleFactor(householdSize);
  const lineItems        = [];
  const categoryCoverage = Object.fromEntries(CATEGORIES.map((c) => [c, false]));
  let   matched          = 0;

  for (const coreItem of CORE_SEARCH_TERMS) {
    const { product, matchType, reason } = findBestValueWithFallback(coreItem, products);

    if (product) {
      matched++;
      categoryCoverage[coreItem.category] = true;

      const unitPrice  = product.salePrice ?? product.regularPrice ?? product.price ?? 0;
      const quantity   = Math.max(1, Math.ceil(coreItem.baseQuantity * factor));
      const lineTotal  = Number((quantity * unitPrice).toFixed(2));

      const selectionExplanation = matchType === 'exact'
        ? `Selected ${product.name} as the best-value match for the weekly ${coreItem.canonicalItem} target.`
        : `Substituted with ${product.name} — closest available option for ${coreItem.canonicalItem}.`;

      const item = {
        category:           coreItem.category,
        canonicalItem:      coreItem.canonicalItem,
        matchedProductId:   product.productId ?? product.id,
        matchedProductName: product.name,
        matchType,
        quantity,
        unitPrice,
        lineTotal,
        normalizedUnitLabel: coreItem.unit,
        selectionExplanation,
      };
      if (reason) item.substitutionReason = reason;

      lineItems.push(item);
    } else {
      lineItems.push({
        category:      coreItem.category,
        canonicalItem: coreItem.canonicalItem,
        matchType:     'unavailable',
        quantity:      Math.max(1, Math.ceil(coreItem.baseQuantity * factor)),
        normalizedUnitLabel: coreItem.unit,
      });
    }
  }

  const coverageRatio = CORE_SEARCH_TERMS.length > 0 ? matched / CORE_SEARCH_TERMS.length : 0;
  const confidenceLevel = coverageRatio > 0.85 ? 'high' : coverageRatio > 0.6 ? 'medium' : 'low';
  const total = lineItems.reduce((s, item) => s + (item.lineTotal ?? 0), 0);

  return {
    householdSize,
    confidenceLevel,
    categoryCoverage,
    total:        Number(total.toFixed(2)),
    currency:     'CAD',
    lineItems,
    policyVersion: POLICY_VERSION,
    basketVersion: BASKET_VERSION,
  };
}
