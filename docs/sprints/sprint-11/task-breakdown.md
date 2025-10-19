# Sprint 11: Tables Feature - Detailed Task Breakdown

**Date:** October 12, 2025
**Status:** 📋 READY FOR EXECUTION
**Orchestrator:** Task Orchestrator Agent
**Total Tasks:** 50 tasks organized across 6 phases
**Estimated Duration:** 12-16 hours

---

## 🎯 Sprint Goal Reminder

**"Enable users to create, edit, and format tables in the WYSIWYG editor with full markdown conversion support."**

**Success Criteria:**
1. User can insert tables via toolbar button
2. User can add/delete rows and columns
3. User can merge cells for complex layouts
4. Tables convert correctly to/from GFM markdown
5. All automated tests pass (40+ tests)
6. Browser validation succeeds

---

## 📋 Task Organization System

### Task ID Format
- **S11-T01**: Sprint 11, Task 01
- **Sequential numbering** across all phases
- **Phase prefix** for context (e.g., "S11-T01-INF" = Infrastructure task)

### Task Categories
1. **INF** - Infrastructure (TipTap extensions, dependencies)
2. **UI** - User Interface (Components, toolbar, menus)
3. **SER** - Serialization (Markdown conversion)
4. **TEST** - Testing (Unit, integration, browser)
5. **DOC** - Documentation (Developer & user guides)

---

## PHASE 1: INFRASTRUCTURE - TIPTAP TABLE EXTENSIONS (6 tasks, 1 hour)

### S11-T01-INF: Install TipTap Table Dependencies
**Agent Type:** `dependency-manager`
**Estimated Time:** 10 minutes
**Priority:** CRITICAL

**Description:**
Install all required TipTap table extensions compatible with our current v3.4.3 TipTap installation.

**Files to Modify:**
- `ritemark-app/package.json` - Add dependencies

**Dependencies Required:**
```json
{
  "@tiptap/extension-table": "^3.4.3",
  "@tiptap/extension-table-row": "^3.4.3",
  "@tiptap/extension-table-cell": "^3.4.3",
  "@tiptap/extension-table-header": "^3.4.3"
}
```

**Commands to Execute:**
```bash
cd ritemark-app
npm install @tiptap/extension-table@^3.4.3 \
  @tiptap/extension-table-row@^3.4.3 \
  @tiptap/extension-table-cell@^3.4.3 \
  @tiptap/extension-table-header@^3.4.3
```

**Success Criteria:**
- ✅ All packages installed successfully
- ✅ No version conflicts with existing TipTap packages
- ✅ `npm run type-check` passes

**Testing:**
```bash
npm ls @tiptap/extension-table
npm run type-check
```

**Dependencies:** None (first task)
**Blocks:** S11-T02-INF, S11-T03-INF

---

### S11-T02-INF: Create Table Extensions Module
**Agent Type:** `typescript-specialist`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Create a centralized module for importing and configuring all table extensions.

**Files to Create:**
- `ritemark-app/src/extensions/table/index.ts`
- `ritemark-app/src/extensions/table/types.ts`

**Implementation:**
```typescript
// ritemark-app/src/extensions/table/index.ts
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

export const TableExtensions = [
  Table.configure({
    resizable: true,
    handleWidth: 5,
    cellMinWidth: 100,
    lastColumnResizable: true,
    allowTableNodeSelection: true,
  }),
  TableRow,
  TableCell,
  TableHeader,
]

export { Table, TableRow, TableCell, TableHeader }
```

**Success Criteria:**
- ✅ Module exports all extensions
- ✅ TypeScript types are correct
- ✅ No compilation errors

**Testing:**
```bash
npm run type-check
```

**Dependencies:** S11-T01-INF
**Blocks:** S11-T03-INF

---

### S11-T03-INF: Integrate Table Extensions into Editor
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Add table extensions to the main Editor component's extension list.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx`

**Implementation:**
```typescript
// Import at top
import { TableExtensions } from '../extensions/table'

// In useEditor hook
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // ... existing config
    }),
    // ... other extensions
    ...TableExtensions, // Add table extensions
  ],
  // ... rest of config
})
```

**Success Criteria:**
- ✅ Extensions imported correctly
- ✅ Editor initializes without errors
- ✅ Dev server runs on localhost:5173
- ✅ Can manually insert table via console: `editor.commands.insertTable({ rows: 3, cols: 3 })`

**Testing:**
```bash
npm run dev
# In browser console:
# window.__editor = editor (expose for testing)
# window.__editor.commands.insertTable({ rows: 3, cols: 3 })
```

**Dependencies:** S11-T02-INF
**Blocks:** S11-T04-INF, S11-T07-UI

---

### S11-T04-INF: Add Basic Table CSS Styling
**Agent Type:** `ui-designer`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Add foundational CSS styles for table rendering in the editor.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx` (or create separate CSS file)

**Implementation:**
```css
/* Table base styles */
.tiptap table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1rem 0;
  overflow: hidden;
}

.tiptap table td,
.tiptap table th {
  min-width: 1em;
  border: 1px solid #cbd5e1;
  padding: 0.5rem;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

.tiptap table th {
  font-weight: 600;
  text-align: left;
  background-color: #f8fafc;
}

.tiptap table .selectedCell {
  background-color: #e0f2fe;
}

.tiptap table .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #3b82f6;
  cursor: col-resize;
  opacity: 0;
  transition: opacity 0.2s;
}

.tiptap table:hover .column-resize-handle {
  opacity: 0.5;
}
```

**Success Criteria:**
- ✅ Tables render with visible borders
- ✅ Header cells have distinct styling
- ✅ Column resizing handles appear on hover
- ✅ Styles work on mobile (responsive)

**Testing:**
- Visual inspection in browser
- Test on mobile viewport (DevTools)

**Dependencies:** S11-T03-INF
**Blocks:** S11-T09-UI (table picker needs styled preview)

---

### S11-T05-INF: Verify TypeScript Compilation
**Agent Type:** `typescript-specialist`
**Estimated Time:** 5 minutes
**Priority:** CRITICAL

**Description:**
Run TypeScript type checking to ensure no errors from new table extensions.

**Files to Check:**
- All files modified in Phase 1

**Commands:**
```bash
cd ritemark-app
npm run type-check
```

**Success Criteria:**
- ✅ Zero TypeScript errors
- ✅ All imports resolve correctly
- ✅ Type definitions for table extensions are available

**Testing:**
```bash
npm run type-check
npm run lint
```

**Dependencies:** S11-T01-INF, S11-T02-INF, S11-T03-INF
**Blocks:** All subsequent phases

---

### S11-T06-INF: Manual Smoke Test - Table Insertion
**Agent Type:** `tester`
**Estimated Time:** 5 minutes
**Priority:** HIGH

**Description:**
Verify tables can be inserted programmatically via browser console.

**Test Steps:**
1. Start dev server: `npm run dev`
2. Open browser at localhost:5173
3. Open DevTools console
4. Execute: `editor.commands.insertTable({ rows: 3, cols: 3 })`
5. Verify table appears in editor
6. Verify table has 3 rows and 3 columns
7. Verify cells are editable

**Success Criteria:**
- ✅ Table inserts successfully
- ✅ No console errors
- ✅ Cells are clickable and editable
- ✅ Table has correct structure (3x3)

**Testing:**
- Manual browser test
- Document results in terminal output

**Dependencies:** S11-T03-INF, S11-T04-INF
**Blocks:** S11-T07-UI

---

## PHASE 2: TABLE TOOLBAR BUTTON (10 tasks, 2 hours)

### S11-T07-UI: Create TablePicker Component Structure
**Agent Type:** `react-developer`
**Estimated Time:** 20 minutes
**Priority:** HIGH

**Description:**
Create the TablePicker component with grid-based row/column selection UI.

**Files to Create:**
- `ritemark-app/src/components/table/TablePicker.tsx`
- `ritemark-app/src/components/table/types.ts`

**Component Interface:**
```typescript
// types.ts
export interface TablePickerProps {
  onSelect: (rows: number, cols: number) => void
  maxRows?: number
  maxCols?: number
}

