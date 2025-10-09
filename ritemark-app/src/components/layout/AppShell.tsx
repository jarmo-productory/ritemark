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
import { EditableTitle } from "@/components/EditableTitle"
import type { DriveSyncStatus } from "@/types/drive"
import type { Editor as TipTapEditor } from '@tiptap/react'

interface AppShellProps {
  children?: React.ReactNode
  documentTitle: string
  syncStatus: DriveSyncStatus
  editor?: TipTapEditor | null
  hasDocument?: boolean
  onNewDocument?: () => void
  onOpenFromDrive?: () => void
  onRenameDocument?: (newTitle: string) => void
}

export function AppShell({ children, documentTitle, syncStatus, editor, hasDocument, onNewDocument, onOpenFromDrive, onRenameDocument }: AppShellProps) {
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
        <header className="sticky top-0 z-[5] flex h-16 shrink-0 items-center gap-2 px-4 bg-background border-b">
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
