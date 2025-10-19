# Sprint 11 - Quick Manual Testing Guide

**URL:** http://localhost:5173
**Time Required:** ~30 minutes

---

## 🚀 Quick Start

```bash
# Terminal 1: Start dev server
cd /Users/jarmotuisk/Projects/ritemark/ritemark-app
lsof -ti:5173 | xargs kill -9
npm run dev

# Terminal 2: Keep this open for validation
npm run type-check
```

**Browser Setup:**
1. Open Chrome
2. Navigate to http://localhost:5173
3. Open DevTools (F12) → Console tab
4. Keep Console visible during all tests

---

## ✅ Critical Test Checklist (15 min)

### 1️⃣ Table Insertion (2 min)
- [ ] Type "Test" and select it
- [ ] Click table icon in bubble menu
- [ ] Dialog appears (NOT browser alert)
- [ ] Hover over grid shows dimension label
- [ ] Click 3×3 cell
- [ ] Table inserts, text preserved
- [ ] **Screenshot:** Table picker dialog

### 2️⃣ Context Menu Visibility (2 min)
- [ ] Click inside table cell
- [ ] Context menu appears
- [ ] Start typing - menu stays visible
- [ ] Click outside table - menu disappears
- [ ] Click back inside - menu reappears
- [ ] **Screenshot:** Context menu visible while typing

### 3️⃣ Row Operations (3 min)
- [ ] Click "Add Row Above" → new row appears above
- [ ] Click "Add Row Below" → new row appears below
- [ ] Click "Delete Row" → row disappears (no confirmation)
- [ ] Delete button has red hover state
- [ ] **Screenshot:** Row operations in action

### 4️⃣ Column Operations (3 min)
- [ ] Click "Add Column Left" → new column appears left
- [ ] Click "Add Column Right" → new column appears right
- [ ] Click "Delete Column" → column disappears
- [ ] Delete button has red hover state
- [ ] **Screenshot:** Column operations in action

### 5️⃣ Delete Table (3 min)
- [ ] Click "Delete Table" button (trash icon)
- [ ] Radix Dialog appears (styled modal, NOT browser confirm)
- [ ] Dialog has overlay background (dimmed)
- [ ] Click "Cancel" → dialog closes, table remains
- [ ] Click "Delete Table" again
- [ ] Click "Delete Table" button → table disappears
- [ ] **Screenshot:** Delete confirmation dialog

### 6️⃣ Browser Console (2 min)
- [ ] Check Console tab in DevTools
- [ ] No red errors during any operation
- [ ] Radix warnings are acceptable
- [ ] **Screenshot:** Clean console (or note errors)

---

## 🔬 Detailed Test Checklist (Full 23 tests)

See: `/docs/sprints/sprint-11-manual-test-report.md`

---

## 📸 Required Screenshots

Save to: `/docs/sprints/sprint-11-screenshots/`

**Filename Convention:**
- `01-table-picker-dialog.png`
- `02-context-menu-visible.png`
- `03-row-operations.png`
- `04-column-operations.png`
- `05-delete-confirmation.png`
- `06-browser-console.png`
- `07-large-table-10x10.png` (if tested)

---

## 🐛 Bug Reporting Template

If you find issues, document like this:

```markdown
### Bug: [Short Description]

**Test Case:** #[number]
**Severity:** Critical / High / Medium / Low
**Reproducible:** Always / Sometimes / Rare

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshot:** [filename]
**Console Error:** [if applicable]
```

---

## 🎯 Pass/Fail Criteria

### ✅ READY FOR PRODUCTION
- All critical tests pass (1-6)
- No red errors in console
- Table operations smooth
- Radix Dialog UI polished
- Markdown output valid

### ❌ NEEDS FIXES
- Any critical test fails
- TypeScript errors in console
- UI bugs (misaligned, broken)
- Performance issues

---

## 🔧 Troubleshooting

**Problem: Table button not visible**
- Check if text is selected
- Check console for errors
- Refresh browser (Cmd+Shift+R)

**Problem: Context menu not appearing**
- Click inside table cell (not on border)
- Check console for React errors
- Verify table has `tiptap-table` class

**Problem: Dialog not styled**
- Check if Radix UI packages installed
- Check for CSS import errors
- Verify Tailwind classes loaded

**Problem: TypeScript errors in console**
- Run `npm run type-check` in terminal
- Check import paths are correct
- Verify all types are defined

---

## 📊 Final Report

After testing, update `/docs/sprints/sprint-11-manual-test-report.md`:

1. Mark each test case ✅ PASS or ❌ FAIL
2. Add screenshots
3. Document bugs in "Notes" sections
4. Fill out "Tester Sign-Off" section
5. Set "Overall Status"

---

## 🚀 Next Steps

**If ALL TESTS PASS:**
→ Ready for Sprint 12 (Table Styling & Polish)

**If TESTS FAIL:**
→ Create bug tickets
→ Prioritize critical fixes
→ Re-test after fixes

---

**Good luck! 🎉**
