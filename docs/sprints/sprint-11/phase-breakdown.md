# Sprint 11: Tables Feature - Phase Breakdown

**Date:** October 12, 2025
**Status:** 📋 READY FOR EXECUTION
**Version:** 1.0
**Author:** Architecture Specialist (Claude Code)
**Total Estimated Time**: 12-16 hours

---

## Phase Overview

| Phase | Name | Duration | Dependencies | Risk Level |
|-------|------|----------|--------------|------------|
| **Phase 1** | Slash Command Infrastructure | 4-5 hours | None | 🟡 Medium |
| **Phase 2** | Table Extension Integration | 3-4 hours | Phase 1 | 🟢 Low |
| **Phase 3** | Table Controls UI | 2-3 hours | Phase 2 | 🟢 Low |
| **Phase 4** | GFM Serialization | 2-3 hours | Phase 2 | 🟡 Medium |
| **Phase 5** | Testing & Validation | 2-3 hours | All phases | 🟢 Low |

**Total**: 13-18 hours (buffer: +1-2 hours for unexpected issues)

---

## Phase 1: Slash Command Infrastructure (4-5 hours)

### Goals

1. ✅ Install `tippy.js` dependency
2. ✅ Create DIY `SlashCommandExtension` using `@tiptap/suggestion`
3. ✅ Build `CommandsList` component with keyboard navigation
4. ✅ Implement 7 basic commands (headings, lists, code block, table)
5. ✅ Add CSS styling for slash menu
6. ✅ Test keyboard navigation (↑/↓, Enter, Esc)

### Files to Create

```
ritemark-app/
├─ src/
│  ├─ extensions/
│  │  ├─ SlashCommandExtension.tsx   (NEW - 150 lines)
│  │  ├─ CommandsList.tsx            (NEW - 180 lines)
│  │  └─ commands.ts                 (NEW - 250 lines)
│  │
│  └─ styles/
│     └─ slash-commands.css          (NEW - 80 lines, optional)
```

### Files to Modify

```
ritemark-app/
├─ src/
│  └─ components/
│     └─ Editor.tsx                   (MODIFY - Add SlashCommandExtension)
│
└─ package.json                       (MODIFY - Add tippy.js dependency)
```

### Implementation Steps

#### Step 1.1: Install Dependencies (15 min)

```bash
# Kill existing dev server on port 5173
lsof -ti:5173 | xargs kill -9

# Install tippy.js for slash menu positioning
npm install tippy.js@^6.3.7

# Verify installation
npm run type-check
```

**Success Criteria**:
- ✅ `npm run type-check` passes (no TypeScript errors)
- ✅ `tippy.js` appears in `package.json` dependencies

---

#### Step 1.2: Create SlashCommandExtension (90 min)

```typescript
// File: src/extensions/SlashCommandExtension.tsx

import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { CommandsList } from './CommandsList'
import { CommandItem } from './commands'

interface SlashCommandOptions {
  suggestion: {
    items: (props: { query: string }) => CommandItem[]
  }
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        items: () => [],
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,

        items: ({ query }) => {
          return this.options.suggestion.items({ query })
        },

        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },

        render: () => {
          let component: ReactRenderer
          let popup: TippyInstance[]

          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandsList, {
                props,
                editor: props.editor,
              })

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                maxWidth: 320,
              })
            },

            onUpdate: (props) => {
              component.updateProps(props)

              if (popup[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              }
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide()
                return true
              }

              return component.ref?.onKeyDown(props) || false
            },

            onExit: () => {
              popup[0]?.destroy()
              component.destroy()
            },
          }
        },
      }),
    ]
  },
})
```

**Success Criteria**:
- ✅ File compiles without TypeScript errors
- ✅ Extension exports correctly

---

#### Step 1.3: Create CommandsList Component (90 min)

