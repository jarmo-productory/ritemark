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

  const { backendAvailable } = useBackendHealth()
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

  // Initialize Google OAuth token client (browser-only fallback)
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
   * Dual flow architecture:
   * - Backend OAuth (authorization code flow) when backend available
   * - Browser-only OAuth (implicit flow) for preview deploys
   */
  const handleSignIn = () => {
    const protocol = window.location.protocol
    const host = window.location.hostname
    const isLocalDev = host === 'localhost' || host === '127.0.0.1'

    if (!isLocalDev && protocol !== 'https:') {
      console.warn('[WelcomeScreen] OAuth over HTTP - redirecting to HTTPS')
      window.location.href = `https://${window.location.host}${window.location.pathname}`
      return
    }

    if (backendAvailable === true) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setErrorDialog({
          open: true,
          title: 'Configuration Error',
          message: 'Google Client ID is not configured. Please check your environment variables.'
        })
        return
      }

      // OAuth redirect URI from environment variable (required for deployed environments)
      const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI

      if (!redirectUri && !isLocalDev) {
        console.error('[WelcomeScreen] VITE_OAUTH_REDIRECT_URI not set')
        setErrorDialog({
          open: true,
          title: 'Configuration Error',
          message: 'OAuth redirect URI not configured. Please contact support.',
          onRetry: () => setErrorDialog({ open: false, message: '' })
        })
        return
      }

      const fixedRedirectUri = redirectUri || 'http://localhost:8888/.netlify/functions/auth-callback'

      const scope = 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'

      const nonce = crypto.randomUUID()
      sessionStorage.setItem('oauth_nonce', nonce)

      const state = {
        origin: window.location.origin,
        returnPath: '/app',
        nonce,
        ts: Date.now()
      }

      // Base64URL encode state
      const stateEncoded = btoa(JSON.stringify(state))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', fixedRedirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', stateEncoded)

      window.location.href = authUrl.toString()
    } else {
      // Backend unavailable: browser-only OAuth fallback
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
