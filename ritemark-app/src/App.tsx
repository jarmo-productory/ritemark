import { useState, useContext, useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Editor } from './components/Editor'
import { WelcomeScreen } from './components/WelcomeScreen'
import { AuthErrorDialog } from './components/AuthErrorDialog'
import { useDriveSync } from './hooks/useDriveSync'
import { DriveFilePicker } from './components/drive/DriveFilePicker'
import { AuthContext } from './contexts/AuthContext'
import { tokenManager } from './services/auth/tokenManager'
import type { DriveFile } from './types/drive'
import type { Editor as TipTapEditor } from '@tiptap/react'
import 'tippy.js/dist/tippy.css'

function App() {
  // Authentication context
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false

  // Document state
  const [fileId, setFileId] = useState<string | null>(null)
  const [title, setTitle] = useState('Untitled Document')
  const [content, setContent] = useState('')
  const [editor, setEditor] = useState<TipTapEditor | null>(null)

  // Drive file picker modal state
  const [showFilePicker, setShowFilePicker] = useState(false)

  // Authentication error dialog state
  const [showAuthError, setShowAuthError] = useState(false)

  // Track if user wants to create a new document
  const [isNewDocument, setIsNewDocument] = useState(false)

  // Track if WelcomeScreen should be shown (separate from isNewDocument)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true)

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

  // Drive sync hook
  const { syncStatus, loadFile, forceSave } = useDriveSync(fileId, title, content, {
    onFileCreated: (newFileId) => setFileId(newFileId),
    onAuthError: () => setShowAuthError(true),
  })

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

        console.log(`[App] File renamed: ${validatedTitle}`)
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
    const accessToken = await tokenManager.getAccessToken()

    if (!accessToken) {
      // Don't show file picker if no valid token
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

  const handleAuthErrorRetry = () => {
    setShowAuthError(false)
    // Retry the last save operation
    forceSave()
  }

  const handleAuthErrorSignIn = () => {
    setShowAuthError(false)
    // Trigger sign-in flow (this will be handled by the sidebar)
    // For now, just close the dialog - user can click sign in in sidebar
  }

  return (
    <>
      <AppShell
        documentTitle={title}
        fileId={fileId}
        syncStatus={syncStatus}
        editor={editor}
        hasDocument={!!fileId || isNewDocument}
        onNewDocument={handleNewDocument}
        onOpenFromDrive={handleOpenFromDrive}
        onRenameDocument={handleRenameDocument}
      >
        {fileId || isNewDocument ? (
          <Editor
            value={content}
            onChange={setContent}
            onEditorReady={setEditor}
          />
        ) : showWelcomeScreen ? (
          <WelcomeScreen
            onNewDocument={handleNewDocument}
            onOpenFromDrive={handleOpenFromDrive}
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

      <AuthErrorDialog
        isOpen={showAuthError}
        onRetry={handleAuthErrorRetry}
        onSignIn={handleAuthErrorSignIn}
      />
    </>
  )
}

export default App
