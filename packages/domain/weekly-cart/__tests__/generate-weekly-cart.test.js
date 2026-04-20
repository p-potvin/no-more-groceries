import assert from 'node:assert/strict';
import { generateWeeklyCart } from '../generate-weekly-cart.js';
import { CATEGORIES } from '../../catalog/core-search-terms.js';

const MOCK_PRODUCTS = [
  { productId: 'd001', name: 'Beatrice Whole Milk 2L',          category: 'dairy',     regularPrice: 4.99, salePrice: 3.99, isOnSale: true,  packageSize: '2L',      id: 'd001', price: 3.99 },
  { productId: 'd002', name: "PC Blue Menu 2% Milk 2L",         category: 'dairy',     regularPrice: 4.79, salePrice: null, isOnSale: false, packageSize: '2L',      id: 'd002', price: 4.79 },
  { productId: 'd005', name: 'Large White Eggs 12ct',            category: 'dairy',     regularPrice: 4.49, salePrice: 3.79, isOnSale: true,  packageSize: '12 pack', id: 'd005', price: 3.79 },
  { productId: 'd008', name: 'Oikos Greek Yogurt 750g',          category: 'dairy',     regularPrice: 6.49, salePrice: 4.99, isOnSale: true,  packageSize: '750g',    id: 'd008', price: 4.99 },
  { productId: 'd011', name: 'Cracker Barrel Cheddar 400g',      category: 'dairy',     regularPrice: 7.99, salePrice: 6.49, isOnSale: true,  packageSize: '400g',    id: 'd011', price: 6.49 },
  { productId: 'p001', name: 'Chicken Breast Boneless 1kg',      category: 'protein',   regularPrice: 14.99, salePrice: 11.99, isOnSale: true, packageSize: '1kg',   id: 'p001', price: 11.99 },
  { productId: 'p004', name: 'Ground Beef Medium 500g',          category: 'protein',   regularPrice: 8.99,  salePrice: 7.49, isOnSale: true,  packageSize: '500g',  id: 'p004', price: 7.49 },
  { productId: 'p006', name: 'Salmon Fillets 300g',              category: 'protein',   regularPrice: 12.99, salePrice: 10.99, isOnSale: true, packageSize: '300g',  id: 'p006', price: 10.99 },
  { productId: 'r001', name: 'Bananas per bunch',                category: 'produce',   regularPrice: 1.99,  salePrice: 1.69, isOnSale: true,  packageSize: '1 bunch', id: 'r001', price: 1.69 },
  { productId: 'r003', name: 'Baby Spinach 142g',                category: 'produce',   regularPrice: 3.99,  salePrice: 2.99, isOnSale: true,  packageSize: '142g',  id: 'r003', price: 2.99 },
  { productId: 'r006', name: 'Carrots 2lb bag',                  category: 'produce',   regularPrice: 2.49,  salePrice: null, isOnSale: false, packageSize: '2lb',   id: 'r006', price: 2.49 },
  { productId: 'r008', name: 'Gala Apples 5lb bag',              category: 'produce',   regularPrice: 6.99,  salePrice: 5.49, isOnSale: true,  packageSize: '5lb',   id: 'r008', price: 5.49 },
  { productId: 'g001', name: "Dempsters Whole Wheat Bread",      category: 'grains',    regularPrice: 5.49,  salePrice: 3.99, isOnSale: true,  packageSize: '675g',  id: 'g001', price: 3.99 },
  { productId: 'g004', name: 'No Name Long Grain White Rice 2kg',category: 'grains',    regularPrice: 5.49,  salePrice: 4.49, isOnSale: true,  packageSize: '2kg',   id: 'g004', price: 4.49 },
  { productId: 'g006', name: 'Barilla Penne 900g',               category: 'grains',    regularPrice: 3.99,  salePrice: 2.99, isOnSale: true,  packageSize: '900g',  id: 'g006', price: 2.99 },
  { productId: 'n001', name: 'Crisco Vegetable Oil 1.42L',       category: 'pantry',    regularPrice: 5.99,  salePrice: 4.49, isOnSale: true,  packageSize: '1.42L', id: 'n001', price: 4.49 },
  { productId: 'n003', name: "Hunt's Diced Tomatoes 796ml",      category: 'pantry',    regularPrice: 2.49,  salePrice: 1.99, isOnSale: true,  packageSize: '796ml', id: 'n003', price: 1.99 },
  { productId: 'n005', name: 'PC Chickpeas 540ml',               category: 'pantry',    regularPrice: 1.99,  salePrice: 1.49, isOnSale: true,  packageSize: '540ml', id: 'n005', price: 1.49 },
  { productId: 's001', name: 'Nature Valley Granola Bars',        category: 'snacks',    regularPrice: 5.49,  salePrice: 3.99, isOnSale: true,  packageSize: '230g',  id: 's001', price: 3.99 },
  { productId: 'h001', name: 'Dawn Dish Soap 532ml',             category: 'household', regularPrice: 5.99,  salePrice: 4.49, isOnSale: true,  packageSize: '532ml', id: 'h001', price: 4.49 },
  { productId: 'h003', name: 'Bounty Paper Towels 6 rolls',      category: 'household', regularPrice: 12.99, salePrice: 9.99, isOnSale: true,  packageSize: '6 roll', id: 'h003', price: 9.99 },
];

