# Sprint 26: Implementation Guide (MVP)

## Copy-Paste Ready Code

---

## File 1: Netlify Error Logging Function

**File**: `netlify/functions/log-client-error.ts`

**Purpose**: Receive client errors and log them for AI agent monitoring.

```typescript
/**
 * Netlify Function: Client-Side Error Logging
 * Sprint 26 MVP: Enable AI agents to see browser errors
 *
 * Purpose:
 * - Receive error reports from browser
 * - Log to Netlify function logs
 * - AI agents monitor via: netlify logs:function log-client-error
 */

import type { Handler, HandlerEvent } from '@netlify/functions'

export const handler: Handler = async (event: HandlerEvent) => {
  // POST only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: 'Method Not Allowed'
    }
  }

  try {
    const errorData = JSON.parse(event.body || '{}')

    // Log error for AI agent monitoring
    console.error('[CLIENT-ERROR]', errorData)

    return {
      statusCode: 200,
      body: 'ok'
    }
  } catch (err) {
    console.error('[log-client-error] Invalid request:', err)
    return {
      statusCode: 400,
      body: 'Invalid JSON'
    }
  }
}
```

**Testing**:
```bash
# Start local dev server
netlify dev

# Test endpoint
curl -X POST http://localhost:8888/.netlify/functions/log-client-error \
  -H "Content-Type: application/json" \
  -d '{"error":"Test error","context":"test.function","timestamp":1736477230000}'

# Check logs
netlify logs:function log-client-error
```

---

## File 2: Client-Side Error Reporter

**File**: `ritemark-app/src/utils/errorReporter.ts`

**Purpose**: Send browser errors to Netlify function (fire-and-forget).

```typescript
/**
 * Client-Side Error Reporter
 * Sprint 26 MVP: Report errors to Netlify function for AI agent monitoring
 *
 * Usage:
 * try {
 *   await someOperation()
 * } catch (error) {
 *   reportError(error, 'fileName.functionName')
 *   throw error  // Re-throw for normal error handling
 * }
 */

/**
 * Report error to AI agent monitoring
 *
 * @param error - Error object from catch block
 * @param context - Context string in "file.function" format
 *
 * @example
 * reportError(error, 'settingsEncryption.decryptSettings')
 */
export function reportError(error: Error, context: string): void {
  try {
    const errorData = {
      error: error.message,
      context,
      timestamp: Date.now(),
      stack: error.stack,
    }

    // Fire-and-forget (never await, never block user)
    fetch('/.netlify/functions/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
      keepalive: true, // Allow request to complete even if page unloads
    }).catch(() => {
      // Silent failure - error reporter must never throw
    })
  } catch {
    // Silent failure - error reporter must never break user experience
  }
}
```

**Testing**:
```typescript
// Test in browser console (after importing)
import { reportError } from '@/utils/errorReporter'

try {
  throw new Error('Test error from browser')
} catch (error) {
  reportError(error, 'console.test')
}

// Check Netlify logs:
// $ netlify logs:function log-client-error
// Should see: [CLIENT-ERROR] { error: "Test error from browser", context: "console.test", ... }
```

---

## File 3: Fix Encryption Error Message

**File**: `ritemark-app/src/utils/settingsEncryption.ts`

**Change**: Line 109 - Update error message to trigger auto-cleanup

**Before**:
```typescript
// Line 108-110 (BEFORE):
if (!settings.userId || !settings.version || !settings.timestamp) {
  throw new Error('Decrypted data missing required fields')
}
```

**After**:
```typescript
// Line 108-111 (AFTER):
if (!settings.userId || !settings.version || !settings.timestamp) {
  console.warn('[settingsEncryption] Decrypted data missing required fields - encryption key mismatch')
  throw new Error('ENCRYPTION_KEY_MISMATCH')
}
```

**Why**:
- `SettingsSyncService.ts:408` checks for `error.message === 'ENCRYPTION_KEY_MISMATCH'`
- This triggers automatic cleanup of incompatible settings
- User won't see repeated decryption errors

---

## File 4: Add Error Reporting to Catch Blocks

### 4a. Settings Decryption Error

**File**: `ritemark-app/src/utils/settingsEncryption.ts`

**Location**: Lines 119-124 (in `decryptSettings()` function)

**Before**:
```typescript
} catch (error) {
  // Handle encryption key mismatch gracefully (expected in cross-browser scenarios)
  if (error instanceof Error && error.name === 'OperationError') {
    console.warn('[settingsEncryption] Cannot decrypt settings - encrypted with different browser key (this is normal after browser change or testing)')
    throw new Error('ENCRYPTION_KEY_MISMATCH')
  }

  // Other errors (corrupted data, network issues, etc.)
  console.error('[settingsEncryption] Decryption failed:', error)
  throw new Error(`Failed to decrypt settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
```

**After**:
```typescript
import { reportError } from './errorReporter'

