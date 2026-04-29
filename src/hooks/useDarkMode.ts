import { useEffect } from 'react'
import { useStore } from '../store'

/**
 * 다크 모드 훅.
 * - Zustand store에서 상태를 읽으므로 어느 컴포넌트에서 toggle해도 전체가 동기화된다.
 * - effect에서 <html> 클래스와 localStorage 'theme' 키를 함께 갱신한다.
 */
export function useDarkMode() {
  const dark    = useStore((s) => s.dark)
  const setDark = useStore((s) => s.setDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark(!dark) }
}
