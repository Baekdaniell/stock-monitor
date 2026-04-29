import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Watchlist from './pages/Watchlist'
import News from './pages/News'
import Settings from './pages/Settings'
import { ErrorBoundary } from './components/ErrorBoundary'
import { usePriceService } from './hooks/usePriceService'
import { useNewsService } from './hooks/useNewsService'

function AppRoutes() {
  usePriceService()   // 10분 인터벌 가격 갱신
  useNewsService()    // 30분 인터벌 뉴스 갱신

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="portfolio" element={<ErrorBoundary><Portfolio /></ErrorBoundary>} />
        <Route path="watchlist" element={<ErrorBoundary><Watchlist /></ErrorBoundary>} />
        <Route path="news" element={<ErrorBoundary><News /></ErrorBoundary>} />
        <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
