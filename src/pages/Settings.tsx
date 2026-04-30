import { useState } from 'react'
import {
  Moon, Sun, Download, Bell, Plus, Pencil,
  Trash2, X, Check, KeyRound,
} from 'lucide-react'
import { useStore } from '../store'
import { useDarkMode } from '../hooks/useDarkMode'
import type { AlertType, Holding } from '../store/types'

// ── 공통 스타일 ──────────────────────────────────────────────────────────────
const INPUT =
  'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ' +
  'px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 ' +
  'dark:text-gray-100 placeholder:text-gray-400'

const BTN_PRIMARY =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 ' +
  'hover:bg-red-700 text-white text-sm font-medium transition-colors'

const BTN_SECONDARY =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border ' +
  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ' +
  'text-gray-600 dark:text-gray-400 text-sm font-medium ' +
  'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'

const BTN_ICON =
  'p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ' +
  'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'

// ── Section 래퍼 ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-100 dark:border-gray-800">
        {title}
      </h2>
      {children}
    </section>
  )
}

// ── 1. 보유 종목 관리 ────────────────────────────────────────────────────────
interface HoldingForm {
  symbol: string
  name: string
  shares: string
  avgCost: string
  buyDate: string
}
const EMPTY_FORM: HoldingForm = { symbol: '', name: '', shares: '', avgCost: '', buyDate: '' }

