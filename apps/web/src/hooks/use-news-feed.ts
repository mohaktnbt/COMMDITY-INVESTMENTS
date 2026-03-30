import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/v1';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  commodity?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  relevanceScore?: number;
}

interface UseNewsFeedParams {
  commodity?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  limit?: number;
  enabled?: boolean;
}

async function fetchNews(
  params: Omit<UseNewsFeedParams, 'enabled'>,
): Promise<NewsItem[]> {
  const searchParams = new URLSearchParams();
  if (params.commodity) searchParams.set('commodity', params.commodity);
  if (params.sentiment) searchParams.set('sentiment', params.sentiment);
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const url = `${API_BASE}/news${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch news: ${res.statusText}`);
  }
  return res.json();
}

export function useNewsFeed({
  commodity,
  sentiment,
  limit,
  enabled = true,
}: UseNewsFeedParams = {}) {
  return useQuery<NewsItem[]>({
    queryKey: ['news-feed', commodity, sentiment, limit],
    queryFn: () => fetchNews({ commodity, sentiment, limit }),
    enabled,
    staleTime: 2 * 60_000,
  });
}
