import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

/** GDELT query modes */
const MODES = {
  ARTICLE_LIST: 'ArtList',
  TIMELINE_VOL: 'TimelineVol',
  TIMELINE_TONE: 'TimelineTone',
  TIMELINE_SOURCELANG: 'TimelineSourceLang',
  TONE_CHART: 'ToneChart',
} as const;

/** Pre-configured commodity news search terms */
const COMMODITY_SEARCH_TERMS: Record<string, string> = {
  CRUDE_OIL: '(crude oil OR petroleum OR OPEC OR Brent crude OR WTI)',
  NATURAL_GAS: '(natural gas OR LNG OR pipeline gas)',
  GOLD: '(gold price OR gold market OR gold bullion)',
  SILVER: '(silver price OR silver market)',
  COPPER: '(copper price OR copper market OR copper mine)',
  WHEAT: '(wheat price OR wheat harvest OR wheat export)',
  CORN: '(corn price OR maize market OR corn harvest)',
  SOYBEANS: '(soybean price OR soybean market OR soybean harvest)',
  SUGAR: '(sugar price OR sugar market OR sugar cane)',
  COFFEE: '(coffee price OR coffee market OR arabica OR robusta)',
  COTTON: '(cotton price OR cotton market OR cotton harvest)',
  IRON_ORE: '(iron ore price OR iron ore market OR iron ore mine)',
  PALM_OIL: '(palm oil price OR palm oil market)',
  COCOA: '(cocoa price OR cocoa market OR cocoa beans)',
};

/** GDELT article from ArtList response */
interface GDELTArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
  tone: number;
}

interface GDELTArticleListResponse {
  articles: GDELTArticle[];
}

/** GDELT timeline data point */
interface GDELTTimelineDataPoint {
  date: string;
  value: number;
}

interface GDELTTimelineSeries {
  series: Array<{
    name: string;
    data: GDELTTimelineDataPoint[];
  }>;
}

/** Parsed news article */
export interface CommodityNewsArticle {
  url: string;
  title: string;
  seenDate: string;
  domain: string;
  language: string;
  sourceCountry: string;
  tone: number;
  imageUrl: string;
}

/** Timeline data point for volume or tone */
export interface CommodityNewsTimeline {
  date: string;
  value: number;
}

class GdeltConnector extends BaseConnector {
  readonly name = 'gdelt';
  readonly source = 'GDELT Project';
  readonly rateLimit: ConnectorRateLimit = { requests: 10, windowMs: 60_000 };

  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(10, 10 / 60);

