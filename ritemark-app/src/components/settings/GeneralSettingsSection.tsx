/**
 * General Settings Section
 * Auto-open last file toggle and keyboard shortcuts
 */

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { UserSettings } from '@/types/settings'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'

interface GeneralSettingsSectionProps {
  settings: UserSettings | null
  onSettingChange: (path: string, value: any) => void
}

export function GeneralSettingsSection({ settings, onSettingChange }: GeneralSettingsSectionProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const autoOpenLastFile = settings?.preferences?.autoOpenLastFile ?? true

  return (
    <>
      <div className="space-y-4 pt-6 pb-6 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">General</h3>

        {/* Auto-open last file toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-open">Pick up where you left off</Label>
            <p className="text-sm text-muted-foreground">
              Automatically open your last edited file
            </p>
          </div>
          <Switch
            id="auto-open"
            checked={autoOpenLastFile}
            onCheckedChange={(checked) => onSettingChange('preferences.autoOpenLastFile', checked)}
          />
        </div>

        {/* Keyboard shortcuts */}
        <div className="flex items-center justify-between">
          <Label>Keyboard shortcuts</Label>
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            View shortcuts
          </Button>
        </div>
      </div>

      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
