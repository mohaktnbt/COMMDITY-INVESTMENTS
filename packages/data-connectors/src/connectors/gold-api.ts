import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://www.goldapi.io/api';

const SUPPORTED_METALS: Record<string, string> = {
  XAU: 'Gold',
  XAG: 'Silver',
  XPT: 'Platinum',
  XPD: 'Palladium',
};

interface GoldApiSpotResponse {
  timestamp: number;
  metal: string;
  currency: string;
  exchange: string;
  symbol: string;
  prev_close_price: number;
  open_price: number;
  low_price: number;
  high_price: number;
  open_time: number;
  price: number;
  ch: number;
  chp: number;
  ask: number;
  bid: number;
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_21k: number;
  price_gram_18k: number;
}

interface GoldApiHistoryEntry {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface GoldApiHistoryResponse {
  results: GoldApiHistoryEntry[];
}

class GoldApiConnector extends BaseConnector {
  readonly name = 'gold-api';
  readonly source = 'GoldAPI.io';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 10,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(10, 10 / 60); // 10 req/min

  constructor() {
    super();
    this.apiKey = process.env.GOLD_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('GOLD_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      if (!SUPPORTED_METALS[symbol]) continue;

      await this.limiter.acquire();

      const data = await withRetry(async () => {
        const response = await axios.get<GoldApiSpotResponse>(
          `${BASE_URL}/${symbol}/USD`,
          {
            headers: {
              'x-access-token': this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        );
        return response.data;
      });

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: data.exchange ?? 'GoldAPI',
          price: data.price,
          change: data.ch,
          changePercent: data.chp,
          high: data.high_price,
          low: data.low_price,
          open: data.open_price,
          previousClose: data.prev_close_price,
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
    if (!SUPPORTED_METALS[symbol]) return [];

    const bars: OHLCVBar[] = [];
    const current = new Date(from);

    while (current <= to) {
      await this.limiter.acquire();

      const dateStr = current.toISOString().slice(0, 10).replace(/-/g, '');

      const data = await withRetry(async () => {
        const response = await axios.get<GoldApiSpotResponse>(
          `${BASE_URL}/${symbol}/USD/${dateStr}`,
          {
            headers: {
              'x-access-token': this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        );
        return response.data;
      });

      bars.push(
        normalizeOHLCV({
          timestamp: current.toISOString().slice(0, 10),
          open: data.open_price ?? data.price,
          high: data.high_price ?? data.price,
          low: data.low_price ?? data.price,
          close: data.price,
          volume: 0,
        }),
      );

      current.setDate(current.getDate() + 1);
    }

    return bars;
  }

  async fetchHistorical(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]> {
    return this.fetchOHLCV(symbol, '1d', from, to);
  }

  getSupportedSymbols(): string[] {
    return Object.keys(SUPPORTED_METALS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'GoldAPI.io connector for spot precious metal prices. Provides real-time and historical prices for gold (XAU), silver (XAG), platinum (XPT), and palladium (XPD).',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'price', type: 'number', description: 'Spot price in USD per troy ounce' },
        { name: 'change', type: 'number', description: 'Price change' },
        { name: 'changePercent', type: 'number', description: 'Price change percentage' },
        { name: 'high', type: 'number', description: 'Day high price' },
        { name: 'low', type: 'number', description: 'Day low price' },
        { name: 'bid', type: 'number', description: 'Bid price' },
        { name: 'ask', type: 'number', description: 'Ask price' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 60_000,
    };
  }
}

export default new GoldApiConnector();
