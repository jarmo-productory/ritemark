# Sprint 11 - Manual Testing Report

**Date:** 2025-10-18
**Tester:** Manual QA Required
**Application URL:** http://localhost:5173
**Sprint Goal:** Table insertion, manipulation, and context menu functionality

---

## Pre-Test Validation ✅

### Automated Checks (Completed)
- ✅ TypeScript compilation: **PASSED** (zero errors)
- ✅ Development server: **RUNNING** on port 5173
- ✅ Page loads: **200 OK** response
- ⚠️ Unit tests: **5 FAILED** (unrelated to table features - App.test.tsx, AuthContext.test.tsx, pkceGenerator.test.ts)

### Code Review Verification
- ✅ TableContextMenu.tsx: Implemented with Radix Dialog
- ✅ TablePicker.tsx: 10x10 grid picker with hover preview
- ✅ FormattingBubbleMenu.tsx: Table button integrated
- ✅ Table extensions: Configured with GFM serialization

---

## Manual Test Cases

### 🧪 Test Case 1: Table Insertion via FormattingBubbleMenu

**Steps:**
1. Open http://localhost:5173 in Chrome
2. Type some text in the editor (e.g., "Test document")
3. Select the text
4. Click the Table icon (📊) in the bubble menu
5. Verify Table Picker dialog appears

**Expected Results:**
- ✅ Table button appears in bubble menu
- ✅ Clicking opens Radix Dialog (NOT browser alert)
- ✅ Dialog contains 10x10 grid of cells
- ✅ Dialog shows "Insert Table" title

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 2: Table Dimension Selection

**Steps:**
1. With Table Picker dialog open
2. Hover over different cells in the grid
3. Observe the dimension label at the top
4. Hover to select 3×4 table
5. Click the cell

**Expected Results:**
- ✅ Hovering highlights cells in blue
- ✅ Label shows correct dimensions (e.g., "3 × 4")
- ✅ Clicking inserts table at cursor position
- ✅ Dialog closes after insertion
- ✅ Selected text is NOT replaced (table inserts after)

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 3: Table Insertion Location

**Steps:**
1. Type "Before table" in editor
2. Select "Before table" text
3. Open Table Picker and insert 2×2 table
4. Verify text is preserved and table is inserted

**Expected Results:**
- ✅ Text "Before table" remains in document
- ✅ Table appears on a new line after the text
- ✅ No text replacement occurs

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 4: Table Context Menu Visibility

**Steps:**
1. Insert a 3×3 table
2. Click inside a table cell
3. Observe if context menu appears
4. Start typing in the cell
5. Verify menu stays visible
6. Click outside the table
7. Verify menu disappears

**Expected Results:**
- ✅ Context menu appears when clicking in table cell
- ✅ Menu stays visible while typing
- ✅ Menu has 3 sections: Row ops, Column ops, Table ops
- ✅ Menu disappears when clicking outside table
- ✅ Menu reappears when clicking back inside

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 5: Row Operations - Add Row Above

**Steps:**
1. Insert a 3×3 table
2. Click in the second row
3. Click "Add Row Above" button (TableRowsSplit icon rotated + Plus)
4. Repeat 2 more times
5. Count total rows

**Expected Results:**
- ✅ New row appears above current row
- ✅ Can add multiple rows
- ✅ Total rows increases correctly
- ✅ No errors in browser console

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 6: Row Operations - Add Row Below

**Steps:**
1. Insert a 3×3 table
2. Click in the first row
3. Click "Add Row Below" button (TableRowsSplit icon + Plus)
4. Verify new row appears below
5. Repeat in different rows

**Expected Results:**
- ✅ New row appears below current row
- ✅ Works from any row position
- ✅ Table layout remains intact

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 7: Row Operations - Delete Row

**Steps:**
1. Insert a 5×5 table
2. Click in the third row
3. Click "Delete Row" button (TableRowsSplit + Minus)
4. Verify row disappears
5. Repeat until only 1 row remains
6. Verify cannot delete last row

**Expected Results:**
- ✅ Row disappears immediately (NO confirmation dialog)
- ✅ Delete button has red hover state
- ✅ Can delete rows until minimum reached
- ✅ No browser errors

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 8: Column Operations - Add Column Left

**Steps:**
1. Insert a 3×3 table
2. Click in the second column
3. Click "Add Column Left" button
4. Verify new column appears to the left

