import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { PriceQuote } from '@commodity-monitor/shared';
import { usePriceStore } from '../stores/price-store';
import { useWebSocket } from './use-websocket';

const API_BASE = '/api/v1';

async function fetchCommodityPrices(symbol: string): Promise<PriceQuote[]> {
  const res = await fetch(`${API_BASE}/commodities/${symbol}/prices`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prices for ${symbol}: ${res.statusText}`);
  }
  return res.json();
}

interface UseCommodityPricesOptions {
  symbol: string;
  wsUrl?: string;
  enabled?: boolean;
}

export function useCommodityPrices({
  symbol,
  wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/prices`,
  enabled = true,
}: UseCommodityPricesOptions) {
  const updatePrice = usePriceStore((s) => s.updatePrice);

  const query = useQuery<PriceQuote[]>({
    queryKey: ['commodity-prices', symbol],
    queryFn: () => fetchCommodityPrices(symbol),
    enabled: enabled && !!symbol,
    refetchInterval: 60_000,
  });

  const { connected, send } = useWebSocket({
    url: wsUrl,
    onMessage: (data) => {
      const quote = data as PriceQuote;
      if (quote?.symbol === symbol) {
        updatePrice(quote);
      }
    },
  });

  // Subscribe to the symbol over WebSocket once connected
  useEffect(() => {
    if (connected && symbol) {
      send({ type: 'subscribe', symbols: [symbol] });
    }
  }, [connected, symbol, send]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    connected,
  };
}
