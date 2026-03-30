import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://www.imf.org/external/np/res/commod';

/** Mapping of IMF commodity keys to human-readable names */
const IMF_COMMODITY_KEYS: Record<string, { name: string; unit: string }> = {
  PCRUDOIL: { name: 'Crude Oil (avg)', unit: 'USD/bbl' },
  PNGAS: { name: 'Natural Gas (avg)', unit: 'USD/MMBtu' },
  PGOLD: { name: 'Gold', unit: 'USD/oz' },
  PSILVER: { name: 'Silver', unit: 'USD/oz' },
  PCOPP: { name: 'Copper', unit: 'USD/mt' },
  PALUM: { name: 'Aluminum', unit: 'USD/mt' },
  PNICK: { name: 'Nickel', unit: 'USD/mt' },
  PZINC: { name: 'Zinc', unit: 'USD/mt' },
  PLEAD: { name: 'Lead', unit: 'USD/mt' },
  PTIN: { name: 'Tin', unit: 'USD/mt' },
  PIRON: { name: 'Iron Ore', unit: 'USD/mt' },
  PCOAL: { name: 'Coal (Australian)', unit: 'USD/mt' },
  PWHEAT: { name: 'Wheat', unit: 'USD/mt' },
  PMAIZMT: { name: 'Maize (Corn)', unit: 'USD/mt' },
  PRICENPQ: { name: 'Rice', unit: 'USD/mt' },
  PSOYB: { name: 'Soybeans', unit: 'USD/mt' },
  PPOIL: { name: 'Palm Oil', unit: 'USD/mt' },
  PSUGA: { name: 'Sugar', unit: 'cents/lb' },
  PCOFFOTM: { name: 'Coffee (Other Milds)', unit: 'cents/lb' },
  PCOCO: { name: 'Cocoa', unit: 'USD/mt' },
  PCOTTIND: { name: 'Cotton', unit: 'cents/lb' },
  PRUBB: { name: 'Rubber', unit: 'cents/lb' },
  PBEEF: { name: 'Beef', unit: 'cents/lb' },
};

/** Structure of the IMF External_Data.json response */
interface IMFExternalData {
  [yearMonth: string]: Record<string, number | string>;
}

/** Parsed monthly commodity price point */
interface IMFPricePoint {
  date: string;
  value: number;
}

class ImfPcpsConnector extends BaseConnector {
  readonly name = 'imf-pcps';
  readonly source = 'IMF Primary Commodity Prices';
  readonly rateLimit: ConnectorRateLimit = { requests: 5, windowMs: 60_000 };

  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(5, 5 / 60);
  private cachedData: IMFExternalData | null = null;
  private cacheTimestamp = 0;
  private readonly cacheTtlMs = 3_600_000; // 1 hour

  constructor() {
    super();
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30_000,
    });
  }

  private async loadData(): Promise<IMFExternalData> {
    const now = Date.now();
    if (this.cachedData && now - this.cacheTimestamp < this.cacheTtlMs) {
      return this.cachedData;
    }

    await this.limiter.acquire();
    const response = await withRetry(async () => {
      return this.client.get<IMFExternalData>('/External_Data.json');
    });

    this.cachedData = response.data;
    this.cacheTimestamp = now;
    return this.cachedData;
  }

  private extractTimeSeries(
    data: IMFExternalData,
    commodityKey: string,
  ): IMFPricePoint[] {
    const points: IMFPricePoint[] = [];

    for (const [period, values] of Object.entries(data)) {
      if (!period.match(/^\d{4}M\d{2}$/)) continue;
      const raw = values[commodityKey];
      if (raw === undefined || raw === '' || raw === 'n/a') continue;
      const value = typeof raw === 'number' ? raw : parseFloat(raw);
      if (isNaN(value)) continue;

      const year = period.slice(0, 4);
      const month = period.slice(5, 7);
      points.push({ date: `${year}-${month}-01`, value });
    }

    points.sort((a, b) => a.date.localeCompare(b.date));
    return points;
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const data = await this.loadData();
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      const meta = IMF_COMMODITY_KEYS[symbol];
      if (!meta) continue;

      const series = this.extractTimeSeries(data, symbol);
      if (series.length === 0) continue;

      const latest = series[series.length - 1];
      const previous = series.length > 1 ? series[series.length - 2] : undefined;

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: 'IMF',
          price: latest.value,
          previousClose: previous?.value,
          currency: 'USD',
          timestamp: new Date(latest.date).getTime(),
          source: this.source,
        }),
      );
    }

    return quotes;
  }

  async fetchOHLCV(
    symbol: string,
    _interval: string,
    from: Date,
    to: Date,
  ): Promise<OHLCVBar[]> {
    const data = await this.loadData();
    const series = this.extractTimeSeries(data, symbol);

    const fromTs = from.getTime();
    const toTs = to.getTime();

    return series
      .filter((p) => {
        const ts = new Date(p.date).getTime();
        return ts >= fromTs && ts <= toTs;
      })
      .map((p) =>
        normalizeOHLCV({
          timestamp: p.date,
          open: p.value,
          high: p.value,
          low: p.value,
          close: p.value,
          volume: 0,
        }),
      );
  }

  /**
   * Fetch the full historical series for a given IMF commodity key.
   */
  async fetchCommoditySeries(commodityKey: string): Promise<IMFPricePoint[]> {
    const data = await this.loadData();
    return this.extractTimeSeries(data, commodityKey);
  }

  /**
   * Fetch the latest values for all tracked IMF commodities.
   */
  async fetchAllLatest(): Promise<Record<string, IMFPricePoint>> {
    const data = await this.loadData();
    const result: Record<string, IMFPricePoint> = {};

    for (const key of Object.keys(IMF_COMMODITY_KEYS)) {
      const series = this.extractTimeSeries(data, key);
      if (series.length > 0) {
        result[key] = series[series.length - 1];
      }
    }

    return result;
  }

  getSupportedSymbols(): string[] {
    return Object.keys(IMF_COMMODITY_KEYS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'IMF Primary Commodity Price System. Monthly commodity price indices and levels from the International Monetary Fund.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'price', type: 'number', description: 'Monthly commodity price level' },
        { name: 'date', type: 'date', description: 'Month of observation' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000, // daily check, data is monthly
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const data = await this.loadData();
      return Object.keys(data).length > 0;
    } catch {
      return false;
    }
  }
}

export default new ImfPcpsConnector();
