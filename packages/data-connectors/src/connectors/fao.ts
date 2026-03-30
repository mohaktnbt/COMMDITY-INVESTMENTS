import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://www.fao.org/faostat/api/v1';

/** FAO domain codes */
const DOMAINS = {
  PRICES: 'PP',
  PRODUCTION: 'QCL',
  TRADE: 'TCL',
  FOOD_BALANCE: 'FBS',
} as const;

/** FAOSTAT item codes for common commodities */
const FAO_ITEMS: Record<string, { name: string; code: string; elementCode: string }> = {
  WHEAT: { name: 'Wheat', code: '15', elementCode: '5532' },
  RICE: { name: 'Rice (paddy)', code: '27', elementCode: '5532' },
  MAIZE: { name: 'Maize (corn)', code: '56', elementCode: '5532' },
  SOYBEANS: { name: 'Soybeans', code: '236', elementCode: '5532' },
  SUGAR_CANE: { name: 'Sugar cane', code: '156', elementCode: '5532' },
  COFFEE: { name: 'Coffee (green)', code: '656', elementCode: '5532' },
  COCOA: { name: 'Cocoa beans', code: '661', elementCode: '5532' },
  COTTON: { name: 'Cotton (lint)', code: '767', elementCode: '5532' },
  PALM_OIL: { name: 'Palm oil', code: '257', elementCode: '5532' },
  TEA: { name: 'Tea', code: '667', elementCode: '5532' },
  RUBBER: { name: 'Natural rubber', code: '836', elementCode: '5532' },
  TOBACCO: { name: 'Tobacco (unmanuf.)', code: '826', elementCode: '5532' },
};

/** FAO food price index types */
const FOOD_PRICE_INDICES: Record<string, string> = {
  FPI_OVERALL: 'Food Price Index',
  FPI_MEAT: 'Meat Price Index',
  FPI_DAIRY: 'Dairy Price Index',
  FPI_CEREALS: 'Cereals Price Index',
  FPI_OILS: 'Oils Price Index',
  FPI_SUGAR: 'Sugar Price Index',
};

interface FAODataRow {
  Area: string;
  'Area Code': string;
  Item: string;
  'Item Code': string;
  Element: string;
  'Element Code': string;
  Year: string;
  'Year Code': string;
  Unit: string;
  Value: number | null;
  Flag: string;
}

interface FAOApiResponse {
  data: FAODataRow[];
}

/** Parsed FAO data point */
export interface FAODataPoint {
  area: string;
  item: string;
  element: string;
  year: number;
  value: number;
  unit: string;
}

class FaoConnector extends BaseConnector {
  readonly name = 'fao';
  readonly source = 'FAOSTAT';
  readonly rateLimit: ConnectorRateLimit = { requests: 10, windowMs: 60_000 };

  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(10, 10 / 60);

