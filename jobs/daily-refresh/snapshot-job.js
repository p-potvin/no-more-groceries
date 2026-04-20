/**
 * Daily Snapshot Job
 * Fetches product data from PC Express adapters and persists to DB.
 */

import { searchStoresByPostalCode } from '../../packages/integrations/pc-express/store-search.js';
import { searchProducts }           from '../../packages/integrations/pc-express/product-search.js';
import { CORE_SEARCH_TERMS }        from '../../packages/domain/catalog/core-search-terms.js';
import {
  upsertStore,
  upsertProduct,
  insertPriceSnapshot,
  saveRefreshRun,
  updateRefreshRun,
} from '../../packages/db/queries.js';

/**
 * Run the daily snapshot job.
 * @param {import('better-sqlite3').Database} db
 * @param {Object} [options]
 * @param {string} [options.date]      - Override date (YYYY-MM-DD). Defaults to today.
 * @param {string[]} [options.postalCodes] - Postal codes to fetch stores for.
 */
export async function runSnapshotJob(db, options = {}) {
  const date      = options.date ?? new Date().toISOString().slice(0, 10);
  const runId     = `run_${date}_${Date.now()}`;
  const postalCodes = options.postalCodes ?? ['H2X 1Y4'];

  console.log(`[snapshot-job] Starting run ${runId} for date ${date}`);
  saveRefreshRun(db, { runId, startedAt: new Date().toISOString() });

  const searchTerms = CORE_SEARCH_TERMS.map((t) => t.term);
  let storesProcessed = 0;

  try {
    const seenStoreIds = new Set();

    for (const postalCode of postalCodes) {
      const { stores } = await searchStoresByPostalCode(postalCode);

      for (const store of stores) {
        if (seenStoreIds.has(store.id)) continue;
        seenStoreIds.add(store.id);

        // Persist store
        upsertStore(db, store);

        // Fetch products
        const { products } = await searchProducts(store.id, searchTerms);

        for (const p of products) {
          upsertProduct(db, p);
          insertPriceSnapshot(db, {
            productId:        p.productId,
            storeId:          p.storeId,
            snapshotDate:     date,
            regularPrice:     p.regularPrice,
            salePrice:        p.salePrice,
            isOnSale:         p.isOnSale,
            promoDescription: p.promoDescription,
          });
        }

        storesProcessed++;
        console.log(`[snapshot-job] Store ${store.id} — ${products.length} products persisted`);
      }
    }

    updateRefreshRun(db, runId, {
      status:         'success',
      completedAt:    new Date().toISOString(),
      storesProcessed,
    });

    console.log(`[snapshot-job] Completed: ${storesProcessed} stores processed`);
    return { runId, status: 'success', storesProcessed };

  } catch (err) {
    updateRefreshRun(db, runId, {
      status:       'failed',
      completedAt:  new Date().toISOString(),
      errorMessage: err.message,
    });

    console.error('[snapshot-job] Failed:', err.message);
    throw err;
  }
}
