# Sprint 11: Tables Support Research - RiteMark

**Date:** October 11, 2025
**Researcher:** Research Agent
**Status:** Research Complete - Ready for Planning Phase

---

## Executive Summary

This research document provides a comprehensive technical specification for adding table support to RiteMark's WYSIWYG markdown editor. Tables are a critical feature for content creators working with structured data, and this implementation will maintain RiteMark's philosophy of visual editing while generating clean markdown output.

**Key Findings:**
- TipTap's TableKit extension (v3.6.6) provides complete table functionality compatible with our current TipTap 3.4.3 setup
- Minimal bundle size impact (~50-60 files, dependencies already in use)
- GFM (GitHub Flavored Markdown) table syntax fully supported via turndown-plugin-gfm
- Mobile table editing requires special UX considerations for touch interactions
- Two viable insertion methods: BubbleMenu button vs. dedicated toolbar button

---

## 1. Technical Dependencies Analysis

### 1.1 TipTap Table Extensions

**Available Extensions:**
```bash
npm install @tiptap/extension-table@3.6.6
```

**What's Included in TableKit:**
- `Table` - Main table node
- `TableRow` - Row container
- `TableCell` - Standard cell
- `TableHeader` - Header cell (for first row/column)

**Peer Dependencies (Already Installed):**
- `@tiptap/core@^3.6.6` ✅ (We have 3.4.3 core via starter-kit)
- `@tiptap/pm@^3.6.6` ✅ (ProseMirror - included in TipTap)

