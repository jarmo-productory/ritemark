import React, { useCallback, useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { GoogleUser } from '../../types/auth'
import { AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[440px]">
        {user ? (
          // Authenticated state
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Account</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-6 pt-2">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-3 border-gray-200"
                />
              )}

              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>

              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </>
        ) : (
          // Login state
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Sign in to RiteMark</DialogTitle>
              <DialogDescription className="text-center">
                Connect your Google account to enable cloud collaboration and sync your documents across devices.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-900 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {localLoading ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-600">Authenticating...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    disabled={!tokenClient}
                    className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}
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

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    By signing in, you agree to our{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