```typescript
// File: src/extensions/CommandsList.tsx

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { CommandItem } from './commands'

interface CommandsListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export const CommandsList = forwardRef<any, CommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    )
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className="slash-commands-menu">
        <div className="slash-empty-state">
          No matching commands
        </div>
      </div>
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Insert block commands"
      className="slash-commands-menu"
    >
      {props.items.map((item, index) => (
        <button
          key={index}
          role="option"
          aria-selected={index === selectedIndex}
          className={`slash-command-item ${
            index === selectedIndex ? 'is-selected' : ''
          }`}
          onClick={() => selectItem(index)}
        >
          {item.icon && (
            <span className="slash-command-icon">{item.icon}</span>
          )}
          <div className="slash-command-content">
            <div className="slash-command-title">{item.title}</div>
            {item.description && (
              <div className="slash-command-description">
                {item.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
})

CommandsList.displayName = 'CommandsList'
```

**Success Criteria**:
- ✅ Component renders without errors
- ✅ Keyboard navigation works (↑/↓ keys)
- ✅ Enter key executes selected command
- ✅ Accessibility attributes present (role, aria-label)

---

#### Step 1.4: Define Slash Commands (60 min)

```typescript
// File: src/extensions/commands.ts

import { Editor, Range } from '@tiptap/react'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Table,
} from 'lucide-react'

export interface CommandItem {
  title: string
  description: string
  icon: React.ReactNode
  keywords: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

export function getSlashCommands(editor: Editor | null): CommandItem[] {
  if (!editor) return []

  return [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 size={18} />,
      keywords: ['h1', 'heading', 'title'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 1 })
          .run()
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 size={18} />,
      keywords: ['h2', 'heading', 'subtitle'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 2 })
          .run()
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 size={18} />,
      keywords: ['h3', 'heading'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 3 })
          .run()
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a bulleted list',
      icon: <List size={18} />,
      keywords: ['ul', 'bullet', 'list'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleBulletList()
          .run()
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: <ListOrdered size={18} />,
      keywords: ['ol', 'numbered', 'ordered'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleOrderedList()
          .run()
      },
    },
    {
      title: 'Code Block',
      description: 'Insert a code block with syntax highlighting',
      icon: <Code size={18} />,
      keywords: ['code', 'snippet', 'pre'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleCodeBlock()
          .run()
      },
    },
    {
      title: 'Table',
      description: 'Insert a 3x3 table',
      icon: <Table size={18} />,
      keywords: ['table', 'grid'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      },
    },
  ]
}
```

**Success Criteria**:
- ✅ All 7 commands defined with icons and descriptions
- ✅ Commands filter by keywords and title
- ✅ Table command ready (will work after Phase 2)

---

#### Step 1.5: Add CSS Styling (30 min)

```css
/* File: src/styles/slash-commands.css (optional) */
/* Or inline in Editor.tsx <style> tag */

.slash-commands-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  min-width: 320px;
  max-height: 400px;
  overflow-y: auto;
}

.slash-command-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.slash-command-item:hover,
.slash-command-item.is-selected {
  background-color: #f3f4f6;
}

.slash-command-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.slash-command-content {
  flex: 1;
  min-width: 0;
}

.slash-command-title {
  font-weight: 500;
  font-size: 14px;
  color: #111827;
  line-height: 1.4;
}

.slash-command-description {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.3;
}

.slash-empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}
```

**Success Criteria**:
- ✅ Slash menu styled consistently with FormattingBubbleMenu
- ✅ Hover and selected states visible
- ✅ Mobile-responsive (readable on small screens)

---

#### Step 1.6: Integrate into Editor.tsx (30 min)

```typescript
// File: src/components/Editor.tsx (modifications)

import { SlashCommandExtension } from '@/extensions/SlashCommandExtension'
import { getSlashCommands } from '@/extensions/commands'

const editor = useEditor({
  extensions: [
    StarterKit.configure({ /* ... */ }),
    // ... other existing extensions

    // NEW: Slash command extension
    SlashCommandExtension.configure({
      suggestion: {
        items: ({ query }) => {
          const commands = getSlashCommands(editor)
          return commands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords.some((kw) => kw.includes(query.toLowerCase()))
          )
        },
      },
    }),
  ],
})
```

**Success Criteria**:
- ✅ Editor compiles without errors
- ✅ Typing `/` shows slash menu
- ✅ Commands filter as user types (e.g., `/h` shows headings)

