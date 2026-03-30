# MANUAL TODO — Commodity Investments Monitor

> **Things YOU (Magnifico) need to do that Claude Code cannot execute.**
> Check items off as you complete them. Copy this file into the repo root.

---

## PRIORITY 1 — Required Before First `pnpm dev` Run

### Free API Key Signups (10 minutes total)

- [ ] **FRED API Key** — https://fred.stlouisfed.org/docs/api/api_key.html
  - Sign up → instant key → add to `.env` as `FRED_API_KEY`
  - Free, unlimited for non-commercial, 120 req/min

- [ ] **EIA API Key** — https://www.eia.gov/opendata/register.php
  - Sign up → instant key → add to `.env` as `EIA_API_KEY`
  - Free, no rate limit published

- [ ] **data.gov.in API Key** — https://data.gov.in/user/register
  - Register with Indian mobile number → verify → go to "My Account" → "API Keys" → generate
  - Add to `.env` as `DATA_GOV_IN_API_KEY`
  - Free, 1000 req/day (sufficient for hourly mandi fetches)

- [ ] **Commodities-API.com** — https://commodities-api.com/register
  - Free plan: 100 req/month → add to `.env` as `COMMODITIES_API_KEY`
  - Paid ($10/mo): 10,000 req/month — recommended for production

- [ ] **Metals-API** — https://metals-api.com/register
  - Free plan: 100 req/month → add to `.env` as `METALS_API_KEY`
  - Paid ($10/mo): 10,000 req/month — covers precious + base metals

- [ ] **GoldAPI.io** — https://www.goldapi.io/dashboard
  - Free plan: 300 req/month → add to `.env` as `GOLD_API_KEY`

- [ ] **Alpha Vantage** — https://www.alphavantage.co/support/#api-key
  - Free: 25 req/day, 5 req/min → add to `.env` as `ALPHA_VANTAGE_KEY`
  - Premium ($50/mo): 75 req/min — recommended

- [ ] **Finnhub** — https://finnhub.io/register
  - Free: 60 calls/min, real-time WebSocket → add to `.env` as `FINNHUB_API_KEY`

- [ ] **Anthropic API Key** — https://console.anthropic.com/settings/keys
  - For AI morning briefs and analysis → add to `.env` as `ANTHROPIC_API_KEY`
  - You already have this from your other projects

### GitHub CLI Authentication (on VPS)

- [ ] **Authenticate `gh` CLI on VPS** (168.231.103.49):
  ```bash
  ssh mohak@168.231.103.49
  gh auth login
  # Choose: GitHub.com → HTTPS → Login with browser/token
  ```

### Docker Installation Check

- [ ] **Verify Docker + Docker Compose on VPS**:
  ```bash
  docker --version        # Need 24+
  docker compose version  # Need v2.20+
  ```
  If missing: `curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker mohak`

---

## PRIORITY 2 — Required Before Production Deploy

### Domain & SSL

- [ ] **Register domain** (suggestion: `commoditymonitor.in` or `vyapaarmonitor.com`)
  - Use Hostinger domain registration or Namecheap
  - Point A record to 168.231.103.49

- [ ] **SSL Certificate** — Let's Encrypt via Certbot:
  ```bash
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```

### Enhanced API Keys (Paid Tiers)

- [ ] **Twelve Data** ($29/mo) — https://twelvedata.com/pricing
  - 800 req/min, 100K+ symbols → best value for real-time commodity data
  - Add to `.env` as `TWELVE_DATA_API_KEY`

- [ ] **NOAA CDO Token** (free) — https://www.ncdc.noaa.gov/cdo-web/token
  - Email-based, takes 1-2 days → add to `.env` as `NOAA_CDO_TOKEN`

- [ ] **AISStream API Key** (free) — https://aisstream.io/authenticate
  - Free WebSocket feed for vessel tracking → add to `.env` as `AISSTREAM_API_KEY`

- [ ] **Databento** (pay-per-use) — https://databento.com/signup
  - Institutional-grade CME/ICE futures data
  - $0.50/GB consumed — excellent for historical data backfill
  - Add to `.env` as `DATABENTO_API_KEY`

### Notification Channels

- [ ] **Slack Webhook** — Create incoming webhook at https://api.slack.com/apps
  - Create new app → Incoming Webhooks → Add to channel
  - Add URL to `.env` as `SLACK_WEBHOOK_URL`

- [ ] **Telegram Bot** — Message @BotFather on Telegram
  - `/newbot` → name it "Commodity Monitor Bot"
  - Save token → add to `.env` as `TELEGRAM_BOT_TOKEN`
  - Get your chat ID via https://api.telegram.org/bot<TOKEN>/getUpdates
  - Add to `.env` as `TELEGRAM_CHAT_ID`

