# Visual Testing Guide - Modal Components

## Quick Visual Reference for Manual Testing

### Expected Overlay Appearance

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  BLACK/80 OVERLAY (semi-transparent black)            │
│  Should block all content underneath                  │
│                                                        │
│            ┌─────────────────────┐                    │
│            │  MODAL DIALOG       │                    │
│            │  (white background) │                    │
│            │                     │                    │
│            │  [Content Here]     │                    │
│            │                     │                    │
│            │  [Button] [Button]  │                    │
│            └─────────────────────┘                    │
│                                                        │
│  Table controls SHOULD NOT be visible through overlay │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Z-Index Hierarchy (Side View)

```
Layer 5 (top):    [Tooltips/Menus] (z: 9999)
Layer 4:          [Settings Button] (z: 1000)
Layer 3:          [Dialog Overlay + Content] (z: 50) ← MODALS HERE
Layer 2:          [Sticky Header] (z: 5)
Layer 1:          [Table Controls] (z: 2) ← SHOULD BE HIDDEN
Layer 0 (bottom): [Editor Content] (z: auto)
```

---

## Component-by-Component Visual Tests

### 1. WelcomeScreen Modal

**Trigger:** Open http://localhost:5173 in incognito/private window

**Expected Appearance:**
```
┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│            ┌─────────────────────┐                    │
│            │      [RM Logo]      │                    │
│            │     RiteMark        │                    │
│            │                     │                    │
│            │  ┌─────────────┐   │                    │
│            │  │ Sign in     │   │   (if not signed)  │
│            │  └─────────────┘   │                    │
│            │                     │                    │
│            │  OR                 │                    │
│            │                     │                    │
│            │  ┌─────────────┐   │                    │
│            │  │ New Doc     │   │   (if signed in)   │
│            │  └─────────────┘   │                    │
│            │  ┌─────────────┐   │                    │
│            │  │ Open Drive  │   │                    │
│            │  └─────────────┘   │                    │
│            └─────────────────────┘                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Overlay is BLACK (not white or transparent)
- [ ] Overlay has 80% opacity (slightly see-through)
- [ ] Modal is centered on screen
- [ ] Content behind overlay is darkened
- [ ] X button in top-right corner (if applicable)

**Interaction Tests:**
- [ ] Press ESC → Modal closes
- [ ] Click overlay (outside modal) → Modal behavior (may not close by default)
- [ ] Click buttons → Expected action occurs

---

### 2. AuthModal

**Trigger:** Click user avatar in sidebar footer (bottom-left)

**Expected Appearance (Signed In):**
```
┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│            ┌─────────────────────┐                    │
│            │ [X]       Account   │                    │
│            │                     │                    │
│            │    [User Avatar]    │                    │
│            │                     │                    │
│            │    John Doe         │                    │
│            │  john@example.com   │                    │
│            │                     │                    │
│            │  ┌─────────────┐   │                    │
│            │  │  Sign Out   │   │                    │
│            │  └─────────────┘   │                    │
│            └─────────────────────┘                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Black/80 overlay consistent with WelcomeScreen
- [ ] User avatar displays correctly (round image)
- [ ] Name and email visible
- [ ] X button in top-right corner

**Interaction Tests:**
- [ ] Press ESC → Modal closes
- [ ] Click X button → Modal closes
- [ ] Click overlay → Modal closes
- [ ] Click "Sign Out" → User logged out

---

### 3. DriveFilePicker (Loading State)

**Trigger:** Click "Open from Drive" on desktop (≥768px)

