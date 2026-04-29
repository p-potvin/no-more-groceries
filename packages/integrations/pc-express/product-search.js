import { ApifyClient } from 'apify-client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
});

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCache(key) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      if (Date.now() - stats.mtimeMs < CACHE_TTL_MS) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    }
  } catch (err) {}
  return null;
}

function setCache(key, data) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(data), 'utf8');
  } catch (err) {}
}

/**
 * PC Express Product Search Adapter
 * Mock implementation with realistic CAD grocery products, now with Apify fallback.
 */

/**
 * @typedef {Object} Product
 * @property {string} productId
 * @property {string} storeId
 * @property {string} name
 * @property {string} brand
 * @property {string} category
 * @property {string|null} packageSize
 * @property {string|null} unit
 * @property {number} regularPrice
 * @property {number|null} salePrice
 * @property {boolean} isOnSale
 * @property {string|null} promoDescription
 */

/** Store-level price adjustment multipliers */
const STORE_ADJUSTMENT = {
  'provigo-mile-end': 1.08,
  'maxi-rosemont': 0.96,
  'nofrills-plateau': 0.95,
  'nofrills-verdun': 0.94,
  'rcss-montreal-central': 1.00,
};

/** Base product catalog (prices at baseline store) */
const BASE_CATALOG = [
  // ── DAIRY ──────────────────────────────────────────────────────────────────
  { productId: 'd001', name: 'Beatrice Whole Milk 2L',      brand: 'Beatrice',       category: 'dairy',   packageSize: '2L',    unit: 'L',    regularPrice: 4.99, salePrice: 3.99, isOnSale: true,  promoDescription: 'Save $1.00' },
  { productId: 'd002', name: "PC Blue Menu 2% Milk 2L",     brand: 'PC Blue Menu',   category: 'dairy',   packageSize: '2L',    unit: 'L',    regularPrice: 4.79, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'd003', name: 'Store Brand Milk 4L',         brand: 'No Name',        category: 'dairy',   packageSize: '4L',    unit: 'L',    regularPrice: 7.49, salePrice: 6.49, isOnSale: true,  promoDescription: 'Weekly special' },
  { productId: 'd004', name: 'Lactantia Skim Milk 2L',      brand: 'Lactantia',      category: 'dairy',   packageSize: '2L',    unit: 'L',    regularPrice: 5.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'd005', name: 'Large White Eggs 12ct',       brand: 'No Name',        category: 'dairy',   packageSize: '12 pack', unit: 'each', regularPrice: 4.49, salePrice: 3.79, isOnSale: true, promoDescription: 'Save $0.70' },
  { productId: 'd006', name: 'Free Range Brown Eggs 12ct',  brand: 'Burnbrae',       category: 'dairy',   packageSize: '12 pack', unit: 'each', regularPrice: 5.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'd007', name: 'PC Organic Free Range Eggs',  brand: 'PC Organics',    category: 'dairy',   packageSize: '12 pack', unit: 'each', regularPrice: 7.49, salePrice: 6.49, isOnSale: true, promoDescription: 'Organic savings' },
  { productId: 'd008', name: 'Oikos Greek Yogurt 750g',     brand: 'Oikos',          category: 'dairy',   packageSize: '750g',  unit: 'g',    regularPrice: 6.49, salePrice: 4.99, isOnSale: true,  promoDescription: 'Big save' },
  { productId: 'd009', name: 'PC Greek Yogurt Plain 500g',  brand: 'PC',             category: 'dairy',   packageSize: '500g',  unit: 'g',    regularPrice: 3.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'd010', name: 'Liberté Greek Yogurt 650g',   brand: 'Liberté',        category: 'dairy',   packageSize: '650g',  unit: 'g',    regularPrice: 5.99, salePrice: 4.49, isOnSale: true,  promoDescription: 'Save $1.50' },
  { productId: 'd011', name: 'Cracker Barrel Cheddar 400g', brand: 'Cracker Barrel', category: 'dairy',   packageSize: '400g',  unit: 'g',    regularPrice: 7.99, salePrice: 6.49, isOnSale: true,  promoDescription: 'Save $1.50' },
  { productId: 'd012', name: 'No Name Cheddar Slices 200g', brand: 'No Name',        category: 'dairy',   packageSize: '200g',  unit: 'g',    regularPrice: 3.49, salePrice: null, isOnSale: false, promoDescription: null },

  // ── PROTEIN ────────────────────────────────────────────────────────────────
  { productId: 'p001', name: 'Chicken Breast Boneless 1kg', brand: 'No Name',        category: 'protein', packageSize: '1kg',   unit: 'kg',   regularPrice: 14.99, salePrice: 11.99, isOnSale: true, promoDescription: 'Save $3.00' },
  { productId: 'p002', name: 'Chicken Breast Family Pack',  brand: 'PC',             category: 'protein', packageSize: '2kg',   unit: 'kg',   regularPrice: 24.99, salePrice: 19.99, isOnSale: true, promoDescription: 'Family value' },
  { productId: 'p003', name: 'Chicken Thighs Bone-In 1.5kg',brand: 'No Name',       category: 'protein', packageSize: '1.5kg', unit: 'kg',   regularPrice: 10.99, salePrice: 8.99,  isOnSale: true, promoDescription: 'Save $2.00' },
  { productId: 'p004', name: 'Ground Beef Medium 500g',     brand: 'No Name',        category: 'protein', packageSize: '500g',  unit: 'g',    regularPrice: 8.99, salePrice: 7.49,  isOnSale: true, promoDescription: 'Save $1.50' },
  { productId: 'p005', name: 'Ground Beef Extra Lean 500g', brand: 'PC',             category: 'protein', packageSize: '500g',  unit: 'g',    regularPrice: 10.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'p006', name: 'Salmon Fillets 300g',         brand: 'PC',             category: 'protein', packageSize: '300g',  unit: 'g',    regularPrice: 12.99, salePrice: 10.99, isOnSale: true, promoDescription: 'Save $2.00' },
  { productId: 'p007', name: 'Tilapia Fillets 450g',        brand: 'No Name',        category: 'protein', packageSize: '450g',  unit: 'g',    regularPrice: 7.99, salePrice: null,  isOnSale: false, promoDescription: null },
  { productId: 'p008', name: 'Atlantic Salmon Portions 2pk',brand: 'PC Blue Menu',   category: 'protein', packageSize: '300g',  unit: 'g',    regularPrice: 14.99, salePrice: 11.99, isOnSale: true, promoDescription: 'Blue menu deal' },
  { productId: 'p009', name: 'Pork Chops Centre Cut 700g',  brand: 'No Name',        category: 'protein', packageSize: '700g',  unit: 'g',    regularPrice: 9.99, salePrice: 7.99,  isOnSale: true, promoDescription: 'Save $2.00' },

  // ── PRODUCE ────────────────────────────────────────────────────────────────
  { productId: 'r001', name: 'Bananas per bunch',            brand: '',               category: 'produce', packageSize: '1 bunch', unit: 'each', regularPrice: 1.99, salePrice: 1.69, isOnSale: true, promoDescription: 'Weekend special' },
  { productId: 'r002', name: 'Organic Bananas',              brand: 'PC Organics',    category: 'produce', packageSize: '1 bunch', unit: 'each', regularPrice: 2.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'r003', name: 'Baby Spinach 142g',            brand: 'No Name',        category: 'produce', packageSize: '142g',  unit: 'g',    regularPrice: 3.99, salePrice: 2.99, isOnSale: true, promoDescription: 'Save $1.00' },
  { productId: 'r004', name: 'Romaine Hearts 3pk',           brand: 'No Name',        category: 'produce', packageSize: '3 pack', unit: 'each', regularPrice: 4.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'r005', name: 'Iceberg Lettuce head',         brand: '',               category: 'produce', packageSize: '1 each', unit: 'each', regularPrice: 2.49, salePrice: 1.99, isOnSale: true, promoDescription: 'Fresh deal' },
  { productId: 'r006', name: 'Carrots 2lb bag',              brand: 'No Name',        category: 'produce', packageSize: '2lb',   unit: 'lb',   regularPrice: 2.49, salePrice: 1.99, isOnSale: true, promoDescription: 'Save $0.50' },
  { productId: 'r007', name: 'Baby Carrots 500g',            brand: 'PC',             category: 'produce', packageSize: '500g',  unit: 'g',    regularPrice: 3.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'r008', name: 'Gala Apples 5lb bag',          brand: '',               category: 'produce', packageSize: '5lb',   unit: 'lb',   regularPrice: 6.99, salePrice: 5.49, isOnSale: true, promoDescription: 'Save $1.50' },
  { productId: 'r009', name: 'Honeycrisp Apples 3lb',        brand: '',               category: 'produce', packageSize: '3lb',   unit: 'lb',   regularPrice: 7.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'r010', name: 'Blueberries 1 pint',           brand: '',               category: 'produce', packageSize: '170g',  unit: 'g',    regularPrice: 4.29, salePrice: 2.99, isOnSale: true, promoDescription: 'Berry savings' },

  // ── GRAINS ─────────────────────────────────────────────────────────────────
  { productId: 'g001', name: 'Dempsters Whole Wheat Bread', brand: "Dempster's",     category: 'grains',  packageSize: '675g',  unit: 'g',    regularPrice: 5.49, salePrice: 3.99, isOnSale: true, promoDescription: 'Save $1.50' },
  { productId: 'g002', name: 'No Name White Bread',          brand: 'No Name',        category: 'grains',  packageSize: '570g',  unit: 'g',    regularPrice: 2.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'g003', name: 'PC Organics Multigrain Bread', brand: 'PC Organics',   category: 'grains',  packageSize: '600g',  unit: 'g',    regularPrice: 6.99, salePrice: 5.49, isOnSale: true, promoDescription: 'Organic deal' },
  { productId: 'g004', name: 'No Name Long Grain White Rice 2kg', brand: 'No Name',  category: 'grains',  packageSize: '2kg',   unit: 'kg',   regularPrice: 5.49, salePrice: 4.49, isOnSale: true, promoDescription: 'Save $1.00' },
  { productId: 'g005', name: 'Uncle Bens Parboiled Rice 1kg', brand: "Uncle Ben's",  category: 'grains',  packageSize: '1kg',   unit: 'kg',   regularPrice: 4.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'g006', name: 'Barilla Penne 900g',           brand: 'Barilla',        category: 'grains',  packageSize: '900g',  unit: 'g',    regularPrice: 3.99, salePrice: 2.99, isOnSale: true, promoDescription: 'Save $1.00' },
  { productId: 'g007', name: 'No Name Spaghetti 900g',       brand: 'No Name',        category: 'grains',  packageSize: '900g',  unit: 'g',    regularPrice: 2.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'g008', name: 'Quaker Oats Large Flake 2kg',  brand: 'Quaker',         category: 'grains',  packageSize: '2kg',   unit: 'g',    regularPrice: 8.49, salePrice: 6.49, isOnSale: true, promoDescription: 'Save $2.00' },

  // ── PANTRY ─────────────────────────────────────────────────────────────────
  { productId: 'n001', name: 'Crisco Vegetable Oil 1.42L',   brand: 'Crisco',         category: 'pantry',  packageSize: '1.42L', unit: 'L',    regularPrice: 5.99, salePrice: 4.49, isOnSale: true, promoDescription: 'Save $1.50' },
  { productId: 'n002', name: 'No Name Canola Oil 2L',        brand: 'No Name',        category: 'pantry',  packageSize: '2L',    unit: 'L',    regularPrice: 6.49, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'n003', name: 'Hunt\'s Diced Tomatoes 796ml', brand: "Hunt's",         category: 'pantry',  packageSize: '796ml', unit: 'ml',   regularPrice: 2.49, salePrice: 1.99, isOnSale: true, promoDescription: 'Save $0.50' },
  { productId: 'n004', name: 'No Name Canned Diced Tomatoes',brand: 'No Name',        category: 'pantry',  packageSize: '796ml', unit: 'ml',   regularPrice: 1.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 'n005', name: 'PC Chickpeas 540ml',           brand: 'PC',             category: 'pantry',  packageSize: '540ml', unit: 'ml',   regularPrice: 1.99, salePrice: 1.49, isOnSale: true, promoDescription: 'Save $0.50' },
  { productId: 'n006', name: 'No Name Black Beans 540ml',    brand: 'No Name',        category: 'pantry',  packageSize: '540ml', unit: 'ml',   regularPrice: 1.49, salePrice: null, isOnSale: false, promoDescription: null },

  // ── SNACKS ─────────────────────────────────────────────────────────────────
  { productId: 's001', name: 'Nature Valley Granola Bars 10pk',brand: 'Nature Valley', category: 'snacks', packageSize: '230g',  unit: 'g',    regularPrice: 5.49, salePrice: 3.99, isOnSale: true, promoDescription: 'Save $1.50' },
  { productId: 's002', name: 'PC Blue Menu Granola Bars 8pk', brand: 'PC Blue Menu',  category: 'snacks',  packageSize: '200g',  unit: 'g',    regularPrice: 4.99, salePrice: null, isOnSale: false, promoDescription: null },
  { productId: 's003', name: 'No Name Crackers 450g',         brand: 'No Name',        category: 'snacks',  packageSize: '450g',  unit: 'g',    regularPrice: 3.49, salePrice: 2.99, isOnSale: true, promoDescription: 'Save $0.50' },

  // ── HOUSEHOLD ──────────────────────────────────────────────────────────────
  { productId: 'h001', name: 'Dawn Dish Soap 532ml',          brand: 'Dawn',           category: 'household', packageSize: '532ml', unit: 'ml', regularPrice: 5.99, salePrice: 4.49, isOnSale: true, promoDescription: 'Save $1.50' },
  { productId: 'h002', name: 'No Name Dish Soap 500ml',       brand: 'No Name',        category: 'household', packageSize: '500ml', unit: 'ml', regularPrice: 2.99, salePrice: null,  isOnSale: false, promoDescription: null },
  { productId: 'h003', name: 'Bounty Paper Towels 6 rolls',   brand: 'Bounty',         category: 'household', packageSize: '6 roll', unit: 'each', regularPrice: 12.99, salePrice: 9.99, isOnSale: true, promoDescription: 'Save $3.00' },
  { productId: 'h004', name: 'No Name Paper Towels 4 roll',   brand: 'No Name',        category: 'household', packageSize: '4 roll', unit: 'each', regularPrice: 5.49, salePrice: null, isOnSale: false, promoDescription: null },
];

