import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { executeCommand, type ConversationMessage, analyzeIntent } from '@/services/ai/openAIClient'
import { apiKeyManager, API_KEY_CHANGED_EVENT, type APIKeyChangedEvent } from '@/services/ai/apiKeyManager'
import { APIKeyInput } from '@/components/settings/APIKeyInput'
import { SelectionIndicator } from '@/components/ai/SelectionIndicator'
import { SendHorizontal, RotateCcw, Key, Replace, FilePlus, ChevronRight, BrainCircuit, Sparkles, MessageCircle, Edit3, X } from 'lucide-react'
import type { EditorSelection } from '@/types/editor'
import { useAISidebar, resetAISidebarState } from '@/components/hooks/use-ai-sidebar'
import { cn } from '@/lib/utils'

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
  userIntent?: 'discussion' | 'edit' // User intent for mode indicators
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
    <div className="w-6 h-6 text-primary">
      {hasApiKey ? <BrainCircuit /> : <Key />}
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
  const [activeController, setActiveController] = useState<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousExpandedRef = useRef(false)

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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
    if (!input.trim() || isLoading) return

    const userMessageContent = input.trim()

    // Detect user intent for mode indicator
    const userIntent = analyzeIntent(userMessageContent)

    // Add user message to history immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
      userIntent
    }
    setMessages(prev => [...prev, userMessage])

    // Clear input immediately
    setInput('')
    setIsLoading(true)

    // Build conversation history (exclude tool metadata)
    const history: ConversationMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Execute AI command with persisted selection context and conversation history
    const result = await executeCommand(
      userMessageContent,
      editor,
      persistedSelection || { text: '', from: 0, to: 0, isEmpty: true, wordCount: 0 },
      history
    )

    // Store controller for cancellation
    if (result.controller) {
      setActiveController(result.controller)
    }

    // Detect tool type from message content
    let toolType: 'replace' | 'insert' | undefined
    if (result.success && result.message) {
      if (result.message.startsWith('Replaced')) {
        toolType = 'replace'
      } else if (result.message.startsWith('Inserted')) {
        toolType = 'insert'
      }
    }

    // Add AI response to history
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: result.success
        ? (result.message || 'Success')
        : (result.error || 'An error occurred'),
      timestamp: new Date(),
      toolType,
      userIntent
    }
    setMessages(prev => [...prev, aiMessage])
    setIsLoading(false)
    setActiveController(null)
  }

  const handleCancel = () => {
    if (activeController) {
      activeController.abort()
      setActiveController(null)
      setIsLoading(false)
    }
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
      <div className={cn(
        "h-full border-l bg-background flex items-center justify-center shrink-0",
        "transition-[width] duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-12"
      )}>
        {isExpanded ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="w-full h-full flex flex-col items-center py-3 gap-4">
            <div className="w-6 h-6 text-primary animate-pulse">
              <BrainCircuit />
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

          {/* Selection Indicator - Live character-by-character preview */}
          <SelectionIndicator selection={liveSelection} onClearSelection={onClearSelection} />

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
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {/* Show mode indicator for user messages */}
                  {message.role === 'user' && message.userIntent && (
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                      {message.userIntent === 'discussion' ? (
                        <>
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">Chat</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3 h-3" />
                          <span className="text-xs font-medium">Edit</span>
                        </>
                      )}
                    </div>
                  )}

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

                  {/* Show mode indicator for assistant messages in discussion mode */}
                  {message.role === 'assistant' && !message.toolType && message.userIntent === 'discussion' && (
                    <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-xs font-medium">Chat</span>
                    </div>
                  )}

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
                {/* Cancel Button */}
                {activeController && (
                  <button
                    onClick={handleCancel}
                    className="ml-2 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                    aria-label="Cancel AI request"
                    title="Cancel request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

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
      )}
    </div>
  )
}
