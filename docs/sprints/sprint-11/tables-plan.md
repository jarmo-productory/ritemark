# Sprint 11: Tables Support - Execution Plan

**Date:** October 11, 2025
**Status:** 📋 READY FOR EXECUTION
**Estimated Duration:** 12-16 hours
**Dependencies:** Sprint 10 (BubbleMenu) ✅ COMPLETE

---

## 🎯 Sprint Goal

**"Enable users to create, edit, and format tables in the WYSIWYG editor with full markdown conversion support."**

---

## 📊 Sprint Overview

### What's Included (In Scope)
- ✅ Table insertion via toolbar button
- ✅ Row and column management (add, delete)
- ✅ Cell merging and splitting
- ✅ Header row formatting
- ✅ Table resizing (column widths)
- ✅ Keyboard navigation (Tab, Shift+Tab, Arrow keys)
- ✅ HTML-to-Markdown conversion (Turndown plugin)
- ✅ Markdown-to-HTML parsing (GFM tables)
- ✅ Comprehensive tests (40+ test cases)
- ✅ Documentation (developer + user guides)

### What's Excluded (Out of Scope)
- ❌ Advanced table features (nested tables, rowspan/colspan > 2)
- ❌ Table styling (borders, colors, padding)
- ❌ Cell alignment (left, center, right) - **deferred to Sprint 13**
- ❌ Table sorting and filtering
- ❌ CSV import/export
- ❌ Table templates or presets

### Success Criteria
1. **User can insert a table** via toolbar button (row/col picker UI)
2. **User can add/delete rows and columns** with keyboard shortcuts or context menu
3. **User can merge cells** for complex table layouts
4. **Tables convert correctly** to/from markdown (GFM format)
5. **All automated tests pass** (40+ tests, 100% pass rate)
6. **Browser validation succeeds** (no console errors, visual rendering correct)

---

## 📐 Technical Architecture

### TipTap Extensions Required
```json
{
  "@tiptap/extension-table": "^3.4.3",
  "@tiptap/extension-table-row": "^3.4.3",
  "@tiptap/extension-table-cell": "^3.4.3",
  "@tiptap/extension-table-header": "^3.4.3"
}
```

### Turndown Plugin
**Custom Rule:** Convert `<table>` → GFM markdown table format
```javascript
turndownService.addRule('table', {
  filter: 'table',
  replacement: (content, node) => {
    // Parse <table> DOM → GFM markdown table
    // Handle headers, alignment, merged cells
  }
})
```

### Markdown Parsing
**marked.js GFM Extension:** Parse markdown tables → HTML
```javascript
import { marked } from 'marked'
import { gfmTables } from 'marked-gfm-tables' // If needed

marked.use({ extensions: [gfmTables] })
```

---

## 🔄 Phase Breakdown (6 Phases)

### **Phase 1: Install TipTap Table Extensions** (1 hour)
**Goal:** Add table dependencies and configure editor

**Tasks:**
1. Install TipTap table extensions via npm
2. Import Table, TableRow, TableCell, TableHeader extensions
3. Configure extensions in Editor.tsx
4. Add basic table CSS styling
5. Verify dev server compiles without errors
6. Test table insertion (manual smoke test)

**Success Criteria:**
- ✅ `npm run type-check` passes
- ✅ Dev server runs on localhost:5173
- ✅ Can manually insert table via `editor.commands.insertTable()`

**Risks:**
- ⚠️ Extension version conflicts with existing TipTap packages
- **Mitigation:** Use exact versions matching current `@tiptap/react` (v3.4.3)

---

### **Phase 2: Table Toolbar Button** (2 hours)
**Goal:** Add table insertion button to toolbar with row/col picker

**Tasks:**
1. Create `TablePicker.tsx` component (row/col grid selector)
2. Add table button to main toolbar (next to File menu)
3. Implement popover UI for table size selection (e.g., 3x3 grid)
4. Wire button to `editor.commands.insertTable({ rows, cols })`
5. Add keyboard shortcut (Cmd+Shift+T)
6. Update toolbar tests

**Component Structure:**
```tsx
<TablePicker
  onSelect={(rows, cols) => editor.commands.insertTable({ rows, cols })}
/>
```

**Success Criteria:**
- ✅ Table button appears in toolbar
- ✅ Clicking button opens row/col picker
- ✅ Selecting size inserts table with correct dimensions
- ✅ Keyboard shortcut works (Cmd+Shift+T)

**Risks:**
- ⚠️ Popover positioning issues on mobile
- **Mitigation:** Use Radix UI Popover (consistent with BubbleMenu dialog pattern)

---

### **Phase 3: Table Context Menu (Add/Delete Rows/Columns)** (3 hours)
**Goal:** Enable row/column management via context menu or keyboard

