import { useEffect } from 'react'
import { priceService } from '../services/priceService'
import { useStore } from '../store'

/**
 * App 최상단에 한 번만 마운트.
 * - 마운트 시: 서비스 시작 (즉시 패치 + 10분 인터벌)
 * - 언마운트 시: 인터벌 정리
 * - holdings/watchlist 변경 시: 새 심볼 즉시 패치
 */
export function usePriceService(): void {
  // 심볼 목록이 바뀌었을 때만 리렌더링 유도 (직렬화로 안정적인 비교)
  const symbolKey = useStore((s) =>
    [...new Set([
      ...s.holdings.map((h) => h.symbol),
      ...s.watchlist.map((w) => w.symbol),
    ])].sort().join(','),
  )

  useEffect(() => {
    priceService.start()
    return () => priceService.stop()
  }, [])

  useEffect(() => {
    if (symbolKey) void priceService.refreshAll()
  }, [symbolKey])
}