  constructor() {
    super();
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 60_000,
    });
  }

  /**
   * FAO provides production/trade data, not real-time prices.
   * Use fetchProductionData() or fetchTradeData() for actual FAO data.
   */
  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      const item = FAO_ITEMS[symbol];
      if (!item) continue;

      const data = await this.fetchProducerPrices(item.code, {
        areaCode: '5000', // World aggregate
        limit: 2,
      });

      if (data.length === 0) continue;

      data.sort((a, b) => b.year - a.year);
      const latest = data[0];
      const previous = data.length > 1 ? data[1] : undefined;

      quotes.push(
        normalizePriceQuote({
          symbol,
          exchange: 'FAO',
          price: latest.value,
          previousClose: previous?.value,
          currency: 'USD',
          timestamp: new Date(`${latest.year}-01-01`).getTime(),
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
    const item = FAO_ITEMS[symbol];
    if (!item) return [];

    const data = await this.fetchProducerPrices(item.code, {
      areaCode: '5000',
      fromYear: from.getFullYear(),
      toYear: to.getFullYear(),
    });

    data.sort((a, b) => a.year - b.year);

    return data.map((d) =>
      normalizeOHLCV({
        timestamp: `${d.year}-01-01`,
        open: d.value,
        high: d.value,
        low: d.value,
        close: d.value,
        volume: 0,
      }),
    );
  }

  /**
   * Fetch producer price data for a commodity.
   */
  async fetchProducerPrices(
    itemCode: string,
    options: {
      areaCode?: string;
      fromYear?: number;
      toYear?: number;
      limit?: number;
    } = {},
  ): Promise<FAODataPoint[]> {
    await this.limiter.acquire();

    const currentYear = new Date().getFullYear();
    const yearRange = `${options.fromYear ?? 2000}:${options.toYear ?? currentYear}`;

    const response = await withRetry(async () => {
      return this.client.get<FAOApiResponse>(`/en/data/${DOMAINS.PRICES}`, {
        params: {
          area: options.areaCode ?? '5000',
          item: itemCode,
          element: '5532', // Producer price (USD/tonne)
          year: yearRange,
          show_flags: 'true',
        },
      });
    });

    const rows = response.data.data ?? [];
    const points = rows
      .filter((row) => row.Value !== null)
      .map((row) => this.parseRow(row));

    if (options.limit) {
      points.sort((a, b) => b.year - a.year);
      return points.slice(0, options.limit);
    }

    return points;
  }

  /**
   * Fetch production data (area harvested, yield, production quantity).
   */
  async fetchProductionData(
    itemCode: string,
    areaCode: string,
    options: { fromYear?: number; toYear?: number } = {},
  ): Promise<FAODataPoint[]> {
    await this.limiter.acquire();

    const currentYear = new Date().getFullYear();
    const yearRange = `${options.fromYear ?? 2000}:${options.toYear ?? currentYear}`;

    const response = await withRetry(async () => {
      return this.client.get<FAOApiResponse>(`/en/data/${DOMAINS.PRODUCTION}`, {
        params: {
          area: areaCode,
          item: itemCode,
          element: '5510,5419,5312', // Production, Yield, Area harvested
          year: yearRange,
          show_flags: 'true',
        },
      });
    });

    const rows = response.data.data ?? [];
    return rows.filter((row) => row.Value !== null).map((row) => this.parseRow(row));
  }

  /**
   * Fetch trade data (import/export quantity and value).
   */
  async fetchTradeData(
    itemCode: string,
    areaCode: string,
    options: { fromYear?: number; toYear?: number } = {},
  ): Promise<FAODataPoint[]> {
    await this.limiter.acquire();

    const currentYear = new Date().getFullYear();
    const yearRange = `${options.fromYear ?? 2000}:${options.toYear ?? currentYear}`;

    const response = await withRetry(async () => {
      return this.client.get<FAOApiResponse>(`/en/data/${DOMAINS.TRADE}`, {
        params: {
          area: areaCode,
          item: itemCode,
          element: '5610,5622,5910,5922', // Import qty/value, Export qty/value
          year: yearRange,
          show_flags: 'true',
        },
      });
    });

    const rows = response.data.data ?? [];
    return rows.filter((row) => row.Value !== null).map((row) => this.parseRow(row));
  }

  private parseRow(row: FAODataRow): FAODataPoint {
    return {
      area: row.Area,
      item: row.Item,
      element: row.Element,
      year: parseInt(row.Year, 10),
      value: row.Value as number,
      unit: row.Unit,
    };
  }

  getSupportedSymbols(): string[] {
    return [
      ...Object.keys(FAO_ITEMS),
      ...Object.keys(FOOD_PRICE_INDICES),
    ];
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'FAOSTAT agricultural data. Provides production, trade, and price data for agricultural commodities worldwide.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'area', type: 'string', description: 'Country or region' },
        { name: 'item', type: 'string', description: 'Commodity name' },
        { name: 'element', type: 'string', description: 'Data element (production, yield, trade, etc.)' },
        { name: 'year', type: 'number', description: 'Year of observation' },
        { name: 'value', type: 'number', description: 'Data value' },
        { name: 'unit', type: 'string', description: 'Unit of measurement' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000, // daily check, data is annual
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      const response = await this.client.get<FAOApiResponse>(
        `/en/data/${DOMAINS.PRICES}`,
        { params: { area: '5000', item: '15', element: '5532', year: '2020', show_flags: 'true' } },
      );
      return (response.data.data?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }
}

export default new FaoConnector();
