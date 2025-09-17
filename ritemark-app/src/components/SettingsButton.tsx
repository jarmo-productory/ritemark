import { Settings } from 'lucide-react'

interface SettingsButtonProps {
  authState?: 'anonymous' | 'authenticated' | 'needs-auth'
  onClick?: () => void
}

export function SettingsButton({
  authState = 'anonymous',
  onClick
}: SettingsButtonProps) {

  const getOpacity = () => {
    switch (authState) {
      case 'needs-auth': return 0.4
      case 'authenticated': return 0.25
      default: return 0.15
    }
  }

  return (
    <button
      className="settings-button"
      onClick={onClick}
      style={{ opacity: getOpacity() }}
      aria-label="Settings"
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