**Tasks:**
1. Create `TableContextMenu.tsx` component (appears when cursor in table)
2. Add buttons:
   - Add Row Before
   - Add Row After
   - Delete Row
   - Add Column Before
   - Add Column After
   - Delete Column
   - Delete Table
3. Wire buttons to TipTap commands:
   - `addRowBefore()`, `addRowAfter()`, `deleteRow()`
   - `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`
   - `deleteTable()`
4. Add keyboard shortcuts:
   - `Cmd+Shift+↑` (add row before)
   - `Cmd+Shift+↓` (add row after)
   - `Cmd+Shift+←` (add column before)
   - `Cmd+Shift+→` (add column after)
5. Update context menu positioning logic

**Success Criteria:**
- ✅ Context menu appears when cursor is in table
- ✅ All row/column operations work correctly
- ✅ Keyboard shortcuts function as expected
- ✅ Menu hides when cursor leaves table

**Risks:**
- ⚠️ Context menu conflicts with BubbleMenu
- **Mitigation:** Use `shouldShow` prop to prioritize table menu over BubbleMenu

---

### **Phase 4: Cell Merging and Header Rows** (2 hours)
**Goal:** Support merged cells and header row formatting

**Tasks:**
1. Add merge/split buttons to table context menu:
   - Merge Cells (combine selected cells)
   - Split Cell (undo merge)
   - Toggle Header Row
2. Wire buttons to TipTap commands:
   - `mergeCells()`
   - `splitCell()`
   - `toggleHeaderRow()`
3. Add visual styling for header cells (bold, gray background)
4. Update table CSS for merged cells (colspan/rowspan)
5. Test edge cases (merge/split with different selections)

**Success Criteria:**
- ✅ User can merge selected cells
- ✅ User can split merged cells
- ✅ Header row has distinct styling
- ✅ Merged cells display correctly

**Risks:**
- ⚠️ Complex edge cases with nested merges
- **Mitigation:** Limit merging to simple cases (max 2x2 colspan/rowspan)

---

### **Phase 5: Markdown Conversion** (3 hours)
**Goal:** Convert tables to/from GFM markdown format

**Tasks:**
1. **Turndown Plugin (HTML → Markdown):**
   - Create custom `table` rule
   - Parse `<table>` DOM structure
   - Generate GFM markdown table format:
     ```markdown
     | Header 1 | Header 2 |
     |----------|----------|
     | Cell 1   | Cell 2   |
     ```
   - Handle merged cells (convert to multiple cells with duplicated content)
   - Handle header rows (add `---` separator)
2. **marked.js Extension (Markdown → HTML):**
   - Use GFM extension for table parsing
   - Ensure tables render with correct HTML structure
3. **Test conversion accuracy:**
   - Round-trip test (Markdown → HTML → Markdown)
   - Edge cases (empty cells, special characters, pipes `|`)
4. Update `Editor.tsx` with Turndown table rule

**Success Criteria:**
- ✅ Tables convert to markdown on save
- ✅ Markdown tables load correctly in editor
- ✅ Round-trip conversion preserves table structure
- ✅ Edge cases handled (empty cells, pipes)

**Risks:**
- ⚠️ Merged cells don't have direct markdown equivalent
- **Mitigation:** Duplicate cell content across merged cells in markdown (lossy but functional)
- ⚠️ Pipe characters `|` in cell content break parsing
- **Mitigation:** Escape pipes as `\|` in markdown

---

### **Phase 6: Testing and Documentation** (3 hours)
**Goal:** Write comprehensive tests and documentation

**Tasks:**
1. **Automated Tests** (`TableFeatures.test.tsx`):
   - Table insertion (3 tests)
   - Row operations (6 tests: add before/after, delete, keyboard shortcuts)
   - Column operations (6 tests: add before/after, delete, keyboard shortcuts)
   - Cell merging (4 tests: merge, split, edge cases)
   - Header rows (3 tests: toggle, styling, markdown conversion)
   - Keyboard navigation (5 tests: Tab, Shift+Tab, Arrow keys)
   - Markdown conversion (8 tests: round-trip, edge cases, GFM format)
   - Edge cases (5 tests: empty tables, single cell, large tables)
   - **Total: 40+ tests**
2. **Developer Documentation** (`docs/components/TableFeatures.md`):
   - API reference
   - Configuration options
   - Code examples
   - Troubleshooting
3. **User Documentation** (`docs/user-guide/tables.md`):
   - How to insert tables
   - How to add/delete rows/columns
   - How to merge cells
   - Keyboard shortcuts reference
4. **README updates:**
   - Add "Tables" to feature list
   - Link to table documentation

