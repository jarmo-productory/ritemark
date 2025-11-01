import { FileText, FolderOpen, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import type { GoogleUser } from '@/types/auth'

interface WelcomeScreenProps {
  onNewDocument: () => void
  onOpenFromDrive: () => void
  onCancel?: () => void
}

export function WelcomeScreen({ onNewDocument, onOpenFromDrive, onCancel }: WelcomeScreenProps) {
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false
  const user = authContext?.user
  const [tokenClient, setTokenClient] = useState<{ requestAccessToken: () => void } | null>(null)
  const [accessTokenReceived, setAccessTokenReceived] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)


  // Check backend health on mount (Sprint 20 - Phase 0)
  useEffect(() => {
    const checkHealth = async () => {
      const { checkBackendHealth } = await import('../utils/backendHealth')
      const available = await checkBackendHealth()
      setBackendAvailable(available)
      console.log('[WelcomeScreen] Backend health check:', available ? 'available' : 'unavailable')
    }
    checkHealth()
  }, [])

  // Handle OAuth callback from backend (Sprint 20 - Phase 0)
  useEffect(() => {
    const handleBackendCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('access_token')
      const userId = urlParams.get('user_id')
      const error = urlParams.get('error')

      // Check if this is a backend OAuth callback
      if (!accessToken && !error) {
        return
      }

      if (error) {
        console.error('[WelcomeScreen] OAuth error from backend:', error)
        alert(`Authentication failed: ${urlParams.get('error_description') || error}`)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
        return
      }

      if (accessToken && userId) {
        console.log('[WelcomeScreen] Backend OAuth callback received')

        try {
          // Store tokens using TokenManagerEncrypted
          const { tokenManagerEncrypted } = await import('../services/auth/TokenManagerEncrypted')
          const { userIdentityManager } = await import('../services/auth/tokenManager')

          const tokens = {
            access_token: accessToken,
            accessToken: accessToken,
            expires_in: parseInt(urlParams.get('expires_in') || '3600'),
            token_type: 'Bearer' as const,
            tokenType: 'Bearer' as const,
            expiresAt: Date.now() + (parseInt(urlParams.get('expires_in') || '3600') * 1000),
          }

          await tokenManagerEncrypted.storeTokens(tokens)

          // Also store in sessionStorage for backward compatibility
          sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(tokens))

          // Get user info from OpenID Connect
          const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })

          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json()
            const userData: GoogleUser = {
              id: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              verified_email: userInfo.email_verified || false,
              emailVerified: userInfo.email_verified || false,
            }

            // Store user data
            sessionStorage.setItem('ritemark_user', JSON.stringify(userData))
            userIdentityManager.storeUserInfo(userData.id, userData.email)

            console.log('[WelcomeScreen] Backend OAuth complete, reloading...')

            // Clean up URL before reload
            window.history.replaceState({}, '', window.location.pathname)

            // Reload to initialize authenticated state
            window.location.reload()
          } else {
            throw new Error('Failed to fetch user info')
          }
        } catch (err) {
          console.error('[WelcomeScreen] Backend OAuth callback failed:', err)
          alert('Authentication failed. Please try again.')
          window.history.replaceState({}, '', window.location.pathname)
        }

        return
      }
    }

    handleBackendCallback()
  }, [])

  // Initialize Google OAuth token client (browser-only fallback, Sprint 19)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const initTokenClient = () => {
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
          callback: async (tokenResponse: { access_token?: string; error?: string; error_description?: string; expires_in?: number; scope?: string; token_type?: string }) => {
            if (tokenResponse.access_token) {
              try {
                // Use OpenID Connect endpoint to get user.sub (stable user ID)
                const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                })

                if (!userInfoResponse.ok) {
                  throw new Error('Failed to fetch user info')
                }

                const userInfo = await userInfoResponse.json()

                // userInfo.sub is the stable user ID (consistent across devices)
                const userData: GoogleUser = {
                  id: userInfo.sub,
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture,
                  verified_email: userInfo.email_verified || false,
                  emailVerified: userInfo.email_verified || false,
                }

                // Store user data in sessionStorage
                sessionStorage.setItem('ritemark_user', JSON.stringify(userData))

                // Store user.sub for rate limiting and cross-device sync
                const { userIdentityManager } = await import('../services/auth/tokenManager')
                userIdentityManager.storeUserInfo(userData.id, userData.email)

                // Store tokens using encrypted TokenManager
                const { tokenManagerEncrypted } = await import('../services/auth/TokenManagerEncrypted')

                const tokens = {
                  access_token: tokenResponse.access_token,
                  accessToken: tokenResponse.access_token,
                  expires_in: tokenResponse.expires_in,
                  scope: tokenResponse.scope,
                  token_type: (tokenResponse.token_type || 'Bearer') as 'Bearer',
                  tokenType: 'Bearer' as const,
                  expiresAt: Date.now() + ((tokenResponse.expires_in || 3600) * 1000),
                }

                await tokenManagerEncrypted.storeTokens(tokens)

                // Also store in sessionStorage for backward compatibility
                sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify(tokens))

                setAccessTokenReceived(true)
              } catch (err) {
                console.error('Authentication failed:', err)
                alert('Authentication failed. Please try again.')
              }
            } else {
              // Error: User denied access or Google returned error
              const errorMessage = tokenResponse.error === 'access_denied'
                ? 'Access denied. You need to grant permission to use RiteMark.'
                : `Authentication failed: ${tokenResponse.error_description || tokenResponse.error || 'Unknown error'}`
              alert(errorMessage)
            }
          },
        })
        setTokenClient(client)
      } else {
        setTimeout(initTokenClient, 500)
      }
    }

    initTokenClient()
  }, [])

  // Reload page after authentication complete
  useEffect(() => {
    if (accessTokenReceived) {
      window.location.reload()
    }
  }, [accessTokenReceived])

  const handleSignIn = () => {
    // Sprint 20 Phase 0: Check backend availability
    if (backendAvailable === true) {
      // Backend available: Use Authorization Code Flow via Netlify Function
      console.log('[WelcomeScreen] Using backend OAuth flow')

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        alert('Google Client ID not configured')
        return
      }

      // Codex Solution: Use a single fixed redirect URI (production Function)
      // Carry the current environment (origin) in a signed state parameter.
      // For local dev via `netlify dev`, allow localhost callback as an additional authorized URI.
      const host = window.location.hostname
      const isLocalDev = host === 'localhost' || host === '127.0.0.1'
      const isPreview = host.includes('deploy-preview')
      const fixedRedirectUri = isLocalDev
        ? 'http://localhost:8888/.netlify/functions/auth-callback'
        : isPreview
          ? `${window.location.origin}/.netlify/functions/auth-callback`
          : 'https://ritemark.netlify.app/.netlify/functions/auth-callback'

      console.log('[WelcomeScreen] Using redirect URI:', fixedRedirectUri)

      const scope = 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'

      // Encode return destination in state (where to redirect after OAuth)
      const state = {
        origin: window.location.origin,  // Preview or production origin
        returnPath: '/app',              // Ensure the SPA route, not landing page
        nonce: crypto.randomUUID(),      // CSRF protection
        ts: Date.now()                   // Replay protection
      }

      // Base64URL encode state (URL-safe, no +, /, =)
      const stateEncoded = btoa(JSON.stringify(state))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', fixedRedirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('access_type', 'offline') // Get refresh token
      authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
      authUrl.searchParams.set('state', stateEncoded)

      console.log('[WelcomeScreen] OAuth state:', state)
      window.location.href = authUrl.toString()
    } else {
      // Backend unavailable: Fall back to browser-only OAuth (Sprint 19)
      console.log('[WelcomeScreen] Using browser-only OAuth flow (fallback)')

      if (!tokenClient) {
        alert('Authentication not ready. Please refresh the page.')
        return
      }
      tokenClient.requestAccessToken() // Opens Google OAuth popup
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent
        className="max-w-md"
        // Modal mode when onCancel is not provided
        hideCloseButton={!onCancel}
        onPointerDownOutside={(e) => !onCancel && e.preventDefault()}
        onEscapeKeyDown={(e) => !onCancel && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to RiteMark</DialogTitle>
        </DialogHeader>

        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">RM</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-foreground">RiteMark</h1>

            {/* Welcome message for authenticated users */}
            {isAuthenticated && user && (
              <p className="mt-2 text-lg text-muted-foreground">
                Welcome back, {user.name?.split(' ')[0] || 'User'}!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isAuthenticated ? (
              // Authenticated user - show New Document and Open from Drive
              <>
                <Button
                  onClick={onNewDocument}
                  size="lg"
                  className="w-full gap-3"
                >
                  <FileText className="h-5 w-5" />
                  New Document
                </Button>

                <Button
                  onClick={onOpenFromDrive}
                  variant="outline"
                  size="lg"
                  className="w-full gap-3"
                >
                  <FolderOpen className="h-5 w-5" />
                  Open from Drive
                </Button>
              </>
            ) : (
              // Not authenticated - show sign in button
              <Button
                onClick={handleSignIn}
                size="lg"
                className="w-full gap-3"
              >
                <LogIn className="h-5 w-5" />
                Sign in with Google
              </Button>
            )}
          </div>

          {/* Cancel button - only show when onCancel is provided (dismissible mode) */}
          {onCancel && (
            <div className="mt-6">
              <button
                onClick={onCancel}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
