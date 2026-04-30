import { supabase } from './supabase'
import type { Holding, WatchItem } from '../store/types'

// ── 타입 변환 헬퍼 ─────────────────────────────────────────────────────────────
type HoldingRow = {
  symbol: string
  name: string
  shares: number
  avg_cost: number
  buy_date: string | null
}

type WatchRow = {
  symbol: string
  name: string
  added_at: string
}

function toHolding(row: HoldingRow): Holding {
  return {
    symbol:  row.symbol,
    name:    row.name,
    shares:  row.shares,
    avgCost: row.avg_cost,
    buyDate: row.buy_date ?? undefined,
  }
}

function toWatchItem(row: WatchRow): WatchItem {
  return {
    symbol:  row.symbol,
    name:    row.name,
    addedAt: row.added_at,
  }
}

// ── DB 연결 진단 (개발/디버그용) ────────────────────────────────────────────────
export async function diagnoseDatabaseConnection(): Promise<void> {
  const { error } = await supabase.from('holdings').select('user_id').limit(1)
  if (error) {
    console.error('[DB 진단] holdings 테이블 접근 실패:', error.message, error.hint ?? '')
    if (error.message.includes('does not exist')) {
      console.error('[DB 진단] schema.sql을 Supabase SQL 에디터에서 실행하지 않았을 수 있습니다.')
    }
  } else {
    console.info('[DB 진단] Supabase holdings 테이블 연결 정상')
  }
}

// ── Holdings ──────────────────────────────────────────────────────────────────
export async function fetchHoldings(userId: string): Promise<Holding[]> {
  const { data, error } = await supabase
    .from('holdings')
    .select('symbol, name, shares, avg_cost, buy_date')
    .eq('user_id', userId)
    .order('symbol')
  if (error) throw error
  return (data as HoldingRow[]).map(toHolding)
}

export async function upsertHolding(userId: string, h: Holding): Promise<void> {
  const { error } = await supabase.from('holdings').upsert(
    {
      user_id:  userId,
      symbol:   h.symbol,
      name:     h.name,
      shares:   h.shares,
      avg_cost: h.avgCost,
      buy_date: h.buyDate ?? null,
    },
    { onConflict: 'user_id,symbol' },
  )
  if (error) throw error
}

export async function deleteHolding(userId: string, symbol: string): Promise<void> {
  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol)
  if (error) throw error
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
export async function fetchWatchlist(userId: string): Promise<WatchItem[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('symbol, name, added_at')
    .eq('user_id', userId)
    .order('added_at')
  if (error) throw error
  return (data as WatchRow[]).map(toWatchItem)
}

export async function upsertWatchItem(userId: string, item: WatchItem): Promise<void> {
  const { error } = await supabase.from('watchlist').upsert(
    {
      user_id:  userId,
      symbol:   item.symbol,
      name:     item.name,
      added_at: item.addedAt,
    },
    { onConflict: 'user_id,symbol' },
  )
  if (error) throw error
}

export async function deleteWatchItem(userId: string, symbol: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol)
  if (error) throw error
}
