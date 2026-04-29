// ── Holdings ──────────────────────────────────────────────────────────────────
export interface Holding {
  symbol: string
  name: string
  shares: number
  avgCost: number
  buyDate?: string  // 'YYYY-MM-DD'
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
export interface WatchItem {
  symbol: string
  name: string
  addedAt: string
}

// ── Prices ────────────────────────────────────────────────────────────────────
export interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
  updatedAt: string
  week52High?: number
  week52Low?: number
}

// ── OHLCV Candle ───────────────────────────────────────────────────────────────
export interface OHLCVCandle {
  time: number   // Unix timestamp (seconds)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type CandleInterval = 'intraday' | 'daily'

export interface CandleSet {
  intraday: OHLCVCandle[]   // 1h interval, 5d range
  daily: OHLCVCandle[]      // 1d interval, 3mo range
}

// ── News ──────────────────────────────────────────────────────────────────────
export type NewsSentiment = 'positive' | 'neutral' | 'negative'
export type NewsType = 'news' | 'earnings' | 'analyst'

export interface NewsArticle {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  relatedSymbols: string[]
  sentiment: NewsSentiment
  type: NewsType
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export type AlertType = 'above' | 'below'

export interface Alert {
  id: string
  symbol: string
  type: AlertType
  targetPrice: number
  triggered: boolean
  createdAt: string
}