**Expected Appearance:**
```
┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│                                                        │
│                  [Spinner Icon]                        │
│              Loading Google Picker...                  │
│                                                        │
│                                                        │
│         (No white modal box - transparent)             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Black/80 overlay visible
- [ ] Spinner icon (Loader2) is animating/spinning
- [ ] "Loading Google Picker..." text is white
- [ ] NO white modal box visible (transparent content)
- [ ] Transitions to Google Picker after loading

**Note:** Google Picker will open in its own UI (not using Dialog component)

---

### 4. DriveFileBrowser

**Trigger:** Click "Open from Drive" on mobile (<768px) or as fallback

**Expected Appearance (Mobile):**
```
┌────────────────────────────────────────────────────────┐
│ [X] Open from Google Drive                            │
│ ┌────────────────────────────────────────────────┐    │
│ │  [🔍] Search markdown files...        [↻]     │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ ┌──────────────────────────┬──────────────────────┐   │
│ │ [📄] Document 1.md       │ [📄] Document 2.md   │   │
│ │ 2h ago • 1.2 KB          │ 1d ago • 3.5 KB      │   │
│ └──────────────────────────┴──────────────────────┘   │
│ ┌──────────────────────────┬──────────────────────┐   │
│ │ [📄] Notes.md            │ [📄] README.md       │   │
│ │ 3d ago • 500 B           │ 1w ago • 2.1 KB      │   │
│ └──────────────────────────┴──────────────────────┘   │
│                                                        │
│                 [Load More]                            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Visual Checks (Mobile <768px):**
- [ ] Fullscreen modal (no black overlay visible at edges)
- [ ] Search bar at top
- [ ] Refresh button (circular arrow) next to search
- [ ] File grid layout (2 columns on larger screens)
- [ ] File cards have icon, name, timestamp, size
- [ ] "Load More" button at bottom (if more files)

**Visual Checks (Desktop ≥768px):**
- [ ] Black/80 overlay visible around modal
- [ ] Modal is standard size (not fullscreen)
- [ ] Same file grid layout
- [ ] X button in top-right corner

**Interaction Tests:**
- [ ] Press ESC → Modal closes
- [ ] Click X button → Modal closes
- [ ] Type in search → Files filter
- [ ] Click refresh → Spinner appears, files reload
- [ ] Click file card → File selected and modal closes
- [ ] Click "Load More" → More files load

---

### 5. ImageUploader

**Trigger:** Insert image in editor (toolbar or `/image` command)

**Expected Appearance (No File Selected):**
```
┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│            ┌─────────────────────┐                    │
│            │ [X]  Upload Image   │                    │
│            │                     │                    │
│            │  ┌─────────────┐   │                    │
│            │  │ Choose File │   │                    │
│            │  └─────────────┘   │                    │
│            │                     │                    │
│            └─────────────────────┘                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Expected Appearance (File Selected):**
```
┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│            ┌─────────────────────┐                    │
│            │ [X]  Upload Image   │                    │
│            │                     │                    │
│            │  ┌───────────────┐ │                    │
│            │  │  [Image       │ │                    │
│            │  │   Preview]    │ │                    │
│            │  └───────────────┘ │                    │
│            │                     │                    │
│            │  Alt Text:          │                    │
│            │  [Input field]      │                    │
│            │                     │                    │
│            │  [Insert] [Cancel] │                    │
│            │                     │                    │
│            └─────────────────────┘                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Black/80 overlay consistent
- [ ] Preview shows selected image
- [ ] Alt text input field visible
- [ ] Two buttons: "Insert Image" and "Cancel"
- [ ] X button in top-right corner

**Interaction Tests:**
- [ ] Press ESC → Modal closes
- [ ] Click X button → Modal closes
- [ ] Click "Choose File" → File picker opens
- [ ] Select image → Preview displays
- [ ] Click "Insert Image" → Progress bar appears → Image uploads → Modal closes
- [ ] Try 11MB file → Error message shows
- [ ] Try .txt file → Error message shows

---

## Table Controls Z-Index Test

**Goal:** Verify table row/column handles DO NOT appear through modal overlays

**Setup:**
1. Create a table in editor (toolbar → Table)
2. Open ANY modal (WelcomeScreen, AuthModal, etc.)
3. Move mouse over table area (through modal overlay)

