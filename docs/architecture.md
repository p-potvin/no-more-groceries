# Architecture
## Product
PC Express Daily Grocery Deals SPA

## Version
MVP v1

## Status
Draft

## Owner
Architecture / Engineering

## Purpose
Define the technical architecture for a React SPA that updates daily using PC Express-backed data and exposes:
- best deals by store
- average weekly cart estimate by household size
- recommended 7-day cart by household size
- nearby store comparison

The system is optimized for:
- daily precomputed outputs
- fast read APIs
- deterministic business logic
- mobile-first user experience

---

# 1. High-Level Architecture

## System Shape
The system is split into five layers:

1. **Frontend SPA**
2. **API service**
3. **Domain computation layer**
4. **Integration layer**
5. **Data + scheduled jobs layer**

## Top-Level Components
- `apps/web` → React SPA
- `apps/api` → HTTP API server
- `packages/domain` → pricing, deal scoring, benchmark cart, weekly cart logic
- `packages/integrations/pc-express` → store/product/cart adapters
- `packages/db` → schema, migrations, queries
- `packages/shared` → DTOs, schemas, helpers
- `jobs/daily-refresh` → ingestion + compute pipeline

---

# 2. Architectural Principles

## Primary Principles
- Precompute expensive outputs daily.
- Keep the frontend read-only for derived pricing intelligence.
- Isolate business logic from UI and transport concerns.
- Normalize retailer data before domain logic consumes it.
- Prefer deterministic behavior over dynamic heuristics in MVP.
- Preserve last-known-good output when refresh fails.

## Secondary Principles
- Design for multi-store, multi-banner growth.
- Keep API contracts stable and versionable.
- Favor explicit schemas and typed DTOs.
- Keep integration failures observable and recoverable.

---

# 3. Runtime View

## 3.1 User Request Path
1. User opens SPA.
2. SPA requests nearby stores or reads selected store state.
3. SPA requests precomputed outputs from API:
   - deals
   - average cart
   - recommended cart
   - store comparison
4. API reads latest successful daily outputs from the database.
5. API returns normalized response DTOs.

## 3.2 Daily Refresh Path
1. Scheduler triggers daily refresh job.
2. Integration layer fetches target store and product data.
3. Raw retailer responses are normalized.
4. Snapshot rows are stored.
5. Domain layer computes:
   - deal rankings
   - average cart outputs
   - weekly cart outputs
6. Computed outputs are persisted with version metadata.
7. Latest successful run becomes active read source.

---

# 4. Frontend Architecture

## Stack
- React
- TypeScript
- Vite or equivalent SPA bundler
- TanStack Query for server-state caching
- lightweight local state for selected store and household size
- CSS framework optional, but Tailwind is recommended

## Responsibilities
The frontend is responsible for:
- postal code entry
- store selection
- selected-store persistence in client state
- household-size controls
- rendering dashboards and breakdowns
- loading/error/empty/stale states

## Non-Responsibilities
The frontend should not:
- compute deal scores
- compute benchmark carts
- compute weekly recommendation carts
- directly call PC Express integration tools

---

# 5. API Service Architecture

## Stack
- Node.js
- TypeScript
- Express, Fastify, or equivalent
- schema validation at request boundary

## Responsibilities
The API service is responsible for:
- request validation
- reading normalized or computed data
- shaping stable JSON responses
- surfacing refresh timestamps and stale-data flags
- returning comparable outputs for multiple stores

## Non-Responsibilities
The API should avoid:
- live heavy recomputation on user request in MVP
- frontend-specific formatting logic
- direct business-rule duplication already present in domain packages

---

# 6. Integration Layer

## Package
- `packages/integrations/pc-express`

## Responsibilities
- search nearby stores by postal code
- search products by store/banner/search term set
- normalize external fields into internal DTOs
- expose clean typed interfaces to the rest of the app

## Adapter Boundaries
The integration layer should return internal DTOs only, not raw connector payloads.

## Failure Handling
- network or connector errors should be classified
- retries should be bounded
- failures should be logged with store/date context

---

# 7. Domain Layer

## Package
- `packages/domain`

## Modules
- `deals/`
- `average-cart/`
- `weekly-cart/`
- `catalog/`

## Responsibilities
### Deals Module
- unit normalization
- comparable-set logic
- deal score computation
- explanation metadata

### Average Cart Module
- benchmark basket expansion
- household-size scaling
- store-specific item matching
- substitution logic
- itemized total calculation

### Weekly Cart Module
- category quota planning
- quantity planning
- product selection
- packaging practicality evaluation
- substitution and explanation metadata

## Design Rule
Domain logic must be pure or near-pure where possible and must not depend directly on HTTP or UI concerns.

---

# 8. Data Layer

## Database Choice
Recommended:
- PostgreSQL

Optional:
- Redis for hot-query caching

## Core Tables
- `stores`
- `products`
- `price_snapshots`
- `deal_rankings`
- `benchmark_results`
- `weekly_cart_results`
- `refresh_runs`

