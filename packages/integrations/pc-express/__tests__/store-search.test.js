import assert from 'node:assert/strict';
import { searchStoresByPostalCode, getStoreById } from '../store-search.js';

export async function runTests() {
  console.log('[Test] store-search.js');

  // 1. Empty postal code throws
  try {
    await searchStoresByPostalCode('');
    assert.fail('Should have thrown on empty postal code');
  } catch (e) {
    assert.equal(e.code, 'INVALID_INPUT', 'Error code should be INVALID_INPUT');
    console.log('  ✓ Empty postal code throws INVALID_INPUT');
  }

  // 2. Whitespace-only postal code throws
  try {
    await searchStoresByPostalCode('   ');
    assert.fail('Should have thrown');
  } catch (e) {
    assert.equal(e.code, 'INVALID_INPUT');
    console.log('  ✓ Whitespace postal code throws INVALID_INPUT');
  }

  // 3. Valid postal code returns stores
  const result = await searchStoresByPostalCode('H2X 1Y4');
  assert.ok(Array.isArray(result.stores), 'stores should be an array');
  assert.ok(result.stores.length > 0, 'Should return at least one store');
  assert.equal(result._isMock, true, 'Should be marked as mock');
  console.log(`  ✓ Returns ${result.stores.length} stores for H2X 1Y4`);

  // 4. Each store has required fields
  for (const store of result.stores) {
    assert.ok(store.id,     `Store missing id: ${JSON.stringify(store)}`);
    assert.ok(store.banner, `Store missing banner`);
    assert.ok(store.name,   `Store missing name`);
  }
  console.log('  ✓ All stores have id, banner, name');

  // 5. getStoreById returns store or null
  const s = await getStoreById('rcss-montreal-central');
  assert.ok(s !== null, 'Should find known store');
  assert.equal(s.id, 'rcss-montreal-central');
  console.log('  ✓ getStoreById returns correct store');

  const missing = await getStoreById('nonexistent-id');
  assert.equal(missing, null, 'Should return null for unknown id');
  console.log('  ✓ getStoreById returns null for unknown id');

  // 6. Postal code is normalized
  const r2 = await searchStoresByPostalCode('h2x1y4');
  assert.equal(r2.postalCode, 'H2X1Y4');
  console.log('  ✓ Postal code is normalized');

  console.log('[Test] store-search.js — ALL PASSED\n');
}
