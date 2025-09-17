import React from 'react'
import { useEditor, EditorContent, type Editor as TipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
// Note: Link is currently disabled to avoid duplicate extension warnings during dev

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
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
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
      const content = editor.getHTML()
      onChange(content)
      onEditorReady?.(editor) // Ensure editor is always available
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handleKeyDown: (view, event): boolean => {
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
          background: rgba(59, 130, 246, 0.1) !important;
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
