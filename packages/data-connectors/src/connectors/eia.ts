import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://api.eia.gov/v2';

interface EiaEndpoint {
  path: string;
  description: string;
  symbols: string[];
}

const ENDPOINTS: Record<string, EiaEndpoint> = {
  'petroleum-spot': {
    path: '/petroleum/pri/spt/data/',
    description: 'Petroleum spot prices',
    symbols: ['RWTC', 'RBRTE', 'EER_EPMRU_PF4_RGC_DPG'],
  },
  'petroleum-stocks': {
    path: '/petroleum/stoc/wstk/data/',
    description: 'Weekly petroleum stocks',
    symbols: ['WCESTUS1', 'WGTSTUS1', 'WDISTUS1'],
  },
  'natgas-futures': {
    path: '/natural-gas/pri/fut/data/',
    description: 'Natural gas futures prices',
    symbols: ['RNGC1', 'RNGC2', 'RNGC3'],
  },
};

const ALL_SYMBOLS = Object.values(ENDPOINTS).flatMap((ep) => ep.symbols);

interface EiaDataPoint {
  period: string;
  value: number;
  'series-description': string;
  units: string;
  [key: string]: unknown;
}

interface EiaResponse {
  response: {
    data: EiaDataPoint[];
    total: number;
  };
}

class EiaConnector extends BaseConnector {
  readonly name = 'eia';
  readonly source = 'U.S. Energy Information Administration';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 30,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(30, 0.5); // 30 req/min = 0.5/sec

  constructor() {
    super();
    this.apiKey = process.env.EIA_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('EIA_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    // Determine which endpoints to call
    const endpointMap = new Map<string, string[]>();
    for (const symbol of symbols) {
      for (const [key, endpoint] of Object.entries(ENDPOINTS)) {
        if (endpoint.symbols.includes(symbol)) {
          if (!endpointMap.has(key)) endpointMap.set(key, []);
          endpointMap.get(key)!.push(symbol);
          break;
        }
      }
    }

    for (const [endpointKey, endpointSymbols] of endpointMap) {
      const endpoint = ENDPOINTS[endpointKey];
      await this.limiter.acquire();

      const data = await withRetry(async () => {
        const response = await axios.get<EiaResponse>(`${BASE_URL}${endpoint.path}`, {
          params: {
            api_key: this.apiKey,
            frequency: 'daily',
            sort: JSON.stringify([{ column: 'period', direction: 'desc' }]),
            length: 5,
          },
        });
        return response.data;
      });

      const points = data.response?.data ?? [];

      for (const symbol of endpointSymbols) {
        const matching = points.filter(
          (p) =>
            (p as Record<string, unknown>)['series'] === symbol ||
            (p as Record<string, unknown>)['product'] === symbol,
        );

        if (matching.length === 0) continue;

        const latest = matching[0];
        const previous = matching.length > 1 ? matching[1] : undefined;

        quotes.push(
          normalizePriceQuote({
            symbol,
            exchange: 'EIA',
            price: latest.value,
            previousClose: previous?.value,
            currency: 'USD',
            timestamp: new Date(latest.period).getTime(),
            source: this.source,
          }),
        );
      }
    }

    return quotes;
  }

  async fetchOHLCV(
    symbol: string,
    _interval: string,
    from: Date,
    to: Date,
  ): Promise<OHLCVBar[]> {
    // Find the endpoint for this symbol
    let endpointPath = '';
    for (const endpoint of Object.values(ENDPOINTS)) {
      if (endpoint.symbols.includes(symbol)) {
        endpointPath = endpoint.path;
        break;
      }
    }

    if (!endpointPath) return [];

    await this.limiter.acquire();

    const data = await withRetry(async () => {
      const response = await axios.get<EiaResponse>(`${BASE_URL}${endpointPath}`, {
        params: {
          api_key: this.apiKey,
          frequency: 'daily',
          start: from.toISOString().slice(0, 10),
          end: to.toISOString().slice(0, 10),
          sort: JSON.stringify([{ column: 'period', direction: 'asc' }]),
          length: 5000,
        },
      });
      return response.data;
    });

    const points = (data.response?.data ?? []).filter(
      (p) =>
        (p as Record<string, unknown>)['series'] === symbol ||
        (p as Record<string, unknown>)['product'] === symbol,
    );

    return points.map((p) =>
      normalizeOHLCV({
        timestamp: p.period,
        open: p.value,
        high: p.value,
        low: p.value,
        close: p.value,
        volume: 0,
      }),
    );
  }

  getSupportedSymbols(): string[] {
    return [...ALL_SYMBOLS];
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'U.S. Energy Information Administration API v2. Provides petroleum spot prices, weekly stock levels, and natural gas futures data.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'value', type: 'number', description: 'Data point value' },
        { name: 'period', type: 'date', description: 'Observation period' },
        { name: 'units', type: 'string', description: 'Unit of measurement' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000,
    };
  }
}

export default new EiaConnector();
