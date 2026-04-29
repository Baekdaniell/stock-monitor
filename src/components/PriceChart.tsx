import { useMemo, useState } from 'react'
import { ChartSkeleton } from './Skeleton'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useStore } from '../store'

// ── 타입 ──────────────────────────────────────────────────────────────────────
type Period = '1D' | '5D' | '1M' | '3M'

interface ChartPoint {
  time: number
  label: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePct: number
  ma5: number | null
  ma20: number | null
}

// ── 날짜 포맷 헬퍼 ────────────────────────────────────────────────────────────
function fmtLabel(unix: number, period: Period): string {
  const d = new Date(unix * 1000)
  if (period === '1D') {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  if (period === '5D') {
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}시`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── 이동평균 계산 ──────────────────────────────────────────────────────────────
function calcMA(closes: number[], index: number, window: number): number | null {
  if (index < window - 1) return null
  const slice = closes.slice(index - window + 1, index + 1)
  return slice.reduce((a, b) => a + b, 0) / window
}

// ── 기간별 캔들 필터 ──────────────────────────────────────────────────────────
const PERIOD_SECONDS: Record<Period, number> = {
  '1D': 1 * 24 * 3600,
  '5D': 5 * 24 * 3600,
  '1M': 30 * 24 * 3600,
  '3M': 90 * 24 * 3600,
}

// ── 커스텀 툴팁 ───────────────────────────────────────────────────────────────
interface TooltipEntry {
  dataKey?: string
  value?: number
  payload?: ChartPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ChartPoint

  const ma5  = payload.find((p) => p.dataKey === 'ma5')
  const ma20 = payload.find((p) => p.dataKey === 'ma20')

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg p-3 text-xs min-w-[160px]">
      <p className="text-gray-400 dark:text-gray-500 mb-2 font-medium">{d.label}</p>

      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">종가</span>
          <span className="font-semibold tabular-nums">${d.close.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">등락</span>
          <span className={`font-medium tabular-nums ${d.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {d.change >= 0 ? '+' : ''}{d.change.toFixed(2)}
            <span className="ml-1 text-[10px]">({d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(2)}%)</span>
          </span>
        </div>
        <div className="flex justify-between gap-4 text-gray-400 dark:text-gray-500">
          <span>고/저</span>
          <span className="tabular-nums">{d.high.toFixed(2)} / {d.low.toFixed(2)}</span>
        </div>
      </div>

      {(ma5 || ma20) && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {ma5?.value != null && (
            <div className="flex justify-between gap-4">
              <span className="text-amber-500">MA5</span>
              <span className="tabular-nums">${(ma5.value as number).toFixed(2)}</span>
            </div>
          )}
          {ma20?.value != null && (
            <div className="flex justify-between gap-4">
              <span className="text-emerald-500">MA20</span>
              <span className="tabular-nums">${(ma20.value as number).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── PriceChart ─────────────────────────────────────────────────────────────────
interface Props {
  symbol: string
  /** 차트 높이 (px). 기본값 300 */
  height?: number
  /** 기간 토글·MA 토글을 숨기는 미니 모드 */
  compact?: boolean
}

const PERIODS: Period[] = ['1D', '5D', '1M', '3M']
const PERIOD_LABELS: Record<Period, string> = { '1D': '1일', '5D': '5일', '1M': '1개월', '3M': '3개월' }

export default function PriceChart({ symbol, height = 300, compact = false }: Props) {
  const candleSet = useStore((s) => s.candles[symbol])
  const [period, setPeriod]     = useState<Period>('1M')
  const [showMA5, setShowMA5]   = useState(true)
  const [showMA20, setShowMA20] = useState(true)

  // 기간에 따라 intraday(1h) 또는 daily(1d) 선택
  const rawCandles = useMemo(() => {
    if (!candleSet) return []
    return period === '1D' || period === '5D'
      ? candleSet.intraday
      : candleSet.daily
  }, [candleSet, period])

  // 기간 필터 적용
  const filtered = useMemo(() => {
    if (rawCandles.length === 0) return []
    const cutoff = Date.now() / 1000 - PERIOD_SECONDS[period]
    const result = rawCandles.filter((c) => c.time >= cutoff)
    // 데이터가 너무 적으면 전체 반환 (기간 내 데이터 부족 방어)
    return result.length >= 2 ? result : rawCandles.slice(-10)
  }, [rawCandles, period])

  // ChartPoint 배열 계산 (MA 포함)
  const data = useMemo<ChartPoint[]>(() => {
    const closes = filtered.map((c) => c.close)
    return filtered.map((c, i) => {
      const prev = i > 0 ? filtered[i - 1].close : c.close
      return {
        ...c,
        label: fmtLabel(c.time, period),
        change: c.close - prev,
        changePct: prev > 0 ? ((c.close - prev) / prev) * 100 : 0,
        ma5:  calcMA(closes, i, 5),
        ma20: calcMA(closes, i, 20),
      }
    })
  }, [filtered, period])

  // Y축 도메인 — 가격 + MA 전체 범위에 10% 패딩
  const yDomain = useMemo<[number, number]>(() => {
    if (data.length === 0) return [0, 1]
    const vals = [
      ...data.map((d) => d.close),
      ...(showMA5  ? data.filter((d) => d.ma5  !== null).map((d) => d.ma5!)  : []),
      ...(showMA20 ? data.filter((d) => d.ma20 !== null).map((d) => d.ma20!) : []),
    ]
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.1 || max * 0.02
    return [min - pad, max + pad]
  }, [data, showMA5, showMA20])

  // loadingHeight 는 스켈레톤이 사용하므로 제거
  // X축 틱 수 — 데이터 포인트가 많으면 듬성듬성
  const xTickCount = Math.min(6, data.length)
  const xTickIndices = useMemo(() => {
    if (data.length <= xTickCount) return data.map((_, i) => i)
    const step = Math.floor(data.length / (xTickCount - 1))
    const result = Array.from({ length: xTickCount - 1 }, (_, i) => i * step)
    result.push(data.length - 1)
    return result
  }, [data.length, xTickCount])

  const xTicks = xTickIndices.map((i) => data[i]?.label).filter(Boolean)

  // 차트 색상 (첫 vs 마지막 가격 기준)
  const isPositive = data.length >= 2
    ? data[data.length - 1].close >= data[0].close
    : true
  const lineColor  = isPositive ? '#6366f1' : '#ef4444'
  const gradientId = `grad-${symbol}`

  if (!candleSet) {
    return <ChartSkeleton height={height} compact={compact} />
  }

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        style={{ height: Math.min(height, 180) }}
      >
        <p className="text-sm text-gray-400">해당 기간의 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4'}>
      {/* 헤더 — 기간 토글 + MA 토글 */}
      <div className={['flex flex-wrap items-center justify-between gap-2', compact ? 'mb-2' : 'mb-4'].join(' ')}>
        {/* 기간 선택 */}
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'rounded-md font-medium transition-colors',
                compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
                period === p
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* MA 토글 */}
        <div className="flex gap-1.5">
          <MAToggle label="MA5" color="text-amber-500" active={showMA5} compact={compact} onToggle={() => setShowMA5((v) => !v)} />
          <MAToggle label="MA20" color="text-emerald-500" active={showMA20} compact={compact} onToggle={() => setShowMA20((v) => !v)} />
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={lineColor} stopOpacity={0.18} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            ticks={xTicks}
            tick={{ fontSize: 11, fill: 'currentColor', className: 'text-gray-400 dark:text-gray-500' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11, fill: 'currentColor', className: 'text-gray-400 dark:text-gray-500' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={52}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '4 2' }}
          />

          {/* 종가 Area */}
          <Area
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
            isAnimationActive={false}
          />

          {/* MA5 */}
          {showMA5 && (
            <Line
              type="monotone"
              dataKey="ma5"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}

          {/* MA20 */}
          {showMA20 && (
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── MAToggle ───────────────────────────────────────────────────────────────────
function MAToggle({
  label,
  color,
  active,
  compact = false,
  onToggle,
}: {
  label: string
  color: string
  active: boolean
  compact?: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        'flex items-center gap-1 rounded-lg font-medium border transition-colors',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        active
          ? `border-current ${color} bg-current/5`
          : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600',
      ].join(' ')}
    >
      <span className={`w-2.5 h-0.5 rounded-full ${active ? 'bg-current' : 'bg-gray-300 dark:bg-gray-700'}`} />
      {label}
    </button>
  )
}
