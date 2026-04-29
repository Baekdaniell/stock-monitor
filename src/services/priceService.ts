import { useStore } from '../store'
import type { CandleInterval, OHLCVCandle } from '../store/types'
import { fetchWithRetry } from './fetchWithRetry'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000  // 10분

// ── Yahoo Finance v8 응답 파서 ─────────────────────────────────────────────────
interface YFResult {
  meta: {
    symbol: string
    regularMarketPrice?: number
    previousClose?: number
    chartPreviousClose?: number
    fiftyTwoWeekHigh?: number
    fiftyTwoWeekLow?: number
  }
  timestamp?: number[]
  indicators: {
    quote: Array<{
      open: (number | null)[]
      high: (number | null)[]
      low: (number | null)[]
      close: (number | null)[]
      volume: (number | null)[]
    }>
  }
}

function parseCandles(result: YFResult): OHLCVCandle[] {
  const timestamps = result.timestamp ?? []
  const q = result.indicators.quote[0]
  if (!q) return []

  return timestamps
    .map((t, i) => ({
      time: t,
      open: q.open[i] ?? 0,
      high: q.high[i] ?? 0,
      low: q.low[i] ?? 0,
      close: q.close[i] ?? 0,
      volume: q.volume[i] ?? 0,
    }))
    .filter((c) => c.close > 0)
}

// ── PriceService ───────────────────────────────────────────────────────────────
class PriceService {
  private intervalId: ReturnType<typeof setInterval> | null = null

  /** 스토어에서 현재 구독해야 할 심볼 목록을 읽음 */
  private getSymbols(): string[] {
    const { holdings, watchlist } = useStore.getState()
    const set = new Set([
      ...holdings.map((h) => h.symbol),
      ...watchlist.map((w) => w.symbol),
    ])
    return [...set]
  }

  /** 단일 심볼의 특정 인터벌 캔들 패치 */
  private async fetchCandles(
    symbol: string,
    interval: CandleInterval,
    query: string,
  ): Promise<void> {
    const url = `/api/finance/v8/finance/chart/${encodeURIComponent(symbol)}?${query}`
    const res = await fetchWithRetry(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`)

    const json = await res.json() as { chart: { result?: YFResult[]; error?: unknown } }
    const result = json.chart?.result?.[0]
    if (!result) throw new Error(`No result for ${symbol}`)

    const candles = parseCandles(result)
    useStore.getState().setCandles(symbol, interval, candles)

    // 현재가 업데이트 (daily 패치 기준으로만 수행)
    if (interval === 'daily') {
      const meta = result.meta
      const last = candles[candles.length - 1]
      const price = meta.regularMarketPrice ?? last?.close ?? 0
      const prevClose =
        meta.previousClose ??
        meta.chartPreviousClose ??
        candles[candles.length - 2]?.close ??
        price
      const change = price - prevClose
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

      useStore.getState().setPrice({
        symbol,
        price,
        change,
        changePercent,
        updatedAt: new Date().toISOString(),
        week52High: meta.fiftyTwoWeekHigh,
        week52Low:  meta.fiftyTwoWeekLow,
      })
    }
  }

  /** 단일 심볼의 intraday + daily 캔들을 동시에 패치 */
  async fetchSymbol(symbol: string): Promise<void> {
    try {
      await Promise.all([
        this.fetchCandles(symbol, 'intraday', 'interval=1h&range=5d'),
        this.fetchCandles(symbol, 'daily',    'interval=1d&range=3mo'),
      ])
    } catch (err) {
      console.warn(`[PriceService] ${symbol} 패치 실패:`, err)
    }
  }

  /** 구독 중인 모든 심볼을 갱신 */
  async refreshAll(): Promise<void> {
    const symbols = this.getSymbols()
    if (symbols.length === 0) return
    await Promise.all(symbols.map((s) => this.fetchSymbol(s)))
  }

  /** 서비스 시작 — StrictMode 이중 호출 대응 */
  start(): void {
    if (this.intervalId !== null) return
    void this.refreshAll()
    this.intervalId = setInterval(() => void this.refreshAll(), REFRESH_INTERVAL_MS)
  }

  /** 서비스 중지 */
  stop(): void {
    if (this.intervalId === null) return
    clearInterval(this.intervalId)
    this.intervalId = null
  }
}

export const priceService = new PriceService()
