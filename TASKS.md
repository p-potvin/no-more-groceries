# TASKS.md

## Status Legend

- `todo`
- `in_progress`
- `blocked`
- `review`
- `done`

---

## PM / Spec

### PM-01

- **title:** Write MVP product spec
- **owner:** product-agent
- **status:** done
- **depends_on:** none
- **goal:** Define exact MVP behavior, user flows, and exclusions
- **deliverables:**
    - `docs/PRD.md`
- **acceptance_criteria:**
    - Includes postal-code flow
    - Includes manual-store flow
    - Includes best deals, average cart, weekly cart
    - Includes non-goals
- **notes:** Keep scope tight

### PM-02

- **title:** Define benchmark basket model
- **owner:** product-agent
- **status:** done
- **depends_on:** PM-01
- **goal:** Specify weekly basket composition per household size
- **deliverables:**
    - `docs/benchmark-basket.md`
- **acceptance_criteria:**
    - Covers sizes 1, 2, 4, 6, custom-X scaling rules
    - Includes categories, target quantities, substitutions
- **notes:** Use reproducible rules, not subjective shopping lists

### PM-03

- **title:** Define deal scoring rules
- **owner:** product-agent
- **status:** done
- **depends_on:** PM-01
- **goal:** Specify how best deals are ranked
- **deliverables:**
    - `docs/scoring.md`
- **acceptance_criteria:**
    - Defines normalization rules
    - Defines discount score
    - Defines tie-break rules
- **notes:** Must be explainable in UI

### PM-04

- **title:** Define recommendation policy
- **owner:** product-agent
- **status:** done
- **depends_on:** PM-02
- **goal:** Specify weekly recommended cart generation rules
- **deliverables:**
    - `docs/recommendation-policy.md`
- **acceptance_criteria:**
    - Includes category quotas
    - Includes quantity scaling
    - Includes substitution fallback rules

---

## Architecture

### ARCH-01

- **title:** Create technical design and contracts
- **owner:** architect-agent
- **status:** done
- **depends_on:** PM-01, PM-02, PM-03, PM-04
- **goal:** Lock modules, API boundaries, and data flow
- **deliverables:**
    - `docs/architecture.md`
    - `docs/api-contracts.md`
- **acceptance_criteria:**
    - Defines backend services
    - Defines job flow
    - Defines API endpoints and response shapes
    - Defines module boundaries
- **notes:** Must support precomputed daily reads

---

## Data / Integration

### DATA-01

- **title:** Create DB schema for stores, products, prices, outputs
- **owner:** data-agent
- **status:** done
- **depends_on:** ARCH-01
- **goal:** Create persistent storage for daily snapshots and computed outputs
- **deliverables:**
    - `packages/db/schema.sql` or migration files
- **acceptance_criteria:**
    - Tables for stores, products, price_snapshots, deal_rankings, benchmark_results, weekly_cart_results
    - Indexed by store/date

### DATA-02

- **title:** Implement PC Express store adapter
- **owner:** integration-agent
- **status:** done
- **depends_on:** ARCH-01
- **goal:** Search nearby stores from postal code and normalize results
- **deliverables:**
    - `packages/integrations/pc-express/store-search.ts`
- **acceptance_criteria:**
    - Returns normalized store records
    - Handles empty/error cases
    - Tested with mocks

### DATA-03

- **title:** Implement PC Express product adapter
- **owner:** integration-agent
- **status:** done
- **depends_on:** ARCH-01
- **goal:** Search products for a store and normalize price fields
- **deliverables:**
    - `packages/integrations/pc-express/product-search.ts`
- **acceptance_criteria:**
    - Supports batched search terms
    - Normalizes price, promo, size, unit fields
    - Tested with mocks

### DATA-04

- **title:** Build daily snapshot job
- **owner:** data-agent
- **status:** done
- **depends_on:** DATA-01, DATA-02, DATA-03
- **goal:** Run daily product/store snapshot and persist results
- **deliverables:**
    - `jobs/daily-refresh/snapshot-job.ts`
- **acceptance_criteria:**
    - Idempotent on rerun
    - Persists raw and normalized data
    - Logs failures and stale runs

### DATA-05

- **title:** Seed core category search coverage
- **owner:** data-agent
- **status:** done
- **depends_on:** PM-02, DATA-03
- **goal:** Define search term coverage for benchmark and recommendation engines
- **deliverables:**
    - `packages/domain/catalog/core-search-terms.ts`
- **acceptance_criteria:**
    - Covers staples, produce, dairy, protein, pantry
    - Maps terms to benchmark categories

---

## Domain Logic

