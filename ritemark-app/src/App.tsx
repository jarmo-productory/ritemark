import { useState, useContext } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Editor } from './components/Editor'
import { FormattingBubbleMenu } from './components/FormattingBubbleMenu'
import { TableContextMenu } from './components/TableContextMenu'
import { WelcomeScreen } from './components/WelcomeScreen'
import { AuthErrorDialog } from './components/AuthErrorDialog'
import { useDriveSync } from './hooks/useDriveSync'
import { DriveFilePicker } from './components/drive/DriveFilePicker'
import { AuthContext } from './contexts/AuthContext'
import { tokenManager } from './services/auth/tokenManager'
import type { DriveFile } from './types/drive'
import type { Editor as TipTapEditor } from '@tiptap/react'

function App() {
  // Authentication context
  useContext(AuthContext) // Used by child components via context

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
  }

  const handleRenameDocument = async (newTitle: string) => {
    setTitle(newTitle)
    
    // If we have a fileId, we should also rename the file in Drive
    if (fileId) {
      try {
        // TODO: Implement Drive file rename API call
        // For now, just update the local title
        // Later we'll add the Drive API call to rename the actual file
      } catch (error) {
        // Revert title on error
        setTitle(title)
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

    } catch (error) {
      console.error('[App] Failed to load file:', error)
      alert(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        syncStatus={syncStatus}
        editor={editor}
        hasDocument={!!fileId || isNewDocument}
        onNewDocument={handleNewDocument}
        onOpenFromDrive={handleOpenFromDrive}
        onRenameDocument={handleRenameDocument}
      >
        {fileId || isNewDocument ? (
          <>
            <Editor
              value={content}
              onChange={setContent}
              onEditorReady={setEditor}
            />
            <FormattingBubbleMenu editor={editor} />
            <TableContextMenu editor={editor} />
          </>
        ) : (
          <WelcomeScreen
            onNewDocument={handleNewDocument}
            onOpenFromDrive={handleOpenFromDrive}
          />
        )}
      </AppShell>

      {showFilePicker && (
        <DriveFilePicker
          onFileSelect={handleFileSelect}
          onClose={() => setShowFilePicker(false)}
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
