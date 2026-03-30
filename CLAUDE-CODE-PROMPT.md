# CLAUDE CODE MEGA-PROMPT: Commodity Investments Monitor

> **Copy this entire file and paste it as your prompt to Claude Code.**
> Run from your VPS or local machine with: `claude --dangerously-skip-permissions`
> Recommended: inside a tmux session for persistence.

---

## MISSION

You are building **Commodity Investments Monitor** — a real-time, data-heavy, India-first commodity trading intelligence dashboard. Think "Bloomberg Terminal for commodities" meets WorldMonitor (https://github.com/koala73/worldmonitor) but **10x deeper** and focused entirely on commodity markets.

## STEP 0: REPOSITORY SETUP

Create a new GitHub repository and initialize the project:

```bash
# Create project directory
mkdir -p ~/commodity-monitor && cd ~/commodity-monitor

# Initialize git repo
git init
git branch -M main

# Create GitHub repo (requires gh CLI authenticated)
gh repo create mohaktnbt/commodity-monitor --public --description "Real-time commodity investments monitor — India-first, Bloomberg-grade intelligence for commodity traders" --source=. --remote=origin

# Disable bracketed paste for tmux compatibility
printf '\e[?2004l'
```

Create the following root files FIRST before any code:

### `CLAUDE.md` (Persistent Agent Context)

```markdown
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
- **VPS**: Hostinger 168.231.103.49, user: mohak

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
```

### `TIMELINE.md`

```markdown
# Build Timeline

## Session 1 — [DATE]
- [ ] Repository initialized
- [ ] Monorepo scaffold created
- [ ] Core shared types defined
- [ ] First data connectors (FRED, Yahoo Finance, data.gov.in)
- [ ] Basic dashboard shell with routing
```

## STEP 1: MONOREPO SCAFFOLD

Initialize the monorepo structure:

```
commodity-monitor/
├── CLAUDE.md
├── TIMELINE.md
├── MANUAL-TODO.md                    # ← copy from the companion file
├── package.json                      # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example                      # all API keys with comments
├── .gitignore
├── docker-compose.yml                # QuestDB + Redis + Redpanda + TimescaleDB + Keycloak
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── commodity.ts       # CommoditySymbol, OHLCVBar, PriceQuote, etc.
│           │   ├── exchange.ts        # Exchange enum, MarketSession
│           │   ├── alert.ts           # AlertRule, AlertChannel
│           │   ├── news.ts            # NewsItem, SentimentScore
│           │   ├── geo.ts             # MandiLocation, PortLocation, MineLocation
│           │   └── index.ts
│           ├── constants/
│           │   ├── commodities.ts     # Master commodity catalog with metadata
│           │   ├── exchanges.ts       # MCX, NCDEX, CME, LME, ICE, etc.
│           │   ├── india-mandis.ts    # Top 500 mandi codes + coordinates
│           │   └── index.ts
│           └── utils/
│               ├── formatters.ts      # price formatting, INR/USD, units (tonnes, barrels, bushels)
│               ├── time.ts            # market hours, IST/UTC/EST conversion
│               └── validators.ts
├── packages/
│   └── data-connectors/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── interface.ts           # IDataConnector { connect, query, stream, schema }
│           ├── registry.ts            # ConnectorRegistry — hot-reloadable
│           ├── connectors/
│           │   ├── fred.ts            # FRED API — WTI, gold, commodity indices
│           │   ├── yahoo-finance.ts   # yfinance via REST — futures, ETFs
│           │   ├── eia.ts             # EIA API v2 — petroleum, gas, coal
│           │   ├── data-gov-in.ts     # India Open Data — mandi prices, WPI
│           │   ├── commodities-api.ts # commodities-api.com — 170+ commodities
│           │   ├── metals-api.ts      # metals-api.com — precious + base metals
│           │   ├── gold-api.ts        # goldapi.io — spot precious metals
│           │   ├── alpha-vantage.ts   # alphavantage.co — multi-commodity
│           │   ├── finnhub.ts         # finnhub.io — futures + WebSocket
│           │   ├── cftc-cot.ts        # CFTC COT reports via Socrata API
│           │   ├── imf-pcps.ts        # IMF commodity price indices
│           │   ├── world-bank.ts      # World Bank Pink Sheet
│           │   ├── fao.ts             # FAOSTAT agricultural data
│           │   ├── noaa-weather.ts    # NOAA CDO API — weather data
│           │   ├── gdelt.ts           # GDELT DOC API — news sentiment
│           │   ├── aisstream.ts       # AISStream — vessel positions WebSocket
│           │   ├── open-meteo.ts      # Open-Meteo — free weather API
│           │   └── index.ts           # re-exports all connectors
│           └── utils/
│               ├── rate-limiter.ts    # token bucket per-connector
│               ├── retry.ts           # exponential backoff with jitter
│               ├── cache.ts           # Redis cache wrapper
│               └── normalizer.ts      # normalize all feeds to unified schema
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── geojson/              # india-states.json, world-ports.json, pipelines.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── router.tsx             # React Router v7
│   │       ├── stores/
│   │       │   ├── price-store.ts     # Zustand — real-time prices via WebSocket
│   │       │   ├── watchlist-store.ts # Zustand — user watchlists
│   │       │   ├── alert-store.ts     # Zustand — active alerts
│   │       │   ├── map-store.ts       # Zustand — map layer toggles
│   │       │   └── theme-store.ts     # Zustand — dark/light/custom
│   │       ├── hooks/
│   │       │   ├── use-commodity-prices.ts    # TanStack Query + WebSocket hybrid
│   │       │   ├── use-mandi-prices.ts        # India mandi data
│   │       │   ├── use-news-feed.ts           # GDELT + custom news
│   │       │   ├── use-weather.ts             # Weather data
│   │       │   └── use-websocket.ts           # Generic WebSocket hook
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── Sidebar.tsx             # Commodity categories nav
│   │       │   │   ├── TopBar.tsx              # Search, alerts, user menu
│   │       │   │   ├── DashboardGrid.tsx       # react-grid-layout for panels
│   │       │   │   └── StatusBar.tsx           # Connection status, data freshness
│   │       │   ├── charts/
│   │       │   │   ├── CandlestickChart.tsx    # TradingView Lightweight Charts wrapper
│   │       │   │   ├── SparklineCard.tsx       # Mini price card with trend
│   │       │   │   ├── CorrelationMatrix.tsx   # D3 heatmap
│   │       │   │   ├── SeasonalChart.tsx       # Multi-year seasonal overlay
│   │       │   │   ├── COTChart.tsx            # CFTC positioning visualization
│   │       │   │   ├── SupplyDemandBalance.tsx # Stacked bar + line combo
│   │       │   │   └── BasisSpreadChart.tsx    # Futures curve / basis chart
│   │       │   ├── maps/
│   │       │   │   ├── CommodityGlobe.tsx      # globe.gl — 3D trade flows
│   │       │   │   ├── IndiaMandiMap.tsx        # deck.gl ScatterplotLayer — mandi prices
│   │       │   │   ├── TradeFlowMap.tsx         # deck.gl ArcLayer — import/export flows
│   │       │   │   ├── InfrastructureMap.tsx    # Mines, ports, refineries, pipelines
│   │       │   │   ├── VesselTracker.tsx        # AIS vessel positions
│   │       │   │   ├── WeatherOverlay.tsx       # Rainfall/drought heatmap
│   │       │   │   └── MapLayerPanel.tsx        # Toggle layers on/off
│   │       │   ├── widgets/
│   │       │   │   ├── PriceTickerBar.tsx       # Scrolling ticker — top commodities
│   │       │   │   ├── WatchlistPanel.tsx       # User watchlists with drag-reorder
│   │       │   │   ├── AlertConfigPanel.tsx     # Create/edit price alerts
│   │       │   │   ├── NewsFeed.tsx             # Commodity news with sentiment badges
│   │       │   │   ├── EconomicCalendar.tsx     # USDA reports, OPEC, RBI dates
│   │       │   │   ├── MorningBriefPanel.tsx    # AI-generated daily brief
│   │       │   │   ├── MonitoringSidebar.tsx    # Quick stats panel
│   │       │   │   └── CommoditySearch.tsx      # Command palette (Cmd+K)
│   │       │   └── india/
│   │       │       ├── MandiPriceTable.tsx       # Sortable mandi price grid
│   │       │       ├── MSPTracker.tsx            # Minimum Support Price vs market
│   │       │       ├── MonsoonTracker.tsx        # IMD monsoon progress
│   │       │       ├── WPIIndicator.tsx          # Wholesale Price Index trends
│   │       │       └── IndiaTradeBalance.tsx     # DGCIS commodity trade
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx         # Main dashboard — customizable grid
│   │       │   ├── CommodityDetail.tsx   # Deep-dive single commodity page
│   │       │   ├── IndiaHub.tsx          # India-specific commodity intelligence
│   │       │   ├── GlobalMap.tsx         # Full-screen map view
│   │       │   ├── Alerts.tsx            # Alert management
│   │       │   ├── Research.tsx          # AI analysis + reports
│   │       │   ├── Settings.tsx          # User preferences, API keys
│   │       │   └── MorningBrief.tsx      # Daily AI brief page
│   │       ├── styles/
│   │       │   ├── globals.css           # CSS custom properties for theming
│   │       │   └── chart-theme.ts        # TradingView chart color config
│   │       └── workers/
│   │           ├── indicator-worker.ts   # Technical indicator calculation
│   │           └── csv-worker.ts         # CSV parsing for bulk data
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Express/Fastify server entry
│   │       ├── routes/
│   │       │   ├── commodities.ts        # /api/v1/commodities/:symbol/prices
│   │       │   ├── mandis.ts             # /api/v1/india/mandis/:commodity
│   │       │   ├── news.ts              # /api/v1/news?commodity=&sentiment=
│   │       │   ├── alerts.ts            # /api/v1/alerts CRUD
│   │       │   ├── watchlists.ts        # /api/v1/watchlists CRUD
│   │       │   ├── weather.ts           # /api/v1/weather/:region
│   │       │   ├── cot.ts              # /api/v1/cot/:commodity
│   │       │   ├── calendar.ts         # /api/v1/calendar/events
│   │       │   └── ai.ts              # /api/v1/ai/brief, /api/v1/ai/analyze
│   │       ├── ws/
│   │       │   ├── price-stream.ts      # WebSocket server — price feeds
│   │       │   ├── news-stream.ts       # WebSocket — news updates
│   │       │   └── alert-stream.ts      # WebSocket — triggered alerts
│   │       ├── services/
│   │       │   ├── price-service.ts     # Aggregates multiple connectors
│   │       │   ├── news-service.ts      # GDELT + custom news aggregation
│   │       │   ├── alert-service.ts     # Alert evaluation engine
│   │       │   ├── mandi-service.ts     # India mandi price processing
│   │       │   └── ai-service.ts        # Claude API for morning briefs
│   │       ├── middleware/
│   │       │   ├── auth.ts              # JWT + Keycloak verification
│   │       │   ├── rate-limit.ts        # Per-user/per-IP rate limiting
│   │       │   └── cache.ts             # Redis response cache
│   │       └── db/
│   │           ├── questdb.ts           # QuestDB client (ILP + REST)
│   │           ├── timescale.ts         # TimescaleDB/PostgreSQL client
│   │           └── redis.ts             # Redis client (ioredis)
│   └── workers/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                  # Worker orchestrator
│           ├── collectors/
│           │   ├── price-collector.ts    # Runs every 30s — fetches from all price APIs
│           │   ├── mandi-collector.ts    # Runs every 1hr — data.gov.in mandi prices
│           │   ├── news-collector.ts     # Runs every 15min — GDELT + news APIs
│           │   ├── weather-collector.ts  # Runs every 6hr — NOAA + Open-Meteo
│           │   ├── cot-collector.ts      # Runs weekly (Fri) — CFTC COT data
│           │   ├── eia-collector.ts      # Runs weekly (Wed) — EIA petroleum
│           │   └── vessel-collector.ts   # AISStream WebSocket — continuous
│           └── pipelines/
│               ├── morning-brief.ts      # 5:30 AM IST — generate AI brief
│               ├── alert-evaluator.ts    # Continuous — check alert rules
│               └── sentiment-scorer.ts   # Batch — score news with FinBERT
└── infra/
    ├── docker-compose.yml
    ├── docker-compose.prod.yml
    ├── keycloak/
    │   └── realm-export.json             # Pre-configured realm
    ├── questdb/
    │   └── init.sql                      # Table schemas
    ├── timescaledb/
    │   └── init.sql                      # User, watchlist, alert tables
    └── nginx/
        └── default.conf                  # Reverse proxy config
```

## STEP 2: IMPLEMENT IN THIS ORDER

### Phase 1 — Foundation (Session 1-2)

1. **Initialize monorepo**: `pnpm init`, create `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`
2. **Create `packages/shared`**: All TypeScript types, commodity constants catalog (symbol, name, exchange, unit, category, subcategory for 150+ commodities), exchange metadata, Indian mandi codes
3. **Create `packages/data-connectors`**: IDataConnector interface + registry + first 5 free connectors:
   - `fred.ts` — Use FRED API (key: `FRED_API_KEY`). Fetch WTI (`DCOILWTICO`), Brent (`DCOILBRENTEU`), gold (`GOLDPMGBD228NLBM`), silver, natural gas, all commodity index
   - `yahoo-finance.ts` — Use `yahoo-finance2` npm package. Fetch futures: `GC=F` (gold), `CL=F` (crude), `SI=F` (silver), `NG=F` (natgas), `HG=F` (copper), `ZW=F` (wheat), `ZC=F` (corn), `ZS=F` (soybeans), `KC=F` (coffee), `CT=F` (cotton), `SB=F` (sugar). Also ETFs: GLD, SLV, USO, DBA, DBC
   - `data-gov-in.ts` — Use data.gov.in API (key: `DATA_GOV_IN_API_KEY`). Resource ID for mandi prices: `9ef84268-d588-465a-a308-a864a43d0070`. Returns: state, district, market, commodity, variety, arrival_date, min_price, max_price, modal_price
   - `eia.ts` — EIA API v2 (key: `EIA_API_KEY`). Endpoints: `/petroleum/pri/spt/data/` (spot prices), `/petroleum/stoc/wstk/data/` (weekly stocks incl Cushing), `/natural-gas/pri/fut/data/`
   - `commodities-api.ts` — commodities-api.com (key: `COMMODITIES_API_KEY`). Endpoints: `/latest`, `/historical`, `/timeseries`, `/fluctuation`
4. **Create `docker-compose.yml`**:

```yaml
services:
  questdb:
    image: questdb/questdb:8.2.3
    ports:
      - "9000:9000"   # Web console
      - "9009:9009"   # ILP (Influx Line Protocol)
      - "8812:8812"   # PostgreSQL wire
    volumes:
      - questdb-data:/var/lib/questdb
      - ./infra/questdb/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - QDB_HTTP_ENABLED=true
  
  timescaledb:
    image: timescale/timescaledb:latest-pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: commodity_monitor
      POSTGRES_USER: ${POSTGRES_USER:-commodity}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-commodity_dev}
    volumes:
      - timescale-data:/var/lib/postgresql/data
      - ./infra/timescaledb/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data

  redpanda:
    image: docker.redpanda.com/redpandadata/redpanda:v24.3.1
    command:
      - redpanda start
      - --smp 1
      - --memory 512M
      - --overprovisioned
      - --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092
      - --advertise-kafka-addr internal://redpanda:9092,external://localhost:19092
    ports:
      - "19092:19092"  # Kafka API
      - "8081:8081"    # Schema Registry
      - "8082:8082"    # REST Proxy

volumes:
  questdb-data:
  timescale-data:
  redis-data:
```

5. **Create QuestDB init schema** (`infra/questdb/init.sql`):

```sql
CREATE TABLE IF NOT EXISTS commodity_prices (
    symbol SYMBOL capacity 512 CACHE,
    exchange SYMBOL capacity 32 CACHE,
    timestamp TIMESTAMP,
    open DOUBLE,
    high DOUBLE,
    low DOUBLE,
    close DOUBLE,
    volume LONG,
    open_interest LONG,
    currency SYMBOL capacity 16 CACHE,
    unit SYMBOL capacity 32 CACHE
) timestamp(timestamp) PARTITION BY DAY WAL
DEDUP UPSERT KEYS(symbol, exchange, timestamp);

CREATE TABLE IF NOT EXISTS mandi_prices (
    state SYMBOL capacity 64 CACHE,
    district SYMBOL capacity 256 CACHE,
    market SYMBOL capacity 512 CACHE,
    commodity SYMBOL capacity 256 CACHE,
    variety SYMBOL capacity 256 CACHE,
    arrival_date TIMESTAMP,
    min_price DOUBLE,
    max_price DOUBLE,
    modal_price DOUBLE,
    unit SYMBOL capacity 16 CACHE
) timestamp(arrival_date) PARTITION BY MONTH WAL;

CREATE TABLE IF NOT EXISTS news_items (
    id SYMBOL capacity 4096 CACHE,
    title STRING,
    source SYMBOL capacity 128 CACHE,
    url STRING,
    published_at TIMESTAMP,
    sentiment_score DOUBLE,
    sentiment_label SYMBOL capacity 16 CACHE,
    commodities STRING,
    country SYMBOL capacity 64 CACHE,
    language SYMBOL capacity 8 CACHE
) timestamp(published_at) PARTITION BY MONTH WAL;
```

6. **Create TimescaleDB init schema** (`infra/timescaledb/init.sql`):

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'viewer',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    symbols TEXT[] NOT NULL DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL,
    condition VARCHAR(32) NOT NULL, -- 'above', 'below', 'pct_change', 'volume_spike'
    threshold DOUBLE PRECISION NOT NULL,
    channels TEXT[] DEFAULT '{email}', -- email, slack, telegram, push
    active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE economic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(512) NOT NULL,
    event_type VARCHAR(64), -- 'usda_report', 'opec', 'rbi', 'cftc_cot', 'eia_weekly'
    scheduled_at TIMESTAMPTZ NOT NULL,
    impact VARCHAR(16), -- 'high', 'medium', 'low'
    commodities_affected TEXT[],
    description TEXT,
    actual_value VARCHAR(128),
    forecast_value VARCHAR(128),
    previous_value VARCHAR(128)
);
```

7. **Scaffold `apps/web`**: `pnpm create vite apps/web --template react-ts`, install deps:

```bash
cd apps/web
pnpm add react-router-dom@7 zustand @tanstack/react-query lightweight-charts @deck.gl/core @deck.gl/layers @deck.gl/react maplibre-gl react-map-gl globe.gl three react-grid-layout echarts echarts-for-react lucide-react date-fns clsx
pnpm add -D tailwindcss @tailwindcss/vite autoprefixer
```

8. **Scaffold `apps/api`**: Express + TypeScript:

```bash
cd apps/api
pnpm add express cors helmet ws ioredis @questdb/nodejs-client pg dotenv node-cron
pnpm add -D @types/express @types/ws @types/cors @types/pg tsx
```

9. **Scaffold `apps/workers`**: 

```bash
cd apps/workers
pnpm add node-cron ioredis @questdb/nodejs-client pg axios ws dotenv
pnpm add -D tsx @types/node-cron
```

10. **Push initial scaffold**: `git add -A && git commit -m "feat: initial monorepo scaffold with full project structure" && git push -u origin main`

### Phase 2 — Data Pipeline (Session 2-3)

Build the data ingestion layer — this is the heart of the platform:

1. **Implement IDataConnector interface** in `packages/data-connectors/src/interface.ts`:

```typescript
export interface IDataConnector {
  readonly name: string;
  readonly source: string;
  readonly rateLimit: { requests: number; windowMs: number };
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Pull-based
  fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]>;
  fetchOHLCV(symbol: string, interval: string, from: Date, to: Date): Promise<OHLCVBar[]>;
  fetchHistorical?(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]>;
  
  // Push-based (optional — for WebSocket sources)
  subscribe?(symbols: string[], callback: (quote: PriceQuote) => void): void;
  unsubscribe?(symbols: string[]): void;
  
  // Metadata
  getSupportedSymbols(): string[];
  getSchema(): ConnectorSchema;
  healthCheck(): Promise<boolean>;
}
```

2. **Implement all 17 connectors listed in the scaffold** — one file per source, each implementing IDataConnector. Priority order:
   - yahoo-finance (broadest free coverage)
   - fred (macro + commodity indices)
   - data-gov-in (mandi prices — India differentiator)
   - eia (petroleum + gas)
   - commodities-api (170+ commodities)
   - metals-api (precious + base metals)
   - gold-api (precious metals spot)
   - alpha-vantage (multi-commodity)
   - finnhub (WebSocket streaming)
   - cftc-cot (positioning data)
   - imf-pcps (indices)
   - world-bank (historical benchmark)
   - fao (agricultural production)
   - noaa-weather (weather data)
   - gdelt (news sentiment)
   - aisstream (vessel tracking WebSocket)
   - open-meteo (free weather)

3. **Implement ConnectorRegistry** — registry that auto-discovers, health-checks, and load-balances across connectors for each commodity symbol. If commodities-api fails for gold, fall back to metals-api, then yahoo-finance, then fred.

4. **Build collectors** in `apps/workers/src/collectors/`:
   - `price-collector.ts`: Runs `*/30 * * * * *` (every 30s). Fetches latest prices from all active connectors, normalizes to unified schema, writes to QuestDB via ILP protocol, publishes to Redis Stream `prices:updates`
   - `mandi-collector.ts`: Runs `0 */1 * * *` (every hour). Fetches from data.gov.in API, deduplicates, writes to QuestDB `mandi_prices` table
   - `news-collector.ts`: Runs `*/15 * * * *` (every 15 min). Fetches from GDELT DOC API + any configured news APIs, writes to QuestDB `news_items`
   - `cot-collector.ts`: Runs `0 18 * * 5` (Fridays 6pm). Fetches CFTC COT from Socrata API, writes to dedicated QuestDB table
   - `eia-collector.ts`: Runs `0 16 * * 3` (Wednesdays 4pm). Fetches EIA weekly petroleum report

5. **Write to QuestDB via ILP** (fastest ingestion path, 1M+ rows/sec):

```typescript
import { Sender } from '@questdb/nodejs-client';