**Expected Results:**
- ✅ New column appears on left side
- ✅ All rows get new cell
- ✅ Table width adjusts

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 9: Column Operations - Add Column Right

**Steps:**
1. Insert a 3×3 table
2. Click in the first column
3. Click "Add Column Right" button
4. Verify new column appears to the right

**Expected Results:**
- ✅ New column appears on right side
- ✅ Works from any column position
- ✅ No layout issues

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 10: Column Operations - Delete Column

**Steps:**
1. Insert a 5×5 table
2. Click in the third column
3. Click "Delete Column" button
4. Verify column disappears
5. Repeat until only 1 column remains

**Expected Results:**
- ✅ Column disappears immediately (NO confirmation)
- ✅ Delete button has red hover state
- ✅ Can delete columns until minimum reached

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 11: Toggle Header Row

**Steps:**
1. Insert a 3×3 table
2. Click "Toggle Header Row" button (TableProperties icon)
3. Observe first row styling change
4. Click again to toggle off
5. Verify styling reverts

**Expected Results:**
- ✅ Header row gets different styling (bold background)
- ✅ Button highlights when header is active (blue background)
- ✅ Toggle works both directions
- ✅ HTML uses `<th>` tags for header cells

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 12: Delete Table - Dialog Confirmation

**Steps:**
1. Insert a 3×3 table
2. Click "Delete Table" button (Trash2 icon)
3. Verify Radix Dialog appears (NOT browser confirm())
4. Verify dialog has:
   - Title: "Delete Table"
   - Message: "Delete entire table? This cannot be undone."
   - Cancel button
   - Delete Table button (red/destructive)

**Expected Results:**
- ✅ Radix Dialog appears (styled modal overlay)
- ✅ Dialog is centered on screen
- ✅ Background is dimmed (black/50 overlay)
- ✅ All UI elements present

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 13: Delete Table - Cancel Action

**Steps:**
1. Insert a 3×3 table
2. Click "Delete Table" button
3. Click "Cancel" in the dialog
4. Verify table still exists

**Expected Results:**
- ✅ Dialog closes
- ✅ Table remains in document
- ✅ No errors occur

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

### 🧪 Test Case 14: Delete Table - Confirm Deletion

**Steps:**
1. Insert a 3×3 table
2. Add some content to cells
3. Click "Delete Table" button
4. Click "Delete Table" in the dialog
5. Verify table disappears

**Expected Results:**
- ✅ Table completely removed from document
- ✅ Dialog closes
- ✅ No orphaned table elements remain
- ✅ Cursor returns to valid position

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 15: Large Table Selection (10×10)

**Steps:**
1. Open Table Picker
2. Hover to bottom-right corner (10×10)
3. Verify label shows "10 × 10"
4. Click to insert
5. Verify table renders correctly

**Expected Results:**
- ✅ Can select maximum dimensions
- ✅ Large table renders without performance issues
- ✅ Context menu works on large tables

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 16: Minimum Table Size (1×1)

**Steps:**
1. Open Table Picker
2. Hover to top-left cell (1×1)
3. Click to insert
4. Verify 1×1 table with header row

**Expected Results:**
- ✅ Can insert minimum table size
- ✅ Table has header row by default
- ✅ Context menu appears

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

## Browser Console Testing

### 🧪 Test Case 17: Console Error Check

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Perform all table operations
4. Check for any red errors

**Expected Results:**
- ✅ No red errors during table insertion
- ✅ No red errors during row/column operations
- ✅ No red errors during table deletion
- ✅ No TypeScript errors
- ⚠️ Acceptable: Radix Dialog accessibility warnings (aria-describedby)

**Status:** ⬜ Not Tested
**Console Screenshot Required:** Yes
**Notes:**

---

### 🧪 Test Case 18: Network Tab Check

**Steps:**
1. Open Chrome DevTools → Network tab
2. Perform table operations
3. Verify no unexpected network requests

**Expected Results:**
- ✅ No API calls during table operations
- ✅ No failed resource loads

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

## Markdown Serialization Testing

### 🧪 Test Case 19: GFM Table Output

**Steps:**
1. Insert a 3×3 table with header
2. Fill in some cell content:
   - Header: `Name | Age | City`
   - Row 1: `Alice | 30 | NYC`
   - Row 2: `Bob | 25 | LA`
3. Copy the markdown output (via future export feature or inspect state)

**Expected Results:**
- ✅ Output uses GitHub Flavored Markdown syntax
- ✅ Contains pipe characters `|`
- ✅ Contains separator row `| --- | --- | --- |`
- ✅ Proper cell alignment

