import { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Editor } from './components/Editor'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useDriveSync } from './hooks/useDriveSync'
import { useTokenValidator } from './hooks/useTokenValidator'
import { useSettings } from './hooks/useSettings'
import { DriveFilePicker } from './components/drive/DriveFilePicker'
import { AuthContext } from './contexts/AuthContext'
import { tokenManagerEncrypted } from './services/auth/TokenManagerEncrypted'
import { setPersistedSelection } from './extensions/PersistedSelectionExtension'
import type { DriveFile } from './types/drive'
import type { Editor as TipTapEditor } from '@tiptap/react'
import type { EditorSelection } from './types/editor'
import 'tippy.js/dist/tippy.css'

function App() {
  // Authentication context
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false

  // Settings context
  const { settings, saveSettings, loading: settingsLoading } = useSettings()

  // Document state
  const [fileId, setFileId] = useState<string | null>(null)
  const [title, setTitle] = useState('Untitled Document')
  const [content, setContent] = useState('')
  const [editor, setEditor] = useState<TipTapEditor | null>(null)

  // Stable callback for onEditorReady
  const handleEditorReady = useCallback((editorInstance: TipTapEditor) => {
    setEditor(editorInstance)
  }, [])

  // Current selection from editor (received from Editor.tsx via callback)
  const [currentSelection, setCurrentSelection] = useState<EditorSelection>({
    text: '',
    from: 0,
    to: 0,
    isEmpty: true,
    wordCount: 0
  })

  // Handle selection changes from Editor component
  const handleSelectionChange = useCallback((selection: EditorSelection) => {
    setCurrentSelection(selection)
  }, [])

  // Persist last non-empty selection even when focus moves to input field
  const [lastSelection, setLastSelection] = useState<EditorSelection>({
    text: '',
    from: 0,
    to: 0,
    isEmpty: true,
    wordCount: 0
  })

  // Update persisted selection whenever currentSelection changes
  useEffect(() => {
    if (!currentSelection.isEmpty && currentSelection.text.trim().length > 0) {
      setLastSelection(currentSelection)
    } else if (currentSelection.isEmpty) {
      setLastSelection({
        text: '',
        from: 0,
        to: 0,
        isEmpty: true,
        wordCount: 0
      })
    }
  }, [currentSelection])

  // Update persisted highlight in editor when lastSelection changes
  useEffect(() => {
    if (!editor) {
      return
    }

    if (lastSelection && !lastSelection.isEmpty) {
      setPersistedSelection(editor, lastSelection.from, lastSelection.to)
    } else {
      setPersistedSelection(editor, null, null)
    }
  }, [lastSelection, editor])

  // Clear persisted selection
  const handleClearSelection = useCallback(() => {
    setLastSelection({
      text: '',
      from: 0,
      to: 0,
      isEmpty: true,
      wordCount: 0
    })

    // Clear persisted highlight in editor
    if (editor) {
      setPersistedSelection(editor, null, null)
    }
  }, [editor])

  // Drive file picker modal state
  const [showFilePicker, setShowFilePicker] = useState(false)

  // Authentication error dialog removed; use AuthModal via useTokenValidator

  // Track if user wants to create a new document
  const [isNewDocument, setIsNewDocument] = useState(false)

  // Sprint 18: Token expiration validator (Quick Fix)
  const { shouldShowAuthDialog, dismissAuthDialog, triggerAuthDialog } = useTokenValidator()

  // Track if WelcomeScreen should be shown (separate from isNewDocument)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true)

  // Sprint 28: Track auto-open loading state
  const [isAutoOpening, setIsAutoOpening] = useState(false)

  // Sprint 20: Handle OAuth callback from backend
  // Sprint 22: Use shared OAuth callback handler
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const accessToken = params.get('access_token')
      const userId = params.get('user_id')
      const error = params.get('error')

      // Only log if there's actually an OAuth callback to process
      if (accessToken || userId || error) {
        console.log('[App] OAuth callback check:', {
          hasAccessToken: !!accessToken,
          hasUserId: !!userId,
          hasError: !!error
        })
      }

      if (error) {
        // Only log actual errors, not state expiration (expected on page reload)
        if (error !== 'invalid_state') {
          console.error('[App] OAuth callback error:', {
            error,
            description: params.get('error_description')
          })
        }
        return
      }

      if (accessToken && userId) {
        console.log('[App] Processing backend OAuth callback...')
        try {
          // Sprint 22: Use shared callback handler
          const { oauthCallbackHandler } = await import('./services/auth/OAuthCallbackHandler')
          await oauthCallbackHandler.handleBackendCallback(params)

          console.log('[App] ✅ OAuth callback processed successfully')

          // Clean URL (remove tokens from address bar) and reload
          const cleanUrl = window.location.pathname
          window.location.replace(cleanUrl)
        } catch (error) {
          console.error('[App] ❌ Failed to process OAuth callback:', error)
        }
      }
    }

    handleOAuthCallback()
  }, [])

  // Track last opened file for "Pick up where you left off" feature
  useEffect(() => {
    const trackLastOpenedFile = async () => {
      // Only track if feature is enabled and we have a file open
      if (!fileId || !settings?.preferences?.autoOpenLastFile) {
        return
      }

      // Prevent saving if file ID hasn't actually changed
      if (settings?.preferences?.lastOpenedFileId === fileId) {
        return
      }

      try {
        // Update settings with last opened file ID
        const updatedSettings = {
          ...settings,
          preferences: {
            ...settings.preferences,
            lastOpenedFileId: fileId,
            lastOpenedFileName: title,
          },
          timestamp: Date.now()
        }

        await saveSettings(updatedSettings)
      } catch (error) {
        console.error('[App] Failed to save last opened file:', error)
      }
    }

    trackLastOpenedFile()
  }, [fileId, title])

  // Clear document state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out - clear document state and show WelcomeScreen
      setFileId(null)
      setTitle('Untitled Document')
      setContent('')
      setIsNewDocument(false)
      setShowWelcomeScreen(true)
      setShowFilePicker(false) // Close any open pickers
    }
  }, [isAuthenticated])

  // When token expires, show WelcomeScreen instead of AuthModal
  useEffect(() => {
    if (shouldShowAuthDialog) {
      // Token expired - navigate to WelcomeScreen
      setFileId(null)
      setTitle('Untitled Document')
      setContent('')
      setIsNewDocument(false)
      setShowWelcomeScreen(true)
      setShowFilePicker(false)
      dismissAuthDialog() // Reset the flag
    }
  }, [shouldShowAuthDialog, dismissAuthDialog])

  // Drive sync hook
  const handleFileCreated = useCallback((newFileId: string) => {
    setFileId(newFileId)
  }, [])

  const handleAuthError = useCallback(() => {
    triggerAuthDialog()
  }, [triggerAuthDialog])

  const { syncStatus, loadFile } = useDriveSync(fileId, title, content, {
    onFileCreated: handleFileCreated,
    // On auth errors (e.g., 401), open the unified AuthModal
    onAuthError: handleAuthError,
  })

  // Auto-open last file on app startup (after authentication loads)
  const hasAutoOpened = useRef(false)

  useEffect(() => {
    // Only auto-open ONCE per session
    if (hasAutoOpened.current) {
      return
    }

    // Do not attempt auto-open until settings finished loading
    if (settingsLoading) {
      return
    }

    const shouldAutoOpen =
      settings?.preferences?.autoOpenLastFile &&
      settings?.preferences?.lastOpenedFileId &&
      isAuthenticated &&
      !fileId

    if (shouldAutoOpen) {
      const lastFileId = settings.preferences?.lastOpenedFileId!

      setIsAutoOpening(true)

      // Load file content from Drive (same as handleFileSelect)
      const autoLoadFile = async () => {
        try {
          const { metadata, content: fileContent } = await loadFile(lastFileId)

          setFileId(metadata.id)
          setTitle(metadata.name)
          setContent(fileContent)
          setIsNewDocument(false)
          setShowWelcomeScreen(false)
        } catch (error) {
          console.error('[App] Failed to auto-open file:', error)
          setShowWelcomeScreen(true)
        } finally {
          setIsAutoOpening(false)
        }
      }

      autoLoadFile()
      hasAutoOpened.current = true
    }
  }, [isAuthenticated, settingsLoading, settings?.preferences?.autoOpenLastFile, settings?.preferences?.lastOpenedFileId, fileId, loadFile])

  const handleNewDocument = () => {
    setFileId(null)
    setTitle('Untitled Document')
    setContent('')
    setIsNewDocument(true)
    setShowWelcomeScreen(false) // Close WelcomeScreen when creating new document
  }

  const handleRenameDocument = async (newTitle: string) => {
    // Validate and ensure .md extension
    let validatedTitle = newTitle.trim()

    if (!validatedTitle) {
      alert('File name cannot be empty')
      return
    }

    // Add .md extension if missing
    if (!validatedTitle.endsWith('.md')) {
      validatedTitle += '.md'
    }

    const oldTitle = title
    setTitle(validatedTitle)

    // If we have a fileId, rename the file in Drive
    if (fileId) {
      try {
        const { DriveClient } = await import('./services/drive/driveClient')
        const driveClient = new DriveClient()

        await driveClient.renameFile(fileId, validatedTitle)

      } catch (error) {
        console.error('[App] Failed to rename file:', error)
        // Revert title on error
        setTitle(oldTitle)
        alert(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleOpenFromDrive = async () => {
    // Check if we have a valid access token
    const accessToken = await tokenManagerEncrypted.getAccessToken()

    if (!accessToken) {
      // No valid token; open auth modal instead of showing picker
      triggerAuthDialog()
      return
    }

    setShowWelcomeScreen(false) // Close WelcomeScreen BEFORE opening file picker
    setShowFilePicker(true)
  }

  const handleFileSelect = async (file: DriveFile) => {
    try {
      // Load file content from Drive
      const { metadata, content: fileContent } = await loadFile(file.id)

      // Update app state with loaded file
      setFileId(metadata.id)
      setTitle(metadata.name)
      setContent(fileContent)
      setIsNewDocument(false) // Reset new document flag when loading existing file
      setShowWelcomeScreen(false) // Ensure WelcomeScreen stays closed after file load

    } catch (error) {
      console.error('[App] Failed to load file:', error)
      alert(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setShowWelcomeScreen(true) // Show WelcomeScreen again if file load fails
    }
  }

  // AuthErrorDialog removed; retries handled by user after re-authentication

  const handleReloadFile = async () => {
    if (!fileId) {
      console.warn('[App] Cannot reload file: no fileId')
      return
    }

    try {
      // Reload file content from Drive
      const { metadata, content: fileContent } = await loadFile(fileId)

      // Update app state with reloaded content
      setTitle(metadata.name)
      setContent(fileContent)
    } catch (error) {
      console.error('[App] Failed to reload file:', error)
      alert(`Failed to reload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="h-full w-full">
      <AppShell
        documentTitle={title}
        fileId={fileId}
        syncStatus={syncStatus}
        editor={editor}
        hasDocument={!!fileId || isNewDocument}
        content={content}
        authorName={authContext?.user?.name}
        onNewDocument={handleNewDocument}
        onOpenFromDrive={handleOpenFromDrive}
        onRenameDocument={handleRenameDocument}
        onReloadFile={handleReloadFile}
      >
        {fileId || isNewDocument ? (
          <Editor
            value={content}
            onChange={setContent}
            onEditorReady={handleEditorReady}
            onSelectionChange={handleSelectionChange}
            fileId={fileId}
            currentSelection={currentSelection}
            persistedSelection={lastSelection}
            onClearSelection={handleClearSelection}
          />
        ) : showWelcomeScreen ? (
          <WelcomeScreen
            onNewDocument={handleNewDocument}
            onOpenFromDrive={handleOpenFromDrive}
            isLoading={settingsLoading || isAutoOpening}
            loadingMessage={
              settingsLoading
                ? "Loading settings..."
                : "Opening your last file..."
            }
            // No onCancel prop - WelcomeScreen is modal when no document exists
            // User must take action (New Document or Open from Drive)
          />
        ) : null}
      </AppShell>

      {showFilePicker && (
        <DriveFilePicker
          onFileSelect={handleFileSelect}
          onClose={() => {
            setShowFilePicker(false)
            // If no file was selected and no document is open, show WelcomeScreen again
            if (!fileId && !isNewDocument) {
              setShowWelcomeScreen(true)
            }
          }}
        />
      )}
    </div>
  )
}

export default App
