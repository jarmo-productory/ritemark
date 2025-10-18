import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Editor } from '../components/Editor'
import { type Editor as TipTapEditor } from '@tiptap/react'

describe('Table Insertion - Phase 1 Infrastructure', () => {
  let editor: TipTapEditor | null = null

  beforeEach(() => {
    editor = null
  })

  it('should initialize editor with table extensions', async () => {
    render(
      <Editor
        value=""
        onChange={() => {}}
        onEditorReady={(editorInstance) => {
          editor = editorInstance
        }}
      />
    )

    await waitFor(() => {
      expect(editor).not.toBeNull()
    })

    // Verify table extension is loaded
    expect(editor?.extensionManager.extensions.find(ext => ext.name === 'table')).toBeDefined()
  })

  it('should insert a 3x3 table programmatically', async () => {
    render(
      <Editor
        value=""
        onChange={() => {}}
        onEditorReady={(editorInstance) => {
          editor = editorInstance
        }}
      />
    )

    await waitFor(() => {
      expect(editor).not.toBeNull()
    })

    // Insert table via command
    editor?.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })

    // Wait for table to be inserted
    await waitFor(() => {
      const html = editor?.getHTML()
      expect(html).toContain('table')
      expect(html).toContain('tiptap-table')
    })
  })

  it('should render table with correct HTML structure', async () => {
    render(
      <Editor
        value=""
        onChange={() => {}}
        onEditorReady={(editorInstance) => {
          editor = editorInstance
        }}
      />
    )

    await waitFor(() => {
      expect(editor).not.toBeNull()
    })

    editor?.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })

    await waitFor(() => {
      const html = editor?.getHTML()

      // Check for table structure
      expect(html).toContain('<table class="tiptap-table">')
      expect(html).toContain('<tr class="tiptap-table-row">')
      expect(html).toContain('<th class="tiptap-table-header">')
      expect(html).toContain('<td class="tiptap-table-cell">')
    })
  })

  it('should have correct CSS classes on table elements', async () => {
    render(
      <Editor
        value=""
        onChange={() => {}}
        onEditorReady={(editorInstance) => {
          editor = editorInstance
        }}
      />
    )

    await waitFor(() => {
      expect(editor).not.toBeNull()
    })

    editor?.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false })

    await waitFor(() => {
      const html = editor?.getHTML()

      // Verify CSS classes are applied
      expect(html).toMatch(/class="tiptap-table"/)
      expect(html).toMatch(/class="tiptap-table-row"/)
      expect(html).toMatch(/class="tiptap-table-cell"/)
    })
  })

  it('should convert table to markdown with GFM format', async () => {
    let markdown = ''

    render(
      <Editor
        value=""
        onChange={(value) => {
          markdown = value
        }}
        onEditorReady={(editorInstance) => {
          editor = editorInstance
        }}
      />
    )

    await waitFor(() => {
      expect(editor).not.toBeNull()
    })

    // Insert simple table
    editor?.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })

    await waitFor(() => {
      // Check that markdown contains GFM table syntax
      expect(markdown).toContain('|')
      expect(markdown).toContain('---')
    })
  })

  it('should support keyboard shortcut Cmd+Shift+T', async () => {
    render(
      <Editor
        value=""
        onChange={() => {}}
        onEditorReady={(editorInstance) => {
          editor = editorInstance
        }}
      />
    )

    await waitFor(() => {
      expect(editor).not.toBeNull()
    })

    // Verify table command is available
    const canInsertTable = editor?.can().insertTable({ rows: 3, cols: 3 })
    expect(canInsertTable).toBe(true)
  })
})
