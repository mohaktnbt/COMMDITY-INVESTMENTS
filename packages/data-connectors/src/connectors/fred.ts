import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://api.stlouisfed.org/fred';

const SERIES: Record<string, { name: string; unit: string }> = {
  DCOILWTICO: { name: 'WTI Crude Oil', unit: 'USD/bbl' },
  DCOILBRENTEU: { name: 'Brent Crude Oil', unit: 'USD/bbl' },
  GOLDPMGBD228NLBM: { name: 'Gold (London PM Fix)', unit: 'USD/oz' },
  SLVPRUSD: { name: 'Silver (London Fix)', unit: 'USD/oz' },
  DHHNGSP: { name: 'Henry Hub Natural Gas', unit: 'USD/MMBtu' },
};

interface FredObservation {
  date: string;
  value: string;
  realtime_start: string;
  realtime_end: string;
}

interface FredSeriesResponse {
  observations: FredObservation[];
}

class FredConnector extends BaseConnector {
  readonly name = 'fred';
  readonly source = 'Federal Reserve Economic Data';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 120,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(120, 2); // 120 req/min = 2/sec

  constructor() {
    super();
    this.apiKey = process.env.FRED_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('FRED_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const seriesId of symbols) {
      const meta = SERIES[seriesId];
      if (!meta) continue;

      await this.limiter.acquire();

      const data = await withRetry(async () => {
        const response = await axios.get<FredSeriesResponse>(
          `${BASE_URL}/series/observations`,
          {
            params: {
              series_id: seriesId,
              api_key: this.apiKey,
              file_type: 'json',
              sort_order: 'desc',
              limit: 2,
              observation_start: this.daysAgo(30),
            },
          },
        );
        return response.data;
      });

      const observations = data.observations.filter(
        (obs) => obs.value !== '.',
      );
      if (observations.length === 0) continue;

      const latest = observations[0];
      const previous = observations.length > 1 ? observations[1] : undefined;
      const price = parseFloat(latest.value);
      const prevPrice = previous ? parseFloat(previous.value) : price;

      quotes.push(
        normalizePriceQuote({
          symbol: seriesId,
          exchange: 'FRED',
          price,
          previousClose: prevPrice,
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
    await this.limiter.acquire();

    const data = await withRetry(async () => {
      const response = await axios.get<FredSeriesResponse>(
        `${BASE_URL}/series/observations`,
        {
          params: {
            series_id: symbol,
            api_key: this.apiKey,
            file_type: 'json',
            observation_start: from.toISOString().slice(0, 10),
            observation_end: to.toISOString().slice(0, 10),
          },
        },
      );
      return response.data;
    });

    return data.observations
      .filter((obs) => obs.value !== '.')
      .map((obs) => {
        const value = parseFloat(obs.value);
        return normalizeOHLCV({
          timestamp: obs.date,
          open: value,
          high: value,
          low: value,
          close: value,
          volume: 0,
        });
      });
  }

  async fetchHistorical(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]> {
    return this.fetchOHLCV(symbol, '1d', from, to);
  }

  getSupportedSymbols(): string[] {
    return Object.keys(SERIES);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'Federal Reserve Economic Data (FRED) connector. Provides macroeconomic data including commodity prices from official government sources.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'value', type: 'number', description: 'Observation value' },
        { name: 'date', type: 'date', description: 'Observation date' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000, // Daily data
    };
  }

  private daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }
}

export default new FredConnector();
