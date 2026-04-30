import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Alert, AlertType, CandleInterval, CandleSet,
  Holding, NewsArticle, OHLCVCandle, PriceData, WatchItem,
} from './types'
import {
  fetchHoldings, fetchWatchlist,
  upsertHolding, deleteHolding,
  upsertWatchItem, deleteWatchItem,
} from '../lib/db'

// ── Auth slice ─────────────────────────────────────────────────────────────────
interface AuthSlice {
  userId:    string | null
  userEmail: string | null
  authReady: boolean                              // 최초 세션 확인 완료 여부
  setUser:      (id: string | null, email: string | null) => void
  setAuthReady: (ready: boolean) => void
  loadUserData: (userId: string) => Promise<void> // Supabase → 스토어 동기화
  clearUserData: () => void                       // 로그아웃 시 로컬 데이터 초기화
}

// ── Holdings slice ─────────────────────────────────────────────────────────────
interface HoldingsSlice {
  holdings: Holding[]
  addHolding:    (holding: Holding) => void
  removeHolding: (symbol: string)   => void
  updateHolding: (symbol: string, patch: Partial<Omit<Holding, 'symbol'>>) => void
  setHoldings:   (holdings: Holding[]) => void
}

// ── Watchlist slice ────────────────────────────────────────────────────────────
interface WatchlistSlice {
  watchlist: WatchItem[]
  addToWatchlist:      (item: WatchItem) => void
  removeFromWatchlist: (symbol: string)  => void
  setWatchlist:        (items: WatchItem[]) => void
}

// ── Prices slice ───────────────────────────────────────────────────────────────
interface PricesSlice {
  prices:        Record<string, PriceData>
  lastUpdatedAt: string | null
  setPrice:  (data: PriceData)   => void
  setPrices: (data: PriceData[]) => void
}

// ── Candles slice ──────────────────────────────────────────────────────────────
interface CandlesSlice {
  candles: Record<string, CandleSet>
  setCandles: (symbol: string, interval: CandleInterval, data: OHLCVCandle[]) => void
}

// ── News slice ─────────────────────────────────────────────────────────────────
interface NewsSlice {
  news:        NewsArticle[]
  newsLoading: boolean
  setNews:        (articles: NewsArticle[]) => void
  setNewsLoading: (loading: boolean)        => void
  prependNews:    (articles: NewsArticle[]) => void
}

// ── Alerts slice ───────────────────────────────────────────────────────────────
interface AlertsSlice {
  alerts: Alert[]
  addAlert:    (symbol: string, type: AlertType, targetPrice: number) => void
  removeAlert: (id: string) => void
  triggerAlert:(id: string) => void
}

// ── Theme slice ────────────────────────────────────────────────────────────────
interface ThemeSlice {
  dark:    boolean
  setDark: (dark: boolean) => void
}

