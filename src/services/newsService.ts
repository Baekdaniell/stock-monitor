import { useStore } from '../store'
import type { NewsArticle, NewsSentiment, NewsType } from '../store/types'
import { fetchWithRetry } from './fetchWithRetry'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000

// ── 감성 분석 키워드 ───────────────────────────────────────────────────────────
const POSITIVE_KO = ['상승', '급등', '강세', '호재', '신고가', '매수', '상향', '흑자', '호실적', '성장']
const NEGATIVE_KO = ['하락', '급락', '약세', '악재', '신저가', '매도', '하향', '적자', '부진', '우려', '리스크']
const POSITIVE_EN = new Set(['beat','surge','rally','upgrade','strong','outperform','profit','growth','record','rise','gain','bullish','soar','jump','boost'])
const NEGATIVE_EN = new Set(['miss','fall','drop','downgrade','weak','underperform','loss','decline','plunge','crash','bearish','risk','disappoint','cut','layoff','warning','slump'])

function analyzeSentiment(title: string): NewsSentiment {
  const lower = title.toLowerCase()
  let pos = POSITIVE_KO.filter((w) => title.includes(w)).length
  let neg = NEGATIVE_KO.filter((w) => title.includes(w)).length
  lower.split(/\W+/).forEach((t) => {
    if (POSITIVE_EN.has(t)) pos++
    if (NEGATIVE_EN.has(t)) neg++
  })
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

const ANALYST_KO = ['목표주가', '투자의견', '매수', '매도', '중립', '비중확대', '비중축소']
const EARNINGS_KO = ['실적', '영업이익', '매출', '순이익', '분기', '어닝', 'EPS', 'eps']
const ANALYST_EN = new Set(['analyst','upgrade','downgrade','rating','overweight','underweight','outperform','underperform','target'])
const EARNINGS_EN = new Set(['earnings','revenue','eps','quarterly','fiscal','quarter','guidance','forecast','results'])

function detectType(title: string): NewsType {
  const lower = title.toLowerCase()
  if (ANALYST_KO.some((w) => title.includes(w))) return 'analyst'
  if (lower.split(/\W+/).some((t) => ANALYST_EN.has(t))) return 'analyst'
  if (EARNINGS_KO.some((w) => title.includes(w))) return 'earnings'
  if (lower.split(/\W+/).some((t) => EARNINGS_EN.has(t))) return 'earnings'
  return 'news'
}

// ── Google News RSS 응답 타입 ──────────────────────────────────────────────────
interface RssItem {
  title: string
  link: string
  pubDate: string
  source: string
}

interface KrNewsResponse {
  items: RssItem[]
}

// ── Yahoo Finance 뉴스 타입 ────────────────────────────────────────────────────
interface YFNewsItem {
  uuid: string
  title: string
  publisher: string
  link: string
  providerPublishTime: number
}
interface YFSearchResponse { news?: YFNewsItem[] }

// ── NewsAPI 타입 ───────────────────────────────────────────────────────────────
interface RawArticle {
  title: string; url: string
  source: { name: string }; publishedAt: string; description?: string | null
}
interface NewsAPIResponse { status: string; articles: RawArticle[] }

// ── URL 빌더 ──────────────────────────────────────────────────────────────────
function base() { return import.meta.env.VITE_API_BASE_URL as string | undefined }

function krNewsUrl(q: string) {
  const b = base()
  return b
    ? `${b}/api/news-kr?q=${encodeURIComponent(q)}`
    : `/api/gnews/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
}

function yfNewsUrl(q: string) {
  const b = base()
  return b
    ? `${b}/api/news-yf?q=${encodeURIComponent(q)}`
    : `/api/yahoo/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=20&quotesCount=0&listsCount=0`
}

function newsApiUrl(q: string) {
  const b = base()
  const params = new URLSearchParams({ q, sortBy: 'publishedAt', pageSize: '30', language: 'en' })
  if (b) return `${b}/api/news?${params}`
  const apiKey = localStorage.getItem('newsapi_key') || (import.meta.env.VITE_NEWSAPI_KEY as string | undefined) || ''
  params.set('apiKey', apiKey)
  return `/api/news/v2/everything?${params}`
}

// ── 한국어 뉴스 쿼리 생성 ─────────────────────────────────────────────────────
function buildKrQuery(holdings: string[], watchlist: string[]): string {
  const { holdings: hs, watchlist: ws } = useStore.getState()
  const krNames = [...hs, ...ws]
    .filter((item) => /\.(KS|KQ)$/.test(item.symbol))
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, 4)

  if (krNames.length > 0) return krNames.join(' OR ') + ' 주가 주식'
  if (holdings.length > 0 || watchlist.length > 0) return '코스피 코스닥 주식 증시'
  return '코스피 코스닥 주식 증시'
}

// ── NewsService ────────────────────────────────────────────────────────────────
class NewsService {
  private intervalId: ReturnType<typeof setInterval> | null = null

  private getSymbols() {
    const { holdings, watchlist } = useStore.getState()
    return {
      holdings: holdings.map((h) => h.symbol),
      watchlist: watchlist.map((w) => w.symbol),
    }
  }

  private async fetchKrNews(allSymbols: string[]): Promise<NewsArticle[]> {
    const { holdings: hs, watchlist: ws } = useStore.getState()
    const q = buildKrQuery(hs.map((h) => h.symbol), ws.map((w) => w.symbol))
    const res = await fetchWithRetry(krNewsUrl(q))
    if (!res.ok) throw new Error(`KR News HTTP ${res.status}`)

    const json = await res.json() as KrNewsResponse
    return (json.items ?? [])
      .filter((a) => a.title && a.link)
      .map((a, idx): NewsArticle => ({
        id: `kr-${idx}-${a.link}`,
        title: a.title,
        source: a.source,
        url: a.link,
        publishedAt: a.pubDate ? new Date(a.pubDate).toISOString() : new Date().toISOString(),
        relatedSymbols: allSymbols.length > 0 ? [allSymbols[0]] : [],
        sentiment: analyzeSentiment(a.title),
        type: detectType(a.title),
      }))
  }

  private async fetchYfNews(allSymbols: string[]): Promise<NewsArticle[]> {
    const q = allSymbols.map((s) => s.replace(/\.[A-Z]+$/, '')).slice(0, 5).join(' OR ')
    const res = await fetchWithRetry(yfNewsUrl(q))
    if (!res.ok) throw new Error(`YF News HTTP ${res.status}`)
    const json = await res.json() as YFSearchResponse
    return (json.news ?? [])
      .filter((a) => a.title && a.link)
      .map((a, idx): NewsArticle => ({
        id: a.uuid || `yf-${idx}-${a.link}`,
        title: a.title,
        source: a.publisher,
        url: a.link,
        publishedAt: new Date(a.providerPublishTime * 1000).toISOString(),
        relatedSymbols: allSymbols.length > 0 ? [allSymbols[0]] : [],
        sentiment: analyzeSentiment(a.title),
        type: detectType(a.title),
      }))
  }

  private async fetchNewsApi(allSymbols: string[], holdingsSet: Set<string>, watchlistSet: Set<string>): Promise<NewsArticle[]> {
    const res = await fetchWithRetry(newsApiUrl(allSymbols.join(' OR ')))
    if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`)
    const json = await res.json() as NewsAPIResponse
    if (json.status !== 'ok') throw new Error('NewsAPI 오류')
    return json.articles
      .filter((a) => a.title && a.url && !a.title.includes('[Removed]'))
      .map((a, idx): NewsArticle => {
        const text = `${a.title} ${a.description ?? ''}`
        let related = allSymbols.filter((s) => {
          const b = s.replace(/\.[A-Z]+$/, '')
          return new RegExp(`(?<![A-Z0-9])${b}(?![A-Z0-9])`).test(text.toUpperCase())
        })
        if (related.length === 0) related = [allSymbols[0]]
        const isRelevant = related.some((s) => holdingsSet.has(s) || watchlistSet.has(s))
        if (!isRelevant) related = [allSymbols[0]]
        return {
          id: `na-${idx}-${a.url}`,
          title: a.title, source: a.source.name, url: a.url,
          publishedAt: a.publishedAt, relatedSymbols: related,
          sentiment: analyzeSentiment(a.title), type: detectType(a.title),
        }
      })
  }

  async refreshAll(): Promise<void> {
    const { holdings, watchlist } = this.getSymbols()
    const allSymbols = [...new Set([...holdings, ...watchlist])]
    if (allSymbols.length === 0) return

    const holdingsSet  = new Set(holdings)
    const watchlistSet = new Set(watchlist)
    const hasKrStocks  = allSymbols.some((s) => /\.(KS|KQ)$/.test(s))
    const apiKey = localStorage.getItem('newsapi_key') || (import.meta.env.VITE_NEWSAPI_KEY as string | undefined)

    useStore.getState().setNewsLoading(true)

    try {
      let articles: NewsArticle[]

      if (hasKrStocks) {
        // 한국 종목 보유 → 한국어 뉴스 우선
        try {
          articles = await this.fetchKrNews(allSymbols)
        } catch {
          articles = await this.fetchYfNews(allSymbols)
        }
      } else if (apiKey) {
        // 해외 종목 + NewsAPI 키 있으면 NewsAPI
        try {
          articles = await this.fetchNewsApi(allSymbols, holdingsSet, watchlistSet)
        } catch {
          articles = await this.fetchYfNews(allSymbols)
        }
      } else {
        articles = await this.fetchYfNews(allSymbols)
      }

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
