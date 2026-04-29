import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Watchlist from './pages/Watchlist'
import News from './pages/News'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Skeleton } from './components/Skeleton'
import { usePriceService } from './hooks/usePriceService'
import { useNewsService } from './hooks/useNewsService'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { useStore } from './store'

// ── 인증 완료 전 전체 화면 로딩 ───────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <Skeleton className="h-4 w-32 rounded" />
    </div>
  )
}

// ── 로그인 여부 기반 라우트 보호 ───────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authReady = useStore((s) => s.authReady)
  const userId    = useStore((s) => s.userId)

  if (!authReady) return <AuthLoadingScreen />
  if (!userId)    return <Navigate to="/login" replace />
  return <>{children}</>
}

// ── 서비스 훅 + 라우트 정의 ───────────────────────────────────────────────────
function AppRoutes() {
  usePriceService()  // 10분 인터벌 가격 갱신
  useNewsService()   // 30분 인터벌 뉴스 갱신

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="portfolio" element={<ErrorBoundary><Portfolio /></ErrorBoundary>} />
        <Route path="watchlist" element={<ErrorBoundary><Watchlist /></ErrorBoundary>} />
        <Route path="news"      element={<ErrorBoundary><News /></ErrorBoundary>} />
        <Route path="settings"  element={<ErrorBoundary><Settings /></ErrorBoundary>} />
      </Route>
    </Routes>
  )
}

// ── App 루트 — Supabase Auth 리스너 ──────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const { setUser, setAuthReady, loadUserData } = useStore.getState()

    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }

    // 최초 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user.id, session.user.email ?? null)
        loadUserData(session.user.id)
          .catch(console.error)
          .finally(() => setAuthReady(true))
      } else {
        setAuthReady(true)
      }
    })

    // 이후 auth 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const { setUser, loadUserData, clearUserData, setAuthReady } = useStore.getState()

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user.id, session.user.email ?? null)
          loadUserData(session.user.id)
            .catch(console.error)
            .finally(() => setAuthReady(true))
        } else if (event === 'SIGNED_OUT') {
          setUser(null, null)
          clearUserData()
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
