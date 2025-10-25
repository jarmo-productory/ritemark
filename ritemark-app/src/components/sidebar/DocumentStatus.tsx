import { useState } from 'react'
import { FileText, FolderOpen } from 'lucide-react'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import type { DriveSyncStatus } from '@/types/drive'

interface DocumentStatusProps {
  documentTitle: string
  syncStatus: DriveSyncStatus
  onNewDocument?: () => void
  onOpenFromDrive?: () => void
}

export function DocumentStatus({ documentTitle, onNewDocument, onOpenFromDrive }: DocumentStatusProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)

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
