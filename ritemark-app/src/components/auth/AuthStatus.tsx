import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { User, CheckCircle } from 'lucide-react'

export const AuthStatus: React.FC = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="auth-status-container">
      <div className="auth-status-content">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="auth-status-avatar"
          />
        ) : (
          <div className="auth-status-avatar-placeholder">
            <User size={16} />
          </div>
        )}

        <div className="auth-status-info">
          <div className="auth-status-name">
            {user.name}
            {user.emailVerified && (
              <CheckCircle size={12} className="auth-status-verified" />
            )}
          </div>
          <div className="auth-status-email">{user.email}</div>
        </div>
      </div>

      <style>{`
        .auth-status-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
          max-width: 260px;
          z-index: 900;
          opacity: 0.9;
          transition: opacity 0.2s ease;
        }

        .auth-status-container:hover {
          opacity: 1;
        }

        .auth-status-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-status-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
        }

        .auth-status-avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .auth-status-info {
          flex: 1;
          min-width: 0;
        }

        .auth-status-name {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .auth-status-verified {
          color: #10b981;
          flex-shrink: 0;
        }

        .auth-status-email {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .auth-status-container {
            bottom: 80px;
            right: 16px;
            max-width: calc(100% - 32px);
          }

          .auth-status-name {
            font-size: 13px;
          }

          .auth-status-email {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  )
}
