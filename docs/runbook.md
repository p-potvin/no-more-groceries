# Runbook — No More Groceries

## Overview

This document describes operational procedures for the No More Groceries API and daily refresh pipeline.

## Architecture Summary

- **Frontend**: Vite + React SPA (`npm run web`)
- **Backend API**: Node.js HTTP server (`npm run api`)
- **Database**: SQLite at `data/groceries.db`
- **Daily job**: `node jobs/daily-refresh/run.js`

---

## Local Development

```bash
# Install deps
npm install

# Start API + SPA together (requires concurrently)
npm run dev

# Or start separately
npm run api   # API on port 8787
npm run web   # SPA on port 5173

# Run tests
npm test

# Run daily refresh manually
npm run refresh
```

---

## Database

### Location
`data/groceries.db` (SQLite, auto-created on first run)

### Reinitialize
```bash
# Delete and recreate
rm data/groceries.db
node jobs/daily-refresh/run.js
```

### Inspect
```bash
sqlite3 data/groceries.db
.tables
SELECT store_id, snapshot_date, COUNT(*) FROM deal_rankings GROUP BY 1, 2;
SELECT store_id, snapshot_date, household_size, total FROM benchmark_results;
```

---

## Daily Refresh Job

### What it does
1. Fetches stores by postal code from PC Express adapter
2. For each store, fetches products using core search terms
3. Upserts stores, products, price snapshots to DB
4. Computes deal rankings, average carts, weekly carts for household sizes [1, 2, 4, 6]
5. Persists computed outputs to DB

### Idempotency
- Store/product upserts use `ON CONFLICT DO UPDATE`
- Deal rankings delete then reinsert for the same store/date
- Benchmark/cart outputs use `ON CONFLICT DO UPDATE`

### Failure handling
- Failures are logged and recorded in `refresh_runs.status = 'failed'`
- API falls back to live-compute mode when DB data is unavailable
- The `refresh.isStale` flag in API responses indicates stale data

### Manual trigger
```bash
node jobs/daily-refresh/run.js
# or with date override
node jobs/daily-refresh/run.js --date 2026-04-20
```

---

## API Endpoints

| Endpoint | Parameters | Description |
|----------|-----------|-------------|
| GET /api/health | — | Liveness check |
| GET /api/stores | postalCode | Nearby stores |
| GET /api/deals | storeId, limit | Ranked daily deals |
| GET /api/average-cart | storeId, householdSize | Benchmark cart |
| GET /api/recommended-cart | storeId, householdSize | 7-day recommended cart |
| GET /api/store-compare | postalCode, householdSize | Multi-store comparison |

---

## Stale Data Handling

- When `refresh.isStale = true`, API is serving last-known-good data
- This happens when the daily job failed or hasn't run yet for today
- The UI displays a "Stale data" badge

---

## Rollback Procedure

1. Identify the last successful refresh run:
   ```sql
   SELECT * FROM refresh_runs WHERE status = 'success' ORDER BY completed_at DESC LIMIT 5;
   ```
2. If DB is corrupted, restore from the GitHub Actions artifact `db-snapshot-{run_id}`
3. The API will continue serving the last available data if today's refresh is missing

---

## Monitoring

- Check `refresh_runs` table for failed jobs
- Verify `deal_rankings`, `benchmark_results`, `weekly_cart_results` have today's date
- API health: `curl http://localhost:8787/api/health`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8787 | API server port |
| NODE_ENV | development | Environment mode |