**Expected Behavior:**
```
With Modal Open:

┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│            ┌─────────────────────┐                    │
│            │     MODAL           │                    │
│            │                     │                    │
│            │  [Content Here]     │                    │
│            │                     │                    │
│            └─────────────────────┘                    │
│                                                        │
│  Underneath: [Table with cells]                       │
│  ❌ Table controls SHOULD NOT be visible              │
│  ❌ Row/column handles SHOULD NOT appear              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Table row handles NOT visible through overlay
- [ ] Table column handles NOT visible through overlay
- [ ] Column resize handle NOT visible through overlay
- [ ] Table remains darkened by overlay

**If Bug Occurs:**
```
┌────────────────────────────────────────────────────────┐
│                BLACK/80 OVERLAY                        │
│                                                        │
│            ┌─────────────────────┐                    │
│            │     MODAL           │                    │
│    ➕←────┼─────────────────────┼────  ← Row handle  │
│            │  [Content Here]     │      visible!      │
│            │                     │                    │
│            └─────────────────────┘                    │
│                                                        │
│  This should NOT happen! (z-index bug)                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Browser Console Check

**How to Check:**
1. Open browser DevTools: Press **F12** or **Cmd+Option+I** (Mac)
2. Switch to **Console** tab
3. Filter to show **Errors only**
4. Perform all modal tests
5. Check for red error messages

**Expected Result:**
```
Console (Errors only)
┌────────────────────────────────────────────────────────┐
│  No errors to display                                  │
│                                                        │
│  ✅ All tests passed with zero console errors         │
└────────────────────────────────────────────────────────┘
```

**Common Errors to Watch For:**
- ❌ `TypeError: Cannot read property 'x' of undefined`
- ❌ `Failed to fetch` (Drive API errors)
- ❌ `React Hook useEffect has missing dependency`
- ❌ `Warning: Each child in a list should have a unique "key" prop`

---

## Mobile Testing Shortcuts

**Chrome DevTools Mobile Emulation:**
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device: "iPhone 12 Pro" or "Pixel 5"
4. Test modals in mobile view

**Viewport Sizes to Test:**
- 375px (iPhone SE) - Small mobile
- 768px (iPad) - Tablet breakpoint
- 1024px (iPad Pro) - Large tablet
- 1920px (Desktop) - Desktop

---

## Quick Pass/Fail Checklist

Use this for rapid validation:

### Visual Consistency
- [ ] All modals have black/80 overlay (not white)
- [ ] All modals centered on screen
- [ ] All modals have smooth fade-in animation
- [ ] All modals have X button in top-right (except loading states)

### Keyboard Interactions
- [ ] ESC key closes all modals
- [ ] Tab key cycles through interactive elements
- [ ] Enter key activates focused button

### Mobile Responsiveness
- [ ] DriveFileBrowser fullscreen on mobile (<768px)
- [ ] All other modals scale appropriately
- [ ] Touch targets ≥56px (for mobile usability)

### Z-Index Hierarchy
- [ ] Table controls hidden behind modals
- [ ] No editor controls visible through overlay
- [ ] Settings button appears above everything

### Console Errors
- [ ] Zero errors during initial load
- [ ] Zero errors when opening modals
- [ ] Zero errors when interacting with modals
- [ ] Zero errors when closing modals

---

## Screenshot Guide

**Recommended Screenshots:**
1. WelcomeScreen (signed out state)
2. WelcomeScreen (signed in state)
3. AuthModal (user info displayed)
4. DriveFilePicker (loading state)
5. DriveFileBrowser (mobile view)
6. DriveFileBrowser (desktop view)
7. ImageUploader (no file)
8. ImageUploader (with preview)
9. Table z-index test (modal over table)
10. Console errors (if any)

**Save to:** `/docs/sprints/sprint-13/screenshots/`

---

## Troubleshooting

### Issue: White Overlay Instead of Black
**Fix:** Check `src/components/ui/dialog.tsx` line 22:
```tsx
className="fixed inset-0 z-50 bg-black/80..."
```

### Issue: Table Controls Visible Through Modal
**Fix:** Check z-index in `src/components/Editor.tsx`:
```tsx
z-index: 2 !important; /* Should be LESS than 50 */
```

### Issue: ESC Key Not Working
**Fix:** Check Dialog implementation:
```tsx
<Dialog open={true} onOpenChange={...}>
```

### Issue: Modal Not Centered
**Fix:** Check DialogContent className:
```tsx
className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]..."
```

---

**Visual Testing Guide v1.0**
**Sprint 13 - Modal Refactoring**
**Last Updated:** 2025-10-20