// TablePicker.tsx
import React, { useState } from 'react'
import { TablePickerProps } from './types'

export const TablePicker: React.FC<TablePickerProps> = ({
  onSelect,
  maxRows = 10,
  maxCols = 10,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null)

  // Component implementation
}
```

**Success Criteria:**
- ✅ Component renders grid of cells
- ✅ Grid shows 10x10 cells by default
- ✅ Cells highlight on hover
- ✅ Shows selected dimensions (e.g., "3 x 4")
- ✅ TypeScript types are correct

**Testing:**
- Render component in Storybook or test harness
- Verify hover effects work

**Dependencies:** S11-T06-INF
**Blocks:** S11-T08-UI, S11-T09-UI

---

### S11-T08-UI: Implement TablePicker Grid Interaction
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Add hover effects and selection logic to the TablePicker grid.

**Files to Modify:**
- `ritemark-app/src/components/table/TablePicker.tsx`

**Implementation:**
```typescript
const handleCellHover = (row: number, col: number) => {
  setHoveredCell({ row, col })
}

const handleCellClick = (row: number, col: number) => {
  onSelect(row + 1, col + 1) // +1 because grid is 0-indexed
}

const isCellHighlighted = (row: number, col: number) => {
  if (!hoveredCell) return false
  return row <= hoveredCell.row && col <= hoveredCell.col
}
```

**Success Criteria:**
- ✅ Hovering highlights all cells in rectangle
- ✅ Clicking triggers onSelect callback
- ✅ Dimension label updates in real-time
- ✅ Works on mobile (touch events)

**Testing:**
- Manual interaction test
- Verify callback receives correct dimensions

**Dependencies:** S11-T07-UI
**Blocks:** S11-T10-UI

---

### S11-T09-UI: Style TablePicker with Tailwind CSS
**Agent Type:** `ui-designer`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Apply Tailwind CSS classes for professional TablePicker appearance.

**Files to Modify:**
- `ritemark-app/src/components/table/TablePicker.tsx`

**Design Specs:**
- Grid cell size: 24px x 24px
- Border: 1px solid gray-300
- Hover: blue-100 background
- Selected: blue-200 background
- Dimension label: text-sm, gray-600
- Container: p-4, rounded-lg, shadow-lg

**Success Criteria:**
- ✅ Matches design specs
- ✅ Responsive on mobile
- ✅ Accessible (keyboard navigation)
- ✅ Consistent with app theme

**Testing:**
- Visual inspection
- Compare with Figma mockup (if available)

**Dependencies:** S11-T08-UI
**Blocks:** S11-T11-UI

---

### S11-T10-UI: Create Table Toolbar Button Icon
**Agent Type:** `ui-designer`
**Estimated Time:** 5 minutes
**Priority:** MEDIUM

**Description:**
Add table icon to toolbar using lucide-react (already in dependencies).

**Files to Modify:**
- Import table icon: `import { Table2 } from 'lucide-react'`

**Icon Selection:**
- Use `Table2` icon from lucide-react
- Size: 18px (matches other toolbar icons)
- Color: currentColor (inherits from parent)

**Success Criteria:**
- ✅ Icon is visually clear
- ✅ Consistent with other toolbar icons
- ✅ Accessible (proper ARIA label)

**Testing:**
- Visual comparison with other toolbar icons

**Dependencies:** None
**Blocks:** S11-T11-UI

---

### S11-T11-UI: Add Table Button to Main Toolbar
**Agent Type:** `react-developer`
**Estimated Time:** 20 minutes
**Priority:** HIGH

**Description:**
Integrate table button into the main toolbar (next to File menu).

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx` (or toolbar component)

**Implementation Location:**
- Add after File menu button
- Before formatting buttons (Bold, Italic, etc.)
- Use Radix UI Popover for dropdown

**Component Structure:**
```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="sm">
      <Table2 size={18} />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <TablePicker onSelect={(rows, cols) => {
      editor?.commands.insertTable({ rows, cols, withHeaderRow: true })
    }} />
  </PopoverContent>
</Popover>
```

**Success Criteria:**
- ✅ Button appears in toolbar
- ✅ Clicking opens TablePicker popover
- ✅ Popover positions correctly (not cut off)
- ✅ Inserting table works

**Testing:**
```bash
npm run dev
# Click table button
# Select 3x3 grid
# Verify table inserts
```

**Dependencies:** S11-T09-UI, S11-T10-UI
**Blocks:** S11-T12-UI

---

### S11-T12-UI: Wire TablePicker to Editor Commands
**Agent Type:** `react-developer`
**Estimated Time:** 10 minutes
**Priority:** HIGH

**Description:**
Connect TablePicker onSelect callback to TipTap insertTable command.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx`

**Implementation:**
```typescript
const handleTableInsert = (rows: number, cols: number) => {
  editor
    ?.chain()
    .focus()
    .insertTable({ rows, cols, withHeaderRow: true })
    .run()
  // Close popover after insertion
}
```

**Success Criteria:**
- ✅ Clicking grid inserts table
- ✅ Table has correct dimensions
- ✅ First row is header by default
- ✅ Popover closes after insertion

**Testing:**
- Insert tables of various sizes (1x1, 5x5, 10x10)
- Verify header row exists

**Dependencies:** S11-T11-UI
**Blocks:** S11-T13-UI

---

### S11-T13-UI: Add Keyboard Shortcut (Cmd+Shift+T)
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Add keyboard shortcut to insert default table (3x3).

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx`

**Implementation:**
```typescript
// In useEditor extensions
import { Extension } from '@tiptap/core'

const TableShortcut = Extension.create({
  name: 'tableShortcut',
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => {
        return this.editor.commands.insertTable({
          rows: 3,
          cols: 3,
          withHeaderRow: true
        })
      },
    }
  },
})

// Add to extensions array
extensions: [
  // ... other extensions
  TableShortcut,
]
```

**Success Criteria:**
- ✅ Cmd+Shift+T inserts 3x3 table
- ✅ Works on Mac and Windows (Cmd/Ctrl)
- ✅ Doesn't conflict with browser shortcuts

**Testing:**
```bash
npm run dev
# Press Cmd+Shift+T (Mac) or Ctrl+Shift+T (Windows)
# Verify 3x3 table inserts
```

**Dependencies:** S11-T12-UI
**Blocks:** S11-T15-UI

---

### S11-T14-UI: Test Table Insertion (Multiple Sizes)
**Agent Type:** `tester`
**Estimated Time:** 10 minutes
**Priority:** HIGH

**Description:**
Test table insertion with various grid sizes.

**Test Cases:**
1. Insert 1x1 table (edge case)
2. Insert 3x3 table (default)
3. Insert 5x5 table (medium)
4. Insert 10x10 table (maximum)
5. Insert 1x10 table (wide)
6. Insert 10x1 table (tall)

**Success Criteria:**
- ✅ All table sizes insert correctly
- ✅ No layout issues or overflow
- ✅ Header row exists in all tables
- ✅ Cells are editable

**Testing:**
- Manual browser testing
- Document any edge case failures

**Dependencies:** S11-T13-UI
**Blocks:** S11-T16-UI

---

### S11-T15-UI: Mobile Responsiveness Test
**Agent Type:** `tester`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Verify TablePicker works on mobile viewports.

**Test Devices:**
- iPhone 13 Pro (390x844)
- iPad Air (820x1180)
- Android (360x640)

**Test Cases:**
1. Toolbar button is tappable
2. Popover fits on screen
3. Grid cells are tappable (not too small)
4. Dimension label is visible
5. Table inserts correctly

**Success Criteria:**
- ✅ All UI elements accessible on mobile
- ✅ No overflow or cut-off elements
- ✅ Touch interactions work smoothly

**Testing:**
- Chrome DevTools device emulation
- Real device testing (if available)

**Dependencies:** S11-T14-UI
**Blocks:** S11-T17-UI

---

### S11-T16-UI: Update Toolbar Tests
**Agent Type:** `tester`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Add automated tests for table toolbar button.