const sender = Sender.fromConfig('http::addr=localhost:9009;');
await sender
  .table('commodity_prices')
  .symbol('symbol', 'GOLD')
  .symbol('exchange', 'COMEX')
  .floatColumn('open', 2345.50)
  .floatColumn('high', 2351.20)
  .floatColumn('low', 2340.10)
  .floatColumn('close', 2348.80)
  .intColumn('volume', 182345)
  .at(Date.now(), 'ms');
await sender.flush();
```

### Phase 3 — API Server (Session 3-4)

1. **Build REST endpoints** in `apps/api/`:
   - `GET /api/v1/commodities` — list all commodities with latest prices
   - `GET /api/v1/commodities/:symbol/prices?interval=1d&from=&to=` — OHLCV history from QuestDB
   - `GET /api/v1/commodities/:symbol/quote` — latest price from Redis cache
   - `GET /api/v1/india/mandis?commodity=wheat&state=telangana` — mandi prices
   - `GET /api/v1/news?commodity=gold&limit=50` — news feed with sentiment
   - `GET /api/v1/cot/:symbol` — CFTC positioning data
   - `GET /api/v1/calendar/events?from=&to=` — economic events calendar
   - `GET /api/v1/weather/india?metric=rainfall` — weather data
   - `POST /api/v1/alerts` — create alert rule
   - `GET /api/v1/alerts` — list user alerts
   - `POST /api/v1/ai/analyze` — run AI analysis on a commodity

2. **Build WebSocket server** in `apps/api/src/ws/`:
   - Subscribe to Redis Stream `prices:updates`
   - Clients connect to `ws://host/ws/prices` and send `{"subscribe": ["GOLD", "CRUDE_OIL", "WHEAT"]}`
   - Server pushes `{"type": "price", "symbol": "GOLD", "data": {...}}` on every update
   - News stream: `ws://host/ws/news`
   - Alert stream: `ws://host/ws/alerts` (per-user, authenticated)

