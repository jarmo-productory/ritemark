import React, { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor as TipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import { createLowlight, common } from 'lowlight'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'
import { tableExtensions } from '../extensions/tableExtensions'
import { ImageExtension } from '../extensions/imageExtensions'
import { SlashCommands } from '../extensions/SlashCommands'
import { FormattingBubbleMenu } from './FormattingBubbleMenu'
import { TableOverlayControls } from './TableOverlayControls'

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',  // Use * for italic (matches TipTap BubbleMenu input)
  strongDelimiter: '**'  // Use ** for bold (matches TipTap BubbleMenu input)
})

// Enable GFM tables plugin for turndown
turndownService.use(tables)

// Add rule to remove <colgroup> elements that TipTap adds to tables
// Turndown's table plugin doesn't handle colgroup properly, causing tables to be skipped
turndownService.addRule('stripColgroup', {
  filter: 'colgroup',
  replacement: function () {
    // Remove colgroup entirely - it's just styling metadata
    return ''
  }
})

// Override the tableCell rule to escape pipe characters in cell content
// The turndown-plugin-gfm doesn't escape pipes by default, which breaks table structure
// when cell content contains | characters (e.g., code examples, commands)
turndownService.addRule('tableCellWithPipeEscape', {
  filter: ['th', 'td'],
  replacement: function (content, node) {
    // Escape pipe characters to prevent breaking table structure
    const escapedContent = content.replace(/\|/g, '\\|')

    // Replicate the original cell formatting logic from turndown-plugin-gfm
    // Table cells always have a parent (tr), so this is safe
    const index = node.parentNode ? Array.prototype.indexOf.call(node.parentNode.childNodes, node) : 0
    const prefix = index === 0 ? '| ' : ' '
    return prefix + escapedContent + ' |'
  }
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
  const isInitialMount = useRef(true)
  const lastExternalValue = useRef(value)
  const lastOnChangeValue = useRef<string>('')

  // Convert initial markdown to HTML (only runs once on mount)
  const [initialContent] = useState(() => {
    if (!value || !value.trim()) return ''

    const isHTML = /^<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|strong|em|code)[\s>]/i.test(value.trim())

    if (isHTML) {
      return value
    } else {
      // Convert markdown to HTML
      try {
        return marked(value, { breaks: true, gfm: true }) as string
      } catch (error) {
        console.error('Markdown conversion error:', error)
        return `<p>${value.replace(/\n/g, '</p><p>')}</p>`
      }
    }
  })

  const editor: TipTapEditor | null = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false, // Disable default to use enhanced version
        link: false, // Disable StarterKit's Link to use custom Link extension
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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
        validate: (url) => {
          return url.startsWith('https://') || url.startsWith('http://')
        },
      }),
      ...tableExtensions,
      ImageExtension,
      SlashCommands,
    ],
    content: initialContent,
    onCreate: ({ editor }) => {
      onEditorReady?.(editor)
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Convert HTML back to markdown for storage
      const markdown = turndownService.turndown(html)

      // Only call onChange if content actually changed
      // This prevents unnecessary re-renders that close bubble menus
      if (markdown !== lastOnChangeValue.current) {
        lastOnChangeValue.current = markdown
        onChange(markdown)
      }

      onEditorReady?.(editor) // Ensure editor is always available
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handleDrop: (view, event, _slice, _moved) => {
        // Handle image drag-and-drop
        if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0]

          // Check if it's an image
          if (file.type.startsWith('image/')) {
            event.preventDefault()

            // Upload to Drive and insert at drop position
            import('../services/drive/DriveImageUpload').then(({ uploadImageToDrive }) => {
              uploadImageToDrive(file)
                .then((url) => {
                  const { schema } = view.state
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })

                  if (!coordinates) return

                  const node = schema.nodes.image.create({ src: url, alt: file.name })
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                })
                .catch((err) => {
                  console.error('Image upload failed:', err)
                  alert('Failed to upload image: ' + err.message)
                })
            })

            return true
          }
        }
        return false
      },
      handlePaste: (_view, event) => {
        // Handle image paste from clipboard
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0]

          // Check if it's an image
          if (file.type.startsWith('image/')) {
            event.preventDefault()

            // Upload to Drive and insert at cursor position
            import('../services/drive/DriveImageUpload').then(({ uploadImageToDrive }) => {
              uploadImageToDrive(file)
                .then((url) => {
                  if (editor) {
                    editor.chain().focus().setImage({ src: url, alt: file.name }).run()
                  }
                })
                .catch((err) => {
                  console.error('Image upload failed:', err)
                  alert('Failed to upload image: ' + err.message)
                })
            })

            return true
          }
        }
        return false
      },
      handleKeyDown: (view, event): boolean => {
        // Handle keyboard shortcuts
        const isMod = event.metaKey || event.ctrlKey

        // Code block shortcut: Mod+Shift+C
        if (isMod && event.shiftKey && event.key === 'C') {
          event.preventDefault()
          return editor?.commands.toggleCodeBlock() || false
        }

        // Table insertion: Remove keyboard shortcut entirely
        // Users will insert tables via toolbar button (Phase 2)
        // No safe keyboard shortcut exists (Cmd+Shift+T = reopen tab, Cmd+Option+T conflicts with apps)

        // Table row/column operations (only when inside a table)
        if (editor?.isActive('table')) {
          // Cmd+Shift+↑ - Add row before
          if (isMod && event.shiftKey && event.key === 'ArrowUp') {
            event.preventDefault()
            return editor?.commands.addRowBefore() || false
          }

          // Cmd+Shift+↓ - Add row after
          if (isMod && event.shiftKey && event.key === 'ArrowDown') {
            event.preventDefault()
            return editor?.commands.addRowAfter() || false
          }

          // Cmd+Shift+← - Add column before
          if (isMod && event.shiftKey && event.key === 'ArrowLeft') {
            event.preventDefault()
            return editor?.commands.addColumnBefore() || false
          }

          // Cmd+Shift+→ - Add column after
          if (isMod && event.shiftKey && event.key === 'ArrowRight') {
            event.preventDefault()
            return editor?.commands.addColumnAfter() || false
          }

          // Cmd+Backspace - Delete row
          if (isMod && event.key === 'Backspace') {
            event.preventDefault()
            return editor?.commands.deleteRow() || false
          }

          // Cmd+Delete - Delete column
          if (isMod && event.key === 'Delete') {
            event.preventDefault()
            return editor?.commands.deleteColumn() || false
          }
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
  // Skip updates during active editing to prevent bubble menus from closing
  useEffect(() => {
    if (!editor) return

    // Convert current editor HTML back to markdown to compare with incoming value
    const currentMarkdown = turndownService.turndown(editor.getHTML())

    // On initial mount, always process the value
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastExternalValue.current = value
      lastOnChangeValue.current = value
      // Don't return - let it process the initial content below
    }

    // Only update if value changed externally (not from editor's own onChange)
    // This prevents the editor from updating during typing/formatting
    const isExternalChange = value !== currentMarkdown && value !== lastOnChangeValue.current

    if (isExternalChange || currentMarkdown === '') {
      // Check if value is HTML (starts with common HTML tags)
      // Only check for actual HTML block tags, not random < > characters
      const isHTML = /^<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|strong|em|code)[\s>]/i.test(value.trim())

      if (!isHTML && value.trim()) {
        // Treat all non-HTML text as markdown (including plain text)
        // marked.js will handle plain text gracefully, converting line breaks to <p> tags
        try {
          const html = marked(value, {
            breaks: true,
            gfm: true
          }) as string
          editor.commands.setContent(html)
        } catch (error) {
          console.error('Markdown conversion error:', error)
          // Fallback: treat as plain text
          editor.commands.setContent(`<p>${value.replace(/\n/g, '</p><p>')}</p>`)
        }
      } else {
        // Already HTML or empty
        editor.commands.setContent(value)
      }

      lastExternalValue.current = value
    }
  }, [editor, value])

  return (
    <div className={`wysiwyg-editor ${className}`}>
      <EditorContent editor={editor} />

      {editor ? (
        <>
          <FormattingBubbleMenu editor={editor} />
          <TableOverlayControls editor={editor} />
        </>
      ) : (
        <div style={{ display: 'none' }}>Editor not ready</div>
      )}
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
          max-width: 100% !important;
          max-width: 900px !important;
          margin: 0 auto !important;
          padding: 2rem 2rem 0 2rem !important;
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

        /* Table styling - Based on Sprint 11 research with user-requested colors */
        /* Table container */
        .wysiwyg-editor .ProseMirror table.tiptap-table-node {
          border-collapse: collapse !important;
          table-layout: fixed !important;
          width: 100% !important;
          margin: 1em 0 !important;
          overflow: hidden !important;
          border: 1px solid #d1d5db !important; /* User requested: 1px solid light grey */
        }

        /* Table cells */
        .wysiwyg-editor .ProseMirror td.tiptap-table-cell,
        .wysiwyg-editor .ProseMirror th.tiptap-table-header {
          min-width: 1em !important;
          border: 1px solid #d1d5db !important; /* User requested: 1px solid light grey */
          padding: 0.5rem 0.75rem !important;
          vertical-align: top !important;
          box-sizing: border-box !important;
          position: relative !important;
        }

        /* Header cells */
        .wysiwyg-editor .ProseMirror th.tiptap-table-header {
          font-weight: 600 !important;
          text-align: left !important;
          background-color: #f8fafc !important;
          color: #111827 !important;
        }

        /* Row hover effect */
        .wysiwyg-editor .ProseMirror tr.tiptap-table-row:hover td,
        .wysiwyg-editor .ProseMirror tr.tiptap-table-row:hover th {
          background-color: rgba(59, 130, 246, 0.05) !important;
        }

        /* Selected cell */
        .wysiwyg-editor .ProseMirror .selectedCell:after {
          z-index: 2 !important;
          position: absolute !important;
          content: "" !important;
          left: 0 !important;
          right: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          background: rgba(59, 130, 246, 0.1) !important;
          pointer-events: none !important;
        }

        /* Column resize handle */
        .wysiwyg-editor .ProseMirror table.tiptap-table-node .column-resize-handle {
          position: absolute !important;
          right: -2px !important;
          top: 0 !important;
          bottom: 0 !important;
          width: 4px !important;
          background-color: #3b82f6 !important;
          cursor: col-resize !important;
          opacity: 0 !important;
          transition: opacity 0.2s !important;
        }

        .wysiwyg-editor .ProseMirror table.tiptap-table-node:hover .column-resize-handle {
          opacity: 0.5 !important;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .wysiwyg-editor .ProseMirror table.tiptap-table-node {
            font-size: 14px !important;
          }

          .wysiwyg-editor .ProseMirror td.tiptap-table-cell,
          .wysiwyg-editor .ProseMirror th.tiptap-table-header {
            padding: 0.4rem 0.6rem !important;
          }
        }
      `}</style>
    </div>
  )
}
