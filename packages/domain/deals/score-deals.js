/**
 * Best-Deals Scoring Engine
 *
 * Scoring formula:
 *   dealScore = (discountScore × 0.40) + (valueScore × 0.35) + (basketRelevanceScore × 0.25)
 *
 * Component ranges: 0–100
 */

import { normalizeUnitPrice } from './unit-normalization.js';

const SCORING_VERSION = 'deal-score-v1';

// Category → basket relevance tier mapping
const CATEGORY_TIER = {
  dairy:     'A',
  protein:   'A',
  produce:   'A',
  grains:    'A',
  pantry:    'B',
  beverages: 'B',
  snacks:    'C',
  household: 'C',
};

const TIER_SCORE = { A: 100, B: 75, C: 50, D: 0 };

/**
 * Compute category-level average normalized unit price from a product array.
 * @param {Object[]} products
 * @returns {Record<string, number>}  category → avg normalized unit price
 */
export function computeCategoryAverages(products) {
  const buckets = {};
  for (const p of products) {
    const cat = (p.category ?? 'unknown').toLowerCase();
    const { normalizedUnitPrice } = normalizeUnitPrice(p);
    if (!buckets[cat]) buckets[cat] = { sum: 0, count: 0 };
    buckets[cat].sum   += normalizedUnitPrice;
    buckets[cat].count += 1;
  }
  const result = {};
  for (const [cat, { sum, count }] of Object.entries(buckets)) {
    result[cat] = count > 0 ? sum / count : 0;
  }
  return result;
}

/**
 * Score a single product.
 * @param {Object} product
 * @param {Record<string, number>} [categoryAverages={}]
 * @returns {Object} Scored deal object
 */
export function scoreProduct(product, categoryAverages = {}) {
  const cat = (product.category ?? 'unknown').toLowerCase();

  // ── Discount score ──────────────────────────────────────────
  let discountPct  = 0;
  let discountScore = 0;

  if (product.isOnSale && product.salePrice != null && product.regularPrice > 0) {
    discountPct  = (product.regularPrice - product.salePrice) / product.regularPrice;
    discountScore = Math.min(100, discountPct * 100 * 2); // ×2 amplifier, cap 100
  }

  // ── Value score ─────────────────────────────────────────────
  const { normalizedUnitPrice, normalizedUnitLabel, effectivePrice } = normalizeUnitPrice(product);
  const avgPrice = categoryAverages[cat] ?? normalizedUnitPrice; // If no baseline, treat as average
  let valueScore = 50; // at-average baseline

  if (avgPrice > 0 && normalizedUnitPrice > 0) {
    const ratio = normalizedUnitPrice / avgPrice;
    if (ratio <= 0.7)       valueScore = 100;
    else if (ratio <= 0.9)  valueScore = Math.round(75 + (0.9 - ratio) / 0.2 * 25);
    else if (ratio <= 1.1)  valueScore = Math.round(50 + (1.1 - ratio) / 0.2 * 25);
    else if (ratio <= 1.3)  valueScore = Math.round(25 + (1.3 - ratio) / 0.2 * 25);
    else                    valueScore = 0;
  }

  // ── Basket relevance score ───────────────────────────────────
  const tier = CATEGORY_TIER[cat] ?? 'D';
  const basketRelevanceScore = TIER_SCORE[tier];

  // ── Overall deal score ───────────────────────────────────────
  const dealScore = Number(
    ((discountScore * 0.40) + (valueScore * 0.35) + (basketRelevanceScore * 0.25)).toFixed(2)
  );

  // ── Confidence level ─────────────────────────────────────────
  let confidenceLevel = 'low';
  if (product.regularPrice > 0 && product.packageSize) confidenceLevel = 'high';
  else if (product.regularPrice > 0)                   confidenceLevel = 'medium';

  // ── Explanation summary ──────────────────────────────────────
  const parts = [];
  if (discountScore >= 40) parts.push(`${Math.round(discountPct * 100)}% off`);
  if (valueScore   >= 75) parts.push('better-than-average unit price');
  if (basketRelevanceScore === 100) parts.push('core weekly staple');
  const explanationSummary = parts.length > 0
    ? parts.join(', ') + '.'
    : `Standard deal score for ${cat} item.`;

  return {
    productId:            product.productId ?? product.id,
    name:                 product.name,
    category:             cat,
    brand:                product.brand ?? null,
    packageSize:          product.packageSize ?? null,
    currentPrice:         effectivePrice,
    regularPrice:         product.regularPrice,
    salePrice:            product.salePrice ?? null,
    isOnSale:             product.isOnSale ?? false,
    promoDescription:     product.promoDescription ?? null,
    dealScore,
    discountScore:        Number(discountScore.toFixed(2)),
    valueScore:           Number(valueScore.toFixed(2)),
    basketRelevanceScore,
    discountPct:          Number(discountPct.toFixed(4)),
    normalizedUnitPrice,
    normalizedUnitLabel,
    relevanceTier:        tier,
    confidenceLevel,
    explanationSummary,
    scoringVersion:       SCORING_VERSION,
  };
}

/**
 * Rank a list of products as deals.
 * @param {Object[]} products
 * @param {Object} [options]
 * @param {Record<string,number>} [options.categoryAverages]
 * @param {number} [options.limit=20]
 * @param {number} [options.minDealScore=10]
 * @returns {Object[]}  Ranked deal objects, highest score first
 */
export function rankDeals(products, options = {}) {
  const { limit = 20, minDealScore = 10 } = options;
  const categoryAverages = options.categoryAverages ?? computeCategoryAverages(products);

  const scored = products
    .map((p) => scoreProduct(p, categoryAverages))
    .filter((d) => d.dealScore >= minDealScore)
    .sort((a, b) => {
      if (b.dealScore !== a.dealScore) return b.dealScore - a.dealScore;
      // Tie-break: lower normalized unit price wins
      return a.normalizedUnitPrice - b.normalizedUnitPrice;
    });

  return scored.slice(0, limit);
}
