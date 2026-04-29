import type { CSSProperties } from 'react'

// ── 기본 shimmer 블록 ─────────────────────────────────────────────────────────
export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${className}`}
      style={style}
    />
  )
}

// ── 차트 로딩 스켈레톤 ────────────────────────────────────────────────────────
export function ChartSkeleton({
  height = 300,
  compact = false,
}: {
  height?: number
  compact?: boolean
}) {
  const innerH = height - (compact ? 44 : 76)

  return (
    <div
      className={
        compact
          ? ''
          : 'rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4'
      }
    >
      {/* 컨트롤 행 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[48, 48, 56, 56].map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-md" style={{ width: w }} />
          ))}
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-14 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      </div>

      {/* Y축 레이블 + 차트 바디 */}
      <div className="flex gap-3">
        <div className="flex flex-col justify-between w-11 shrink-0">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-9" />
          ))}
        </div>
        <div className="flex-1 flex flex-col justify-end gap-2">
          <Skeleton className="w-full rounded-lg" style={{ height: innerH }} />
          {/* X축 레이블 */}
          <div className="flex justify-between">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 뉴스 카드 로딩 스켈레톤 ──────────────────────────────────────────────────
export function NewsCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex-1 space-y-2.5">
        {/* 제목 2줄 */}
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        {/* 출처 · 시각 */}
        <Skeleton className="h-3 w-44 rounded" />
        {/* 배지 행 */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-4 rounded shrink-0 mt-1" />
    </div>
  )
}

// ── 가격 인라인 스켈레톤 (WatchlistCard 내부) ─────────────────────────────────
export function PriceSkeleton() {
  return (
    <div className="flex items-center gap-2 mt-1">
      <Skeleton className="h-7 w-24 rounded" />
      <Skeleton className="h-5 w-16 rounded" />
    </div>
  )
}
