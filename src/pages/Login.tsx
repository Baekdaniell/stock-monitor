import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useStore } from '../store'

type Mode = 'login' | 'signup'

const INPUT =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ' +
  'px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 ' +
  'dark:text-gray-100 placeholder:text-gray-400'

export default function Login() {
  const authReady = useStore((s) => s.authReady)
  const userId    = useStore((s) => s.userId)

  const [mode,     setMode]     = useState<Mode>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [info,     setInfo]     = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  // 이미 로그인된 경우 홈으로 리디렉션
  if (authReady && userId) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(errorMessage(error.message))
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        setError(errorMessage(error.message))
      } else if (!data.session) {
        // 이메일 인증이 필요한 경우
        setInfo('가입 확인 이메일을 발송했습니다. 이메일을 확인한 후 로그인해주세요.')
        setMode('login')
      }
      // 세션이 있으면 onAuthStateChange 가 자동으로 처리
    }

    setLoading(false)
  }

  function errorMessage(msg: string): string {
    if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
    if (msg.includes('Email not confirmed'))       return '이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.'
    if (msg.includes('User already registered'))   return '이미 가입된 이메일입니다. 로그인을 시도해주세요.'
    if (msg.includes('Password should be'))        return '비밀번호는 최소 6자 이상이어야 합니다.'
    return msg
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-6">

        {/* 로고 */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2">
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="5" fill="#0a0a0a"/>
              <line x1="2" y1="26" x2="30" y2="26" stroke="white" strokeWidth="0.5" strokeOpacity="0.06"/>
              <line x1="2" y1="20" x2="30" y2="20" stroke="white" strokeWidth="0.5" strokeOpacity="0.04"/>
              <polyline points="3,23 7,23 10,19 13,24 17,15 20,10 23,21 26,18 30,19"
                stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.18" fill="none"/>
              <line x1="20" y1="10" x2="17" y2="4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="16.5" cy="3" r="1.5" fill="#ef4444"/>
              <line x1="20" y1="10" x2="23" y2="4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="23.5" cy="3" r="1.5" fill="#ef4444"/>
              <polyline points="3,23 7,23 10,19 13,24 17,15 20,10 23,21 26,18 30,19"
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="20" cy="10" r="2" fill="#ef4444"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-widest text-gray-900 dark:text-gray-100">ANTARK</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? '계정으로 로그인하세요' : '새 계정을 만드세요'}
          </p>
        </div>

        {/* Supabase 미설정 경고 */}
        {!isSupabaseConfigured && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
            <p className="font-semibold mb-0.5">Supabase가 설정되지 않았습니다</p>
            <p>.env.local 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정해주세요.</p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={INPUT}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={INPUT}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* 안내 메시지 */}
          {info && (
            <p className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* 모드 전환 */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null) }}
            className="text-red-600 dark:text-red-400 font-medium hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}