// ... (rest of imports)

} catch (error) {
  // Handle encryption key mismatch gracefully (expected in cross-browser scenarios)
  if (error instanceof Error && error.name === 'OperationError') {
    console.warn('[settingsEncryption] Cannot decrypt settings - encrypted with different browser key (this is normal after browser change or testing)')
    throw new Error('ENCRYPTION_KEY_MISMATCH')
  }

  // Other errors (corrupted data, network issues, etc.)
  console.error('[settingsEncryption] Decryption failed:', error)

  // Report to AI agent monitoring
  if (error instanceof Error) {
    reportError(error, 'settingsEncryption.decryptSettings')
  }

  throw new Error(`Failed to decrypt settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
```

---

### 4b. Settings Sync Error

**File**: `ritemark-app/src/services/settings/SettingsSyncService.ts`

**Location**: Lines 414-417 (in `loadFromDrive()` function)

**Before**:
```typescript
} catch (error) {
  // Handle encryption key mismatch (test data from different browser/localhost)
  if (error instanceof Error && error.message === 'ENCRYPTION_KEY_MISMATCH') {
    console.warn('[SettingsSync] Settings encrypted with different browser key - deleting incompatible data');
    // Delete incompatible encrypted settings to prevent repeated errors
    await this.deleteFromDrive();
    return null;
  }

  console.error('[SettingsSync] Failed to load from Drive:', error);
  return null;
}
```

**After**:
```typescript
import { reportError } from '../../utils/errorReporter'

// ... (rest of imports at top of file)

} catch (error) {
  // Handle encryption key mismatch (test data from different browser/localhost)
  if (error instanceof Error && error.message === 'ENCRYPTION_KEY_MISMATCH') {
    console.warn('[SettingsSync] Settings encrypted with different browser key - deleting incompatible data');
    // Delete incompatible encrypted settings to prevent repeated errors
    await this.deleteFromDrive();
    return null;
  }

  console.error('[SettingsSync] Failed to load from Drive:', error);

  // Report to AI agent monitoring
  if (error instanceof Error) {
    reportError(error, 'SettingsSyncService.loadFromDrive')
  }

  return null;
}
```

---

## File 5: Update CLAUDE.md

**File**: `CLAUDE.md`

**Location**: Add new section after "🔄 AI-ASSISTED CODING LIFECYCLE"

**Add**:
```markdown
## 🔍 Client-Side Error Monitoring (Sprint 26)

### AI Agent Can Now See Browser Errors

**Monitor browser errors via Netlify function logs**:
\`\`\`bash
# Real-time monitoring
netlify logs:function log-client-error

# Filter by context (file.function)
netlify logs:function log-client-error | grep "decryptSettings"

# Filter by error message
netlify logs:function log-client-error | grep "Failed to decrypt"
\`\`\`

**MANDATORY: Monitor after every deployment**:
\`\`\`bash
# Deploy and monitor for 5 minutes
git push origin main && timeout 300 netlify logs:function log-client-error
\`\`\`

**Common Error Contexts**:
- \`settingsEncryption.decryptSettings\` - Encryption key mismatch
- \`SettingsSyncService.loadFromDrive\` - Drive sync failed
- \`TokenManagerEncrypted.getAccessToken\` - Token refresh failed

**Error Format**:
\`\`\`json
{
  "error": "Failed to decrypt settings: Decrypted data missing required fields",
  "context": "settingsEncryption.decryptSettings",
  "timestamp": 1736477230000,
  "stack": "at decryptSettings (settingsEncryption.ts:109)..."
}
\`\`\`
```

---

## Testing Checklist

### Test 1: Function Deployment
```bash
# Deploy function
git add netlify/functions/log-client-error.ts
git commit -m "feat: add client error logging function"
git push origin main

# Verify function deployed
netlify functions:list | grep log-client-error
```

### Test 2: Error Reporter
```bash
# Start dev server
npm run dev

# Open browser console at localhost:5173
# Run test:
import { reportError } from './src/utils/errorReporter'
reportError(new Error('Test'), 'console.test')

# Check logs (should see error within 1-2 seconds)
netlify logs:function log-client-error
```

### Test 3: Decryption Error
```bash
# Monitor logs in one terminal
netlify logs:function log-client-error

# In another terminal/browser:
# 1. Login to RiteMark with one Google account
# 2. Save some settings
# 3. Open RiteMark in a different browser (or incognito)
# 4. Login with same account
# 5. Try to open Settings

# Expected: Decryption error appears in logs
# Expected: Settings auto-deleted from Drive
# Expected: User sees fresh settings (not decryption error)
```

### Test 4: Settings Sync Error
```bash
# Monitor logs
netlify logs:function log-client-error

# Trigger error:
# 1. Revoke RiteMark's Drive access in Google Account settings
# 2. Try to save settings in RiteMark

# Expected: Drive sync error appears in logs
```

---

## Deployment Steps

```bash
# 1. Stage all changes
git add netlify/functions/log-client-error.ts \
        ritemark-app/src/utils/errorReporter.ts \
        ritemark-app/src/utils/settingsEncryption.ts \
        ritemark-app/src/services/settings/SettingsSyncService.ts \
        CLAUDE.md

# 2. Commit with clear message
git commit -m "feat(monitoring): add client-side error monitoring for AI agents

Sprint 26 MVP Implementation:
- Add Netlify error logging function
- Create client-side error reporter (fire-and-forget)
- Fix encryption error message to trigger auto-cleanup
- Add error reporting to decryption and sync errors
- Update CLAUDE.md with monitoring commands

AI agents can now monitor browser errors via:
netlify logs:function log-client-error

Files added:
- netlify/functions/log-client-error.ts
- ritemark-app/src/utils/errorReporter.ts

Files modified:
- ritemark-app/src/utils/settingsEncryption.ts
- ritemark-app/src/services/settings/SettingsSyncService.ts
- CLAUDE.md"

# 3. Push to main
git push origin main

# 4. Monitor deployment (5 minutes)
timeout 300 netlify logs:function log-client-error
```

---

## Success Validation

**✅ Sprint Complete When**:
1. Function logs show browser errors
2. Decryption error triggers auto-cleanup
3. AI agent can debug without asking user
4. No user experience degradation

**Test with**:
```bash
netlify logs:function log-client-error | grep "CLIENT-ERROR"
```

If you see errors with context and timestamps, **you're done**! ✅
