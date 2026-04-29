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
  let pos = 0; let neg = 0
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
  return symbols.filter((sym) => {
    const base = sym.replace(/\.(KS|KQ|T|L|SW|BA|DE)$/, '')
    const re = new RegExp(`(?<![A-Z0-9])${base}(?![A-Z0-9])`)
    return re.test(upper)
  })
}

// ── Yahoo Finance 뉴스 타입 ────────────────────────────────────────────────────
interface YFNewsItem {
  uuid: string
  title: string
  publisher: string
  link: string
  providerPublishTime: number
  type: string
}

interface YFSearchResponse {
  news?: YFNewsItem[]
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

  private buildYfUrl(q: string): string {
    const base = import.meta.env.VITE_API_BASE_URL as string | undefined
    if (base) return `${base}/api/news-yf?q=${encodeURIComponent(q)}`
    return `/api/yahoo/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=20&quotesCount=0&listsCount=0`
  }

  private buildNewsApiUrl(q: string): string {
    const base = import.meta.env.VITE_API_BASE_URL as string | undefined
    const params = new URLSearchParams({ q, sortBy: 'publishedAt', pageSize: '30', language: 'en' })
    if (base) return `${base}/api/news?${params}`
    const apiKey =
      localStorage.getItem('newsapi_key') ||
      (import.meta.env.VITE_NEWSAPI_KEY as string | undefined) || ''
    params.set('apiKey', apiKey)
    return `/api/news/v2/everything?${params}`
  }

  // Yahoo Finance 뉴스 (API 키 불필요)
  private async fetchYfNews(allSymbols: string[]): Promise<NewsArticle[]> {
    const query = allSymbols
      .map((s) => s.replace(/\.(KS|KQ|T|L|SW|BA|DE)$/, ''))
      .slice(0, 5)
      .join(' OR ')

    const res = await fetchWithRetry(this.buildYfUrl(query))
    if (!res.ok) throw new Error(`YF News HTTP ${res.status}`)

    const json = await res.json() as YFSearchResponse
    const items = json.news ?? []

    return items
      .filter((a) => a.title && a.link)
      .map((a, idx): NewsArticle => {
        let related = findRelatedSymbols(a.title, allSymbols)
        if (related.length === 0) related = [allSymbols[0]]
        return {
          id: a.uuid || `yf-${idx}-${a.link}`,
          title: a.title,
          source: a.publisher,
          url: a.link,
          publishedAt: new Date(a.providerPublishTime * 1000).toISOString(),
          relatedSymbols: related,
          sentiment: analyzeSentiment(a.title),
          type: detectType(a.title),
        }
      })
  }

  // NewsAPI (키 있을 때 사용)
  private async fetchNewsApi(allSymbols: string[], holdingsSet: Set<string>, watchlistSet: Set<string>): Promise<NewsArticle[]> {
    const res = await fetchWithRetry(this.buildNewsApiUrl(allSymbols.join(' OR ')))
    if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`)

    const json = await res.json() as NewsAPIResponse
    if (json.status !== 'ok') throw new Error('NewsAPI 오류 응답')

    return json.articles
      .filter((a) => a.title && a.url && !a.title.includes('[Removed]'))
      .map((a, idx): NewsArticle => {
        const searchText = `${a.title} ${a.description ?? ''}`
        let related = findRelatedSymbols(searchText, allSymbols)
        if (related.length === 0) related = [allSymbols[0]]
        const isRelevant = related.some((s) => holdingsSet.has(s) || watchlistSet.has(s))
        if (!isRelevant) related = [allSymbols[0]]
        return {
          id: `${idx}-${a.url}`,
          title: a.title,
          source: a.source.name,
          url: a.url,
          publishedAt: a.publishedAt,
          relatedSymbols: related,
          sentiment: analyzeSentiment(a.title),
          type: detectType(a.title),
        }
      })
  }

  async refreshAll(): Promise<void> {
    const { holdings, watchlist } = this.getSymbols()
    const allSymbols = [...new Set([...holdings, ...watchlist])]
    if (allSymbols.length === 0) return

    const holdingsSet  = new Set(holdings)
    const watchlistSet = new Set(watchlist)
    const base    = import.meta.env.VITE_API_BASE_URL as string | undefined
    const apiKey  = localStorage.getItem('newsapi_key') || (import.meta.env.VITE_NEWSAPI_KEY as string | undefined)

    useStore.getState().setNewsLoading(true)

    try {
      let articles: NewsArticle[]

      // NewsAPI 키가 있으면 우선 사용, 없으면 Yahoo Finance 뉴스
      if (apiKey || base) {
        try {
          articles = await this.fetchNewsApi(allSymbols, holdingsSet, watchlistSet)
        } catch {
          articles = await this.fetchYfNews(allSymbols)
        }
      } else {
        articles = await this.fetchYfNews(allSymbols)
      }

      // 시간순 정렬 (최신 먼저)
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
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
