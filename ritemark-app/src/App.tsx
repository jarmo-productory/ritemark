import { useState, useRef, useEffect } from 'react'
import { Editor } from './components/Editor'
import type { Editor as TipTapEditor } from '@tiptap/react'
import { TableOfContents } from './components/TableOfContents'
import { SettingsButton } from './components/SettingsButton'

function App() {
  const [title, setTitle] = useState('Untitled Document')
  const [text, setText] = useState('')
  const [hasHeadings, setHasHeadings] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<TipTapEditor | null>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  // Check for actual rendered headings with text content
  useEffect(() => {
    const checkForHeadings = () => {
      if (!editorRef.current) return false
      const headings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')

      // Only count headings that have actual text content
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

  return (
    <main className="app-container">
      <SettingsButton
        authState="anonymous"
        onClick={() => {}}
      />

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

export default App
