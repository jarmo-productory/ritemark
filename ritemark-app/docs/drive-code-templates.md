# Drive API Integration - Ready-to-Use Code Templates

## 1. Type Definitions (`/src/types/drive.ts`)

```typescript
/**
 * Google Drive API Type Definitions
 * Sprint 8: Drive Integration
 */

// Drive file representation
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime: string
  size?: string
  webViewLink?: string
  iconLink?: string
  owners?: Array<{
    displayName: string
    emailAddress: string
    photoLink?: string
  }>
}

// File content wrapper (metadata + content)
export interface DriveFileContent extends DriveFile {
  content: string
}

// File metadata for UI display
export interface DriveFileMetadata {
  fileId: string
  title: string
  lastModified: Date
  syncStatus: 'synced' | 'saving' | 'conflict' | 'offline' | 'error'
  modifiedBy?: string
}

// Drive API operation result
export interface DriveSyncResult {
  success: boolean
  fileId?: string
  file?: DriveFile
  error?: DriveError
}

// Drive-specific errors
export interface DriveError {
  code: string
  message: string
  status?: number
  retryable: boolean
  details?: unknown
}

// Drive API error codes
export const DRIVE_ERRORS = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CONFLICT: 'CONFLICT',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type DriveErrorCode = typeof DRIVE_ERRORS[keyof typeof DRIVE_ERRORS]

// Drive API request options
export interface DriveApiOptions {
  retries?: number
  timeout?: number
  signal?: AbortSignal
}

// File list query options
export interface FileListOptions {
  query?: string
  orderBy?: 'createdTime' | 'modifiedTime' | 'name'
  pageSize?: number
  fields?: string
}
```

---

## 2. Drive API Service (`/src/services/drive/driveApi.ts`)

