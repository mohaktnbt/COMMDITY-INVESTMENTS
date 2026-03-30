/**
 * NewsService - fetches and manages commodity news.
 * Returns sample data for now.
 */
import type { NewsItem, NewsFeedFilter, SentimentLabel } from '@commodity-monitor/shared';

const SAMPLE_NEWS: NewsItem[] = [
  {
    id: 'news-001',
    title: 'Gold prices surge to record high amid geopolitical tensions',
    summary: 'Gold futures climbed above $2,700 per ounce as investors sought safe-haven assets amid escalating geopolitical concerns.',
    source: 'Reuters',
    url: 'https://example.com/gold-record-high',
    publishedAt: Date.now() - 3_600_000,
    sentiment: { score: 0.7, label: 'positive', confidence: 0.92 },
    commodities: ['GOLD', 'SILVER'],
    countries: ['US', 'IN'],
    language: 'en',
  },
  {
    id: 'news-002',
    title: 'Crude oil falls on demand concerns from China slowdown',
    summary: 'Brent crude dropped 2.3% as weak economic data from China raised demand outlook concerns.',
    source: 'Bloomberg',
    url: 'https://example.com/crude-china-concerns',
    publishedAt: Date.now() - 7_200_000,
    sentiment: { score: -0.6, label: 'negative', confidence: 0.88 },
    commodities: ['BRENT_CRUDE', 'WTI_CRUDE'],
    countries: ['CN', 'US'],
    language: 'en',
  },
  {
    id: 'news-003',
    title: 'India wheat procurement exceeds target, MSP raised',
    summary: 'Government procurement of wheat crosses 26 million tonnes, exceeding the season target. MSP raised by Rs 150/quintal for next season.',
    source: 'Economic Times',
    url: 'https://example.com/india-wheat-procurement',
    publishedAt: Date.now() - 14_400_000,
    sentiment: { score: 0.4, label: 'positive', confidence: 0.81 },
    commodities: ['WHEAT', 'NCDEX_WHEAT'],
    countries: ['IN'],
    language: 'en',
  },
  {
    id: 'news-004',
    title: 'Copper inventories at LME warehouses hit 15-year low',
    summary: 'London Metal Exchange copper stocks fell to their lowest level since 2009, signalling tightening supply conditions.',
    source: 'Financial Times',
    url: 'https://example.com/copper-lme-inventories',
    publishedAt: Date.now() - 21_600_000,
    sentiment: { score: 0.3, label: 'positive', confidence: 0.85 },
    commodities: ['COPPER', 'MCX_COPPER'],
    countries: ['GB', 'US'],
    language: 'en',
  },
  {
    id: 'news-005',
    title: 'USDA raises corn yield forecast, bearish for prices',
    summary: 'The USDA increased its US corn yield estimate to 183.1 bushels per acre in the latest WASDE report.',
    source: 'AgWeb',
    url: 'https://example.com/usda-corn-forecast',
    publishedAt: Date.now() - 28_800_000,
    sentiment: { score: -0.4, label: 'negative', confidence: 0.79 },
    commodities: ['CORN'],
    countries: ['US'],
    language: 'en',
  },
  {
    id: 'news-006',
    title: 'Natural gas storage draws exceed expectations ahead of winter',
    summary: 'EIA reported a larger-than-expected withdrawal from US natural gas storage, pushing prices higher.',
    source: 'Natural Gas Intel',
    url: 'https://example.com/natgas-storage-draw',
    publishedAt: Date.now() - 36_000_000,
    sentiment: { score: 0.2, label: 'neutral', confidence: 0.74 },
    commodities: ['NATURAL_GAS'],
    countries: ['US'],
    language: 'en',
  },
];

export class NewsService {
  /**
   * Get latest news items with optional filtering.
   */
  async getLatestNews(params: NewsFeedFilter = {}): Promise<NewsItem[]> {
    // TODO: Fetch from QuestDB
    // const sql = `SELECT * FROM news WHERE ...`;
    // return queryQuestDB(sql);

    let filtered = [...SAMPLE_NEWS];

    if (params.commodities?.length) {
      filtered = filtered.filter((n) =>
        n.commodities.some((c) => params.commodities!.includes(c)),
      );
    }

    if (params.sentiment) {
      filtered = filtered.filter((n) => n.sentiment.label === params.sentiment);
    }

    if (params.from) {
      filtered = filtered.filter((n) => n.publishedAt >= params.from!);
    }

    if (params.to) {
      filtered = filtered.filter((n) => n.publishedAt <= params.to!);
    }

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Search news by text query.
   */
  async searchNews(query: string): Promise<NewsItem[]> {
    // TODO: Full-text search via QuestDB or Elasticsearch
    const q = query.toLowerCase();
    return SAMPLE_NEWS.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.summary?.toLowerCase().includes(q) ?? false),
    );
  }
}

export const newsService = new NewsService();
