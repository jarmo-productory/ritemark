import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <AlertTriangle size={48} className="error-boundary-icon" />
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleReset}
              className="error-boundary-button"
            >
              Reload Application
            </button>
          </div>

          <style>{`
            .error-boundary-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f9fafb;
              padding: 20px;
            }

            .error-boundary-content {
              text-align: center;
              max-width: 500px;
              background: white;
              padding: 48px 32px;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }

            .error-boundary-icon {
              color: #ef4444;
              margin-bottom: 24px;
            }

            .error-boundary-title {
              font-size: 24px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 12px;
            }

            .error-boundary-message {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 32px;
            }

            .error-boundary-button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s ease;
            }

            .error-boundary-button:hover {
              background: #2563eb;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}
