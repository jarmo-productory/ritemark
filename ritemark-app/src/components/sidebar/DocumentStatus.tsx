import { useMemo, useState, useEffect } from 'react'
import { Check, Loader2, AlertCircle, CloudOff, FileText, FolderOpen } from 'lucide-react'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import type { DriveSyncStatus } from '@/types/drive'

interface DocumentStatusProps {
  documentTitle: string
  syncStatus: DriveSyncStatus
  onNewDocument?: () => void
  onOpenFromDrive?: () => void
}

export function DocumentStatus({ documentTitle, syncStatus, onNewDocument, onOpenFromDrive }: DocumentStatusProps) {
  const [showSyncedStatus, setShowSyncedStatus] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)

  // Auto-hide "synced" status after 3 seconds
  useEffect(() => {
    if (syncStatus.status === 'synced' && syncStatus.lastSaved) {
      setShowSyncedStatus(true)
      const timer = setTimeout(() => {
        setShowSyncedStatus(false)
      }, 3000) // Hide after 3 seconds

      return () => clearTimeout(timer)
    } else {
      setShowSyncedStatus(true) // Show other statuses immediately
    }
  }, [syncStatus.status, syncStatus.lastSaved])

  const statusDisplay = useMemo(() => {
    const { status, lastSaved, error } = syncStatus

    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="animate-spin" />,
          text: 'Saving...',
          textColor: 'text-blue-600',
        }

      case 'synced': {
        if (!lastSaved || !showSyncedStatus) return null
        const timeAgo = formatTimeAgo(lastSaved)
        return {
          icon: <Check />,
          text: `Saved ${timeAgo}`,
          textColor: 'text-green-600',
        }
      }

      case 'error':
        // Don't show authentication errors in status badge - they need user action (dialog)
        if (error?.includes('Not authenticated') || error?.includes('authentication')) {
          return null
        }
        return {
          icon: <AlertCircle />,
          text: error || 'Save failed',
          textColor: 'text-red-600',
        }

      case 'offline':
        return {
          icon: <CloudOff />,
          text: 'Offline',
          textColor: 'text-gray-500',
        }

      default:
        return null
    }
  }, [syncStatus, showSyncedStatus])

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setShowWelcomeDialog(true)}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {isHovered ? <FolderOpen className="size-4" /> : <FileText className="size-4" />}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{documentTitle}</span>
              {statusDisplay && (
                <span className={`flex items-center gap-1 text-xs ${statusDisplay.textColor}`}>
                  {statusDisplay.icon}
                  <span className="truncate">{statusDisplay.text}</span>
                </span>
              )}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {showWelcomeDialog && (
        <WelcomeScreen
          onNewDocument={() => {
            setShowWelcomeDialog(false)
            onNewDocument?.()
          }}
          onOpenFromDrive={() => {
            setShowWelcomeDialog(false)
            onOpenFromDrive?.()
          }}
          onCancel={() => {
            setShowWelcomeDialog(false)
          }}
        />
      )}
    </>
  )
}

function formatTimeAgo(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 5) return 'just now'
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
