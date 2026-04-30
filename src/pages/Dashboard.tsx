import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Briefcase, Activity, Bell } from 'lucide-react'
import { useStore } from '../store'
import PriceChart from '../components/PriceChart'
import { formatMoney, formatTotal, formatChange } from '../lib/format'

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
    <div className="space-y-8">
      {/* ── 페이지 헤더 ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">실시간 포트폴리오 & 시장 현황</p>
      </div>

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="포트폴리오 가치"
          value={formatTotal(holdings.map((h) => h.symbol), totalValue)}
          icon={Briefcase}
        />
        <SummaryCard
          label="총 손익"
          value={`${totalPnl >= 0 ? '+' : '-'}${formatTotal(holdings.map((h) => h.symbol), Math.abs(totalPnl))}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%`}
          positive={totalPnl >= 0}
          icon={Activity}
        />
        <SummaryCard
          label="활성 알림"
          value={String(alerts.filter((a) => !a.triggered).length)}
          icon={Bell}
        />
      </div>

      {/* ── 차트 섹션 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>가격 차트</SectionTitle>

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
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700',
                    ].join(' ')}
                  >
                    {sym}
                    {p && (
                      <span className={displaySymbol === sym ? 'text-red-200' : isUp ? 'text-emerald-500' : 'text-red-500'}>
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
          <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800">
              <TrendingUp size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              포트폴리오 또는 관심종목에 종목을 추가하면 차트가 표시됩니다.
            </p>
          </div>
        )}
      </section>

      {/* ── 보유 종목 테이블 ── */}
      <section>
        <SectionTitle className="mb-3">보유 종목</SectionTitle>
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
                      <td className="px-4 py-2.5 font-semibold">
                        <div>{h.name || h.symbol}</div>
                        <div className="text-xs font-normal text-gray-400 dark:text-gray-500">{h.symbol}</div>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{h.shares}</td>
                      <td className="px-4 py-2.5 tabular-nums">{formatMoney(h.symbol, h.avgCost)}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium">{formatMoney(h.symbol, price)}</td>
                      <td className={`px-4 py-2.5 tabular-nums text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {up ? '+' : ''}{pct.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-2.5 tabular-nums font-medium ${pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {formatChange(h.symbol, pnl)}
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

// ── SectionTitle ──────────────────────────────────────────────────────────────
function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-1 h-5 rounded-full bg-red-600 shrink-0" />
      <h2 className="text-lg font-semibold">{children}</h2>
    </div>
  )
}

// ── SummaryCard ────────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
  icon?: React.ElementType
}) {
  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        {Icon && <Icon size={16} className="text-gray-300 dark:text-gray-700" />}
      </div>
      <p className={[
        'text-2xl font-bold tracking-tight',
        positive === undefined
          ? 'text-gray-900 dark:text-gray-100'
          : positive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-500',
      ].join(' ')}>
        {value}
      </p>
      {sub && <p className={[
        'text-xs font-medium mt-1.5',
        positive === undefined
          ? 'text-gray-400 dark:text-gray-500'
          : positive
            ? 'text-emerald-500'
            : 'text-red-400',
      ].join(' ')}>{sub}</p>}
    </div>
  )
}
