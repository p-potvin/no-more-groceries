# ARCHITECTURE

## Topology
- React SPA frontend
- Node API backend
- scheduled daily refresh job
- persistent storage for snapshots and derived outputs

## Core Components

### Frontend
- store selector
- deals dashboard
- average cart summary
- recommended weekly cart view
- store comparison view

### Backend
- store lookup service
- product search adapter
- deals service
- average cart service
- recommended cart service
- comparison service

### Data
- stores
- products
- price snapshots
- deal rankings
- benchmark baskets
- recommended weekly carts

## Refresh Model
- daily scheduled refresh
- normalize fetched data
- compute derived outputs
- cache read endpoints
- expose last successful refresh timestamp

## Failure Strategy
- idempotent refresh job
- last-good snapshot fallback
- stale-data marker in API responses