3. **Implement Redis caching layer**:
   - `commodity:quote:{symbol}` — latest quote, TTL 30s
   - `commodity:ohlcv:{symbol}:{interval}:{date}` — OHLCV bars, TTL 5min for today, 24hr for historical
   - `news:latest:{commodity}` — latest 50 news items, TTL 5min
   - `mandi:latest:{commodity}:{state}` — latest mandi prices, TTL 30min

### Phase 4 — Frontend Dashboard (Session 4-6)

Build the React frontend. **Dark theme by default** (commodity traders prefer dark). Use the WorldMonitor aesthetic as baseline — dark background, neon green/blue accents, glass-morphism panels.

1. **Layout shell**: Sidebar (commodity categories) + TopBar (search + alerts + profile) + Main (react-grid-layout panels) + StatusBar (connection status)

2. **Dashboard page** (default): Grid of draggable/resizable panels:
   - Price Ticker Bar (top, full width) — scrolling latest prices
   - Watchlist Panel (left sidebar)
   - Main Chart (center, largest) — TradingView Lightweight Charts candlestick
   - News Feed (right sidebar) — with sentiment color badges
   - India Mandi Summary (bottom left) — top movers
   - Market Heatmap (bottom center) — ECharts treemap by commodity category
   - Economic Calendar (bottom right) — upcoming events

