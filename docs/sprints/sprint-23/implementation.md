# Sprint 23 Implementation: OpenAI GPT-5-mini Integration

## Overview

This document details the technical implementation of OpenAI GPT-5-mini integration with user-managed API keys.

## Architecture

### Component Structure

```
src/
├── services/ai/
│   ├── apiKeyManager.ts       # NEW: Encrypted API key storage
│   ├── openAIClient.ts         # MODIFIED: Use apiKeyManager
│   ├── textSearch.ts           # MODIFIED: Case-insensitive search
│   ├── toolExecutor.ts         # Sprint 22: Tool execution
│   └── fakeAI.ts              # Sprint 22: POC (unused)
│
├── components/ai/
│   └── AIChatSidebar.tsx      # MODIFIED: Key check + inline input
│
└── components/settings/
    └── GeneralSettingsSection.tsx  # MODIFIED: API key UI
```

## Phase 1: Core AI Integration

### OpenAI Client Integration
**File**: `src/services/ai/openAIClient.ts`

#### Model Configuration
```typescript
// GPT-5-mini (released August 2025)
model: 'gpt-5-mini'  // Mid-tier: faster than gpt-5, better than gpt-5-nano
```

#### Function Calling Architecture
```typescript
const replaceTextTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'replaceText',
    description: 'Replace a specific text string in the document',
    parameters: {
      type: 'object',
      properties: {
        searchText: { type: 'string', description: 'Text to find' },
        newText: { type: 'string', description: 'Replacement text' }
      },
      required: ['searchText', 'newText']
    }
  }
}
```

#### Execution Flow
```typescript
export async function executeCommand(prompt: string, editor: Editor) {
  // 1. Create OpenAI client (with user key or .env fallback)
  const openai = await createOpenAIClient()
  
  // 2. Call GPT-5-mini with function calling
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Use replaceText tool to edit documents' },
      { role: 'user', content: prompt }
    ],
    tools: [replaceTextTool],
    tool_choice: 'auto'
  })
  
  // 3. Extract tool call
  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  const args = JSON.parse(toolCall.function.arguments)
  
  // 4. Find text in document (case-insensitive)
  const position = findTextInDocument(editor, args.searchText)
  
  // 5. Execute replacement via ToolExecutor
  const executor = new ToolExecutor(editor)
  executor.execute({
    tool: 'replaceText',
    arguments: { from: position.from, to: position.to, newText: args.newText }
  })
}
```

### Case-Insensitive Text Search
**File**: `src/services/ai/textSearch.ts`

#### Problem
User command: "replace welcome with Hello!"
Document text: "Welcome to RiteMark"
Result: ❌ Text not found (case mismatch)

#### Solution
```typescript
export function findTextInDocument(editor: Editor, searchText: string) {
  const plainText = editor.getText()
  
  // Case-insensitive search
  const lowerPlainText = plainText.toLowerCase()
  const lowerSearchText = searchText.toLowerCase()
  const textOffset = lowerPlainText.indexOf(lowerSearchText)
  
  if (textOffset === -1) return null
  
  // Convert to TipTap document position
  const docFrom = textOffsetToDocPosition(textOffset)
  const docTo = docFrom + searchText.length  // Preserve original case length
  
  return { from: docFrom, to: docTo }
}
```

**Why it works:**
- Search using lowercase comparison
- Return position in original text (preserves case)
- Replace using original case length (handles "Welcome" → "Hello!" correctly)

### Chat Sidebar UI
**File**: `src/components/ai/AIChatSidebar.tsx`

#### Message History Pattern
```typescript
interface Message {
  id: string               // Unique ID (user-123456789)
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const [messages, setMessages] = useState<Message[]>([])
```

#### Conventional Chat UX
```typescript
// User messages: Right-aligned, primary background
<div className="justify-end">
  <div className="bg-primary text-primary-foreground">
    {message.content}
  </div>
</div>

// AI messages: Left-aligned, muted background
<div className="justify-start">
  <div className="bg-muted text-foreground">
    ✅ {message.content}
  </div>
</div>
```

#### Auto-Scroll Implementation
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages, isLoading])

// Anchor element at bottom of messages
<div ref={messagesEndRef} />
```

#### Document-Aware Reset
```typescript
useEffect(() => {
  setMessages([])    // Clear chat history
  setInput('')       // Clear input field
}, [fileId])         // Reset when document changes
```

#### Icon Buttons
```typescript
import { SendHorizontal, RotateCcw } from 'lucide-react'

