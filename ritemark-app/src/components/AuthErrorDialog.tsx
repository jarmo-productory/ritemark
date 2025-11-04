import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * Sprint 22 - UX Improvement
 *
 * Professional error dialog replacing browser alert() calls
 * Provides better error presentation with retry/dismiss actions
 */

interface AuthErrorDialogProps {
  open: boolean
  onClose: () => void
  onRetry?: () => void
  title?: string
  message: string
  error?: Error | unknown
}

export function AuthErrorDialog({
  open,
  onClose,
  onRetry,
  title = 'Authentication Error',
  message,
  error
}: AuthErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="space-y-3">
          <>
            <p className="text-sm text-foreground">{message}</p>

            {error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">Technical details</summary>
                <pre className="mt-2 rounded bg-muted p-2 overflow-x-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            )}
          </>
        </DialogDescription>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Dismiss
          </Button>
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              Retry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
