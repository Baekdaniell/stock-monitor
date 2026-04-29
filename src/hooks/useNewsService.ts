import { useEffect } from 'react'
import { newsService } from '../services/newsService'
import { useStore } from '../store'

export function useNewsService(): void {
  const symbolKey = useStore((s) =>
    [...new Set([
      ...s.holdings.map((h) => h.symbol),
      ...s.watchlist.map((w) => w.symbol),
    ])].sort().join(','),
  )

  useEffect(() => {
    newsService.start()
    return () => newsService.stop()
  }, [])

  // 심볼 목록이 변경되면 즉시 갱신
  useEffect(() => {
    if (symbolKey) void newsService.refreshAll()
  }, [symbolKey])
}
