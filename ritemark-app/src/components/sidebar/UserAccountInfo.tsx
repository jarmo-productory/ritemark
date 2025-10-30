import { useContext } from 'react'
import { User, CheckCircle } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { AuthContext } from '@/contexts/AuthContext'

/**
 * User Account Info Component (Simplified)
 *
 * Shows user profile in sidebar. Click to sign out.
 */
export function UserAccountInfo() {
  const authContext = useContext(AuthContext)
  const { user, isAuthenticated, logout } = authContext || {}

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  const handleUserClick = () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out?')
    if (confirmLogout && logout) {
      logout()
    }
  }

  return (
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
  )
}