  constructor() {
    super();
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30_000,
    });
  }

  /**
   * GDELT provides news data, not price data -- returns empty array.
   * Use fetchCommodityNews() or fetchNewsTone() instead.
   */
  async fetchLatestPrices(_symbols: string[]): Promise<PriceQuote[]> {
    return [];
  }

  /**
   * GDELT provides news data, not OHLCV -- returns empty array.
   * Use fetchNewsVolume() for time-series news volume data.
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
   * Fetch recent news articles related to a commodity.
   */
  async fetchCommodityNews(
    commodity: string,
    options: {
      maxRecords?: number;
      timespan?: string; // e.g. '24h', '7d', '30d'
      sourceLanguage?: string;
      sourceCountry?: string;
    } = {},
  ): Promise<CommodityNewsArticle[]> {
    const query = COMMODITY_SEARCH_TERMS[commodity];
    if (!query) {
      throw new Error(`Unknown commodity: ${commodity}. Supported: ${Object.keys(COMMODITY_SEARCH_TERMS).join(', ')}`);
    }

    await this.limiter.acquire();

    const params: Record<string, string> = {
      query,
      mode: MODES.ARTICLE_LIST,
      format: 'json',
      maxrecords: String(options.maxRecords ?? 75),
      timespan: options.timespan ?? '7d',
      sort: 'DateDesc',
    };

    if (options.sourceLanguage) {
      params['sourcelang'] = options.sourceLanguage;
    }
    if (options.sourceCountry) {
      params['sourcecountry'] = options.sourceCountry;
    }

    const response = await withRetry(async () => {
      return this.client.get<GDELTArticleListResponse>('', { params });
    });

    const articles = response.data.articles ?? [];
    return articles.map((a) => ({
      url: a.url,
      title: a.title,
      seenDate: a.seendate,
      domain: a.domain,
      language: a.language,
      sourceCountry: a.sourcecountry,
      tone: a.tone,
      imageUrl: a.socialimage,
    }));
  }

  /**
   * Fetch custom news articles with a free-text query.
   */
  async fetchCustomNews(
    queryString: string,
    options: {
      maxRecords?: number;
      timespan?: string;
    } = {},
  ): Promise<CommodityNewsArticle[]> {
    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.client.get<GDELTArticleListResponse>('', {
        params: {
          query: queryString,
          mode: MODES.ARTICLE_LIST,
          format: 'json',
          maxrecords: String(options.maxRecords ?? 75),
          timespan: options.timespan ?? '7d',
          sort: 'DateDesc',
        },
      });
    });

    const articles = response.data.articles ?? [];
    return articles.map((a) => ({
      url: a.url,
      title: a.title,
      seenDate: a.seendate,
      domain: a.domain,
      language: a.language,
      sourceCountry: a.sourcecountry,
      tone: a.tone,
      imageUrl: a.socialimage,
    }));
  }

  /**
   * Fetch the news volume timeline for a commodity over the past timespan.
   */
  async fetchNewsVolume(
    commodity: string,
    timespan = '30d',
  ): Promise<CommodityNewsTimeline[]> {
    const query = COMMODITY_SEARCH_TERMS[commodity];
    if (!query) {
      throw new Error(`Unknown commodity: ${commodity}`);
    }

    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.client.get<GDELTTimelineSeries>('', {
        params: {
          query,
          mode: MODES.TIMELINE_VOL,
          format: 'json',
          timespan,
        },
      });
    });

    const series = response.data.series ?? [];
    if (series.length === 0) return [];

    return series[0].data.map((d) => ({
      date: d.date,
      value: d.value,
    }));
  }

  /**
   * Fetch average media tone (sentiment) timeline for a commodity.
   */
  async fetchNewsTone(
    commodity: string,
    timespan = '30d',
  ): Promise<CommodityNewsTimeline[]> {
    const query = COMMODITY_SEARCH_TERMS[commodity];
    if (!query) {
      throw new Error(`Unknown commodity: ${commodity}`);
    }

    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.client.get<GDELTTimelineSeries>('', {
        params: {
          query,
          mode: MODES.TIMELINE_TONE,
          format: 'json',
          timespan,
        },
      });
    });

    const series = response.data.series ?? [];
    if (series.length === 0) return [];

    return series[0].data.map((d) => ({
      date: d.date,
      value: d.value,
    }));
  }

  getSupportedSymbols(): string[] {
    return Object.keys(COMMODITY_SEARCH_TERMS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'GDELT DOC API for commodity-related news monitoring. Provides article lists, volume timelines, and tone analysis.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'title', type: 'string', description: 'Article title' },
        { name: 'url', type: 'string', description: 'Article URL' },
        { name: 'tone', type: 'number', description: 'Article tone (-100 to 100)' },
        { name: 'seenDate', type: 'date', description: 'Date the article was seen' },
        { name: 'domain', type: 'string', description: 'Source domain' },
        { name: 'sourceCountry', type: 'string', description: 'Country of the source' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 900_000, // 15 minutes
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      const response = await this.client.get<GDELTArticleListResponse>('', {
        params: {
          query: 'commodity',
          mode: MODES.ARTICLE_LIST,
          format: 'json',
          maxrecords: '1',
          timespan: '1d',
        },
      });
      return (response.data.articles?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }
}

export default new GdeltConnector();
