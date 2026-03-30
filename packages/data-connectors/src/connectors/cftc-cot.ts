import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

/** Raw COT report row from the Socrata API */
interface COTReportRow {
  market_and_exchange_names: string;
  report_date_as_yyyy_mm_dd: string;
  cftc_commodity_code: string;
  open_interest_all: string;
  noncomm_positions_long_all: string;
  noncomm_positions_short_all: string;
  noncomm_positions_spreading_all: string;
  comm_positions_long_all: string;
  comm_positions_short_all: string;
  nonrept_positions_long_all: string;
  nonrept_positions_short_all: string;
  change_in_open_interest_all: string;
  change_in_noncomm_long_all: string;
  change_in_noncomm_short_all: string;
}

/** Parsed COT report */
export interface COTReport {
  market: string;
  reportDate: string;
  commodityCode: string;
  openInterest: number;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialSpreading: number;
  commercialLong: number;
  commercialShort: number;
  nonReportableLong: number;
  nonReportableShort: number;
  netNonCommercial: number;
  netCommercial: number;
  changeInOpenInterest: number;
}

/** CFTC commodity codes for common commodities */
const COT_COMMODITY_CODES: Record<string, string> = {
  'CRUDE_OIL': '067651',
  'NATURAL_GAS': '023651',
  'GOLD': '088691',
  'SILVER': '084691',
  'COPPER': '085692',
  'CORN': '002602',
  'WHEAT': '001602',
  'SOYBEANS': '005602',
  'SUGAR': '080732',
  'COFFEE': '083731',
  'COCOA': '073732',
  'COTTON': '033661',
  'LIVE_CATTLE': '057642',
  'LEAN_HOGS': '054642',
};

class CftcCotConnector extends BaseConnector {
  readonly name = 'cftc-cot';
  readonly source = 'CFTC Commitments of Traders';
  readonly rateLimit: ConnectorRateLimit = { requests: 10, windowMs: 60_000 };

  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(10, 10 / 60); // 10 req/min

  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://publicreporting.cftc.gov/resource/6dca-aqww.json',
      timeout: 30_000,
    });
  }

  /**
   * COT reports are not price data -- return empty array.
   * Use fetchCOTReports() for actual COT data.
   */
  async fetchLatestPrices(_symbols: string[]): Promise<PriceQuote[]> {
    return [];
  }

  /**
   * COT reports are weekly -- OHLCV is not applicable.
   * Use fetchCOTReports() for actual COT data.
   */
  async fetchOHLCV(
    _symbol: string,
    _interval: string,
    _from: Date,
    _to: Date,
  ): Promise<OHLCVBar[]> {
    return [];
  }

  /**
   * Fetch COT reports for a given commodity code and optional date range.
   */
  async fetchCOTReports(
    commodityCode: string,
    options: { limit?: number; fromDate?: string; toDate?: string } = {},
  ): Promise<COTReport[]> {
    await this.limiter.acquire();

    const params: Record<string, string> = {
      cftc_commodity_code: commodityCode,
      $order: 'report_date_as_yyyy_mm_dd DESC',
      $limit: String(options.limit ?? 52),
    };

    const whereClauses: string[] = [];
    if (options.fromDate) {
      whereClauses.push(`report_date_as_yyyy_mm_dd >= '${options.fromDate}'`);
    }
    if (options.toDate) {
      whereClauses.push(`report_date_as_yyyy_mm_dd <= '${options.toDate}'`);
    }
    if (whereClauses.length > 0) {
      params['$where'] = whereClauses.join(' AND ');
    }

    const response = await withRetry(async () => {
      return this.client.get<COTReportRow[]>('', { params });
    });

    return response.data.map((row) => this.parseRow(row));
  }

  /**
   * Fetch the latest COT report for common commodities.
   */
  async fetchLatestReports(): Promise<COTReport[]> {
    const reports: COTReport[] = [];

    for (const [, code] of Object.entries(COT_COMMODITY_CODES)) {
      const result = await this.fetchCOTReports(code, { limit: 1 });
      if (result.length > 0) {
        reports.push(result[0]);
      }
    }

    return reports;
  }

  /**
   * Get net speculative positioning for a commodity over time.
   */
  async fetchNetPositioning(
    commodityCode: string,
    weeks = 52,
  ): Promise<Array<{ date: string; netNonCommercial: number; openInterest: number }>> {
    const reports = await this.fetchCOTReports(commodityCode, { limit: weeks });

    return reports.map((r) => ({
      date: r.reportDate,
      netNonCommercial: r.netNonCommercial,
      openInterest: r.openInterest,
    }));
  }

  private parseRow(row: COTReportRow): COTReport {
    const nonCommLong = parseFloat(row.noncomm_positions_long_all) || 0;
    const nonCommShort = parseFloat(row.noncomm_positions_short_all) || 0;
    const commLong = parseFloat(row.comm_positions_long_all) || 0;
    const commShort = parseFloat(row.comm_positions_short_all) || 0;

    return {
      market: row.market_and_exchange_names,
      reportDate: row.report_date_as_yyyy_mm_dd,
      commodityCode: row.cftc_commodity_code,
      openInterest: parseFloat(row.open_interest_all) || 0,
      nonCommercialLong: nonCommLong,
      nonCommercialShort: nonCommShort,
      nonCommercialSpreading: parseFloat(row.noncomm_positions_spreading_all) || 0,
      commercialLong: commLong,
      commercialShort: commShort,
      nonReportableLong: parseFloat(row.nonrept_positions_long_all) || 0,
      nonReportableShort: parseFloat(row.nonrept_positions_short_all) || 0,
      netNonCommercial: nonCommLong - nonCommShort,
      netCommercial: commLong - commShort,
      changeInOpenInterest: parseFloat(row.change_in_open_interest_all) || 0,
    };
  }

  getSupportedSymbols(): string[] {
    return Object.keys(COT_COMMODITY_CODES);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description: 'CFTC Commitments of Traders weekly reports showing speculative and commercial positioning',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'openInterest', type: 'number', description: 'Total open interest' },
        { name: 'nonCommercialLong', type: 'number', description: 'Non-commercial long positions' },
        { name: 'nonCommercialShort', type: 'number', description: 'Non-commercial short positions' },
        { name: 'commercialLong', type: 'number', description: 'Commercial long positions' },
        { name: 'commercialShort', type: 'number', description: 'Commercial short positions' },
        { name: 'netNonCommercial', type: 'number', description: 'Net non-commercial (speculative) positioning' },
        { name: 'reportDate', type: 'date', description: 'Report date' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 604_800_000, // weekly
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      const response = await this.client.get<COTReportRow[]>('', {
        params: { $limit: '1' },
      });
      return response.status === 200 && response.data.length > 0;
    } catch {
      return false;
    }
  }
}

export default new CftcCotConnector();
