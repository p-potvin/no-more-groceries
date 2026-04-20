import assert from 'node:assert/strict';
import { searchProducts, getProductById } from '../product-search.js';

export async function runTests() {
  console.log('[Test] product-search.js');

  // 1. Empty storeId throws
  try {
    await searchProducts('', ['milk']);
    assert.fail('Should have thrown');
  } catch (e) {
    assert.equal(e.code, 'INVALID_INPUT');
    console.log('  ✓ Empty storeId throws INVALID_INPUT');
  }

  // 2. Valid search returns products
  const result = await searchProducts('rcss-montreal-central', ['milk', 'chicken', 'bread']);
  assert.ok(Array.isArray(result.products));
  assert.ok(result.products.length > 0, 'Should find products for milk/chicken/bread');
  assert.equal(result._isMock, true);
  console.log(`  ✓ searchProducts returns ${result.products.length} products`);

  // 3. Each product has required fields
  for (const p of result.products) {
    assert.ok(p.productId,      `Missing productId: ${p.name}`);
    assert.ok(p.name,           `Missing name`);
    assert.ok(p.storeId,        `Missing storeId`);
    assert.ok(typeof p.regularPrice === 'number', `regularPrice should be number for ${p.name}`);
    assert.ok(p.regularPrice > 0, `regularPrice should be positive for ${p.name}`);
  }
  console.log('  ✓ All products have required fields');

  // 4. Store price adjustment applied (Provigo = +8%)
  const rcss    = await searchProducts('rcss-montreal-central', ['milk']);
  const provigo = await searchProducts('provigo-mile-end',      ['milk']);

  const milkRcss    = rcss.products.find((p) => p.name.toLowerCase().includes('milk'));
  const milkProvigo = provigo.products.find((p) => p.name.toLowerCase().includes('milk'));

  if (milkRcss && milkProvigo) {
    assert.ok(
      milkProvigo.regularPrice > milkRcss.regularPrice,
      `Provigo (${milkProvigo.regularPrice}) should be more than RCSS (${milkRcss.regularPrice})`
    );
    console.log(`  ✓ Provigo price adjustment: $${milkProvigo.regularPrice} > RCSS $${milkRcss.regularPrice}`);
  }

  // 5. No Frills is cheaper than baseline
  const nofrills = await searchProducts('nofrills-plateau', ['milk']);
  const milkNF   = nofrills.products.find((p) => p.name.toLowerCase().includes('milk'));
  if (milkNF && milkRcss) {
    assert.ok(
      milkNF.regularPrice < milkRcss.regularPrice,
      `No Frills (${milkNF.regularPrice}) should be less than RCSS (${milkRcss.regularPrice})`
    );
    console.log(`  ✓ No Frills price adjustment: $${milkNF.regularPrice} < RCSS $${milkRcss.regularPrice}`);
  }

  // 6. Empty search terms returns all products
  const all = await searchProducts('rcss-montreal-central', []);
  assert.ok(all.products.length >= 20, 'Empty search should return all products (>=20)');
  console.log(`  ✓ Empty search returns all ${all.products.length} products`);

  // 7. getProductById
  const p = await getProductById('rcss-montreal-central', 'd001');
  assert.ok(p !== null, 'Should find product d001');
  assert.equal(p.storeId, 'rcss-montreal-central');
  console.log('  ✓ getProductById returns correct product');

  const missing = await getProductById('rcss-montreal-central', 'nonexistent');
  assert.equal(missing, null);
  console.log('  ✓ getProductById returns null for unknown id');

  console.log('[Test] product-search.js — ALL PASSED\n');
}
