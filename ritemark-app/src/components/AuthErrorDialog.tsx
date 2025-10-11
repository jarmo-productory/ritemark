import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthErrorDialogProps {
  isOpen: boolean
  onRetry: () => void
  onSignIn: () => void
}

export function AuthErrorDialog({ isOpen, onRetry, onSignIn }: AuthErrorDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-sm text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground">Session Expired</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session has expired. Please sign in again to continue saving.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onSignIn}
            size="lg"
            className="w-full gap-3"
          >
            <RefreshCw className="h-4 w-4" />
            Sign In Again
          </Button>

          <Button
            onClick={onRetry}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Retry Save
          </Button>
        </div>
      </div>
    </div>
  )
}
