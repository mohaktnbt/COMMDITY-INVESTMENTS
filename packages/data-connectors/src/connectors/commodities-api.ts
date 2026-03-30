import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://commodities-api.com/api';

const SUPPORTED_SYMBOLS: Record<string, string> = {
  XAU: 'Gold',
  XAG: 'Silver',
  XPT: 'Platinum',
  XPD: 'Palladium',
  XCU: 'Copper',
  BRENTOIL: 'Brent Crude Oil',
  WTIOIL: 'WTI Crude Oil',
  NATGAS: 'Natural Gas',
  WHEAT: 'Wheat',
  CORN: 'Corn',
  SOYBEAN: 'Soybean',
  SUGAR: 'Sugar',
  COFFEE: 'Coffee',
  COTTON: 'Cotton',
  RICE: 'Rice',
};

interface CommoditiesApiLatestResponse {
  data: {
    success: boolean;
    timestamp: number;
    date: string;
    base: string;
    rates: Record<string, number>;
  };
}

interface CommoditiesApiHistoricalResponse {
  data: {
    success: boolean;
    historical: boolean;
    date: string;
    base: string;
    rates: Record<string, number>;
  };
}

interface CommoditiesApiTimeseriesResponse {
  data: {
    success: boolean;
    timeseries: boolean;
    start_date: string;
    end_date: string;
    base: string;
    rates: Record<string, Record<string, number>>;
  };
}

class CommoditiesApiConnector extends BaseConnector {
  readonly name = 'commodities-api';
  readonly source = 'Commodities API';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 5,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(5, 5 / 60); // 5 req/min

  constructor() {
    super();
    this.apiKey = process.env.COMMODITIES_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('COMMODITIES_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    await this.limiter.acquire();

    const data = await withRetry(async () => {
      const response = await axios.get<CommoditiesApiLatestResponse>(
        `${BASE_URL}/latest`,
        {
          params: {
            access_key: this.apiKey,
            base: 'USD',
            symbols: symbols.join(','),
          },
        },
      );
      return response.data;
    });

    const responseData = data.data;
    if (!responseData.success || !responseData.rates) return [];

    const quotes: PriceQuote[] = [];
    for (const symbol of symbols) {
      const rate = responseData.rates[symbol];
      if (rate === undefined) continue;

      // Rates are given as 1 USD = X commodity units, so invert for price
      const price = rate !== 0 ? 1 / rate : 0;

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: 'CommoditiesAPI',
          price,
          currency: 'USD',
          timestamp: responseData.timestamp * 1000,
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
    await this.limiter.acquire();

    const data = await withRetry(async () => {
      const response = await axios.get<CommoditiesApiTimeseriesResponse>(
        `${BASE_URL}/timeseries`,
        {
          params: {
            access_key: this.apiKey,
            base: 'USD',
            symbols: symbol,
            start_date: from.toISOString().slice(0, 10),
            end_date: to.toISOString().slice(0, 10),
          },
        },
      );
      return response.data;
    });

    const responseData = data.data;
    if (!responseData.success || !responseData.rates) return [];

    const bars: OHLCVBar[] = [];
    for (const [date, rates] of Object.entries(responseData.rates)) {
      const rate = rates[symbol];
      if (rate === undefined) continue;

      const price = rate !== 0 ? 1 / rate : 0;

      bars.push(
        normalizeOHLCV({
          timestamp: date,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0,
        }),
      );
    }

    return bars.sort((a, b) => a.timestamp - b.timestamp);
  }

  async fetchHistorical(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]> {
    return this.fetchOHLCV(symbol, '1d', from, to);
  }

  getSupportedSymbols(): string[] {
    return Object.keys(SUPPORTED_SYMBOLS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'Commodities API connector providing real-time and historical commodity rates including precious metals, energy, and agricultural products.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'rate', type: 'number', description: 'Exchange rate relative to base currency' },
        { name: 'price', type: 'number', description: 'Price in USD' },
        { name: 'date', type: 'date', description: 'Observation date' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 60_000,
    };
  }
}

export default new CommoditiesApiConnector();