---

#### Step 1.7: Test Keyboard Navigation (30 min)

**Manual Testing Checklist**:

```bash
# Start dev server
npm run dev

# Open http://localhost:5173
```

**Test Cases**:
1. ✅ Type `/` → Menu appears
2. ✅ Type `/h` → Only heading commands shown
3. ✅ Press `↓` → Selection moves down
4. ✅ Press `↑` → Selection moves up
5. ✅ Press `Enter` → Command executes (e.g., "Heading 1" inserted)
6. ✅ Press `Esc` → Menu closes
7. ✅ Type `/table` → Only "Table" command shown (won't work yet - Phase 2)

**Success Criteria**:
- ✅ All 7 test cases pass
- ✅ No console errors
- ✅ Menu animates smoothly

---

### Phase 1 Deliverables

- [x] `tippy.js` installed
- [x] `SlashCommandExtension.tsx` created
- [x] `CommandsList.tsx` created
- [x] `commands.ts` created with 7 commands
- [x] CSS styling added
- [x] Integrated into `Editor.tsx`
- [x] Manual testing completed

### Phase 1 Risks & Mitigation

**Risk**: Slash menu positioning issues on mobile
- **Mitigation**: Test on iOS Safari and Chrome Android (use bottom sheet fallback if needed)

**Risk**: Slash menu conflicts with existing keyboard shortcuts
- **Mitigation**: Test all existing shortcuts (Bold, Italic, Link) still work

---

## Phase 2: Table Extension Integration (3-4 hours)

### Goals

1. ✅ Install TipTap table extensions
2. ✅ Configure Table, TableRow, TableCell, TableHeader in `Editor.tsx`
3. ✅ Add basic table CSS styling
4. ✅ Test table insertion via slash command
5. ✅ Test table selection and basic editing

### Files to Modify

```
ritemark-app/
├─ src/
│  └─ components/
│     └─ Editor.tsx                   (MODIFY - Add table extensions + CSS)
│
└─ package.json                       (MODIFY - Add table dependencies)
```

### Implementation Steps

#### Step 2.1: Install Table Dependencies (15 min)

```bash
# Install TipTap table extensions
npm install @tiptap/extension-table@^3.4.3 \
  @tiptap/extension-table-row@^3.4.3 \
  @tiptap/extension-table-cell@^3.4.3 \
  @tiptap/extension-table-header@^3.4.3

# Verify installation
npm run type-check
```

**Success Criteria**:
- ✅ All 4 table extensions installed
- ✅ `npm run type-check` passes
- ✅ Versions match TipTap core (`3.4.3`)

---

#### Step 2.2: Configure Table Extensions (60 min)

```typescript
// File: src/components/Editor.tsx (modifications)

import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

const editor = useEditor({
  extensions: [
    StarterKit.configure({ /* ... */ }),
    // ... other extensions

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

    // Slash command extension (already added in Phase 1)
    SlashCommandExtension.configure({ /* ... */ }),
  ],
})
```

**Success Criteria**:
- ✅ Editor compiles without errors
- ✅ `editor.commands.insertTable` command available

---

#### Step 2.3: Add Table CSS Styling (90 min)

```typescript
// File: src/components/Editor.tsx (inside <style> tag)

/* Table styling */
.wysiwyg-editor .ProseMirror table.ritemark-table {
  border-collapse: collapse !important;
  table-layout: fixed !important;
  width: 100% !important;
  margin: 1.5em 0 !important;
  overflow: hidden !important;
  border: 1px solid #d1d5db !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table td.ritemark-table-cell,
.wysiwyg-editor .ProseMirror table.ritemark-table th.ritemark-table-header {
  border: 1px solid #d1d5db !important;
  padding: 0.5rem 0.75rem !important;
  vertical-align: top !important;
  position: relative !important;
  min-width: 100px !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table th.ritemark-table-header {
  background-color: #f9fafb !important;
  font-weight: 600 !important;
  text-align: left !important;
  color: #111827 !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table .selectedCell {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border-color: #3b82f6 !important;
}

/* Column resizing handle */
.wysiwyg-editor .ProseMirror table.ritemark-table .column-resize-handle {
  position: absolute !important;
  right: -2px !important;
  top: 0 !important;
  bottom: -2px !important;
  width: 4px !important;
  background-color: #3b82f6 !important;
  pointer-events: all !important;
  cursor: col-resize !important;
  z-index: 10 !important;
}

.wysiwyg-editor .ProseMirror table.ritemark-table .column-resize-handle:hover {
  background-color: #2563eb !important;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror table.ritemark-table {
    font-size: 14px !important;
  }

  .wysiwyg-editor .ProseMirror table.ritemark-table td.ritemark-table-cell,
  .wysiwyg-editor .ProseMirror table.ritemark-table th.ritemark-table-header {
    padding: 0.4rem 0.5rem !important;
    min-width: 80px !important;
  }
}
```

**Success Criteria**:
- ✅ Tables render with borders and proper spacing
- ✅ Header row has gray background
- ✅ Selected cells highlighted in blue
- ✅ Column resize handles visible and functional

---

#### Step 2.4: Test Table Insertion (30 min)

**Manual Testing**:

```bash
# Start dev server
npm run dev
```

**Test Cases**:
1. ✅ Type `/table` → Select "Table" command → 3x3 table inserted
2. ✅ Click in table cell → Cursor appears, can type
3. ✅ Press Tab → Moves to next cell
4. ✅ Press Shift+Tab → Moves to previous cell
5. ✅ Drag column resize handle → Column width changes
6. ✅ Select multiple cells → Blue highlight appears

**Success Criteria**:
- ✅ Table insertion works via slash command
- ✅ Basic editing works (typing in cells)
- ✅ Tab navigation works
- ✅ Column resizing works

---

### Phase 2 Deliverables

- [x] Table extensions installed
- [x] Table extensions configured in `Editor.tsx`
- [x] Table CSS styling added
- [x] Table insertion tested and working
- [x] Basic table editing verified

### Phase 2 Risks & Mitigation

**Risk**: Table extension version conflicts with TipTap core
- **Mitigation**: Use exact version `3.4.3` to match existing TipTap packages

**Risk**: Table CSS conflicts with existing editor styles
- **Mitigation**: Use `.ritemark-table` class prefix to scope styles

---

## Phase 3: Table Controls UI (2-3 hours)

### Goals

1. ✅ Create `TableBubbleMenu` component
2. ✅ Add row controls (Add Before, Add After, Delete)
3. ✅ Add column controls (Add Before, Add After, Delete)
4. ✅ Add cell controls (Merge, Split)
5. ✅ Add header row toggle
6. ✅ Add keyboard shortcuts
7. ✅ Test all table operations

### Files to Create

```
ritemark-app/
└─ src/
   └─ components/
      └─ TableBubbleMenu.tsx         (NEW - 250 lines)
```

### Files to Modify

```
ritemark-app/
└─ src/
   └─ components/
      └─ Editor.tsx                   (MODIFY - Import TableBubbleMenu)
```

### Implementation Steps

#### Step 3.1: Create TableBubbleMenu Component (120 min)

```typescript
// File: src/components/TableBubbleMenu.tsx

import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/react'
import {
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  Split,
  Header,
  Trash2,
} from 'lucide-react'

interface TableBubbleMenuProps {
  editor: Editor | null
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  if (!editor) return null

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => {
        // Only show when cursor is in table
        return editor.isActive('table')
      }}
    >
      <div className="flex items-center gap-1 bg-white border rounded shadow-lg p-1">
        {/* Row Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Add Row Before (Cmd+Shift+↑)"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Add Row After (Cmd+Shift+↓)"
          >
            <ArrowDown size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="Delete Row"
          >
            <Minus size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Column Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Add Column Before (Cmd+Shift+←)"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Add Column After (Cmd+Shift+→)"
          >
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="Delete Column"
          >
            <Minus size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Cell Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().mergeCells().run()}
            disabled={!editor.can().mergeCells()}
            className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Merge Cells"
          >
            <Merge size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().splitCell().run()}
            disabled={!editor.can().splitCell()}
            className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Split Cell"
          >
            <Split size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Header Toggle */}
        <button
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('tableHeader') ? 'bg-gray-200' : ''
          }`}
          title="Toggle Header Row"
        >
          <Header size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Delete Table */}
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
          title="Delete Table"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </BubbleMenu>
  )
}
```

**Success Criteria**:
- ✅ Component compiles without errors
- ✅ Menu appears when cursor in table
- ✅ All buttons have icons and tooltips
- ✅ Disabled states work (merge/split buttons)

---

#### Step 3.2: Add Keyboard Shortcuts (30 min)

```typescript
// File: src/components/Editor.tsx (modify handleKeyDown)

