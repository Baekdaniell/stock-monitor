export function isKrw(symbol: string): boolean {
  return /\.(KS|KQ)$/.test(symbol)
}

export function formatMoney(symbol: string, amount: number): string {
  if (isKrw(symbol)) {
    return `${Math.round(amount).toLocaleString('ko-KR')}원`
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`
}

export function formatChange(symbol: string, change: number): string {
  const abs = Math.round(Math.abs(change))
  const sign = change >= 0 ? '+' : '-'
  if (isKrw(symbol)) return `${sign}${abs.toLocaleString('ko-KR')}원`
  return `${sign}$${abs.toLocaleString('en-US')}`
}

export function formatPnl(symbol: string, pnl: number, pct: number): string {
  const sign = pnl >= 0 ? '+' : '-'
  const abs = Math.abs(pnl)
  const money = isKrw(symbol)
    ? `${Math.round(abs).toLocaleString('ko-KR')}원`
    : `$${Math.round(abs).toLocaleString('en-US')}`
  return `${sign}${money} (${pnl >= 0 ? '+' : ''}${pct.toFixed(1)}%)`
}

/** 혼합 포트폴리오 합계용: 한국 종목 포함이면 원, 아니면 달러 */
export function formatTotal(symbols: string[], amount: number): string {
  const hasKrw = symbols.some(isKrw)
  if (hasKrw) return `${Math.round(amount).toLocaleString('ko-KR')}원`
  return `$${Math.round(amount).toLocaleString('en-US')}`
}