/** Keywords → product IDs mapping for search acceleration */
const KEYWORD_INDEX = new Map();
for (const p of BASE_CATALOG) {
  const keys = [p.name, p.brand, p.category, p.productId, ...(p.packageSize ? [p.packageSize] : [])];
  for (const key of keys) {
    for (const word of key.toLowerCase().split(/\s+/)) {
      if (!KEYWORD_INDEX.has(word)) KEYWORD_INDEX.set(word, new Set());
      KEYWORD_INDEX.get(word).add(p.productId);
    }
  }
}

/**
 * Apply store-level price adjustment and attach storeId.
 * @param {typeof BASE_CATALOG[0]} product
 * @param {string} storeId
 * @returns {Product}
 */
function applyStoreAdjustment(product, storeId) {
  const factor = STORE_ADJUSTMENT[storeId] ?? 1.0;
  const regularPrice = Number((product.regularPrice * factor).toFixed(2));
  const salePrice = product.salePrice != null ? Number((product.salePrice * factor).toFixed(2)) : null;

  return {
    productId: product.productId,
    storeId,
    name: product.name,
    brand: product.brand,
    category: product.category,
    packageSize: product.packageSize,
    unit: product.unit,
    regularPrice,
    salePrice,
    isOnSale: product.isOnSale,
    promoDescription: product.promoDescription,
  };
}