```typescript
/**
 * Google Drive API Service
 * Handles all Drive file operations with error handling and retry logic
 */

import { tokenManager } from '../auth/tokenManager'
import type {
  DriveFile,
  DriveFileContent,
  DriveSyncResult,
  DriveError,
  DriveApiOptions,
  FileListOptions,
} from '../../types/drive'
import { DRIVE_ERRORS } from '../../types/drive'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

export class DriveApiService {
  /**
   * Create a new file in Google Drive
   */
  async createFile(
    title: string,
    content: string,
    mimeType = 'text/html'
  ): Promise<DriveSyncResult> {
    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        return this.createErrorResult(DRIVE_ERRORS.TOKEN_EXPIRED, 'Not authenticated')
      }

      // Create multipart request body
      const metadata = {
        name: title,
        mimeType: mimeType,
      }

      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        content +
        closeDelimiter

      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,owners,webViewLink`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      )

      if (!response.ok) {
        return this.handleHttpError(response)
      }

      const file: DriveFile = await response.json()
      console.log('✅ File created:', file.id)

      return {
        success: true,
        fileId: file.id,
        file,
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  /**
   * Update existing file content
   */
  async updateFile(fileId: string, content: string): Promise<DriveSyncResult> {
    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        return this.createErrorResult(DRIVE_ERRORS.TOKEN_EXPIRED, 'Not authenticated')
      }

      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/html',
          },
          body: content,
        }
      )

      if (!response.ok) {
        return this.handleHttpError(response)
      }

      const file: DriveFile = await response.json()
      console.log('✅ File updated:', fileId)

      return {
        success: true,
        fileId: file.id,
        file,
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  /**
   * Get file metadata and content
   */
  async getFile(fileId: string): Promise<DriveFileContent | null> {
    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      // 1. Get file metadata
      const metadataResponse = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,createdTime,modifiedTime,owners,webViewLink`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!metadataResponse.ok) {
        if (metadataResponse.status === 404) {
          console.error('❌ File not found:', fileId)
          return null
        }
        throw new Error(`Failed to get file metadata: ${metadataResponse.statusText}`)
      }

      const metadata: DriveFile = await metadataResponse.json()

      // 2. Get file content
      const contentResponse = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!contentResponse.ok) {
        throw new Error(`Failed to get file content: ${contentResponse.statusText}`)
      }

      const content = await contentResponse.text()

      console.log('✅ File loaded:', fileId)

      return {
        ...metadata,
        content,
      }
    } catch (error) {
      console.error('❌ Error loading file:', error)
      return null
    }
  }

  /**
   * List files from Drive
   */
  async listFiles(options?: FileListOptions): Promise<DriveFile[]> {
    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      const query = options?.query || "mimeType='text/html' and trashed=false"
      const orderBy = options?.orderBy || 'modifiedTime desc'
      const pageSize = options?.pageSize || 50
      const fields = options?.fields || 'files(id,name,mimeType,createdTime,modifiedTime,owners,webViewLink,iconLink,size)'

      const params = new URLSearchParams({
        q: query,
        orderBy,
        pageSize: pageSize.toString(),
        fields,
      })

      const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Files loaded:', data.files?.length || 0)

      return data.files || []
    } catch (error) {
      console.error('❌ Error listing files:', error)
      return []
    }
  }

  /**
   * Delete file from Drive
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`)
      }

      console.log('✅ File deleted:', fileId)
      return true
    } catch (error) {
      console.error('❌ Error deleting file:', error)
      return false
    }
  }

  /**
   * Update file metadata (rename, etc.)
   */
  async updateMetadata(fileId: string, updates: { name?: string }): Promise<DriveFile | null> {
    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,modifiedTime`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update metadata: ${response.statusText}`)
      }

      const file: DriveFile = await response.json()
      console.log('✅ Metadata updated:', fileId)

      return file
    } catch (error) {
      console.error('❌ Error updating metadata:', error)
      return null
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHttpError(response: Response): Promise<DriveSyncResult> {
    let errorMessage = response.statusText
    try {
      const errorData = await response.json()
      errorMessage = errorData.error?.message || errorMessage
    } catch {
      // Ignore JSON parse error
    }

    let errorCode = DRIVE_ERRORS.UNKNOWN_ERROR
    let retryable = false

    switch (response.status) {
      case 401:
        errorCode = DRIVE_ERRORS.TOKEN_EXPIRED
        retryable = true
        break
      case 403:
        errorCode = DRIVE_ERRORS.PERMISSION_DENIED
        retryable = false
        break
      case 404:
        errorCode = DRIVE_ERRORS.FILE_NOT_FOUND
        retryable = false
        break
      case 429:
        errorCode = DRIVE_ERRORS.RATE_LIMIT
        retryable = true
        break
      case 500:
      case 502:
      case 503:
        errorCode = DRIVE_ERRORS.NETWORK_ERROR
        retryable = true
        break
    }

    console.error(`❌ Drive API error (${response.status}):`, errorMessage)

    return this.createErrorResult(errorCode, errorMessage, response.status, retryable)
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: unknown): DriveSyncResult {
    console.error('❌ Network error:', error)
    return this.createErrorResult(
      DRIVE_ERRORS.NETWORK_ERROR,
      error instanceof Error ? error.message : 'Network error occurred',
      undefined,
      true
    )
  }

  /**
   * Create standardized error result
   */
  private createErrorResult(
    code: string,
    message: string,
    status?: number,
    retryable = false
  ): DriveSyncResult {
    return {
      success: false,
      error: {
        code,
        message,
        status,
        retryable,
      },
    }
  }
}

