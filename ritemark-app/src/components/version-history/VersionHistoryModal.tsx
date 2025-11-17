import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RevisionList } from './RevisionList'
import { RevisionPreview } from './RevisionPreview'
import { RestoreConfirmDialog } from './RestoreConfirmDialog'

interface DriveRevision {
  id: string
  modifiedTime: string
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  size?: string
}

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  getAccessToken: () => Promise<string | null>
  onRestore?: (revisionId: string) => Promise<void>
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  fileId,
  getAccessToken,
  onRestore,
}: VersionHistoryModalProps) {
  const [revisions, setRevisions] = useState<DriveRevision[]>([])
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [revisionToRestore, setRevisionToRestore] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !fileId || !getAccessToken) {
      return
    }

    let isMounted = true

    const fetchRevisions = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch fresh access token (handles expiration/refresh automatically)
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('Authentication required')
        }

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id,modifiedTime,lastModifyingUser,size)`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to load version history')
        }

        const data = await response.json()
        if (isMounted) {
          // Sort revisions by modifiedTime descending (newest first)
          const sortedRevisions = (data.revisions || []).sort((a: any, b: any) =>
            new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
          )
          setRevisions(sortedRevisions)
          if (sortedRevisions.length > 0) {
            setSelectedRevisionId(sortedRevisions[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch revisions:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load version history')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchRevisions()

    return () => {
      isMounted = false
    }
  }, [isOpen, fileId, getAccessToken])

  const handleRestoreRequest = (revisionId: string) => {
    setRevisionToRestore(revisionId)
    setShowRestoreConfirm(true)
  }

  const handleRestoreConfirm = async () => {
    if (!revisionToRestore || !onRestore) return

    try {
      await onRestore(revisionToRestore)
      setShowRestoreConfirm(false)
      setRevisionToRestore(null)
      onClose()
    } catch (err) {
      console.error('Failed to restore revision:', err)
      setError(err instanceof Error ? err.message : 'Failed to restore version')
      setShowRestoreConfirm(false)
      setRevisionToRestore(null)
    }
  }

  const handleRestoreCancel = () => {
    setShowRestoreConfirm(false)
    setRevisionToRestore(null)
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
  }

  const selectedRevision = revisions.find((r) => r.id === selectedRevisionId)
  const revisionTimestamp = selectedRevision
    ? new Date(selectedRevision.modifiedTime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : ''

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of your document
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-1 overflow-hidden">
            <div className="w-80 border-r overflow-y-auto">
              <RevisionList
                revisions={revisions}
                selectedId={selectedRevisionId}
                onSelect={setSelectedRevisionId}
                loading={loading}
                error={error}
                onRetry={handleRetry}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <RevisionPreview
                fileId={fileId}
                revisionId={selectedRevisionId}
                getAccessToken={getAccessToken}
                onRestore={handleRestoreRequest}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RestoreConfirmDialog
        isOpen={showRestoreConfirm}
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
        revisionTimestamp={revisionTimestamp}
      />
    </>
  )
}