3. **CandlestickChart component** — wrapper around TradingView Lightweight Charts:
   - Initialize with dark theme colors matching dashboard
   - Support candlestick, line, area, histogram series
   - Volume histogram below price chart
   - Crosshair with tooltip showing OHLCV
   - Time intervals: 1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M
   - Connect to WebSocket for real-time updates via `series.update()`

4. **CommodityGlobe** — globe.gl component showing:
   - Trade flow arcs (import/export by commodity, color-coded)
   - Hex bins for production density
   - Points for mines, ports, refineries
   - India highlighted with mandi density overlay

5. **IndiaMandiMap** — deck.gl map centered on India:
   - ScatterplotLayer: mandi locations, radius proportional to price, color = price trend
   - TooltipLayer: hover shows commodity, price, change, district
   - Filters: commodity type, state, price range, date

6. **Command Palette** (Cmd+K): Full-text search across commodities, news, mandis, alerts

7. **Responsive design**: Desktop-first but functional on tablet. Mobile gets a simplified single-column view.

### Phase 5 — India-Specific Features (Session 6-7)

1. **India Hub page** — dedicated page with:
   - Mandi price heatmap (all India, color = price level)
   - MSP vs market price comparison table
   - Monsoon tracker (IMD data visualization)
   - WPI trend charts by commodity group
   - State-wise production charts
   - DGCIS trade balance visualizations