**Files to Create/Modify:**
- `ritemark-app/tests/components/Toolbar.test.tsx` (or similar)

**Test Cases:**
```typescript
describe('Table Toolbar Button', () => {
  test('renders table button in toolbar', () => {
    // Assert button exists
  })

  test('opens TablePicker on click', () => {
    // Click button, assert popover opens
  })

  test('inserts table when grid cell clicked', () => {
    // Click 3x3, assert table in editor
  })

  test('keyboard shortcut inserts table', () => {
    // Simulate Cmd+Shift+T, assert table inserts
  })
})
```

**Success Criteria:**
- ✅ All tests pass
- ✅ Tests are stable (no flakiness)
- ✅ Code coverage >80%

**Testing:**
```bash
npm run test -- Toolbar.test.tsx
```

**Dependencies:** S11-T15-UI
**Blocks:** Phase 3 start

---

## PHASE 3: TABLE CONTEXT MENU (12 tasks, 3 hours)

### S11-T17-UI: Create TableContextMenu Component
**Agent Type:** `react-developer`
**Estimated Time:** 20 minutes
**Priority:** HIGH

**Description:**
Create a context menu component that appears when cursor is inside a table.

**Files to Create:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Component Interface:**
```typescript
interface TableContextMenuProps {
  editor: Editor | null
}

export const TableContextMenu: React.FC<TableContextMenuProps> = ({ editor }) => {
  if (!editor) return null

  const shouldShow = () => {
    return editor.isActive('table')
  }

  // Component implementation
}
```

**Success Criteria:**
- ✅ Component renders when cursor in table
- ✅ Hides when cursor leaves table
- ✅ Positions near cursor or table
- ✅ TypeScript types correct

**Testing:**
- Render in editor with table
- Move cursor in/out of table

**Dependencies:** S11-T16-UI (Phase 2 complete)
**Blocks:** S11-T18-UI

---

### S11-T18-UI: Add Row Operation Buttons
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Add buttons for adding/deleting rows to the context menu.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Buttons to Add:**
- "Add Row Before" (icon: ChevronUp)
- "Add Row After" (icon: ChevronDown)
- "Delete Row" (icon: Trash, destructive variant)

**Implementation:**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.addRowBefore()}
>
  <ChevronUp size={16} />
  Add Row Before
</Button>

<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.addRowAfter()}
>
  <ChevronDown size={16} />
  Add Row After
</Button>

<Button
  variant="destructive"
  size="sm"
  onClick={() => editor?.commands.deleteRow()}
>
  <Trash size={16} />
  Delete Row
</Button>
```

**Success Criteria:**
- ✅ All buttons render correctly
- ✅ Icons are appropriate
- ✅ Buttons trigger correct commands
- ✅ Destructive button has warning style

**Testing:**
- Click each button in a test table
- Verify rows add/delete correctly

**Dependencies:** S11-T17-UI
**Blocks:** S11-T19-UI

---

### S11-T19-UI: Add Column Operation Buttons
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Add buttons for adding/deleting columns to the context menu.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Buttons to Add:**
- "Add Column Before" (icon: ChevronLeft)
- "Add Column After" (icon: ChevronRight)
- "Delete Column" (icon: Trash, destructive variant)

**Implementation:**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.addColumnBefore()}
>
  <ChevronLeft size={16} />
  Add Column Before
</Button>

<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.addColumnAfter()}
>
  <ChevronRight size={16} />
  Add Column After
</Button>

<Button
  variant="destructive"
  size="sm"
  onClick={() => editor?.commands.deleteColumn()}
>
  <Trash size={16} />
  Delete Column
</Button>
```

**Success Criteria:**
- ✅ All buttons render correctly
- ✅ Icons are appropriate
- ✅ Buttons trigger correct commands
- ✅ Columns add/delete correctly

**Testing:**
- Click each button in a test table
- Verify columns add/delete correctly

**Dependencies:** S11-T18-UI
**Blocks:** S11-T20-UI

---

### S11-T20-UI: Add Delete Table Button
**Agent Type:** `react-developer`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Add a button to delete the entire table.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Implementation:**
```typescript
<Separator /> {/* Visual separator */}

<Button
  variant="destructive"
  size="sm"
  onClick={() => {
    if (confirm('Delete entire table?')) {
      editor?.commands.deleteTable()
    }
  }}
>
  <XCircle size={16} />
  Delete Table
</Button>
```

**Success Criteria:**
- ✅ Button appears at bottom of menu
- ✅ Shows confirmation dialog
- ✅ Deletes table when confirmed
- ✅ Cancels when user declines

**Testing:**
- Click button, cancel confirmation
- Click button, confirm deletion
- Verify table is removed

**Dependencies:** S11-T19-UI
**Blocks:** S11-T21-UI

---

### S11-T21-UI: Implement Context Menu Positioning Logic
**Agent Type:** `react-developer`
**Estimated Time:** 20 minutes
**Priority:** HIGH

**Description:**
Position context menu near the active table cell.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Approach:**
- Use BubbleMenu component from TipTap (similar to FormattingBubbleMenu)
- Position menu at top-right of table
- Ensure menu doesn't overflow viewport

**Implementation:**
```typescript
import { BubbleMenu } from '@tiptap/react'

<BubbleMenu
  editor={editor}
  shouldShow={({ editor }) => editor.isActive('table')}
  tippyOptions={{
    placement: 'top-end',
    duration: 100,
  }}
>
  {/* Context menu buttons */}
</BubbleMenu>
```

**Success Criteria:**
- ✅ Menu appears when cursor in table
- ✅ Menu follows cursor/table
- ✅ Doesn't overflow screen edges
- ✅ Hides when cursor leaves table

**Testing:**
- Test with tables at various screen positions
- Test on mobile viewport

**Dependencies:** S11-T20-UI
**Blocks:** S11-T22-UI

---

### S11-T22-UI: Add Keyboard Shortcuts for Row/Column Operations
**Agent Type:** `react-developer`
**Estimated Time:** 20 minutes
**Priority:** MEDIUM