## Raw vs Normalized Storage
Store:
- normalized snapshot rows for downstream logic
- optional raw payload archive only if operationally needed

MVP may omit full raw-payload storage if normalized coverage is sufficient and logging preserves failure diagnosis.

---

# 9. Scheduled Jobs

## Job Group
- `jobs/daily-refresh`

## Subjobs
### 1. Store/Product Snapshot Job
Collect the daily input data required for downstream compute.

### 2. Compute Outputs Job
Compute and persist:
- ranked deals
- average carts
- weekly carts

### 3. Activation Step
Mark the latest successful run as active for reads.

## Scheduling
- default cadence: once per day
- jobs must be idempotent on rerun for same date/store scope

---

# 10. Read Model Strategy

## Principle
User-facing endpoints should read from precomputed tables whenever possible.

## Why
This provides:
- low latency
- deterministic results
- reduced external dependency at request time
- better observability and fallback behavior

## Read Selection Rule
For each endpoint:
- read the latest successful output for the requested store/date scope
- if current-day output is unavailable, return last-known-good result with stale flag

---

# 11. Data Flow

## Ingestion Flow
`PC Express -> integration adapter -> normalized DTOs -> snapshot persistence`

## Compute Flow
`normalized snapshots -> domain logic -> computed result rows`

## Read Flow
`computed result rows -> API DTO shaping -> SPA`

---

# 12. Versioning Strategy

Every computed output should include explicit version metadata:
- `scoringVersion`
- `basketVersion`
- `policyVersion`

This allows safe evolution of:
- scoring logic
- basket rules
- recommendation rules

without silently changing outputs.

---

# 13. Error Handling Strategy

## API Layer
Return structured errors for:
- invalid postal code
- unknown store
- unsupported household size
- missing computed output
- stale data fallback

## Job Layer
Log and classify:
- integration failures
- normalization failures
- compute failures
- persistence failures

## Fallback Rule
A failed refresh must not remove the prior successful output from the read path.

---

# 14. Observability

## Required Signals
- daily refresh success/failure
- per-store compute success/failure
- stale output usage
- API error rates
- coverage confidence for benchmark and weekly cart outputs

## Suggested Telemetry
- structured logs
- per-job metrics
- alert on failed or stale refresh
- traceable refresh run IDs

---

# 15. Security and Operational Concerns

## MVP Considerations
- no user accounts required
- no sensitive end-user PII required beyond postal code input
- validate and sanitize all query parameters
- keep external connector failures isolated from API uptime

## Secrets
Any connector configuration or environment values should be managed through deployment environment configuration, not committed to the repo.

---

# 16. Deployment Model

## Recommended Deployment Shape
- static frontend hosting for SPA
- API service on serverless or container platform
- PostgreSQL managed database
- scheduled job runner via cron/serverless scheduler

## Acceptable Alternatives
A single-service deployment is acceptable for MVP if module boundaries are preserved in code.

---

# 17. Repository Structure

```text
apps/
  web/
  api/
packages/
  domain/
    deals/
    average-cart/
    weekly-cart/
    catalog/
  integrations/
    pc-express/
  db/
  shared/
jobs/
  daily-refresh/
docs/
```

## Shared Package Responsibilities
- common DTOs
- validation schemas
- constants
- type-safe enums
- date/version helpers

---

# 18. Module Dependency Rules

## Allowed Dependencies
- `apps/web` -> `packages/shared`
- `apps/api` -> `packages/shared`, `packages/db`, `packages/domain`
- `jobs/daily-refresh` -> `packages/integrations`, `packages/domain`, `packages/db`, `packages/shared`
- `packages/domain` -> `packages/shared`
- `packages/integrations` -> `packages/shared`
- `packages/db` -> `packages/shared`

## Disallowed Dependencies
- `packages/domain` must not depend on `apps/api` or `apps/web`
- `apps/web` must not depend on `packages/integrations`
- UI code must not contain duplicate business logic from domain packages

---

# 19. MVP Architecture Decisions

## Decision 1
Use daily precomputed outputs instead of request-time recomputation.

## Decision 2
Treat PC Express as an external integration boundary behind normalized adapters.

## Decision 3
Use benchmark and recommendation policies as versioned specs, not ad hoc code behavior.

## Decision 4
Use last-known-good output for resilience when refresh jobs fail.

## Decision 5
Keep one API surface for SPA reads, separate from internal job orchestration.

---

# 20. Future Extension Points

Not required for MVP, but architecture should not block:
- historical price trend views
- budget modes
- dietary presets
- saved store preferences
- checkout/cart handoff
- notification workflows
- more sophisticated substitution engines

---

# 21. Final Summary

The MVP architecture is a layered system that:
- ingests retailer data daily
- normalizes and stores it
- computes deterministic grocery intelligence outputs
- serves them quickly to a React SPA

The design prioritizes:
- speed
- determinism
- explainability
- operational resilience