2. **Monsoon Tracker widget**: Shows IMD monsoon progress as India map with district-level rainfall deviation from normal. Use Open-Meteo or data.gov.in rainfall API.

3. **MSP Tracker**: Table comparing Minimum Support Price (manually updated from government announcements in the constants file) against current mandi modal prices. Green = above MSP, red = below MSP.

### Phase 6 — AI Features (Session 7-8)

1. **Morning Brief pipeline** (`apps/workers/src/pipelines/morning-brief.ts`):
   - Runs at 5:30 AM IST via cron
   - Collects: overnight price changes (QuestDB), top news (GDELT), weather alerts, COT changes
   - Formats structured data as prompt context
   - Calls Claude API (`claude-sonnet-4-20250514`) with system prompt:
     ```
     You are a commodity market analyst writing a morning brief for Indian commodity traders. 
     Cover: key overnight price moves, India-specific developments (mandi prices, MSP, monsoon), 
     global supply-demand shifts, and actionable watchlist items. Be concise, data-driven, 
     and highlight India-specific angles.
     ```
   - Stores generated brief in TimescaleDB
   - Exposes via `/api/v1/ai/brief/latest`

2. **AI Analyze endpoint** (`/api/v1/ai/analyze`):
   - Accepts: `{ commodity: "GOLD", question: "What's driving gold prices this week?" }`
   - Gathers relevant context: recent prices, news, COT positioning, weather
   - Calls Claude with context + question
   - Returns structured analysis