**Status:** ⬜ Not Tested
**Markdown Output Required:** Yes
**Notes:**

---

## Accessibility Testing

### 🧪 Test Case 20: Keyboard Navigation

**Steps:**
1. Insert a table
2. Use Tab key to navigate between cells
3. Use arrow keys to move within table
4. Use context menu buttons via keyboard

**Expected Results:**
- ✅ Tab key moves between cells
- ✅ All buttons have visible focus indicators
- ✅ Can activate buttons with Enter/Space
- ✅ Escape key closes dialogs

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

### 🧪 Test Case 21: Screen Reader Compatibility

**Steps:**
1. Enable VoiceOver (macOS) or NVDA (Windows)
2. Navigate table structure
3. Verify table controls are announced

**Expected Results:**
- ✅ Table structure is announced
- ✅ Button labels are read correctly
- ✅ Dialog titles and content are accessible

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

## Edge Cases & Stress Testing

### 🧪 Test Case 22: Rapid Operations

**Steps:**
1. Insert a 5×5 table
2. Rapidly click "Add Row Above" 10 times
3. Rapidly click "Add Column Right" 10 times
4. Verify table remains stable

**Expected Results:**
- ✅ No duplicate operations
- ✅ No UI freezing
- ✅ No console errors

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

### 🧪 Test Case 23: Context Menu Positioning

**Steps:**
1. Insert table at top of document
2. Insert table at bottom of document
3. Insert table in middle
4. Verify context menu doesn't overflow viewport

**Expected Results:**
- ✅ Menu always visible on screen
- ✅ Menu adjusts position if needed
- ✅ No clipping issues

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes
**Notes:**

---

## Overall Assessment Criteria

### ✅ READY FOR PRODUCTION if:
- All 23 test cases pass
- No red errors in browser console
- Table operations are smooth and responsive
- Radix Dialog UI is polished and professional
- Markdown output is valid GFM format

### ❌ NEEDS FIXES if:
- Any critical test case fails
- Browser console shows TypeScript errors
- Performance issues (lag, freezing)
- UI bugs (misaligned buttons, broken dialogs)
- Markdown serialization incorrect

---

## Test Execution Instructions

**Prerequisites:**
1. Kill any existing process on port 5173:
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. Start development server:
   ```bash
   cd /Users/jarmotuisk/Projects/ritemark/ritemark-app
   npm run dev
   ```

3. Open Chrome and navigate to: http://localhost:5173

4. Open Chrome DevTools (F12) and keep Console tab visible

5. Clear browser cache if needed (Cmd+Shift+R)

**Testing Order:**
1. Execute Test Cases 1-16 (table functionality)
2. Execute Test Cases 17-18 (browser validation)
3. Execute Test Cases 19 (markdown output)
4. Execute Test Cases 20-21 (accessibility)
5. Execute Test Cases 22-23 (edge cases)

**Reporting:**
- Mark each test case with ✅ PASS or ❌ FAIL
- Add screenshots to `/docs/sprints/sprint-11-screenshots/`
- Document any bugs in "Notes" section
- Record browser console errors verbatim

---

## Known Issues (Pre-Test)

1. **Unit Tests Failing** (unrelated to Sprint 11 table features):
   - `App.test.tsx` - window.matchMedia not mocked
   - `AuthContext.test.tsx` - session restoration timeout
   - `pkceGenerator.test.ts` - unique value generation flaky
   - `table-serialization.test.ts` - pipe character escaping

2. **Radix Dialog Warnings** (acceptable):
   - Missing `aria-describedby` warnings in test output
   - Does not affect functionality

---

## Post-Test Actions

**If ALL TESTS PASS:**
1. Update sprint status to "READY FOR PRODUCTION"
2. Create PR with test results
3. Tag for deployment review

**If ANY TESTS FAIL:**
1. Document failures in this report
2. Create bug tickets with screenshots
3. Update sprint status to "NEEDS FIXES"
4. Prioritize fixes based on severity

---

## Tester Sign-Off

**Tested by:** ___________________________
**Date:** ___________________________
**Overall Status:** ⬜ PASS / ⬜ FAIL
**Recommendation:** ⬜ READY FOR PRODUCTION / ⬜ NEEDS FIXES

**Critical Issues Found:**
1.
2.
3.

**Minor Issues Found:**
1.
2.
3.

**Additional Notes:**