### ENG-DOM-01

- **title:** Implement unit normalization
- **owner:** domain-agent
- **status:** done
- **depends_on:** DATA-03
- **goal:** Normalize price/value across size and packaging formats
- **deliverables:**
    - `packages/domain/deals/unit-normalization.ts`
- **acceptance_criteria:**
    - Handles unit/weight/volume edge cases
    - Has deterministic tests

### ENG-DOM-02

- **title:** Implement best-deals scoring engine
- **owner:** domain-agent
- **status:** done
- **depends_on:** PM-03, ENG-DOM-01, DATA-04
- **goal:** Score and rank daily deals per store
- **deliverables:**
    - `packages/domain/deals/score-deals.ts`
- **acceptance_criteria:**
    - Produces ranked deal list
    - Includes score explanation metadata
    - Filters noisy/irrelevant items

### ENG-DOM-03

- **title:** Implement benchmark basket calculator
- **owner:** domain-agent
- **status:** done
- **depends_on:** PM-02, DATA-05, DATA-04
- **goal:** Compute average weekly cart total by household size
- **deliverables:**
    - `packages/domain/average-cart/calculate-average-cart.ts`
- **acceptance_criteria:**
    - Supports fixed and custom household sizes
    - Uses store-specific matching
    - Returns itemized output and total

### ENG-DOM-04

- **title:** Implement weekly cart recommendation engine
- **owner:** domain-agent
- **status:** done
- **depends_on:** PM-04, DATA-05, DATA-04
- **goal:** Generate a recommended 7-day cart
- **deliverables:**
    - `packages/domain/weekly-cart/generate-weekly-cart.ts`
- **acceptance_criteria:**
    - Produces practical weekly cart
    - Includes substitutions
    - Includes explanation metadata

### ENG-DOM-05

- **title:** Persist computed daily outputs
- **owner:** domain-agent
- **status:** done
- **depends_on:** ENG-DOM-02, ENG-DOM-03, ENG-DOM-04, DATA-01
- **goal:** Save precomputed results for fast API reads
- **deliverables:**
    - `jobs/daily-refresh/compute-outputs.ts`
- **acceptance_criteria:**
    - Saves results by store/date/household size
    - Safe on rerun

---

## Backend API

### ENG-BE-01

- **title:** Scaffold API server
- **owner:** backend-agent
- **status:** done
- **depends_on:** ARCH-01
- **goal:** Create API app with shared config and routing
- **deliverables:**
    - `apps/api/*`
- **acceptance_criteria:**
    - Starts locally
    - Health endpoint works
    - Env config validated

### ENG-BE-02

- **title:** Implement stores endpoint
- **owner:** backend-agent
- **status:** done
- **depends_on:** ENG-BE-01, DATA-02
- **goal:** Expose postal-code store lookup
- **deliverables:**
    - `GET /api/stores?postalCode=...`
- **acceptance_criteria:**
    - Returns normalized stores
    - Handles empty and invalid postal code cases

### ENG-BE-03

- **title:** Implement deals endpoint
- **owner:** backend-agent
- **status:** done
- **depends_on:** ENG-BE-01, ENG-DOM-05
- **goal:** Serve precomputed best deals
- **deliverables:**
    - `GET /api/deals?storeId=...`
- **acceptance_criteria:**
    - Returns ranked items with explanation fields
    - Includes refresh timestamp

### ENG-BE-04

- **title:** Implement average-cart endpoint
- **owner:** backend-agent
- **status:** done
- **depends_on:** ENG-BE-01, ENG-DOM-05
- **goal:** Serve precomputed average cart totals
- **deliverables:**
    - `GET /api/average-cart?storeId=...&householdSize=...`
- **acceptance_criteria:**
    - Returns total, line items, metadata

### ENG-BE-05

- **title:** Implement weekly-cart endpoint
- **owner:** backend-agent
- **status:** done
- **depends_on:** ENG-BE-01, ENG-DOM-05
- **goal:** Serve precomputed weekly recommended cart
- **deliverables:**
    - `GET /api/recommended-cart?storeId=...&householdSize=...`
- **acceptance_criteria:**
    - Returns itemized weekly cart with substitutions

### ENG-BE-06

- **title:** Implement store comparison endpoint
- **owner:** backend-agent
- **status:** done
- **depends_on:** ENG-BE-01, ENG-DOM-05
- **goal:** Compare nearby stores on weekly cart total and deals quality
- **deliverables:**
    - `GET /api/store-compare?postalCode=...&householdSize=...`
- **acceptance_criteria:**
    - Returns comparable normalized summaries

---

