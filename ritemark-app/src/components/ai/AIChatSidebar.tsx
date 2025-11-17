import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { executeCommand, type ConversationMessage } from '@/services/ai/openAIClient'
import { apiKeyManager, API_KEY_CHANGED_EVENT, type APIKeyChangedEvent } from '@/services/ai/apiKeyManager'
import { APIKeyInput } from '@/components/settings/APIKeyInput'
import { SelectionIndicator } from '@/components/ai/SelectionIndicator'
import { WidgetRenderer } from '@/services/ai/widgets'
import type { ChatWidget, WidgetResult } from '@/services/ai/widgets'
import { SendHorizontal, RotateCcw, Replace, FilePlus, ChevronRight, Sparkles, Square } from 'lucide-react'
import type { EditorSelection } from '@/types/editor'
import { useAISidebar, resetAISidebarState } from '@/components/hooks/use-ai-sidebar'
import { cn } from '@/lib/utils'
import { AILogoIcon } from '@/components/AILogoIcon'

interface AIChatSidebarProps {
  editor: Editor
  fileId?: string | null
  liveSelection?: EditorSelection
  persistedSelection?: EditorSelection
  onClearSelection?: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolType?: 'replace' | 'insert' // Tool type for visual indicators
  widget?: ChatWidget  // Interactive widget (instead of immediate execution)
}

