/**
 * User Account Info Component with Settings & Account Dialog
 *
 * Shows user profile in sidebar. Click to open comprehensive Settings & Account dialog.
 * Repurposed from simple logout dialog (Sprint 21 Phase 0)
 */

import { useContext, useState, useCallback } from 'react'
import { User, CheckCircle } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AuthContext } from '@/contexts/AuthContext'
import { useSettings } from '@/hooks/useSettings'
import { UserProfileSection } from '@/components/settings/UserProfileSection'
import { GeneralSettingsSection } from '@/components/settings/GeneralSettingsSection'
import { PrivacyDataSection } from '@/components/settings/PrivacyDataSection'
import type { UserSettings } from '@/types/settings'

/**
 * UserAccountInfo Component
 *
 * Single entrypoint for Settings & Account dialog (bottom left sidebar)
 * Replaces the old simple logout AlertDialog
 */
export function UserAccountInfo() {
  const authContext = useContext(AuthContext)
  const { user, isAuthenticated, logout } = authContext || {}
  const { settings, saveSettings, syncing } = useSettings()
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  const handleUserClick = () => {
    setShowSettingsDialog(true)
  }

  const handleLogout = () => {
    setShowSettingsDialog(false)
    if (logout) {
      logout()
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // TODO: Call delete-account Netlify function in Phase 5
      console.log('[UserAccountInfo] Delete account for user:', user.sub)
      alert('Account deletion feature coming in Phase 5')

      // For now, just logout
      if (logout) {
        logout()
      }
    } catch (error) {
      console.error('[UserAccountInfo] Account deletion failed:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  /**
   * Handle setting changes with dot-notation path
   * Example: 'preferences.theme' -> settings.preferences.theme = value
   *
   * Sprint 25: Fixed settings initialization when null (browser key mismatch scenario)
   * If settings are null (deleted due to encryption mismatch), initialize with defaults
   */
  const handleSettingChange = useCallback(
    async (path: string, value: any) => {
      try {
        // Initialize settings if null (happens after encryption key mismatch)
        let baseSettings: UserSettings
        if (!settings) {
          console.warn('[UserAccountInfo] Settings are null, initializing with defaults')
          baseSettings = {
            userId: user?.sub || '',
            timestamp: Date.now(),
            version: 1,
            preferences: {
              theme: 'system',
              fontSize: 16,
              fontFamily: 'Inter',
              autoSave: true,
              autoSaveInterval: 3,
            },
          }
        } else {
          baseSettings = JSON.parse(JSON.stringify(settings)) as UserSettings
        }

        // Parse dot-notation path (e.g., 'preferences.theme')
        const keys = path.split('.')

        // Navigate to the nested property and set value
        let current: any = baseSettings
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (!current[key]) {
            current[key] = {}
          }
          current = current[key]
        }
        current[keys[keys.length - 1]] = value

        // Update timestamp for conflict resolution
        baseSettings.timestamp = Date.now()

        // Save settings (triggers sync to Drive AppData)
        await saveSettings(baseSettings)

        console.log(`[UserAccountInfo] Setting updated: ${path} =`, value)
      } catch (error) {
        console.error('[UserAccountInfo] Failed to update setting:', error)
        alert('Failed to save setting. Please try again.')
      }
    },
    [settings, saveSettings, user]
  )

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

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-[560px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Settings & Account</DialogTitle>
            <DialogDescription>
              Manage your preferences, API keys, and account settings
            </DialogDescription>
          </DialogHeader>

          {/* User Profile Section */}
          <UserProfileSection user={user} />

          {/* General Settings Section */}
          <GeneralSettingsSection settings={settings} onSettingChange={handleSettingChange} />

          {/* Privacy & Data Section */}
          <PrivacyDataSection userId={user.sub || ''} onDeleteAccount={handleDeleteAccount} />

          {/* Footer Actions */}
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout} disabled={syncing}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