- [ ] **SMTP for Email Alerts** — Use your existing email provider or:
  - Brevo (free 300 emails/day): https://www.brevo.com/
  - Add SMTP credentials to `.env`

---

## PRIORITY 3 — India-Specific Data That Requires Manual Collection

These data sources don't have clean APIs and need **one-time manual data collection** that gets committed to the repo as static JSON/CSV files:

### Static Data Files to Create

- [ ] **Minimum Support Price (MSP) Table** — Create `packages/shared/src/constants/msp-prices.ts`
  - Source: https://farmer.gov.in/mspstatements.aspx
  - Collect current MSP for: paddy, wheat, jowar, bajra, maize, ragi, arhar/tur, moong, urad, cotton, groundnut, sunflower, soybean, sesamum, nigerseed, mustard/rapeseed, lentil (masur), safflower, jute, copra, sugarcane
  - Format: `{ crop: string, mspKharif?: number, mspRabi?: number, season: string, year: string, unit: 'INR/quintal' }`

- [ ] **Indian Mandi Coordinates** — Create `packages/shared/src/constants/india-mandis.ts`
  - Start with top 500 mandis from AGMARKNET by volume
  - Need: name, state, district, lat, lng, mandiCode
  - Sources: AGMARKNET website + Google Maps geocoding
  - Consider: pay for Google Geocoding API batch ($5/1000 addresses) or use free Nominatim

- [ ] **Indian Mine Locations** — Create `apps/web/public/geojson/india-mines.json`
  - Source: Indian Bureau of Mines (ibm.gov.in) mineral maps + USGS MRDS
  - Key mines: coal (Jharkhand, Odisha, Chhattisgarh), iron ore (Goa, Karnataka, Odisha), bauxite (Odisha, Gujarat), copper (Rajasthan), gold (Karnataka), zinc-lead (Rajasthan)
  - Format: GeoJSON FeatureCollection with properties: name, mineral, state, production_mt, operator

- [ ] **India Refinery Locations** — Create `apps/web/public/geojson/india-refineries.json`
  - 23 refineries: Jamnagar (Reliance), Mangalore (MRPL), Chennai (CPCL), Mathura, Kochi, Haldia, etc.
  - Source: PPAC refinery list + Google Maps
  - Format: GeoJSON with properties: name, operator, capacity_mmtpa, lat, lng

- [ ] **India Major Ports** — Create `apps/web/public/geojson/india-ports.json`
  - 13 major ports + key minor ports
  - Source: indianports.gov.in
  - Include: commodity types handled, annual throughput

- [ ] **Economic Events Calendar** — Create initial seed data
  - USDA WASDE report dates (monthly, around 10th-12th)
  - OPEC+ meeting dates
  - RBI MPC meeting dates
  - CFTC COT release dates (every Friday)
  - EIA Weekly Petroleum report (every Wednesday)
  - IMD monsoon forecast dates (April, June)
  - Indian Budget date (Feb 1)
  - Source: Compile from respective organization websites

### GeoJSON Files to Download

- [ ] **India States Boundaries** — Download from:
  - https://github.com/datameet/maps — India state/district GeoJSON (open license)
  - Save to `apps/web/public/geojson/india-states.json`

- [ ] **World Pipelines** — Download from:
  - OpenStreetMap Overpass API query for `pipeline=*`
  - Or use pre-compiled: https://github.com/datasets/geo-countries
  - Key pipelines: Druzhba, Keystone, TAPI, East-West (India)
  - Save to `apps/web/public/geojson/world-pipelines.json`

- [ ] **Global Commodity Chokepoints** — Create manually:
  - Strait of Hormuz, Strait of Malacca, Suez Canal, Panama Canal, Bosphorus, Danish Straits, Cape of Good Hope
  - Format: GeoJSON with polygon/line + properties: name, annual_trade_volume, key_commodities
  - Save to `apps/web/public/geojson/chokepoints.json`

---

## PRIORITY 4 — Premium/Enterprise Data Sources (When Ready to Scale)

### Paid Data Subscriptions to Evaluate

- [ ] **Global Datafeeds** (globaldatafeeds.in) — MCX + NCDEX real-time feed
  - Contact for pricing: sales@globaldatafeeds.in
  - Required for <1s MCX/NCDEX data (free APIs have 60s+ delay)

- [ ] **TrueData** (truedata.in) — Alternative MCX/NCDEX feed provider
  - Plans from ₹500/mo for delayed, ₹2000/mo for real-time

