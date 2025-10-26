/**
 * DocumentMenu Component
 * Sprint 17: Version History Link
 *
 * Kebab menu (⋮) for document-level actions in the header.
 * Initially contains "View Version History" menu item.
 */

import * as React from "react"
import { History, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VersionHistoryModal } from "@/components/version-history/VersionHistoryModal"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { restoreRevision } from "@/services/drive/revisions"

interface DocumentMenuProps {
  fileId: string | null
  disabled?: boolean
  onReloadFile?: () => Promise<void>
}

export function DocumentMenu({ fileId, disabled = false, onReloadFile }: DocumentMenuProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const { getAccessToken } = useAuth()

  // Fetch access token when modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      getAccessToken().then(token => {
        setAccessToken(token)
        if (!token) {
          toast.error('Authentication required', {
            description: 'Please sign in to view version history'
          })
        }
      })
    }
  }, [isModalOpen, getAccessToken])

  const handleVersionHistory = React.useCallback(() => {
    if (!fileId) {
      toast.error('No file open')
      return
    }

    setIsModalOpen(true)
  }, [fileId])

  // Handle restore operation
  const handleRestore = React.useCallback(async (revisionId: string) => {
    if (!fileId || !accessToken) {
      toast.error('Unable to restore', {
        description: 'Missing file ID or authentication token'
      })
      return
    }

    try {
      const result = await restoreRevision({
        fileId,
        revisionId,
        accessToken,
        onProgress: (status) => {
          if (status === 'fetching') {
            toast.loading('Fetching revision content...')
          } else if (status === 'restoring') {
            toast.loading('Restoring version...')
          }
        }
      })

      if (result.success) {
        toast.success('Version restored successfully!', {
          description: 'The file has been updated with the selected version.'
        })

        // Reload file content from Drive to show restored version
        if (onReloadFile) {
          await onReloadFile()
        }
      } else {
        toast.error('Failed to restore version', {
          description: result.error || 'An unknown error occurred'
        })
      }
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('Failed to restore version', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  }, [fileId, accessToken])

  // Keyboard shortcut: Cmd/Ctrl+Shift+H
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault()
        handleVersionHistory()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleVersionHistory])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Document actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleVersionHistory}
            disabled={!fileId}
          >
            <History className="mr-2 h-4 w-4" />
            View Version History
            <span className="ml-auto text-xs tracking-widest opacity-60">
              ⌘⇧H
            </span>
          </DropdownMenuItem>

          {/* Future menu items can be added here */}
        </DropdownMenuContent>
      </DropdownMenu>

      <VersionHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fileId={fileId}
        accessToken={accessToken}
        onRestore={handleRestore}
      />
    </>
  )
}
