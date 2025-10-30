import { Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/**
 * Settings Button (Simplified)
 *
 * Behavior:
 * - If authenticated: Shows logout confirmation dialog
 * - If not authenticated: Does nothing (user sees WelcomeScreen by default)
 */
export function SettingsButton() {
  const { isAuthenticated, logout } = useAuth()

  const getOpacity = () => {
    return isAuthenticated ? 0.25 : 0.15
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      // Not authenticated - WelcomeScreen is already shown by App.tsx
      return
    }

    // Authenticated - show logout confirmation
    const confirmLogout = window.confirm('Are you sure you want to sign out?')
    if (confirmLogout) {
      logout()
    }
  }

  return (
    <button
      className="settings-button"
      onClick={handleClick}
      style={{ opacity: getOpacity() }}
      aria-label={isAuthenticated ? 'Account Settings' : 'Sign In'}
    >
      <Settings size={20} />
      <style>{`
        .settings-button {
          position: fixed;
          top: 20px;
          right: 20px;
          opacity: 0.15;
          transition: opacity 0.2s ease;
          cursor: pointer;
          border: none;
          background: none;
          border-radius: 6px;
          padding: 8px;
          color: #374151;
          z-index: 1000;
        }

        .settings-button:hover {
          opacity: 0.8 !important;
          background: rgba(255, 255, 255, 0.1);
        }

        .settings-button:focus {
          outline: 2px solid rgba(59, 130, 246, 0.3);
          outline-offset: 2px;
        }
      `}</style>
    </button>
  )
}