## Frontend

### ENG-FE-01

- **title:** Scaffold React SPA
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ARCH-01
- **goal:** Set up app shell, routing, query client, UI system
- **deliverables:**
    - `apps/web/*`
- **acceptance_criteria:**
    - App boots locally
    - Routes and base layout exist

### ENG-FE-02

- **title:** Build store selection flow
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ENG-FE-01, ENG-BE-02
- **goal:** Support postal-code search and manual store selection
- **deliverables:**
    - store selector UI
- **acceptance_criteria:**
    - User can search by postal code
    - User can select a store from results

### ENG-FE-03

- **title:** Build best deals dashboard
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ENG-FE-01, ENG-BE-03
- **goal:** Show top deals for selected store
- **deliverables:**
    - deals list/grid UI
- **acceptance_criteria:**
    - Shows scores, prices, promo indicators, refresh timestamp

### ENG-FE-04

- **title:** Build average cart view
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ENG-FE-01, ENG-BE-04
- **goal:** Show estimated average weekly cart cost
- **deliverables:**
    - average cart summary + details view
- **acceptance_criteria:**
    - Household size control works
    - Total and itemized breakdown visible

### ENG-FE-05

- **title:** Build weekly cart view
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ENG-FE-01, ENG-BE-05
- **goal:** Show recommended 7-day cart
- **deliverables:**
    - weekly cart page
- **acceptance_criteria:**
    - Shows itemized products, quantities, substitutions, total

### ENG-FE-06

- **title:** Build store comparison view
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ENG-FE-01, ENG-BE-06
- **goal:** Compare nearby stores on cost and deals
- **deliverables:**
    - comparison UI
- **acceptance_criteria:**
    - User can compare stores and switch selection quickly

### ENG-FE-07

- **title:** Add loading, error, empty, and stale states
- **owner:** frontend-agent
- **status:** done
- **depends_on:** ENG-FE-02, ENG-FE-03, ENG-FE-04, ENG-FE-05
- **goal:** Harden UX states across all routes
- **deliverables:**
    - reusable feedback components
- **acceptance_criteria:**
    - All data views handle non-happy paths cleanly

---

## QA

### QA-01

- **title:** Add unit tests for deal scoring
- **owner:** qa-agent
- **status:** done
- **depends_on:** ENG-DOM-02
- **goal:** Verify scoring stability
- **deliverables:**
    - test files for ranking logic
- **acceptance_criteria:**
    - Covers tie-breaks, discount edge cases, normalization edge cases

### QA-02

- **title:** Add unit tests for basket and weekly cart logic
- **owner:** qa-agent
- **status:** done
- **depends_on:** ENG-DOM-03, ENG-DOM-04
- **goal:** Verify totals and substitutions
- **deliverables:**
    - test files for basket calculators
- **acceptance_criteria:**
    - Covers custom household size scaling
    - Covers fallback behavior

### QA-03

- **title:** Add integration tests for PC Express adapters
- **owner:** qa-agent
- **status:** done
- **depends_on:** DATA-02, DATA-03
- **goal:** Verify normalized responses and error handling
- **deliverables:**
    - adapter integration tests
- **acceptance_criteria:**
    - Mocked external responses
    - Error paths covered

### QA-04

- **title:** Add end-to-end test for primary user flow
- **owner:** qa-agent
- **status:** done
- **depends_on:** ENG-FE-05
- **goal:** Validate store selection → dashboard → weekly cart flow
- **deliverables:**
    - E2E test suite
- **acceptance_criteria:**
    - Core path passes in CI

---

## Ops

### OPS-01

- **title:** Set up CI pipeline
- **owner:** ops-agent
- **status:** done
- **depends_on:** ENG-BE-01, ENG-FE-01
- **goal:** Run lint, test, build on PR
- **deliverables:**
    - `.github/workflows/ci.yml`
- **acceptance_criteria:**
    - Fails on test/build/lint failure

### OPS-02

- **title:** Set up scheduled daily refresh
- **owner:** ops-agent
- **status:** done
- **depends_on:** DATA-04, ENG-DOM-05
- **goal:** Run daily snapshot + compute pipeline
- **deliverables:**
    - scheduler config
- **acceptance_criteria:**
    - Job runs daily
    - Failures alert appropriately

### OPS-03

- **title:** Add observability and runbook
- **owner:** ops-agent
- **status:** done
- **depends_on:** OPS-02
- **goal:** Support debugging and rollback
- **deliverables:**
    - `docs/runbook.md`
    - logging/alert config
- **acceptance_criteria:**
    - Stale jobs and failed refreshes are visible