**Description:**
Add keyboard shortcuts for common table operations.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx` (or create TableKeyboardShortcuts extension)

**Shortcuts to Add:**
- `Cmd+Shift+↑`: Add row before
- `Cmd+Shift+↓`: Add row after
- `Cmd+Shift+←`: Add column before
- `Cmd+Shift+→`: Add column after
- `Cmd+Shift+Backspace`: Delete row/column (context-aware)

**Implementation:**
```typescript
const TableKeyboardShortcuts = Extension.create({
  name: 'tableKeyboardShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-ArrowUp': () => this.editor.commands.addRowBefore(),
      'Mod-Shift-ArrowDown': () => this.editor.commands.addRowAfter(),
      'Mod-Shift-ArrowLeft': () => this.editor.commands.addColumnBefore(),
      'Mod-Shift-ArrowRight': () => this.editor.commands.addColumnAfter(),
      'Mod-Shift-Backspace': () => {
        // Delete row if only one cell selected, else delete column
        return this.editor.commands.deleteRow() || this.editor.commands.deleteColumn()
      },
    }
  },
})
```

**Success Criteria:**
- ✅ All shortcuts work as expected
- ✅ Shortcuts only active when cursor in table
- ✅ Doesn't conflict with other shortcuts
- ✅ Works on Mac and Windows

**Testing:**
```bash
npm run dev
# Create table, test each shortcut
```

**Dependencies:** S11-T21-UI
**Blocks:** S11-T23-UI

---

### S11-T23-UI: Test Row Operations
**Agent Type:** `tester`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Automated tests for row operations (add before/after, delete).

**Files to Create/Modify:**
- `ritemark-app/tests/components/TableOperations.test.tsx`

**Test Cases:**
```typescript
describe('Table Row Operations', () => {
  test('adds row before current row', () => {
    // Insert table, click "Add Row Before", verify row count
  })

  test('adds row after current row', () => {
    // Insert table, click "Add Row After", verify row count
  })

  test('deletes current row', () => {
    // Insert 3-row table, delete middle row, verify 2 rows remain
  })

  test('keyboard shortcut adds row before', () => {
    // Simulate Cmd+Shift+↑, verify row added
  })

  test('keyboard shortcut adds row after', () => {
    // Simulate Cmd+Shift+↓, verify row added
  })

  test('cannot delete last row', () => {
    // Delete all but one row, verify last row can't be deleted
  })
})
```

**Success Criteria:**
- ✅ All 6 tests pass
- ✅ Tests cover edge cases
- ✅ No flaky tests

**Testing:**
```bash
npm run test -- TableOperations.test.tsx
```

**Dependencies:** S11-T22-UI
**Blocks:** S11-T24-UI

---

### S11-T24-UI: Test Column Operations
**Agent Type:** `tester`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Automated tests for column operations (add before/after, delete).

**Files to Modify:**
- `ritemark-app/tests/components/TableOperations.test.tsx`

**Test Cases:**
```typescript
describe('Table Column Operations', () => {
  test('adds column before current column', () => {
    // Insert table, click "Add Column Before", verify column count
  })

  test('adds column after current column', () => {
    // Insert table, click "Add Column After", verify column count
  })

  test('deletes current column', () => {
    // Insert 3-col table, delete middle col, verify 2 cols remain
  })

  test('keyboard shortcut adds column before', () => {
    // Simulate Cmd+Shift+←, verify column added
  })

  test('keyboard shortcut adds column after', () => {
    // Simulate Cmd+Shift+→, verify column added
  })

  test('cannot delete last column', () => {
    // Delete all but one column, verify last col can't be deleted
  })
})
```

**Success Criteria:**
- ✅ All 6 tests pass
- ✅ Tests cover edge cases
- ✅ No flaky tests

**Testing:**
```bash
npm run test -- TableOperations.test.tsx
```

**Dependencies:** S11-T23-UI
**Blocks:** S11-T25-UI

---

### S11-T25-UI: Test Context Menu Positioning
**Agent Type:** `tester`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Test that context menu positions correctly and doesn't overflow.

**Test Cases:**
1. Table at top of editor (menu below table)
2. Table at bottom of editor (menu above table)
3. Table near right edge (menu shifts left)
4. Table near left edge (menu shifts right)
5. Mobile viewport (menu fits on screen)

**Success Criteria:**
- ✅ Menu always visible
- ✅ No overflow or cut-off buttons
- ✅ Menu follows table when scrolling

**Testing:**
- Manual browser testing
- Test on multiple screen sizes

**Dependencies:** S11-T24-UI
**Blocks:** S11-T26-UI

---

### S11-T26-UI: Test Keyboard Navigation in Context Menu
**Agent Type:** `tester`
**Estimated Time:** 10 minutes
**Priority:** LOW

**Description:**
Verify context menu is keyboard accessible.

**Test Cases:**
1. Tab key cycles through buttons
2. Enter key triggers focused button
3. Escape key closes menu
4. Arrow keys navigate buttons (if applicable)

**Success Criteria:**
- ✅ All buttons are keyboard accessible
- ✅ Focus indicators are visible
- ✅ ARIA labels are correct

**Testing:**
- Manual keyboard-only navigation test

**Dependencies:** S11-T25-UI
**Blocks:** S11-T27-UI

---

### S11-T27-UI: Accessibility Audit for Table Features
**Agent Type:** `accessibility-tester`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Run accessibility checks on table features.

**Tools:**
- Lighthouse (Chrome DevTools)
- axe DevTools extension
- WAVE browser extension

**Checks:**
- Keyboard navigation works
- Screen reader announces table structure
- Color contrast meets WCAG AA
- Focus indicators are visible
- ARIA attributes are correct

**Success Criteria:**
- ✅ Lighthouse accessibility score >90
- ✅ Zero critical axe violations
- ✅ Screen reader navigates tables correctly

**Testing:**
```bash
npm run dev
# Run Lighthouse audit in Chrome DevTools
# Run axe DevTools scan
```

**Dependencies:** S11-T26-UI
**Blocks:** S11-T28-UI

---

### S11-T28-UI: Context Menu Polish & Visual Review
**Agent Type:** `ui-designer`
**Estimated Time:** 10 minutes
**Priority:** LOW

**Description:**
Final visual polish and consistency check for context menu.

**Review Checklist:**
- [ ] Button sizes consistent
- [ ] Icon sizes consistent (16px)
- [ ] Destructive buttons have warning color
- [ ] Hover states work smoothly
- [ ] Menu background contrasts with editor
- [ ] Shadows and borders are subtle
- [ ] Animations are smooth (if any)

**Success Criteria:**
- ✅ Visual consistency with rest of app
- ✅ Professional appearance
- ✅ No visual bugs

**Testing:**
- Visual inspection
- Compare with design system

**Dependencies:** S11-T27-UI
**Blocks:** Phase 4 start

---

## PHASE 4: CELL MERGING AND HEADERS (8 tasks, 2 hours)

### S11-T29-UI: Add Merge Cells Button
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Add merge cells button to table context menu.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Implementation:**
```typescript
<Separator />

<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.mergeCells()}
  disabled={!editor?.can().mergeCells()}
>
  <Combine size={16} />
  Merge Cells
</Button>
```

**Success Criteria:**
- ✅ Button appears in context menu
- ✅ Button disabled when merge not possible
- ✅ Merging cells works correctly

**Testing:**
- Select multiple cells, click merge
- Verify cells merge visually

**Dependencies:** S11-T28-UI (Phase 3 complete)
**Blocks:** S11-T30-UI

---

### S11-T30-UI: Add Split Cell Button
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Add split cell button to undo cell merges.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Implementation:**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.splitCell()}
  disabled={!editor?.can().splitCell()}
>
  <Split size={16} />
  Split Cell
</Button>
```

**Success Criteria:**
- ✅ Button appears in context menu
- ✅ Button disabled when split not possible
- ✅ Splitting cells restores original structure

**Testing:**
- Merge cells, then split them
- Verify original structure restored

**Dependencies:** S11-T29-UI
**Blocks:** S11-T31-UI

---

### S11-T31-UI: Add Toggle Header Row Button
**Agent Type:** `react-developer`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Add button to toggle header row formatting.

**Files to Modify:**
- `ritemark-app/src/components/table/TableContextMenu.tsx`

**Implementation:**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => editor?.commands.toggleHeaderRow()}
  data-active={editor?.isActive('tableHeader')}
>
  <Heading size={16} />
  Toggle Header Row
</Button>
```

**Success Criteria:**
- ✅ Button toggles header row on/off
- ✅ Button shows active state when header exists
- ✅ Header cells have distinct styling

**Testing:**
- Toggle header row on/off
- Verify styling changes

**Dependencies:** S11-T30-UI
**Blocks:** S11-T32-UI

---

### S11-T32-UI: Add CSS Styling for Header Cells
**Agent Type:** `ui-designer`
**Estimated Time:** 10 minutes
**Priority:** HIGH

**Description:**
Add distinct styling for table header cells.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx` (CSS section)

**Styles to Add:**
```css
.tiptap table th {
  font-weight: 700;
  text-align: left;
  background-color: #f1f5f9; /* slate-100 */
  border-bottom: 2px solid #94a3b8; /* slate-400 */
}

.tiptap table th:first-child {
  border-top-left-radius: 4px;
}

.tiptap table th:last-child {
  border-top-right-radius: 4px;
}
```

**Success Criteria:**
- ✅ Header cells have gray background
- ✅ Header text is bold
- ✅ Bottom border is thicker
- ✅ Works in dark mode (if applicable)

**Testing:**
- Visual inspection
- Test with/without header row

**Dependencies:** S11-T31-UI
**Blocks:** S11-T33-UI

---

### S11-T33-UI: Add CSS Styling for Merged Cells
**Agent Type:** `ui-designer`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Ensure merged cells (colspan/rowspan) display correctly.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx` (CSS section)

**Styles to Add:**
```css
.tiptap table td[colspan] {
  text-align: center; /* Center content in merged cells */
}

