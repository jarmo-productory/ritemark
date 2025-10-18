# Sprint 11 - Test Plan Implementation Summary

**Date:** 2025-10-18
**Status:** ✅ Test Documentation Complete - Ready for Manual Testing
**Component:** TableBubbleMenu (TableContextMenu.tsx)

---

## 📋 What Was Created

### 1. Comprehensive Test Plan
**File:** `/docs/sprints/sprint-11-stable-menu-tests.md` (653 lines, 20KB)

**Coverage:**
- ✅ 10 detailed test cases focused on menu stability
- ✅ Expected vs actual result templates
- ✅ Browser console error checking procedures
- ✅ Screenshot requirements and naming conventions
- ✅ Pass/fail criteria with severity levels
- ✅ Debugging tips for common issues
- ✅ Test execution order and checklist

**Test Cases Included:**
1. Menu visibility while typing (Critical)
2. Menu stays open during button clicks (Critical)
3. Menu position stability during table resize (High)
4. Menu disappears when leaving table (Critical)
5. Menu reappears when re-entering table (High)
6. Multiple tables - menu switching (High)
7. Menu stability during cell navigation (Medium)
8. Menu during rapid operations (stress test) (Medium)
9. Menu interaction with FormattingBubbleMenu (Medium)
10. Browser console error check (Critical)

### 2. Quick Execution Guide
**File:** `/docs/sprints/sprint-11-test-execution-guide.md`

**Purpose:** Fast reference for manual testers
- ⚡ 5-minute quick start instructions
- 🎯 Core tests that must pass
- 📊 Simple pass/fail matrix
- 📸 Screenshot naming convention

---

## 🎯 Test Focus Areas

### What We're Specifically Testing

#### 1. **Menu Visibility While Typing**
**Why It Matters:** Users reported menu disappearing during typing in previous iterations.

**Test Verification:**
- Menu stays visible throughout entire typing session
- No flickering or disappearing
- Menu doesn't block cursor visibility

**Expected Behavior:**
```
User clicks cell → Menu appears instantly
User types text → Menu stays visible
User continues typing → Menu never disappears
```

#### 2. **Menu Stays Open During Button Clicks**
**Why It Matters:** Users want to click "Add Row" multiple times without re-selecting cell.

**Test Verification:**
- Menu doesn't flicker after button click
- Can click buttons consecutively without menu disappearing
- No need to re-click cell between operations

**Expected Behavior:**
```
Click "Add Row Above" → Menu stays visible
Click "Add Row Above" again → Menu still visible (no re-click needed)
Repeat 5 times → Menu stable throughout
```

#### 3. **Menu Position Stability**
**Why It Matters:** Menu jumping around creates poor UX and feels unprofessional.

**Test Verification:**
- Menu stays at consistent position relative to table
- Position adjusts smoothly as table grows
- No erratic jumping or repositioning

**Expected Behavior:**
```
Table 2×2 → Menu at top-left
Add 10 rows → Menu still at top-left (smoothly adjusts)
Add 5 columns → Menu position stable
```

#### 4. **Menu Disappears When Leaving Table**
**Why It Matters:** Menu shouldn't clutter interface when not in table.

**Test Verification:**
- Menu disappears immediately when clicking outside
- No lingering menu after leaving table
- Menu doesn't interfere with editing outside table

**Expected Behavior:**
```
Click outside table → Menu disappears instantly (<100ms)
Click in paragraph → Menu stays hidden
```

#### 5. **Menu Reappears When Re-entering Table**
**Why It Matters:** Users expect quick access when returning to table.

**Test Verification:**
- Menu reappears within 250ms of clicking in cell
- Works for any cell (not just first cell)
- No delay or lag

**Expected Behavior:**
```
Click back in table → Menu appears within 250ms
Click different cell → Menu repositions correctly
```

#### 6. **Multiple Tables Work Correctly**
**Why It Matters:** Prevents "stuck" menu positioning bug.

**Test Verification:**
- Menu correctly switches between tables
- No "stuck" positioning at first table
- Rapid switching works smoothly

**Expected Behavior:**
```
Click table 1 → Menu at table 1
Click table 2 → Menu repositions to table 2 (not stuck at table 1)
```

---

## 🔧 Technical Implementation Verified

