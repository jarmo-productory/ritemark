import { FileText, FolderOpen, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AuthErrorDialog } from '@/components/AuthErrorDialog'
import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import { useBackendHealth } from '@/contexts/BackendHealthContext'

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

  // Sprint 22 Performance: Use global backend health context
  const { backendAvailable } = useBackendHealth()

  // Sprint 22 UX: Error dialog state
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean
    title?: string
    message: string
    error?: Error | unknown
    onRetry?: () => void
  }>({
    open: false,
    message: ''
  })

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
                // Sprint 22: Use shared callback handler
                const { oauthCallbackHandler } = await import('../services/auth/OAuthCallbackHandler')
                await oauthCallbackHandler.handleBrowserCallback(tokenResponse)

                setAccessTokenReceived(true)
              } catch (err) {
                console.error('Authentication failed:', err)
                setErrorDialog({
                  open: true,
                  title: 'Authentication Failed',
                  message: 'Failed to complete authentication. Please try again.',
                  error: err,
                  onRetry: () => {
                    setErrorDialog({ open: false, message: '' })
                    tokenClient?.requestAccessToken()
                  }
                })
              }
            } else {
              // Error: User denied access or Google returned error
              const errorMessage = tokenResponse.error === 'access_denied'
                ? 'You need to grant permission to use RiteMark.'
                : tokenResponse.error_description || tokenResponse.error || 'Unknown error'

              setErrorDialog({
                open: true,
                title: tokenResponse.error === 'access_denied' ? 'Access Denied' : 'Authentication Failed',
                message: errorMessage,
                onRetry: tokenResponse.error === 'access_denied' ? undefined : () => {
                  setErrorDialog({ open: false, message: '' })
                  tokenClient?.requestAccessToken()
                }
              })
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

  /**
   * Initiate Google OAuth sign-in flow
   *
   * **OAuth Flow Selection Strategy (Sprint 20)**
   *
   * This function implements a dual OAuth flow architecture to solve the
   * "Google OAuth doesn't support per-PR URLs" problem while maintaining
   * long-lived sessions in production.
   *
   * ## Flow 1: Backend OAuth (Authorization Code Flow)
   * **When**: Backend available (production + local dev via Netlify CLI)
   * **How**: Exchanges authorization code for tokens via Netlify Function
   * **Benefits**:
   * - 6-month sessions (refresh tokens stored server-side in Netlify Blobs)
   * - More secure (CLIENT_SECRET never exposed to browser)
   * - Automatic token refresh without re-authentication
   *
   * ## Flow 2: Browser-Only OAuth (Implicit Flow)
   * **When**: Backend unavailable (preview deploys, offline development)
   * **How**: Direct token request via Google Identity Services
   * **Benefits**:
   * - Works without backend infrastructure
   * - Enables preview deploy testing
   * **Limitations**:
   * - 1-hour sessions only (no refresh token)
   * - Less secure (tokens only in browser memory)
   *
   * ## Preview Deploy Limitation
   * Google OAuth requires fixed redirect URIs registered in Google Console.
   * Per-PR URLs (e.g., `deploy-preview-123--ritemark.netlify.app`) cannot
   * be registered dynamically, so preview deploys fall back to browser-only OAuth.
   *
   * ## Environment Detection
   * Backend availability checked via HEAD request to `/refresh-token` endpoint:
   * - 405 Method Not Allowed = Netlify Function available ✅
   * - Network error/timeout = Backend unavailable ❌
   * - Result cached for 5 minutes (see `backendHealth.ts`)
   *
   * ## Security (Sprint 22)
   * - State parameter with nonce (CSRF protection)
   * - Timestamp validation (replay attack prevention)
   * - Origin allowlist (open redirect prevention)
   * - Rate limiting on token refresh endpoint
   *
   * @see https://developers.google.com/identity/protocols/oauth2
   * @see /netlify/functions/auth-callback.ts (backend OAuth handler)
   * @see /netlify/functions/refresh-token.ts (token refresh endpoint)
   * @see /docs/architecture/ADR-004-oauth-flow-selection.md
   */
  const handleSignIn = () => {
    // Sprint 22 Security: HTTPS enforcement in production
    const protocol = window.location.protocol
    const host = window.location.hostname
    const isLocalDev = host === 'localhost' || host === '127.0.0.1'

    // Enforce HTTPS in production (graceful redirect, non-blocking)
    if (!isLocalDev && protocol !== 'https:') {
      console.warn('[WelcomeScreen] OAuth over HTTP detected - redirecting to HTTPS for security')
      window.location.href = `https://${window.location.host}${window.location.pathname}`
      return
    }

    // Sprint 20 Phase 0: Check backend availability
    if (backendAvailable === true) {
      // Backend available: Use Authorization Code Flow via Netlify Function
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setErrorDialog({
          open: true,
          title: 'Configuration Error',
          message: 'Google Client ID is not configured. Please check your environment variables.'
        })
        return
      }

      // Sprint 27: Environment-based redirect URI for staging/production separation
      // Google OAuth requires pre-registered redirect URIs in Google Cloud Console
      //
      // Configuration via VITE_OAUTH_REDIRECT_URI environment variable:
      // - Local dev: http://localhost:8888/.netlify/functions/auth-callback
      // - Staging: https://ritemark.netlify.app/.netlify/functions/auth-callback
      // - Production: https://rm.productory.ai/.netlify/functions/auth-callback
      //
      // Fallback hierarchy: env var → local dev → staging (safe default)
      const fixedRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI ||
        (isLocalDev
          ? 'http://localhost:8888/.netlify/functions/auth-callback'
          : 'https://ritemark.netlify.app/.netlify/functions/auth-callback' // Staging fallback
        )

      const scope = 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'

      // Encode return destination in state (where to redirect after OAuth)
      const nonce = crypto.randomUUID()  // Generate nonce for CSRF protection

      // Sprint 22 Security: Store nonce in sessionStorage for client-side validation
      sessionStorage.setItem('oauth_nonce', nonce)

      const state = {
        origin: window.location.origin,  // Local dev or production origin
        returnPath: '/app',              // Ensure the SPA route, not landing page
        nonce,                           // CSRF protection
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

      window.location.href = authUrl.toString()
    } else {
      // Backend unavailable: Fall back to browser-only OAuth (Sprint 19)

      if (!tokenClient) {
        setErrorDialog({
          open: true,
          title: 'Authentication Not Ready',
          message: 'The authentication system is still loading. Please wait a moment and try again.',
          onRetry: () => {
            setErrorDialog({ open: false, message: '' })
            // Retry after a short delay
            setTimeout(() => handleSignIn(), 1000)
          }
        })
        return
      }
      tokenClient.requestAccessToken() // Opens Google OAuth popup
    }
  }

  return (
    <>
    <Dialog open={true} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent
        className="max-w-md border-none shadow-2xl welcome-dialog"
        hideCloseButton={!onCancel}
        onPointerDownOutside={(e) => !onCancel && e.preventDefault()}
        onEscapeKeyDown={(e) => !onCancel && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to RiteMark</DialogTitle>
        </DialogHeader>

        <div className="text-center px-2 py-4">
          {/* Logo */}
          <div className="mb-10">
            <div className="logo-container mx-auto mb-6">
              <div className="logo-mark">
                <span className="logo-text">RM</span>
              </div>
            </div>
            <h1 className="brand-title">RiteMark</h1>

            {/* Welcome message for authenticated users */}
            {isAuthenticated && user && (
              <p className="welcome-message">
                Welcome back, {user.name?.split(' ')[0] || 'User'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={onNewDocument}
                  size="lg"
                  className="w-full gap-3 action-button action-button-primary"
                >
                  <FileText className="h-5 w-5" />
                  New Document
                </Button>

                <Button
                  onClick={onOpenFromDrive}
                  variant="outline"
                  size="lg"
                  className="w-full gap-3 action-button action-button-secondary"
                >
                  <FolderOpen className="h-5 w-5" />
                  Open from Drive
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSignIn}
                size="lg"
                className="w-full gap-3 action-button action-button-primary"
              >
                <LogIn className="h-5 w-5" />
                Sign in with Google
              </Button>
            )}
          </div>

          {/* Cancel button */}
          {onCancel && (
            <div className="mt-8">
              <button
                onClick={onCancel}
                className="cancel-link"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <AuthErrorDialog
      open={errorDialog.open}
      onClose={() => setErrorDialog({ open: false, message: '' })}
      onRetry={errorDialog.onRetry}
      title={errorDialog.title}
      message={errorDialog.message}
      error={errorDialog.error}
    />
    </>
  )
}
