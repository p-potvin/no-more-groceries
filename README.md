# 🛒 No More Groceries

**Daily PC Express grocery deals, benchmark cart pricing, and a 7-day recommended cart — for your nearest store.**

[![CI](https://github.com/p-potvin/no-more-groceries/actions/workflows/ci.yml/badge.svg)](https://github.com/p-potvin/no-more-groceries/actions/workflows/ci.yml)
[![Daily Refresh](https://github.com/p-potvin/no-more-groceries/actions/workflows/daily-refresh.yml/badge.svg)](https://github.com/p-potvin/no-more-groceries/actions/workflows/daily-refresh.yml)
![Node 22+](https://img.shields.io/badge/node-22%2B-brightgreen)
![License MIT](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## What it does

No More Groceries is a desktop + web app that helps you make smarter grocery decisions, updated daily:

| Feature              | Description                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| 🏷️ **Best Deals**    | Ranked list of today's top deals at your store, scored by discount %, unit price, and basket relevance |
| 🧺 **Average Cart**  | Benchmark weekly grocery cost for your household size, based on a canonical staple basket              |
| 📅 **7-Day Cart**    | A recommended weekly shopping cart with best-value product matches per category                        |
| 🗺️ **Store Compare** | Side-by-side total cost comparison across all nearby stores for your postal code                       |

---

## Screenshots

> App runs as a desktop window (Electron) or in the browser via the dev server.

| Deals                          | Weekly Cart                     | Compare                           |
| ------------------------------ | ------------------------------- | --------------------------------- |
| Ranked by composite deal score | Best-value matches per category | Cheapest store for your household |

---

## Requirements

- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **npm 10+** (bundled with Node 22)
- **Windows x64** for the pre-built installer (macOS/Linux builds possible from source)
- **Visual Studio Build Tools** — only required if you need to rebuild `better-sqlite3` from source (see [Troubleshooting](#troubleshooting))

---

## Quick start — download the installer

1. Go to [**Releases**](https://github.com/p-potvin/no-more-groceries/releases)
2. Download `No More Groceries Setup X.X.X.exe`
3. Run it — choose your install folder, then launch from the Start Menu or Desktop shortcut
4. The app opens, finds your nearest store by postal code, and shows today's deals

> **No internet connection required after first setup.** Data refreshes daily in the background.

---

## Quick start — run from source

```bash
# 1. Clone the repo
git clone https://github.com/p-potvin/no-more-groceries.git
cd no-more-groceries

# 2. Install dependencies (this also rebuilds native modules for Electron)
npm install

# 3a. Run as a desktop app (builds SPA first, then opens Electron window)
npm run electron:dev

# 3b. Or run as a web app (API + browser SPA with hot-reload)
npm run dev
# → API available at  http://localhost:8787
# → SPA available at  http://localhost:5173
```

---

## All npm scripts

| Script                     | What it does                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `npm run dev`              | Start API server + Vite dev server concurrently                    |
| `npm run api`              | Start API server only (port 8787)                                  |
| `npm run web`              | Start Vite dev server only (port 5173)                             |
| `npm run build`            | Build the production SPA → `dist/`                                 |
| `npm test`                 | Run all unit + integration test suites                             |
| `npm run refresh`          | Run the daily data pipeline manually                               |
| `npm run electron:dev`     | Build SPA + launch Electron desktop app                            |
| `npm run electron:win`     | Build SPA + package Windows installer → `release/`                 |
| `npm run electron:pack`    | Build SPA + create unpacked Electron app → `release/win-unpacked/` |
| `npm run electron:rebuild` | Rebuild native modules for the installed Electron version          |

---

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable   | Default       | Description                   |
| ---------- | ------------- | ----------------------------- |
| `PORT`     | `8787`        | API server port               |
| `NODE_ENV` | `development` | `development` or `production` |

> **Never commit `.env`** — it is gitignored. Only `.env.example` belongs in source control.

---

## How the data pipeline works

```text
Daily at 6 AM UTC (GitHub Actions)
          │
          ▼
  snapshot-job.js         ← fetches stores + products from PC Express
          │
          ▼
  compute-outputs.js      ← scores deals, builds carts for household sizes 1/2/4/6
          │
          ▼
  data/groceries.db       ← SQLite (gitignored, lives on disk only)
          │
          ▼
  server.mjs              ← API serves precomputed results (live-compute fallback if DB empty)
          │
          ▼
  App.jsx                 ← React SPA consumed by browser or Electron renderer
```

### Run the pipeline manually

```bash
# Refresh today's data
npm run refresh

# Refresh for a specific date (useful for backfilling)
node jobs/daily-refresh/run.js --date 2026-04-20
```

---

## Building the desktop app (Electron)

### Windows installer (NSIS)

```bash
npm run electron:win
# Output: release/No More Groceries Setup X.X.X.exe
```

### Portable (no installer)

```bash
npm run electron:pack
# Output: release/win-unpacked/No More Groceries.exe
```

### macOS / Linux

```bash
npm run build
npx electron-builder --mac   # → release/*.dmg
npx electron-builder --linux # → release/*.AppImage
```

> macOS builds require a Mac machine or a CI runner with macOS. Code signing is optional for local use.

---

## Project structure

```text
no-more-groceries/
├── electron/               # Electron main process + preload
│   ├── main.js             # App lifecycle, spawns API server, opens window
│   ├── preload.js          # contextBridge: exposes safe API to renderer
│   └── assets/             # icon.ico, icon.png
│
├── packages/
│   ├── db/                 # SQLite schema, migrations, query helpers
│   ├── domain/
│   │   ├── deals/          # Unit normalization + deal scoring engine
│   │   ├── average-cart/   # Benchmark basket calculator
│   │   ├── weekly-cart/    # 7-day recommended cart generator
│   │   └── catalog/        # Core search terms + household scaling
│   └── integrations/
│       └── pc-express/     # Store search + product search adapters (mock)
│
├── jobs/
│   └── daily-refresh/      # snapshot-job.js, compute-outputs.js, run.js
│
├── apps/ (web)
│   ├── App.jsx             # React SPA — tabbed dashboard
│   ├── styles.css          # Dark-mode design system
│   ├── main.jsx            # React entry point
│   └── index.html          # HTML shell
│
├── server.mjs              # Node.js HTTP API server (no framework)
├── run-tests.js            # Test runner (no test framework dependency)
└── docs/                   # PRD, architecture, API contracts, runbook
```

---

## API reference

The API server runs on `http://localhost:8787` (or the port in `PORT`).

| Endpoint                    | Parameters                    | Description                 |
| --------------------------- | ----------------------------- | --------------------------- |
| `GET /api/health`           | —                             | Liveness check              |
| `GET /api/stores`           | `postalCode`                  | Nearby PC Express stores    |
| `GET /api/deals`            | `storeId`, `limit=20`         | Ranked deals for a store    |
| `GET /api/average-cart`     | `storeId`, `householdSize`    | Benchmark weekly cart total |
| `GET /api/recommended-cart` | `storeId`, `householdSize`    | 7-day best-value cart       |
| `GET /api/store-compare`    | `postalCode`, `householdSize` | Multi-store cost comparison |

All responses include a `refresh` object indicating data freshness:

```json
{
    "refresh": {
        "effectiveDate": "2026-04-20",
        "refreshedAt": "2026-04-20T06:00:00Z",
        "isStale": false
    }
}
```

---

## Running tests

```bash
npm test
```

Output:

```
✅ PC Express Store Search
✅ PC Express Product Search
✅ Unit Normalization
✅ Deal Scoring Engine
✅ Average Cart Calculator
✅ Weekly Cart Generator

Results: 6/6 suites passed — All tests passed 🎉
```

Tests use Node's built-in `assert` module — no test framework to install.

---

## Troubleshooting

### `better-sqlite3` fails to rebuild for Electron

This requires Visual Studio Build Tools with the **Desktop development with C++** workload and a C++20-capable compiler (VS 2022 recommended).

```bash
# After changing Electron version or reinstalling deps:
npm run electron:rebuild
```

If you're on VS 2019, upgrade to VS 2022 Build Tools:
[https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

### App shows stale data

The daily refresh job runs at **6 AM UTC** via GitHub Actions. If data looks old:

```bash
npm run refresh   # pull fresh data locally
```

The `[Stale data]` badge in the UI appears when `refresh.isStale = true`.

### Port 8787 already in use

Set a different port in `.env`:

```
PORT=9000
```

The Electron app dynamically assigns a free port — no action needed if running as a desktop app.

### Database empty / first run

The database is created automatically on first launch or when you run `npm run refresh`. The API falls back to live computation until the DB is populated.

---

## Contributing

1. Fork the repo and create a feature branch
2. Follow the task structure in `TASKS.md` and `docs/PRD.md`
3. Add tests for any pricing, scoring, or recommendation logic
4. Ensure `npm test` passes
5. Open a PR — describe what changed and reference the relevant task ID

---

## License

MIT — see [LICENSE](LICENSE)
