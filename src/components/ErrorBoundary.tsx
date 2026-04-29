import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface State {
  hasError: boolean
  message: string
}

interface Props {
  children: React.ReactNode
  /** 커스텀 폴백 UI. 생략하면 기본 에러 카드를 표시한다. */
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  retry = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-10 text-center min-h-[160px]">
        <AlertTriangle size={26} className="text-red-400" />
        <div className="space-y-1">
          <p className="font-semibold text-red-700 dark:text-red-400">
            렌더링 중 오류가 발생했습니다
          </p>
          {this.state.message && (
            <p className="text-xs text-red-500 font-mono max-w-md break-all">
              {this.state.message}
            </p>
          )}
        </div>
        <button
          onClick={this.retry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors"
        >
          <RefreshCw size={14} />
          다시 시도
        </button>
      </div>
    )
  }
}
