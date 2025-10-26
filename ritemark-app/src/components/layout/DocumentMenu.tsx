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
import { openVersionHistory } from "@/services/drive/versionHistory"
import { toast } from "sonner"

interface DocumentMenuProps {
  fileId: string | null
  disabled?: boolean
}

export function DocumentMenu({ fileId, disabled = false }: DocumentMenuProps) {
  const handleVersionHistory = React.useCallback(() => {
    if (!fileId) {
      toast.error('No file open')
      return
    }

    try {
      openVersionHistory({
        fileId,
        onError: (error) => {
          toast.error('Could not open file in Drive', {
            description: error.message
          })
        }
      })

      // Show helpful toast with instructions
      toast.info('Opening file in Drive', {
        description: 'Use File → Version History or press Cmd/Ctrl+Alt+Shift+H'
      })
    } catch (error) {
      toast.error('Failed to open file in Drive')
    }
  }, [fileId])

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
  )
}
