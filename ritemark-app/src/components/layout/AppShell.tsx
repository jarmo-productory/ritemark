import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { EditableTitle } from "@/components/EditableTitle"
import { DocumentMenu } from "@/components/layout/DocumentMenu"
import { useDriveSharing } from "@/hooks/useDriveSharing"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { Share2, Loader2, Cloud, CloudOff } from "lucide-react"
import { toast } from "sonner"
import type { DriveSyncStatus } from "@/types/drive"
import type { Editor as TipTapEditor } from '@tiptap/react'

interface AppShellProps {
  children?: React.ReactNode
  documentTitle: string
  fileId: string | null
  syncStatus: DriveSyncStatus
  editor?: TipTapEditor | null
  hasDocument?: boolean
  onNewDocument?: () => void
  onOpenFromDrive?: () => void
  onRenameDocument?: (newTitle: string) => void
}

export function AppShell({ children, documentTitle, fileId, syncStatus, editor, hasDocument, onNewDocument, onOpenFromDrive, onRenameDocument }: AppShellProps) {
  // Sprint 16: Network Status hook
  const { isOnline, isChecking } = useNetworkStatus()
  const [prevIsOnline, setPrevIsOnline] = React.useState(isOnline)

  // Sprint 16: Toast notifications on network status change
  React.useEffect(() => {
    if (!isOnline && prevIsOnline) {
      toast.warning("Working offline", {
        description: "Changes will sync when you're back online"
      })
    } else if (isOnline && !prevIsOnline) {
      toast.success("Back online", {
        description: "Syncing changes..."
      })
    }
    setPrevIsOnline(isOnline)
  }, [isOnline, prevIsOnline])

  // Sprint 15: Share Button hook
  const { handleShare, isSharing } = useDriveSharing(fileId, {
    onSuccess: () => {
      toast.success('Opening file in Drive')
    },
    onError: (error) => {
      toast.error('Failed to open file in Drive', {
        description: error.message
      })
    }
  })

  return (
    <SidebarProvider
      style={{
        ["--sidebar-width" as string]: "19rem",
        ["--sidebar-width-icon" as string]: "3rem",
      }}
    >
      <AppSidebar
        documentTitle={documentTitle}
        syncStatus={syncStatus}
        editor={editor}
        hasDocument={hasDocument}
        onNewDocument={onNewDocument}
        onOpenFromDrive={onOpenFromDrive}
      />
      <SidebarInset>
        <header className="sticky top-0 z-[5] flex h-16 shrink-0 items-center justify-between gap-2 px-4 bg-background border-b">
          {/* Left side: Sidebar trigger + Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    RiteMark
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {hasDocument && onRenameDocument ? (
                      <EditableTitle
                        title={documentTitle}
                        onRename={onRenameDocument}
                        className="text-foreground"
                      />
                    ) : (
                      documentTitle
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side: Status Indicator + Share Button */}
          <div className="flex items-center gap-3">
            {/* Sprint 16: Offline Status Indicator */}
            <div className="flex items-center gap-1.5 text-sm" role="status" aria-live="polite" aria-atomic="true">
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 text-orange-600 animate-spin" aria-hidden="true" />
                  <span className="hidden sm:inline text-orange-600">Reconnecting...</span>
                </>
              ) : !isOnline ? (
                <>
                  <CloudOff className="h-4 w-4 text-red-600" aria-hidden="true" />
                  <span className="hidden sm:inline text-red-600">Offline</span>
                </>
              ) : syncStatus.status === 'saving' ? (
                <>
                  <Cloud className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span className="hidden sm:inline text-blue-600">Saving...</span>
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 text-green-600" aria-hidden="true" />
                  <span className="hidden sm:inline text-green-600">Saved</span>
                </>
              )}
            </div>

            {/* Sprint 15: Share Button */}
            <Button
              onClick={handleShare}
              disabled={!fileId || isSharing || !isOnline}
              variant="default"
              size="sm"
              className="gap-2"
              aria-label={
                !fileId
                  ? "No document to share"
                  : !isOnline
                  ? "Cannot share while offline"
                  : "Share document with others"
              }
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Sprint 17: Document Menu (Kebab menu) */}
            <DocumentMenu fileId={fileId} disabled={!isOnline} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children || (
            <>
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
