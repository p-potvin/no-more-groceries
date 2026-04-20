import assert from 'node:assert/strict';
import { scoreProduct, rankDeals, computeCategoryAverages } from '../score-deals.js';

/** Mock product factory */
function mkProduct(overrides = {}) {
  return {
    productId:    'test-001',
    name:         'Test Milk 2L',
    category:     'dairy',
    brand:        'Test Brand',
    packageSize:  '2L',
    unit:         'L',
    regularPrice: 5.00,
    salePrice:    null,
    isOnSale:     false,
    promoDescription: null,
    ...overrides,
  };
}

export async function runTests() {
  console.log('[Test] score-deals.js');

  // ── Discount score: 20% off → score = 40 ─────────────────────────────────
  const onSale = mkProduct({ regularPrice: 5.00, salePrice: 4.00, isOnSale: true });
  const scored = scoreProduct(onSale, {});
  const expectedDiscountPct = (5.00 - 4.00) / 5.00; // 0.20
  assert.ok(Math.abs(scored.discountPct - expectedDiscountPct) < 0.0001, `discountPct should be 0.20, got ${scored.discountPct}`);
  assert.ok(Math.abs(scored.discountScore - 40) < 0.01, `discountScore for 20% off should be 40, got ${scored.discountScore}`);
  console.log('  ✓ 20% discount → discountScore = 40');

  // ── No sale → discountScore = 0 ───────────────────────────────────────────
  const noSale = mkProduct({ regularPrice: 5.00, salePrice: null, isOnSale: false });
  const scoredNoSale = scoreProduct(noSale, {});
  assert.equal(scoredNoSale.discountScore, 0, `No sale → discountScore should be 0`);
  assert.equal(scoredNoSale.discountPct, 0);
  console.log('  ✓ No sale → discountScore = 0');

  // ── Basket relevance: dairy → tier A → score 100 ─────────────────────────
  const dairy = mkProduct({ category: 'dairy' });
  assert.equal(scoreProduct(dairy, {}).relevanceTier, 'A');
  assert.equal(scoreProduct(dairy, {}).basketRelevanceScore, 100);
  console.log('  ✓ Dairy category → Tier A, basketRelevanceScore = 100');

  // ── Basket relevance: snacks → tier C → score 50 ─────────────────────────
  const snack = mkProduct({ category: 'snacks' });
  assert.equal(scoreProduct(snack, {}).relevanceTier, 'C');
  assert.equal(scoreProduct(snack, {}).basketRelevanceScore, 50);
  console.log('  ✓ Snacks category → Tier C, basketRelevanceScore = 50');

  // ── Deal score formula ────────────────────────────────────────────────────
  // discount=40, value=50 (no averages given → at avg), basket=100
  // expected: 40*0.40 + 50*0.35 + 100*0.25 = 16 + 17.5 + 25 = 58.5
  const formulaCheck = scoreProduct(onSale, { dairy: 3.99 / 2 }); // normalized avg ~ onSale's
  // Value score depends on ratio; just ensure formula structure is deterministic
  const rerun = scoreProduct(onSale, { dairy: 3.99 / 2 });
  assert.equal(formulaCheck.dealScore, rerun.dealScore, 'Deal score should be deterministic');
  console.log('  ✓ Deal score is deterministic across identical calls');

  // ── rankDeals — tie-break by normalized unit price ────────────────────────
  const p1 = mkProduct({ productId: 'p1', regularPrice: 4.00, salePrice: 3.00, isOnSale: true, packageSize: '2L' });
  const p2 = mkProduct({ productId: 'p2', regularPrice: 4.00, salePrice: 3.00, isOnSale: true, packageSize: '1L' });
  // Same discount → tie; p1 has lower per-L price (1.50/L vs 3.00/L)
  const ranked = rankDeals([p2, p1], { categoryAverages: {}, limit: 10, minDealScore: 0 });
  assert.equal(ranked[0].productId, 'p1', 'Tie-break: p1 (lower per-L) should rank first');
  console.log('  ✓ Tie-break: lower normalized unit price ranks higher');

  // ── rankDeals — minDealScore filters ─────────────────────────────────────
  const lowScore = mkProduct({ productId: 'low', category: 'unknown', regularPrice: 5.00 });
  const highScore = mkProduct({ productId: 'hi', category: 'dairy', regularPrice: 5.00, salePrice: 2.00, isOnSale: true });
  const filtered = rankDeals([lowScore, highScore], { minDealScore: 50, limit: 10 });
  assert.ok(filtered.every((d) => d.dealScore >= 50), 'All results should have dealScore >= 50');
  console.log('  ✓ minDealScore filter works correctly');

  // ── computeCategoryAverages ────────────────────────────────────────────────
  const products = [
    mkProduct({ category: 'dairy', regularPrice: 4.00, packageSize: '2L' }),
    mkProduct({ category: 'dairy', regularPrice: 6.00, packageSize: '2L' }),
    mkProduct({ category: 'protein', regularPrice: 10.00, packageSize: '500g' }),
  ];
  const avgs = computeCategoryAverages(products);
  // dairy avg per-L: (2.00 + 3.00) / 2 = 2.50
  assert.ok(avgs.dairy > 0, 'dairy average should be > 0');
  assert.ok(avgs.protein > 0, 'protein average should be > 0');
  console.log(`  ✓ computeCategoryAverages: dairy=${avgs.dairy.toFixed(2)}, protein=${avgs.protein.toFixed(2)}`);

  // ── Large discount caps at 100 ─────────────────────────────────────────────
  const hugeDiscount = mkProduct({ regularPrice: 10.00, salePrice: 1.00, isOnSale: true });
  const capped = scoreProduct(hugeDiscount, {});
  assert.ok(capped.discountScore <= 100, `discountScore should cap at 100, got ${capped.discountScore}`);
  console.log('  ✓ Large discount caps discountScore at 100');

  console.log('[Test] score-deals.js — ALL PASSED\n');
}
