import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import {
  TrendingUp,
  BarChart2,
  BookOpen,
  List,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Clock,
  LogOut,
} from 'lucide-react'

function AntarkLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#6366f1"/>
      <line x1="13" y1="8.5" x2="10" y2="4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="19" y1="8.5" x2="22" y2="4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="10" cy="4.5" r="1.2" fill="white"/>
      <circle cx="22" cy="4.5" r="1.2" fill="white"/>
      <circle cx="16" cy="11" r="3.2" fill="white"/>
      <ellipse cx="16" cy="16" rx="2.2" ry="2.5" fill="white"/>
      <ellipse cx="16" cy="22.5" rx="3.6" ry="4.2" fill="white"/>
      <line x1="13.8" y1="14.2" x2="8" y2="12.5" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="13.8" y1="16" x2="7.5" y2="16" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="13.8" y1="17.8" x2="8" y2="20" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="18.2" y1="14.2" x2="24" y2="12.5" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="18.2" y1="16" x2="24.5" y2="16" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="18.2" y1="17.8" x2="24" y2="20" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
import { useDarkMode } from '../hooks/useDarkMode'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/', label: '대시보드', icon: TrendingUp, end: true },
  { to: '/portfolio', label: '포트폴리오', icon: BarChart2 },
  { to: '/watchlist', label: '관심종목', icon: List },
  { to: '/news', label: '뉴스', icon: BookOpen },
  { to: '/settings', label: '설정', icon: Settings },
]

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** 공통 NavLink 스타일 팩토리 */
function navLinkClass(isActive: boolean, mobile = false) {
  const base = mobile
    ? 'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors'
    : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

  return [
    base,
    isActive
      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
      : mobile
        ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
  ].join(' ')
}

export default function Navbar() {
  const { dark, toggle } = useDarkMode()
  const lastUpdatedAt = useStore((s) => s.lastUpdatedAt)
  const userEmail     = useStore((s) => s.userEmail)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    // App.tsx onAuthStateChange 가 clearUserData 처리
  }

  // 드로어 외부 클릭 시 닫기
  useEffect(() => {
    if (!drawerOpen) return
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [drawerOpen])

  // 드로어 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4 md:px-6">

          {/* ── 로고 ── */}
          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-2 font-bold text-base tracking-tight text-gray-900 dark:text-gray-100"
          >
            <AntarkLogo />
            <span className="hidden xs:block">Antark</span>
          </NavLink>

          {/* ── 데스크탑 네비게이션 (md 이상) ── */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── 우측 영역 ── */}
          <div className="ml-auto flex items-center gap-2">

            {/* 마지막 갱신 시각 (sm 이상) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 select-none">
              <Clock size={13} />
              <span className="font-mono tabular-nums">
                {lastUpdatedAt ? formatTime(lastUpdatedAt) : '미갱신'}
              </span>
              <span className="text-gray-300 dark:text-gray-700">갱신</span>
            </div>

            {/* 로그인 사용자 이메일 + 로그아웃 (sm 이상) */}
            {userEmail && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span
                  title={userEmail}
                  className="max-w-[140px] truncate text-xs text-gray-500 dark:text-gray-400 select-none"
                >
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  aria-label="로그아웃"
                  title="로그아웃"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}

            {/* 다크모드 토글 */}
            <button
              onClick={toggle}
              aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* 햄버거 버튼 (md 미만) */}
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="메뉴 열기"
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              {drawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── 모바일 드로어 오버레이 ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" aria-hidden="true" />
      )}

      {/* ── 모바일 드로어 패널 ── */}
      <div
        ref={drawerRef}
        className={[
          'fixed top-14 left-0 z-40 h-[calc(100dvh-3.5rem)] w-64 flex flex-col',
          'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'shadow-xl transition-transform duration-200 ease-in-out md:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* 드로어 내비 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => navLinkClass(isActive, true)}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* 드로어 하단 — 사용자 정보 + 갱신 시각 */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-2">
          {userEmail && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{userEmail}</span>
              <button
                onClick={() => { setDrawerOpen(false); void handleLogout() }}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={13} />로그아웃
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Clock size={13} />
            <span className="font-mono tabular-nums">
              {lastUpdatedAt ? formatTime(lastUpdatedAt) : '미갱신'}
            </span>
            <span>갱신</span>
          </div>
        </div>
      </div>
    </>
  )
}
