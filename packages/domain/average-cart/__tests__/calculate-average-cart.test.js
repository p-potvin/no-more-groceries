import assert from 'node:assert/strict';
import { calculateAverageCart } from '../calculate-average-cart.js';
import { CORE_SEARCH_TERMS } from '../../catalog/core-search-terms.js';

/** Minimal mock products to satisfy most basket slots */
const MOCK_PRODUCTS = [
  { productId: 'd001', name: 'Beatrice Whole Milk 2L',       category: 'dairy',     regularPrice: 4.99, salePrice: 3.99, isOnSale: true,  packageSize: '2L'    },
  { productId: 'd005', name: 'Large White Eggs 12ct',        category: 'dairy',     regularPrice: 4.49, salePrice: 3.79, isOnSale: true,  packageSize: '12 pack'},
  { productId: 'd008', name: 'Oikos Greek Yogurt 750g',      category: 'dairy',     regularPrice: 6.49, salePrice: 4.99, isOnSale: true,  packageSize: '750g'  },
  { productId: 'd011', name: 'Cracker Barrel Cheddar 400g',  category: 'dairy',     regularPrice: 7.99, salePrice: 6.49, isOnSale: true,  packageSize: '400g'  },
  { productId: 'p001', name: 'Chicken Breast Boneless 1kg',  category: 'protein',   regularPrice: 14.99, salePrice: 11.99, isOnSale: true, packageSize: '1kg'  },
  { productId: 'p004', name: 'Ground Beef Medium 500g',      category: 'protein',   regularPrice: 8.99,  salePrice: 7.49,  isOnSale: true, packageSize: '500g' },
  { productId: 'p006', name: 'Salmon Fillets 300g',          category: 'protein',   regularPrice: 12.99, salePrice: 10.99, isOnSale: true, packageSize: '300g' },
  { productId: 'r001', name: 'Bananas per bunch',            category: 'produce',   regularPrice: 1.99,  salePrice: 1.69,  isOnSale: true, packageSize: '1 bunch'},
  { productId: 'r003', name: 'Baby Spinach 142g',            category: 'produce',   regularPrice: 3.99,  salePrice: 2.99,  isOnSale: true, packageSize: '142g' },
  { productId: 'r006', name: 'Carrots 2lb bag',              category: 'produce',   regularPrice: 2.49,  salePrice: null,  isOnSale: false, packageSize: '2lb' },
  { productId: 'r008', name: 'Gala Apples 5lb bag',          category: 'produce',   regularPrice: 6.99,  salePrice: 5.49,  isOnSale: true, packageSize: '5lb'  },
  { productId: 'g001', name: "Dempsters Whole Wheat Bread",  category: 'grains',    regularPrice: 5.49,  salePrice: 3.99,  isOnSale: true, packageSize: '675g' },
  { productId: 'g004', name: 'No Name Long Grain White Rice 2kg', category: 'grains', regularPrice: 5.49, salePrice: 4.49, isOnSale: true, packageSize: '2kg' },
  { productId: 'g006', name: 'Barilla Penne 900g',           category: 'grains',    regularPrice: 3.99,  salePrice: 2.99,  isOnSale: true, packageSize: '900g' },
  { productId: 'n001', name: 'Crisco Vegetable Oil 1.42L',   category: 'pantry',    regularPrice: 5.99,  salePrice: 4.49,  isOnSale: true, packageSize: '1.42L'},
  { productId: 'n003', name: "Hunt's Diced Tomatoes 796ml",  category: 'pantry',    regularPrice: 2.49,  salePrice: 1.99,  isOnSale: true, packageSize: '796ml'},
  { productId: 'n005', name: 'PC Chickpeas 540ml',           category: 'pantry',    regularPrice: 1.99,  salePrice: 1.49,  isOnSale: true, packageSize: '540ml'},
  { productId: 's001', name: 'Nature Valley Granola Bars',   category: 'snacks',    regularPrice: 5.49,  salePrice: 3.99,  isOnSale: true, packageSize: '230g' },
  { productId: 'h001', name: 'Dawn Dish Soap 532ml',         category: 'household', regularPrice: 5.99,  salePrice: 4.49,  isOnSale: true, packageSize: '532ml'},
  { productId: 'h003', name: 'Bounty Paper Towels 6 rolls',  category: 'household', regularPrice: 12.99, salePrice: 9.99,  isOnSale: true, packageSize: '6 roll'},
].map((p) => ({ ...p, id: p.productId, price: p.salePrice ?? p.regularPrice }));

