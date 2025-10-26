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

interface RestoreConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  revisionTimestamp: string
}

export function RestoreConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  revisionTimestamp,
}: RestoreConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore to version from {revisionTimestamp}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace the current content with the selected version.
            You can always restore to a different version if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Restore</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
