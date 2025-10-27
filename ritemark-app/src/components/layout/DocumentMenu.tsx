/**
 * DocumentMenu Component
 * Sprint 17: Version History Link
 *
 * Kebab menu (⋮) for document-level actions in the header.
 * Initially contains "View Version History" menu item.
 */

import * as React from "react"
import { History, MoreVertical, Copy, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { VersionHistoryModal } from "@/components/version-history/VersionHistoryModal"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { restoreRevision } from "@/services/drive/revisions"
import { copyFormattedContent } from "@/utils/clipboard"
import { exportToWord } from "@/services/export/wordExport"
import { downloadMarkdown } from "@/utils/download"
import type { Editor as TipTapEditor } from '@tiptap/react'

interface DocumentMenuProps {
  fileId: string | null
  disabled?: boolean
  onReloadFile?: () => Promise<void>
  content: string
  editor: TipTapEditor | null
  documentTitle: string
  authorName?: string
}

export function DocumentMenu({ fileId, disabled = false, onReloadFile, content, editor, documentTitle, authorName }: DocumentMenuProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const { getAccessToken } = useAuth()

  // Fetch access token when modal opens
  React.useEffect(() => {
    if (isModalOpen && getAccessToken) {
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

  const handleCopyToClipboard = React.useCallback(async () => {
    if (!editor) {
      toast.error('Editor not ready')
      return
    }

    try {
      // Get HTML from TipTap editor
      const html = editor.getHTML()

      // Use existing markdown (already converted by TurndownService)
      const markdown = content

      // Copy both formats to clipboard
      const result = await copyFormattedContent(html, markdown)

      if (result.success) {
        toast.success('Copied to clipboard!', {
          description: `"${documentTitle}" ready to paste`
        })
      } else {
        toast.error('Failed to copy', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Copy failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [editor, content, documentTitle])

  const handleExportWord = React.useCallback(async () => {
    if (!content) {
      toast.error('No content to export')
      return
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Preparing Word document...')

      // Get JSON content from TipTap editor
      if (!editor) {
        toast.dismiss(loadingToast)
        toast.error('Editor not ready')
        return
      }

      const jsonContent = editor.getJSON()
      const result = await exportToWord(jsonContent, {
        documentTitle: documentTitle,
        author: authorName,
        createdAt: new Date().toISOString()
      })

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      if (result.success) {
        toast.success('Exported to Word!', {
          description: `${documentTitle}.docx downloaded`
        })
      } else {
        toast.error('Export failed', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [editor, content, documentTitle, authorName])

  const handleDownloadMarkdown = React.useCallback(() => {
    if (!content) {
      toast.error('No content to download')
      return
    }

    try {
      downloadMarkdown(content, documentTitle)
      toast.success('Markdown downloaded!', {
        description: `${documentTitle}.md`
      })
    } catch (error) {
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [content, documentTitle])

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

  // Keyboard shortcut: Cmd/Ctrl+Shift+H for Version History
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

  // Keyboard shortcut: Cmd/Ctrl+Shift+C for Copy to Clipboard
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault()
        handleCopyToClipboard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCopyToClipboard])

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

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleCopyToClipboard}
            disabled={!editor}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
            <span className="ml-auto text-xs tracking-widest opacity-60">
              ⌘⇧C
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportWord}
            disabled={!content || !editor}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export as Word
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownloadMarkdown}
            disabled={!content}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download as Markdown
          </DropdownMenuItem>
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
