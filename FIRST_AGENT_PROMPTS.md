# FIRST_AGENT_PROMPTS.md

## product-agent
Write `docs/PRD.md`, `docs/benchmark-basket.md`, `docs/scoring.md`, and `docs/recommendation-policy.md` for the PC Express grocery deals SPA. Keep scope to MVP only. Do not invent features outside the defined objective. Make rules deterministic and implementation-ready.

## architect-agent
Write `docs/architecture.md` and `docs/api-contracts.md`. Define backend modules, jobs, storage model, endpoint contracts, and system boundaries. Optimize for daily precomputed outputs and a fast SPA.

## integration-agent
Implement `packages/integrations/pc-express/store-search.ts` and `packages/integrations/pc-express/product-search.ts`. Normalize external responses into internal DTOs. Add tests using mocks. Do not add UI code.

## data-agent
Create DB schema/migrations and daily refresh job. Persist stores, normalized products, price snapshots, and computed outputs. Ensure jobs are idempotent and observable.

## domain-agent
Implement unit normalization, deal scoring, benchmark cart calculation, and weekly cart generation. Prioritize deterministic outputs, explainability, and test coverage.

## backend-agent
Scaffold API server and expose endpoints for stores, deals, average cart, recommended cart, and store comparison. Read from precomputed tables where possible.

## frontend-agent
Scaffold React SPA and build store selection, deals dashboard, average cart view, weekly cart view, and comparison view. Implement all loading/error/empty/stale states.

## qa-agent
Add unit, integration, and E2E coverage for core user flows and pricing logic. Focus on confidence, not exhaustive snapshot testing.

## ops-agent
Set up CI, daily scheduler, logging, alerts, and a runbook. Optimize for repeatable deploys and rapid issue diagnosis.
