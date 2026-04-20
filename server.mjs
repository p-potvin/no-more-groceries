/**
 * No More Groceries — Production API Server
 * Serves precomputed outputs from SQLite.
 * Falls back to live computation from mock adapters when DB data is unavailable.
 *
 * Endpoints:
 *   GET /api/health
 *   GET /api/stores?postalCode=...
 *   GET /api/deals?storeId=...&limit=...
 *   GET /api/average-cart?storeId=...&householdSize=...
 *   GET /api/recommended-cart?storeId=...&householdSize=...
 *   GET /api/store-compare?postalCode=...&householdSize=...
 */

import http                  from 'node:http';
import { URL }               from 'node:url';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath }     from 'node:url';
import { dirname, join }     from 'node:path';

// ── Domain + adapters ──────────────────────────────────────────────────────
import { searchStoresByPostalCode, MOCK_STORES } from './packages/integrations/pc-express/store-search.js';
import { searchProducts }           from './packages/integrations/pc-express/product-search.js';
import { CORE_SEARCH_TERMS }        from './packages/domain/catalog/core-search-terms.js';
import { rankDeals, computeCategoryAverages } from './packages/domain/deals/score-deals.js';
import { calculateAverageCart }     from './packages/domain/average-cart/calculate-average-cart.js';
import { generateWeeklyCart }       from './packages/domain/weekly-cart/generate-weekly-cart.js';

// ── DB (optional — gracefully skip if better-sqlite3 not installed) ─────────
let db = null;
let dbQueries = null;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, 'data/groceries.db');
const SCHEMA    = join(__dirname, 'packages/db/schema.sql');

