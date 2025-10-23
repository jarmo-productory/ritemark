# Visual UX Patterns Summary - Quick Reference

## 🎨 Share Button Patterns

### Desktop Layout
```
┌─────────────────────────────────────────────────────┐
│ File  Edit  View  Format  ... [Doc Title]    Share │ ← Top-right
└─────────────────────────────────────────────────────┘
                                                  ↑
                                          Blue accent button
```

**Design Specifications:**
- **Position:** Top-right corner of header
- **Color:** `#3B82F6` (blue accent)
- **Size:** 32px height, auto width
- **Icon:** Share arrow or people icon (16px)
- **Text:** "Share" (14px medium)
- **Hover:** Darker blue `#2563EB`
- **Active:** Even darker `#1D4ED8`

### Mobile Layout
```
┌─────────────────┐
│  ☰  Doc Title  ⋮│ ← Share icon in top-right
└─────────────────┘
                  ↑
          Icon-only button
          Opens native sheet
```

**Mobile Specifications:**
- **Position:** Top-right (40px touch target)
- **Icon Only:** Share icon (24px)
- **Behavior:** Opens iOS/Android share sheet
- **Color:** Same blue accent

---

## 🔄 Offline Indicator Patterns

### Status Bar Location (Google Docs Style)
```
┌─────────────────────────────────────────────────────┐
│ ☁️ All changes saved to Drive                Share │
└─────────────────────────────────────────────────────┘
  ↑
  Left side of header
  Green checkmark when synced
```

### Bottom Status Bar (Obsidian Style)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│             [Document content]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
└─────────────────────────── 🟢 Synced ──────────────┘
                              ↑
                        Bottom-right corner
```

### Toast Notification (Notion Style)
```
                    ┌──────────────────────┐
                    │ 🔄 Syncing... 67%   │
                    │ Last saved 2 min ago│
                    └──────────────────────┘
                            ↑
                    Top-center toast
                    Auto-dismisses
```

**Visual States:**

| Status | Icon | Color | Message |
|--------|------|-------|---------|
| **Synced** | ✅ Checkmark | Green `#10B981` | "All changes saved to Drive" |
| **Syncing** | 🔄 Spinner | Yellow `#F59E0B` | "Saving... 67%" |
| **Offline** | ☁️ Cloud-off | Gray `#6B7280` | "Offline - changes saved locally" |
| **Error** | ⚠️ Alert | Red `#EF4444` | "Sync failed - retry?" |

---

## 📜 Version History Patterns

### Side Panel Layout (Google Docs)
```
┌────────────────────────────┬──────────────────────┐
│                            │ Version History      │
│                            │ ─────────────────────│
│                            │ [Restore this version]
│                            │                      │
│   Document Content         │ ▶ Today              │
│   (Preview Mode)           │   2:30 PM - You      │
│                            │   15 changes         │
│                            │                      │
│                            │ ▶ Yesterday          │
│                            │   4:15 PM - John Doe │
│                            │   8 changes          │
│                            │                      │
│                            │ ▶ Oct 19            │
│                            │   10:20 AM - You     │
└────────────────────────────┴──────────────────────┘
                              ↑
                        Right-side panel
                        300-400px wide
```

### Mobile Full-Screen Overlay
```
┌─────────────────────────────┐
│ ← Version History           │
├─────────────────────────────┤
│                             │
│ Today, 2:30 PM              │
│ Edited by You               │
│ 15 changes                  │
│ [View] [Restore]            │
│                             │
├─────────────────────────────┤
│                             │
│ Yesterday, 4:15 PM          │
│ Edited by John Doe          │
│ 8 changes                   │
│ [View] [Restore]            │
│                             │
└─────────────────────────────┘
        ↑
  Full-screen list
  Swipe to go back
```

**Version List Item:**
```
┌─────────────────────────────────────┐
│ 🕐 Today, 2:30 PM                   │ ← Relative timestamp
│ 👤 You                              │ ← Author
│ 📝 15 changes                       │ ← Change count
│                                     │
│ [Preview] [Restore]                 │ ← Actions
└─────────────────────────────────────┘
```

**Diff Preview (Desktop):**
```
┌─────────────────────────────────────┐
│ [Restore this version]              │ ← Prominent button
├─────────────────────────────────────┤
│                                     │
│ # Document Title                    │
│                                     │
│ This is unchanged text.             │
│ ⊖ This line was deleted.            │ ← Red strikethrough
│ ⊕ This line was added.              │ ← Green highlight
│ This is unchanged text.             │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

### RiteMark Header Structure
```
┌────────────────────────────────────────────────────┐
│ [Menu] [Logo] [Doc Title] │ [Offline] │ [Share]   │
│   ☰      📝    Untitled.md │  ✅ Saved │   Share   │
└────────────────────────────────────────────────────┘
   ↑       ↑        ↑           ↑            ↑
  Menu   Brand   Editable    Sync         Share
                  title      status       button