.tiptap table td[rowspan] {
  vertical-align: middle; /* Center vertically in merged cells */
}

.tiptap table .selectedCell[colspan],
.tiptap table .selectedCell[rowspan] {
  background-color: #dbeafe; /* blue-100 */
}
```

**Success Criteria:**
- ✅ Merged cells display correctly
- ✅ Content is centered
- ✅ Selection highlight works

**Testing:**
- Merge 2x2 cells, verify styling
- Select merged cell, verify highlight

**Dependencies:** S11-T32-UI
**Blocks:** S11-T34-UI

---

### S11-T34-UI: Test Merge/Split Edge Cases
**Agent Type:** `tester`
**Estimated Time:** 20 minutes
**Priority:** HIGH

**Description:**
Test edge cases for cell merging and splitting.

**Test Cases:**
```typescript
describe('Cell Merging Edge Cases', () => {
  test('cannot merge non-adjacent cells', () => {
    // Select cells with gap, verify merge disabled
  })

  test('merge 2x2 cells', () => {
    // Merge 2x2 block, verify colspan=2 rowspan=2
  })

  test('split restores original cells', () => {
    // Merge, split, verify original structure
  })

  test('merging preserves cell content', () => {
    // Merge cells with content, verify content preserved
  })

  test('cannot merge across header/body boundary', () => {
    // Try merging header + body cell, verify prevented
  })
})
```

**Success Criteria:**
- ✅ All 5 tests pass
- ✅ Edge cases handled gracefully
- ✅ No data loss on merge/split

**Testing:**
```bash
npm run test -- TableMerging.test.tsx
```

**Dependencies:** S11-T33-UI
**Blocks:** S11-T35-UI

---

### S11-T35-UI: Test Header Row Toggle
**Agent Type:** `tester`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Test header row toggle functionality.

**Test Cases:**
```typescript
describe('Table Header Row', () => {
  test('toggles header row on', () => {
    // Insert table without header, toggle on, verify first row is <th>
  })

  test('toggles header row off', () => {
    // Insert table with header, toggle off, verify all cells are <td>
  })

  test('header cells have distinct styling', () => {
    // Check CSS classes on header cells
  })

  test('header persists on markdown conversion', () => {
    // Convert to markdown, verify header separator exists
  })
})
```

**Success Criteria:**
- ✅ All 4 tests pass
- ✅ Header toggle is reversible
- ✅ Styling updates correctly

**Testing:**
```bash
npm run test -- TableHeader.test.tsx
```

**Dependencies:** S11-T34-UI
**Blocks:** S11-T36-UI

---

### S11-T36-UI: Visual Review of Merged Cells and Headers
**Agent Type:** `ui-designer`
**Estimated Time:** 10 minutes
**Priority:** LOW

**Description:**
Final visual review of merged cells and header styling.

**Review Checklist:**
- [ ] Header cells clearly distinguished
- [ ] Merged cells align properly
- [ ] Selection highlights work
- [ ] Content is readable in all states
- [ ] Mobile layout doesn't break

**Success Criteria:**
- ✅ Professional appearance
- ✅ Visual consistency
- ✅ No layout bugs

**Testing:**
- Visual inspection
- Test on mobile viewport

**Dependencies:** S11-T35-UI
**Blocks:** Phase 5 start

---

## PHASE 5: MARKDOWN CONVERSION (10 tasks, 3 hours)

### S11-T37-SER: Create Turndown Table Rule (HTML → Markdown)
**Agent Type:** `markdown-specialist`
**Estimated Time:** 30 minutes
**Priority:** CRITICAL

**Description:**
Create custom Turndown rule to convert `<table>` HTML to GFM markdown.

**Files to Create:**
- `ritemark-app/src/lib/markdown/turndown-table-rule.ts`

**Implementation:**
```typescript
import TurndownService from 'turndown'

export const tableRule: TurndownService.Rule = {
  filter: 'table',
  replacement: (content, node: HTMLTableElement) => {
    const rows = Array.from(node.querySelectorAll('tr'))
    const headers = Array.from(rows[0]?.querySelectorAll('th, td') || [])
    const hasHeader = rows[0]?.querySelector('th') !== null

    let markdown = '\n'

    // Generate header row
    markdown += '| ' + headers.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |\n'

    // Generate separator
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n'

    // Generate body rows
    const bodyRows = hasHeader ? rows.slice(1) : rows
    bodyRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'))
      markdown += '| ' + cells.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |\n'
    })

    markdown += '\n'
    return markdown
  }
}
```

**Success Criteria:**
- ✅ Converts simple tables correctly
- ✅ Handles header rows
- ✅ Generates valid GFM syntax

**Testing:**
- Unit tests for various table structures

**Dependencies:** S11-T36-UI (Phase 4 complete)
**Blocks:** S11-T38-SER

---

### S11-T38-SER: Handle Merged Cells in Markdown Conversion
**Agent Type:** `markdown-specialist`
**Estimated Time:** 20 minutes
**Priority:** MEDIUM

**Description:**
Add logic to handle merged cells (colspan/rowspan) in markdown conversion.

**Files to Modify:**
- `ritemark-app/src/lib/markdown/turndown-table-rule.ts`

**Strategy:**
- Markdown doesn't support merged cells natively
- Duplicate cell content across merged cells
- Document limitation in user guide

**Implementation:**
```typescript
// In tableRule.replacement function
const cells = Array.from(row.querySelectorAll('td, th'))
const cellContents = cells.map(cell => {
  const colspan = parseInt(cell.getAttribute('colspan') || '1')
  const content = cell.textContent?.trim() || ''

  // Duplicate content for colspan
  return Array(colspan).fill(content)
}).flat()

markdown += '| ' + cellContents.join(' | ') + ' |\n'
```

**Success Criteria:**
- ✅ Merged cells don't break markdown
- ✅ Content is preserved (even if structure isn't)
- ✅ Warning logged for users

**Testing:**
- Test with 2x1, 1x2, and 2x2 merged cells

**Dependencies:** S11-T37-SER
**Blocks:** S11-T39-SER

---

### S11-T39-SER: Escape Pipe Characters in Cell Content
**Agent Type:** `markdown-specialist`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Escape pipe characters (`|`) in cell content to prevent markdown parsing issues.

**Files to Modify:**
- `ritemark-app/src/lib/markdown/turndown-table-rule.ts`

**Implementation:**
```typescript
const escapePipes = (text: string): string => {
  return text.replace(/\|/g, '\\|')
}

// In cell content extraction
const content = escapePipes(cell.textContent?.trim() || '')
```

**Success Criteria:**
- ✅ Cells with `|` characters convert correctly
- ✅ Escaped pipes display correctly in markdown
- ✅ Round-trip conversion preserves pipes

**Testing:**
- Test cell containing "A | B | C"
- Verify markdown: "A \\| B \\| C"

**Dependencies:** S11-T38-SER
**Blocks:** S11-T40-SER

---

### S11-T40-SER: Integrate Table Rule into Editor
**Agent Type:** `react-developer`
**Estimated Time:** 10 minutes
**Priority:** HIGH

**Description:**
Add custom table rule to Turndown service in Editor component.

**Files to Modify:**
- `ritemark-app/src/components/Editor.tsx`

**Implementation:**
```typescript
import { tableRule } from '../lib/markdown/turndown-table-rule'

// In editor setup
const turndownService = new TurndownService({
  // ... existing config
})

turndownService.addRule('table', tableRule)
```

**Success Criteria:**
- ✅ Tables convert to markdown on save
- ✅ Markdown is valid GFM format
- ✅ No errors in console

**Testing:**
```bash
npm run dev
# Create table, save document
# Verify markdown output
```

**Dependencies:** S11-T39-SER
**Blocks:** S11-T41-SER

---

### S11-T41-SER: Configure marked.js GFM Extension
**Agent Type:** `markdown-specialist`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Ensure marked.js correctly parses GFM tables back into HTML.

**Files to Modify:**
- `ritemark-app/src/lib/markdown/parser.ts` (or wherever marked is configured)

**Implementation:**
```typescript
import { marked } from 'marked'