async function initDb() {
  try {
    const { default: Database } = await import('better-sqlite3');
    mkdirSync(join(__dirname, 'data'), { recursive: true });
    const instance = new Database(DB_PATH);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
    if (existsSync(SCHEMA)) {
      instance.exec(readFileSync(SCHEMA, 'utf8'));
    }
    db = instance;
    dbQueries = await import('./packages/db/queries.js');
    console.log('[api] SQLite DB loaded');
  } catch {
    console.log('[api] No DB available — running in live-compute mode');
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 8787);

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function err(res, status, code, message) {
  return json(res, status, { error: { code, message } });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function refreshMeta(isStale = false, date = today()) {
  return {
    effectiveDate: date,
    refreshedAt:   new Date().toISOString(),
    isStale,
    sourceRunId:   `live_${date}`,
  };
}

function normaliseForDomain(products) {
  return products.map((p) => ({
    ...p,
    id:    p.productId,
    price: p.salePrice ?? p.regularPrice,
  }));
}

const SEARCH_TERMS = CORE_SEARCH_TERMS.map((t) => t.term);

function storeToDTO(s) {
  return {
    id:         s.store_id ?? s.id,
    banner:     s.banner,
    name:       s.name,
    address:    s.address ?? null,
    city:       s.city    ?? null,
    province:   s.province ?? null,
    postalCode: s.postal_code ?? s.postalCode ?? null,
  };
}

// ── Route handlers ───────────────────────────────────────────────────────────

async function handleStores(req, res, url) {
  const postalCode = url.searchParams.get('postalCode') ?? '';
  if (!postalCode.trim()) return err(res, 400, 'INVALID_INPUT', 'postalCode is required');

  let stores;
  if (db && dbQueries) {
    stores = dbQueries.getStoresByPostalCode(db, postalCode).map(storeToDTO);
  }
  if (!stores || stores.length === 0) {
    const result = await searchStoresByPostalCode(postalCode);
    stores = result.stores.map(storeToDTO);
  }

  return json(res, 200, { postalCode: postalCode.trim().toUpperCase(), stores });
}

async function handleDeals(req, res, url) {
  const storeId = url.searchParams.get('storeId') ?? '';
  const limit   = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
  if (!storeId) return err(res, 400, 'INVALID_INPUT', 'storeId is required');

  const date = today();

  // Try precomputed from DB
  if (db && dbQueries) {
    const rows = dbQueries.getDealRankings(db, storeId, date, limit);
    if (rows.length > 0) {
      const store = dbQueries.getStore(db, storeId);
      return json(res, 200, {
        store:          store ? storeToDTO(store) : { id: storeId },
        refresh:        refreshMeta(false, date),
        scoringVersion: 'deal-score-v1',
        items:          rows.map((r) => ({
          productId:            r.product_id,
          name:                 r.product_name ?? r.product_id,
          category:             r.category,
          currentPrice:         r.sale_price ?? r.regular_price,
          regularPrice:         r.regular_price,
          discountPct:          r.discount_pct,
          dealScore:            r.deal_score,
          discountScore:        r.discount_score,
          valueScore:           r.value_score,
          basketRelevanceScore: r.basket_relevance_score,
          normalizedUnitPrice:  r.normalized_unit_price,
          normalizedUnitLabel:  r.normalized_unit_label,
          relevanceTier:        r.relevance_tier,
          confidenceLevel:      r.confidence_level,
          explanationSummary:   r.explanation_summary,
        })),
      });
    }
  }

  // Live fallback
  const { products } = await searchProducts(storeId, SEARCH_TERMS);
  const normalised   = normaliseForDomain(products);
  const categoryAverages = computeCategoryAverages(normalised);
  const deals        = rankDeals(normalised, { categoryAverages, limit });

  return json(res, 200, {
    store:          { id: storeId },
    refresh:        refreshMeta(true, date),
    scoringVersion: 'deal-score-v1',
    items:          deals,
    _isMock:        true,
  });
}

async function handleAverageCart(req, res, url) {
  const storeId       = url.searchParams.get('storeId') ?? '';
  const householdSize = parseInt(url.searchParams.get('householdSize') ?? '2', 10);

  if (!storeId)                           return err(res, 400, 'INVALID_INPUT', 'storeId is required');
  if (!isFinite(householdSize) || householdSize < 1) return err(res, 400, 'INVALID_INPUT', 'householdSize must be >= 1');

  const date = today();

  // Try precomputed
  if (db && dbQueries) {
    const row = dbQueries.getBenchmarkResult(db, storeId, date, householdSize);
    if (row) {
      const store = dbQueries.getStore(db, storeId);
      return json(res, 200, {
        store:         store ? storeToDTO(store) : { id: storeId },
        refresh:       refreshMeta(false, date),
        basketVersion: row.basket_version,
        householdSize,
        coverageScore: row.coverage_score,
        total:         row.total,
        currency:      row.currency,
        lineItems:     row.lineItems,
      });
    }
  }

  // Live fallback
  const { products } = await searchProducts(storeId, SEARCH_TERMS);
  const normalised   = normaliseForDomain(products);
  const result       = calculateAverageCart(normalised, householdSize, { date });

  return json(res, 200, {
    store:   { id: storeId },
    refresh: refreshMeta(true, date),
    ...result,
    _isMock: true,
  });
}

async function handleRecommendedCart(req, res, url) {
  const storeId       = url.searchParams.get('storeId') ?? '';
  const householdSize = parseInt(url.searchParams.get('householdSize') ?? '2', 10);

  if (!storeId)                           return err(res, 400, 'INVALID_INPUT', 'storeId is required');
  if (!isFinite(householdSize) || householdSize < 1) return err(res, 400, 'INVALID_INPUT', 'householdSize must be >= 1');

  const date = today();

  // Try precomputed
  if (db && dbQueries) {
    const row = dbQueries.getWeeklyCartResult(db, storeId, date, householdSize);
    if (row) {
      const store = dbQueries.getStore(db, storeId);
      return json(res, 200, {
        store:            store ? storeToDTO(store) : { id: storeId },
        refresh:          refreshMeta(false, date),
        policyVersion:    row.policy_version,
        basketVersion:    row.basket_version,
        householdSize,
        confidenceLevel:  row.confidence_level,
        categoryCoverage: row.categoryCoverage,
        total:            row.total,
        currency:         row.currency,
        lineItems:        row.lineItems,
      });
    }
  }

  // Live fallback
  const { products } = await searchProducts(storeId, SEARCH_TERMS);
  const normalised   = normaliseForDomain(products);
  const result       = generateWeeklyCart(normalised, householdSize, { date });

  return json(res, 200, {
    store:   { id: storeId },
    refresh: refreshMeta(true, date),
    ...result,
    _isMock: true,
  });
}

async function handleStoreCompare(req, res, url) {
  const postalCode    = url.searchParams.get('postalCode') ?? '';
  const householdSize = parseInt(url.searchParams.get('householdSize') ?? '2', 10);

  if (!postalCode.trim())                  return err(res, 400, 'INVALID_INPUT', 'postalCode is required');
  if (!isFinite(householdSize) || householdSize < 1) return err(res, 400, 'INVALID_INPUT', 'householdSize must be >= 1');

  const date   = today();
  const result = await searchStoresByPostalCode(postalCode);
  const stores = result.stores;

  const compared = await Promise.all(stores.map(async (store, idx) => {
    const storeId = store.id;
    let avgTotal  = null;
    let recTotal  = null;
    let dealSignal = 0;

    // Try precomputed
    if (db && dbQueries) {
      const bench  = dbQueries.getBenchmarkResult(db, storeId, date, householdSize);
      const weekly = dbQueries.getWeeklyCartResult(db, storeId, date, householdSize);
      const deals  = dbQueries.getDealRankings(db, storeId, date, 20);
      if (bench)  avgTotal  = bench.total;
      if (weekly) recTotal  = weekly.total;
      if (deals.length) dealSignal = Number((deals.reduce((s, d) => s + d.deal_score, 0) / deals.length).toFixed(1));
    }

    // Live fallback if needed
    if (avgTotal == null || recTotal == null) {
      const { products } = await searchProducts(storeId, SEARCH_TERMS);
      const n = normaliseForDomain(products);
      if (avgTotal == null) avgTotal = calculateAverageCart(n, householdSize).total;
      if (recTotal == null) recTotal = generateWeeklyCart(n, householdSize).total;
      if (!dealSignal) {
        const avgs  = computeCategoryAverages(n);
        const deals = rankDeals(n, { categoryAverages: avgs, limit: 20 });
        dealSignal  = deals.length ? Number((deals.reduce((s, d) => s + d.dealScore, 0) / deals.length).toFixed(1)) : 0;
      }
    }

    return {
      store:                storeToDTO(store),
      averageCartTotal:     avgTotal,
      recommendedCartTotal: recTotal,
      dealSignal,
      coverageScore:        null,
      confidenceLevel:      'high',
      rank:                 idx + 1,
    };
  }));

  // Sort by average cart total ascending
  compared.sort((a, b) => (a.averageCartTotal ?? Infinity) - (b.averageCartTotal ?? Infinity));
  compared.forEach((s, i) => (s.rank = i + 1));

  return json(res, 200, {
    postalCode:    postalCode.trim().toUpperCase(),
    householdSize,
    refresh:       refreshMeta(false, date),
    stores:        compared,
  });
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' });
    return res.end();
  }
  if (!req.url) return json(res, 400, { error: { code: 'BAD_REQUEST', message: 'Missing URL' } });

  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/api/health') {
      return json(res, 200, { ok: true, service: 'no-more-groceries-api', timestamp: new Date().toISOString() });
    }
    if (pathname === '/api/stores')          return await handleStores(req, res, url);
    if (pathname === '/api/deals')           return await handleDeals(req, res, url);
    if (pathname === '/api/average-cart')    return await handleAverageCart(req, res, url);
    if (pathname === '/api/recommended-cart') return await handleRecommendedCart(req, res, url);
    if (pathname === '/api/store-compare')   return await handleStoreCompare(req, res, url);
    return err(res, 404, 'NOT_FOUND', `No route for ${pathname}`);
  } catch (e) {
    console.error('[api] Unhandled error:', e.message);
    return err(res, 500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
});

(async () => {
  await initDb();
  server.listen(PORT, () => {
    console.log(`[api] No More Groceries API listening on http://localhost:${PORT}`);
    console.log(`[api] Health: http://localhost:${PORT}/api/health`);
  });
})();