editorProps: {
  handleKeyDown: (view, event): boolean => {
    const isMod = event.metaKey || event.ctrlKey

    // ... existing shortcuts (Code block, Lists, Tab) ...

    // NEW: Table keyboard shortcuts
    if (editor?.isActive('table')) {
      // Add row before: Cmd+Shift+↑
      if (isMod && event.shiftKey && event.key === 'ArrowUp') {
        event.preventDefault()
        return editor?.commands.addRowBefore() || false
      }

      // Add row after: Cmd+Shift+↓
      if (isMod && event.shiftKey && event.key === 'ArrowDown') {
        event.preventDefault()
        return editor?.commands.addRowAfter() || false
      }

      // Add column before: Cmd+Shift+←
      if (isMod && event.shiftKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        return editor?.commands.addColumnBefore() || false
      }

      // Add column after: Cmd+Shift+→
      if (isMod && event.shiftKey && event.key === 'ArrowRight') {
        event.preventDefault()
        return editor?.commands.addColumnAfter() || false
      }
    }

    return false
  },
},
```

**Success Criteria**:
- ✅ `Cmd+Shift+↑` adds row before
- ✅ `Cmd+Shift+↓` adds row after
- ✅ `Cmd+Shift+←` adds column before
- ✅ `Cmd+Shift+→` adds column after
- ✅ Shortcuts only work when cursor in table

---

#### Step 3.3: Integrate into Editor.tsx (15 min)

```typescript
// File: src/components/Editor.tsx

