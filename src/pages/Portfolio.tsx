import { useState } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { Holding } from '../store/types'

const EMPTY_FORM: Omit<Holding, never> = { symbol: '', name: '', shares: 0, avgCost: 0 }

export default function Portfolio() {
  const holdings = useStore((s) => s.holdings)
  const addHolding = useStore((s) => s.addHolding)
  const removeHolding = useStore((s) => s.removeHolding)
  const prices = useStore((s) => s.prices)

  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!form.symbol || form.shares <= 0 || form.avgCost <= 0) return
    addHolding({ ...form, symbol: form.symbol.toUpperCase() })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">포트폴리오</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          종목 추가
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: 'symbol', label: '심볼', type: 'text', placeholder: 'AAPL' },
              { key: 'name', label: '회사명', type: 'text', placeholder: 'Apple Inc.' },
              { key: 'shares', label: '수량', type: 'number', placeholder: '10' },
              { key: 'avgCost', label: '평균단가 ($)', type: 'number', placeholder: '150.00' },
            ] as const
          ).map(({ key, label, type, placeholder }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">{label}</span>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as Record<string, string | number>)[key]}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                  }))
                }
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          ))}
          <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">취소</button>
            <button onClick={handleAdd} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">추가</button>
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
                {['심볼', '회사명', '수량', '평균단가', '현재가', '평가금액', '손익', ''].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {holdings.map((h) => {
                const price = prices[h.symbol]?.price ?? h.avgCost
                const value = price * h.shares
                const pnl = (price - h.avgCost) * h.shares
                const pnlPct = ((price - h.avgCost) / h.avgCost) * 100
                return (
                  <tr key={h.symbol} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-2 font-semibold">{h.symbol}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{h.name}</td>
                    <td className="px-4 py-2">{h.shares}</td>
                    <td className="px-4 py-2">${h.avgCost.toFixed(2)}</td>
                    <td className="px-4 py-2">${price.toFixed(2)}</td>
                    <td className="px-4 py-2">${value.toFixed(2)}</td>
                    <td className={`px-4 py-2 font-medium ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      <span className="ml-1 text-xs">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
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
