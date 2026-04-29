import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const PORT            = process.env.PORT            ?? 3001
const NEWS_API_KEY    = process.env.NEWS_API_KEY    ?? ''
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map(s => s.trim())

const app = express()

app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser requests, whitelisted origins, and Cloudtype preview domains
    if (!origin) return cb(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    if (/\.cloudtype\.app$/.test(origin)) return cb(null, true)
    cb(new Error(`CORS: origin "${origin}" not allowed`))
  },
}))

// ── GET /api/price?ticker=AAPL&interval=1h&range=5d ────────────────────────
app.get('/api/price', async (req, res) => {
  const { ticker, interval = '1h', range = '5d' } = req.query
  if (!ticker) return res.status(400).json({ error: 'ticker is required' })

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=${interval}&range=${range}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const body = await upstream.text()
    res.status(upstream.status).type('application/json').send(body)
  } catch (err) {
    console.error('[price]', err)
    res.status(502).json({ error: 'upstream fetch failed' })
  }
})

// ── GET /api/search?q=AAPL ────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'q is required' })

  const url =
    `https://query1.finance.yahoo.com/v1/finance/search` +
    `?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const body = await upstream.text()
    res.status(upstream.status).type('application/json').send(body)
  } catch (err) {
    console.error('[search]', err)
    res.status(502).json({ error: 'upstream fetch failed' })
  }
})

// ── RSS 파서 (Google News 전용) ────────────────────────────────────────────
function parseRssItems(xml) {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    const block = m[1]
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i')
      return (r.exec(block)?.[1] ?? '').trim()
    }
    const rawTitle = get('title')
    const title   = rawTitle.replace(/\s+-\s+[^-]+$/, '').trim() // "제목 - 출처" → "제목"
    const source  = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? '').trim()
              || rawTitle.match(/-\s+([^-]+)$/)?.[1]?.trim() || '뉴스'
    const link    = get('link')
    const pubDate = get('pubDate')
    if (title && link) items.push({ title, link, pubDate, source })
  }
  return items.slice(0, 30)
}

// ── GET /api/news-kr?q=삼성전자 주식 ──────────────────────────────────────
app.get('/api/news-kr', async (req, res) => {
  const { q = '코스피 코스닥 주식 증시' } = req.query
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml' },
    })
    const text = await upstream.text()
    res.json({ items: parseRssItems(text) })
  } catch (err) {
    console.error('[news-kr]', err)
    res.status(502).json({ error: 'upstream fetch failed' })
  }
})

// ── GET /api/news-yf?q=AAPL ───────────────────────────────────────────────
app.get('/api/news-yf', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'q is required' })

  const url =
    `https://query1.finance.yahoo.com/v1/finance/search` +
    `?q=${encodeURIComponent(q)}&newsCount=20&quotesCount=0&listsCount=0`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const body = await upstream.text()
    res.status(upstream.status).type('application/json').send(body)
  } catch (err) {
    console.error('[news-yf]', err)
    res.status(502).json({ error: 'upstream fetch failed' })
  }
})

// ── GET /api/news?q=...&sortBy=...&pageSize=...&language=... ───────────────
app.get('/api/news', async (req, res) => {
  if (!NEWS_API_KEY) return res.status(503).json({ error: 'NEWS_API_KEY not configured' })

  const { q = 'stock market', sortBy = 'publishedAt', pageSize = '20', language = 'en' } = req.query
  const params = new URLSearchParams({ q, sortBy, pageSize, language, apiKey: NEWS_API_KEY })
  const url = `https://newsapi.org/v2/everything?${params}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'stock-monitor-server/1.0' },
    })
    const body = await upstream.text()
    res.status(upstream.status).type('application/json').send(body)
  } catch (err) {
    console.error('[news]', err)
    res.status(502).json({ error: 'upstream fetch failed' })
  }
})

app.listen(PORT, () => {
  console.log(`stock-monitor server listening on http://localhost:${PORT}`)
})
