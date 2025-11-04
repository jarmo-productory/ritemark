/**
 * General Settings Section
 * Auto-open last file toggle, keyboard shortcuts, and OpenAI API key management
 */

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserSettings } from '@/types/settings'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { APIKeyInput } from './APIKeyInput'
import { apiKeyManager } from '@/services/ai/apiKeyManager'
import { Trash2 } from 'lucide-react'

interface GeneralSettingsSectionProps {
  settings: UserSettings | null
  onSettingChange: (path: string, value: any) => void
}

export function GeneralSettingsSection({ settings, onSettingChange }: GeneralSettingsSectionProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [maskedKey, setMaskedKey] = useState<string | null>(null)

  const autoOpenLastFile = settings?.preferences?.autoOpenLastFile ?? true

  // Load masked API key on mount
  useEffect(() => {
    const loadMaskedKey = async () => {
      const masked = await apiKeyManager.getMaskedKey()
      setMaskedKey(masked)
    }
    loadMaskedKey()
  }, [])

  const handleKeySaved = async () => {
    // Reload masked key after successful save
    const masked = await apiKeyManager.getMaskedKey()
    setMaskedKey(masked)
  }

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your OpenAI API key?')) {
      return
    }

    try {
      await apiKeyManager.deleteAPIKey()
      setMaskedKey(null)
      setApiKey('')
      setSaveMessage('API key deleted successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to delete API key')
    }
  }

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

        {/* OpenAI API Key */}
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <p className="text-sm text-muted-foreground">
            Your API key is stored securely with AES-256-GCM encryption
          </p>

          {maskedKey ? (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={maskedKey}
                disabled
                className="flex-1 bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteApiKey}
                aria-label="Delete API key"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <APIKeyInput onKeySaved={handleKeySaved} />
          )}
        </div>
      </div>

      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