**Success Criteria:**
- ✅ 40+ tests written and passing (100% pass rate)
- ✅ Developer docs complete (500+ lines)
- ✅ User docs complete (300+ lines)
- ✅ All links working
- ✅ Browser validation passed (Chrome DevTools MCP)

**Risks:**
- ⚠️ Test flakiness with table DOM structure
- **Mitigation:** Use `waitFor()` for async updates, test with controlled editor instances

---

## 📋 Detailed Task List (50 Tasks)

### Phase 1: Install TipTap Table Extensions (6 tasks)
- [ ] **Task 1.1**: Install `@tiptap/extension-table` (npm install)
- [ ] **Task 1.2**: Install `@tiptap/extension-table-row`
- [ ] **Task 1.3**: Install `@tiptap/extension-table-cell`
- [ ] **Task 1.4**: Install `@tiptap/extension-table-header`
- [ ] **Task 1.5**: Import extensions in `Editor.tsx`
- [ ] **Task 1.6**: Configure extensions with default options (resizable: true)
- [ ] **Task 1.7**: Add basic table CSS styling in Editor.tsx
- [ ] **Task 1.8**: Verify TypeScript compilation (`npm run type-check`)
- [ ] **Task 1.9**: Start dev server and verify no errors
- [ ] **Task 1.10**: Manual smoke test: insert table via console

### Phase 2: Table Toolbar Button (10 tasks)
- [ ] **Task 2.1**: Create `src/components/TablePicker.tsx` component
- [ ] **Task 2.2**: Design row/col grid UI (Radix Popover with 5x5 grid)
- [ ] **Task 2.3**: Implement grid hover effect (highlight selected area)
- [ ] **Task 2.4**: Wire onSelect callback to insertTable command
- [ ] **Task 2.5**: Create Table button icon (Table2 from lucide-react)
- [ ] **Task 2.6**: Add table button to main toolbar (next to File menu)
- [ ] **Task 2.7**: Integrate TablePicker popover with button
- [ ] **Task 2.8**: Add keyboard shortcut (Cmd+Shift+T) in Editor.tsx
- [ ] **Task 2.9**: Test table insertion (3x3, 1x1, 5x5 tables)
- [ ] **Task 2.10**: Update toolbar tests to include table button

### Phase 3: Table Context Menu (12 tasks)
- [ ] **Task 3.1**: Create `src/components/TableContextMenu.tsx`
- [ ] **Task 3.2**: Add "Add Row Before" button with icon
- [ ] **Task 3.3**: Add "Add Row After" button
- [ ] **Task 3.4**: Add "Delete Row" button (destructive variant)
- [ ] **Task 3.5**: Add "Add Column Before" button
- [ ] **Task 3.6**: Add "Add Column After" button
- [ ] **Task 3.7**: Add "Delete Column" button (destructive variant)
- [ ] **Task 3.8**: Add "Delete Table" button (destructive variant)
- [ ] **Task 3.9**: Wire all buttons to TipTap commands
- [ ] **Task 3.10**: Implement shouldShow logic (only in table cells)
- [ ] **Task 3.11**: Add keyboard shortcuts in Editor.tsx handleKeyDown
- [ ] **Task 3.12**: Test context menu positioning and functionality

### Phase 4: Cell Merging and Headers (8 tasks)
- [ ] **Task 4.1**: Add "Merge Cells" button to context menu
- [ ] **Task 4.2**: Add "Split Cell" button to context menu
- [ ] **Task 4.3**: Add "Toggle Header Row" button to context menu
- [ ] **Task 4.4**: Wire merge/split commands to TipTap API
- [ ] **Task 4.5**: Add CSS styling for header cells (bold, gray background)
- [ ] **Task 4.6**: Add CSS styling for merged cells (colspan/rowspan)
- [ ] **Task 4.7**: Test merge/split with various selections
- [ ] **Task 4.8**: Test header row toggle and styling

### Phase 5: Markdown Conversion (10 tasks)
- [ ] **Task 5.1**: Create Turndown table rule (HTML → Markdown)
- [ ] **Task 5.2**: Implement table DOM parser (extract rows/cells)
- [ ] **Task 5.3**: Generate GFM markdown table format
- [ ] **Task 5.4**: Handle header rows (add `---` separator)
- [ ] **Task 5.5**: Handle merged cells (duplicate content strategy)
- [ ] **Task 5.6**: Escape pipe characters `|` in cell content
- [ ] **Task 5.7**: Configure marked.js GFM extension for table parsing
- [ ] **Task 5.8**: Test round-trip conversion (Markdown → HTML → Markdown)
- [ ] **Task 5.9**: Test edge cases (empty cells, special characters)
- [ ] **Task 5.10**: Integrate table rule into Editor.tsx turndownService

