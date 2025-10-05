import React, { useCallback, useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { GoogleUser } from '../../types/auth'
import { X, AlertCircle } from 'lucide-react'

// Google Identity Services types
interface TokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
          }) => {
            requestAccessToken: () => void
          }
        }
      }
    }
  }
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, error, clearError } = useAuth()
  const [localLoading, setLocalLoading] = useState(false)
  const [tokenClient, setTokenClient] = useState<{ requestAccessToken: () => void } | null>(null)
  const [accessTokenReceived, setAccessTokenReceived] = useState(false)

  // Initialize Google OAuth2 tokenClient with combined scopes (single popup)
  // Combines user identity + Drive API access in one flow
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    let retryCount = 0
    const maxRetries = 20 // 10 seconds max (500ms * 20)

    const initTokenClient = () => {
      if (window.google?.accounts?.oauth2) {
        // GIS script loaded, initialize tokenClient with combined scopes
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          // Combined scopes: user identity + Drive API (single consent screen)
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              // Success: Got access token, now fetch user info
              try {
                // Fetch user profile using the access token
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                })

                if (!userInfoResponse.ok) {
                  throw new Error('Failed to fetch user info')
                }

                const userInfo = await userInfoResponse.json()

                // Store user data
                const userData: GoogleUser = {
                  id: userInfo.id,
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture,
                  verified_email: userInfo.verified_email,
                  emailVerified: userInfo.verified_email,
                }
                sessionStorage.setItem('ritemark_user', JSON.stringify(userData))

                // Store complete OAuth tokens
                sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
                  access_token: tokenResponse.access_token,
                  accessToken: tokenResponse.access_token,
                  expires_in: tokenResponse.expires_in,
                  scope: tokenResponse.scope,
                  token_type: tokenResponse.token_type,
                  tokenType: 'Bearer',
                  expiresAt: Date.now() + ((tokenResponse.expires_in || 3600) * 1000),
                }))

                console.log('✅ Authentication complete (user + Drive access)')
                setAccessTokenReceived(true)
              } catch (err) {
                console.error('❌ Failed to fetch user info:', err)
                setLocalLoading(false)
                alert('Authentication failed. Please try again.')
              }
            } else {
              // Error: User denied access or Google returned error
              console.error('❌ Authentication failed:', tokenResponse)
              setLocalLoading(false)

              const errorMessage = tokenResponse.error === 'access_denied'
                ? 'Access denied. You need to grant permission to use RiteMark.'
                : `Authentication failed: ${tokenResponse.error_description || tokenResponse.error || 'Unknown error'}`

              alert(errorMessage)
            }
          },
        })

        setTokenClient(client)
        console.log('✅ OAuth client initialized')
      } else if (retryCount < maxRetries) {
        retryCount++
        setTimeout(initTokenClient, 500)
      } else {
        console.error('❌ Google Identity Services script failed to load')
      }
    }

    initTokenClient()
  }, [])

  // Single-click authentication handler
  const handleSignIn = useCallback(() => {
    if (!tokenClient) {
      alert('Authentication not ready. Please refresh the page.')
      return
    }

    setLocalLoading(true)
    console.log('🔑 Starting authentication...')

    // Request access token (single popup with combined scopes)
    tokenClient.requestAccessToken()
  }, [tokenClient])

  // Reload page after authentication complete
  useEffect(() => {
    if (accessTokenReceived) {
      console.log('🔄 Reloading with authentication complete')
      window.location.reload()
    }
  }, [accessTokenReceived])

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
                <button
                  onClick={handleSignIn}
                  disabled={!tokenClient}
                  className="auth-modal-signin-button"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fillRule="evenodd">
                      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </g>
                  </svg>
                  Sign in with Google
                </button>
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

          .auth-modal-signin-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 12px 24px;
            background: white;
            color: #3c4043;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 24px;
          }

          .auth-modal-signin-button:hover:not(:disabled) {
            background: #f8f9fa;
            border-color: #d2d3d4;
            box-shadow: 0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15);
          }

          .auth-modal-signin-button:active:not(:disabled) {
            background: #f1f3f4;
            border-color: #c4c6c8;
          }

          .auth-modal-signin-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .auth-modal-signin-button svg {
            flex-shrink: 0;
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
