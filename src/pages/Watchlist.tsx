import { useState } from 'react'
import { PlusCircle, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useStore } from '../store'
import { formatMoney, formatChange } from '../lib/format'
import type { WatchItem } from '../store/types'
import PriceChart from '../components/PriceChart'
import { PriceSkeleton } from '../components/Skeleton'
import SymbolSearch from '../components/SymbolSearch'
import type { StockResult } from '../components/SymbolSearch'

// ── 52주 배지 계산 ──────────────────────────────────────────────────────────────
type Badge52w = { label: string; type: 'high' | 'low' }

function get52wBadges(price: number, high?: number, low?: number): Badge52w[] {
  const badges: Badge52w[] = []
  if (high && Math.abs(price - high) / high <= 0.03) {
    badges.push({ label: '52주 신고가 근접', type: 'high' })
  }
  if (low && low > 0 && Math.abs(price - low) / low <= 0.03) {
    badges.push({ label: '52주 신저가 근접', type: 'low' })
  }
  return badges
}

// ── WatchlistCard ───────────────────────────────────────────────────────────────
function WatchlistCard({ item, onRemove }: { item: WatchItem; onRemove: () => void }) {
  const price = useStore((s) => s.prices[item.symbol])
  const isUp   = (price?.changePercent ?? 0) >= 0
  const badges = price
    ? get52wBadges(price.price, price.week52High, price.week52Low)
    : []

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* 카드 헤더 */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* 티커 + 회사명 */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold tracking-tight">{item.symbol}</span>
            {item.name && (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.name}</span>
            )}
          </div>

          {/* 현재가 + 등락률 */}
          {price ? (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xl font-semibold tabular-nums">
                {formatMoney(item.symbol, price.price)}
              </span>
              <span className={[
                'flex items-center gap-0.5 text-sm font-medium tabular-nums',
                isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
              ].join(' ')}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {price.changePercent >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                <span className="text-xs opacity-75 ml-0.5">
                  ({formatChange(item.symbol, price.change)})
                </span>
              </span>
            </div>
          ) : (
            <PriceSkeleton />
          )}

          {/* 52주 배지 */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badges.map((b) => (
                <Badge52w key={b.type} badge={b} />
              ))}
            </div>
          )}
        </div>

        {/* 삭제 버튼 */}
        <button
          onClick={onRemove}
          aria-label={`${item.symbol} 삭제`}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-100 dark:border-gray-800 mx-4" />

      {/* 차트 영역 */}
      <div className="px-3 py-3">
        <PriceChart symbol={item.symbol} height={220} compact />
      </div>
    </div>
  )
}

// ── Badge52w ────────────────────────────────────────────────────────────────────
function Badge52w({ badge }: { badge: Badge52w }) {
  const isHigh = badge.type === 'high'
  return (
    <span className={[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
      isHigh
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
        : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400',
    ].join(' ')}>
      {isHigh ? '🔺' : '🔻'} {badge.label}
    </span>
  )
}

// ── AddForm ─────────────────────────────────────────────────────────────────────
function AddForm({ onClose }: { onClose: () => void }) {
  const addToWatchlist = useStore((s) => s.addToWatchlist)
  const watchlist      = useStore((s) => s.watchlist)
  const [selected, setSelected] = useState<StockResult | null>(null)
  const [error, setError] = useState('')

  const handleSelect = (stock: StockResult) => {
    setSelected(stock)
    setError('')
  }

  const handleAdd = () => {
    if (!selected) { setError('종목을 검색하여 선택해주세요'); return }
    if (watchlist.some((w) => w.symbol === selected.symbol)) {
      setError(`${selected.symbol}은 이미 관심종목에 있습니다`)
      return
    }
    addToWatchlist({ symbol: selected.symbol, name: selected.name, addedAt: new Date().toISOString() })
    onClose()
  }

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">관심종목 추가</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SymbolSearch
          onSelect={handleSelect}
          placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
          className="flex-1 min-w-52"
        />
        <button
          onClick={handleAdd}
          disabled={!selected}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          <PlusCircle size={15} />
          추가
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Watchlist Page ──────────────────────────────────────────────────────────────
export default function Watchlist() {
  const watchlist          = useStore((s) => s.watchlist)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">관심종목</h1>
          {watchlist.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {watchlist.length}개 종목
            </p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} />
            종목 추가
          </button>
        )}
      </div>

      {/* 추가 폼 */}
      {showForm && <AddForm onClose={() => setShowForm(false)} />}

      {/* 빈 상태 */}
      {watchlist.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <TrendingUp size={28} className="text-gray-400" />
          </div>
          <p className="font-medium text-gray-700 dark:text-gray-300">관심종목이 없습니다</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            종목을 추가하면 차트와 가격 정보를 한눈에 볼 수 있습니다.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <PlusCircle size={15} />
            첫 종목 추가하기
          </button>
        </div>
      )}

      {/* 카드 격자 */}
      {watchlist.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {watchlist.map((item) => (
            <WatchlistCard
              key={item.symbol}
              item={item}
              onRemove={() => removeFromWatchlist(item.symbol)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
