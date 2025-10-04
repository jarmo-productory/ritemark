import { Settings } from 'lucide-react'
import { useState } from 'react'
import { AuthModal } from './auth/AuthModal'
import { useAuth } from '../hooks/useAuth'

export function SettingsButton() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  const getOpacity = () => {
    return isAuthenticated ? 0.25 : 0.15
  }

  const handleClick = () => {
    setIsAuthModalOpen(true)
  }

  return (
    <>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}