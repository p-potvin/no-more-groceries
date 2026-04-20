import assert from 'node:assert/strict';
import { normalizeUnitPrice, parsePackageSize, isLiquidUnit, isWeightUnit } from '../unit-normalization.js';

export async function runTests() {
  console.log('[Test] unit-normalization.js');

  // ── parsePackageSize ─────────────────────────────────────────────────────
  const cases = [
    ['2L',       { quantity: 2,   unit: 'l' }],
    ['500g',     { quantity: 500, unit: 'g' }],
    ['12 pack',  { quantity: 12,  unit: 'pack' }],
    ['1.42L',    { quantity: 1.42, unit: 'l' }],
    ['4 roll',   { quantity: 4,   unit: 'roll' }],
    ['1kg',      { quantity: 1,   unit: 'kg' }],
    [null,       null],
    ['abc',      null],
    ['',         null],
  ];

  for (const [input, expected] of cases) {
    const result = parsePackageSize(input);
    if (expected === null) {
      assert.equal(result, null, `parsePackageSize(${JSON.stringify(input)}) should be null`);
    } else {
      assert.ok(result !== null, `parsePackageSize("${input}") should not be null`);
      assert.equal(result.quantity, expected.quantity, `quantity mismatch for "${input}"`);
      assert.equal(result.unit, expected.unit, `unit mismatch for "${input}"`);
    }
  }
  console.log('  ✓ parsePackageSize handles all cases');

  // ── isLiquidUnit / isWeightUnit ───────────────────────────────────────────
  assert.equal(isLiquidUnit('L'), true);
  assert.equal(isLiquidUnit('ml'), true);
  assert.equal(isLiquidUnit('g'), false);
  assert.equal(isWeightUnit('g'), true);
  assert.equal(isWeightUnit('kg'), true);
  assert.equal(isWeightUnit('L'), false);
  console.log('  ✓ isLiquidUnit / isWeightUnit correct');

  // ── normalizeUnitPrice — 2L milk ─────────────────────────────────────────
  const milk = { regularPrice: 4.99, salePrice: 3.99, packageSize: '2L', unit: 'L' };
  const n1   = normalizeUnitPrice(milk);
  assert.equal(n1.effectivePrice, 3.99, 'Should use sale price');
  assert.equal(n1.normalizedUnitLabel, 'per L');
  assert.ok(Math.abs(n1.normalizedUnitPrice - 1.995) < 0.001, `Per-L price should be ~1.995, got ${n1.normalizedUnitPrice}`);
  console.log('  ✓ 2L milk: per-L normalization correct');

  // ── normalizeUnitPrice — 500g yogurt ─────────────────────────────────────
  const yogurt = { regularPrice: 3.99, salePrice: null, packageSize: '500g', unit: 'g' };
  const n2     = normalizeUnitPrice(yogurt);
  assert.equal(n2.effectivePrice, 3.99);
  assert.equal(n2.normalizedUnitLabel, 'per 100g');
  assert.ok(Math.abs(n2.normalizedUnitPrice - (3.99 / 500 * 100)) < 0.001, `per-100g should be ~${(3.99/500*100).toFixed(4)}`);
  console.log('  ✓ 500g yogurt: per-100g normalization correct');

  // ── normalizeUnitPrice — 12 pack eggs ────────────────────────────────────
  const eggs = { regularPrice: 4.49, salePrice: 3.79, packageSize: '12 pack', unit: 'each' };
  const n3   = normalizeUnitPrice(eggs);
  assert.equal(n3.effectivePrice, 3.79);
  assert.ok(n3.normalizedUnitLabel.startsWith('per'), `Label should start with "per": ${n3.normalizedUnitLabel}`);
  assert.ok(Math.abs(n3.normalizedUnitPrice - (3.79 / 12)) < 0.001, 'Per-each price should be ~0.3158');
  console.log('  ✓ 12 pack eggs: per-each normalization correct');

  // ── normalizeUnitPrice — null packageSize fallback ───────────────────────
  const bare = { regularPrice: 5.00, salePrice: null, packageSize: null };
  const n4   = normalizeUnitPrice(bare);
  assert.equal(n4.normalizedUnitLabel, 'each');
  assert.equal(n4.normalizedUnitPrice, 5.00);
  console.log('  ✓ null packageSize falls back to "each"');

  // ── effectivePrice uses salePrice when present ────────────────────────────
  const withSale = { regularPrice: 10.00, salePrice: 7.00, packageSize: '1kg' };
  const n5 = normalizeUnitPrice(withSale);
  assert.equal(n5.effectivePrice, 7.00, 'Should use salePrice as effective price');
  console.log('  ✓ effectivePrice correctly picks salePrice over regularPrice');

  console.log('[Test] unit-normalization.js — ALL PASSED\n');
}