### Phase 6: Testing and Documentation (14 tasks)
- [ ] **Task 6.1**: Create `tests/components/TableFeatures.test.tsx`
- [ ] **Task 6.2**: Write table insertion tests (3 tests)
- [ ] **Task 6.3**: Write row operation tests (6 tests)
- [ ] **Task 6.4**: Write column operation tests (6 tests)
- [ ] **Task 6.5**: Write cell merging tests (4 tests)
- [ ] **Task 6.6**: Write header row tests (3 tests)
- [ ] **Task 6.7**: Write keyboard navigation tests (5 tests)
- [ ] **Task 6.8**: Write markdown conversion tests (8 tests)
- [ ] **Task 6.9**: Write edge case tests (5 tests)
- [ ] **Task 6.10**: Run all tests and verify 100% pass rate
- [ ] **Task 6.11**: Create `docs/components/TableFeatures.md` (developer docs)
- [ ] **Task 6.12**: Create `docs/user-guide/tables.md` (user guide)
- [ ] **Task 6.13**: Update README with table features
- [ ] **Task 6.14**: Browser validation via Chrome DevTools MCP

---

## 🚨 Risk Assessment & Mitigation

### High-Risk Areas

#### 1. **Markdown Conversion Complexity** (High Risk)
**Issue:** GFM tables have limited formatting (no merged cells, basic alignment)
**Impact:** Users may lose formatting when saving to markdown
**Mitigation:**
- Document limitations clearly in user guide
- Implement "best-effort" conversion (duplicate content for merged cells)
- Show warning if complex table features used
- Consider adding HTML table fallback option

#### 2. **Browser Compatibility** (Medium Risk)
**Issue:** Table rendering may differ across browsers (Safari vs. Chrome)
**Impact:** Visual inconsistencies, layout issues
**Mitigation:**
- Test on Chrome, Safari, Firefox (via Chrome DevTools MCP if available)
- Use standard HTML table elements (no custom layouts)
- Add CSS resets for table elements

#### 3. **Performance with Large Tables** (Medium Risk)
**Issue:** Tables with 100+ cells may cause editor lag
**Impact:** Poor user experience, slow typing
**Mitigation:**
- Add table size validation (warn if > 20x20 cells)
- Implement virtualization if needed (future optimization)
- Profile editor performance with large tables

### Low-Risk Areas
- ✅ TipTap table extensions are mature and stable
- ✅ Table insertion UI is simple (row/col picker)
- ✅ Context menu pattern already proven in Sprint 10 (BubbleMenu)

---

## 🎯 Definition of Done

Sprint 11 is **COMPLETE** when:
1. ✅ All 50 tasks checked off
2. ✅ All automated tests passing (40+ tests, 100% pass rate)
3. ✅ `npm run type-check` passes (zero TypeScript errors)
4. ✅ `npm run lint` passes (zero errors in Sprint 11 code)
5. ✅ Dev server runs without errors on localhost:5173
6. ✅ Browser validation completed (Chrome DevTools MCP or manual)
7. ✅ Documentation complete (developer + user guides)
8. ✅ User can insert, edit, and format tables successfully
9. ✅ Tables convert correctly to/from markdown
10. ✅ Code reviewed and approved for merge

---

## 📊 Sprint Metrics (Estimated)

| Metric | Target |
|--------|--------|
| **Total Tasks** | 50 tasks |
| **New Files** | 4-5 files (TablePicker, TableContextMenu, tests, docs) |
| **Lines of Code** | ~800 lines (components + tests) |
| **Documentation** | ~800 lines (developer + user docs) |
| **Tests** | 40+ tests |
| **Dependencies Added** | 4 packages (TipTap table extensions) |
| **Bundle Size Impact** | ~20KB gzipped (table extensions) |
| **Estimated Time** | 12-16 hours |

---

## 🔗 Related Documentation

- [TipTap Table Extension](https://tiptap.dev/docs/editor/api/extensions/table)
- [GFM Table Specification](https://github.github.com/gfm/#tables-extension-)
- [Sprint 10 Completion Report](./sprint-10-completion-report.md)
- [Turndown Documentation](https://github.com/mixmark-io/turndown)

---

## 📝 Next Steps After Sprint 11

**Sprint 12: Images** will include:
- Image insertion and upload
- Google Drive image storage
- Image resizing and positioning
- Alt text and captions
- Lazy loading optimization

**Future Enhancements (Post-Sprint 12):**
- Table cell alignment (left, center, right)
- Table borders and styling
- CSV import/export
- Table sorting

---

**Sprint 11 Status:** 📋 READY FOR EXECUTION
**Approval Required:** YES (user confirmation before starting)
**Estimated Start Date:** TBD (after user approval)
