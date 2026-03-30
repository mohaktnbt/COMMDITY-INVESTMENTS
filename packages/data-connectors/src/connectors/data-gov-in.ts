import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://api.data.gov.in/resource';
const MANDI_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

const SUPPORTED_COMMODITIES = [
  'Wheat',
  'Rice',
  'Maize',
  'Sugar',
  'Cotton',
  'Soyabean',
  'Groundnut',
  'Mustard',
  'Onion',
  'Potato',
  'Tomato',
  'Turmeric',
  'Jeera',
  'Chilli',
];

interface MandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

interface DataGovInResponse {
  records: MandiRecord[];
  total: number;
  count: number;
  offset: number;
  limit: number;
}

class DataGovInConnector extends BaseConnector {
  readonly name = 'data-gov-in';
  readonly source = 'data.gov.in';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 10,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(10, 10 / 60); // 10 req/min

  constructor() {
    super();
    this.apiKey = process.env.DATA_GOV_IN_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('DATA_GOV_IN_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const commodity of symbols) {
      await this.limiter.acquire();

      const data = await withRetry(async () => {
        const response = await axios.get<DataGovInResponse>(
          `${BASE_URL}/${MANDI_RESOURCE_ID}`,
          {
            params: {
              'api-key': this.apiKey,
              format: 'json',
              limit: 10,
              offset: 0,
              'filters[commodity]': commodity,
            },
          },
        );
        return response.data;
      });

      if (!data.records || data.records.length === 0) continue;

      // Aggregate modal prices across markets
      const validRecords = data.records.filter(
        (r) => r.modal_price && parseFloat(r.modal_price) > 0,
      );
      if (validRecords.length === 0) continue;

      const avgPrice =
        validRecords.reduce((sum, r) => sum + parseFloat(r.modal_price), 0) /
        validRecords.length;
      const minPrice = Math.min(...validRecords.map((r) => parseFloat(r.min_price)));
      const maxPrice = Math.max(...validRecords.map((r) => parseFloat(r.max_price)));

      const latestRecord = validRecords[0];

      quotes.push(
        normalizePriceQuote({
          symbol: commodity,
          exchange: `Mandi-${latestRecord.market}`,
          price: avgPrice,
          high: maxPrice,
          low: minPrice,
          currency: 'INR',
          unit: 'quintal',
          timestamp: latestRecord.arrival_date
            ? new Date(latestRecord.arrival_date).getTime()
            : Date.now(),
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
      const response = await axios.get<DataGovInResponse>(
        `${BASE_URL}/${MANDI_RESOURCE_ID}`,
        {
          params: {
            'api-key': this.apiKey,
            format: 'json',
            limit: 1000,
            offset: 0,
            'filters[commodity]': symbol,
          },
        },
      );
      return response.data;
    });

    if (!data.records) return [];

    // Group by date and compute OHLCV-like aggregates
    const byDate = new Map<string, MandiRecord[]>();
    for (const record of data.records) {
      const date = record.arrival_date;
      if (!date) continue;
      const recordDate = new Date(date);
      if (recordDate < from || recordDate > to) continue;
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(record);
    }

    const bars: OHLCVBar[] = [];
    for (const [date, records] of byDate) {
      const prices = records
        .map((r) => parseFloat(r.modal_price))
        .filter((p) => p > 0);
      if (prices.length === 0) continue;

      const minPrices = records
        .map((r) => parseFloat(r.min_price))
        .filter((p) => p > 0);
      const maxPrices = records
        .map((r) => parseFloat(r.max_price))
        .filter((p) => p > 0);

      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      bars.push(
        normalizeOHLCV({
          timestamp: date,
          open: avg,
          high: maxPrices.length > 0 ? Math.max(...maxPrices) : avg,
          low: minPrices.length > 0 ? Math.min(...minPrices) : avg,
          close: avg,
          volume: records.length,
        }),
      );
    }

    return bars.sort((a, b) => a.timestamp - b.timestamp);
  }

  getSupportedSymbols(): string[] {
    return [...SUPPORTED_COMMODITIES];
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'Indian government Open Data connector for agricultural mandi (market) prices. Provides daily commodity prices from wholesale markets across India.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'modal_price', type: 'number', description: 'Modal (most common) price in INR per quintal' },
        { name: 'min_price', type: 'number', description: 'Minimum price in INR per quintal' },
        { name: 'max_price', type: 'number', description: 'Maximum price in INR per quintal' },
        { name: 'market', type: 'string', description: 'Mandi (market) name' },
        { name: 'arrival_date', type: 'date', description: 'Date of price observation' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000,
    };
  }
}

export default new DataGovInConnector();