**Version Compatibility:**
- ✅ Compatible with TipTap 3.4.3 (we're using 3.4.3 for most extensions)
- ⚠️ TableKit is v3.6.6 (newer minor version, backward compatible)
- ✅ No breaking changes between 3.4.x and 3.6.x

### 1.2 Bundle Size Impact

**Package Analysis:**
- Extension package: ~58 files
- Estimated minified size: ~15-25KB (based on similar TipTap extensions)
- Gzipped: ~5-8KB (estimated)
- Dependencies: Only @tiptap/core and @tiptap/pm (already in use)

**Current RiteMark Bundle Context:**
```json
Current TipTap Extensions in Use:
- @tiptap/starter-kit: ~80KB
- @tiptap/extension-link: ~8KB
- @tiptap/extension-code-block-lowlight: ~12KB + lowlight (~45KB)
- @tiptap/extension-bubble-menu: ~5KB

Adding TableKit: +15-25KB minified (~5-8KB gzipped)
Total Bundle Impact: < 1% increase (acceptable)
```

### 1.3 Markdown Serialization Requirements

**Current Setup:**
- Using `turndown@7.2.1` for HTML → Markdown conversion
- Using `marked@16.4.0` for Markdown → HTML parsing

**Required Addition for Tables:**
```bash
npm install turndown-plugin-gfm
```

**Alternative Options:**
1. **turndown-plugin-gfm** (Official plugin)
   - Standard GFM table conversion
   - Simple integration
   - Tested and stable

2. **@joplin/turndown-plugin-gfm** (Joplin fork)
   - Better multi-line cell handling
   - Replaces `\n` with `<br>` in cells
   - Always renders tables (even without headers)

3. **@truto/turndown-plugin-gfm** (Performance fork)
   - 20x faster conversion (13s → 600ms)
   - Optimized for large documents
   - Best for performance-critical applications

**Recommendation:** Start with official `turndown-plugin-gfm`, upgrade to `@truto/turndown-plugin-gfm` if performance issues arise.

---

## 2. Feature Requirements (User Stories)

### 2.1 Core Table Features

**US-11.1: Insert Table**
```
As a content creator
I want to insert a table with a specific number of rows and columns
So that I can organize structured data in my document

Acceptance Criteria:
- User can trigger table insertion via button (initially) or slash command (future)
- Default table size: 3 rows × 3 columns (with header row)
- User can customize size via dropdown/picker (2-10 rows/cols)
- Table inserts at cursor position
- First row is automatically set as header row
```

**US-11.2: Edit Table Content**
```
As a user
I want to type and format text inside table cells
So that I can add content to my table

Acceptance Criteria:
- Click any cell to focus and type
- Tab key moves to next cell (Shift+Tab moves backward)
- Enter key creates new line within cell (not new row)
- Bold, Italic, Links work inside cells
- Text wraps naturally within cell boundaries
```

**US-11.3: Add/Delete Rows and Columns**
```
As a user
I want to add or remove rows and columns
So that I can adjust my table structure as needed

Acceptance Criteria:
- Right-click context menu shows row/column options
- "Add row above" / "Add row below" commands
- "Add column left" / "Add column right" commands
- "Delete row" / "Delete column" commands
- "Delete table" command
- Keyboard shortcuts for common operations
```

**US-11.4: Table Headers**
```
As a user
I want to designate header rows or columns
So that my table has clear labels

Acceptance Criteria:
- First row is header by default
- Toggle header row on/off
- Toggle first column as header column
- Headers have distinct visual styling (bold + background)
- Headers export correctly to markdown
```

**US-11.5: Cell Alignment**
```
As a user
I want to align text within cells
So that numbers and text are properly formatted

Acceptance Criteria:
- Left align (default)
- Center align
- Right align
- Alignment persists in markdown export
- Visual indicator of alignment in editor
```

### 2.2 Advanced Features (Phase 2)

**US-11.6: Merge/Split Cells**
```
As a user
I want to merge adjacent cells or split merged cells
So that I can create complex table layouts

Acceptance Criteria:
- Select multiple cells (drag or shift+arrow)
- "Merge cells" command combines into single cell
- "Split cell" command restores original cells
- Merged cells span correctly in export
```

**US-11.7: Resize Columns**
```
As a user
I want to drag column borders to resize widths
So that I can fit content appropriately

Acceptance Criteria:
- Hover over column border shows resize cursor
- Drag to adjust width
- Column widths persist (stored in editor state)
- Responsive behavior on mobile (Phase 2)
```

---

## 3. Technical Architecture

### 3.1 Component Structure

```
src/components/
├── Editor.tsx (Updated)
│   └── Add TableKit extension
├── FormattingBubbleMenu.tsx (Updated)
│   └── Add table button (if using BubbleMenu approach)
├── TableToolbar.tsx (New - Alternative Approach)
│   ├── TableInsertButton (w/ size picker dropdown)
│   ├── TableRowButtons (add/delete)
│   ├── TableColumnButtons (add/delete)
│   ├── TableCellButtons (merge/split)
│   └── TableAlignmentButtons (left/center/right)
└── TableContextMenu.tsx (New - Phase 2)
    └── Right-click menu for table operations
```

### 3.2 Editor.tsx Integration

**Current Extensions:**
```typescript
import StarterKit from '@tiptap/starter-kit'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
```

**Proposed Addition:**
```typescript
import TableKit from '@tiptap/extension-table' // TableKit includes all table extensions

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // ... existing config
    }),
    // ... other extensions
    TableKit.configure({
      resizable: false, // Phase 1: no column resizing (simpler UX)
      HTMLAttributes: {
        class: 'tiptap-table',
      },
      table: {
        HTMLAttributes: {
          class: 'tiptap-table-node',
        },
      },
      tableRow: {
        HTMLAttributes: {
          class: 'tiptap-table-row',
        },
      },
      tableCell: {
        HTMLAttributes: {
          class: 'tiptap-table-cell',
        },
      },
      tableHeader: {
        HTMLAttributes: {
          class: 'tiptap-table-header',
        },
      },
    }),
  ],
  // ... rest of config
})
```

### 3.3 Markdown Conversion (Turndown Integration)

**Current Turndown Setup (Editor.tsx line 15-21):**
```typescript
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**'
})
```

**Proposed Update with GFM Tables:**
```typescript
import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm' // Add GFM table support

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**'
})

// Enable GFM table conversion
turndownService.use(tables)

// Now tables will convert to markdown:
// <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>
// →
// | Header |
// | ------ |
// | Cell   |
```

**Markdown → HTML (marked.js already supports GFM tables):**
```typescript
import { marked } from 'marked'

// marked.js natively supports GFM tables (no extra config needed)
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown (already enabled in RiteMark)
  breaks: true,
})

// This already works:
// | Header |
// | ------ |
// | Cell   |
// →
// <table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>
```

### 3.4 CSS Styling

**Proposed Table Styles (Add to Editor.tsx inline `<style>` block):**
```css
/* Table container */
.wysiwyg-editor .ProseMirror table.tiptap-table-node {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1em 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* Table cells */
.wysiwyg-editor .ProseMirror td.tiptap-table-cell,
.wysiwyg-editor .ProseMirror th.tiptap-table-header {
  min-width: 1em;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

/* Header cells */
.wysiwyg-editor .ProseMirror th.tiptap-table-header {
  font-weight: 600;
  text-align: left;
  background-color: #f9fafb;
  color: #111827;
}

/* Row hover effect */
.wysiwyg-editor .ProseMirror tr:hover td,
.wysiwyg-editor .ProseMirror tr:hover th {
  background-color: rgba(59, 130, 246, 0.05);
}

/* Selected cell */
.wysiwyg-editor .ProseMirror .selectedCell:after {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror table.tiptap-table-node {
    font-size: 14px;
  }

  .wysiwyg-editor .ProseMirror td.tiptap-table-cell,
  .wysiwyg-editor .ProseMirror th.tiptap-table-header {
    padding: 0.4rem 0.6rem;
  }
}
```

---

## 4. UX Design & Interaction Patterns

### 4.1 Table Insertion Methods (Two Approaches)

#### **Option A: Dedicated Table Button (Recommended for Phase 1)**

**Pros:**
- Clear and discoverable for users
- Dedicated space for table size picker
- Doesn't clutter BubbleMenu
- Always accessible (no text selection needed)

**Cons:**
- Requires new toolbar component
- More UI elements on screen

**Implementation:**
```tsx
// New component: src/components/TableToolbar.tsx
<div className="table-toolbar">
  <Button
    onClick={() => setShowTablePicker(true)}
    title="Insert Table"
  >
    <TableIcon /> Insert Table
  </Button>

  {/* Dropdown: Grid picker (3x3 default, up to 10x10) */}
  {showTablePicker && (
    <TableSizePicker
      onSelect={(rows, cols) => {
        editor.chain().focus()
          .insertTable({ rows, cols, withHeaderRow: true })
          .run()
      }}
    />
  )}
</div>
```

**Placement:** Fixed toolbar above editor (similar to Google Docs position)

#### **Option B: BubbleMenu Button (Alternative)**

**Pros:**
- Integrates with existing formatting menu
- No new UI elements needed
- Familiar pattern (follows Bold, Italic, etc.)

**Cons:**
- Only appears on text selection (less discoverable)
- BubbleMenu may become cluttered
- Harder to add table size picker UI

**Implementation:**
```tsx
// Update FormattingBubbleMenu.tsx
<button
  onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
  className="px-3 py-1 rounded hover:bg-gray-100"
  title="Insert Table (3×3)"
>
  <TableIcon size={16} />
</button>
```

**Recommendation:** Start with **Option A (Dedicated Button)** for better UX, then consider slash commands in future sprint.

### 4.2 Table Interaction Patterns

#### **Keyboard Navigation:**
```
Tab           → Move to next cell (creates new row if at last cell)
Shift+Tab     → Move to previous cell
Enter         → New line within cell (Cmd+Enter creates new row below)
Arrow Keys    → Navigate between cells when cell is empty
Cmd+Delete    → Delete current row
Cmd+Shift+Delete → Delete current column
```

#### **Mouse Interactions:**
- **Click cell** → Focus and edit
- **Right-click row** → Show row options (add/delete)
- **Right-click column** → Show column options (add/delete)
- **Hover column border** → Show resize handle (Phase 2)

#### **Touch Interactions (Mobile):**
- **Tap cell** → Focus with on-screen keyboard
- **Long-press cell** → Show context menu (add/delete options)
- **Double-tap cell** → Select cell (for merge operations - Phase 2)
- **Swipe table horizontally** → Scroll wide tables (overflow-x: auto)

### 4.3 Mobile UX Considerations

**Challenges:**
1. Small screen width → Tables may overflow
2. Touch targets must be large enough (min 44x44px)
3. Context menus harder to trigger
4. Column resizing difficult on touch

**Solutions:**
```css
/* Mobile table wrapper with horizontal scroll */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror table.tiptap-table-node {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Increase touch target size for cells */
  .wysiwyg-editor .ProseMirror td.tiptap-table-cell,
  .wysiwyg-editor .ProseMirror th.tiptap-table-header {
    min-width: 100px; /* Prevent cells from being too narrow */
    padding: 0.5rem; /* Larger touch area */
  }
}
```

**Mobile Table Menu (Floating Action Button):**
- FAB at bottom-right when table is focused
- Shows: Add Row, Add Column, Delete Table
- Replaces context menu for mobile users

### 4.4 Visual Design (Following RiteMark's Aesthetic)

**Design Principles:**
- Minimal borders (use subtle gray #e5e7eb)
- Clean typography (inherit from editor styles)
- Subtle hover effects (light blue tint)
- Header rows with light background (#f9fafb)
- Rounded corners on table container (8px)

**Inspiration from Best Practices:**
- **Notion:** Clean lines, subtle hover, minimal chrome
- **Google Docs:** Clear cell selection, simple borders
- **GitHub Markdown:** Clean GFM table rendering

---

## 5. Implementation Plan (Phased Approach)

### **Phase 1: Core Table Functionality** (Sprint 11)
**Estimated Effort:** 3-5 days

**Tasks:**
1. **Setup & Dependencies** (0.5 day)
   - Install `@tiptap/extension-table@3.6.6`
   - Install `turndown-plugin-gfm`
   - Update package.json peer dependencies

2. **Editor Integration** (1 day)
   - Add TableKit to Editor.tsx extensions
   - Configure table extensions with proper CSS classes
   - Add table styling to inline `<style>` block

3. **Markdown Conversion** (0.5 day)
   - Integrate turndown-plugin-gfm for HTML → Markdown
   - Test marked.js GFM table parsing (already works)
   - Verify round-trip conversion (edit → save → load)

4. **Table Insertion UI** (1 day)
   - Create TableInsertButton component
   - Build TableSizePicker dropdown (3x3 default, up to 10x10)
   - Add table button to toolbar/menu

5. **Basic Table Operations** (1 day)
   - Add Row Above/Below buttons
   - Add Column Left/Right buttons
   - Delete Row/Column buttons
   - Delete Table button
   - Wire up TipTap commands

6. **Testing & QA** (1 day)
   - Unit tests for table operations
   - Integration tests for markdown conversion
   - Manual testing on desktop and mobile
   - Test with Google Drive sync

**Deliverables:**
- ✅ Users can insert tables (3x3 default)
- ✅ Users can add/delete rows and columns
- ✅ Users can type and format text in cells
- ✅ Tables convert to/from GFM markdown
- ✅ Tables work on mobile (horizontal scroll)

### **Phase 2: Advanced Features** (Sprint 12 - Future)
**Estimated Effort:** 2-3 days

**Tasks:**
1. **Cell Merge/Split** (1 day)
   - Implement mergeCells command
   - Implement splitCell command
   - Add merge/split buttons

2. **Column Resizing** (1 day)
   - Enable `resizable: true` in TableKit config
   - Add resize handles styling
   - Test on mobile (disable resize on touch devices)

3. **Cell Alignment** (0.5 day)
   - Add alignment buttons (left/center/right)
   - Apply alignment via setCellAttribute command
   - Ensure alignment exports to markdown

4. **Context Menu** (0.5 day)
   - Right-click menu for table operations
   - Mobile long-press menu alternative

**Deliverables:**
- ✅ Merge and split cells
- ✅ Resize columns with drag handles
- ✅ Align cell content (left/center/right)
- ✅ Right-click context menu

### **Phase 3: Slash Commands** (Sprint 13 - Future)
**Estimated Effort:** 1-2 days

**Tasks:**
1. Install TipTap Slash Commands extension
2. Add `/table` command to insert default 3x3 table
3. Add `/table [rows]x[cols]` for custom sizes
4. Add other slash commands (e.g., `/code`, `/heading`)

**Deliverables:**
- ✅ Type `/table` to insert table
- ✅ Type `/table 5x4` to insert 5-row, 4-column table
- ✅ Unified slash command system for all insertions

---

## 6. Risk Assessment

### 6.1 Technical Risks

**Risk 1: TipTap Version Compatibility**
- **Severity:** Medium
- **Probability:** Low
- **Mitigation:** TipTap 3.4.x → 3.6.x has no breaking changes (minor version bump)
- **Fallback:** If issues arise, pin TableKit to older version or upgrade all TipTap extensions to 3.6.x

**Risk 2: Bundle Size Increase**
- **Severity:** Low
- **Probability:** Low
- **Impact:** +15-25KB minified (~5-8KB gzipped)
- **Mitigation:** Acceptable for feature value; can optimize later with code splitting

**Risk 3: Markdown Conversion Edge Cases**
- **Severity:** Medium
- **Probability:** Medium
- **Examples:**
  - Multi-line content in cells (GFM doesn't support true multi-line)
  - Nested formatting (bold links in cells)
  - Merged cells (not supported in GFM)
- **Mitigation:**
  - Use `@joplin/turndown-plugin-gfm` for better multi-line handling (replaces `\n` with `<br>`)
  - Document limitations in user guide
  - Store original HTML in metadata if needed

**Risk 4: Mobile Table Editing UX**
- **Severity:** High
- **Probability:** Medium
- **Challenge:** Small screens + complex table operations = poor UX
- **Mitigation:**
  - Horizontal scroll for wide tables
  - Floating action button for mobile table menu
  - Simplified mobile UI (hide advanced features)
  - Consider "detail view" for editing cells on mobile (Phase 2)

### 6.2 UX Risks

**Risk 5: Feature Discoverability**
- **Severity:** Medium
- **Probability:** High
- **Issue:** Users may not notice table button in toolbar
- **Mitigation:**
  - Prominent placement of table button
  - Onboarding tooltip: "Try inserting a table!"
  - Future: Slash commands for quicker access

**Risk 6: Keyboard Shortcut Conflicts**
- **Severity:** Low
- **Probability:** Low
- **Issue:** Tab key used for both indentation and table navigation
- **Mitigation:** TipTap handles this automatically (Tab = next cell when inside table)

### 6.3 Performance Risks

**Risk 7: Large Tables Performance**
- **Severity:** Medium
- **Probability:** Low
- **Issue:** Tables with 50+ rows may cause editor lag
- **Mitigation:**
  - Optimize CSS (avoid expensive selectors)
  - Virtual scrolling for large tables (Phase 3)
  - Warn users about table size limits (e.g., "Tables over 100 cells may slow editor")

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Suite: `tests/components/TableOperations.test.tsx`**
```typescript
describe('Table Operations', () => {
  it('should insert table with default size (3x3)', () => {
    // Test insertTable command
  })

  it('should add row above current row', () => {
    // Test addRowBefore command
  })

  it('should add column after current column', () => {
    // Test addColumnAfter command
  })

  it('should delete row', () => {
    // Test deleteRow command
  })

  it('should delete entire table', () => {
    // Test deleteTable command
  })

  it('should toggle header row', () => {
    // Test toggleHeaderRow command
  })
})
```

### 7.2 Integration Tests

**Test Suite: `tests/integration/TableMarkdownConversion.test.tsx`**
```typescript
describe('Table Markdown Conversion', () => {
  it('should convert HTML table to GFM markdown', () => {
    const html = '<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>'
    const markdown = turndownService.turndown(html)
    expect(markdown).toContain('| Header |')
    expect(markdown).toContain('| ------ |')
    expect(markdown).toContain('| Cell   |')
  })

  it('should parse GFM markdown to HTML table', () => {
    const markdown = '| Header |\n| ------ |\n| Cell   |'
    const html = marked(markdown)
    expect(html).toContain('<table>')
    expect(html).toContain('<th>Header</th>')
    expect(html).toContain('<td>Cell</td>')
  })

  it('should handle round-trip conversion', () => {
    // Test: markdown → HTML → markdown → HTML (should be identical)
  })
})
```

### 7.3 Manual Testing Checklist

**Desktop Testing:**
- [ ] Insert table via button
- [ ] Type in cells and format text (bold, italic, links)
- [ ] Navigate with Tab/Shift+Tab
- [ ] Add row above/below
- [ ] Add column left/right
- [ ] Delete row/column/table
- [ ] Toggle header row
- [ ] Save document and verify markdown output
- [ ] Load document with table and verify rendering

**Mobile Testing:**
- [ ] Insert table on mobile browser
- [ ] Tap cell to edit
- [ ] Scroll wide table horizontally
- [ ] Long-press cell for context menu
- [ ] Add row/column via FAB menu
- [ ] Test on iOS Safari and Android Chrome

**Google Drive Integration:**
- [ ] Create document with table and save to Drive
- [ ] Load document with table from Drive
- [ ] Edit table and verify auto-save works
- [ ] Check markdown file in Drive (should show GFM table syntax)

---

## 8. Open Questions & Future Considerations

### 8.1 Open Questions for Planning Phase

**Q1: Should we start with BubbleMenu button or dedicated toolbar?**
- **Recommendation:** Dedicated toolbar for better discoverability (Option A)

**Q2: Do we need column resizing in Phase 1?**
- **Recommendation:** No, defer to Phase 2 (simpler UX for MVP)

**Q3: What's the maximum table size we should support?**
- **Recommendation:** 10×10 via UI picker, no hard limit (warn users about performance)

**Q4: Should we implement slash commands in Sprint 11?**
- **Recommendation:** No, focus on core table functionality first (defer to Sprint 13)

### 8.2 Future Enhancements (Beyond Sprint 13)

**Table Templates:**
- Pre-defined table styles (e.g., "Product Comparison", "Pricing Table")
- One-click insert with dummy data

**CSV Import/Export:**
- Import CSV files as tables
- Export tables to CSV for use in spreadsheets

**Table Formulas (Advanced):**
- Basic calculations (SUM, AVG) for numeric columns
- Similar to Notion's database calculations

**Collaborative Table Editing:**
- Real-time cursor positions in cells
- Conflict resolution for simultaneous edits

---

## 9. Conclusion & Next Steps

### 9.1 Summary

Tables are a critical feature for content creators, and TipTap's TableKit extension provides a robust, production-ready solution that integrates seamlessly with RiteMark's existing architecture. The implementation is low-risk with minimal bundle size impact and full markdown compatibility.

**Key Strengths:**
- ✅ Mature extension (TipTap 3.6.6 - actively maintained)
- ✅ Minimal dependencies (only @tiptap/core and @tiptap/pm)
- ✅ Full GFM markdown support via turndown-plugin-gfm
- ✅ Mobile-friendly with horizontal scroll
- ✅ Clean, minimal UI matches RiteMark aesthetic

**Key Challenges:**
- ⚠️ Mobile UX requires special attention (touch targets, context menus)
- ⚠️ Markdown edge cases (multi-line cells, merged cells)
- ⚠️ Large tables may impact performance (need monitoring)

### 9.2 Recommended Next Steps

1. **Sprint Planning Meeting** (1 hour)
   - Review this research document
   - Prioritize Phase 1 tasks
   - Assign tasks to team members
   - Set sprint goals and timeline

2. **Technical Spike** (0.5 day)
   - Install TableKit and turndown-plugin-gfm
   - Build minimal proof-of-concept
   - Test markdown conversion round-trip
   - Verify mobile rendering

3. **Begin Sprint 11 Implementation** (3-5 days)
   - Follow Phase 1 implementation plan
   - Daily standups to track progress
   - Mid-sprint demo to stakeholders

4. **Sprint Review & Retrospective**
   - Demo table functionality
   - Gather user feedback
   - Plan Phase 2 enhancements for Sprint 12

### 9.3 Success Criteria

Sprint 11 will be considered successful if:
- ✅ Users can insert, edit, and delete tables
- ✅ Tables convert to/from GFM markdown correctly
- ✅ Tables work on desktop and mobile browsers
- ✅ Table feature is discoverable (via toolbar button)
- ✅ Zero regressions in existing editor functionality
- ✅ Documentation updated (user guide + developer docs)

---

## Appendices

### Appendix A: TipTap Table Commands Reference

```typescript
// Insert table
editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })

// Add rows
editor.commands.addRowBefore()
editor.commands.addRowAfter()

// Add columns
editor.commands.addColumnBefore()
editor.commands.addColumnAfter()

// Delete
editor.commands.deleteRow()
editor.commands.deleteColumn()
editor.commands.deleteTable()

// Headers
editor.commands.toggleHeaderRow()
editor.commands.toggleHeaderColumn()
editor.commands.toggleHeaderCell()

// Navigation
editor.commands.goToNextCell()
editor.commands.goToPreviousCell()

// Merge/Split (Phase 2)
editor.commands.mergeCells()
editor.commands.splitCell()

// Cell attributes (Phase 2)
editor.commands.setCellAttribute('backgroundColor', '#f0f0f0')
editor.commands.setCellAttribute('textAlign', 'center')

// Utility
editor.commands.fixTables() // Auto-repair malformed tables
```

### Appendix B: GFM Table Markdown Syntax

**Basic Table:**
```markdown
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

**With Alignment:**
```markdown
| Left | Center | Right |
| :--- | :----: | ----: |
| A    | B      | C     |
```

**Alignment Syntax:**
- `:---` = Left align (default)
- `:---:` = Center align
- `---:` = Right align

**Limitations:**
- No cell spanning (rowspan/colspan)
- No multi-line cells (use `<br>` as workaround)
- No nested tables
- No cell background colors (HTML extension)

### Appendix C: Competitor Analysis

**Notion:**
- Slash command `/table` for insertion
- Inline database with filters/sorting
- Drag handles for row/column reorder
- No markdown export (proprietary format)

**Google Docs:**
- Insert > Table menu
- Fixed toolbar with table controls
- Right-click context menu for operations
- No markdown export

**Obsidian:**
- Manual markdown table syntax
- Some plugins provide visual table editors
- Full markdown compatibility
- No WYSIWYG by default

**GitHub:**
- Raw markdown editing only
- Preview shows rendered GFM tables
- No visual editor

**RiteMark's Advantage:**
- WYSIWYG editing + markdown output (best of both worlds)
- Google Drive integration for collaboration
- Mobile-first responsive design
- Clean, distraction-free interface

---

**Research Complete - Ready for Sprint 11 Planning Phase**

*This document provides all necessary information to begin implementation without additional research. Next step: Convert this into actionable sprint tasks.*
