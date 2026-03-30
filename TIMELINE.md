# Build Timeline

## Session 1 — 2026-03-30
- [x] Repository initialized
- [x] Monorepo scaffold created (pnpm workspaces, 4 packages)
- [x] Core shared types defined (commodity, exchange, alert, news, geo)
- [x] 70+ commodity constants catalog (energy, metals, agriculture, softs, spices, pulses)
- [x] 75+ Indian mandi locations with coordinates
- [x] Exchange metadata (MCX, NCDEX, CME, COMEX, NYMEX, CBOT, LME, ICE)
- [x] All 17 data connectors implemented (yahoo-finance, FRED, data.gov.in, EIA, commodities-api, metals-api, gold-api, alpha-vantage, finnhub, CFTC-COT, IMF, World Bank, FAO, NOAA, GDELT, AISStream, Open-Meteo)
- [x] ConnectorRegistry with health checks and fallback routing
- [x] Rate limiter (token bucket), retry with exponential backoff, Redis cache wrapper
- [x] React dashboard shell with routing (8 pages)
- [x] 5 Zustand stores (prices, watchlists, alerts, map layers, theme)
- [x] 5 TanStack Query hooks + WebSocket hook
- [x] Layout components (Sidebar, TopBar, StatusBar, DashboardGrid)
- [x] Chart components (CandlestickChart, SparklineCard + 5 placeholders)
- [x] Widget components (PriceTickerBar, WatchlistPanel, NewsFeed, CommoditySearch + 4 placeholders)
- [x] Map components (7 placeholders + MapLayerPanel)
- [x] India components (MandiPriceTable + 4 placeholders)
- [x] API server with 9 route modules, 3 WebSocket streams, 5 services, 3 middleware, 3 DB clients
- [x] Workers with 7 collectors + 3 pipelines (morning brief, alert evaluator, sentiment scorer)
- [x] Docker Compose (QuestDB, TimescaleDB, Redis, Redpanda)
- [x] DB schemas (QuestDB init.sql, TimescaleDB init.sql)
- [x] Keycloak realm config, nginx reverse proxy
- [x] All packages compile cleanly with TypeScript strict mode