### Phase 7 — Alerts & Notifications (Session 8)

1. **Alert evaluation engine**: Runs every price update cycle (30s). Checks all active alert rules against latest prices. Supports: price above/below threshold, percentage change in period, volume spike.

2. **Notification channels**: 
   - Email via Nodemailer + SMTP
   - Slack webhook
   - Telegram bot API
   - WebSocket push to dashboard

### Phase 8 — Polish & Deploy (Session 9-10)

1. **Production Docker Compose** with nginx reverse proxy, SSL via Let's Encrypt
2. **Health monitoring**: `/health` endpoint, Prometheus metrics
3. **CI/CD**: GitHub Actions for lint, test, build, deploy to VPS
4. **README.md** with screenshots, architecture diagram, API docs

---

## CODING STANDARDS

- **TypeScript strict mode** everywhere — no `any`, no `ts-ignore`
- **Zod** for runtime validation of all API inputs and external data
- **Error boundaries** in React — never crash the whole dashboard
- **Graceful degradation**: If a data source fails, show stale data with a "stale" badge, never blank panels
- **Rate limiter per connector** — respect API limits, use token bucket algorithm
- **All prices in a consistent format**: `{ value: number, currency: 'USD' | 'INR', unit: 'oz' | 'bbl' | 'mt' | 'bushel' | 'quintal', timestamp: number }`
- **No hardcoded API keys** — everything from `.env`, document in `.env.example`
- **Commit frequently** with conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

