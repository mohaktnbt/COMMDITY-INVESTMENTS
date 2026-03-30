export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface SentimentScore {
  score: number;       // -1.0 to 1.0
  label: SentimentLabel;
  confidence: number;  // 0.0 to 1.0
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  url: string;
  publishedAt: number;
  sentiment: SentimentScore;
  commodities: string[];
  countries: string[];
  language: string;
  imageUrl?: string;
}

export interface NewsFeedFilter {
  commodities?: string[];
  sentiment?: SentimentLabel;
  sources?: string[];
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}