// Shared Header Component
const SidebarHeader = ({
  hasApiKey,
  messagesCount,
  onToggle,
  onClearChat
}: {
  hasApiKey: boolean
  messagesCount: number
  onToggle: () => void
  onClearChat?: () => void
}) => (
  <div className="border-b p-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          aria-label={hasApiKey ? "Collapse AI Assistant. Press Ctrl+Shift+A to toggle." : "Collapse AI Assistant"}
          title="Collapse sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-semibold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            {hasApiKey ? "Ask me to edit your document" : "Enter your OpenAI API key to get started"}
          </p>
        </div>
      </div>
      {hasApiKey && messagesCount > 0 && onClearChat && (
        <button
          onClick={onClearChat}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          aria-label="Reset chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
)

// Shared Collapsed Tab Component
const CollapsedTab = ({
  hasApiKey,
  messagesCount,
  hasSelection,
  onToggle
}: {
  hasApiKey: boolean
  messagesCount: number
  hasSelection: boolean
  onToggle: () => void
}) => (
  <button
    onClick={onToggle}
    className="w-full h-full flex flex-col items-center py-3 gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
    aria-label={
      hasApiKey
        ? `Expand AI Assistant. ${messagesCount} messages. ${hasSelection ? 'Text selected.' : ''} Press Ctrl+Shift+A to toggle.`
        : "Expand AI Assistant. No API key configured."
    }
    title="Expand AI Assistant (⌃⇧A)"
  >
    <div className="text-primary">
      <AILogoIcon size={24} />
    </div>

    {/* Selection Indicator (when text is selected) */}
    {hasApiKey && hasSelection && (
      <div className="w-6 h-6 text-amber-500 animate-pulse">
        <Sparkles />
      </div>
    )}
  </button>
)

export function AIChatSidebar({ editor, fileId, liveSelection, persistedSelection, onClearSelection }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousExpandedRef = useRef(false)

  // Streaming state management
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Elapsed time tracking for UX feedback
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null)

  // API key state
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)

  // Sidebar expand/collapse state
  const { isExpanded, isAnimating, toggleSidebar, expand } = useAISidebar('collapsed')

  // Track if auto-expand hint has been shown
  const [hasShownAutoExpandHint, setHasShownAutoExpandHint] = useState(() => {
    try {
      return localStorage.getItem('ai-sidebar-auto-expand-hint-shown') === 'true'
    } catch {
      return false
    }
  })

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
    // Reset sidebar to collapsed when switching documents
    resetAISidebarState()
  }, [fileId])

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingMessage])

  // Auto-expand when text is selected (if sidebar is collapsed)
  useEffect(() => {
    if (!isExpanded && liveSelection && !liveSelection.isEmpty && hasApiKey) {
      expand()

      // Show hint on first auto-expand
      if (!hasShownAutoExpandHint) {
        try {
          localStorage.setItem('ai-sidebar-auto-expand-hint-shown', 'true')
          setHasShownAutoExpandHint(true)
        } catch {
          /* ignore localStorage errors */
        }
      }
    }
  }, [liveSelection, isExpanded, hasApiKey, expand, hasShownAutoExpandHint])

  // Keyboard shortcut: Cmd/Ctrl + Shift + A to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + A
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // Focus management: Move focus when expanding/collapsing
  useEffect(() => {
    const wasExpanded = previousExpandedRef.current
    previousExpandedRef.current = isExpanded

    // Expanding: Focus input field after animation
    if (isExpanded && !wasExpanded && hasApiKey) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 350) // After 300ms width transition + 50ms buffer
    }

    // Collapsing: Return focus to editor after animation
    if (!isExpanded && wasExpanded) {
      setTimeout(() => {
        editor.commands.focus()
      }, 450) // After collapse animation completes
    }
  }, [isExpanded, hasApiKey, editor])

  // Screen reader announcements
  useEffect(() => {
    const announce = (message: string) => {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.className = 'sr-only' // Visually hidden (assuming sr-only class exists)
      announcement.style.position = 'absolute'
      announcement.style.left = '-10000px'
      announcement.style.width = '1px'
      announcement.style.height = '1px'
      announcement.style.overflow = 'hidden'
      announcement.textContent = message
      document.body.appendChild(announcement)
      setTimeout(() => announcement.remove(), 1000)
    }

    const wasExpanded = previousExpandedRef.current
    if (isExpanded && !wasExpanded) {
      announce('AI Assistant expanded')
    } else if (!isExpanded && wasExpanded) {
      announce('AI Assistant collapsed')
    }
  }, [isExpanded])

  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return

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
    setIsStreaming(true)
    setStreamingMessage('')

    // Start elapsed time tracking for UX feedback
    setElapsedSeconds(0)
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    // Create AbortController for cancellation
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Build conversation history (exclude tool metadata)
    const history: ConversationMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Buffered streaming updates (update UI every 50ms to avoid excessive re-renders)
    let buffer = ''
    let lastUpdate = Date.now()
    const BUFFER_UPDATE_MS = 50

    const handleStreamUpdate = (content: string) => {
      buffer += content
      const now = Date.now()

      if (now - lastUpdate >= BUFFER_UPDATE_MS) {
        setStreamingMessage(prev => prev + buffer)
        buffer = ''
        lastUpdate = now
      }
    }

    // Flush remaining buffer before completion
    const flushBuffer = () => {
      if (buffer) {
        setStreamingMessage(prev => prev + buffer)
        buffer = ''
      }
    }

    try {
      // Execute AI command with persisted selection context and conversation history
      const result = await executeCommand(
        userMessageContent,
        editor,
        persistedSelection || { text: '', from: 0, to: 0, isEmpty: true, wordCount: 0 },
        history,
        handleStreamUpdate,
        controller.signal
      )

      // Flush any remaining buffered content
      flushBuffer()

      // Clear streaming state and timer
      setIsStreaming(false)
      setStreamingMessage('')
      abortControllerRef.current = null
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }

      // Check if result contains a widget
      if (result.widget) {
        // Add widget message to chat
        const widgetMessage: Message = {
          id: `widget-${Date.now()}`,
          role: 'assistant',
          content: '', // Content will be the widget UI
          timestamp: new Date(),
          widget: result.widget
        }
        setMessages(prev => [...prev, widgetMessage])
        setIsLoading(false)
        return
      }

      // Check if user stopped the request
      if (!result.success && result.error === '__USER_STOPPED__') {
        const cancelMessage: Message = {
          id: `cancel-${Date.now()}`,
          role: 'assistant',
          content: 'Stopped',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, cancelMessage])
        setIsLoading(false)
        return
      }

      // Detect tool type from message content (legacy tools)
      let toolType: 'replace' | 'insert' | undefined
      if (result.success && result.message) {
        if (result.message.startsWith('Replaced')) {
          toolType = 'replace'
        } else if (result.message.startsWith('Inserted')) {
          toolType = 'insert'
        }
      }

      // Add AI response to history (text or error)
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.success
          ? (result.message || 'Success')
          : (result.error || 'An error occurred'),
        timestamp: new Date(),
        toolType
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    } catch (error: any) {
      // Clear timer in all error cases
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }

      // Handle cancellation (user stopped generation)
      const isAbort = error?.name === 'AbortError' ||
                      error?.name === 'APIUserAbortError' ||
                      error?.message?.toLowerCase().includes('cancelled') ||
                      error?.message?.toLowerCase().includes('aborted') ||
                      error?.message?.includes('__USER_STOPPED__')

      if (isAbort) {
        setIsStreaming(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        // Simple, non-technical message
        const cancelMessage: Message = {
          id: `cancel-${Date.now()}`,
          role: 'assistant',
          content: 'Stopped',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, cancelMessage])
        setIsLoading(false)
      } else {
        // Handle other errors
        setIsStreaming(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: error?.message || 'An unexpected error occurred',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        setIsLoading(false)
      }
    }
  }

  const handleCancel = () => {
    console.log('[AIChatSidebar] User stopped generation')

    // Abort the request
    abortControllerRef.current?.abort()

    // Clear streaming state and timer
    setIsStreaming(false)
    setStreamingMessage('')
    abortControllerRef.current = null
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current)
      elapsedTimerRef.current = null
    }

    // Don't add message here - let the error handler show the user-friendly message
    // Re-enable input
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

  // Handle widget completion
  const handleWidgetComplete = async (widgetId: string, result: WidgetResult) => {
    // Remove widget message
    setMessages(prev => prev.filter(msg => msg.widget?.id !== widgetId))

    // Add result message
    const resultMessage: Message = {
      id: `result-${Date.now()}`,
      role: 'assistant',
      content: result.message,
      timestamp: new Date(),
      toolType: 'replace' // FindReplace is always a replace operation
    }
    setMessages(prev => [...prev, resultMessage])
  }

  // Handle widget cancellation
  const handleWidgetCancel = (widgetId: string) => {
    // Remove widget message
    setMessages(prev => prev.filter(msg => msg.widget?.id !== widgetId))

    // Optionally add a cancellation message
    const cancelMessage: Message = {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      content: 'Operation cancelled',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, cancelMessage])
  }

  // Show loading state while checking for API key
  if (hasApiKey === null) {
    return (
      <div className={cn(
        "h-full border-l bg-background flex items-center justify-center shrink-0",
        "transition-[width] duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-12"
      )}>
        {isExpanded ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="w-full h-full flex flex-col items-center py-3 gap-4">
            <div className="text-primary animate-pulse">
              <AILogoIcon size={24} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show API key input if no key exists
  if (!hasApiKey) {
    return (
      <div className={cn(
        "h-full border-l bg-background flex flex-col shrink-0",
        "transition-[width] duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-12"
      )}>
        {/* Collapsed Tab - No API Key */}
        {!isExpanded && (
          <CollapsedTab
            hasApiKey={false}
            messagesCount={0}
            hasSelection={false}
            onToggle={toggleSidebar}
          />
        )}

        {/* Expanded Content - API Key Input */}
        {isExpanded && (
          <div
            className={cn(
              "flex flex-col h-full",
              "transition-opacity duration-200 ease-out",
              isExpanded ? "opacity-100 delay-50" : "opacity-0"
            )}
          >
            {/* Header */}
            <SidebarHeader
              hasApiKey={false}
              messagesCount={0}
              onToggle={toggleSidebar}
            />

            {/* API Key Input */}
            <div className="flex-1 p-2">
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
        )}
      </div>
    )
  }

  // Normal chat interface (hasApiKey === true)
  return (
    <div
      className={cn(
        "h-full border-l bg-background flex flex-col shrink-0",
        "transition-[width] duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-12"
      )}
      style={{ willChange: isAnimating ? 'width' : 'auto' }}
      role="complementary"
      aria-label="AI Assistant Sidebar"
      aria-expanded={isExpanded}
    >
      {/* Collapsed Tab - Chat Ready */}
      {!isExpanded && (
        <CollapsedTab
          hasApiKey={true}
          messagesCount={messages.length}
          hasSelection={liveSelection ? !liveSelection.isEmpty : false}
          onToggle={toggleSidebar}
        />
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className={cn(
            "flex flex-col h-full",
            "transition-opacity duration-200 ease-out",
            isExpanded ? "opacity-100 delay-50" : "opacity-0"
          )}
        >
          {/* Header */}
          <SidebarHeader
            hasApiKey={true}
            messagesCount={messages.length}
            onToggle={toggleSidebar}
            onClearChat={handleClearChat}
          />

          {/* Messages Area - Scrolls from bottom */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground text-sm mt-8">
                <p>👋 Try commands like:</p>
                <p className="mt-2 text-xs">"replace hello with goodbye"</p>
                <p className="mt-1 text-xs">"add examples after this"</p>
                <p className="mt-1 text-xs">"write a conclusion"</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Widget message - render widget instead of text */}
                {message.widget ? (
                  <div className="w-full max-w-[90%]">
                    <WidgetRenderer
                      widget={message.widget}
                      onComplete={(result) => handleWidgetComplete(message.widget!.id, result)}
                      onCancel={() => handleWidgetCancel(message.widget!.id)}
                    />
                  </div>
                ) : (
                  /* Normal text message */
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {/* Show tool icon for assistant messages with tool type */}
                    {message.role === 'assistant' && message.toolType && (
                      <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                        {message.toolType === 'replace' && (
                          <>
                            <Replace className="w-3 h-3" />
                            <span className="text-xs font-medium">Replace</span>
                          </>
                        )}
                        {message.toolType === 'insert' && (
                          <>
                            <FilePlus className="w-3 h-3" />
                            <span className="text-xs font-medium">Insert</span>
                          </>
                        )}
                      </div>
                    )}
                    {message.content}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Message */}
            {isStreaming && streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg px-4 py-2 max-w-[80%]">
                  {streamingMessage}
                  <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
                </div>
              </div>
            )}

            {/* Loading State - Show when loading (even if streaming with no content) */}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 text-sm">
                      {elapsedSeconds < 2 ? 'Analyzing...' : `Processing... ${elapsedSeconds}s`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Selection Indicator - Shows selected text context above prompt */}
          <SelectionIndicator selection={liveSelection} onClearSelection={onClearSelection} />

          {/* Input Area */}
          <div className="border-t p-2">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command... (e.g., 'replace hello with goodbye')"
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading || isStreaming}
              />
              {isStreaming ? (
                <button
                  onClick={handleCancel}
                  className="border border-border bg-background text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                  aria-label="Stop generating"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <SendHorizontal className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
