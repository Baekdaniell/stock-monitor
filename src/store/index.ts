import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Alert, AlertType, CandleInterval, CandleSet, Holding, NewsArticle, OHLCVCandle, PriceData, WatchItem } from './types'

// ── Holdings slice ─────────────────────────────────────────────────────────────
interface HoldingsSlice {
  holdings: Holding[]
  addHolding: (holding: Holding) => void
  removeHolding: (symbol: string) => void
  updateHolding: (symbol: string, patch: Partial<Omit<Holding, 'symbol'>>) => void
}

// ── Watchlist slice ────────────────────────────────────────────────────────────
interface WatchlistSlice {
  watchlist: WatchItem[]
  addToWatchlist: (item: WatchItem) => void
  removeFromWatchlist: (symbol: string) => void
}

// ── Prices slice ───────────────────────────────────────────────────────────────
interface PricesSlice {
  prices: Record<string, PriceData>
  lastUpdatedAt: string | null
  setPrice: (data: PriceData) => void
  setPrices: (data: PriceData[]) => void
}

// ── Candles slice ─────────────────────────────────────────────────────────────
interface CandlesSlice {
  candles: Record<string, CandleSet>
  setCandles: (symbol: string, interval: CandleInterval, data: OHLCVCandle[]) => void
}

// ── News slice ─────────────────────────────────────────────────────────────────
interface NewsSlice {
  news: NewsArticle[]
  newsLoading: boolean
  setNews: (articles: NewsArticle[]) => void
  setNewsLoading: (loading: boolean) => void
  prependNews: (articles: NewsArticle[]) => void
}

// ── Theme slice ────────────────────────────────────────────────────────────────
interface ThemeSlice {
  dark: boolean
  setDark: (dark: boolean) => void
}

// ── Alerts slice ───────────────────────────────────────────────────────────────
interface AlertsSlice {
  alerts: Alert[]
  addAlert: (symbol: string, type: AlertType, targetPrice: number) => void
  removeAlert: (id: string) => void
  triggerAlert: (id: string) => void
}

// ── Combined store ─────────────────────────────────────────────────────────────
type StoreState = HoldingsSlice & WatchlistSlice & PricesSlice & CandlesSlice & NewsSlice & AlertsSlice & ThemeSlice

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Holdings
      holdings: [],
      addHolding: (holding) =>
        set((s) => ({
          holdings: s.holdings.some((h) => h.symbol === holding.symbol)
            ? s.holdings
            : [...s.holdings, holding],
        })),
      removeHolding: (symbol) =>
        set((s) => ({ holdings: s.holdings.filter((h) => h.symbol !== symbol) })),
      updateHolding: (symbol, patch) =>
        set((s) => ({
          holdings: s.holdings.map((h) => (h.symbol === symbol ? { ...h, ...patch } : h)),
        })),

      // Watchlist
      watchlist: [],
      addToWatchlist: (item) =>
        set((s) => ({
          watchlist: s.watchlist.some((w) => w.symbol === item.symbol)
            ? s.watchlist
            : [...s.watchlist, item],
        })),
      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) })),

      // Prices (not persisted — refreshed at runtime)
      prices: {},
      lastUpdatedAt: null,
      setPrice: (data) =>
        set((s) => ({
          prices: { ...s.prices, [data.symbol]: data },
          lastUpdatedAt: new Date().toISOString(),
        })),
      setPrices: (data) =>
        set((s) => ({
          prices: data.reduce(
            (acc, d) => ({ ...acc, [d.symbol]: d }),
            { ...s.prices },
          ),
          lastUpdatedAt: new Date().toISOString(),
        })),

      // Candles (not persisted)
      candles: {},
      setCandles: (symbol, interval, data) =>
        set((s) => ({
          candles: {
            ...s.candles,
            [symbol]: {
              ...(s.candles[symbol] ?? { intraday: [], daily: [] }),
              [interval]: data,
            },
          },
        })),

      // News (not persisted)
      news: [],
      newsLoading: false,
      setNews: (articles) => set({ news: articles, newsLoading: false }),
      setNewsLoading: (loading) => set({ newsLoading: loading }),
      prependNews: (articles) =>
        set((s) => ({ news: [...articles, ...s.news] })),

      // Theme
      dark:
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches),
      setDark: (dark) => set({ dark }),

      // Alerts
      alerts: [],
      addAlert: (symbol, type, targetPrice) =>
        set((s) => ({
          alerts: [
            ...s.alerts,
            {
              id: `${symbol}-${type}-${targetPrice}-${Date.now()}`,
              symbol,
              type,
              targetPrice,
              triggered: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeAlert: (id) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      triggerAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)),
        })),
    }),
    {
      name: 'stock-monitor',
      partialize: (s) => ({
        holdings: s.holdings,
        watchlist: s.watchlist,
        alerts: s.alerts,
        dark: s.dark,
      }),
    },
  ),
)