## ENV VARIABLES NEEDED

```env
# Free tier APIs (get keys from respective sites)
FRED_API_KEY=                    # fred.stlouisfed.org
EIA_API_KEY=                     # eia.gov/opendata/register.php
DATA_GOV_IN_API_KEY=             # data.gov.in (free registration)
COMMODITIES_API_KEY=             # commodities-api.com
METALS_API_KEY=                  # metals-api.com
GOLD_API_KEY=                    # goldapi.io
ALPHA_VANTAGE_KEY=               # alphavantage.co
FINNHUB_API_KEY=                 # finnhub.io
NOAA_CDO_TOKEN=                  # ncdc.noaa.gov/cdo-web/token

# AI
ANTHROPIC_API_KEY=               # console.anthropic.com

# Database
QUESTDB_HOST=localhost
QUESTDB_HTTP_PORT=9000
QUESTDB_ILP_PORT=9009
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=commodity_monitor
POSTGRES_USER=commodity
POSTGRES_PASSWORD=
REDIS_URL=redis://localhost:6379

# Notifications (optional)
SLACK_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## WHAT NOT TO DO

- Do NOT use Next.js — we want a pure SPA (Vite + React) for maximum flexibility and Tauri compatibility
- Do NOT use Prisma — use raw SQL with pg driver for TimescaleDB, QuestDB has its own client
- Do NOT over-abstract early — build working connectors first, refactor patterns later
- Do NOT block the UI thread — all heavy computation (indicators, CSV parsing) goes to Web Workers
- Do NOT store API keys in code or commit `.env` files
- Do NOT build auth from scratch — use Keycloak and add it in Phase 8

## REFERENCE REPOSITORIES

- WorldMonitor: https://github.com/koala73/worldmonitor — architecture patterns, globe.gl usage, data layer system
- WorldMonitor macOS fork: https://github.com/bradleybond512/worldmonitor-macos — Tauri desktop patterns
- OpenBB: https://github.com/OpenBB-finance/OpenBB — data connector patterns, commodity data access
- TradingView Lightweight Charts: https://github.com/tradingview/lightweight-charts — chart integration

---

## BEGIN

Start with **Phase 1, Step 1**. Initialize the monorepo, create all directories, scaffold all packages, create the Docker Compose file, and push the initial commit. Then move to Phase 1 Step 2 and continue sequentially.

After each phase, update TIMELINE.md with completed items and commit.

**GO.**