// Send button (replaced "Send" text)
<button aria-label="Send message">
  <SendHorizontal className="w-5 h-5" />
</button>

// Reset button (RotateCcw, not X)
<button aria-label="Reset chat">
  <RotateCcw className="w-4 h-4" />
</button>
```

## Phase 2: API Key Management

### API Key Manager Service
**File**: `src/services/ai/apiKeyManager.ts`

#### IndexedDB Schema
```typescript
Database: 'ritemark-settings'
Store: 'api-keys'
Key: 'openai-key'

Record: {
  id: 'openai-key'
  encryptedData: ArrayBuffer  // AES-256-GCM encrypted API key
  iv: Uint8Array              // Initialization vector
  timestamp: number           // Date.now()
}
```

#### Encryption Implementation
```typescript
class APIKeyManager {
  private db: IDBPDatabase | null = null
  private encryptionKey: CryptoKey | null = null  // Memory-only, non-extractable
  
  private async init() {
    // Open IndexedDB
    this.db = await openDB('ritemark-settings', 1, {
      upgrade(db) {
        db.createObjectStore('api-keys', { keyPath: 'id' })
      }
    })
    
    // Generate encryption key (Sprint 19 pattern)
    this.encryptionKey = await generateEncryptionKey()  // AES-256-GCM
  }
  
  async storeAPIKey(apiKey: string) {
    // Validate
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format')
    }
    
    // Encrypt
    const { encryptedData, iv } = await encryptData(apiKey, this.encryptionKey)
    
    // Store
    await this.db.put('api-keys', {
      id: 'openai-key',
      encryptedData,
      iv,
      timestamp: Date.now()
    })
  }
  
  async getAPIKey(): Promise<string | null> {
    const encrypted = await this.db.get('api-keys', 'openai-key')
    if (!encrypted) return null
    
    // Decrypt
    return await decryptData(encrypted.encryptedData, encrypted.iv, this.encryptionKey)
  }
}
```

### Settings UI Integration
**File**: `src/components/settings/GeneralSettingsSection.tsx`

#### State Management
```typescript
const [apiKey, setApiKey] = useState('')                    // Input value
const [maskedKey, setMaskedKey] = useState<string | null>(null)  // Stored key
const [showApiKey, setShowApiKey] = useState(false)          // Show/hide toggle
const [isSaving, setIsSaving] = useState(false)              // Save state
const [saveMessage, setSaveMessage] = useState('')           // Feedback

// Load masked key on mount
useEffect(() => {
  const loadMaskedKey = async () => {
    const masked = await apiKeyManager.getMaskedKey()  // sk-...****...1234
    setMaskedKey(masked)
  }
  loadMaskedKey()
}, [])
```

#### UI Components
```typescript
{maskedKey ? (
  // Key exists: Show masked display + delete button
  <div className="flex items-center space-x-2">
    <Input type="text" value={maskedKey} disabled className="bg-muted" />
    <Button onClick={handleDeleteApiKey}>
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
) : (
  // No key: Show input + show/hide + save
  <div className="flex items-center space-x-2">
    <Input
      type={showApiKey ? 'text' : 'password'}
      value={apiKey}
      onChange={(e) => setApiKey(e.target.value)}
      placeholder="sk-..."
    />
    <Button onClick={() => setShowApiKey(!showApiKey)}>
      {showApiKey ? <EyeOff /> : <Eye />}
    </Button>
    <Button onClick={handleSaveApiKey}>
      <Save /> Save
    </Button>
  </div>
)}
```

### Chat Sidebar Key Check
**File**: `src/components/ai/AIChatSidebar.tsx`

#### Three-State UI
```typescript
const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)

// Check on mount
useEffect(() => {
  const checkApiKey = async () => {
    const hasKey = await apiKeyManager.hasAPIKey()
    setHasApiKey(hasKey)
  }
  checkApiKey()
}, [])

// Loading state
if (hasApiKey === null) {
  return <div>Loading...</div>
}

// No key: Show inline input
if (!hasApiKey) {
  return <APIKeyInputScreen />
}

