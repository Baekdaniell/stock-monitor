import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../store'
import PriceChart from '../components/PriceChart'

export default function Dashboard() {
  const holdings     = useStore((s) => s.holdings)
  const watchlist    = useStore((s) => s.watchlist)
  const prices       = useStore((s) => s.prices)
  const alerts       = useStore((s) => s.alerts)

  // 포트폴리오 합산
  const { totalValue, totalCost } = useMemo(() => ({
    totalValue: holdings.reduce((sum, h) => sum + (prices[h.symbol]?.price ?? h.avgCost) * h.shares, 0),
    totalCost:  holdings.reduce((sum, h) => sum + h.avgCost * h.shares, 0),
  }), [holdings, prices])

  const totalPnl    = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  // 차트에 표시할 심볼 목록 (보유 + 관심)
  const chartSymbols = useMemo(() => [
    ...new Set([
      ...holdings.map((h) => h.symbol),
      ...watchlist.map((w) => w.symbol),
    ]),
  ], [holdings, watchlist])

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const displaySymbol = selectedSymbol ?? chartSymbols[0] ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="포트폴리오 가치"
          value={`$${totalValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <SummaryCard
          label="총 손익"
          value={`${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
          positive={totalPnl >= 0}
        />
        <SummaryCard
          label="활성 알림"
          value={String(alerts.filter((a) => !a.triggered).length)}
        />
      </div>

      {/* ── 차트 섹션 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">가격 차트</h2>

          {/* 심볼 셀렉터 */}
          {chartSymbols.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {chartSymbols.map((sym) => {
                const p = prices[sym]
                const isUp = (p?.changePercent ?? 0) >= 0
                return (
                  <button
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                      displaySymbol === sym
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700',
                    ].join(' ')}
                  >
                    {sym}
                    {p && (
                      <span className={displaySymbol === sym ? 'text-indigo-200' : isUp ? 'text-emerald-500' : 'text-red-500'}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {displaySymbol ? (
          <PriceChart symbol={displaySymbol} />
        ) : (
          <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-400">
              포트폴리오 또는 관심종목에 종목을 추가하면 차트가 표시됩니다.
            </p>
          </div>
        )}
      </section>

      {/* ── 보유 종목 테이블 ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">보유 종목</h2>
        {holdings.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            보유 종목이 없습니다. 포트폴리오에서 추가해보세요.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                <tr>
                  {['종목', '수량', '평균단가', '현재가', '등락률', '손익'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {holdings.map((h) => {
                  const pd   = prices[h.symbol]
                  const price = pd?.price ?? h.avgCost
                  const pnl  = (price - h.avgCost) * h.shares
                  const pct  = pd?.changePercent ?? 0
                  const up   = pct >= 0
                  return (
                    <tr
                      key={h.symbol}
                      className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-colors"
                      onClick={() => setSelectedSymbol(h.symbol)}
                    >
                      <td className="px-4 py-2.5 font-semibold">{h.symbol}</td>
                      <td className="px-4 py-2.5 tabular-nums">{h.shares}</td>
                      <td className="px-4 py-2.5 tabular-nums">${h.avgCost.toFixed(2)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium">${price.toFixed(2)}</td>
                      <td className={`px-4 py-2.5 tabular-nums text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {up ? '+' : ''}{pct.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-2.5 tabular-nums font-medium ${pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ── SummaryCard ────────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={[
        'text-xl font-bold',
        positive === undefined
          ? 'text-gray-900 dark:text-gray-100'
          : positive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-500',
      ].join(' ')}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}