export async function runTests() {
  console.log('[Test] calculate-average-cart.js');

  // 1. Returns required shape
  const cart1 = calculateAverageCart(MOCK_PRODUCTS, 1);
  assert.ok(cart1.householdSize === 1, 'householdSize should be 1');
  assert.ok(Array.isArray(cart1.lineItems), 'lineItems should be array');
  assert.ok(typeof cart1.total === 'number', 'total should be number');
  assert.ok(typeof cart1.coverageScore === 'number', 'coverageScore should be number');
  assert.equal(cart1.currency, 'CAD');
  assert.equal(cart1.basketVersion, 'benchmark-v1');
  console.log('  ✓ Returns correct shape for household size 1');

  // 2. Quantity scaling: size-4 milk quantity = 3× size-1 (factor 3 vs 1)
  const cart4 = calculateAverageCart(MOCK_PRODUCTS, 4);
  const milk1 = cart1.lineItems.find((i) => i.canonicalItem === 'milk');
  const milk4 = cart4.lineItems.find((i) => i.canonicalItem === 'milk');
  if (milk1 && milk4 && milk1.matchType !== 'unavailable' && milk4.matchType !== 'unavailable') {
    // factor(4) = 4 * 0.75 = 3 → milk quantity should be 3× household-1
    assert.ok(milk4.quantity > milk1.quantity, `milk quantity for 4 (${milk4.quantity}) should exceed 1 (${milk1.quantity})`);
    console.log(`  ✓ milk: qty@1=${milk1.quantity}, qty@4=${milk4.quantity}`);
  }

  // 3. Custom household size (3) scales correctly (factor = 3 * 0.75 = 2.25 → ceil ≥ 2)
  const cart3 = calculateAverageCart(MOCK_PRODUCTS, 3);
  assert.equal(cart3.householdSize, 3);
  assert.ok(cart3.total > 0, 'total should be > 0');
  console.log(`  ✓ Custom size 3: total = $${cart3.total}`);

  // 4. Coverage score > 0 with good products
  assert.ok(cart1.coverageScore > 0, 'coverageScore should be > 0 with mock products');
  assert.ok(cart1.coverageScore <= 1, 'coverageScore should be <= 1');
  console.log(`  ✓ coverageScore = ${(cart1.coverageScore * 100).toFixed(0)}%`);

  // 5. Empty products → all unavailable, coverage = 0
  const emptyCart = calculateAverageCart([], 1);
  assert.equal(emptyCart.coverageScore, 0);
  assert.equal(emptyCart.total, 0);
  assert.ok(emptyCart.lineItems.every((i) => i.matchType === 'unavailable'), 'All items should be unavailable');
  console.log('  ✓ Empty products → coverageScore = 0, all unavailable');

  // 6. lineItems count matches CORE_SEARCH_TERMS
  assert.equal(cart1.lineItems.length, CORE_SEARCH_TERMS.length, 'Should have one lineItem per core term');
  console.log(`  ✓ lineItems.length = ${cart1.lineItems.length} (matches CORE_SEARCH_TERMS)`);

  // 7. Total is sum of lineTotals
  const summedTotal = cart1.lineItems.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
  assert.ok(Math.abs(cart1.total - summedTotal) < 0.01, `total mismatch: ${cart1.total} vs ${summedTotal}`);
  console.log(`  ✓ total correctly sums lineItems`);

  console.log('[Test] calculate-average-cart.js — ALL PASSED\n');
}
