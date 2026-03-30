import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://metals-api.com/api';

const PRECIOUS_METALS: Record<string, string> = {
  XAU: 'Gold',
  XAG: 'Silver',
  XPT: 'Platinum',
  XPD: 'Palladium',
};

const BASE_METALS: Record<string, string> = {
  XCU: 'Copper',
  ALU: 'Aluminium',
  NICKEL: 'Nickel',
  ZINC: 'Zinc',
  LEAD: 'Lead',
  TIN: 'Tin',
};

const ALL_SYMBOLS: Record<string, string> = {
  ...PRECIOUS_METALS,
  ...BASE_METALS,
};

interface MetalsApiLatestResponse {
  success: boolean;
  timestamp: number;
  date: string;
  base: string;
  rates: Record<string, number>;
}

interface MetalsApiHistoricalResponse {
  success: boolean;
  historical: boolean;
  date: string;
  base: string;
  rates: Record<string, number>;
}

class MetalsApiConnector extends BaseConnector {
  readonly name = 'metals-api';
  readonly source = 'Metals API';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 5,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(5, 5 / 60); // 5 req/min

  constructor() {
    super();
    this.apiKey = process.env.METALS_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('METALS_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    await this.limiter.acquire();

    const data = await withRetry(async () => {
      const response = await axios.get<MetalsApiLatestResponse>(
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

    if (!data.success || !data.rates) return [];

    const quotes: PriceQuote[] = [];
    for (const symbol of symbols) {
      const rate = data.rates[symbol];
      if (rate === undefined) continue;

      // Rates are 1 USD = X units of metal, invert for price per unit
      const price = rate !== 0 ? 1 / rate : 0;

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: 'MetalsAPI',
          price,
          currency: 'USD',
          timestamp: data.timestamp * 1000,
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
    const bars: OHLCVBar[] = [];
    const current = new Date(from);

    while (current <= to) {
      await this.limiter.acquire();

      const dateStr = current.toISOString().slice(0, 10);

      const data = await withRetry(async () => {
        const response = await axios.get<MetalsApiHistoricalResponse>(
          `${BASE_URL}/${dateStr}`,
          {
            params: {
              access_key: this.apiKey,
              base: 'USD',
              symbols: symbol,
            },
          },
        );
        return response.data;
      });

      if (data.success && data.rates[symbol] !== undefined) {
        const rate = data.rates[symbol];
        const price = rate !== 0 ? 1 / rate : 0;

        bars.push(
          normalizeOHLCV({
            timestamp: dateStr,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0,
          }),
        );
      }

      current.setDate(current.getDate() + 1);
    }

    return bars;
  }

  async fetchHistorical(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]> {
    return this.fetchOHLCV(symbol, '1d', from, to);
  }

  getSupportedSymbols(): string[] {
    return Object.keys(ALL_SYMBOLS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'Metals API connector for precious and base metal prices. Provides real-time and historical rates for gold, silver, platinum, palladium, copper, aluminium, and more.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'rate', type: 'number', description: 'Exchange rate relative to base currency' },
        { name: 'price', type: 'number', description: 'Price in USD per unit' },
        { name: 'date', type: 'date', description: 'Observation date' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 60_000,
    };
  }
}

export default new MetalsApiConnector();
