/**
 * DB Queries — synchronous better-sqlite3-style helpers.
 * The `db` parameter is an open better-sqlite3 Database instance.
 * This module does NOT open connections itself.
 */

// ─────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────

export function getSettings(db) {
  try {
    const row = db.prepare('SELECT household_size, default_store_id, updated_at FROM app_settings WHERE id = 1').get();
    
    let defaultStore = null;
    if (row && row.default_store_id) {
      defaultStore = getStore(db, row.default_store_id);
    }
    
    return {
      householdSize: row?.household_size ?? 2,
      defaultStoreId: row?.default_store_id ?? null,
      defaultStore,
      updatedAt: row?.updated_at ?? null
    };
  } catch (e) {
    if (e.message.includes('no such table')) {
      return { householdSize: 2, defaultStoreId: null, defaultStore: null, updatedAt: null, error: 'NO_TABLE' };
    }
    throw e;
  }
}

export function updateSettings(db, payload) {
  if (payload.householdSize !== undefined) {
    db.prepare('UPDATE app_settings SET household_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(payload.householdSize);
  }
  if (payload.defaultStoreId !== undefined) {
    db.prepare('UPDATE app_settings SET default_store_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(payload.defaultStoreId);
  }
}

// ─────────────────────────────────────────────────────
// Stores
// ─────────────────────────────────────────────────────

export function getStore(db, storeId) {
  return db.prepare('SELECT * FROM stores WHERE store_id = ?').get(storeId) ?? null;
}

export function upsertStore(db, store) {
  return db.prepare(`
    INSERT INTO stores (store_id, banner, name, address, city, province, postal_code, updated_at)
    VALUES (@store_id, @banner, @name, @address, @city, @province, @postal_code, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    ON CONFLICT(store_id) DO UPDATE SET
      banner      = excluded.banner,
      name        = excluded.name,
      address     = excluded.address,
      city        = excluded.city,
      province    = excluded.province,
      postal_code = excluded.postal_code,
      updated_at  = excluded.updated_at
  `).run({
    store_id:    store.id ?? store.store_id,
    banner:      store.banner,
    name:        store.name,
    address:     store.address ?? null,
    city:        store.city ?? null,
    province:    store.province ?? null,
    postal_code: store.postalCode ?? store.postal_code ?? null,
  });
}

export function getStoresByPostalCode(db, _postalCode) {
  // In a geo-aware implementation you'd filter by proximity.
  // For MVP, return all stores (we have a small curated list).
  return db.prepare('SELECT * FROM stores ORDER BY name').all();
}

// ─────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────

export function upsertProduct(db, product) {
  return db.prepare(`
    INSERT INTO products (product_id, store_id, name, brand, category, package_size, unit, updated_at)
    VALUES (@product_id, @store_id, @name, @brand, @category, @package_size, @unit, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    ON CONFLICT(product_id, store_id) DO UPDATE SET
      name         = excluded.name,
      brand        = excluded.brand,
      category     = excluded.category,
      package_size = excluded.package_size,
      unit         = excluded.unit,
      updated_at   = excluded.updated_at
  `).run({
    product_id:   product.productId ?? product.product_id,
    store_id:     product.storeId   ?? product.store_id,
    name:         product.name,
    brand:        product.brand     ?? null,
    category:     product.category  ?? null,
    package_size: product.packageSize ?? product.package_size ?? null,
    unit:         product.unit       ?? null,
  });
}

// ─────────────────────────────────────────────────────
// Price Snapshots
// ─────────────────────────────────────────────────────

export function insertPriceSnapshot(db, snapshot) {
  return db.prepare(`
    INSERT INTO price_snapshots
      (product_id, store_id, snapshot_date, regular_price, sale_price, is_on_sale, promo_description)
    VALUES
      (@product_id, @store_id, @snapshot_date, @regular_price, @sale_price, @is_on_sale, @promo_description)
  `).run({
    product_id:       snapshot.productId   ?? snapshot.product_id,
    store_id:         snapshot.storeId     ?? snapshot.store_id,
    snapshot_date:    snapshot.snapshotDate ?? snapshot.snapshot_date,
    regular_price:    snapshot.regularPrice ?? snapshot.regular_price ?? null,
    sale_price:       snapshot.salePrice    ?? snapshot.sale_price    ?? null,
    is_on_sale:       snapshot.isOnSale     ? 1 : 0,
    promo_description: snapshot.promoDescription ?? snapshot.promo_description ?? null,
  });
}

// ─────────────────────────────────────────────────────
// Deal Rankings
// ─────────────────────────────────────────────────────

export function saveDealRankings(db, storeId, date, items) {
  const insert = db.prepare(`
    INSERT INTO deal_rankings
      (store_id, snapshot_date, product_id, rank, deal_score, discount_score, value_score,
       basket_relevance_score, discount_pct, normalized_unit_price, normalized_unit_label,
       relevance_tier, confidence_level, explanation_summary, scoring_version)
    VALUES
      (@store_id, @snapshot_date, @product_id, @rank, @deal_score, @discount_score, @value_score,
       @basket_relevance_score, @discount_pct, @normalized_unit_price, @normalized_unit_label,
       @relevance_tier, @confidence_level, @explanation_summary, @scoring_version)
  `);

  const deleteOld = db.prepare(
    'DELETE FROM deal_rankings WHERE store_id = ? AND snapshot_date = ?'
  );

  const tx = db.transaction(() => {
    deleteOld.run(storeId, date);
    items.forEach((item, idx) => {
      insert.run({
        store_id:               storeId,
        snapshot_date:          date,
        product_id:             item.productId,
        rank:                   idx + 1,
        deal_score:             item.dealScore,
        discount_score:         item.discountScore         ?? null,
        value_score:            item.valueScore            ?? null,
        basket_relevance_score: item.basketRelevanceScore  ?? null,
        discount_pct:           item.discountPct           ?? null,
        normalized_unit_price:  item.normalizedUnitPrice   ?? null,
        normalized_unit_label:  item.normalizedUnitLabel   ?? null,
        relevance_tier:         item.relevanceTier         ?? null,
        confidence_level:       item.confidenceLevel       ?? null,
        explanation_summary:    item.explanationSummary    ?? null,
        scoring_version:        item.scoringVersion        ?? 'deal-score-v1',
      });
    });
  });

  tx();
}

export function getDealRankings(db, storeId, date, limit = 20) {
  return db.prepare(`
    SELECT dr.*, p.name AS product_name, p.category, p.brand, p.package_size,
           ps.regular_price, ps.sale_price, ps.is_on_sale, ps.promo_description
    FROM deal_rankings dr
    LEFT JOIN products p ON dr.product_id = p.product_id AND p.store_id = dr.store_id
    LEFT JOIN price_snapshots ps ON dr.product_id = ps.product_id
                                 AND ps.store_id = dr.store_id
                                 AND ps.snapshot_date = dr.snapshot_date
    WHERE dr.store_id = ? AND dr.snapshot_date = ?
    ORDER BY dr.rank ASC
    LIMIT ?
  `).all(storeId, date, limit);
}

// ─────────────────────────────────────────────────────
// Benchmark Results
// ─────────────────────────────────────────────────────

export function saveBenchmarkResult(db, storeId, date, householdSize, result) {
  return db.prepare(`
    INSERT INTO benchmark_results
      (store_id, snapshot_date, household_size, basket_version, coverage_score, total, currency, line_items_json)
    VALUES
      (@store_id, @snapshot_date, @household_size, @basket_version, @coverage_score, @total, @currency, @line_items_json)
    ON CONFLICT(store_id, snapshot_date, household_size) DO UPDATE SET
      basket_version  = excluded.basket_version,
      coverage_score  = excluded.coverage_score,
      total           = excluded.total,
      line_items_json = excluded.line_items_json
  `).run({
    store_id:         storeId,
    snapshot_date:    date,
    household_size:   householdSize,
    basket_version:   result.basketVersion ?? 'benchmark-v1',
    coverage_score:   result.coverageScore ?? null,
    total:            result.total,
    currency:         result.currency ?? 'CAD',
    line_items_json:  JSON.stringify(result.lineItems ?? []),
  });
}

export function getBenchmarkResult(db, storeId, date, householdSize) {
  const row = db.prepare(`
    SELECT * FROM benchmark_results
    WHERE store_id = ? AND snapshot_date = ? AND household_size = ?
  `).get(storeId, date, householdSize);
  if (!row) return null;
  return { ...row, lineItems: JSON.parse(row.line_items_json ?? '[]') };
}

// ─────────────────────────────────────────────────────
// Weekly Cart Results
// ─────────────────────────────────────────────────────

export function saveWeeklyCartResult(db, storeId, date, householdSize, result) {
  return db.prepare(`
    INSERT INTO weekly_cart_results
      (store_id, snapshot_date, household_size, policy_version, basket_version,
       confidence_level, category_coverage_json, total, currency, line_items_json)
    VALUES
      (@store_id, @snapshot_date, @household_size, @policy_version, @basket_version,
       @confidence_level, @category_coverage_json, @total, @currency, @line_items_json)
    ON CONFLICT(store_id, snapshot_date, household_size) DO UPDATE SET
      policy_version         = excluded.policy_version,
      basket_version         = excluded.basket_version,
      confidence_level       = excluded.confidence_level,
      category_coverage_json = excluded.category_coverage_json,
      total                  = excluded.total,
      line_items_json        = excluded.line_items_json
  `).run({
    store_id:               storeId,
    snapshot_date:          date,
    household_size:         householdSize,
    policy_version:         result.policyVersion  ?? 'weekly-cart-policy-v1',
    basket_version:         result.basketVersion  ?? 'benchmark-v1',
    confidence_level:       result.confidenceLevel ?? null,
    category_coverage_json: JSON.stringify(result.categoryCoverage ?? {}),
    total:                  result.total,
    currency:               result.currency ?? 'CAD',
    line_items_json:        JSON.stringify(result.lineItems ?? []),
  });
}

export function getWeeklyCartResult(db, storeId, date, householdSize) {
  const row = db.prepare(`
    SELECT * FROM weekly_cart_results
    WHERE store_id = ? AND snapshot_date = ? AND household_size = ?
  `).get(storeId, date, householdSize);
  if (!row) return null;
  return {
    ...row,
    lineItems:        JSON.parse(row.line_items_json        ?? '[]'),
    categoryCoverage: JSON.parse(row.category_coverage_json ?? '{}'),
  };
}

// ─────────────────────────────────────────────────────
// Refresh Runs
// ─────────────────────────────────────────────────────

export function saveRefreshRun(db, run) {
  return db.prepare(`
    INSERT INTO refresh_runs (run_id, started_at, status)
    VALUES (@run_id, @started_at, 'running')
    ON CONFLICT(run_id) DO NOTHING
  `).run({ run_id: run.runId, started_at: run.startedAt ?? new Date().toISOString() });
}

export function updateRefreshRun(db, runId, updates) {
  const fields = [];
  const params = { run_id: runId };
  if (updates.status)           { fields.push('status = @status');                     params.status           = updates.status; }
  if (updates.completedAt)      { fields.push('completed_at = @completedAt');           params.completedAt      = updates.completedAt; }
  if (updates.storesProcessed != null) { fields.push('stores_processed = @storesProcessed'); params.storesProcessed = updates.storesProcessed; }
  if (updates.errorMessage)     { fields.push('error_message = @errorMessage');         params.errorMessage     = updates.errorMessage; }
  if (!fields.length) return;
  return db.prepare(`UPDATE refresh_runs SET ${fields.join(', ')} WHERE run_id = @run_id`).run(params);
}
