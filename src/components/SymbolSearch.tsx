import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2, X } from 'lucide-react'

export interface StockResult {
  symbol: string
  name: string
}

interface Props {
  onSelect: (stock: StockResult) => void
  placeholder?: string
  className?: string
}

interface YFQuote {
  symbol: string
  shortname?: string
  longname?: string
  quoteType?: string
}

// ── 한국 주요 종목 사전 (한글 검색용) ──────────────────────────────────────────
const KR_STOCKS: (StockResult & { keywords: string })[] = [
  { symbol: '005930.KS', name: '삼성전자',        keywords: '삼성전자 samsung electronics' },
  { symbol: '000660.KS', name: 'SK하이닉스',      keywords: 'sk하이닉스 sk hynix 하이닉스' },
  { symbol: '207940.KS', name: '삼성바이오로직스', keywords: '삼성바이오 바이오로직스 samsung biologics' },
  { symbol: '005380.KS', name: '현대차',           keywords: '현대차 현대자동차 hyundai motor' },
  { symbol: '006400.KS', name: '삼성SDI',          keywords: '삼성sdi samsung sdi' },
  { symbol: '051910.KS', name: 'LG화학',           keywords: 'lg화학 lg chem' },
  { symbol: '035420.KS', name: 'NAVER',            keywords: 'naver 네이버' },
  { symbol: '000270.KS', name: '기아',             keywords: '기아 기아차 기아자동차 kia' },
  { symbol: '068270.KS', name: '셀트리온',         keywords: '셀트리온 celltrion' },
  { symbol: '028260.KS', name: '삼성물산',         keywords: '삼성물산 samsung ctec' },
  { symbol: '105560.KS', name: 'KB금융',           keywords: 'kb금융 kb financial' },
  { symbol: '055550.KS', name: '신한지주',         keywords: '신한 신한지주 shinhan financial' },
  { symbol: '035720.KS', name: '카카오',           keywords: '카카오 kakao' },
  { symbol: '003670.KS', name: '포스코퓨처엠',    keywords: '포스코퓨처엠 포스코 posco future' },
  { symbol: '005490.KS', name: 'POSCO홀딩스',     keywords: 'posco홀딩스 포스코홀딩스 posco holdings' },
  { symbol: '032830.KS', name: '삼성생명',         keywords: '삼성생명 samsung life' },
  { symbol: '086790.KS', name: '하나금융지주',     keywords: '하나금융 하나은행 hana financial' },
  { symbol: '066570.KS', name: 'LG전자',           keywords: 'lg전자 lg electronics' },
  { symbol: '003550.KS', name: 'LG',               keywords: 'lg그룹 lg holdings' },
  { symbol: '012330.KS', name: '현대모비스',       keywords: '현대모비스 hyundai mobis' },
  { symbol: '017670.KS', name: 'SK텔레콤',         keywords: 'sk텔레콤 skt sk telecom' },
  { symbol: '030200.KS', name: 'KT',               keywords: 'kt 케이티' },
  { symbol: '034730.KS', name: 'SK',               keywords: 'sk sk holdings' },
  { symbol: '009540.KS', name: 'HD한국조선해양',   keywords: 'hd한국조선해양 한국조선해양 hyundai heavy' },
  { symbol: '329180.KS', name: 'HD현대중공업',     keywords: 'hd현대중공업 현대중공업 hyundai heavy industries' },
  { symbol: '011200.KS', name: 'HMM',              keywords: 'hmm 현대상선' },
  { symbol: '003490.KS', name: '대한항공',         keywords: '대한항공 korean air' },
  { symbol: '033780.KS', name: 'KT&G',             keywords: 'kt&g ktg 케이티앤지' },
  { symbol: '010130.KS', name: '고려아연',         keywords: '고려아연 korea zinc' },
  { symbol: '096770.KS', name: 'SK이노베이션',    keywords: 'sk이노베이션 sk innovation' },
  { symbol: '011070.KS', name: 'LG이노텍',         keywords: 'lg이노텍 lg innotek' },
  { symbol: '018260.KS', name: '삼성에스디에스',   keywords: '삼성에스디에스 삼성sds samsung sds' },
  { symbol: '009150.KS', name: '삼성전기',         keywords: '삼성전기 samsung electro mechanics' },
  { symbol: '010950.KS', name: 'S-Oil',            keywords: 's-oil 에스오일' },
  { symbol: '024110.KS', name: '기업은행',         keywords: '기업은행 ibk industrial bank' },
  { symbol: '000100.KS', name: '유한양행',         keywords: '유한양행 yuhan' },
  { symbol: '035250.KS', name: '강원랜드',         keywords: '강원랜드 kangwon land' },
  { symbol: '009830.KS', name: '한화솔루션',       keywords: '한화솔루션 hanwha solutions' },
  { symbol: '000810.KS', name: '삼성화재',         keywords: '삼성화재 samsung fire marine' },
  { symbol: '005830.KS', name: 'DB손해보험',       keywords: 'db손해보험 db insurance' },
  { symbol: '251270.KS', name: '넷마블',           keywords: '넷마블 netmarble' },
  { symbol: '016360.KS', name: '삼성증권',         keywords: '삼성증권 samsung securities' },
  { symbol: '008770.KS', name: '호텔신라',         keywords: '호텔신라 hotel shilla' },
  { symbol: '004020.KS', name: '현대제철',         keywords: '현대제철 hyundai steel' },
  { symbol: '010140.KS', name: '삼성중공업',       keywords: '삼성중공업 samsung heavy industries' },
  { symbol: '000020.KS', name: '동화약품',         keywords: '동화약품 dongwha pharma' },
  { symbol: '020150.KS', name: '롯데케미칼',       keywords: '롯데케미칼 lotte chemical' },
  { symbol: '023530.KS', name: '롯데쇼핑',         keywords: '롯데쇼핑 롯데백화점 lotte shopping' },
  { symbol: '035900.KS', name: 'JYP Ent.',         keywords: 'jyp jyp엔터 엔터테인먼트' },
  { symbol: '041510.KS', name: 'SM엔터테인먼트',  keywords: 'sm엔터 sm sm entertainment' },
  { symbol: '352820.KS', name: '하이브',           keywords: '하이브 방탄소년단 bts hybe' },
  // KOSDAQ 주요 종목
  { symbol: '247540.KQ', name: '에코프로비엠',    keywords: '에코프로비엠 ecoprobm' },
  { symbol: '086520.KQ', name: '에코프로',         keywords: '에코프로 ecopro' },
  { symbol: '373220.KQ', name: 'LG에너지솔루션',  keywords: 'lg에너지솔루션 lg energy solution 배터리' },
  { symbol: '091990.KQ', name: '셀트리온헬스케어', keywords: '셀트리온헬스케어 celltrion healthcare' },
  { symbol: '196170.KQ', name: '알테오젠',         keywords: '알테오젠 alteogen' },
]

