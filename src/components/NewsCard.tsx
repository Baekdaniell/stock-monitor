import { ExternalLink } from 'lucide-react'
import type { NewsArticle, NewsSentiment, NewsType } from '../store/types'

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1)  return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7)     return `${days}일 전`
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const SENTIMENT_STYLES: Record<NewsSentiment, { label: string; cls: string }> = {
  positive: { label: '긍정', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  neutral:  { label: '중립', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  negative: { label: '부정', cls: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' },
}

const TYPE_STYLES: Record<NewsType, { label: string; cls: string }> = {
  news:     { label: '뉴스',      cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  earnings: { label: '실적',      cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  analyst:  { label: '애널리스트', cls: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
}

interface NewsCardProps {
  article: NewsArticle
}

export default function NewsCard({ article }: NewsCardProps) {
  const sentiment = SENTIMENT_STYLES[article.sentiment]
  const typeInfo  = TYPE_STYLES[article.type]

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <div className="min-w-0 flex-1 space-y-2">
        {/* 제목 */}
        <p className="font-medium leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
          {article.title}
        </p>

        {/* 출처 · 시각 */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">{article.source}</span>
          <span>·</span>
          <span>{formatRelativeTime(article.publishedAt)}</span>
        </div>

        {/* 배지 행 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 유형 배지 */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.cls}`}>
            {typeInfo.label}
          </span>

          {/* 감성 배지 */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentiment.cls}`}>
            {sentiment.label}
          </span>

          {/* 티커 배지 */}
          {article.relatedSymbols.map((sym) => (
            <span
              key={sym}
              className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 font-mono text-xs"
            >
              {sym}
            </span>
          ))}
        </div>
      </div>

      <ExternalLink
        size={15}
        className="shrink-0 mt-1 text-gray-400 group-hover:text-red-400 transition-colors"
      />
    </a>
  )
}
