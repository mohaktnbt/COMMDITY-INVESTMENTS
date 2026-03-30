# Commodity Investments Monitor — Agent Context

## Project
Real-time commodity trading intelligence dashboard. India-first, globally comprehensive.
Inspired by WorldMonitor (github.com/koala73/worldmonitor) but commodity-focused.

## Stack
- **Frontend**: React 18 + TypeScript + Vite 6
- **State**: Zustand (real-time) + TanStack Query v5 (server cache)
- **Charts**: TradingView Lightweight Charts v5 (financial) + Apache ECharts (analytical) + D3.js (custom)
- **Maps**: deck.gl v9 + MapLibre GL JS v4 + globe.gl (3D globe)
- **Backend**: Node.js 22 + Express/Fastify + TypeScript
- **Database**: QuestDB (hot OHLCV) + TimescaleDB/PostgreSQL (metadata, users) + Redis 7 (cache + streams)
- **Streaming**: Kafka (Redpanda single-node for dev) → Redis Streams → WebSocket (ws)
- **AI**: Claude API (morning briefs) + FinBERT (sentiment) + Chronos-2 (forecasting)
- **Auth**: Keycloak (enterprise SSO/RBAC)
- **Deploy**: Docker Compose (dev) → Kubernetes/Helm (prod)

## Architecture Pattern
Monorepo with pnpm workspaces:
- `packages/shared` — types, constants, commodity schemas
- `packages/data-connectors` — unified IDataConnector interface, one file per source
- `apps/web` — React dashboard SPA
- `apps/api` — REST/WebSocket API server
- `apps/workers` — background data collection, AI pipelines
- `infra/` — Docker Compose, Kubernetes configs, Keycloak realm

## Key Commands
- `pnpm dev` — start all services in dev mode
- `pnpm build` — production build
- `pnpm test` — vitest for all packages
- `pnpm lint` — eslint + prettier

## Session Continuity
Check TIMELINE.md for what was completed in previous sessions.
Always update TIMELINE.md at end of each session.