function isKorean(q: string) {
  return /[가-힣ᄀ-ᇿ㄰-㆏]/.test(q)
}

function searchKrStocks(q: string): StockResult[] {
  const lower = q.toLowerCase().replace(/\s/g, '')
  return KR_STOCKS.filter((s) =>
    s.keywords.replace(/\s/g, '').includes(lower) ||
    s.symbol.toLowerCase().includes(lower)
  ).slice(0, 8).map(({ symbol, name }) => ({ symbol, name }))
}

export default function SymbolSearch({ onSelect, placeholder = '종목 검색 (AAPL, 삼성전자, Apple...)', className }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<StockResult | null>(null)
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }

    // 한글 입력이면 로컬 사전 검색
    if (isKorean(q)) {
      const items = searchKrStocks(q)
      setResults(items)
      setOpen(items.length > 0)
      return
    }

    setLoading(true)
    try {
      const base = import.meta.env.VITE_API_BASE_URL as string | undefined
      const url = base
        ? `${base}/api/search?q=${encodeURIComponent(q)}`
        : `/api/yahoo/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { quotes?: YFQuote[] }
      const items: StockResult[] = (json.quotes ?? [])
        .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .slice(0, 8)
        .map((q) => ({ symbol: q.symbol, name: q.longname ?? q.shortname ?? q.symbol }))
      setResults(items)
      setOpen(items.length > 0)
    } catch {
      setResults([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selected) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search, selected])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (stock: StockResult) => {
    setSelected(stock)
    setQuery('')
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    onSelect(stock)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-sm">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">{selected.symbol}</span>
          <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{selected.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="선택 취소"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full"
          />
          {loading && (
            <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full min-w-[280px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <li
              key={r.symbol}
              onMouseDown={() => handleSelect(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={[
                'flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm transition-colors',
                i === activeIndex
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <span className="font-semibold tabular-nums w-20 shrink-0 text-xs">{r.symbol}</span>
              <span className="text-gray-500 dark:text-gray-400 truncate">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
