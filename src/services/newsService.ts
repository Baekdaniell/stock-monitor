import { useStore } from '../store'
import type { NewsArticle, NewsSentiment, NewsType } from '../store/types'
import { fetchWithRetry } from './fetchWithRetry'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30분

// ── 감성 분석용 키워드 ─────────────────────────────────────────────────────────
const POSITIVE_WORDS = new Set([
  'beat', 'beats', 'surge', 'surges', 'rally', 'rallies', 'upgrade', 'upgrades',
  'strong', 'outperform', 'profit', 'growth', 'record', 'rise', 'rises',
  'gain', 'gains', 'bullish', 'exceed', 'exceeds', 'soar', 'soars',
  'jump', 'jumps', 'boost', 'boosts', 'upbeat', 'optimistic', 'higher',
])

const NEGATIVE_WORDS = new Set([
  'miss', 'misses', 'fall', 'falls', 'drop', 'drops', 'downgrade', 'downgrades',
  'weak', 'underperform', 'loss', 'losses', 'decline', 'declines',
  'plunge', 'plunges', 'crash', 'crashes', 'bearish', 'concern', 'concerns',
  'risk', 'disappoint', 'disappoints', 'cut', 'cuts', 'layoff', 'layoffs',
  'warning', 'slump', 'slumps', 'lower', 'tumble', 'tumbles',
])

// ── 유형 감지용 키워드 ─────────────────────────────────────────────────────────
const ANALYST_WORDS = new Set([
  'analyst', 'analysts', 'upgrade', 'downgrade', 'rating', 'ratings',
  'overweight', 'underweight', 'outperform', 'underperform', 'initiates',
  'coverage', 'target', 'reiterate', 'reiterates',
])
const ANALYST_PHRASES = ['price target', 'buy rating', 'sell rating', 'hold rating', 'price cut']

const EARNINGS_WORDS = new Set([
  'earnings', 'revenue', 'eps', 'quarterly', 'fiscal', 'quarter', 'guidance',
  'forecast', 'outlook', 'q1', 'q2', 'q3', 'q4', 'results',
])

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter(Boolean)
}

function analyzeSentiment(title: string): NewsSentiment {
  const tokens = tokenize(title)
  let pos = 0
  let neg = 0
  for (const t of tokens) {
    if (POSITIVE_WORDS.has(t)) pos++
    if (NEGATIVE_WORDS.has(t)) neg++
  }
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

function detectType(title: string): NewsType {
  const lower = title.toLowerCase()
  const tokens = tokenize(lower)

  if (tokens.some((t) => ANALYST_WORDS.has(t))) return 'analyst'
  if (ANALYST_PHRASES.some((p) => lower.includes(p))) return 'analyst'
  if (tokens.some((t) => EARNINGS_WORDS.has(t))) return 'earnings'
  return 'news'
}

function findRelatedSymbols(text: string, symbols: string[]): string[] {
  const upper = text.toUpperCase()
  // 심볼이 단어 경계로 등장하는지 확인 (예: "AAPL" vs "AAPLX")
  return symbols.filter((sym) => {
    const re = new RegExp(`(?<![A-Z])${sym}(?![A-Z])`)
    return re.test(upper)
  })
}

// ── NewsAPI 응답 타입 ──────────────────────────────────────────────────────────
interface RawArticle {
  title: string
  url: string
  source: { name: string }
  publishedAt: string
  description?: string | null
}

interface NewsAPIResponse {
  status: string
  articles: RawArticle[]
}

// ── NewsService ────────────────────────────────────────────────────────────────
class NewsService {
  private intervalId: ReturnType<typeof setInterval> | null = null

  private getSymbols(): { holdings: string[]; watchlist: string[] } {
    const { holdings, watchlist } = useStore.getState()
    return {
      holdings: holdings.map((h) => h.symbol),
      watchlist: watchlist.map((w) => w.symbol),
    }
  }

  async refreshAll(): Promise<void> {
    const apiKey =
      localStorage.getItem('newsapi_key') ||
      (import.meta.env.VITE_NEWSAPI_KEY as string | undefined)
    if (!apiKey) {
      console.warn('[NewsService] NewsAPI 키가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.')
      return
    }

    const { holdings, watchlist } = this.getSymbols()
    const allSymbols = [...new Set([...holdings, ...watchlist])]
    if (allSymbols.length === 0) return

    const holdingsSet  = new Set(holdings)
    const watchlistSet = new Set(watchlist)

    useStore.getState().setNewsLoading(true)

    try {
      const params = new URLSearchParams({
        q: allSymbols.join(' OR '),
        sortBy: 'publishedAt',
        pageSize: '30',
        language: 'en',
        apiKey,
      })

      const res = await fetchWithRetry(`/api/news/v2/everything?${params.toString()}`)
      if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`)

      const json = await res.json() as NewsAPIResponse
      if (json.status !== 'ok') throw new Error('NewsAPI 오류 응답')

      const articles: NewsArticle[] = json.articles
        .filter((a) => a.title && a.url && !a.title.includes('[Removed]'))
        .map((a, idx): NewsArticle => {
          const searchText = `${a.title} ${a.description ?? ''}`
          let relatedSymbols = findRelatedSymbols(searchText, allSymbols)

          // 매칭 심볼이 없으면 쿼리 첫 번째 심볼로 폴백
          if (relatedSymbols.length === 0) relatedSymbols = [allSymbols[0]]

          // 보유/관심 어느 쪽에도 속하지 않으면 제외 (폴백 포함이므로 사실상 항상 통과)
          const isRelevant = relatedSymbols.some(
            (s) => holdingsSet.has(s) || watchlistSet.has(s),
          )
          if (!isRelevant) relatedSymbols = [allSymbols[0]]

          return {
            id: `${idx}-${a.url}`,
            title: a.title,
            source: a.source.name,
            url: a.url,
            publishedAt: a.publishedAt,
            relatedSymbols,
            sentiment: analyzeSentiment(a.title),
            type: detectType(a.title),
          }
        })

      useStore.getState().setNews(articles)
    } catch (err) {
      useStore.getState().setNewsLoading(false)
      console.warn('[NewsService] 패치 실패:', err)
    }
  }

  start(): void {
    if (this.intervalId !== null) return
    void this.refreshAll()
    this.intervalId = setInterval(() => void this.refreshAll(), REFRESH_INTERVAL_MS)
  }

  stop(): void {
    if (this.intervalId === null) return
    clearInterval(this.intervalId)
    this.intervalId = null
  }
}

export const newsService = new NewsService()
