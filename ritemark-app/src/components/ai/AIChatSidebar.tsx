import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { executeCommand } from '@/services/ai/openAIClient'
import { apiKeyManager, API_KEY_CHANGED_EVENT, type APIKeyChangedEvent } from '@/services/ai/apiKeyManager'
import { APIKeyInput } from '@/components/settings/APIKeyInput'
import { SendHorizontal, RotateCcw, Key } from 'lucide-react'

interface AIChatSidebarProps {
  editor: Editor
  fileId?: string | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIChatSidebar({ editor, fileId }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // API key state
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)

  // Check for API key on mount and listen for changes
  useEffect(() => {
    let mounted = true

    const checkApiKey = async () => {
      try {
        const hasKey = await apiKeyManager.hasAPIKey()
        if (mounted) {
          setHasApiKey(hasKey)
        }
      } catch (error) {
        console.error('[AIChatSidebar] Failed to check API key:', error)
        if (mounted) {
          setHasApiKey(false)
        }
      }
    }

    // Initial check
    checkApiKey()

    // Listen for API key changes (from Settings dialog or inline)
    const handleKeyChange = (event: Event) => {
      const { hasKey } = (event as APIKeyChangedEvent).detail
      if (mounted) {
        setHasApiKey(hasKey)
      }
    }

    window.addEventListener(API_KEY_CHANGED_EVENT, handleKeyChange)

    return () => {
      mounted = false
      window.removeEventListener(API_KEY_CHANGED_EVENT, handleKeyChange)
    }
  }, [])

  // Reset chat when document changes (fileId changes)
  useEffect(() => {
    setMessages([])
    setInput('')
  }, [fileId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessageContent = input.trim()

    // Add user message to history immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // Clear input immediately
    setInput('')
    setIsLoading(true)

    // Execute AI command
    const result = await executeCommand(userMessageContent, editor)

    // Add AI response to history
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: result.success
        ? `✅ ${result.message}`
        : `❌ ${result.error}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, aiMessage])
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setInput('')
  }

  const handleKeySaved = () => {
    // Event system will update hasApiKey state automatically
    // No need to manually call setHasApiKey(true)
  }

  // Show loading state while checking for API key
  if (hasApiKey === null) {
    return (
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  // Show API key input if no key exists
  if (!hasApiKey) {
    return (
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l bg-background flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your OpenAI API key to get started
          </p>
        </div>

        {/* API Key Input */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">OpenAI API Key</label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Your key will be stored securely with AES-256-GCM encryption
              </p>
              <APIKeyInput onKeySaved={handleKeySaved} inlineTip showGetKeyLink />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal chat interface (hasApiKey === true)
  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask me to edit your document</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              aria-label="Reset chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area - Scrolls from bottom */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <p>👋 Try commands like:</p>
            <p className="mt-2 text-xs">"replace hello with goodbye"</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command... (e.g., 'replace hello with goodbye')"
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
