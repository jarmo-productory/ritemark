# Sprint 11 - Quick Test Execution Guide

**Purpose:** Fast reference for testing TableBubbleMenu stability
**Full Documentation:** See `/docs/sprints/sprint-11-stable-menu-tests.md`

---

## ⚡ Quick Start (5 Minutes)

### Setup
```bash
# 1. Kill any process on port 5173
lsof -ti:5173 | xargs kill -9

# 2. Start dev server
cd /Users/jarmotuisk/Projects/ritemark/ritemark-app
npm run dev

# 3. Open browser
open http://localhost:5173
```

### Core Tests (Must Pass)

#### ✅ Test 1: Menu Stays Visible While Typing
1. Insert table via formatting menu
2. Click in cell
3. Type a long sentence
4. **VERIFY:** Menu never disappears

#### ✅ Test 2: Menu Stays Open During Button Clicks
1. Insert 3×3 table
2. Click in middle cell
3. Click "Add Row Above" 5 times rapidly
4. **VERIFY:** Menu doesn't flicker

#### ✅ Test 3: Menu Disappears When Leaving Table
1. Insert table
2. Click outside table
3. **VERIFY:** Menu disappears immediately

#### ✅ Test 4: Multiple Tables Work Correctly
1. Insert two tables
2. Click in first table → menu appears
3. Click in second table → menu repositions
4. **VERIFY:** No "stuck" positioning

---

## 🎯 Expected vs Actual Template

### Test 1: Menu While Typing
- **Expected:** Menu stays visible throughout typing
- **Actual:** ___________________________
- **Status:** ⬜ PASS / ⬜ FAIL
- **Screenshot:** `/docs/sprints/sprint-11/sprint-11-screenshots/test-1-menu-while-typing.png`

### Test 2: Menu During Clicks
- **Expected:** Menu doesn't flicker when clicking "Add Row"
- **Actual:** ___________________________
- **Status:** ⬜ PASS / ⬜ FAIL
- **Screenshot:** `/docs/sprints/sprint-11/sprint-11-screenshots/test-2-menu-after-add-row.png`

### Test 3: Menu Disappears on Exit
- **Expected:** Menu disappears immediately when clicking outside
- **Actual:** ___________________________
- **Status:** ⬜ PASS / ⬜ FAIL
- **Screenshot:** `/docs/sprints/sprint-11/sprint-11-screenshots/test-4-menu-disappeared.png`

### Test 4: Multiple Tables
- **Expected:** Menu repositions correctly when switching tables
- **Actual:** ___________________________
- **Status:** ⬜ PASS / ⬜ FAIL
- **Screenshot:** `/docs/sprints/sprint-11/sprint-11-screenshots/test-6-menu-second-table.png`

---

## 🐛 Browser Console Check

Open Chrome DevTools (F12) → Console tab

**During Testing - Watch For:**
- ❌ Red errors (FAIL)
- ⚠️ Yellow warnings (acceptable if Radix UI aria warnings)
- ✅ No errors (PASS)

**Document Any Errors:**
```
Error message: _______________________
Location: _____________________________
Reproducible: Yes / No
```

---

## 📊 Quick Result Matrix

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| Menu while typing | ⬜ | ⬜ | |
| Menu during clicks | ⬜ | ⬜ | |
| Menu disappears | ⬜ | ⬜ | |
| Multiple tables | ⬜ | ⬜ | |
| Browser console | ⬜ | ⬜ | |

**Overall:** ⬜ READY / ⬜ NEEDS FIXES

---

## 🚀 Next Steps

### If All Pass
1. Mark Sprint 11 as "STABLE MENU VALIDATED"
2. Proceed to Sprint 12 (Image support)

### If Any Fail
1. Take screenshots of failures
2. Document in `/docs/sprints/sprint-11-stable-menu-tests.md`
3. Create GitHub issues
4. Prioritize fixes before Sprint 12

---

## 📸 Screenshot Naming Convention

Save to: `/docs/sprints/sprint-11/sprint-11-screenshots/`

- `test-1-menu-while-typing.png` - Menu visible with text in cell
- `test-2-menu-after-add-row.png` - Menu after button click
- `test-3-menu-position-stable.png` - Menu after adding rows
- `test-4-menu-disappeared.png` - Menu gone after exit
- `test-6-menu-second-table.png` - Menu at second table
- `test-10-console-clean.png` - DevTools console screenshot

---

**End of Quick Guide**

For detailed test cases and debugging tips, see:
`/docs/sprints/sprint-11-stable-menu-tests.md`
