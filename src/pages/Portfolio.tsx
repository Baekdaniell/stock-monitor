import { useState } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { Holding } from '../store/types'
import SymbolSearch from '../components/SymbolSearch'
import type { StockResult } from '../components/SymbolSearch'
import { isKrw, formatMoney, formatPnl } from '../lib/format'

const EMPTY_FORM: Holding = { symbol: '', name: '', shares: 0, avgCost: 0 }

export default function Portfolio() {
  const holdings = useStore((s) => s.holdings)
  const addHolding = useStore((s) => s.addHolding)
  const removeHolding = useStore((s) => s.removeHolding)
  const prices = useStore((s) => s.prices)

  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  const handleSelectStock = (stock: StockResult) => {
    setForm((f) => ({ ...f, symbol: stock.symbol, name: stock.name }))
  }

  const handleAdd = () => {
    if (!form.symbol || form.shares <= 0 || form.avgCost <= 0) return
    addHolding({ ...form })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleCancel = () => {
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const currencyLabel = form.symbol ? (isKrw(form.symbol) ? '₩' : '$') : '₩/$'
  const avgCostPlaceholder = form.symbol ? (isKrw(form.symbol) ? '70,000' : '150') : '금액 입력'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-2xl font-bold tracking-tight">포트폴리오</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">보유 종목 현황 및 수익률</p>
      </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          종목 추가
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">종목 검색</span>
            <SymbolSearch
              onSelect={handleSelectStock}
              placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">수량 (주)</span>
              <input
                type="number"
                placeholder="10"
                value={form.shares === 0 ? '' : form.shares}
                onChange={(e) => setForm((f) => ({ ...f, shares: Number(e.target.value) }))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">평균단가 ({currencyLabel})</span>
              <input
                type="number"
                placeholder={avgCostPlaceholder}
                value={form.avgCost === 0 ? '' : form.avgCost}
                onChange={(e) => setForm((f) => ({ ...f, avgCost: Number(e.target.value) }))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">취소</button>
            <button
              onClick={handleAdd}
              disabled={!form.symbol || form.shares <= 0 || form.avgCost <= 0}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {holdings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">보유 종목이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              <tr>
                {['종목', '수량', '평균단가', '현재가', '평가금액', '손익', ''].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {holdings.map((h) => {
                const price = prices[h.symbol]?.price ?? h.avgCost
                const value = price * h.shares
                const pnl   = (price - h.avgCost) * h.shares
                const pnlPct = ((price - h.avgCost) / h.avgCost) * 100
                return (
                  <tr key={h.symbol} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-2 font-semibold whitespace-nowrap">
                      <div>{h.name || h.symbol}</div>
                      <div className="text-xs font-normal text-gray-400 dark:text-gray-500">{h.symbol}</div>
                    </td>
                    <td className="px-4 py-2 tabular-nums">{h.shares.toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">{formatMoney(h.symbol, h.avgCost)}</td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">{formatMoney(h.symbol, price)}</td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">{formatMoney(h.symbol, value)}</td>
                    <td className={`px-4 py-2 font-medium whitespace-nowrap tabular-nums ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {formatPnl(h.symbol, pnl, pnlPct)}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => removeHolding(h.symbol)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
