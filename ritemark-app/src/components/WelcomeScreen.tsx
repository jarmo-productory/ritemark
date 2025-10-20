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


  // Initialize Google OAuth token client (same logic as AuthModal)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const initTokenClient = () => {
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          callback: async (tokenResponse: { access_token?: string; error?: string; error_description?: string; expires_in?: number; scope?: string; token_type?: string }) => {
            if (tokenResponse.access_token) {
              try {
                // Fetch user info from Google API
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                })
                const userInfo = await userInfoResponse.json()

                const userData: GoogleUser = {
                  id: userInfo.id,
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture,
                  verified_email: userInfo.verified_email,
                  emailVerified: userInfo.verified_email,
                }

                // Store user data in sessionStorage
                sessionStorage.setItem('ritemark_user', JSON.stringify(userData))

                // Store OAuth tokens in sessionStorage
                sessionStorage.setItem('ritemark_oauth_tokens', JSON.stringify({
                  access_token: tokenResponse.access_token,
                  accessToken: tokenResponse.access_token,
                  expires_in: tokenResponse.expires_in,
                  scope: tokenResponse.scope,
                  token_type: tokenResponse.token_type,
                  tokenType: 'Bearer',
                  expiresAt: Date.now() + ((tokenResponse.expires_in || 3600) * 1000),
                }))

                setAccessTokenReceived(true)
              } catch {
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

  // Reload page after authentication complete (same as AuthModal)
  useEffect(() => {
    if (accessTokenReceived) {
      window.location.reload()
    }
  }, [accessTokenReceived])

  const handleSignIn = () => {
    if (!tokenClient) {
      alert('Authentication not ready. Please refresh the page.')
      return
    }
    tokenClient.requestAccessToken() // Opens Google OAuth popup
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
