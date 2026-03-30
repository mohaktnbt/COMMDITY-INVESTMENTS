import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: number;
}

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlistId: string | null;

  addWatchlist: (name: string) => void;
  removeWatchlist: (id: string) => void;
  addSymbol: (watchlistId: string, symbol: string) => void;
  removeSymbol: (watchlistId: string, symbol: string) => void;
  reorderSymbols: (watchlistId: string, symbols: string[]) => void;
  setActive: (id: string | null) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      watchlists: [],
      activeWatchlistId: null,

      addWatchlist: (name: string) =>
        set((state) => {
          const newWatchlist: Watchlist = {
            id: crypto.randomUUID(),
            name,
            symbols: [],
            createdAt: Date.now(),
          };
          return {
            watchlists: [...state.watchlists, newWatchlist],
            activeWatchlistId: state.activeWatchlistId ?? newWatchlist.id,
          };
        }),

      removeWatchlist: (id: string) =>
        set((state) => {
          const filtered = state.watchlists.filter((w) => w.id !== id);
          return {
            watchlists: filtered,
            activeWatchlistId:
              state.activeWatchlistId === id
                ? (filtered[0]?.id ?? null)
                : state.activeWatchlistId,
          };
        }),

      addSymbol: (watchlistId: string, symbol: string) =>
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === watchlistId && !w.symbols.includes(symbol)
              ? { ...w, symbols: [...w.symbols, symbol] }
              : w,
          ),
        })),

      removeSymbol: (watchlistId: string, symbol: string) =>
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === watchlistId
              ? { ...w, symbols: w.symbols.filter((s) => s !== symbol) }
              : w,
          ),
        })),

      reorderSymbols: (watchlistId: string, symbols: string[]) =>
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === watchlistId ? { ...w, symbols } : w,
          ),
        })),

      setActive: (id: string | null) => set({ activeWatchlistId: id }),
    }),
    { name: 'commodity-monitor-watchlists' },
  ),
);
