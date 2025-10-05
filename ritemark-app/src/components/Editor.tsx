import React, { useEffect } from 'react'
import { useEditor, EditorContent, type Editor as TipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { marked } from 'marked'
import TurndownService from 'turndown'

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
})

// Keep Turndown's default escaping behavior to prevent content corruption
// The unescape logic below handles loading escaped files correctly

// Create lowlight instance with common languages
const lowlight = createLowlight(common)

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onEditorReady?: (editor: TipTapEditor) => void
}

export function Editor({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  onEditorReady,
}: EditorProps) {

  const editor: TipTapEditor | null = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false, // Disable default to use enhanced version
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'italic',
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'tiptap-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'tiptap-ordered-list',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'tiptap-list-item',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: value,
    onCreate: ({ editor }) => {
      onEditorReady?.(editor)
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Convert HTML back to markdown for storage
      const markdown = turndownService.turndown(html)
      onChange(markdown)
      onEditorReady?.(editor) // Ensure editor is always available
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handleKeyDown: (view, event): boolean => {
        // Handle keyboard shortcuts
        const isMod = event.metaKey || event.ctrlKey

        // Code block shortcut: Mod+Shift+C
        if (isMod && event.shiftKey && event.key === 'C') {
          event.preventDefault()
          return editor?.commands.toggleCodeBlock() || false
        }

        // Ordered list shortcut: Mod+Shift+7
        if (isMod && event.shiftKey && event.key === '&') { // Shift+7
          event.preventDefault()
          return editor?.commands.toggleOrderedList() || false
        }

        // Bullet list shortcut: Mod+Shift+8
        if (isMod && event.shiftKey && event.key === '*') { // Shift+8
          event.preventDefault()
          return editor?.commands.toggleBulletList() || false
        }

        // Tab handling for lists
        if (event.key === 'Tab') {
          const { selection } = view.state
          const { $from } = selection

          if ($from.parent.type.name === 'listItem') {
            event.preventDefault()
            if (event.shiftKey) {
              return editor?.commands.liftListItem('listItem') || false
            } else {
              return editor?.commands.sinkListItem('listItem') || false
            }
          }
        }

        // Enter handling for lists
        if (event.key === 'Enter') {
          const { selection } = view.state
          const { $from } = selection

          if ($from.parent.type.name === 'listItem') {
            const isEmpty = $from.parent.textContent.trim() === ''
            if (isEmpty) {
              return editor?.commands.liftListItem('listItem') || false
            }
          }
        }

        return false
      },
    },
  })

  // Notify parent when editor is ready and available
  React.useEffect(() => {
    if (editor) {
      onEditorReady?.(editor)
    }
  }, [editor, onEditorReady])

  // Update editor content when value prop changes (e.g., when loading a file)
  useEffect(() => {
    // Convert current editor HTML back to markdown to compare with incoming value
    const currentMarkdown = editor ? turndownService.turndown(editor.getHTML()) : ''

    if (editor && value !== currentMarkdown) {
      // Check if value is HTML (starts with common HTML tags)
      // Only check for actual HTML block tags, not random < > characters
      const isHTML = /^<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|strong|em|code)[\s>]/i.test(value.trim())

      if (!isHTML && value.trim()) {
        // Treat all non-HTML text as markdown (including plain text)
        // marked.js will handle plain text gracefully, converting line breaks to <p> tags
        try {
          // Unescape markdown that was escaped by turndown
          const unescapedMarkdown = value
            .replace(/\\\*/g, '*')  // Unescape asterisks
            .replace(/\\#/g, '#')   // Unescape hashes
            .replace(/\\_/g, '_')   // Unescape underscores
            .replace(/\\\[/g, '[')  // Unescape brackets
            .replace(/\\\]/g, ']')
            .replace(/\\`/g, '`')   // Unescape backticks

          const html = marked(unescapedMarkdown, {
            breaks: true,
            gfm: true,
            mangle: false,
            headerIds: false
          })
          console.log('Converted markdown to HTML:', {
            originalLength: value.length,
            htmlLength: html.length,
            hadEscapes: value !== unescapedMarkdown
          })
          editor.commands.setContent(html)
        } catch (error) {
          console.error('Markdown conversion error:', error)
          // Fallback: treat as plain text
          editor.commands.setContent(`<p>${value.replace(/\n/g, '</p><p>')}</p>`)
        }
      } else {
        console.log('Content is already HTML, skipping conversion')
        // Already HTML or empty
        editor.commands.setContent(value)
      }
    }
  }, [editor, value])

  return (
    <div className={`wysiwyg-editor ${className}`}>
      <EditorContent editor={editor} />
      <style>{`
        .wysiwyg-editor .ProseMirror {
          outline: none !important;
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          min-height: 60vh !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-size: 18px !important;
          line-height: 1.7 !important;
          color: #374151 !important;
        }

        .wysiwyg-editor .ProseMirror p {
          margin: 0 0 1em 0 !important;
          font-size: 18px !important;
          line-height: 1.7 !important;
          color: #374151 !important;
        }

        .wysiwyg-editor .ProseMirror h1 {
          font-size: 2rem !important;
          font-weight: 600 !important;
          margin: 1.5em 0 0.5em 0 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror h2 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin: 1.25em 0 0.5em 0 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror h3 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin: 1em 0 0.5em 0 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror h4 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin: 1em 0 0.5em 0 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror h5 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin: 1em 0 0.5em 0 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror h6 {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin: 1em 0 0.5em 0 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror ul.tiptap-bullet-list {
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
          list-style-type: disc !important;
        }

        .wysiwyg-editor .ProseMirror ol.tiptap-ordered-list {
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
          list-style-type: decimal !important;
        }

        .wysiwyg-editor .ProseMirror li.tiptap-list-item {
          margin: 0.25em 0 !important;
          line-height: 1.7 !important;
          display: list-item !important;
        }

        .wysiwyg-editor .ProseMirror strong {
          font-weight: 600 !important;
          color: #111827 !important;
        }

        .wysiwyg-editor .ProseMirror em {
          font-style: italic !important;
          color: #374151 !important;
        }

        .wysiwyg-editor .ProseMirror a.tiptap-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }

        .wysiwyg-editor .ProseMirror a.tiptap-link:hover {
          color: #1d4ed8 !important;
        }

        .wysiwyg-editor .ProseMirror ::selection {
          background: rgba(59, 130, 246, 0.15) !important;
          border-radius: 2px !important;
        }

        .wysiwyg-editor .ProseMirror ::-moz-selection {
          background: rgba(59, 130, 246, 0.15) !important;
        }

        /* Code block styling with dark theme */
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block {
          background: #1f2937 !important;
          color: #f9fafb !important;
          border-radius: 8px !important;
          padding: 1rem !important;
          margin: 1em 0 !important;
          overflow-x: auto !important;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          position: relative !important;
        }

        .wysiwyg-editor .ProseMirror pre.tiptap-code-block code {
          background: none !important;
          padding: 0 !important;
          font-size: inherit !important;
          color: inherit !important;
        }

        /* Syntax highlighting tokens */
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-keyword { color: #c678dd !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-string { color: #98c379 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-number { color: #d19a66 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-comment { color: #7c7c7c !important; font-style: italic !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-function { color: #61afef !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-variable { color: #e06c75 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-type { color: #e5c07b !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-operator { color: #56b6c2 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-punctuation { color: #abb2bf !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-property { color: #d19a66 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-literal { color: #56b6c2 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-built_in { color: #e5c07b !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-class { color: #e5c07b !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-title { color: #61afef !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-attr { color: #d19a66 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-tag { color: #e06c75 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-name { color: #e06c75 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-selector-tag { color: #e06c75 !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-selector-class { color: #e5c07b !important; }
        .wysiwyg-editor .ProseMirror pre.tiptap-code-block .hljs-selector-id { color: #61afef !important; }

        /* Enhanced mobile selection */
        @media (max-width: 768px) {
          .wysiwyg-editor .ProseMirror ::selection {
            background: rgba(59, 130, 246, 0.2) !important;
          }
        }

        .wysiwyg-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af !important;
          content: attr(data-placeholder) !important;
          float: left !important;
          height: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  )
}
