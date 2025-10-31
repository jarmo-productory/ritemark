import { useContext, useState } from 'react'
import { User, CheckCircle } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
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
import { AuthContext } from '@/contexts/AuthContext'

/**
 * User Account Info Component with Beautiful Logout Dialog
 *
 * Shows user profile in sidebar. Click to open logout confirmation dialog.
 */
export function UserAccountInfo() {
  const authContext = useContext(AuthContext)
  const { user, isAuthenticated, logout } = authContext || {}
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  const handleUserClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogout = () => {
    setShowLogoutDialog(false)
    if (logout) {
      logout()
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={handleUserClick}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="size-8 rounded-lg object-cover"
                />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="size-3" />
                <span className="truncate">{user.email}</span>
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of RiteMark?</AlertDialogTitle>
            {/* User info display - moved outside AlertDialogDescription to fix HTML nesting */}
            <div className="flex items-center gap-3 mt-4 mb-2">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
            <AlertDialogDescription>
              You'll need to sign in again to access your documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
