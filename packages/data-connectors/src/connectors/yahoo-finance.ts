import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import yahooFinance from 'yahoo-finance2';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const FUTURES_SYMBOLS: Record<string, string> = {
  'GC=F': 'Gold',
  'CL=F': 'Crude Oil',
  'SI=F': 'Silver',
  'NG=F': 'Natural Gas',
  'HG=F': 'Copper',
  'ZW=F': 'Wheat',
  'ZC=F': 'Corn',
  'ZS=F': 'Soybeans',
  'KC=F': 'Coffee',
  'CT=F': 'Cotton',
  'SB=F': 'Sugar',
};

const ETF_SYMBOLS: Record<string, string> = {
  GLD: 'SPDR Gold Shares',
  SLV: 'iShares Silver Trust',
  USO: 'United States Oil Fund',
  DBA: 'Invesco DB Agriculture Fund',
  DBC: 'Invesco DB Commodity Index',
};

const ALL_SYMBOLS = { ...FUTURES_SYMBOLS, ...ETF_SYMBOLS };

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
  regularMarketVolume: number;
  regularMarketTime: Date;
  fullExchangeName: string;
  currency: string;
}

interface YahooHistoricalRow {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjclose?: number;
}

class YahooFinanceConnector extends BaseConnector {
  readonly name = 'yahoo-finance';
  readonly source = 'Yahoo Finance';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 5,
    windowMs: 1000,
  };

  private limiter = new TokenBucketRateLimiter(5, 5);

  async connect(): Promise<void> {
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      await this.limiter.acquire();
      const result = await withRetry(async () => {
        const quote = (await yahooFinance.quote(symbol)) as unknown as YahooQuoteResult;
        return quote;
      });

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: result.fullExchangeName ?? 'Yahoo',
          price: result.regularMarketPrice,
          change: result.regularMarketChange,
          changePercent: result.regularMarketChangePercent,
          high: result.regularMarketDayHigh,
          low: result.regularMarketDayLow,
          open: result.regularMarketOpen,
          previousClose: result.regularMarketPreviousClose,
          volume: result.regularMarketVolume,
          currency: 'USD',
          timestamp: result.regularMarketTime
            ? new Date(result.regularMarketTime).getTime()
            : Date.now(),
          source: this.source,
        }),
      );
    }

    return quotes;
  }

  async fetchOHLCV(
    symbol: string,
    interval: string,
    from: Date,
    to: Date,
  ): Promise<OHLCVBar[]> {
    await this.limiter.acquire();

    const yahooInterval = this.mapInterval(interval) as '1d' | '1wk' | '1mo';

    const result = await withRetry(async () => {
      const data = (await yahooFinance.historical(symbol, {
        period1: from,
        period2: to,
        interval: yahooInterval,
      })) as unknown as YahooHistoricalRow[];
      return data;
    });

    return result.map((row) =>
      normalizeOHLCV({
        timestamp: new Date(row.date).getTime(),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      }),
    );
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
        'Yahoo Finance connector for commodity futures and ETFs. Provides real-time and historical market data.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'price', type: 'number', description: 'Current market price' },
        { name: 'change', type: 'number', description: 'Price change' },
        { name: 'changePercent', type: 'number', description: 'Price change percentage' },
        { name: 'volume', type: 'number', description: 'Trading volume' },
        { name: 'high', type: 'number', description: 'Day high' },
        { name: 'low', type: 'number', description: 'Day low' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 15_000,
    };
  }

  private mapInterval(
    interval: string,
  ): '1d' | '1wk' | '1mo' | '5m' | '15m' | '30m' | '1h' {
    const mapping: Record<string, '1d' | '1wk' | '1mo' | '5m' | '15m' | '30m' | '1h'> = {
      '1m': '5m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '1d': '1d',
      '1w': '1wk',
      '1M': '1mo',
    };
    return mapping[interval] ?? '1d';
  }
}

export default new YahooFinanceConnector();