- [ ] **Kpler** (kpler.com) — Cargo flow intelligence
  - Enterprise pricing ($30K-100K/year) — evaluate during beta
  - Contact: sales@kpler.com

- [ ] **Kayrros/Energy Aspects** — Satellite-derived oil inventories
  - Contact for API access and pricing

- [ ] **Planet Labs** (planet.com) — Daily satellite imagery
  - Free tier: 5,000 km²/month of archive
  - Useful for crop monitoring in key Indian agricultural belts

- [ ] **S&P Global Platts** / **Argus Media** — Physical commodity benchmarks
  - These are the gold standard for physical commodity pricing
  - Enterprise pricing, evaluate when monetizing

### Kaggle Datasets to Download (For Historical Backfill)

- [ ] **Commodity Prices 2000-2023** — https://www.kaggle.com/datasets/debashish311601/commodity-prices
- [ ] **Global Commodity Trade Statistics (UN)** — https://www.kaggle.com/datasets/unitednations/global-commodity-trade-statistics
- [ ] **Precious Metals Data & News 2000-Present** — https://www.kaggle.com/datasets/romanfonel/precious-metals-history-since-2000-with-news
- [ ] **Crude Oil Historical Price** — https://www.kaggle.com/datasets/prashants12/crude-oil-historical-price
- [ ] **Natural Gas Prices** — https://www.kaggle.com/datasets/tunguz/natural-gas-prices
- [ ] **Indian Agricultural Mandi Prices 2023-2025** — https://www.kaggle.com/datasets/arjunyadav99/indian-agricultural-mandi-prices-20232025
- [ ] **World Mining Commodities** — https://www.kaggle.com/datasets/martinfrederiksen/world-mining-commodities
- [ ] **Mineral Ores Around the World** — https://www.kaggle.com/datasets/ramjasmaurya/mineral-ores-around-the-world
- [ ] **Coffee Dataset** — https://www.kaggle.com/datasets/michals22/coffee-dataset
- [ ] **World Bank Commodity Price Intelligence** — https://www.kaggle.com/datasets/kanchana1990/world-bank-commodity-price-intelligence-19602026

Download these and place in `data/kaggle/` directory (gitignored). Use the workers to backfill QuestDB.

---

## PRIORITY 5 — Marketing & Business Setup

- [ ] **Logo and brand assets** — Commission or create commodity-themed logo
- [ ] **Landing page** — Deploy at domain root before dashboard goes live
- [ ] **Analytics** — Set up Plausible or PostHog (self-hosted on VPS)
- [ ] **Documentation** — Create docs site (Docusaurus or VitePress)
- [ ] **BNI/Business network announcement** — Announce beta to your Hyderabad BNI network
- [ ] **Social media** — Twitter/X account for commodity insights (drives organic traffic)

---

## REFERENCE: API Rate Limits Summary

| API | Free Tier | Paid Tier | Rate Limit |
|-----|-----------|-----------|------------|
| FRED | Unlimited | N/A | 120 req/min |
| EIA | Unlimited | N/A | Not published |
| data.gov.in | 1,000/day | N/A | Per-key |
| Commodities-API | 100/month | $10/mo = 10K | — |
| Metals-API | 100/month | $10/mo = 10K | — |
| GoldAPI.io | 300/month | $10/mo = 5K | — |
| Alpha Vantage | 25/day | $50/mo = 75/min | 5/min free |
| Finnhub | Unlimited | $50/mo | 60/min free |
| Twelve Data | 800/day | $29/mo = 800/min | 8/min free |
| Yahoo Finance | Unofficial | N/A | ~2000/hour |
| GDELT DOC API | Unlimited | N/A | Reasonable use |
| AISStream | Unlimited | N/A | 1 WebSocket |
| Open-Meteo | Unlimited | N/A | 10K/day |
| NOAA CDO | Unlimited | N/A | 5/sec, 1000/day |
| Anthropic | Pay-per-use | — | Varies by tier |

**Estimated monthly API cost for production (Phase 1):**
- Commodities-API Pro: $10
- Metals-API Pro: $10
- Alpha Vantage Premium: $50
- Twelve Data Grow: $29
- Anthropic Claude (morning briefs): ~$15-30
- **Total: ~$115-130/month**

---

## CHECKLIST STATUS

```
Priority 1: [ ] / [10] complete
Priority 2: [ ] / [8] complete
Priority 3: [ ] / [9] complete
Priority 4: [ ] / [16] complete
Priority 5: [ ] / [6] complete
```

Last updated: ____________________