### Current TableContextMenu Configuration

**BubbleMenu Settings (Stability-Critical):**
```typescript
<BubbleMenu
  editor={editor}
  shouldShow={({ editor }) => {
    const isTable = editor.isActive('table')
    const isTableCell = editor.isActive('tableCell')
    const isTableHeader = editor.isActive('tableHeader')

    return isTable || isTableCell || isTableHeader
  }}
  updateDelay={0}  // ⚠️ Key: Instant visibility (no delay)
>
```

**Button Click Prevention (Prevents Focus Loss):**
```typescript
<Button
  onClick={handleAddRowBefore}
  onMouseDown={(e) => e.preventDefault()}  // ⚠️ Key: Prevents editor focus loss
  title="Add Row Above"
>
```

**Why These Settings Matter:**
- `updateDelay={0}` → Menu appears/disappears instantly (no lag)
- `onMouseDown preventDefault` → Clicking buttons doesn't steal focus from editor
- Multiple activation conditions → Menu shows for table, tableCell, OR tableHeader

---

## ✅ Pre-Test Validation (Already Passed)

### Automated Checks Completed
- ✅ **TypeScript compilation:** PASSED (zero errors)
- ✅ **Development server:** RUNNING on port 5173
- ✅ **HTTP response:** 200 OK
- ✅ **Component files:** All exist and correctly imported

**Files Verified:**
- `/src/components/TableContextMenu.tsx` (267 lines)
- `/src/components/TablePicker.tsx` (exists)
- `/src/components/FormattingBubbleMenu.tsx` (table button integrated)
- `/src/extensions/tableExtensions.ts` (configured correctly)

---

## 📸 Screenshot Requirements

**Save Location:** `/docs/sprints/sprint-11/sprint-11-screenshots/`

### Required Screenshots (7 total)

1. **test-1-menu-while-typing.png**
   - Show menu visible with text in cell
   - Proves no disappearing during typing

2. **test-2-menu-after-add-row.png**
   - Show menu after clicking "Add Row Above"
   - Proves no flickering

3. **test-3-menu-position-stable.png**
   - Show menu after adding 10 rows
   - Proves stable positioning

4. **test-4-menu-disappeared.png**
   - Show menu gone after clicking outside
   - Proves clean disappearance

5. **test-6-menu-second-table.png**
   - Show menu at second table after switching
   - Proves no "stuck" positioning

6. **test-9-table-menu-only.png**
   - Show TableContextMenu without FormattingBubbleMenu
   - Proves no menu conflicts

7. **test-10-console-clean.png**
   - Show Chrome DevTools console
   - Proves no errors (or document exact errors)

---

## 🎯 Pass/Fail Criteria

### ✅ READY FOR PRODUCTION If:
- All critical tests pass (TC1, TC2, TC4, TC5, TC6)
- No red errors in browser console
- Menu feels stable and responsive
- No flickering or disappearing issues
- Position stability maintained

### ❌ NEEDS FIXES If:
- Any critical test fails
- Menu disappears during typing
- Menu flickers during button clicks
- Position jumps erratically
- Browser console shows errors

### Priority Levels
- **P0 Critical:** Menu disappears during typing (TC1, TC2)
- **P1 High:** Position stability issues (TC3, TC6)
- **P2 Medium:** Navigation/UX polish (TC7, TC8, TC9)

---

## 🚀 How to Execute Tests

### Quick Start (5 Minutes)

```bash
# 1. Setup
cd /Users/jarmotuisk/Projects/ritemark/ritemark-app
lsof -ti:5173 | xargs kill -9  # Kill stale processes
npm run dev                     # Start server

# 2. Open browser
open http://localhost:5173

# 3. Open DevTools
# Press F12 or Cmd+Option+I
# Go to Console tab
```

### Test Execution Order
1. Start with **Test 10** (Console monitoring) - keep DevTools open
2. Execute **Tests 1-6** (critical functionality)
3. Execute **Tests 7-9** (UX/integration tests)
4. Document results using provided templates

### Time Estimate
- Core tests (1-6): ~15 minutes
- Full test suite (1-10): ~30 minutes
- With screenshots: ~45 minutes

---

## 🐛 Known Issues (Pre-Test)

### Expected Warnings (Acceptable)
These **DO NOT** fail the test:

