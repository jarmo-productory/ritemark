import { useContext } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DocumentStatus } from "@/components/sidebar/DocumentStatus"
import { TableOfContentsNav } from "@/components/sidebar/TableOfContentsNav"
import { UserAccountInfo } from "@/components/sidebar/UserAccountInfo"
import { AuthContext } from "@/contexts/AuthContext"
import type { DriveSyncStatus } from "@/types/drive"
import type { Editor as TipTapEditor } from '@tiptap/react'

interface AppSidebarProps {
  documentTitle: string
  syncStatus: DriveSyncStatus
  editor?: TipTapEditor | null
  hasDocument?: boolean
  content?: string
  onNewDocument?: () => void
  onOpenFromDrive?: () => void
}

export function AppSidebar({ documentTitle, syncStatus, editor, hasDocument, content, onNewDocument, onOpenFromDrive }: AppSidebarProps) {
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false

  // Show minimal sidebar when not authenticated (sign-in moved to WelcomeScreen)
  if (!isAuthenticated) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-sm font-bold">RM</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">RiteMark</span>
                    <span className="truncate text-xs">v1.0.0</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent />
        <SidebarFooter />
      </Sidebar>
    )
  }

  // Show full sidebar when authenticated
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {hasDocument ? (
          <DocumentStatus documentTitle={documentTitle} syncStatus={syncStatus} onNewDocument={onNewDocument} onOpenFromDrive={onOpenFromDrive} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-sm font-bold">RM</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">RiteMark</span>
                    <span className="truncate text-xs">v1.0.0</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Contents</SidebarGroupLabel>
          <SidebarGroupContent>
            <TableOfContentsNav editor={editor} content={content} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserAccountInfo />
      </SidebarFooter>
    </Sidebar>
  )
}