import { TableBubbleMenu } from './TableBubbleMenu'

// Inside Editor component return statement:
return (
  <div className="wysiwyg-editor">
    <EditorContent editor={editor} />

    {/* Existing FormattingBubbleMenu */}
    <FormattingBubbleMenu editor={editor} />

    {/* NEW: Table controls menu */}
    <TableBubbleMenu editor={editor} />

    <style>{/* ... */}</style>
  </div>
)
```

**Success Criteria**:
- ✅ Both BubbleMenus render without conflicts
- ✅ TableBubbleMenu only shows when in table
- ✅ FormattingBubbleMenu shows when in normal text

---

#### Step 3.4: Test Table Operations (30 min)

**Manual Testing**:

```bash
# Start dev server
npm run dev
```

**Test Cases**:
1. ✅ Insert table → TableBubbleMenu appears
2. ✅ Click "Add Row Before" → New row added above cursor
3. ✅ Click "Add Row After" → New row added below cursor
4. ✅ Click "Delete Row" → Current row deleted
5. ✅ Click "Add Column Before" → New column added left of cursor
6. ✅ Click "Add Column After" → New column added right of cursor
7. ✅ Click "Delete Column" → Current column deleted
8. ✅ Select 2x2 cells → Click "Merge" → Cells merge
9. ✅ Click merged cell → Click "Split" → Cells unmerge
10. ✅ Click "Toggle Header" → First row becomes header (gray background)
11. ✅ Click "Delete Table" → Entire table removed

**Success Criteria**:
- ✅ All 11 test cases pass
- ✅ No console errors
- ✅ Keyboard shortcuts work

---

### Phase 3 Deliverables

- [x] `TableBubbleMenu.tsx` created
- [x] All table controls implemented
- [x] Keyboard shortcuts added
- [x] Integrated into `Editor.tsx`
- [x] Manual testing completed

### Phase 3 Risks & Mitigation

**Risk**: BubbleMenu positioning conflicts (TableBubbleMenu vs. FormattingBubbleMenu)
- **Mitigation**: Use `shouldShow` logic to ensure only one menu appears at a time

---

## Phase 4: GFM Serialization (2-3 hours)

### Goals

1. ✅ Add Turndown table rule for HTML → Markdown conversion
2. ✅ Handle header rows (add `|---|` separator)
3. ✅ Escape pipe characters in cell content
4. ✅ Configure marked.js for Markdown → HTML parsing
5. ✅ Test round-trip conversion (Markdown → HTML → Markdown)

### Files to Modify

```
ritemark-app/
└─ src/
   └─ components/
      └─ Editor.tsx                   (MODIFY - Add Turndown table rule)
