# Sprint 11 - TableBubbleMenu Stability Test Plan

**Date:** 2025-10-18
**Focus:** Verify stable TableBubbleMenu behavior during typing and interactions
**Component:** `TableContextMenu.tsx`
**Sprint Goal:** Ensure menu stays visible and doesn't flicker during table operations

---

## 🎯 Test Objectives

This test plan focuses exclusively on **TableBubbleMenu stability issues** identified in Sprint 11:
- Menu visibility while typing in cells
- Menu persistence during button clicks
- Position stability during table resize
- Correct show/hide behavior on table entry/exit

**Why This Matters:**
- Poor menu stability creates frustrating UX
- Flickering menus feel unprofessional
- Users expect context menus to stay visible during operations

---

## ⚙️ Test Configuration

### Current Implementation Details

**BubbleMenu Configuration (TableContextMenu.tsx):**
```typescript
<BubbleMenu
  editor={editor}
  shouldShow={({ editor }) => {
    const isTable = editor.isActive('table')
    const isTableCell = editor.isActive('tableCell')
    const isTableHeader = editor.isActive('tableHeader')

    return isTable || isTableCell || isTableHeader
  }}
  updateDelay={0}  // ⚠️ Key stability setting
>
```

**Key Implementation Features:**
- ✅ Uses `onMouseDown={(e) => e.preventDefault()` on all buttons (prevents focus loss)
- ✅ `updateDelay={0}` for instant menu visibility
- ✅ Multiple activation conditions (table, tableCell, tableHeader)
- ✅ Positioned via TipTap's automatic positioning system

---

## 🧪 Test Case 1: Menu Visibility While Typing

**Priority:** Critical
**User Story:** As a user editing a table, I want the context menu to stay visible while typing so I can quickly access table operations without re-clicking.

### Test Steps
1. Open http://localhost:5173
2. Insert a 3×3 table via FormattingBubbleMenu
3. Click inside the first cell (menu should appear)
4. Start typing: "This is a test sentence with multiple words"
5. **Without clicking anything**, continue typing for 10+ seconds
6. Observe menu behavior throughout typing

