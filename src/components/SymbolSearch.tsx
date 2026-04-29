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

export default function SymbolSearch({ onSelect, placeholder = '종목 검색 (AAPL, Apple...)', className }: Props) {
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
              <span className="font-semibold tabular-nums w-16 shrink-0">{r.symbol}</span>
              <span className="text-gray-500 dark:text-gray-400 truncate">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