```

### Implementation Steps

#### Step 4.1: Add Turndown Table Rule (90 min)

```typescript
// File: src/components/Editor.tsx (extend turndownService)

// Add table conversion rule
turndownService.addRule('table', {
  filter: 'table',
  replacement: (content, node) => {
    try {
      const tableNode = node as HTMLTableElement
      const rows: string[][] = []
      const headerRows: string[][] = []

      // Helper: Extract cell text and escape pipes
      const getCellText = (cell: Element): string => {
        return (cell.textContent || '').trim().replace(/\|/g, '\\|')
      }

      // Extract header rows from <thead>
      const thead = tableNode.querySelector('thead')
      if (thead) {
        const headerRowNodes = thead.querySelectorAll('tr')
        headerRowNodes.forEach(tr => {
          const cells: string[] = []
          tr.querySelectorAll('th, td').forEach(cell => {
            cells.push(getCellText(cell))
          })
          if (cells.length > 0) {
            headerRows.push(cells)
          }
        })
      }

      // If no <thead>, check first row for <th> tags
      if (headerRows.length === 0) {
        const firstRow = tableNode.querySelector('tr')
        const hasTh = firstRow?.querySelector('th')
        if (hasTh) {
          const cells: string[] = []
          firstRow?.querySelectorAll('th, td').forEach(cell => {
            cells.push(getCellText(cell))
          })
          if (cells.length > 0) {
            headerRows.push(cells)
          }
        }
      }

      // Extract body rows from <tbody> or all <tr> if no <thead>
      const tbody = tableNode.querySelector('tbody') || tableNode
      const bodyRowNodes = tbody.querySelectorAll('tr')
      bodyRowNodes.forEach((tr, index) => {
        // Skip first row if it was already extracted as header
        if (headerRows.length > 0 && index === 0 && !tableNode.querySelector('thead')) {
          return
        }

        const cells: string[] = []
        tr.querySelectorAll('td, th').forEach(cell => {
          cells.push(getCellText(cell))
        })
        if (cells.length > 0) {
          rows.push(cells)
        }
      })

      // Generate GFM markdown table
      let markdown = '\n\n'

      // Header row
      if (headerRows.length > 0) {
        const headers = headerRows[0]
        markdown += '| ' + headers.join(' | ') + ' |\n'
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n'
      } else if (rows.length > 0) {
        // No header? Use first row as header
        const firstRow = rows.shift()
        if (firstRow) {
          markdown += '| ' + firstRow.join(' | ') + ' |\n'
          markdown += '| ' + firstRow.map(() => '---').join(' | ') + ' |\n'
        }
      }

      // Body rows
      rows.forEach(row => {
        markdown += '| ' + row.join(' | ') + ' |\n'
      })

      return markdown + '\n'
    } catch (error) {
      console.error('Table markdown conversion error:', error)
      return '\n<!-- Table conversion failed -->\n'
    }
  }
})
```

**Success Criteria**:
- ✅ Tables convert to GFM markdown format
- ✅ Header rows have `|---|` separator
- ✅ Pipe characters escaped as `\|`
- ✅ Empty cells handled gracefully

---

#### Step 4.2: Configure marked.js GFM (30 min)

```typescript
// File: src/components/Editor.tsx (modify marked configuration)

