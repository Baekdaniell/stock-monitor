import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const PORT            = process.env.PORT            ?? 3001
const NEWS_API_KEY    = process.env.NEWS_API_KEY    ?? ''
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map(s => s.trim())

const app = express()

app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser requests (curl, server-to-server) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
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
