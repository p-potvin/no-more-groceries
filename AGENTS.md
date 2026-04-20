# AGENTS.md

## Project
PC Express Daily Grocery Deals SPA

## Objective
Build a React SPA that updates daily using PC Express data and shows:
- best deals for a selected store
- average grocery cart total for a household of size `X`
- recommended pre-filled 7-day grocery cart for `X` people
- store selection by postal code / location or manual store selection

## Constraints
- Frontend: React SPA, TypeScript
- Backend required for daily refresh, caching, and precomputation
- Data source: PC Express store search, product search, cart operations
- Must support nearby-store flow and manual-store flow
- Must be fast on mobile
- Must expose refresh timestamp and stale-data handling

## Architecture
- `apps/web` → React SPA
- `apps/api` → API server
- `packages/domain` → pricing, deals, basket logic
- `packages/integrations` → PC Express adapter
- `packages/db` → schema, migrations, queries
- `packages/shared` → types, DTOs, utils
- `jobs/daily-refresh` → scheduled snapshot and recompute pipeline
- `docs/` → specs and decision records

## Global Acceptance Criteria
- User can select store from postal code results or from a store list
- SPA shows best deals for selected store
- SPA shows average cart estimate for household size `X`
- SPA shows recommended 7-day cart for household size `X`
- Data refreshes daily
- API serves cached/precomputed results
- Core logic is test-covered
- Errors and stale data are visible in UI

## Shared Definitions
### "Best deals"
Ranked using:
- discount %
- normalized unit price
- basket relevance

### "Average cart"
A benchmark weekly grocery basket for household size `X`, based on category quotas and standard staple items.

### "Recommended 7-day cart"
A store-specific weekly cart generated from:
- household size
- category quotas
- lowest acceptable product matches
- substitution fallback rules

## Repo Skeleton
```text
apps/
  web/
  api/
packages/
  domain/
    deals/
    average-cart/
    weekly-cart/
  integrations/
    pc-express/
  db/
  shared/
jobs/
  daily-refresh/
docs/
  PRD.md
  benchmark-basket.md
  scoring.md
  ADRs/
```

## Execution Rules for Agents
- Do not change scope without updating `docs/PRD.md`
- Prefer small PRs by task ID
- Document assumptions in task notes
- Add tests for all pricing/recommendation logic
- Use mocks for external integration tests where possible
- Do not block on perfect data coverage; implement fallbacks
- Every completed task must update:
  - status
  - files changed
  - risks / follow-ups

## Dispatch Order
1. `PM-01` through `PM-04`
2. `ARCH-01`
3. `DATA-01` through `DATA-05`
4. `ENG-BE-*` and `ENG-DOM-*` in parallel where dependencies allow
5. `ENG-FE-*`
6. `QA-*`
7. `OPS-*`
