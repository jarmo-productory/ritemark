import React, { useCallback, useState } from 'react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import type { GoogleUser } from '../../types/auth'
import { X, AlertCircle } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, error, clearError } = useAuth()
  const [localLoading, setLocalLoading] = useState(false)

  const handleGoogleSuccess = useCallback(async (credentialResponse: CredentialResponse) => {
    setLocalLoading(true)

    try {
      // Decode JWT token to get user info
      const credential = credentialResponse.credential
      if (!credential) {
        throw new Error('No credential received from Google')
      }

      // Parse JWT (basic parsing, no verification needed as it comes from Google)
      const base64Url = credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const payload = JSON.parse(jsonPayload)

      const userData: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified,
        emailVerified: payload.email_verified,
      }

      // Store user and tokens with consistent keys (matching TokenManager and AuthContext)
      sessionStorage.setItem('ritemark_user', JSON.stringify(userData))
      sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
        access_token: credential, // Use id_token as access_token for Google OAuth
        id_token: credential,
        token_type: 'Bearer',
        expires_in: payload.exp - Math.floor(Date.now() / 1000), // Seconds until expiry
        expiresAt: payload.exp * 1000, // Milliseconds
      }))

      // Force page reload to update auth context
      window.location.reload()
    } catch (err) {
      console.error('Failed to process Google login:', err)
      alert('Authentication failed. Please try again.')
    } finally {
      setLocalLoading(false)
    }
  }, [])

  const handleGoogleError = useCallback(() => {
    console.error('Google login failed')
    alert('Failed to authenticate with Google. Please try again.')
    setLocalLoading(false)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    onClose()
  }, [logout, onClose])

  const handleClose = useCallback(() => {
    clearError()
    onClose()
  }, [clearError, onClose])

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container">
        <button
          onClick={handleClose}
          className="auth-modal-close"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="auth-modal-content">
          {user ? (
            // Authenticated state
            <div className="auth-modal-profile">
              <h2 className="auth-modal-title">Account</h2>

              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="auth-modal-avatar"
                />
              )}

              <div className="auth-modal-user-info">
                <p className="auth-modal-name">{user.name}</p>
                <p className="auth-modal-email">{user.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="auth-modal-logout-button"
              >
                Sign Out
              </button>
            </div>
          ) : (
            // Login state
            <div className="auth-modal-login">
              <h2 className="auth-modal-title">Sign in to RiteMark</h2>

              <p className="auth-modal-description">
                Connect your Google account to enable cloud collaboration and sync your documents across devices.
              </p>

              {error && (
                <div className="auth-modal-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {localLoading ? (
                <div className="auth-modal-loading">
                  <div className="auth-modal-spinner" />
                  <p>Authenticating...</p>
                </div>
              ) : (
                <div className="auth-modal-google-button">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    auto_select={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              )}

              <p className="auth-modal-privacy">
                By signing in, you agree to our{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </p>
            </div>
          )}
        </div>

        <style>{`
          .auth-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .auth-modal-container {
            background: white;
            border-radius: 12px;
            max-width: 440px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .auth-modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 8px;
            border-radius: 6px;
            transition: all 0.2s ease;
            z-index: 10;
          }

          .auth-modal-close:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #374151;
          }

          .auth-modal-content {
            padding: 48px 32px 32px;
          }

          .auth-modal-title {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
            text-align: center;
          }

          .auth-modal-description {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.6;
            text-align: center;
            margin-bottom: 32px;
          }

          .auth-modal-error {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: #fef2f2;
            color: #991b1b;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 24px;
          }

          .auth-modal-google-button {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
          }

          .auth-modal-loading {
            text-align: center;
            padding: 32px;
          }

          .auth-modal-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .auth-modal-loading p {
            color: #6b7280;
            font-size: 14px;
          }

          .auth-modal-privacy {
            color: #9ca3af;
            font-size: 13px;
            text-align: center;
            line-height: 1.5;
          }

          .auth-modal-privacy a {
            color: #3b82f6;
            text-decoration: none;
          }

          .auth-modal-privacy a:hover {
            text-decoration: underline;
          }

          .auth-modal-profile {
            text-align: center;
          }

          .auth-modal-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 20px;
            border: 3px solid #e5e7eb;
          }

          .auth-modal-user-info {
            margin-bottom: 32px;
          }

          .auth-modal-name {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
          }

          .auth-modal-email {
            color: #6b7280;
            font-size: 14px;
          }

          .auth-modal-logout-button {
            width: 100%;
            padding: 12px 24px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .auth-modal-logout-button:hover {
            background: #dc2626;
          }

          @media (max-width: 768px) {
            .auth-modal-container {
              max-width: 95%;
              margin: 20px;
            }

            .auth-modal-content {
              padding: 40px 24px 24px;
            }

            .auth-modal-title {
              font-size: 20px;
            }

            .auth-modal-description {
              font-size: 14px;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
