# API Key Management Feature

## Overview

User-facing API key management system that allows users to securely store and manage their OpenAI API keys with AES-256-GCM encryption.

## Architecture

### Storage Layer
**File**: `src/services/ai/apiKeyManager.ts`

```typescript
class APIKeyManager {
  // IndexedDB database: 'ritemark-settings'
  // Object store: 'api-keys'
  // Encryption: AES-256-GCM with non-extractable CryptoKey
  
  async storeAPIKey(apiKey: string): Promise<void>
  async getAPIKey(): Promise<string | null>
  async hasAPIKey(): Promise<boolean>
  async deleteAPIKey(): Promise<void>
  async getMaskedKey(): Promise<string | null>
}
```

**Security Features:**
- AES-256-GCM encryption (follows Sprint 19 TokenManagerEncrypted pattern)
- Non-extractable CryptoKey (Web Crypto API)
- Encrypted data + IV stored in IndexedDB
- Encryption key kept in memory only (not persisted)
- Browser-bound encryption (keys cannot be exported)

### UI Integration

#### 1. Settings Dialog (Primary Management UI)
**File**: `src/components/settings/GeneralSettingsSection.tsx`

**Features:**
- Password input with show/hide toggle (Eye/EyeOff icons)
- Masked key display when key exists (sk-...****...1234)
- Save button with validation
- Delete button with confirmation dialog
- Real-time error messages
- Success notifications (3-second timeout)

**UX Flow:**
```
No Key Stored:
  → Input field (type=password)
  → Show/Hide toggle button
  → Save button (validates sk- prefix)

Key Exists:
  → Masked display (sk-...****...1234)
  → Delete button (with confirmation)
```

#### 2. Chat Sidebar (Inline Setup)
**File**: `src/components/ai/AIChatSidebar.tsx`

**Features:**
- Automatic key check on mount
- Inline API key input if no key exists
- Zero-friction first-time setup
- Link to OpenAI API keys page
- Tip pointing to Settings for alternative input

**UX Flow:**
```
hasApiKey === null:
  → Loading state

hasApiKey === false:
  → Show API key input screen
  → Password field with Enter key support
  → Save button
  → Help text and OpenAI link

hasApiKey === true:
  → Normal chat interface
```

## User Flows

### First-Time User Flow
1. User opens document with AI sidebar
2. Sidebar detects no API key exists
3. Shows inline input with instructions
4. User pastes OpenAI API key (sk-...)
5. Clicks "Save API Key" or presses Enter
6. Key is encrypted and stored in IndexedDB
7. Sidebar switches to chat interface
8. User can now send AI commands

### Settings Management Flow
1. User opens Settings dialog (⌘,)
2. Navigates to General section
3. Sees OpenAI API Key field
4. If no key: Input field with show/hide
5. If key exists: Masked display with delete button
6. Can update or delete key as needed

### Developer Workflow
1. Developer sets VITE_OPENAI_API_KEY in .env.local
2. Chat sidebar works immediately (fallback mode)
3. User can still add their own key (takes precedence)
4. If user deletes key, falls back to .env.local

## Implementation Details

### Validation Rules
```typescript
// Key must not be empty
if (!apiKey.trim()) {
  throw new Error('API key cannot be empty')
}

// Key must start with 'sk-'
if (!apiKey.startsWith('sk-')) {
  throw new Error('Invalid OpenAI API key format (must start with sk-)')
}
```

### Encryption Flow
```typescript
// 1. Generate encryption key (memory-only)
const encryptionKey = await generateEncryptionKey() // AES-256-GCM, non-extractable

// 2. Encrypt API key
const { encryptedData, iv } = await encryptData(apiKey, encryptionKey)

// 3. Store in IndexedDB
await db.put('api-keys', {
  id: 'openai-key',
  encryptedData,  // ArrayBuffer
  iv,             // Uint8Array
  timestamp       // Date.now()
})
```

### Retrieval Flow
```typescript
// 1. Retrieve from IndexedDB
const encrypted = await db.get('api-keys', 'openai-key')

// 2. Decrypt with memory-only key
const apiKey = await decryptData(
  encrypted.encryptedData,
  encrypted.iv,
  encryptionKey
)
```

