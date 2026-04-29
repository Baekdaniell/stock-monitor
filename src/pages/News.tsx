import { useMemo, useState } from 'react'
import { useStore } from '../store'
import NewsCard from '../components/NewsCard'
import { NewsCardSkeleton } from '../components/Skeleton'
import type { NewsType } from '../store/types'

type GroupFilter = 'all' | 'holding' | 'watchlist'
type TypeFilter  = 'all' | NewsType

const GROUP_OPTIONS: { value: GroupFilter; label: string }[] = [
  { value: 'all',       label: '전체' },
  { value: 'holding',   label: '보유 종목' },
  { value: 'watchlist', label: '관심 종목' },
]

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all',      label: '전체 유형' },
  { value: 'news',     label: '뉴스' },
  { value: 'earnings', label: '실적' },
  { value: 'analyst',  label: '애널리스트' },
]

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function News() {
  const news        = useStore((s) => s.news)
  const newsLoading = useStore((s) => s.newsLoading)
  const holdings    = useStore((s) => s.holdings)
  const watchlist   = useStore((s) => s.watchlist)

  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>('all')

  const holdingsSet  = useMemo(() => new Set(holdings.map((h) => h.symbol)),  [holdings])
  const watchlistSet = useMemo(() => new Set(watchlist.map((w) => w.symbol)), [watchlist])

  const filtered = useMemo(() => {
    return news.filter((article) => {
      if (groupFilter === 'holding'   && !article.relatedSymbols.some((s) => holdingsSet.has(s)))  return false
      if (groupFilter === 'watchlist' && !article.relatedSymbols.some((s) => watchlistSet.has(s))) return false
      if (typeFilter !== 'all' && article.type !== typeFilter) return false
      return true
    })
  }, [news, groupFilter, typeFilter, holdingsSet, watchlistSet])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">뉴스 · 이슈</h1>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <FilterGroup options={GROUP_OPTIONS} value={groupFilter} onChange={setGroupFilter} />
        <FilterGroup options={TYPE_OPTIONS}  value={typeFilter}  onChange={setTypeFilter}  />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length}개 기사</p>

      {/* 로딩 스켈레톤 */}
      {newsLoading && news.length === 0 && (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      )}

      {/* 빈 상태 */}
      {!newsLoading && filtered.length === 0 && (
        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-400 text-center px-4">
            {news.length === 0
              ? '설정 페이지에서 NewsAPI 키를 입력하면 뉴스가 표시됩니다.'
              : '해당 조건에 맞는 기사가 없습니다.'}
          </p>
        </div>
      )}

      {/* 기사 목록 */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
