-- No More Groceries — Database Schema
-- SQLite-compatible

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────
-- Stores
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  store_id    TEXT PRIMARY KEY,
  banner      TEXT NOT NULL,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  province    TEXT,
  postal_code TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_stores_postal ON stores (postal_code);

-- ─────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  product_id   TEXT NOT NULL,
  store_id     TEXT NOT NULL REFERENCES stores(store_id),
  name         TEXT NOT NULL,
  brand        TEXT,
  category     TEXT,
  package_size TEXT,
  unit         TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (product_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- ─────────────────────────────────────────────
-- Price Snapshots
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_snapshots (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id       TEXT NOT NULL,
  store_id         TEXT NOT NULL REFERENCES stores(store_id),
  snapshot_date    TEXT NOT NULL,   -- YYYY-MM-DD
  regular_price    REAL,
  sale_price       REAL,
  is_on_sale       INTEGER NOT NULL DEFAULT 0, -- 0/1
  promo_description TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_price_snap_store_date ON price_snapshots (store_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_price_snap_product ON price_snapshots (product_id, snapshot_date);

-- ─────────────────────────────────────────────
-- Deal Rankings (precomputed daily)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_rankings (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id                TEXT NOT NULL REFERENCES stores(store_id),
  snapshot_date           TEXT NOT NULL,
  product_id              TEXT NOT NULL,
  rank                    INTEGER NOT NULL,
  deal_score              REAL NOT NULL,
  discount_score          REAL,
  value_score             REAL,
  basket_relevance_score  REAL,
  discount_pct            REAL,
  normalized_unit_price   REAL,
  normalized_unit_label   TEXT,
  relevance_tier          TEXT,
  confidence_level        TEXT,
  explanation_summary     TEXT,
  scoring_version         TEXT NOT NULL DEFAULT 'deal-score-v1',
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_deal_rank_store_date ON deal_rankings (store_id, snapshot_date);

-- ─────────────────────────────────────────────
-- Benchmark Results (average cart, precomputed)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS benchmark_results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id        TEXT NOT NULL REFERENCES stores(store_id),
  snapshot_date   TEXT NOT NULL,
  household_size  INTEGER NOT NULL,
  basket_version  TEXT NOT NULL DEFAULT 'benchmark-v1',
  coverage_score  REAL,
  total           REAL,
  currency        TEXT NOT NULL DEFAULT 'CAD',
  line_items_json TEXT,  -- JSON blob of lineItems[]
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bench_store_date_sz ON benchmark_results (store_id, snapshot_date, household_size);

-- ─────────────────────────────────────────────
-- Weekly Cart Results (recommended cart, precomputed)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_cart_results (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id              TEXT NOT NULL REFERENCES stores(store_id),
  snapshot_date         TEXT NOT NULL,
  household_size        INTEGER NOT NULL,
  policy_version        TEXT NOT NULL DEFAULT 'weekly-cart-policy-v1',
  basket_version        TEXT NOT NULL DEFAULT 'benchmark-v1',
  confidence_level      TEXT,
  category_coverage_json TEXT,  -- JSON blob { dairy: true, ... }
  total                 REAL,
  currency              TEXT NOT NULL DEFAULT 'CAD',
  line_items_json       TEXT,   -- JSON blob of lineItems[]
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_store_date_sz ON weekly_cart_results (store_id, snapshot_date, household_size);

-- ─────────────────────────────────────────────
-- Refresh Runs (job audit log)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_runs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id            TEXT NOT NULL UNIQUE,
  started_at        TEXT,
  completed_at      TEXT,
  status            TEXT NOT NULL DEFAULT 'running',  -- running | success | failed
  stores_processed  INTEGER DEFAULT 0,
  error_message     TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