```

### File Menu Structure
```
File ▼
├─ New Document
├─ Open from Drive
├─ Save to Drive
├─ ───────────────
├─ Share...                    ⌘⇧S
├─ Version History ▶           ⌘⌥⇧H
│  ├─ See version history
│  └─ Name current version
├─ ───────────────
├─ Download as Markdown
├─ Export as PDF
└─ Print                       ⌘P
```

---

## 📱 Responsive Breakpoints

### Desktop (≥1024px)
```
┌──────────────────────────────────────────────┐
│ [Menu] RiteMark [Title]  ✅ Saved    [Share] │ Full header
│                                              │
│  Toolbar: [B] [I] [H1] [•] [1.] [Link] ...  │ Full toolbar
│                                              │
│  Editor content area                         │
└──────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌────────────────────────────────────┐
│ [☰] [Title]    ✅     [⋮]         │ Condensed
│                                    │
│  [B] [I] [H1] [•] [1.] [+]        │ Compact toolbar
│                                    │
│  Editor content                    │
└────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│ [☰] Untitled [⋮]│ Minimal header
│                  │
│  [B][I][H][•][+]│ Icon-only toolbar
│                  │
│  Editor          │
└──────────────────┘
```

---

## 🎨 Color System

### Sync Status Colors
```css
/* Synced - Green */
--sync-success-bg: #ECFDF5;
--sync-success-border: #10B981;
--sync-success-text: #065F46;

/* Syncing - Yellow */
--sync-progress-bg: #FFFBEB;
--sync-progress-border: #F59E0B;
--sync-progress-text: #92400E;

/* Offline - Gray */
--sync-offline-bg: #F3F4F6;
--sync-offline-border: #6B7280;
--sync-offline-text: #374151;

/* Error - Red */
--sync-error-bg: #FEF2F2;
--sync-error-border: #EF4444;
--sync-error-text: #991B1B;
```

### Share Button Colors
```css
/* Primary State */
--share-bg: #3B82F6;
--share-text: #FFFFFF;

/* Hover State */
--share-hover-bg: #2563EB;
--share-hover-text: #FFFFFF;

/* Active/Pressed */
--share-active-bg: #1D4ED8;
--share-active-text: #FFFFFF;

/* Focus Ring */
--share-focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.5);
```

---

## 🔤 Typography

### Share Button
```css
font-family: Inter, system-ui, sans-serif;
font-size: 14px;
font-weight: 500;
line-height: 20px;
letter-spacing: -0.01em;
```

### Sync Status
```css
font-family: Inter, system-ui, sans-serif;
font-size: 13px;
font-weight: 400;
line-height: 18px;
color: var(--sync-status-text);
```

### Version List
```css
/* Timestamp */
font-size: 14px;
font-weight: 500;
color: #111827;

/* Author */
font-size: 13px;
font-weight: 400;
color: #6B7280;

/* Change count */
font-size: 12px;
font-weight: 400;
color: #9CA3AF;
```

---

## ⚡ Animation Timing

### Sync Status Transitions
```css
/* State change animation */
transition: all 200ms ease-in-out;

/* Progress bar animation */
@keyframes sync-progress {
  0% { width: 0%; }
  100% { width: var(--progress); }
}
animation: sync-progress 300ms ease-out;

/* Pulse animation for "syncing" */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

### Modal/Panel Animations
```css
/* Slide in from right (version history) */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
animation: slide-in-right 300ms ease-out;

/* Fade in (share modal) */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fade-in 200ms ease-out;
```

---

## 🎯 Touch Target Sizes

### Mobile Minimum Sizes
```
Share button:    44px × 44px  ✅
Menu button:     44px × 44px  ✅
Toolbar icons:   40px × 40px  ✅
List items:      48px height  ✅
Restore button:  44px height  ✅
```

### Desktop Comfortable Sizes
```
Share button:    32px × auto  ✅
Sync status:     auto × 24px  ✅
Version item:    auto × 64px  ✅
```

---

## ♿ Accessibility Requirements

### Keyboard Navigation
```
Tab:          Focus share button
Enter/Space:  Activate button
Escape:       Close modal/panel
⌘⌥⇧H:         Open version history
Arrow keys:   Navigate version list
```

### ARIA Labels
```html
<!-- Share Button -->
<button
  aria-label="Share document with others"
  aria-haspopup="dialog"
>Share</button>

<!-- Sync Status -->
<div
  role="status"
  aria-live="polite"
  aria-label="Document sync status: All changes saved"
></div>

<!-- Version History -->
<nav aria-label="Document version history">
  <button
    aria-label="Version from 2 hours ago by John Doe, 15 changes"
  ></button>
</nav>
```

### Focus Indicators
```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* No outline for mouse clicks */
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 📊 Performance Metrics

### Loading Times
```
Share modal:         < 100ms  (lazy loaded)
Version list:        < 200ms  (initial 10 items)
Sync status update:  < 50ms   (real-time)
Diff calculation:    < 500ms  (on-demand)
```

### Bundle Sizes
```
Share component:      ~8 KB gzipped
Sync indicator:       ~3 KB gzipped
Version history:      ~15 KB gzipped (lazy loaded)
```

---

## 🧪 Testing Scenarios

### Share Button
- [ ] Click opens modal (desktop)
- [ ] Tap opens native sheet (mobile)
- [ ] Copy link works
- [ ] Keyboard accessible
- [ ] Screen reader announces

### Sync Status
- [ ] Shows "synced" when online
- [ ] Shows "syncing" with progress
- [ ] Shows "offline" when disconnected
- [ ] Toast on state change
- [ ] Timestamp updates

### Version History
- [ ] Opens from File menu
- [ ] Keyboard shortcut works
- [ ] List displays correctly
- [ ] Preview shows diff
- [ ] Restore works
- [ ] Confirmation before restore

---

**Visual Patterns Summary**
**Version:** 1.0
**Last Updated:** October 21, 2025