1. **Radix Dialog aria-describedby warnings**
   - Development-only warnings
   - No functionality impact
   - Document but don't fail test

2. **Unrelated unit test failures**
   - `App.test.tsx` - window.matchMedia mocking
   - `AuthContext.test.tsx` - session timeout
   - `pkceGenerator.test.ts` - unique values
   - These are pre-existing issues NOT related to TableBubbleMenu

---

## 📊 Test Result Templates

### Quick Pass/Fail Matrix

| Test | Expected Behavior | Status | Notes |
|------|-------------------|--------|-------|
| TC1: Menu While Typing | Stays visible | ⬜ PASS / ⬜ FAIL | |
| TC2: Menu During Clicks | No flicker | ⬜ PASS / ⬜ FAIL | |
| TC3: Position Stability | Smooth adjustment | ⬜ PASS / ⬜ FAIL | |
| TC4: Disappears on Exit | Instant disappearance | ⬜ PASS / ⬜ FAIL | |
| TC5: Reappears on Entry | <250ms appearance | ⬜ PASS / ⬜ FAIL | |
| TC6: Multiple Tables | Correct repositioning | ⬜ PASS / ⬜ FAIL | |
| TC7: Cell Navigation | Stable during Tab | ⬜ PASS / ⬜ FAIL | |
| TC8: Stress Test | No freezing | ⬜ PASS / ⬜ FAIL | |
| TC9: Menu Conflicts | No overlap | ⬜ PASS / ⬜ FAIL | |
| TC10: Console Errors | Zero red errors | ⬜ PASS / ⬜ FAIL | |

**Overall:** ⬜ READY / ⬜ NEEDS FIXES

---

## 📝 What Happens After Testing

### If All Tests Pass ✅
1. Update sprint status to **"STABLE MENU VALIDATED"**
2. Mark Sprint 11 as **COMPLETE**
3. Proceed to Sprint 12 (Image support)
4. Create PR with test results attached

### If Tests Fail ❌
1. Document failures with screenshots
2. Create GitHub issues with:
   - Exact steps to reproduce
   - Expected vs actual behavior
   - Browser console errors
   - Screenshots
3. Prioritize fixes:
   - P0: Fix immediately (blocking issue)
   - P1: Fix before Sprint 12
   - P2: Add to backlog
4. Re-test after fixes

---

## 🔗 Related Documentation

- **Full Test Plan:** `/docs/sprints/sprint-11-stable-menu-tests.md`
- **Quick Guide:** `/docs/sprints/sprint-11-test-execution-guide.md`
- **Existing Manual Tests:** `/docs/sprints/sprint-11/sprint-11-manual-test-report.md`
- **Component Docs:** `/docs/components/TableContextMenu.md` (if exists)

---

## 🎓 Testing Best Practices

### For Testers
1. **Clear browser cache** before testing (Cmd+Shift+R)
2. **Use Chrome** (primary target browser)
3. **Keep DevTools open** throughout testing
4. **Take screenshots immediately** after each test
5. **Document exact error messages** (don't paraphrase)
6. **Test in realistic conditions** (don't slow down artificially)

### For Developers
1. **Don't assume tests pass** - actually run them
2. **Never skip browser validation** - curl isn't enough
3. **Read console output carefully** - TypeScript errors can hide at runtime
4. **Test interactions** - not just initial render
5. **Think like a user** - not like a developer

---

## 📌 Summary

### What Was Accomplished
- ✅ Created comprehensive 10-test stability test plan
- ✅ Documented expected vs actual behavior templates
- ✅ Defined clear pass/fail criteria
- ✅ Provided debugging tips for common issues
- ✅ Verified TypeScript compilation passes
- ✅ Verified dev server runs correctly

### What's Next
- ⏭️ **User executes manual tests** using provided documentation
- ⏭️ **User documents results** with screenshots
- ⏭️ **User reports findings** for next steps decision

### Key Takeaways
- **Focus:** Menu stability during typing and interactions
- **Critical Tests:** TC1, TC2, TC4, TC5, TC6 (must pass)
- **Time Required:** ~45 minutes with screenshots
- **Output:** Pass/fail status with documented evidence

---

**End of Summary**

Ready to proceed with manual testing at: http://localhost:5173