// ── Combined ──────────────────────────────────────────────────────────────────
type StoreState =
  AuthSlice & HoldingsSlice & WatchlistSlice &
  PricesSlice & CandlesSlice & NewsSlice & AlertsSlice & ThemeSlice

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({

      // ── Auth ────────────────────────────────────────────────────────────────
      userId:    null,
      userEmail: null,
      authReady: false,

      setUser: (id, email) => set({ userId: id, userEmail: email }),
      setAuthReady: (ready) => set({ authReady: ready }),

      loadUserData: async (userId) => {
        const [holdings, watchlist] = await Promise.all([
          fetchHoldings(userId),
          fetchWatchlist(userId),
        ])
        set({ holdings, watchlist })
      },

      clearUserData: () => set({ holdings: [], watchlist: [], alerts: [] }),

      // ── Holdings ────────────────────────────────────────────────────────────
      holdings: [],
      setHoldings: (holdings) => set({ holdings }),

      addHolding: (holding) => {
        const { holdings, userId } = get()
        if (holdings.some((h) => h.symbol === holding.symbol)) return
        set({ holdings: [...holdings, holding] })
        if (userId) upsertHolding(userId, holding).catch((err) => {
          console.error('종목 저장 실패:', err)
          set((s) => ({ holdings: s.holdings.filter((h) => h.symbol !== holding.symbol) }))
        })
      },

      removeHolding: (symbol) => {
        const { userId, holdings } = get()
        const removed = holdings.find((h) => h.symbol === symbol)
        set((s) => ({ holdings: s.holdings.filter((h) => h.symbol !== symbol) }))
        if (userId) deleteHolding(userId, symbol).catch((err) => {
          console.error('종목 삭제 실패:', err)
          if (removed) set((s) => ({ holdings: [...s.holdings, removed] }))
        })
      },

      updateHolding: (symbol, patch) => {
        const prev = get().holdings.find((h) => h.symbol === symbol)
        set((s) => ({
          holdings: s.holdings.map((h) => (h.symbol === symbol ? { ...h, ...patch } : h)),
        }))
        const { userId, holdings } = get()
        const updated = holdings.find((h) => h.symbol === symbol)
        if (userId && updated) upsertHolding(userId, updated).catch((err) => {
          console.error('종목 수정 실패:', err)
          if (prev) set((s) => ({ holdings: s.holdings.map((h) => (h.symbol === symbol ? prev : h)) }))
        })
      },

      // ── Watchlist ───────────────────────────────────────────────────────────
      watchlist: [],
      setWatchlist: (watchlist) => set({ watchlist }),

      addToWatchlist: (item) => {
        const { watchlist, userId } = get()
        if (watchlist.some((w) => w.symbol === item.symbol)) return
        set({ watchlist: [...watchlist, item] })
        if (userId) upsertWatchItem(userId, item).catch((err) => {
          console.error('관심 종목 저장 실패:', err)
          set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== item.symbol) }))
        })
      },

      removeFromWatchlist: (symbol) => {
        const { userId, watchlist } = get()
        const removed = watchlist.find((w) => w.symbol === symbol)
        set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) }))
        if (userId) deleteWatchItem(userId, symbol).catch((err) => {
          console.error('관심 종목 삭제 실패:', err)
          if (removed) set((s) => ({ watchlist: [...s.watchlist, removed] }))
        })
      },

      // ── Prices ──────────────────────────────────────────────────────────────
      prices: {},
      lastUpdatedAt: null,

      setPrice: (data) =>
        set((s) => ({
          prices: { ...s.prices, [data.symbol]: data },
          lastUpdatedAt: new Date().toISOString(),
        })),

      setPrices: (data) =>
        set((s) => ({
          prices: data.reduce((acc, d) => ({ ...acc, [d.symbol]: d }), { ...s.prices }),
          lastUpdatedAt: new Date().toISOString(),
        })),

      // ── Candles ─────────────────────────────────────────────────────────────
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

      // ── News ────────────────────────────────────────────────────────────────
      news: [],
      newsLoading: false,
      setNews:        (articles) => set({ news: articles, newsLoading: false }),
      setNewsLoading: (loading)  => set({ newsLoading: loading }),
      prependNews:    (articles) => set((s) => ({ news: [...articles, ...s.news] })),

      // ── Alerts (localStorage 유지) ───────────────────────────────────────────
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
      removeAlert:  (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      triggerAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)),
        })),

      // ── Theme ────────────────────────────────────────────────────────────────
      dark:
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
      setDark: (dark) => set({ dark }),
    }),
    {
      name: 'antark',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const old = persisted as Record<string, unknown>
        if (version < 2) return { alerts: old.alerts ?? [], dark: old.dark ?? false }
        if (version < 3) return { alerts: old.alerts ?? [], dark: old.dark ?? false }
        if (version < 4) return { alerts: old.alerts ?? [], dark: old.dark ?? false }
        return persisted
      },
      // holdings/watchlist는 Supabase가 단일 출처 — 계정 구분 없이 캐시하면 계정 혼동 발생
      partialize: (s) => ({ alerts: s.alerts, dark: s.dark }),
    },
  ),
)