export async function runTests() {
  console.log('[Test] generate-weekly-cart.js');

  // 1. Returns required shape
  const cart = generateWeeklyCart(MOCK_PRODUCTS, 2);
  assert.ok(typeof cart.householdSize === 'number');
  assert.ok(['high', 'medium', 'low'].includes(cart.confidenceLevel), `Invalid confidenceLevel: ${cart.confidenceLevel}`);
  assert.ok(typeof cart.categoryCoverage === 'object');
  assert.ok(typeof cart.total === 'number' && cart.total >= 0);
  assert.equal(cart.currency, 'CAD');
  assert.ok(Array.isArray(cart.lineItems));
  console.log('  ✓ Returns correct shape');

  // 2. All CATEGORIES represented in categoryCoverage
  for (const cat of CATEGORIES) {
    assert.ok(cat in cart.categoryCoverage, `Category "${cat}" missing from categoryCoverage`);
  }
  console.log('  ✓ All categories present in categoryCoverage');

  // 3. With full product catalog → all categories covered
  for (const cat of CATEGORIES) {
    assert.equal(cart.categoryCoverage[cat], true, `Category "${cat}" should be covered with full catalog`);
  }
  console.log('  ✓ All categories covered with full mock catalog');

  // 4. Best-value selection: prefers cheaper milk over more expensive milk
  const twoMilks = [
    { ...MOCK_PRODUCTS[0], productId: 'cheap-milk', name: 'Discount Milk 2L', salePrice: 2.50, price: 2.50 },
    { ...MOCK_PRODUCTS[0], productId: 'expensive-milk', name: 'Premium Milk 2L', salePrice: 5.00, price: 5.00 },
  ];
  const cartBestValue = generateWeeklyCart(twoMilks, 1);
  const milkItem = cartBestValue.lineItems.find((i) => i.canonicalItem === 'milk');
  if (milkItem && milkItem.matchType !== 'unavailable') {
    assert.equal(milkItem.matchedProductId, 'cheap-milk', 'Should pick cheaper milk');
    console.log('  ✓ Best-value: selects cheaper milk option');
  }

  // 5. Confidence level: empty catalog → 'low'
  const emptyCoverage = generateWeeklyCart([], 1);
  assert.equal(emptyCoverage.confidenceLevel, 'low');
  assert.equal(emptyCoverage.total, 0);
  const allUnavail = emptyCoverage.categoryCoverage;
  assert.ok(Object.values(allUnavail).every((v) => v === false), 'All categories should be uncovered');
  console.log('  ✓ Empty catalog → low confidence, all categories uncovered');

  // 6. Quantity scaling: size-4 should have larger milk quantity than size-1
  const cart1 = generateWeeklyCart(MOCK_PRODUCTS, 1);
  const cart4 = generateWeeklyCart(MOCK_PRODUCTS, 4);
  const m1 = cart1.lineItems.find((i) => i.canonicalItem === 'milk');
  const m4 = cart4.lineItems.find((i) => i.canonicalItem === 'milk');
  if (m1 && m4 && m1.matchType !== 'unavailable' && m4.matchType !== 'unavailable') {
    assert.ok(m4.quantity >= m1.quantity, `Size-4 milk (${m4.quantity}) should be >= size-1 (${m1.quantity})`);
    console.log(`  ✓ Quantity scaling: milk qty@1=${m1.quantity}, @4=${m4.quantity}`);
  }

  // 7. selectionExplanation present on matched items
  const explained = cart.lineItems.filter((i) => i.matchType !== 'unavailable' && i.selectionExplanation);
  assert.ok(explained.length > 0, 'At least some lineItems should have selectionExplanation');
  console.log(`  ✓ ${explained.length} items have selectionExplanation`);

  // 8. Substitution occurs for unavailable category items
  const noProtein = MOCK_PRODUCTS.filter((p) => p.category !== 'protein');
  const cartNoProtein = generateWeeklyCart(noProtein, 1);
  // With no protein products, protein-slot items should be 'substitute' or 'unavailable'
  const proteinItems = cartNoProtein.lineItems.filter((i) => i.category === 'protein');
  assert.ok(proteinItems.every((i) => i.matchType === 'substitute' || i.matchType === 'unavailable'),
    'Protein items should be substitute or unavailable when no protein products exist');
  console.log('  ✓ Substitution/unavailable correctly applied when category missing');

  console.log('[Test] generate-weekly-cart.js — ALL PASSED\n');
}
