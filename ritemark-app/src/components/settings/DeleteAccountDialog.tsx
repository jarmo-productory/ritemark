/**
 * Delete Account Confirmation Dialog
 * GDPR Article 17: Right to Erasure
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAccountDialog({ open, onOpenChange, onConfirm }: DeleteAccountDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              This action cannot be undone. This will permanently delete your account and remove
              your data from our servers.
            </p>

            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">What will be deleted:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All your settings and preferences</li>
                <li>API usage history and rate limit data</li>
                <li>Your Google Drive AppData settings file</li>
                <li>Your authentication session</li>
              </ul>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">What will NOT be deleted:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your Google account (remains intact)</li>
                <li>Documents saved to Google Drive (you still own them)</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete my account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