// GFM is enabled by default in marked 4.x+
// Verify table parsing works
marked.use({
  gfm: true,
  breaks: true,
})

export const parseMarkdown = (markdown: string): string => {
  return marked.parse(markdown, {
    async: false,
  }) as string
}
```

**Success Criteria:**
- ✅ Markdown tables parse to HTML
- ✅ Header rows convert to `<th>` elements
- ✅ Cell alignment respected (if specified)

**Testing:**
```typescript
const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`

const html = parseMarkdown(markdown)
// Verify HTML contains <table>, <th>, <td>
```

**Dependencies:** S11-T40-SER
**Blocks:** S11-T42-SER

---

### S11-T42-SER: Test Round-Trip Conversion (HTML → MD → HTML)
**Agent Type:** `tester`
**Estimated Time:** 20 minutes
**Priority:** CRITICAL

**Description:**
Test that tables survive round-trip conversion without data loss.

**Test Cases:**
```typescript
describe('Table Round-Trip Conversion', () => {
  test('simple 3x3 table survives round-trip', () => {
    // Create table → convert to MD → parse back → verify structure
  })

  test('header row persists in round-trip', () => {
    // Create table with header → convert → parse → verify <th> elements
  })

  test('cell content preserved exactly', () => {
    // Create table with text → round-trip → verify text unchanged
  })

  test('empty cells remain empty', () => {
    // Create table with empty cells → round-trip → verify still empty
  })

  test('special characters preserved', () => {
    // Create table with *, _, `, etc. → round-trip → verify escaped correctly
  })
})
```

**Success Criteria:**
- ✅ All 5 tests pass
- ✅ No data loss on round-trip
- ✅ Structure preserved (rows, columns, headers)

**Testing:**
```bash
npm run test -- TableConversion.test.tsx
```

**Dependencies:** S11-T41-SER
**Blocks:** S11-T43-SER

---

### S11-T43-SER: Test Edge Cases (Empty Cells, Special Characters)
**Agent Type:** `tester`
**Estimated Time:** 20 minutes
**Priority:** HIGH

**Description:**
Test edge cases in markdown conversion.

**Test Cases:**
```typescript
describe('Table Conversion Edge Cases', () => {
  test('empty cells convert to markdown', () => {
    // Table with empty cells → verify markdown has ||
  })

  test('pipe characters are escaped', () => {
    // Cell with "A | B" → verify markdown has "A \\| B"
  })

  test('newlines in cells are preserved', () => {
    // Cell with multiline text → verify converts correctly
  })

  test('HTML entities are escaped', () => {
    // Cell with <, >, &, etc. → verify escaped in markdown
  })

  test('very long cell content wraps', () => {
    // Cell with 1000+ characters → verify doesn't break table
  })

  test('single-cell table', () => {
    // 1x1 table → verify converts correctly
  })

  test('single-row table', () => {
    // 1x10 table → verify converts correctly
  })

  test('single-column table', () => {
    // 10x1 table → verify converts correctly
  })
})
```

**Success Criteria:**
- ✅ All 8 tests pass
- ✅ Edge cases handled gracefully
- ✅ No crashes or errors

**Testing:**
```bash
npm run test -- TableConversionEdgeCases.test.tsx
```

**Dependencies:** S11-T42-SER
**Blocks:** S11-T44-SER

---

### S11-T44-SER: Test Markdown Import (User Loads Existing MD)
**Agent Type:** `tester`
**Estimated Time:** 15 minutes
**Priority:** HIGH

**Description:**
Test that users can load existing markdown files with tables.

**Test Cases:**
```typescript
describe('Markdown Table Import', () => {
  test('loads simple GFM table from markdown', () => {
    const markdown = `
    | A | B |
    |---|---|
    | 1 | 2 |
    `
    // Load in editor, verify table renders
  })

  test('detects and renders header row', () => {
    // Markdown with header → verify first row is <th>
  })

  test('handles tables without header row', () => {
    // Markdown without header → verify all <td>
  })

  test('ignores malformed tables gracefully', () => {
    // Invalid markdown table → verify doesn't crash
  })
})
```

**Success Criteria:**
- ✅ All 4 tests pass
- ✅ GFM tables load correctly
- ✅ Malformed tables don't crash editor

**Testing:**
```bash
npm run test -- TableImport.test.tsx
```

**Dependencies:** S11-T43-SER
**Blocks:** S11-T45-SER

---

### S11-T45-SER: Visual Inspection of Converted Tables
**Agent Type:** `tester`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Manually verify converted tables look correct.

**Test Steps:**
1. Create various tables in editor
2. Save to markdown
3. Open markdown file in external viewer (GitHub, VS Code)
4. Verify tables render correctly
5. Reload markdown in RiteMark
6. Verify tables re-render correctly

**Success Criteria:**
- ✅ Tables look identical in GitHub markdown preview
- ✅ Tables re-render correctly in RiteMark
- ✅ No visual glitches or layout issues

**Testing:**
- Manual testing with real markdown files

**Dependencies:** S11-T44-SER
**Blocks:** S11-T46-SER

---

### S11-T46-SER: Document Markdown Conversion Limitations
**Agent Type:** `documenter`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Document known limitations of GFM table conversion.

**Files to Create/Modify:**
- `docs/user-guide/tables.md` (add Limitations section)

**Limitations to Document:**
1. Merged cells don't convert perfectly (content duplicated)
2. Column alignment not preserved (GFM limitation)
3. Cell styling (colors, borders) lost in conversion
4. Very wide tables may need horizontal scrolling

**Success Criteria:**
- ✅ Limitations clearly documented
- ✅ Workarounds provided where possible
- ✅ User expectations managed

**Testing:**
- Review documentation for clarity

**Dependencies:** S11-T45-SER
**Blocks:** Phase 6 start

---

## PHASE 6: TESTING AND DOCUMENTATION (14 tasks, 3 hours)

### S11-T47-TEST: Create Comprehensive Test Suite
**Agent Type:** `tester`
**Estimated Time:** 30 minutes
**Priority:** CRITICAL

**Description:**
Create main test file with all 40+ table tests.

**Files to Create:**
- `ritemark-app/tests/features/TableFeatures.test.tsx`

**Test Categories:**
1. Table insertion (3 tests)
2. Row operations (6 tests)
3. Column operations (6 tests)
4. Cell merging (4 tests)
5. Header rows (3 tests)
6. Keyboard navigation (5 tests)
7. Markdown conversion (8 tests)
8. Edge cases (5 tests)

**Total: 40+ tests**

**Success Criteria:**
- ✅ All 40+ tests written
- ✅ Tests are organized by category
- ✅ Test names are descriptive

**Testing:**
```bash
npm run test -- TableFeatures.test.tsx
```

**Dependencies:** S11-T46-SER (Phase 5 complete)
**Blocks:** S11-T48-TEST

---

### S11-T48-TEST: Run All Tests and Verify 100% Pass Rate
**Agent Type:** `tester`
**Estimated Time:** 20 minutes
**Priority:** CRITICAL

**Description:**
Execute all table tests and ensure 100% pass rate.

**Commands:**
```bash
cd ritemark-app
npm run test -- TableFeatures.test.tsx
npm run test:coverage -- TableFeatures.test.tsx
```

**Success Criteria:**
- ✅ All 40+ tests pass
- ✅ No flaky tests
- ✅ Code coverage >80%
- ✅ Zero console errors during tests

**Testing:**
- Run tests multiple times to check for flakiness
- Review coverage report

**Dependencies:** S11-T47-TEST
**Blocks:** S11-T49-TEST

---

### S11-T49-TEST: Browser Validation (Chrome DevTools MCP)
**Agent Type:** `browser-tester`
**Estimated Time:** 20 minutes
**Priority:** CRITICAL

**Description:**
Use Chrome DevTools MCP to validate tables in actual browser.

**Commands:**
```bash
# Start dev server
npm run dev

