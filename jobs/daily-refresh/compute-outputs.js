/**
 * Compute Outputs Job
 * After snapshot, compute deal rankings, benchmark carts, and weekly carts — then persist them.
 */

import { searchProducts }          from '../../packages/integrations/pc-express/product-search.js';
import { CORE_SEARCH_TERMS }       from '../../packages/domain/catalog/core-search-terms.js';
import { rankDeals, computeCategoryAverages } from '../../packages/domain/deals/score-deals.js';
import { calculateAverageCart }    from '../../packages/domain/average-cart/calculate-average-cart.js';
import { generateWeeklyCart }      from '../../packages/domain/weekly-cart/generate-weekly-cart.js';
import {
  getStoresByPostalCode,
  getDealRankings,
  saveDealRankings,
  saveBenchmarkResult,
  saveWeeklyCartResult,
} from '../../packages/db/queries.js';

const HOUSEHOLD_SIZES = [1, 2, 4, 6];

/**
 * Run the compute-outputs job.
 * @param {import('better-sqlite3').Database} db
 * @param {Object} [options]
 * @param {string} [options.date]
 */
export async function runComputeOutputsJob(db, options = {}) {
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const searchTerms = CORE_SEARCH_TERMS.map((t) => t.term);

  const stores = getStoresByPostalCode(db, '');
  console.log(`[compute-job] Computing outputs for ${stores.length} stores on ${date}`);

  for (const store of stores) {
    const storeId = store.store_id;
    console.log(`[compute-job] Processing ${storeId}...`);

    // Fetch products fresh from adapter (mock returns same data as snapshot)
    const { products } = await searchProducts(storeId, searchTerms);

    // Normalise products to shape that domain functions expect
    const normalised = products.map((p) => ({
      ...p,
      id:    p.productId,
      price: p.salePrice ?? p.regularPrice,
    }));

    // ── Deal rankings ──────────────────────────────────────────────
    const categoryAverages = computeCategoryAverages(normalised);
    const deals            = rankDeals(normalised, { categoryAverages, limit: 50 });
    saveDealRankings(db, storeId, date, deals);
    console.log(`[compute-job]   ${deals.length} deals ranked`);

    // ── Benchmark + weekly carts ───────────────────────────────────
    for (const size of HOUSEHOLD_SIZES) {
      const avgCart    = calculateAverageCart(normalised, size, { date });
      const weeklyCart = generateWeeklyCart(normalised, size, { date });

      saveBenchmarkResult(db, storeId, date, size, avgCart);
      saveWeeklyCartResult(db, storeId, date, size, weeklyCart);
    }
    console.log(`[compute-job]   Cart outputs persisted for sizes [${HOUSEHOLD_SIZES.join(', ')}]`);
  }

  console.log('[compute-job] Done');
}