### Expected Results
- ✅ Menu appears immediately when clicking in cell
- ✅ Menu **stays visible** throughout entire typing session
- ✅ Menu position remains stable (doesn't jump around)
- ✅ No flickering or disappearing during typing
- ✅ Menu doesn't interfere with cursor visibility

### Failure Criteria
- ❌ Menu disappears while typing
- ❌ Menu flickers (appears/disappears repeatedly)
- ❌ Menu blocks text being typed
- ❌ Menu position changes while typing

### Browser Console Check
Open DevTools Console and verify:
- ✅ No errors during typing
- ✅ No warnings about React state updates
- ✅ No TipTap errors

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes - Show menu visible while text is in cell
**Notes:**

---

## 🧪 Test Case 2: Menu Stays Open During Button Clicks

**Priority:** Critical
**User Story:** As a user, when I click "Add Row", I expect the menu to stay visible so I can click it again without re-selecting the cell.

### Test Steps
1. Insert a 3×3 table
2. Click in the middle cell (row 2, column 2)
3. Verify menu appears
4. Click **"Add Row Above"** button
5. **Immediately observe** menu behavior (does it flicker?)
6. Click "Add Row Above" again (without re-clicking cell)
7. Repeat for 5 consecutive clicks

### Expected Results
- ✅ Menu stays visible after first "Add Row Above" click
- ✅ No flickering/disappearing between clicks
- ✅ Can click "Add Row Above" 5 times consecutively without menu disappearing
- ✅ New rows are added successfully
- ✅ Menu position adjusts smoothly as table grows

### Failure Criteria
- ❌ Menu disappears after button click
- ❌ Menu flickers/re-renders between clicks
- ❌ Must re-click cell to show menu again
- ❌ Menu position "jumps" erratically

### Technical Validation
Check browser console for:
- ✅ No React re-render warnings
- ✅ No TipTap selection errors
- ✅ No focus-related errors

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes - Show menu visible after clicking "Add Row" button
**Notes:**

---

## 🧪 Test Case 3: Menu Position Stability During Table Resize

**Priority:** High
**User Story:** As a user adding rows/columns, I expect the menu to stay at the top-left of the table without jumping around.

### Test Steps
1. Insert a 2×2 table
2. Click in first cell (menu appears)
3. Add 10 rows using "Add Row Below" button
4. Observe menu position after each addition
5. Add 5 columns using "Add Column Right" button
6. Observe menu position after each addition

### Expected Results
- ✅ Menu stays at **consistent position relative to table**
- ✅ Menu position adjusts smoothly as table grows
- ✅ No "jumping" or erratic repositioning
- ✅ Menu doesn't move outside viewport
- ✅ Menu doesn't overlap table content

### Failure Criteria
- ❌ Menu jumps around unpredictably
- ❌ Menu moves far from table as it grows
- ❌ Menu goes off-screen
- ❌ Menu overlaps table cells being edited

### Viewport Test
- Test with browser window at 1920×1080
- Test with browser window at 1280×720
- Verify menu positioning works at both sizes

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes - Show menu position after adding 10 rows
**Notes:**

---

## 🧪 Test Case 4: Menu Disappears When Leaving Table

**Priority:** Critical
**User Story:** As a user, I expect the table menu to disappear when I click outside the table, so it doesn't clutter the interface.

### Test Steps
1. Insert a 3×3 table
2. Click inside the table (menu appears)
3. Click **outside the table** in the editor text area
4. Observe menu behavior
5. Verify menu is no longer visible
6. Click in a different paragraph
7. Verify menu stays hidden

### Expected Results
- ✅ Menu disappears **immediately** when clicking outside table
- ✅ No lingering menu after leaving table
- ✅ Menu doesn't reappear when clicking in paragraphs
- ✅ Menu doesn't block text editing outside table

### Failure Criteria
- ❌ Menu stays visible after leaving table
- ❌ Menu takes >500ms to disappear
- ❌ Menu partially visible after leaving
- ❌ Menu interferes with editing outside table

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes - Show menu disappeared after clicking outside
**Notes:**

---

## 🧪 Test Case 5: Menu Reappears When Re-entering Table

**Priority:** High
**User Story:** As a user, when I click back into a table, I expect the context menu to reappear quickly.

### Test Steps
1. Insert a 3×3 table
2. Click inside table (menu appears)
3. Click outside table (menu disappears)
4. Click back into **any cell** in the table
5. Measure time to menu reappearance (should be <250ms)
6. Repeat for different cells (first cell, middle cell, last cell)

### Expected Results
- ✅ Menu reappears within **250ms** of clicking in cell
- ✅ Menu appears for **any cell** clicked (not just first cell)
- ✅ Menu position is correct for the table
- ✅ No delay or lag when re-entering table

### Failure Criteria
- ❌ Menu takes >500ms to appear
- ❌ Menu doesn't appear for some cells
- ❌ Menu appears at wrong position
- ❌ Must click twice to show menu

### Performance Check
Use browser DevTools Performance tab:
1. Record performance profile
2. Click in/out of table 10 times
3. Check for performance bottlenecks
4. Verify no excessive re-renders

**Status:** ⬜ Not Tested
**Screenshot Required:** No (timing test)
**Notes:**

---

## 🧪 Test Case 6: Multiple Tables - Menu Switching

**Priority:** High
**User Story:** As a user with multiple tables, I expect the menu to correctly switch between tables without getting "stuck".

### Test Steps
1. Insert **first table** (3×3)
2. Add paragraph below: "Separator text"
3. Insert **second table** (4×4)
4. Click in **first table** → verify menu appears at first table
5. Click in **second table** → verify menu **repositions** to second table
6. Rapidly switch between tables (10 times)
7. Verify menu follows cursor correctly

### Expected Results
- ✅ Menu appears at **first table** when clicked
- ✅ Menu **repositions** to second table when clicked
- ✅ No "stuck" positioning (menu doesn't stay at first table)
- ✅ Rapid switching works smoothly (no lag)
- ✅ Menu always appears at correct table

### Failure Criteria
- ❌ Menu stays at first table when clicking second table
- ❌ Menu appears at wrong table
- ❌ Menu disappears during switching
- ❌ Menu flickers between table switches

### Edge Case Test
- Insert 3 tables vertically
- Scroll to middle table
- Verify menu works correctly at different scroll positions

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes - Show menu at second table after switching
**Notes:**

---

## 🧪 Test Case 7: Menu Stability During Cell Navigation

**Priority:** Medium
**User Story:** As a user navigating table cells with Tab/Arrow keys, I expect the menu to stay visible.

### Test Steps
1. Insert a 4×4 table
2. Click in first cell (menu appears)
3. Press **Tab** to move to next cell
4. Observe menu behavior
5. Press **Tab** 10 times to navigate through cells
6. Verify menu stays visible throughout

### Expected Results
- ✅ Menu stays visible when pressing Tab
- ✅ Menu position updates smoothly as cells change
- ✅ No flickering during Tab navigation
- ✅ Menu works correctly after Tab navigation

### Keyboard Navigation Test
- Test **Tab** (forward navigation)
- Test **Shift+Tab** (backward navigation)
- Test **Arrow keys** (up/down/left/right)
- Verify menu behavior for all navigation methods

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Notes:**

---

## 🧪 Test Case 8: Menu During Rapid Operations (Stress Test)

**Priority:** Medium
**User Story:** As a power user, I expect the menu to handle rapid button clicks without breaking.

### Test Steps
1. Insert a 3×3 table
2. Click in middle cell
3. **Rapidly click** "Add Row Above" 20 times (as fast as possible)
4. Observe menu stability
5. **Rapidly click** "Add Column Right" 20 times
6. Verify menu still works correctly

### Expected Results
- ✅ Menu stays visible during rapid clicking
- ✅ No UI freezing or lag
- ✅ All operations execute correctly (no missed clicks)
- ✅ No browser console errors
- ✅ Menu position remains stable

### Failure Criteria
- ❌ Menu disappears during rapid clicks
- ❌ UI freezes or becomes unresponsive
- ❌ Some button clicks don't register
- ❌ Console shows React errors or warnings

### Browser Performance Check
Open DevTools → Performance tab:
1. Start recording
2. Perform rapid operations
3. Stop recording
4. Check for:
   - ✅ No long tasks (>50ms)
   - ✅ Smooth frame rate (60fps)
   - ✅ No memory leaks

**Status:** ⬜ Not Tested
**Screenshot Required:** No
**Console Screenshot Required:** Yes
**Notes:**

---

## 🧪 Test Case 9: Menu Interaction with FormattingBubbleMenu

**Priority:** Medium
**User Story:** As a user, I expect the table menu and formatting menu to work independently without conflicts.

### Test Steps
1. Type some text: "Test paragraph"
2. Select the text (FormattingBubbleMenu appears)
3. Insert a table via FormattingBubbleMenu
4. Click in table cell (TableContextMenu appears)
5. Verify FormattingBubbleMenu is hidden
6. Select text in table cell
7. Verify both menus behave correctly

### Expected Results
- ✅ FormattingBubbleMenu appears for text selection
- ✅ TableContextMenu appears when clicking in table
- ✅ Only **one menu visible** at a time (no conflicts)
- ✅ Menus don't overlap or interfere
- ✅ Both menus work independently

### Failure Criteria
- ❌ Both menus visible simultaneously (unless selecting text in cell)
- ❌ Menus overlap each other
- ❌ One menu blocks interaction with the other
- ❌ Menu positioning conflicts

**Status:** ⬜ Not Tested
**Screenshot Required:** Yes - Show TableContextMenu without FormattingBubbleMenu
**Notes:**

---

## 🧪 Test Case 10: Browser Console Error Check (Stability Focus)

**Priority:** Critical
**User Story:** As a developer, I need to ensure the stable menu implementation doesn't introduce console errors.

### Test Steps
1. Open Chrome DevTools → Console tab
2. Clear console (Cmd+K)
3. Perform all operations from Test Cases 1-9
4. Monitor console for errors/warnings
5. Document any issues found

### Expected Results
- ✅ **Zero red errors** during all operations
- ✅ No React warnings about state updates
- ✅ No TipTap editor errors
- ✅ No focus-related errors
- ⚠️ Acceptable: Radix Dialog `aria-describedby` warnings (not affecting functionality)

### Error Categories to Check
- **Critical Errors (FAIL):**
  - React component errors
  - TipTap editor errors
  - TypeScript type errors
  - Uncaught exceptions

- **Warnings (ACCEPTABLE):**
  - Radix UI accessibility warnings
  - Development mode warnings
  - PropTypes warnings (if any)

### Console Output Example
Document exact error messages if found:
```
[EXAMPLE]
Error: Cannot read property 'focus' of null
  at TableContextMenu.tsx:89
  at onClick
```

**Status:** ⬜ Not Tested
**Console Screenshot Required:** Yes - Clean console or documented errors
**Notes:**

---

## 📊 Test Execution Summary

### Test Execution Checklist

Before starting tests:
- [ ] Kill any process on port 5173: `lsof -ti:5173 | xargs kill -9`
- [ ] Start dev server: `cd ritemark-app && npm run dev`
- [ ] Open Chrome at http://localhost:5173
- [ ] Open Chrome DevTools (F12) → Console tab
- [ ] Clear browser cache (Cmd+Shift+R)

### Test Order
Execute tests in this sequence:
1. **Test Case 10** (Console check) - Monitor throughout all tests
2. **Test Case 1** (Typing visibility) - Core functionality
3. **Test Case 2** (Button clicks) - Core functionality
4. **Test Case 3** (Position stability) - Visual quality
5. **Test Case 4** (Leave table) - Core functionality
6. **Test Case 5** (Re-enter table) - Core functionality
7. **Test Case 6** (Multiple tables) - Edge case
8. **Test Case 7** (Cell navigation) - UX enhancement
9. **Test Case 8** (Stress test) - Performance
10. **Test Case 9** (Menu conflicts) - Integration test

### Pass/Fail Criteria

**✅ PASS Criteria:**
- All 10 test cases pass without critical failures
- No red errors in browser console
- Menu feels stable and responsive
- No flickering or disappearing issues
- Position stability maintained

**❌ FAIL Criteria:**
- Any of Test Cases 1-6 fail (critical functionality)
- Red errors in browser console
- Menu flickers or disappears during operations
- Menu position jumps erratically
- Performance issues (lag, freezing)

---

## 🐛 Known Issues & Expected Behavior

### Expected Warnings (Acceptable)
These warnings are **acceptable** and do **NOT** fail the test:

1. **Radix Dialog aria-describedby**
   ```
   Warning: A component is changing an uncontrolled input to be controlled
   ```
   - **Why it happens:** Radix UI accessibility warning
   - **Impact:** None (doesn't affect functionality)
   - **Action:** Document but don't fail test

2. **React 19 Development Mode Warnings**
   ```
   Warning: ReactDOM.render is deprecated in React 19
   ```
   - **Why it happens:** Development build warnings
   - **Impact:** None (production build is clean)
   - **Action:** Document but don't fail test

### Unrelated Failing Unit Tests
These unit tests are **NOT** related to TableBubbleMenu stability:
- `App.test.tsx` - window.matchMedia mocking issue
- `AuthContext.test.tsx` - session restoration timeout
- `pkceGenerator.test.ts` - unique value generation
- `table-serialization.test.ts` - pipe character escaping

**Action:** Ignore these test failures (pre-existing issues)

---

## 📸 Screenshot Requirements

Save all screenshots to: `/docs/sprints/sprint-11/sprint-11-screenshots/`

### Required Screenshots

1. **test-1-menu-while-typing.png**
   - Show menu visible with text typed in cell
   - Include timestamp to prove no disappearing

2. **test-2-menu-after-add-row.png**
   - Show menu still visible after clicking "Add Row Above"
   - Capture the moment after button click

3. **test-3-menu-position-stable.png**
   - Show menu position after adding 10 rows
   - Demonstrate stable positioning

4. **test-4-menu-disappeared.png**
   - Show menu is gone after clicking outside table
   - Prove clean disappearance

5. **test-6-menu-second-table.png**
   - Show menu correctly positioned at second table
   - Demonstrate no "stuck" positioning

6. **test-9-table-menu-only.png**
   - Show TableContextMenu without FormattingBubbleMenu
   - Prove no menu conflicts

7. **test-10-console-clean.png**
   - Show Chrome DevTools console with no errors
   - Or document exact errors if any found

---

## 📝 Test Report Template

After completing all tests, fill out this summary:

### Tester Information
- **Tested by:** ___________________________
- **Date:** ___________________________
- **Browser:** Chrome Version: ___________
- **OS:** macOS/Windows/Linux Version: _______

### Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Menu While Typing | ⬜ PASS / ⬜ FAIL | |
| TC2: Menu During Clicks | ⬜ PASS / ⬜ FAIL | |
| TC3: Position Stability | ⬜ PASS / ⬜ FAIL | |
| TC4: Disappears on Exit | ⬜ PASS / ⬜ FAIL | |
| TC5: Reappears on Entry | ⬜ PASS / ⬜ FAIL | |
| TC6: Multiple Tables | ⬜ PASS / ⬜ FAIL | |
| TC7: Cell Navigation | ⬜ PASS / ⬜ FAIL | |
| TC8: Stress Test | ⬜ PASS / ⬜ FAIL | |
| TC9: Menu Conflicts | ⬜ PASS / ⬜ FAIL | |
| TC10: Console Errors | ⬜ PASS / ⬜ FAIL | |

### Overall Assessment
- **Overall Status:** ⬜ PASS / ⬜ FAIL
- **Recommendation:** ⬜ READY FOR PRODUCTION / ⬜ NEEDS FIXES

### Critical Issues Found
1.
2.
3.

### Minor Issues Found
1.
2.
3.

### Performance Notes
- Menu responsiveness: ⬜ Excellent / ⬜ Good / ⬜ Needs Improvement
- Visual stability: ⬜ Excellent / ⬜ Good / ⬜ Needs Improvement
- Browser performance: ⬜ Excellent / ⬜ Good / ⬜ Needs Improvement

### Additional Notes



---

## 🚀 Next Steps After Testing

### If All Tests Pass (✅ READY FOR PRODUCTION)
1. Update `/docs/sprints/sprint-11/README.md` with "STABLE MENU VALIDATED"
2. Mark Sprint 11 as complete
3. Create PR with test results
4. Tag for deployment review

### If Tests Fail (❌ NEEDS FIXES)
1. Document failures in this report with screenshots
2. Create GitHub issues for each bug found
3. Prioritize fixes:
   - **P0 Critical:** Menu disappears during typing (TC1, TC2)
   - **P1 High:** Position stability issues (TC3)
   - **P2 Medium:** Navigation issues (TC7)
   - **P3 Low:** Minor UX polish (TC8, TC9)
4. Update sprint status to "IN PROGRESS - FIXING STABILITY"
5. Re-test after fixes

---

## 🔧 Debugging Tips

### If Menu Disappears During Typing
**Possible causes:**
1. `shouldShow` logic too strict → Check if `isTableCell` is false during typing
2. Focus loss → Verify `onMouseDown={(e) => e.preventDefault()` on buttons
3. Editor state update → Check TipTap transaction logs

**Debug steps:**
```javascript
// Add to TableContextMenu.tsx temporarily
console.log('shouldShow check:', {
  isTable: editor.isActive('table'),
  isTableCell: editor.isActive('tableCell'),
  isTableHeader: editor.isActive('tableHeader')
})
```

### If Menu Position Jumps
**Possible causes:**
1. BubbleMenu positioning logic → Check TipTap positioning calculations
2. CSS conflicts → Inspect computed styles
3. Parent container changes → Check if editor container resizes

**Debug steps:**
```javascript
// Check menu position in browser console
document.querySelector('[role="dialog"]').getBoundingClientRect()
```

### If Menu Flickers
**Possible causes:**
1. Rapid re-renders → Check React DevTools Profiler
2. `updateDelay` too high → Should be `0` for instant updates
3. Multiple BubbleMenu instances → Verify only one instance per editor

**Debug steps:**
```bash
# Enable React DevTools Profiler
# Record while performing operations
# Check for excessive re-renders
```

---

**End of Test Plan**