# Use Chrome DevTools MCP (if available)
mcp__chrome-devtools__new_page { url: "http://localhost:5173" }
mcp__chrome-devtools__console_page
mcp__chrome-devtools__screenshot_page
```

**Validation Checks:**
1. No console errors on page load
2. Table button appears in toolbar
3. Clicking table button opens picker
4. Inserting table works
5. Context menu appears in table
6. All row/column operations work
7. Markdown conversion works

**Success Criteria:**
- ✅ Zero console errors
- ✅ All features work in browser
- ✅ No visual glitches
- ✅ Performance is acceptable (no lag)

**Testing:**
- Use Chrome DevTools MCP if available
- Manual browser testing as fallback

**Dependencies:** S11-T48-TEST
**Blocks:** S11-T50-TEST

---

### S11-T50-TEST: Performance Test (Large Tables)
**Agent Type:** `performance-tester`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Test editor performance with large tables.

**Test Cases:**
1. Insert 10x10 table (100 cells)
2. Insert 20x20 table (400 cells)
3. Type in large table (measure lag)
4. Add/delete rows in large table
5. Convert large table to markdown

**Success Criteria:**
- ✅ 10x10 table renders instantly
- ✅ 20x20 table renders in <500ms
- ✅ Typing has no noticeable lag
- ✅ Row/column operations complete in <200ms

**Testing:**
- Use browser DevTools Performance tab
- Measure rendering time

**Dependencies:** S11-T49-TEST
**Blocks:** S11-T51-TEST

---

### S11-T51-TEST: Mobile Browser Testing
**Agent Type:** `mobile-tester`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Test table features on mobile browsers.

**Test Devices:**
- iPhone (Safari)
- Android (Chrome)

**Test Cases:**
1. Table button is tappable
2. Table picker works on touch
3. Context menu appears on table tap
4. Row/column operations work
5. Tables are responsive (scroll horizontally if needed)

**Success Criteria:**
- ✅ All features work on mobile
- ✅ Touch interactions are smooth
- ✅ Tables don't overflow viewport

**Testing:**
- Use real devices or BrowserStack
- Chrome DevTools device emulation

**Dependencies:** S11-T50-TEST
**Blocks:** S11-T52-DOC

---

### S11-T52-DOC: Create Developer Documentation
**Agent Type:** `documenter`
**Estimated Time:** 45 minutes
**Priority:** HIGH

**Description:**
Write comprehensive developer documentation for table features.

**Files to Create:**
- `docs/components/TableFeatures.md`

**Sections:**
1. Overview
2. Installation & Setup
3. API Reference (TablePicker, TableContextMenu)
4. Configuration Options
5. Custom Commands
6. Markdown Conversion Details
7. Troubleshooting
8. Code Examples

**Target Length:** 500+ lines

**Success Criteria:**
- ✅ All APIs documented
- ✅ Code examples are correct
- ✅ Common issues addressed
- ✅ Links to related docs

**Testing:**
- Peer review of documentation

**Dependencies:** S11-T51-TEST
**Blocks:** S11-T53-DOC

---

### S11-T53-DOC: Create User Guide
**Agent Type:** `documenter`
**Estimated Time:** 30 minutes
**Priority:** HIGH

**Description:**
Write user-facing guide for table features.

**Files to Create:**
- `docs/user-guide/tables.md`

**Sections:**
1. How to Insert Tables
2. How to Add/Delete Rows/Columns
3. How to Merge Cells
4. Keyboard Shortcuts Reference
5. Markdown Conversion Tips
6. Known Limitations
7. Troubleshooting

**Target Length:** 300+ lines

**Success Criteria:**
- ✅ User-friendly language (no jargon)
- ✅ Screenshots/GIFs for each feature
- ✅ Clear step-by-step instructions
- ✅ FAQ section

**Testing:**
- Ask non-technical user to follow guide

**Dependencies:** S11-T52-DOC
**Blocks:** S11-T54-DOC

---

### S11-T54-DOC: Update README with Table Features
**Agent Type:** `documenter`
**Estimated Time:** 10 minutes
**Priority:** MEDIUM

**Description:**
Add table features to main README feature list.

**Files to Modify:**
- `README.md`

**Changes:**
- Add "Tables" to feature list
- Add link to table user guide
- Update screenshots (if showing toolbar)

**Success Criteria:**
- ✅ Tables listed in features
- ✅ Link to docs works
- ✅ README is up-to-date

**Testing:**
- Verify all links work

**Dependencies:** S11-T53-DOC
**Blocks:** S11-T55-DOC

---

### S11-T55-DOC: Create Keyboard Shortcuts Reference
**Agent Type:** `documenter`
**Estimated Time:** 15 minutes
**Priority:** LOW

**Description:**
Create comprehensive keyboard shortcuts reference for tables.

**Files to Create:**
- `docs/user-guide/keyboard-shortcuts.md` (add Table section)

**Shortcuts to Document:**
- `Cmd+Shift+T` - Insert table
- `Cmd+Shift+↑` - Add row before
- `Cmd+Shift+↓` - Add row after
- `Cmd+Shift+←` - Add column before
- `Cmd+Shift+→` - Add column after
- `Cmd+Shift+Backspace` - Delete row/column
- `Tab` - Next cell
- `Shift+Tab` - Previous cell

**Success Criteria:**
- ✅ All shortcuts documented
- ✅ Mac/Windows differences noted
- ✅ Shortcuts are accurate

**Testing:**
- Verify each shortcut works as documented

**Dependencies:** S11-T54-DOC
**Blocks:** S11-T56-DOC

---

### S11-T56-DOC: Create Troubleshooting Guide
**Agent Type:** `documenter`
**Estimated Time:** 20 minutes
**Priority:** MEDIUM

**Description:**
Document common issues and solutions for table features.

**Files to Create:**
- `docs/troubleshooting/tables.md`

**Common Issues:**
1. Table picker doesn't open → Check browser console for errors
2. Context menu doesn't appear → Verify cursor is in table cell
3. Merged cells don't convert correctly → Document GFM limitation
4. Large tables lag → Suggest breaking into smaller tables
5. Tables don't load from markdown → Check GFM syntax

**Success Criteria:**
- ✅ Top 5 issues documented
- ✅ Solutions are actionable
- ✅ Links to relevant docs

**Testing:**
- Test solutions for each issue

**Dependencies:** S11-T55-DOC
**Blocks:** S11-T57-DOC

---

### S11-T57-DOC: Review All Documentation for Accuracy
**Agent Type:** `documenter`
**Estimated Time:** 15 minutes
**Priority:** MEDIUM

**Description:**
Final review of all table documentation for accuracy and completeness.

**Files to Review:**
- `docs/components/TableFeatures.md`
- `docs/user-guide/tables.md`
- `docs/user-guide/keyboard-shortcuts.md`
- `docs/troubleshooting/tables.md`
- `README.md`

**Review Checklist:**
- [ ] All code examples work
- [ ] All links resolve correctly
- [ ] Screenshots are up-to-date
- [ ] No typos or grammar errors
- [ ] Formatting is consistent

**Success Criteria:**
- ✅ Zero broken links
- ✅ All examples tested
- ✅ Professional quality

**Testing:**
- Peer review

**Dependencies:** S11-T56-DOC
**Blocks:** S11-T58-DOC

---

### S11-T58-DOC: Generate API Documentation (TypeDoc)
**Agent Type:** `documenter`
**Estimated Time:** 10 minutes
**Priority:** LOW

**Description:**
Generate automated API documentation from TypeScript comments.

**Commands:**
```bash
npm install --save-dev typedoc
npx typedoc --out docs/api src/components/table src/extensions/table
```

**Success Criteria:**
- ✅ API docs generated successfully
- ✅ All public APIs documented
- ✅ Hosted or linked in main docs

**Testing:**
- Review generated docs for completeness

**Dependencies:** S11-T57-DOC
**Blocks:** S11-T59-TEST

---

### S11-T59-TEST: Final Type Check and Linting
**Agent Type:** `typescript-specialist`
**Estimated Time:** 10 minutes
**Priority:** CRITICAL

**Description:**
Run TypeScript and ESLint to ensure code quality.

**Commands:**
```bash
cd ritemark-app
npm run type-check
npm run lint
npm run format:check
```

**Success Criteria:**
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Code is formatted correctly

**Testing:**
```bash
npm run type-check && npm run lint && npm run format:check
```

**Dependencies:** S11-T58-DOC
**Blocks:** S11-T60-TEST

---

### S11-T60-TEST: Sprint 11 Completion Verification
**Agent Type:** `coordinator`
**Estimated Time:** 15 minutes
**Priority:** CRITICAL

**Description:**
Final verification that all Sprint 11 requirements are met.

**Verification Checklist:**
- [ ] All 50 tasks completed
- [ ] All 40+ tests passing
- [ ] TypeScript compilation passes
- [ ] Linting passes
- [ ] Dev server runs without errors
- [ ] Browser validation successful
- [ ] Documentation complete
- [ ] User can insert tables
- [ ] User can add/delete rows/columns
- [ ] User can merge cells
- [ ] Tables convert to/from markdown correctly
- [ ] No regressions in existing features

**Success Criteria:**
- ✅ All checklist items verified
- ✅ Sprint 11 is COMPLETE
- ✅ Ready for code review and merge

**Testing:**
- Full end-to-end test of all table features

**Dependencies:** S11-T59-TEST
**Blocks:** None (Sprint complete!)

---

## 📊 TASK SUMMARY

### By Phase
| Phase | Tasks | Est. Time | Priority Breakdown |
|-------|-------|-----------|-------------------|
| Phase 1: Infrastructure | 6 | 1 hour | 3 Critical, 2 High, 1 Medium |
| Phase 2: Toolbar Button | 10 | 2 hours | 6 High, 3 Medium, 1 Low |
| Phase 3: Context Menu | 12 | 3 hours | 6 High, 4 Medium, 2 Low |
| Phase 4: Merging & Headers | 8 | 2 hours | 4 High, 3 Medium, 1 Low |
| Phase 5: Markdown Conversion | 10 | 3 hours | 7 High, 2 Medium, 1 Critical |
| Phase 6: Testing & Docs | 14 | 3 hours | 5 Critical, 6 High, 3 Medium |
| **TOTAL** | **60 tasks** | **14 hours** | **9 Critical, 28 High, 18 Medium, 5 Low** |

### By Category
| Category | Tasks | Priority |
|----------|-------|----------|
| INF (Infrastructure) | 6 | CRITICAL |
| UI (User Interface) | 24 | HIGH |
| SER (Serialization) | 10 | HIGH |
| TEST (Testing) | 14 | CRITICAL |
| DOC (Documentation) | 6 | MEDIUM |

### Critical Path (Blocking Chain)
```
S11-T01 → S11-T02 → S11-T03 → S11-T05 → S11-T07 → ... → S11-T60
```

**Longest dependency chain:** 20 tasks (full sequential path)

### Parallel Execution Opportunities
- **Phase 2 Tasks 7-10:** Can be worked on in parallel (UI components)
- **Phase 3 Tasks 18-20:** Row/column/delete buttons (parallel)
- **Phase 5 Tasks 37-39:** Markdown conversion rules (parallel)
- **Phase 6 Tasks 52-58:** Documentation (parallel)

**Estimated speed-up with 4 parallel agents:** ~25% (14 hours → 10.5 hours)

---

## 🚀 RECOMMENDED AGENT ASSIGNMENTS

### Phase 1 (Sequential)
- **Agent 1:** `dependency-manager` → S11-T01
- **Agent 2:** `typescript-specialist` → S11-T02, S11-T05
- **Agent 3:** `react-developer` → S11-T03
- **Agent 4:** `ui-designer` → S11-T04

### Phase 2 (Parallel)
- **Agent 1:** `react-developer` → S11-T07, S11-T08, S11-T12
- **Agent 2:** `ui-designer` → S11-T09, S11-T10
- **Agent 3:** `react-developer` → S11-T11, S11-T13
- **Agent 4:** `tester` → S11-T14, S11-T15, S11-T16

### Phase 3 (Parallel)
- **Agent 1:** `react-developer` → S11-T17, S11-T21
- **Agent 2:** `react-developer` → S11-T18, S11-T19
- **Agent 3:** `react-developer` → S11-T20, S11-T22
- **Agent 4:** `tester` → S11-T23, S11-T24, S11-T25

### Phase 4 (Sequential)
- **Agent 1:** `react-developer` → S11-T29, S11-T30, S11-T31
- **Agent 2:** `ui-designer` → S11-T32, S11-T33
- **Agent 3:** `tester` → S11-T34, S11-T35

### Phase 5 (Parallel)
- **Agent 1:** `markdown-specialist` → S11-T37, S11-T38, S11-T39
- **Agent 2:** `react-developer` → S11-T40, S11-T41
- **Agent 3:** `tester` → S11-T42, S11-T43, S11-T44

### Phase 6 (Parallel)
- **Agent 1:** `tester` → S11-T47, S11-T48, S11-T49
- **Agent 2:** `performance-tester` → S11-T50, S11-T51
- **Agent 3:** `documenter` → S11-T52, S11-T53, S11-T54
- **Agent 4:** `documenter` → S11-T55, S11-T56, S11-T57

---

## 🎯 SUCCESS CRITERIA CHECKLIST

Sprint 11 is **COMPLETE** when ALL of the following are true:

### Functional Requirements
- [ ] User can insert tables via toolbar button (with row/col picker)
- [ ] User can add rows before/after current row
- [ ] User can delete rows
- [ ] User can add columns before/after current column
- [ ] User can delete columns
- [ ] User can merge multiple cells
- [ ] User can split merged cells
- [ ] User can toggle header row formatting
- [ ] Keyboard shortcuts work for all operations
- [ ] Tables convert to GFM markdown on save
- [ ] Markdown tables load correctly in editor

### Technical Requirements
- [ ] All 40+ automated tests pass (100% pass rate)
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Dev server runs on localhost:5173 without errors
- [ ] Browser validation successful (zero console errors)
- [ ] Performance acceptable (no lag with 10x10 tables)
- [ ] Mobile responsive (all features work on touch devices)

### Documentation Requirements
- [ ] Developer documentation complete (500+ lines)
- [ ] User guide complete (300+ lines)
- [ ] Keyboard shortcuts documented
- [ ] Troubleshooting guide exists
- [ ] README updated with table features
- [ ] All code examples tested
- [ ] All links working

### Quality Requirements
- [ ] Code reviewed by peer
- [ ] No regressions in existing features
- [ ] Accessibility audit passed (Lighthouse >90)
- [ ] Visual design consistent with app theme
- [ ] No TypeScript `any` types (unless absolutely necessary)

---

## 📞 COORDINATION PROTOCOL

### Before Starting Each Task
```bash
npx claude-flow@alpha hooks pre-task --description "[Task ID]: [Task Title]"
```

### After Completing Each Task
```bash
npx claude-flow@alpha hooks post-task --task-id "[Task ID]"
npx claude-flow@alpha hooks post-edit --file "[modified-file]" --memory-key "sprint-11/[task-id]"
```

### Session Management
```bash
# Start of day
npx claude-flow@alpha hooks session-restore --session-id "swarm-sprint-11"

# End of day
npx claude-flow@alpha hooks session-end --export-metrics true
```

---

## 🔗 RELATED DOCUMENTATION

- [Sprint 11 Tables Plan](/docs/sprints/sprint-11-tables-plan.md)
- [TipTap Slash Commands Research](/docs/research/tiptap-slash-commands-analysis.md)
- [Sprint 10 Completion Report](/docs/sprints/sprint-10-completion-report.md)
- [TipTap Table Extension Docs](https://tiptap.dev/docs/editor/api/extensions/table)

---

**Task Breakdown Status:** ✅ COMPLETE
**Ready for Swarm Execution:** YES
**Estimated Completion Date:** TBD (based on swarm start date)
**Orchestrator Sign-off:** Task Orchestrator Agent (2025-10-12)