### Fallback Hierarchy
```typescript
async function createOpenAIClient() {
  // 1. Try user-provided key (IndexedDB)
  let apiKey = await apiKeyManager.getAPIKey()
  
  // 2. Fall back to .env.local (developer mode)
  if (!apiKey) {
    apiKey = import.meta.env.VITE_OPENAI_API_KEY
  }
  
  // 3. Fail with user-friendly message
  if (!apiKey) {
    return null // Error: "Please add your API key in Settings"
  }
  
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
}
```

## Security Considerations

### Client-Side Security
- **Encryption at rest**: Keys encrypted in IndexedDB
- **Memory-only encryption keys**: CryptoKey is non-extractable
- **No server transmission**: Keys never sent to backend
- **Browser-bound**: Encryption keys tied to browser instance

### Attack Surface Reduction
- **No centralized storage**: Each user stores their own key
- **BYOK model**: Zero server-side key management
- **User control**: Users can rotate keys independently
- **Isolation**: One user's compromise doesn't affect others

### Limitations (Client-Side)
- **Browser DevTools**: Advanced users can access IndexedDB
- **XSS vulnerabilities**: Malicious scripts could access keys
- **Browser extensions**: Extensions with broad permissions
- **Physical access**: Local machine access compromises keys

**Mitigation**: Encryption adds defense-in-depth, users advised to use project-specific keys with limited spending caps.

## UI/UX Decisions

### Inline Input in Chat Sidebar
**Why**: Zero-friction setup for new users
- No navigation to Settings required
- Immediate call-to-action
- Contextual help ("Get one from OpenAI →")
- Progressive disclosure (only show when needed)

### Settings UI for Management
**Why**: Power users need centralized control
- Visibility: Users know where to find their keys
- Management: Easy to delete or update keys
- Consistency: Follows Settings dialog pattern
- Masked display: Security without obscurity

### Password Input with Toggle
**Why**: Balance security and usability
- Hidden by default (security)
- Show/hide toggle (usability for long keys)
- Validation on blur (immediate feedback)
- Enter key support (power user workflow)

### Masked Key Display
**Why**: Security indicator without full obscurity
- Shows sk-...****...1234 format
- Confirms key is stored
- Doesn't reveal full key
- Trash icon for deletion

## Error Handling

### Validation Errors
```typescript
// Empty key
'Please enter an API key'

// Invalid format
'Invalid API key format (must start with sk-)'
```

### Storage Errors
```typescript
// IndexedDB failure
'Failed to initialize storage'

// Encryption failure
'Failed to save API key'

// Decryption failure
'Failed to decrypt API key'
```

### API Errors
```typescript
// No key found
'OpenAI API key not configured. Please add your API key in Settings → General.'

// Invalid key (401)
'Invalid API key. Please check your VITE_OPENAI_API_KEY in .env.local'
```

## Testing Strategy

### Manual Browser Tests (Updated Nov 4)
1. **No key scenario**: Chat sidebar shows inline input
2. **Add key inline**: Stores and switches to chat immediately
3. **Settings display**: Shows masked key
4. **Delete key**: Removes and shows input again
5. **Invalid key**: Shows validation error
6. **Empty key**: Shows validation error
7. **Persistence**: Key survives browser close/reopen
8. **Real-time sync**: Add key in Settings → ChatSidebar updates instantly (no refresh)
9. **Real-time sync**: Add key in ChatSidebar → Settings shows masked key instantly
10. **No fallback**: AI features disabled without user-provided key (BYOK only)

## Future Enhancements

### Potential Improvements
1. **Key expiration**: Warn users if key looks old
2. **Usage tracking**: Show API usage in Settings
3. **Multiple keys**: Support different keys per project
4. **Key validation**: Test key on save (ping OpenAI)
5. **Export/import**: Backup/restore encrypted keys
6. **Biometric unlock**: WebAuthn for decryption

### Sprint 24+ Integration
- Multi-tool expansion (insertText, applyFormatting)
- Usage metrics and cost tracking
- API key rotation workflows
- Team key sharing (enterprise feature)

## Final Refactoring (November 4, 2025)

### Problem Identified
After initial implementation, two critical issues remained:
1. **Code Duplication**: API key input logic duplicated in Settings and ChatSidebar
2. **State Sync**: Adding key in Settings didn't update ChatSidebar (required manual refresh)

### Solution: Shared Component + Event System

#### 1. Shared Component Architecture
**File**: `src/components/settings/APIKeyInput.tsx`