// marked.js already configured with GFM support (gfm: true)
// No changes needed - GFM tables supported by default
```

**Success Criteria**:
- ✅ Markdown tables parse correctly
- ✅ Header rows render with gray background
- ✅ Cell content displays correctly

---

#### Step 4.3: Test Round-Trip Conversion (60 min)

**Test Cases**:

**Test 1: Simple Table**
```markdown
Input Markdown:
| Name | Age |
|------|-----|
| John | 30  |
| Jane | 25  |

Expected HTML:
<table>
  <thead><tr><th>Name</th><th>Age</th></tr></thead>
  <tbody>
    <tr><td>John</td><td>30</td></tr>
    <tr><td>Jane</td><td>25</td></tr>
  </tbody>
</table>

Expected Markdown (after conversion):
| Name | Age |
|------|-----|
| John | 30  |
| Jane | 25  |
```

**Test 2: Table with Pipe Characters**
```markdown
Input Markdown:
| Command | Description |
|---------|-------------|
| ls \| grep | List and filter |

Expected: Pipes escaped in output
```

**Test 3: Table with Empty Cells**
```markdown
Input Markdown:
| A | B |
|---|---|
| 1 |   |
|   | 2 |

Expected: Empty cells preserved
```

**Success Criteria**:
- ✅ Round-trip conversion preserves table structure
- ✅ Special characters handled correctly
- ✅ Empty cells preserved
- ✅ Header rows maintained

---

### Phase 4 Deliverables

- [x] Turndown table rule added
- [x] GFM markdown format validated
- [x] Round-trip conversion tested
- [x] Edge cases handled (pipes, empty cells)

### Phase 4 Risks & Mitigation

**Risk**: Merged cells lose structure in markdown (GFM doesn't support colspan/rowspan)
- **Mitigation**: Document limitation in user guide, duplicate content across merged cells

**Risk**: Complex tables with nested formatting break conversion
- **Mitigation**: Strip nested formatting, preserve only text content

---

## Phase 5: Testing & Validation (2-3 hours)

### Goals

1. ✅ Write 40+ automated tests
2. ✅ Run `npm run type-check` (zero errors)
3. ✅ Run `npm run lint` (zero errors)
4. ✅ Browser validation via Chrome DevTools MCP
5. ✅ Manual testing on mobile (iOS Safari, Chrome Android)
6. ✅ Accessibility audit with axe-core

### Files to Create

```
ritemark-app/
└─ tests/
   └─ components/
      ├─ TableBubbleMenu.test.tsx    (NEW - 300 lines)
      ├─ SlashCommands.test.tsx      (NEW - 200 lines)
      └─ TableMarkdown.test.tsx      (NEW - 250 lines)
```

### Implementation Steps

#### Step 5.1: Write Unit Tests (120 min)

See **Testing Strategy** section in `sprint-11-implementation-architecture.md` for full test implementations.

**Test Coverage**:
- SlashCommands: 12 tests
- TableBubbleMenu: 15 tests
- TableMarkdown: 13 tests
- **Total**: 40 tests

**Success Criteria**:
- ✅ All 40 tests pass
- ✅ Code coverage > 90%

---

#### Step 5.2: Run Type Check & Lint (15 min)

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Fix auto-fixable lint errors
npm run lint:fix
```

**Success Criteria**:
- ✅ `npm run type-check` passes (zero errors)
- ✅ `npm run lint` passes (zero errors)

---

#### Step 5.3: Browser Validation (30 min)

```bash
# 1. Kill existing dev server
lsof -ti:5173 | xargs kill -9

# 2. Start dev server
npm run dev

# 3. Open browser with Chrome DevTools MCP
mcp__chrome-devtools__new_page { url: "http://localhost:5173" }

# 4. Test table features
# - Insert table via slash command
# - Add/delete rows and columns
# - Merge cells
# - Save and reload

# 5. Check console for errors
mcp__chrome-devtools__console_page

# 6. Take screenshot
mcp__chrome-devtools__screenshot_page
```

**Success Criteria**:
- ✅ No console errors
- ✅ All table features work
- ✅ UI renders correctly
- ✅ No red error overlays

---

#### Step 5.4: Mobile Testing (30 min)