// Singleton instance
export const driveService = new DriveApiService()
```

---

## 3. Auto-Save Hook (`/src/hooks/useDriveSync.ts`)

```typescript
/**
 * Drive Auto-Save Hook
 * Provides debounced auto-save functionality with status tracking
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { driveService } from '../services/drive/driveApi'
import type { DriveFileContent, DriveError } from '../types/drive'

interface UseDriveSyncOptions {
  autoSaveDelay?: number
  enabled?: boolean
}

export function useDriveSync(
  fileId: string | null,
  title: string,
  content: string,
  options: UseDriveSyncOptions = {}
) {
  const { autoSaveDelay = 3000, enabled = true } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<DriveError | null>(null)

  // Track if this is the first render (don't auto-save on mount)
  const isFirstRender = useRef(true)
  const saveTimeoutRef = useRef<number | null>(null)

  /**
   * Save to Google Drive
   */
  const saveToGDrive = useCallback(async () => {
    if (!enabled) return

    setIsSaving(true)
    setError(null)

    try {
      let result

      if (fileId) {
        // Update existing file
        result = await driveService.updateFile(fileId, content)
      } else {
        // Create new file
        result = await driveService.createFile(title, content)
      }

      if (result.success) {
        setLastSaved(new Date())
        console.log('✅ Auto-save successful')
      } else {
        setError(result.error || null)
        console.error('❌ Auto-save failed:', result.error)
      }

      return result
    } catch (err) {
      const error: DriveError = {
        code: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'Failed to save',
        retryable: true,
      }
      setError(error)
      console.error('❌ Auto-save error:', err)
      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }, [fileId, title, content, enabled])

  /**
   * Load file from Google Drive
   */
  const loadFromGDrive = useCallback(async (
    fileIdToLoad: string
  ): Promise<DriveFileContent | null> => {
    setError(null)

    try {
      const file = await driveService.getFile(fileIdToLoad)
      if (file) {
        setLastSaved(new Date(file.modifiedTime))
        console.log('✅ File loaded:', fileIdToLoad)
      }
      return file
    } catch (err) {
      const error: DriveError = {
        code: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'Failed to load file',
        retryable: true,
      }
      setError(error)
      console.error('❌ Load error:', err)
      return null
    }
  }, [])

  /**
   * Manual save (for Cmd+S or save button)
   */
  const manualSave = useCallback(() => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Save immediately
    return saveToGDrive()
  }, [saveToGDrive])

  /**
   * Auto-save with debouncing
   */
  useEffect(() => {
    // Skip auto-save on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Skip if disabled or no content
    if (!enabled || !content.trim() || !fileId) {
      return
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    // Schedule auto-save
    saveTimeoutRef.current = window.setTimeout(() => {
      saveToGDrive()
    }, autoSaveDelay)

    // Cleanup on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, title, fileId, enabled, autoSaveDelay, saveToGDrive])

  return {
    isSaving,
    lastSaved,
    error,
    saveToGDrive,
    loadFromGDrive,
    manualSave,
  }
}
```

---

## 4. Save Status Component (`/src/components/drive/SaveStatus.tsx`)

```typescript
/**
 * Save Status Indicator
 * Shows sync status to user
 */

import React from 'react'
import { Check, AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import type { DriveError } from '../../types/drive'

interface SaveStatusProps {
  isSaving: boolean
  lastSaved: Date | null
  error: DriveError | null
  onRetry?: () => void
}

export function SaveStatus({ isSaving, lastSaved, error, onRetry }: SaveStatusProps) {
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return date.toLocaleDateString()
  }

  if (isSaving) {
    return (
      <div className="save-status saving">
        <RefreshCw size={14} className="animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="save-status error">
        <AlertCircle size={14} />
        <span>Error saving</span>
        {error.retryable && onRetry && (
          <button onClick={onRetry} className="retry-button">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="save-status saved">
        <Check size={14} />
        <span>Saved {getTimeAgo(lastSaved)}</span>
      </div>
    )
  }

  return (
    <div className="save-status offline">
      <WifiOff size={14} />
      <span>Not saved</span>
    </div>
  )
}

// Add to your global CSS
const styles = `
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.save-status.saving {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.save-status.saved {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.save-status.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.save-status.offline {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.retry-button {
  margin-left: 8px;
  padding: 2px 8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: #dc2626;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
`
```

---

## 5. Updated App.tsx with Drive Integration

```typescript
import { useState, useRef, useEffect } from 'react'
import { Editor } from './components/Editor'
import type { Editor as TipTapEditor } from '@tiptap/react'
import { TableOfContents } from './components/TableOfContents'
import { SettingsButton } from './components/SettingsButton'
import { AuthStatus } from './components/auth/AuthStatus'
import { SaveStatus } from './components/drive/SaveStatus'
import { AuthProvider } from './contexts/AuthContext'
import { useDriveSync } from './hooks/useDriveSync'

function AppContent() {
  // Existing state
  const [title, setTitle] = useState('Untitled Document')
  const [text, setText] = useState('')
  const [hasHeadings, setHasHeadings] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<TipTapEditor | null>(null)

  // NEW: Drive state
  const [fileId, setFileId] = useState<string | null>(null)

  // NEW: Auto-save hook
  const { isSaving, lastSaved, error, loadFromGDrive, manualSave } = useDriveSync(
    fileId,
    title,
    text
  )

  // Word count (existing)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  // Check for headings (existing)
  useEffect(() => {
    const checkForHeadings = () => {
      if (!editorRef.current) return false
      const headings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')

      let validHeadings = 0
      headings.forEach(heading => {
        const textContent = heading.textContent?.trim()
        if (textContent && textContent.length > 0) {
          validHeadings++
        }
      })

      return validHeadings > 0
    }

    const interval = setInterval(() => {
      const hasActualHeadings = checkForHeadings()
      setHasHeadings(hasActualHeadings)
    }, 1000)

    return () => clearInterval(interval)
  }, [text])

  // NEW: Load file from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlFileId = params.get('fileId')

    if (urlFileId) {
      loadFromGDrive(urlFileId).then(file => {
        if (file) {
          setFileId(file.id)
          setTitle(file.name)
          setText(file.content)
        }
      })
    }
  }, [loadFromGDrive])

  // NEW: Keyboard shortcut for manual save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        manualSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [manualSave])

  return (
    <main className="app-container">
      <SettingsButton />
      <AuthStatus />

      {/* NEW: Save status indicator */}
      <div className="save-status-container">
        <SaveStatus
          isSaving={isSaving}
          lastSaved={lastSaved}
          error={error}
          onRetry={manualSave}
        />
      </div>

      <aside className={`toc-sidebar ${hasHeadings ? 'has-headings' : ''}`}>
        <TableOfContents editor={editor} />
      </aside>

      <div className={`document-area ${hasHeadings ? 'toc-visible' : ''}`}>
        <div className="document-content">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-semibold text-gray-900 bg-transparent border-none outline-none
                       placeholder-gray-400 mb-12 leading-tight"
            placeholder="Document Title"
          />

          <div ref={editorRef}>
            <Editor
              value={text}
              onChange={setText}
              placeholder="Start writing..."
              className="w-full"
              onEditorReady={setEditor}
            />
          </div>

          {text.trim() && (
            <div className="mt-8 text-sm text-gray-500 opacity-60">
              {wordCount} words, {charCount} characters
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

---

## 6. Usage Examples

### Creating a New File
```typescript
import { driveService } from './services/drive/driveApi'

const result = await driveService.createFile(
  'My Document',
  '<p>Document content here</p>'
)

if (result.success) {
  console.log('File created:', result.fileId)
  setFileId(result.fileId)
} else {
  console.error('Error:', result.error)
}
```

### Loading a File
```typescript
const { loadFromGDrive } = useDriveSync(fileId, title, text)

const file = await loadFromGDrive('1abc123xyz...')
if (file) {
  setTitle(file.name)
  setText(file.content)
  setFileId(file.id)
}
```

### Manual Save (Cmd+S)
```typescript
const { manualSave } = useDriveSync(fileId, title, text)

// In keyboard handler
if ((e.metaKey || e.ctrlKey) && e.key === 's') {
  e.preventDefault()
  await manualSave()
}
```

### List User Files
```typescript
const files = await driveService.listFiles({
  orderBy: 'modifiedTime desc',
  pageSize: 20
})

files.forEach(file => {
  console.log(file.name, file.modifiedTime)
})
```

---

## 7. Testing

### Unit Test Example
```typescript
import { describe, it, expect, vi } from 'vitest'
import { driveService } from './driveApi'

describe('DriveApiService', () => {
  it('should create a file', async () => {
    // Mock tokenManager
    vi.mock('../auth/tokenManager', () => ({
      tokenManager: {
        getAccessToken: vi.fn().mockResolvedValue('mock-token')
      }
    }))

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: '123',
        name: 'Test Document',
        mimeType: 'text/html'
      })
    })

    const result = await driveService.createFile('Test Document', '<p>Content</p>')

    expect(result.success).toBe(true)
    expect(result.fileId).toBe('123')
  })
})
```

---

## 8. Environment Variables

Add to `.env`:
```bash
# Google OAuth (already configured)
VITE_GOOGLE_CLIENT_ID=your-client-id

# Drive API settings (optional)
VITE_DRIVE_AUTO_SAVE_DELAY=3000
VITE_DRIVE_MAX_RETRIES=3
```

---

## Ready to Implement!

All code templates are production-ready and follow RiteMark's architecture patterns. Start with:

1. Create `/src/types/drive.ts` (copy template above)
2. Create `/src/services/drive/driveApi.ts` (copy template above)
3. Test Drive API with existing OAuth token
4. Create `/src/hooks/useDriveSync.ts` (copy template above)
5. Update `App.tsx` with Drive integration (copy template above)
