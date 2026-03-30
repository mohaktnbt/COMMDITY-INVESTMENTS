import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/v1';

interface MandiPrice {
  market: string;
  state: string;
  district: string;
  commodity: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrivalDate: string;
}

interface UseMandiPricesParams {
  commodity?: string;
  state?: string;
  limit?: number;
  enabled?: boolean;
}

async function fetchMandiPrices(
  params: Omit<UseMandiPricesParams, 'enabled'>,
): Promise<MandiPrice[]> {
  const searchParams = new URLSearchParams();
  if (params.commodity) searchParams.set('commodity', params.commodity);
  if (params.state) searchParams.set('state', params.state);
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const url = `${API_BASE}/india/mandis${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch mandi prices: ${res.statusText}`);
  }
  return res.json();
}

export function useMandiPrices({
  commodity,
  state,
  limit,
  enabled = true,
}: UseMandiPricesParams = {}) {
  return useQuery<MandiPrice[]>({
    queryKey: ['mandi-prices', commodity, state, limit],
    queryFn: () => fetchMandiPrices({ commodity, state, limit }),
    enabled,
    staleTime: 5 * 60_000,
  });
}
