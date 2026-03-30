import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://api.worldbank.org/v2';

/** World Bank commodity indicator codes (Pink Sheet) */
const INDICATORS: Record<string, { name: string; unit: string }> = {
  'COMMODITY_CRUDE_OIL': { name: 'Crude Oil (avg)', unit: 'USD/bbl' },
  'COMMODITY_GOLD': { name: 'Gold', unit: 'USD/oz' },
  'COMMODITY_SILVER': { name: 'Silver', unit: 'USD/oz' },
  'COMMODITY_COPPER': { name: 'Copper', unit: 'USD/mt' },
  'COMMODITY_ALUMINUM': { name: 'Aluminum', unit: 'USD/mt' },
  'COMMODITY_IRON_ORE': { name: 'Iron Ore', unit: 'USD/mt' },
  'COMMODITY_COAL': { name: 'Coal', unit: 'USD/mt' },
  'COMMODITY_NATURAL_GAS': { name: 'Natural Gas', unit: 'USD/MMBtu' },
  'COMMODITY_WHEAT': { name: 'Wheat (US HRW)', unit: 'USD/mt' },
  'COMMODITY_MAIZE': { name: 'Maize', unit: 'USD/mt' },
  'COMMODITY_RICE': { name: 'Rice (Thai 5%)', unit: 'USD/mt' },
  'COMMODITY_SOYBEANS': { name: 'Soybeans', unit: 'USD/mt' },
  'COMMODITY_SUGAR': { name: 'Sugar (world)', unit: 'cents/lb' },
  'COMMODITY_COFFEE': { name: 'Coffee (Arabica)', unit: 'cents/lb' },
  'COMMODITY_COCOA': { name: 'Cocoa', unit: 'USD/mt' },
  'COMMODITY_COTTON': { name: 'Cotton (A Index)', unit: 'cents/lb' },
  'COMMODITY_RUBBER': { name: 'Rubber (RSS3)', unit: 'cents/lb' },
  'COMMODITY_PALM_OIL': { name: 'Palm Oil', unit: 'USD/mt' },
};

/** World Bank API indicator ID mapping */
const WB_INDICATOR_IDS: Record<string, string> = {
  'COMMODITY_CRUDE_OIL': 'CRUDE_PETRO',
  'COMMODITY_GOLD': 'GOLD',
  'COMMODITY_SILVER': 'SILVER',
  'COMMODITY_COPPER': 'COPPER',
  'COMMODITY_ALUMINUM': 'ALUMINUM',
  'COMMODITY_IRON_ORE': 'IRON_ORE',
  'COMMODITY_COAL': 'COAL_AUS',
  'COMMODITY_NATURAL_GAS': 'NGAS_US',
  'COMMODITY_WHEAT': 'WHEAT_US_HRW',
  'COMMODITY_MAIZE': 'MAIZE',
  'COMMODITY_RICE': 'RICE_05',
  'COMMODITY_SOYBEANS': 'SOYBEANS',
  'COMMODITY_SUGAR': 'SUGAR_WLD',
  'COMMODITY_COFFEE': 'COFFEE_ARABIC',
  'COMMODITY_COCOA': 'COCOA',
  'COMMODITY_COTTON': 'COTTON_A_INDX',
  'COMMODITY_RUBBER': 'RUBBER1_MYSG',
  'COMMODITY_PALM_OIL': 'PALM_OIL',
};

interface WBPaginationInfo {
  page: number;
  pages: number;
  per_page: string;
  total: number;
}

interface WBDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

type WBApiResponse = [WBPaginationInfo, WBDataPoint[] | null];

class WorldBankConnector extends BaseConnector {
  readonly name = 'world-bank';
  readonly source = 'World Bank Pink Sheet';
  readonly rateLimit: ConnectorRateLimit = { requests: 30, windowMs: 60_000 };

  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(30, 0.5); // 30 req/min

  constructor() {
    super();
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30_000,
    });
  }

  private async fetchIndicator(
    indicatorId: string,
    options: { fromYear?: number; toYear?: number; perPage?: number } = {},
  ): Promise<WBDataPoint[]> {
    await this.limiter.acquire();

    const currentYear = new Date().getFullYear();
    const dateRange = `${options.fromYear ?? 2000}:${options.toYear ?? currentYear}`;

    const response = await withRetry(async () => {
      return this.client.get<WBApiResponse>(
        `/country/all/indicator/${indicatorId}`,
        {
          params: {
            format: 'json',
            date: dateRange,
            per_page: options.perPage ?? 500,
          },
        },
      );
    });

    const [, data] = response.data;
    if (!data) return [];

    return data.filter((d) => d.value !== null);
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      const meta = INDICATORS[symbol];
      const indicatorId = WB_INDICATOR_IDS[symbol];
      if (!meta || !indicatorId) continue;

      const currentYear = new Date().getFullYear();
      const data = await this.fetchIndicator(indicatorId, {
        fromYear: currentYear - 2,
        toYear: currentYear,
        perPage: 5,
      });

      if (data.length === 0) continue;

      // Sort descending by date
      data.sort((a, b) => b.date.localeCompare(a.date));
      const latest = data[0];
      const previous = data.length > 1 ? data[1] : undefined;

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: 'WorldBank',
          price: latest.value as number,
          previousClose: previous?.value as number | undefined,
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
    const indicatorId = WB_INDICATOR_IDS[symbol];
    if (!indicatorId) return [];

    const data = await this.fetchIndicator(indicatorId, {
      fromYear: from.getFullYear(),
      toYear: to.getFullYear(),
    });

    // Sort ascending by date
    data.sort((a, b) => a.date.localeCompare(b.date));

    return data.map((d) => {
      const value = d.value as number;
      return normalizeOHLCV({
        timestamp: d.date,
        open: value,
        high: value,
        low: value,
        close: value,
        volume: 0,
      });
    });
  }

  /**
   * Fetch data for multiple indicators at once and return as a combined dataset.
   */
  async fetchMultipleIndicators(
    symbols: string[],
    fromYear?: number,
    toYear?: number,
  ): Promise<Record<string, Array<{ date: string; value: number }>>> {
    const result: Record<string, Array<{ date: string; value: number }>> = {};

    for (const symbol of symbols) {
      const indicatorId = WB_INDICATOR_IDS[symbol];
      if (!indicatorId) continue;

      const data = await this.fetchIndicator(indicatorId, { fromYear, toYear });
      data.sort((a, b) => a.date.localeCompare(b.date));

      result[symbol] = data.map((d) => ({
        date: d.date,
        value: d.value as number,
      }));
    }

    return result;
  }

  getSupportedSymbols(): string[] {
    return Object.keys(INDICATORS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'World Bank Commodity Markets (Pink Sheet) data. Provides annual and monthly commodity prices from the World Bank development indicators.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'value', type: 'number', description: 'Commodity price value' },
        { name: 'date', type: 'date', description: 'Year or month of observation' },
        { name: 'indicator', type: 'string', description: 'World Bank indicator ID' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000, // daily check, data is monthly/annual
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      const response = await this.client.get<WBApiResponse>(
        '/country/all/indicator/CRUDE_PETRO',
        { params: { format: 'json', per_page: 1 } },
      );
      const [info] = response.data;
      return info.total > 0;
    } catch {
      return false;
    }
  }
}

export default new WorldBankConnector();