**Test on iOS Safari**:
1. ✅ Type `/` → Slash menu appears
2. ✅ Select "Table" → 3x3 table inserted
3. ✅ Tap cell → Can type
4. ✅ Tap TableBubbleMenu buttons → Operations work
5. ✅ Column resize works with touch
6. ✅ Save and reload → Table persists

**Test on Chrome Android**:
1. ✅ Repeat iOS Safari tests
2. ✅ Verify touch targets > 48x48px
3. ✅ Test landscape orientation

**Success Criteria**:
- ✅ All features work on mobile
- ✅ Touch targets adequate size
- ✅ No visual glitches

---

#### Step 5.5: Accessibility Audit (30 min)

```bash
# Install axe-core (if not already installed)
npm install --save-dev @axe-core/playwright

# Run accessibility tests
npm run test:accessibility
```

**Manual Testing**:
1. ✅ Keyboard-only navigation (unplug mouse)
2. ✅ Screen reader testing (VoiceOver or NVDA)
3. ✅ High contrast mode
4. ✅ 200% zoom

**Success Criteria**:
- ✅ No axe-core violations
- ✅ All features keyboard-accessible
- ✅ Screen reader announces table structure
- ✅ Focus indicators visible

---

### Phase 5 Deliverables

- [x] 40+ tests written and passing
- [x] Type check passes
- [x] Lint passes
- [x] Browser validation complete
- [x] Mobile testing complete
- [x] Accessibility audit complete

### Phase 5 Risks & Mitigation

**Risk**: Test flakiness with async table operations
- **Mitigation**: Use `waitFor()` for all async assertions

**Risk**: Mobile browser incompatibilities
- **Mitigation**: Provide fallback UI patterns for unsupported features

---

## Sprint Completion Checklist

### Phase 1: Slash Command Infrastructure ✅
- [x] `tippy.js` installed
- [x] `SlashCommandExtension.tsx` created
- [x] `CommandsList.tsx` created
- [x] `commands.ts` created
- [x] CSS styling added
- [x] Integrated into `Editor.tsx`
- [x] Keyboard navigation tested

### Phase 2: Table Extension Integration ✅
- [x] Table extensions installed
- [x] Extensions configured in `Editor.tsx`
- [x] Table CSS styling added
- [x] Table insertion tested
- [x] Basic editing verified

### Phase 3: Table Controls UI ✅
- [x] `TableBubbleMenu.tsx` created
- [x] Row controls implemented
- [x] Column controls implemented
- [x] Cell controls implemented
- [x] Header toggle implemented
- [x] Keyboard shortcuts added
- [x] All operations tested

### Phase 4: GFM Serialization ✅
- [x] Turndown table rule added
- [x] Header rows handled
- [x] Pipe escaping implemented
- [x] Round-trip conversion tested
- [x] Edge cases handled

### Phase 5: Testing & Validation ✅
- [x] 40+ tests written
- [x] Type check passes
- [x] Lint passes
- [x] Browser validation complete
- [x] Mobile testing complete
- [x] Accessibility audit complete

---

## Post-Sprint Activities

### Documentation (1 hour)
- [ ] Update `README.md` (add tables to feature list)
- [ ] Create `docs/components/TableBubbleMenu.md`
- [ ] Create `docs/components/SlashCommands.md`
- [ ] Create `docs/user-guide/tables.md`

### Cleanup (30 min)
- [ ] Remove debug logs
- [ ] Remove unused imports
- [ ] Format code (`npm run format`)
- [ ] Update CHANGELOG.md

### Code Review (1 hour)
- [ ] Self-review all changes
- [ ] Check for AI-generated comments
- [ ] Verify naming consistency
- [ ] Validate bundle size (+48 KB acceptable?)

---

## Success Metrics

- ✅ All 50 tasks completed
- ✅ 40+ tests passing (100% pass rate)
- ✅ `npm run type-check` passes
- ✅ `npm run lint` passes
- ✅ Dev server runs without errors
- ✅ Browser validation completed
- ✅ Tables insert, edit, and convert correctly
- ✅ Bundle size increase < 120 KB

---

**Phase Breakdown Status**: ✅ COMPLETE
**Ready for Implementation**: YES
**Estimated Total Time**: 13-18 hours (with 1-2 hour buffer)
