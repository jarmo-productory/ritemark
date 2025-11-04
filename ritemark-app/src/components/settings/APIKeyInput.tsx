/**
 * Shared API Key Input Component
 * Used in both Settings dialog and AI Chat Sidebar
 * Handles OpenAI API key entry with validation and encryption
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiKeyManager } from '@/services/ai/apiKeyManager'
import { Eye, EyeOff, Save } from 'lucide-react'

interface APIKeyInputProps {
  onKeySaved?: () => void
  inlineTip?: boolean
  showGetKeyLink?: boolean
}

export function APIKeyInput({ onKeySaved, inlineTip = false, showGetKeyLink = false }: APIKeyInputProps) {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setSaveMessage('Please enter an API key')
      return
    }

    if (!apiKey.startsWith('sk-')) {
      setSaveMessage('Invalid API key format (must start with sk-)')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      await apiKeyManager.storeAPIKey(apiKey)
      setApiKey('')
      setShowApiKey(false)
      setSaveMessage('API key saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)

      // Notify parent component
      onKeySaved?.()
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveApiKey()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="sk-..."
          className="flex-1"
          disabled={isSaving}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowApiKey(!showApiKey)}
          aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
        >
          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          onClick={handleSaveApiKey}
          disabled={!apiKey.trim() || isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {saveMessage && (
        <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {saveMessage}
        </p>
      )}

      {inlineTip && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> You can also manage your API key in Settings → General
          </p>
        </div>
      )}

      {showGetKeyLink && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Don't have an API key?
          </p>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Get one from OpenAI →
          </a>
        </div>
      )}
    </div>
  )
}
