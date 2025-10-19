# Sprint 11: Tables Feature - Implementation Architecture

**Date:** October 12, 2025
**Status:** 📐 ARCHITECTURE COMPLETE
**Version:** 1.0
**Author:** Architecture Specialist (Claude Code)

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [File Structure](#file-structure)
4. [Extension Integration](#extension-integration)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface Layer                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Toolbar (File Menu)           2. Slash Command Menu         │
│     └─ TableInsertButton              └─ SlashCommandExtension  │
│                                           └─ CommandsList.tsx    │
│  3. Table Controls (Context)                                     │
│     └─ TableBubbleMenu.tsx                                       │
├─────────────────────────────────────────────────────────────────┤
│                      TipTap Editor Core                          │
├─────────────────────────────────────────────────────────────────┤
│  Extension Layer:                                                │
│  ├─ Table Extension         (@tiptap/extension-table)           │
│  ├─ TableRow Extension      (@tiptap/extension-table-row)       │
│  ├─ TableCell Extension     (@tiptap/extension-table-cell)      │
│  ├─ TableHeader Extension   (@tiptap/extension-table-header)    │
│  └─ SlashCommand Extension  (DIY using @tiptap/suggestion)      │
├─────────────────────────────────────────────────────────────────┤
│                    Data Serialization Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  1. HTML → Markdown (Turndown Service)                          │
│     └─ Custom table rule for GFM conversion                     │
│  2. Markdown → HTML (marked.js)                                 │
│     └─ GFM extension for table parsing                          │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Minimal Bundle Impact**: Target max +120KB gzipped (table extensions ~20KB + slash commands ~28KB)
2. **TipTap v3 Native**: Use DIY slash command implementation (no community extensions)
3. **GFM-Compatible**: Markdown serialization must produce valid GitHub Flavored Markdown
4. **Mobile-First**: Touch-optimized controls with 48x48px minimum tap targets
5. **Pattern Consistency**: Follow existing FormattingBubbleMenu design patterns

---

## Component Architecture

### Component Hierarchy

```
App.tsx
└─ Editor.tsx (Main Editor Component)
   ├─ TipTap Extensions
   │  ├─ StarterKit
   │  ├─ Table, TableRow, TableCell, TableHeader
   │  └─ SlashCommandExtension (NEW)
   │
   ├─ UI Components
   │  ├─ FormattingBubbleMenu (EXISTING - Sprint 10)
   │  ├─ TableBubbleMenu (NEW)
   │  │  └─ TableControlButtons
   │  │     ├─ RowControls (Add/Delete)
   │  │     ├─ ColumnControls (Add/Delete)
   │  │     ├─ CellControls (Merge/Split)
   │  │     └─ HeaderToggle
   │  │
   │  └─ SlashCommandMenu (NEW)
   │     └─ CommandsList
   │        └─ CommandItem
   │           ├─ Table Command (3x3 default)
   │           ├─ Heading Commands (H1-H3)
   │           ├─ List Commands (Bullet, Ordered)
   │           └─ Code Block Command
   │
   └─ Markdown Serialization
      ├─ Turndown Service (HTML → Markdown)
      │  └─ Custom Table Rule
      └─ marked.js (Markdown → HTML)
         └─ GFM Extension
```

### Component Responsibilities

#### 1. **SlashCommandExtension** (NEW)
- **Location**: `/src/extensions/SlashCommandExtension.tsx`
- **Responsibilities**:
  - Detect `/` character trigger
  - Show command palette at cursor position
  - Handle keyboard navigation (↑/↓, Enter, Esc)
  - Execute selected command
- **Dependencies**: `@tiptap/suggestion`, `tippy.js`
- **State**: Command filter query, selected index

#### 2. **CommandsList** (NEW)
- **Location**: `/src/extensions/CommandsList.tsx`
- **Responsibilities**:
  - Render filterable command palette
  - Handle keyboard navigation events
  - Display command icons and descriptions
- **Props**: `items: CommandItem[]`, `command: (item) => void`
- **Styling**: Radix UI Popover pattern (consistent with FormattingBubbleMenu)

#### 3. **TableBubbleMenu** (NEW)
- **Location**: `/src/components/TableBubbleMenu.tsx`
- **Responsibilities**:
  - Show contextual table controls when cursor is in table
  - Provide row/column management buttons
  - Handle cell merging/splitting
  - Toggle header row styling
- **Similar to**: `FormattingBubbleMenu.tsx` (follow same pattern)
- **Keyboard Shortcuts**:
  - `Cmd+Shift+↑` - Add row before
  - `Cmd+Shift+↓` - Add row after
  - `Cmd+Shift+←` - Add column before
  - `Cmd+Shift+→` - Add column after

#### 4. **Turndown Table Rule** (EXTENSION)
- **Location**: `/src/components/Editor.tsx` (extend existing turndownService)
- **Responsibilities**:
  - Convert `<table>` HTML to GFM markdown table
  - Handle header rows (`|---|---|` separator)
  - Escape pipe characters in cell content (`|` → `\|`)
  - Handle merged cells (fallback: duplicate content)
- **Example Output**:
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

---

## File Structure

### New Files to Create

```
ritemark-app/
├─ src/
│  ├─ components/
│  │  └─ TableBubbleMenu.tsx         (NEW - 200 lines)
│  │
│  ├─ extensions/
│  │  ├─ SlashCommandExtension.tsx   (NEW - 150 lines)
│  │  ├─ CommandsList.tsx            (NEW - 180 lines)
│  │  └─ commands.ts                 (NEW - 250 lines)
│  │
│  └─ styles/
│     └─ slash-commands.css          (NEW - 80 lines, optional)
│
├─ tests/
│  └─ components/
│     ├─ TableBubbleMenu.test.tsx    (NEW - 300 lines)
│     ├─ SlashCommands.test.tsx      (NEW - 200 lines)
│     └─ TableMarkdown.test.tsx      (NEW - 250 lines)
│
└─ docs/
   ├─ components/
   │  ├─ TableBubbleMenu.md          (NEW - 400 lines)
   │  └─ SlashCommands.md            (NEW - 350 lines)
   │
   └─ user-guide/
      └─ tables.md                    (NEW - 300 lines)
```

### Files to Modify

```
ritemark-app/
├─ src/
│  └─ components/
│     └─ Editor.tsx                   (MODIFY - Add table extensions + turndown rule)
│
├─ package.json                       (MODIFY - Add table dependencies)
│
└─ README.md                          (MODIFY - Add tables to feature list)
```

### Naming Conventions

**Components**: PascalCase with descriptive names
- ✅ `TableBubbleMenu.tsx`
- ✅ `CommandsList.tsx`
- ❌ `TableMenu.tsx` (too generic)

**Extensions**: Suffix with "Extension" for clarity
- ✅ `SlashCommandExtension.tsx`
- ❌ `SlashCommand.tsx` (ambiguous)

**Tests**: Mirror component names with `.test.tsx`
- ✅ `TableBubbleMenu.test.tsx`
- ✅ `SlashCommands.test.tsx`

**Documentation**: Match component names in lowercase kebab-case
- ✅ `table-bubble-menu.md`
- ✅ `slash-commands.md`

---

## Extension Integration

### Editor.tsx Integration Points

#### 1. **Add Table Dependencies** (Phase 1)

```typescript
// File: src/components/Editor.tsx

import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

const editor = useEditor({
  extensions: [
    StarterKit.configure({ /* existing config */ }),

    // NEW: Table extensions
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'ritemark-table',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'ritemark-table-row',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'ritemark-table-cell',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'ritemark-table-header',
      },
    }),

    // Existing extensions...
  ],
})
```

#### 2. **Add Slash Command Extension** (Phase 2)

```typescript
// File: src/components/Editor.tsx

import { SlashCommandExtension } from '@/extensions/SlashCommandExtension'
import { getSlashCommands } from '@/extensions/commands'

const editor = useEditor({
  extensions: [
    // ... existing extensions

    // NEW: Slash command extension
    SlashCommandExtension.configure({
      suggestion: {
        items: ({ query }) => {
          const commands = getSlashCommands(editor)
          return commands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
      },
    }),
  ],
})
```

#### 3. **Add Turndown Table Rule** (Phase 4)

```typescript
// File: src/components/Editor.tsx

// Extend existing turndownService with table rule
turndownService.addRule('table', {
  filter: 'table',
  replacement: (content, node) => {
    // Parse HTML table structure
    const rows: string[][] = []
    const headerRows: string[][] = []

    const tableNode = node as HTMLTableElement
    const thead = tableNode.querySelector('thead')
    const tbody = tableNode.querySelector('tbody')

    // Extract header rows
    if (thead) {
      const headerRowNodes = thead.querySelectorAll('tr')
      headerRowNodes.forEach(tr => {
        const cells: string[] = []
        tr.querySelectorAll('th, td').forEach(cell => {
          cells.push(cell.textContent?.trim().replace(/\|/g, '\\|') || '')
        })
        headerRows.push(cells)
      })
    }

    // Extract body rows
    if (tbody) {
      const bodyRowNodes = tbody.querySelectorAll('tr')
      bodyRowNodes.forEach(tr => {
        const cells: string[] = []
        tr.querySelectorAll('td').forEach(cell => {
          cells.push(cell.textContent?.trim().replace(/\|/g, '\\|') || '')
        })
        rows.push(cells)
      })
    }

    // Generate GFM markdown table
    let markdown = '\n'

    // Header row
    if (headerRows.length > 0) {
      const headers = headerRows[0]
      markdown += '| ' + headers.join(' | ') + ' |\n'
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n'
    }

    // Body rows
    rows.forEach(row => {
      markdown += '| ' + row.join(' | ') + ' |\n'
    })

    return markdown + '\n'
  }
})
```

#### 4. **Add Table CSS Styling** (Phase 1)

```typescript
// File: src/components/Editor.tsx (inside <style> tag)

/* Table styling */
.wysiwyg-editor .ProseMirror table.ritemark-table {
  border-collapse: collapse !important;
  width: 100% !important;
  margin: 1em 0 !important;
  overflow: hidden !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table td.ritemark-table-cell,
.wysiwyg-editor .ProseMirror table.ritemark-table th.ritemark-table-header {
  border: 1px solid #e5e7eb !important;
  padding: 0.5rem 0.75rem !important;
  vertical-align: top !important;
  position: relative !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table th.ritemark-table-header {
  background-color: #f3f4f6 !important;
  font-weight: 600 !important;
  text-align: left !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table .selectedCell {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

/* Resizing handles */
.wysiwyg-editor .ProseMirror table.ritemark-table .column-resize-handle {
  position: absolute !important;
  right: -2px !important;
  top: 0 !important;
  bottom: -2px !important;
  width: 4px !important;
  background-color: #3b82f6 !important;
  pointer-events: all !important;
  cursor: col-resize !important;
}
```

---

## State Management

### TipTap Editor State (Prosemirror)

**RiteMark uses TipTap's built-in state management (no external state library).**

#### Table State Management

1. **Selection State**:
   - TipTap tracks which table cell is currently selected
   - Used by `TableBubbleMenu` to show/hide controls
   - Access via: `editor.isActive('table')`, `editor.isActive('tableCell')`

2. **Table Structure State**:
   - Managed internally by TipTap Table extension
   - Accessed via editor commands (no manual state updates)
   - Example: `editor.commands.insertTable({ rows: 3, cols: 3 })`

3. **Slash Command State**:
   - Filter query: Local React state in `CommandsList.tsx`
   - Selected index: Local React state (keyboard navigation)
   - Menu visibility: Controlled by `@tiptap/suggestion` plugin

#### State Flow Diagram

```
User Types "/"
    ↓
SlashCommandExtension detects trigger
    ↓
@tiptap/suggestion shows CommandsList
    ↓
User filters/selects command
    ↓
Command executes: editor.commands.insertTable()
    ↓
TipTap updates editor state (Prosemirror transaction)
    ↓
React re-renders editor content
    ↓
TableBubbleMenu checks: editor.isActive('table')
    ↓
If true: Show table controls
```

### React Component State

**Minimal local state - rely on TipTap for editor state:**

#### TableBubbleMenu State
```typescript
// Only keyboard shortcut registration needed
// No local state for table structure (use editor.isActive())
```

#### SlashCommandMenu State
```typescript
// Local state for UI only
const [selectedIndex, setSelectedIndex] = useState(0)
const [filteredCommands, setFilteredCommands] = useState([])
```

**Key Principle**: Never duplicate editor state in React state. Always query TipTap editor as single source of truth.

---

## Error Handling

### Error Handling Strategy

#### 1. **Extension Loading Errors**

```typescript
// File: src/components/Editor.tsx

try {
  const editor = useEditor({
    extensions: [
      Table.configure({ resizable: true }),
      // ... other extensions
    ],
  })
} catch (error) {
  console.error('Failed to initialize table extensions:', error)
  // Fallback: Load editor without table support
  return <div className="error-message">Editor failed to load. Please refresh.</div>
}
```

#### 2. **Table Command Execution Errors**

```typescript
// File: src/extensions/commands.ts

{
  title: 'Table',
  command: ({ editor, range }) => {
    try {
      const success = editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()

      if (!success) {
        console.warn('Table insertion failed - cursor may be in invalid position')
      }
    } catch (error) {
      console.error('Table insertion error:', error)
      // User feedback via toast notification (optional)
    }
  },
}
```

#### 3. **Markdown Conversion Errors**

```typescript
// File: src/components/Editor.tsx

turndownService.addRule('table', {
  filter: 'table',
  replacement: (content, node) => {
    try {
      // Parse table and generate markdown
      return generateTableMarkdown(node)
    } catch (error) {
      console.error('Table markdown conversion error:', error)
      // Fallback: Return HTML comment with error
      return `\n<!-- Table conversion failed: ${error.message} -->\n`
    }
  }
})
```

#### 4. **Invalid Table Structure Errors**

```typescript
// File: src/components/TableBubbleMenu.tsx

const handleMergeCells = () => {
  if (!editor) return

  // Validate selection before merging
  const { selection } = editor.state
  const { from, to } = selection

  if (from === to) {
    console.warn('Cannot merge cells: No cells selected')
    return
  }

  try {
    editor.commands.mergeCells()
  } catch (error) {
    console.error('Cell merge failed:', error)
  }
}
```

### Error Recovery Strategies

1. **Graceful Degradation**: If table extension fails, editor still works (just no tables)
2. **User Feedback**: Console warnings for invalid operations (not intrusive alerts)
3. **Fallback Serialization**: If GFM conversion fails, preserve content in HTML comment
4. **Validation Guards**: Check `editor.can().insertTable()` before attempting insertion

---

## Testing Strategy

### Test Coverage Targets

- **Unit Tests**: 90%+ coverage for extensions and components
- **Integration Tests**: Full user flows (insert → edit → save → load)
- **E2E Tests**: Browser validation with Chrome DevTools MCP
- **Accessibility Tests**: axe-core validation for keyboard navigation

### Test File Structure

#### 1. **Unit Tests - SlashCommands.test.tsx**

```typescript
// File: tests/components/SlashCommands.test.tsx

describe('SlashCommandExtension', () => {
  test('shows command palette when "/" is typed', async () => {
    const { editor } = renderEditor()
    await userEvent.type(editor, '/')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  test('filters commands by search query', async () => {
    const { editor } = renderEditor()
    await userEvent.type(editor, '/table')
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
  })

  test('executes command on Enter key', async () => {
    const { editor } = renderEditor()
    await userEvent.type(editor, '/')
    await userEvent.keyboard('{ArrowDown}') // Select "Table"
    await userEvent.keyboard('{Enter}')
    expect(editor.isActive('table')).toBe(true)
  })

  test('closes menu on Escape key', async () => {
    const { editor } = renderEditor()
    await userEvent.type(editor, '/')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
```

#### 2. **Unit Tests - TableBubbleMenu.test.tsx**

```typescript
// File: tests/components/TableBubbleMenu.test.tsx

describe('TableBubbleMenu', () => {
  test('shows table controls when cursor in table', async () => {
    const { editor } = renderEditorWithTable()
    editor.commands.focus()

    await waitFor(() => {
      expect(screen.getByLabelText('Add row before')).toBeInTheDocument()
    })
  })

  test('adds row before current row', async () => {
    const { editor } = renderEditorWithTable()
    const initialRows = getTableRowCount(editor)

    await userEvent.click(screen.getByLabelText('Add row before'))

    expect(getTableRowCount(editor)).toBe(initialRows + 1)
  })

  test('deletes current row', async () => {
    const { editor } = renderEditorWithTable({ rows: 3 })
    const initialRows = getTableRowCount(editor)

    await userEvent.click(screen.getByLabelText('Delete row'))

    expect(getTableRowCount(editor)).toBe(initialRows - 1)
  })

  test('merges selected cells', async () => {
    const { editor } = renderEditorWithTable()
    // Select 2x2 cell range
    selectCells(editor, { from: [0, 0], to: [1, 1] })

    await userEvent.click(screen.getByLabelText('Merge cells'))

    expect(hasMergedCells(editor)).toBe(true)
  })
})
```

#### 3. **Integration Tests - TableMarkdown.test.tsx**

```typescript
// File: tests/components/TableMarkdown.test.tsx

describe('Table Markdown Conversion', () => {
  test('converts table to GFM markdown on save', () => {
    const { editor, onChange } = renderEditor()

    // Insert table
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })

    // Get markdown output
    const markdown = onChange.mock.calls[0][0]

    expect(markdown).toContain('| Header 1 | Header 2 |')
    expect(markdown).toContain('|----------|----------|')
  })

  test('loads GFM markdown table correctly', () => {
    const markdown = `
| Name | Age |
|------|-----|
| John | 30  |
| Jane | 25  |
    `
    const { editor } = renderEditor({ value: markdown })

    expect(editor.isActive('table')).toBe(true)
    expect(getTableRowCount(editor)).toBe(3) // Header + 2 body rows
  })

  test('escapes pipe characters in cell content', () => {
    const { editor, onChange } = renderEditor()

    editor.commands.insertTable({ rows: 1, cols: 1 })
    editor.commands.setContent('<table><tr><td>Value | with pipe</td></tr></table>')

    const markdown = onChange.mock.calls[0][0]
    expect(markdown).toContain('Value \\| with pipe')
  })
})
```

#### 4. **E2E Tests - Browser Validation**

```bash
# Using Chrome DevTools MCP (from CLAUDE.md validation protocol)

# 1. Start dev server
npm run dev

# 2. Open browser and navigate to app
mcp__chrome-devtools__new_page { url: "http://localhost:5173" }

# 3. Test table insertion flow
# - Type "/" to open slash command menu
# - Select "Table" command
# - Verify table appears in editor
# - Add/delete rows and columns
# - Merge cells
# - Save and reload - verify markdown conversion

# 4. Check console for errors
mcp__chrome-devtools__console_page

# 5. Take screenshot for visual verification
mcp__chrome-devtools__screenshot_page
```

### Test Utilities

```typescript
// File: tests/utils/table-test-utils.ts

export function renderEditorWithTable(options = { rows: 3, cols: 3 }) {
  const { editor } = renderEditor()
  editor.commands.insertTable({
    rows: options.rows,
    cols: options.cols,
    withHeaderRow: true,
  })
  return { editor }
}

export function getTableRowCount(editor: Editor): number {
  const table = editor.state.doc.querySelector('table')
  return table?.querySelectorAll('tr').length || 0
}

export function selectCells(editor: Editor, range: { from: [number, number], to: [number, number] }) {
  // Implementation for selecting table cell range
}

export function hasMergedCells(editor: Editor): boolean {
  const table = editor.state.doc.querySelector('table')
  return Array.from(table?.querySelectorAll('td, th') || []).some(
    (cell) => cell.getAttribute('colspan') || cell.getAttribute('rowspan')
  )
}
```

---

## Performance Considerations

### Bundle Size Optimization

#### Current Baseline (Sprint 10)
- **Total Bundle**: 305.16 KB gzipped

#### Sprint 11 Target
- **Table Extensions**: ~20 KB gzipped
  - `@tiptap/extension-table`: ~8 KB
  - `@tiptap/extension-table-row`: ~3 KB
  - `@tiptap/extension-table-cell`: ~3 KB
  - `@tiptap/extension-table-header`: ~3 KB
  - Table CSS: ~3 KB

- **Slash Commands**: ~28 KB gzipped
  - `tippy.js`: ~20 KB
  - `SlashCommandExtension.tsx`: ~2 KB
  - `CommandsList.tsx`: ~3 KB
  - `commands.ts`: ~2 KB
  - Slash command CSS: ~1 KB

- **Projected Total**: ~353 KB gzipped (+48 KB, +15.7%)
- **Under Budget**: Target was max +120 KB ✅

### Runtime Performance

#### 1. **Table Rendering Optimization**

```typescript
// Lazy load table extensions only when needed
const TableExtensions = lazy(() => import('@/extensions/table-extensions'))

// Only load when user attempts to insert table
if (userWantsTable) {
  loadTableExtensions()
}
```

#### 2. **Slash Command Debouncing**

```typescript
// File: src/extensions/CommandsList.tsx

const [query, setQuery] = useState('')
const debouncedQuery = useDebouncedValue(query, 150) // Debounce filtering

const filteredCommands = useMemo(() => {
  return commands.filter((item) =>
    item.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  )
}, [debouncedQuery, commands])
```

#### 3. **Table Size Validation**

```typescript
// Warn user if table is too large (performance issue)
const MAX_CELLS = 400 // 20x20 table

if (rows * cols > MAX_CELLS) {
  console.warn(`Large table detected (${rows}x${cols}). Consider splitting into smaller tables.`)
}
```

#### 4. **Markdown Conversion Optimization**

```typescript
// Cache Turndown conversion for unchanged tables
const conversionCache = new WeakMap<HTMLElement, string>()

turndownService.addRule('table', {
  filter: 'table',
  replacement: (content, node) => {
    const cached = conversionCache.get(node as HTMLElement)
    if (cached) return cached

    const markdown = generateTableMarkdown(node)
    conversionCache.set(node as HTMLElement, markdown)
    return markdown
  }
})
```

---

## Architecture Decision Records

### ADR-001: DIY Slash Commands (Not Community Extension)

**Context**: Need slash command support but all community extensions require TipTap v2 (we're on v3.4.3).

**Decision**: Build custom slash command extension using `@tiptap/suggestion` utility.

**Rationale**:
- TipTap v3 compatibility (future-proof)
- Smaller bundle size (~28 KB vs. 70+ KB for community extensions)
- Full control over UX and styling
- Educational value (understand TipTap internals)

**Consequences**:
- More development time (~4-6 hours)
- Need to maintain custom code
- Less community support/examples

### ADR-002: GFM Markdown Table Format

**Context**: Tables can be serialized in multiple markdown formats (HTML, GFM, MultiMarkdown).

**Decision**: Use GitHub Flavored Markdown (GFM) table syntax.

**Rationale**:
- Industry standard (GitHub, GitLab, Stack Overflow)
- Simple syntax (easy for users to edit manually)
- Widely supported by markdown parsers
- Compatible with `marked.js` GFM extension

**Consequences**:
- Limited formatting (no cell alignment, borders, colors)
- Merged cells lose structure (fallback: duplicate content)
- Need custom Turndown rule for conversion

### ADR-003: TableBubbleMenu for Context Controls

**Context**: Need UI for table operations (add/delete rows/columns, merge cells).

**Decision**: Use BubbleMenu pattern (same as FormattingBubbleMenu).

**Rationale**:
- Consistent with existing Sprint 10 UX
- Non-intrusive (appears only when cursor in table)
- Familiar pattern (Notion, Dropbox Paper)
- Mobile-compatible (can adapt to bottom sheet)

**Consequences**:
- Need separate menu from FormattingBubbleMenu (can't combine)
- Must handle menu priority (table menu overrides format menu)
- Requires careful positioning logic

---

## Security Considerations

### XSS Prevention

1. **Sanitize table HTML**: TipTap's built-in sanitization prevents XSS in table content
2. **Escape markdown pipes**: Prevent markdown injection via `\|` escaping
3. **Validate table size**: Prevent DoS via massive table insertion (max 20x20)

### Content Security Policy

```html
<!-- No changes needed - TipTap handles table HTML securely -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

---

## Accessibility Compliance

### WCAG 2.1 Level AA Requirements

1. **Keyboard Navigation**: All table operations accessible via keyboard shortcuts
2. **Screen Reader Support**: Table structure announced to screen readers
3. **Focus Indicators**: Visible focus on selected table cells
4. **Color Contrast**: Table borders and headers meet 4.5:1 contrast ratio
5. **Touch Targets**: Minimum 48x48px tap targets on mobile

### ARIA Attributes

```html
<table role="table" aria-label="Editable table with 3 rows and 3 columns">
  <thead>
    <tr role="row">
      <th role="columnheader">Header 1</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="cell">Cell content</td>
    </tr>
  </tbody>
</table>
```

---

## Documentation Structure

### Developer Documentation
- **TableBubbleMenu.md**: API reference, props, examples
- **SlashCommands.md**: Extension configuration, custom commands
- **table-extensions.md**: TipTap table extension usage

### User Documentation
- **tables.md**: How to insert, edit, format tables
- **keyboard-shortcuts.md**: Table keyboard shortcuts reference

---

## Next Steps

1. **Review this architecture** with team/user
2. **Create Phase Breakdown** (see `sprint-11-phase-breakdown.md`)
3. **Begin Phase 1**: Install table extensions and basic configuration
4. **Validate architecture** with proof-of-concept implementation

---

**Architecture Status**: ✅ COMPLETE
**Ready for Phase Planning**: YES
**Estimated Total Effort**: 12-16 hours (aligned with sprint plan)