function HoldingsSection() {
  const holdings      = useStore((s) => s.holdings)
  const prices        = useStore((s) => s.prices)
  const addHolding    = useStore((s) => s.addHolding)
  const updateHolding = useStore((s) => s.updateHolding)
  const removeHolding = useStore((s) => s.removeHolding)

  const [form, setForm]       = useState<HoldingForm>(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  function field(key: keyof HoldingForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    }
  }

  function startAdd() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowForm(true)
  }

  function startEdit(h: Holding) {
    setForm({
      symbol:  h.symbol,
      name:    h.name,
      shares:  String(h.shares),
      avgCost: String(h.avgCost),
      buyDate: h.buyDate ?? '',
    })
    setEditing(h.symbol)
    setShowForm(true)
  }

  function cancel() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowForm(false)
  }

  function submit() {
    const symbol  = form.symbol.toUpperCase().trim()
    const name    = form.name.trim() || symbol
    const shares  = parseFloat(form.shares)
    const avgCost = parseFloat(form.avgCost)
    if (!symbol || !(shares > 0) || !(avgCost > 0)) return

    if (editing) {
      updateHolding(editing, { name, shares, avgCost, buyDate: form.buyDate || undefined })
    } else {
      addHolding({ symbol, name, shares, avgCost, buyDate: form.buyDate || undefined })
    }
    cancel()
  }

  const isValid =
    form.symbol.trim() &&
    parseFloat(form.shares) > 0 &&
    parseFloat(form.avgCost) > 0

  return (
    <Section title="보유 종목 관리">
      {holdings.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                {['티커', '종목명', '수량', '평균단가', '현재가', '손익', '매수일', ''].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {holdings.map((h) => {
                const price = prices[h.symbol]?.price ?? h.avgCost
                const pnl   = (price - h.avgCost) * h.shares
                const up    = pnl >= 0
                return (
                  <tr key={h.symbol} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <td className="px-4 py-2.5 font-mono font-semibold">{h.symbol}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{h.name}</td>
                    <td className="px-4 py-2.5 tabular-nums">{h.shares}</td>
                    <td className="px-4 py-2.5 tabular-nums">${h.avgCost.toFixed(2)}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium">${price.toFixed(2)}</td>
                    <td className={`px-4 py-2.5 tabular-nums text-xs font-semibold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {up ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{h.buyDate ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => startEdit(h)}
                          className={BTN_ICON}
                          title="수정"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => removeHolding(h.symbol)}
                          className={`${BTN_ICON} hover:!text-red-500`}
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {editing ? `${editing} 수정` : '종목 추가'}
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              {...field('symbol')}
              disabled={!!editing}
              placeholder="티커 (AAPL)"
              className={`${INPUT} w-28 font-mono uppercase ${editing ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <input
              {...field('name')}
              placeholder="종목명 (Apple Inc.)"
              className={`${INPUT} flex-1 min-w-40`}
            />
            <input
              {...field('shares')}
              type="number"
              min="0"
              step="any"
              placeholder="수량"
              className={`${INPUT} w-24`}
            />
            <input
              {...field('avgCost')}
              type="number"
              min="0"
              step="any"
              placeholder="평균단가 ($)"
              className={`${INPUT} w-32`}
            />
            <input
              {...field('buyDate')}
              type="date"
              className={`${INPUT} w-40`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!isValid}
              className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {editing ? <><Check size={14} />수정</> : <><Plus size={14} />추가</>}
            </button>
            <button onClick={cancel} className={BTN_SECONDARY}>
              <X size={14} />취소
            </button>
          </div>
        </div>
      ) : (
        <button onClick={startAdd} className={BTN_SECONDARY}>
          <Plus size={14} />종목 추가
        </button>
      )}

      {holdings.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">보유 종목이 없습니다. 종목을 추가해보세요.</p>
      )}
    </Section>
  )
}

// ── 2. 관심 종목 관리 ────────────────────────────────────────────────────────
function WatchlistSection() {
  const watchlist           = useStore((s) => s.watchlist)
  const alerts              = useStore((s) => s.alerts)
  const addToWatchlist      = useStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const addAlert            = useStore((s) => s.addAlert)
  const removeAlert         = useStore((s) => s.removeAlert)

  const [showForm, setShowForm]     = useState(false)
  const [wForm, setWForm]           = useState({ symbol: '', name: '' })
  const [alertTarget, setAlertTarget] = useState<string | null>(null)
  const [alertForm, setAlertForm]   = useState<{ type: AlertType; targetPrice: string }>({
    type: 'above', targetPrice: '',
  })

  function addItem() {
    const symbol = wForm.symbol.toUpperCase().trim()
    const name   = wForm.name.trim() || symbol
    if (!symbol) return
    addToWatchlist({ symbol, name, addedAt: new Date().toISOString() })
    setWForm({ symbol: '', name: '' })
    setShowForm(false)
  }

  function toggleAlertForm(symbol: string) {
    if (alertTarget === symbol) {
      setAlertTarget(null)
    } else {
      setAlertTarget(symbol)
      setAlertForm({ type: 'above', targetPrice: '' })
    }
  }

  function submitAlert(symbol: string) {
    const price = parseFloat(alertForm.targetPrice)
    if (!(price > 0)) return
    addAlert(symbol, alertForm.type, price)
    setAlertTarget(null)
    setAlertForm({ type: 'above', targetPrice: '' })
  }

  return (
    <Section title="관심 종목 관리">
      {watchlist.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">관심 종목이 없습니다.</p>
      )}

      {watchlist.length > 0 && (
        <ul className="space-y-2">
          {watchlist.map((item) => {
            const itemAlerts = alerts.filter(
              (a) => a.symbol === item.symbol && !a.triggered,
            )
            const isAlertOpen = alertTarget === item.symbol

            return (
              <li key={item.symbol} className="space-y-1">
                {/* 종목 행 */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-sm">{item.symbol}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.name}</span>
                    {itemAlerts.length > 0 && (
                      <span className="shrink-0 text-xs text-red-500 dark:text-red-400">
                        알림 {itemAlerts.length}개
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => toggleAlertForm(item.symbol)}
                      title="알림 설정"
                      className={`${BTN_ICON} ${isAlertOpen ? 'text-red-500 bg-red-50 dark:bg-red-950/40' : ''}`}
                    >
                      <Bell size={14} />
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(item.symbol)}
                      title="삭제"
                      className={`${BTN_ICON} hover:!text-red-500`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 인라인 알림 폼 */}
                {isAlertOpen && (
                  <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 space-y-2.5">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {item.symbol} 가격 알림
                    </p>

                    {/* 기존 알림 목록 */}
                    {itemAlerts.length > 0 && (
                      <ul className="space-y-1">
                        {itemAlerts.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between text-xs text-red-700 dark:text-red-300"
                          >
                            <span>
                              ${a.targetPrice.toLocaleString()} {a.type === 'above' ? '이상' : '이하'}
                            </span>
                            <button
                              onClick={() => removeAlert(a.id)}
                              className="ml-2 hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 알림 추가 폼 */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={alertForm.type}
                        onChange={(e) =>
                          setAlertForm((f) => ({ ...f, type: e.target.value as AlertType }))
                        }
                        className={INPUT}
                      >
                        <option value="above">이상 도달 시</option>
                        <option value="below">이하 도달 시</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="목표가 ($)"
                        value={alertForm.targetPrice}
                        onChange={(e) =>
                          setAlertForm((f) => ({ ...f, targetPrice: e.target.value }))
                        }
                        className={`${INPUT} w-32`}
                      />
                      <button
                        onClick={() => submitAlert(item.symbol)}
                        disabled={!(parseFloat(alertForm.targetPrice) > 0)}
                        className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <Plus size={14} />알림 추가
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* 관심 종목 추가 폼 */}
      {showForm ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={wForm.symbol}
              onChange={(e) => setWForm((f) => ({ ...f, symbol: e.target.value }))}
              placeholder="티커 (TSLA)"
              className={`${INPUT} w-28 font-mono uppercase`}
            />
            <input
              value={wForm.name}
              onChange={(e) => setWForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="종목명 (Tesla, Inc.)"
              className={`${INPUT} flex-1 min-w-40`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addItem}
              disabled={!wForm.symbol.trim()}
              className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Plus size={14} />추가
            </button>
            <button
              onClick={() => { setShowForm(false); setWForm({ symbol: '', name: '' }) }}
              className={BTN_SECONDARY}
            >
              <X size={14} />취소
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className={BTN_SECONDARY}>
          <Plus size={14} />관심 종목 추가
        </button>
      )}
    </Section>
  )
}

// ── 3. 브라우저 알림 권한 ────────────────────────────────────────────────────
function NotificationSection() {
  const supported = 'Notification' in window
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  )

  async function requestPermission() {
    if (!supported) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      new Notification('Antark', {
        body: '가격 알림이 활성화되었습니다.',
        icon: '/favicon.ico',
      })
    }
  }

  const STATUS = {
    granted: { label: '허용됨', cls: 'text-emerald-600 dark:text-emerald-400' },
    denied:  { label: '거부됨', cls: 'text-red-500' },
    default: { label: '미설정', cls: 'text-gray-500 dark:text-gray-400' },
  } as const

  const status = STATUS[permission]

  return (
    <Section title="가격 알림 권한">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={requestPermission}
          disabled={!supported || permission === 'granted'}
          className={`${BTN_SECONDARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {permission === 'granted' ? (
            <><Bell size={14} />알림 허용됨</>
          ) : (
            <><Bell size={14} />브라우저 알림 허용 요청</>
          )}
        </button>
        <span className={`text-sm font-medium ${status.cls}`}>{status.label}</span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {!supported
          ? '이 브라우저는 알림을 지원하지 않습니다.'
          : '가격이 설정한 목표가에 도달하면 브라우저 알림으로 알려줍니다.'}
      </p>
    </Section>
  )
}

// ── 4. NewsAPI 키 ────────────────────────────────────────────────────────────
function ApiKeySection() {
  const [key, setKey]     = useState(() => localStorage.getItem('newsapi_key') ?? '')
  const [saved, setSaved] = useState(false)

  function save() {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem('newsapi_key', trimmed)
    } else {
      localStorage.removeItem('newsapi_key')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="API 설정">
      <div className="space-y-1.5 max-w-lg">
        <label className="block text-xs text-gray-500 dark:text-gray-400">
          NewsAPI 키 —{' '}
          <a
            href="https://newsapi.org/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 hover:underline"
          >
            newsapi.org 에서 무료 발급
          </a>
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false) }}
            placeholder="API 키를 입력하세요"
            className={`${INPUT} flex-1 font-mono`}
          />
          <button onClick={save} className={saved ? BTN_PRIMARY : BTN_SECONDARY}>
            {saved ? <><Check size={14} />저장됨</> : <><KeyRound size={14} />저장</>}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          입력한 키는 브라우저 localStorage에만 저장되며 외부로 전송되지 않습니다.
        </p>
      </div>
    </Section>
  )
}

// ── 5. CSV 내보내기 ──────────────────────────────────────────────────────────
function ExportSection() {
  const holdings = useStore((s) => s.holdings)
  const prices   = useStore((s) => s.prices)

  function downloadCSV() {
    const header = ['심볼', '종목명', '수량', '평균매수가', '현재가', '평가금액', '손익', '수익률(%)', '매수일']
    const rows = holdings.map((h) => {
      const price = prices[h.symbol]?.price ?? h.avgCost
      const value = price * h.shares
      const pnl   = (price - h.avgCost) * h.shares
      const pct   = h.avgCost > 0
        ? ((price - h.avgCost) / h.avgCost * 100).toFixed(2)
        : '0.00'
      return [
        h.symbol,
        `"${h.name.replace(/"/g, '""')}"`,
        h.shares,
        h.avgCost.toFixed(2),
        price.toFixed(2),
        value.toFixed(2),
        pnl.toFixed(2),
        pct,
        h.buyDate ?? '',
      ]
    })

    const csv  = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `portfolio_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Section title="데이터 내보내기">
      <div className="flex items-center gap-4">
        <button
          onClick={downloadCSV}
          disabled={holdings.length === 0}
          className={`${BTN_SECONDARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Download size={14} />보유 종목 CSV 다운로드
        </button>
        {holdings.length > 0 && (
          <span className="text-xs text-gray-400">{holdings.length}개 종목</span>
        )}
      </div>
      {holdings.length === 0 && (
        <p className="text-sm text-gray-400">내보낼 보유 종목이 없습니다.</p>
      )}
    </Section>
  )
}

// ── 6. 테마 ─────────────────────────────────────────────────────────────────
function ThemeSection() {
  const { dark, toggle } = useDarkMode()
  return (
    <Section title="테마">
      <div className="flex items-center gap-3">
        <button onClick={toggle} className={BTN_SECONDARY}>
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        </button>
        <span className="text-sm text-gray-400">현재: {dark ? '다크' : '라이트'}</span>
      </div>
    </Section>
  )
}

// ── Settings 페이지 ──────────────────────────────────────────────────────────
export default function Settings() {
  return (
    <div className="space-y-10 max-w-4xl">
      <h1 className="text-2xl font-bold">설정</h1>
      <HoldingsSection />
      <WatchlistSection />
      <NotificationSection />
      <ApiKeySection />
      <ExportSection />
      <ThemeSection />
    </div>
  )
}