// Key exists: Show chat interface
return <ChatInterface />
```

#### Inline Input Screen
```typescript
<div className="flex flex-col">
  <div className="border-b p-4">
    <Key className="w-5 h-5" />
    <h2>AI Assistant</h2>
    <p>Enter your OpenAI API key to get started</p>
  </div>
  
  <div className="p-4">
    <label>OpenAI API Key</label>
    <p className="text-sm">Stored securely with AES-256-GCM encryption</p>
    
    <input
      type="password"
      value={apiKeyInput}
      onChange={(e) => setApiKeyInput(e.target.value)}
      onKeyDown={handleApiKeyKeyDown}  // Enter key support
      placeholder="sk-..."
    />
    
    <button onClick={handleSaveApiKey}>
      <Save /> Save API Key
    </button>
    
    <div className="bg-muted p-3">
      💡 <strong>Tip:</strong> You can also add your API key in Settings → General
    </div>
    
    <a href="https://platform.openai.com/api-keys" target="_blank">
      Get one from OpenAI →
    </a>
  </div>
</div>
```

### OpenAI Client Update
**File**: `src/services/ai/openAIClient.ts`

#### Fallback Hierarchy
```typescript
async function createOpenAIClient(): Promise<OpenAI | null> {
  // 1. Try user-provided key from IndexedDB
  let apiKey = await apiKeyManager.getAPIKey()
  
  // 2. Fall back to .env.local (developer mode)
  if (!apiKey) {
    apiKey = import.meta.env.VITE_OPENAI_API_KEY
  }
  
  // 3. No key available
  if (!apiKey) {
    console.error('[OpenAI] No API key found. Please add your API key in Settings.')
    return null
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  })
}

// Update all callers to await
const openai = await createOpenAIClient()  // Was: createOpenAIClient()
```

## Error Handling

### API Key Errors
```typescript
// No key
'OpenAI API key not configured. Please add your API key in Settings → General.'

// Invalid key format
'Invalid OpenAI API key format (must start with sk-)'

// Empty key
'API key cannot be empty'

// OpenAI API errors
401: 'Invalid API key. Please check your API key in Settings.'
429: 'Rate limit exceeded. Please try again in a moment.'
500/502/503: 'OpenAI service is temporarily unavailable.'
```

### Chat Sidebar Errors
```typescript
// Validation
if (!input.trim()) return  // Silent fail (UX pattern)

// AI execution
const result = await executeCommand(userMessageContent, editor)

if (result.success) {
  // ✅ Show success message
  setMessages([...messages, { content: `✅ ${result.message}` }])
} else {
  // ❌ Show error message
  setMessages([...messages, { content: `❌ ${result.error}` }])
}
```

## Performance Considerations

### API Call Optimization
```typescript
// Timeout (30 seconds)
const controller = new AbortController()
setTimeout(() => controller.abort(), 30000)

await openai.chat.completions.create({...}, { signal: controller.signal })
```

### Encryption Performance
- **Key generation**: Once per session (cached in memory)
- **Encryption**: ~1-5ms for API key (256-bit AES-GCM)
- **Decryption**: ~1-5ms for API key retrieval
- **IndexedDB**: Async, non-blocking UI

### Chat Sidebar
- **Message rendering**: Virtualization not needed (chat history limited)
- **Auto-scroll**: Smooth behavior (300-500ms animation)
- **Loading states**: Animated dots (CSS-based, no JS timers)

## Testing

### Manual Tests Performed
- ✅ TypeScript compilation (npm run type-check)
- ✅ Development server loads (localhost:5173)
- ⏳ Browser console validation (pending user)
- ⏳ API key storage flow (pending user)
- ⏳ Chat sidebar with missing key (pending user)

### Browser Tests Required
1. Open chat sidebar without key → Inline input shows
2. Enter invalid key → Validation error
3. Enter valid key → Stores and switches to chat
4. Send AI command → Executes successfully
5. Open Settings → Shows masked key
6. Delete key → Chat shows input again
7. Browser close/reopen → Key persists

## Deployment

### Build Configuration
```json
// No changes required
// Vite handles client-side imports automatically
```

### Environment Variables
```bash
# .env.local (developer mode)
VITE_OPENAI_API_KEY=sk-...  # Falls back if no user key

# Production
# Users provide their own keys via UI
```

### Security Checklist
- ✅ API keys encrypted with AES-256-GCM
- ✅ Encryption keys non-extractable (Web Crypto API)
- ✅ No server-side key storage
- ✅ BYOK model (Bring Your Own Key)
- ✅ Password input for key entry
- ✅ Masked key display
- ✅ Delete confirmation dialog

---

**Status**: ✅ Implementation complete, browser testing pending
**Last Updated**: November 4, 2025