**New shared component** eliminates all duplicate code:
```typescript
interface APIKeyInputProps {
  onKeySaved?: () => void          // Callback after successful save
  inlineTip?: boolean              // Show Settings tip (for ChatSidebar)
  showGetKeyLink?: boolean         // Show OpenAI link (for ChatSidebar)
}

export function APIKeyInput({ onKeySaved, inlineTip, showGetKeyLink }: APIKeyInputProps)
```

**Features:**
- Single source of truth for validation logic
- Unified UI (password input, show/hide, save button)
- Configurable for different contexts (Settings vs ChatSidebar)
- Zero code duplication (DRY principle)

#### 2. Event-Based State Synchronization
**File**: `src/services/ai/apiKeyManager.ts` (Enhanced)

**Added CustomEvent system** for real-time updates:
```typescript
export const API_KEY_CHANGED_EVENT = 'api-key-changed'

export interface APIKeyChangedEvent extends CustomEvent {
  detail: {
    action: 'stored' | 'deleted'
    hasKey: boolean
  }
}

class APIKeyManager {
  private dispatchKeyChangeEvent(action: 'stored' | 'deleted', hasKey: boolean) {
    const event = new CustomEvent(API_KEY_CHANGED_EVENT, {
      detail: { action, hasKey }
    })
    window.dispatchEvent(event)
  }

  async storeAPIKey(apiKey: string) {
    // ... storage logic ...
    this.dispatchKeyChangeEvent('stored', true)  // ← Notify listeners
  }

  async deleteAPIKey() {
    // ... deletion logic ...
    this.dispatchKeyChangeEvent('deleted', false)  // ← Notify listeners
  }
}
```

#### 3. Component Updates

**GeneralSettingsSection.tsx** - Uses shared component:
```typescript
import { APIKeyInput } from './APIKeyInput'

const handleKeySaved = async () => {
  const masked = await apiKeyManager.getMaskedKey()
  setMaskedKey(masked)
}

<APIKeyInput onKeySaved={handleKeySaved} />  // ← No props needed
```

**AIChatSidebar.tsx** - Listens for events + uses shared component:
```typescript
import { APIKeyInput } from '@/components/settings/APIKeyInput'
import { API_KEY_CHANGED_EVENT, type APIKeyChangedEvent } from '@/services/ai/apiKeyManager'

useEffect(() => {
  // Listen for key changes from Settings or inline input
  const handleKeyChange = (event: Event) => {
    const { hasKey } = (event as APIKeyChangedEvent).detail
    setHasApiKey(hasKey)  // ← Auto-update when key added/deleted
  }

  window.addEventListener(API_KEY_CHANGED_EVENT, handleKeyChange)
  return () => window.removeEventListener(API_KEY_CHANGED_EVENT, handleKeyChange)
}, [])

<APIKeyInput onKeySaved={handleKeySaved} inlineTip showGetKeyLink />
```

### Results

**Before Refactoring:**
- ❌ 70+ lines of duplicate code across 2 components
- ❌ Manual refresh needed after adding key in Settings
- ❌ Different validation logic in each location
- ❌ Inconsistent UI behavior

**After Refactoring:**
- ✅ Zero code duplication (single shared component)
- ✅ Real-time state sync (Settings ↔ ChatSidebar)
- ✅ Single source of truth for validation
- ✅ Consistent UI/UX across all locations
- ✅ Event-driven architecture (scalable for future features)

### Security Hardening

**Removed .env.local fallback** to prevent accidental billing:
```typescript
// Before: Had fallback (DANGEROUS)
async function createOpenAIClient(): Promise<OpenAI | null> {
  let apiKey = await apiKeyManager.getAPIKey()
  if (!apiKey) {
    apiKey = import.meta.env.VITE_OPENAI_API_KEY  // ❌ Could cause surprise bills
  }
  return new OpenAI({ apiKey })
}

// After: BYOK only (SAFE)
async function createOpenAIClient(): Promise<OpenAI | null> {
  const apiKey = await apiKeyManager.getAPIKey()
  if (!apiKey) {
    console.error('[OpenAI] No API key configured')
    return null  // ✅ Forces user to add key explicitly
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
}
```

**Impact**: Users MUST add key through UI → Zero risk of unexpected OpenAI charges

---

**Status**: ✅ Production-ready (Refactored & Validated)
**Last Updated**: November 4, 2025 (Final completion)
**Browser Validated**: ✅ November 4, 2025