/**
 * Search products for a store using search terms.
 * @param {string} storeId
 * @param {string[]} searchTerms
 * @param {Object} [options]
 * @returns {Promise<{ products: Product[], storeId: string, searchTerms: string[], _isMock: true }>}
 */
export async function searchProducts(storeId, searchTerms, options = {}) {
  if (!storeId) {
    const err = new Error('storeId is required');
    err.code = 'INVALID_INPUT';
    throw err;
  }
    
    try {
      if (process.env.APIFY_TOKEN || process.env.APIFY_API_KEY) {
        const termsArray = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
        const termsHash = crypto.createHash('md5').update(termsArray.sort().join(',')).digest('hex');
        const cacheKey = `products_${storeId.replace(/[^a-zA-Z0-9]/g, '_')}_${termsHash}`;
        
        const cachedProducts = getCache(cacheKey);
        if (cachedProducts) {
          console.log(`[apify] Returning cached products for store ${storeId}`);
          return { products: cachedProducts, storeId, searchTerms, _isMock: false };
        }

        console.log(`[apify] Searching items in Loblaws store ${storeId} using sunny_eternity/loblaws-grocery-scraper`);
        
        let banner = "superstore";
        // Attempt to auto-infer from store ID prefixes if the caller mapped them
        if (storeId.toUpperCase().includes('NOFRILLS')) banner = "nofrills";

        const run = await client.actor("sunny_eternity/loblaws-grocery-scraper").call({
          banner,
          locationId: storeId.replace("apify-", "").substring(0, 4), // Very loose fallback mapped to 4-digit ID
          search_terms: termsArray
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
          const products = items.map(p => ({
            productId: p.productId || p.itemNumber,
            storeId,
            name: p.name,
            brand: p.brand || "\u003cUnknown\u003e",
            category: p.breadcrumbs?.[0] || "\u003cUnknown\u003e",
            packageSize: p.packageSize || null,
            unit: p.unit || null,
            regularPrice: p.regularPrice || p.price,
            salePrice: p.salePrice || null,
            isOnSale: !!p.salePrice && p.salePrice < (p.regularPrice || p.price),
            promoDescription: p.promoText || null,
          }));

          setCache(cacheKey, products);
          return { products, storeId, searchTerms, _isMock: false };
        }
        console.log(`[apify] No live products found via Apify for store ${storeId}, falling back to static mocks.`);
      }
    } catch (err) {
      console.error(`[apify] Agent run failed during live product search: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 0));

    const matchedIds = new Set();
    
    for (const term of searchTerms) {
      const words = term.toLowerCase().split(/\s+/);
      for (const word of words) {
        const ids = KEYWORD_INDEX.get(word);
        if (ids) ids.forEach((id) => matchedIds.add(id));
      }
    }

    // If no terms given, return all products
    const candidates = matchedIds.size > 0
      ? BASE_CATALOG.filter((p) => matchedIds.has(p.productId))
      : BASE_CATALOG;

    const products = candidates.map((p) => applyStoreAdjustment(p, storeId));

    return { products, storeId, searchTerms, _isMock: true };
  }

  /**
   * Fetch a single product by ID for a given store.
   * @param {string} storeId
   * @param {string} productId
   * @returns {Promise<Product|null>}
   */
export async function getProductById(storeId, productId) {
    await new Promise((r) => setTimeout(r, 0));
    const base = BASE_CATALOG.find((p) => p.productId === productId);
    if (!base) return null;
    return applyStoreAdjustment(base, storeId);
  }

  export { BASE_CATALOG, STORE_ADJUSTMENT };
