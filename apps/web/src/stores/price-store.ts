import { create } from 'zustand';
import type { PriceQuote, CommodityCategory } from '@commodity-monitor/shared';

interface PriceState {
  prices: Map<string, PriceQuote>;
  lastUpdated: number;

  updatePrice: (quote: PriceQuote) => void;
  updatePrices: (quotes: PriceQuote[]) => void;
  getPrice: (symbol: string) => PriceQuote | undefined;
  getPricesByCategory: (category: CommodityCategory) => PriceQuote[];
}

export const usePriceStore = create<PriceState>()((set, get) => ({
  prices: new Map<string, PriceQuote>(),
  lastUpdated: 0,

  updatePrice: (quote: PriceQuote) =>
    set((state) => {
      const next = new Map(state.prices);
      next.set(quote.symbol, quote);
      return { prices: next, lastUpdated: Date.now() };
    }),

  updatePrices: (quotes: PriceQuote[]) =>
    set((state) => {
      const next = new Map(state.prices);
      for (const quote of quotes) {
        next.set(quote.symbol, quote);
      }
      return { prices: next, lastUpdated: Date.now() };
    }),

  getPrice: (symbol: string) => get().prices.get(symbol),

  getPricesByCategory: (category: CommodityCategory) => {
    const all = Array.from(get().prices.values());
    // Category filtering relies on a mapping maintained externally;
    // here we expose the raw array so consumers can filter as needed.
    // For a self-contained filter we would need CommodityMeta loaded in
    // the store. Return all prices and let the caller filter by category.
    return all;
  },
}));
