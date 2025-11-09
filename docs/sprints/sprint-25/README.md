# Sprint 25: AI Chat Sidebar Expand/Collapse

**Sprint Duration**: 1-2 days (10-15 hours)
**Status**: 📋 PLANNING (Design Complete, Ready for Implementation)
**Feature**: Graceful expand/collapse interaction for AI chat sidebar on right side

---

## 🎯 Quick Start for AI Agents

**Reading Order**:
1. This README (sprint plan and implementation tasks)
2. `AI-SIDEBAR-EXPAND-COLLAPSE-UX-DESIGN.md` (detailed UX/UI design and rationale)

**Implementation Time**: 10-15 hours total

---

## 📊 Sprint Overview

### Problem Statement
**Current AI chat sidebar permanently occupies 256px of screen space**:
- ❌ No way to collapse/expand the sidebar
- ❌ Users cannot reclaim space for editor when AI not needed
- ❌ No visual affordance for sidebar control
- ❌ Inconsistent with left sidebar (which already has expand/collapse)
- ❌ Fixed width on small screens (no responsive adaptation)

**This impacts**:
- **User Experience**: Reduced editor space for writing
- **Discoverability**: No clear way to hide/show AI features
- **Mobile Usability**: 256px sidebar on narrow screens leaves little room for editor
- **Workspace Flexibility**: Users can't customize their layout

### Current State
- ✅ AI Chat Sidebar implemented (Sprint 23, Sprint 24)
- ✅ Left navigation sidebar has expand/collapse via `SidebarProvider`
- ✅ `Sheet` component has slide-in/out animations (300ms duration)
- ✅ `tailwindcss-animate` plugin available (no Framer Motion)
- ⚠️ AI sidebar is always 256px wide, no collapse functionality
- ❌ No responsive behavior for mobile/tablet

### Solution
**Implement expand/collapse with graceful transitions**:
1. ✅ **Edge tab/handle** (48px collapsed state) - Always visible
2. ✅ **Smooth width transition** (48px ↔ 256px, 300ms)
3. ✅ **Content fade animations** (200ms, coordinated with width)
4. ✅ **State persistence** (localStorage, global preference)
5. ✅ **Keyboard shortcut** (`Cmd/Ctrl + Shift + A`)
6. ✅ **Auto-expand on selection** (smart behavior for UX)
7. ✅ **Accessibility** (ARIA, focus management, screen readers)
8. ✅ **Responsive** (inline on all screen sizes, narrow on mobile)

---

## 🎯 Success Criteria

### Must Have
- [ ] **Basic Expand/Collapse**
  - [ ] Click collapsed tab (48px) → expands to 256px
  - [ ] Click header collapse button → collapses to 48px
  - [ ] Width transition: 300ms ease-in-out
  - [ ] No layout jank or content overflow

- [ ] **Collapsed Tab Design**
  - [ ] Minimal design: AI icon + selection indicator only
  - [ ] 48px width (`w-12`)
  - [ ] Vertical layout with centered icons
  - [ ] Selection indicator (amber pulse) when text selected
  - [ ] Hover state with tooltip

- [ ] **Expanded State**
  - [ ] Header shows collapse button (ChevronRight icon)
  - [ ] All current functionality preserved
  - [ ] Content fades in smoothly (200ms delay)

- [ ] **Content Fade Transitions**
  - [ ] Expanding: Content fades in after 50ms delay
  - [ ] Collapsing: Content fades out immediately, then width animates
  - [ ] No "flash" or visual glitches

- [ ] **State Persistence**
  - [ ] Default state: **COLLAPSED** (maximize editor space)
  - [ ] Save to localStorage: `ai-sidebar-state` = `"expanded"` | `"collapsed"`
  - [ ] Global preference (same across all documents)
  - [ ] Reset to default collapsed when switching documents

- [ ] **Auto-Expand on Selection**
  - [ ] When sidebar is collapsed AND user selects text → auto-expand
  - [ ] Show tooltip on first auto-expand: "AI Assistant expanded to show your selection"
  - [ ] Persist hint state: `ai-sidebar-auto-expand-hint-shown`

- [ ] **Keyboard Shortcut**
  - [ ] `Cmd/Ctrl + Shift + A` toggles sidebar
  - [ ] Works from anywhere (global listener)
  - [ ] Shown in tooltips and hints

- [ ] **Focus Management**
  - [ ] Expanding: Focus moves to input field (350ms after animation)
  - [ ] Collapsing: Focus returns to editor (450ms after animation)
  - [ ] Keyboard navigation works correctly

- [ ] **Accessibility (WCAG AA)**
  - [ ] `role="complementary"` on sidebar
  - [ ] `aria-expanded={isExpanded}` on container
  - [ ] `aria-label` on all buttons with context
  - [ ] Screen reader announces state changes
  - [ ] All interactive elements keyboard-accessible

### Should Have
- [ ] **Responsive Behavior**
  - [ ] Desktop (≥1024px): Inline sidebar, default collapsed
  - [ ] Tablet (768-1023px): Inline sidebar, default collapsed
  - [ ] Mobile (<768px): Inline sidebar, narrow width (keep inline per Q4-B)

- [ ] **Edge Case Handling**
  - [ ] No API key state: Show lock icon on collapsed tab
  - [ ] Loading state: Show spinner on collapsed tab
  - [ ] Empty messages: Show onboarding hints in expanded view
  - [ ] Rapid toggle clicks: Debounce to prevent animation stacking

- [ ] **Performance**
  - [ ] Smooth 60 FPS animations
  - [ ] No memory leaks during transitions
  - [ ] `will-change: width` hint for optimization
  - [ ] Respect `prefers-reduced-motion` (instant transitions)

### Nice to Have
- [ ] **Visual Polish**
  - [ ] Icon rotation (ChevronRight 0° ↔ 180°, 200ms)
  - [ ] Selection indicator pulse animation
  - [ ] Subtle scale animation on click (0.95 transform)

- [ ] **Onboarding**
  - [ ] Tooltip on first visit: "Expand AI Assistant (⌃⇧A)"
  - [ ] Dismissible hint: "Collapse sidebar for more space"

---

## 📋 Implementation Plan

### Phase 1: Core Functionality (3-4 hours)

**Goal**: Basic expand/collapse with smooth transitions

**Tasks**:
1. **Create `useAISidebar` hook** (`/src/components/hooks/use-ai-sidebar.ts`)
   - State: `isExpanded`, `isAnimating`
   - localStorage read/write (`ai-sidebar-state`)
   - `toggleSidebar()` function
   - Default: `collapsed`

2. **Update `AIChatSidebar.tsx`**
   - Import `useAISidebar` hook
   - Add conditional width: `isExpanded ? 'w-64' : 'w-12'`
   - Add transition: `transition-[width] duration-300 ease-in-out`
   - Render collapsed tab when `!isExpanded`
   - Render expanded content when `isExpanded`

3. **Create collapsed tab layout**
   - Vertical flexbox container (48px wide)
   - AI icon (BrainCircuit, 24px)
   - Selection indicator (Sparkles, 24px, amber, conditional)
   - Click handler → `toggleSidebar()`
   - Hover state: `hover:bg-muted/50`

4. **Update header for expanded state**
   - Add collapse button (ChevronRight icon, left side)
   - Adjust layout: `flex items-center gap-2`
   - Click handler → `toggleSidebar()`

**Acceptance Criteria**:
- ✅ Sidebar collapses to 48px on button click
- ✅ Sidebar expands to 256px on tab click
- ✅ Transition is smooth (300ms)
- ✅ State saves to localStorage
- ✅ No layout breaks or content overflow

---

### Phase 2: Content Fade & Polish (2-3 hours)

**Goal**: Smooth content transitions and visual refinement

**Tasks**:
1. **Implement content fade**
   - Wrap header, messages, input in fade container
   - Expanding: `opacity-0 → opacity-100` with 50ms delay
   - Collapsing: `opacity-100 → opacity-0` immediately
   - Use `pointer-events-none` when hidden

2. **Design collapsed tab icons**
   - AI icon: `BrainCircuit` (Lucide, 24px, `text-primary`)
   - Selection indicator: `Sparkles` (24px, `text-amber-500`, conditional)
   - Pulse animation on selection: `animate-pulse`
   - Vertical spacing: `gap-4`, `py-3`

3. **Add hover states**
   - Collapsed tab: `hover:bg-muted/50 transition-colors`
   - Tooltip: "Expand AI Assistant (⌃⇧A)"
   - Use `title` attribute or Tooltip component

4. **Icon animations (optional)**
   - ChevronRight rotation: `transition-transform duration-200`
   - `isExpanded ? 'rotate-0' : 'rotate-180'`

**Acceptance Criteria**:
- ✅ Content fades smoothly during transitions
- ✅ Collapsed tab shows AI icon + selection indicator
- ✅ Hover provides visual feedback
- ✅ Tooltips explain functionality
- ✅ No animation jank or content flash

---

### Phase 3: Smart Behaviors & State Management (2 hours)

**Goal**: Auto-expand, document switching, keyboard shortcuts

**Tasks**:
1. **Auto-expand on text selection**
   - Watch `liveSelection` prop in `useEffect`
   - If `!isExpanded && liveSelection && !liveSelection.isEmpty`
   - Call `toggleSidebar()` to auto-expand
   - Show tooltip: "AI Assistant expanded to show your selection"
   - Save hint state: `localStorage.setItem('ai-sidebar-auto-expand-hint-shown', 'true')`

2. **Reset state on document switch**
   - Watch `fileId` prop in `useEffect`
   - When `fileId` changes → reset to default `collapsed`
   - Clear input and messages (already implemented)

3. **Implement keyboard shortcut**
   - Global listener: `window.addEventListener('keydown')`
   - Detect: `(e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a'`
   - Call `toggleSidebar()`
   - `e.preventDefault()` to avoid conflicts

4. **Cleanup on unmount**
   - Remove event listeners
   - Clear animation timers

**Acceptance Criteria**:
- ✅ Sidebar auto-expands when text selected (if collapsed)
- ✅ Tooltip shows on first auto-expand
- ✅ Sidebar resets to collapsed when switching documents
- ✅ `Cmd/Ctrl + Shift + A` toggles sidebar
- ✅ No memory leaks or stale listeners

---

### Phase 4: Accessibility & Focus Management (2 hours)

**Goal**: WCAG AA compliance, keyboard navigation, screen readers

**Tasks**:
1. **Add ARIA attributes**
   - Container: `role="complementary"`
   - Container: `aria-label="AI Assistant Sidebar"`
   - Container: `aria-expanded={isExpanded}`
   - Buttons: Dynamic `aria-label` with context

2. **Implement focus management**
   - Expanding: Move focus to input field
     ```typescript
     setTimeout(() => inputRef.current?.focus(), 350)
     ```
   - Collapsing: Return focus to editor
     ```typescript
     setTimeout(() => editor.commands.focus(), 450)
     ```

3. **Screen reader announcements**
   - Create live region: `<div role="status" aria-live="polite">`
   - Announce: "AI Assistant expanded" / "AI Assistant collapsed"
   - Remove announcement after 1s (cleanup)

4. **Keyboard navigation**
   - Ensure Tab order is logical
   - Test with keyboard-only (no mouse)
   - Optional: `Escape` to collapse when focused

5. **Motion preferences**
   - Add CSS for `prefers-reduced-motion`:
     ```css
     @media (prefers-reduced-motion: reduce) {
       .ai-sidebar { transition-duration: 0ms !important; }
     }
     ```

**Acceptance Criteria**:
- ✅ ARIA attributes pass validation (axe DevTools)
- ✅ Screen readers announce state changes
- ✅ Focus moves logically during transitions
- ✅ All elements keyboard-accessible
- ✅ Reduced motion preference respected

---

### Phase 5: Responsive, Edge Cases, Testing (2-3 hours)

**Goal**: Handle all screen sizes and edge cases, thorough testing

**Tasks**:
1. **Responsive behavior (inline on all sizes per Q4-B)**
   - Desktop (≥1024px): Inline, 48px ↔ 256px
   - Tablet (768-1023px): Inline, 48px ↔ 256px
   - Mobile (<768px): Inline, 48px ↔ 256px (narrow but functional)
   - Test on various screen sizes

2. **Edge case handling**
   - **No API Key**: Show lock icon on collapsed tab
   - **Loading**: Show spinner on collapsed tab
   - **Empty messages**: Show hints in expanded view
   - **Long messages**: Test overflow behavior
   - **Rapid clicks**: Debounce toggle (prevent animation stacking)

3. **Performance optimization**
   - Add `will-change: width` during animation
   - Remove `will-change` when not animating
   - Test with React DevTools Profiler
   - Check for memory leaks (toggle 100 times)

4. **Cross-browser testing**
   - Chrome (desktop + mobile)
   - Firefox
   - Safari (desktop + iOS)
   - Edge

5. **Visual regression testing**
   - Compare before/after screenshots
   - Test dark mode (if applicable)
   - Check all breakpoints

**Acceptance Criteria**:
- ✅ Works on all screen sizes (mobile inline)
- ✅ No crashes in edge cases
- ✅ Smooth performance (60 FPS)
- ✅ No memory leaks
- ✅ Works in all supported browsers

---

### Phase 6: Documentation & Code Review (1-2 hours)

**Goal**: Update docs, clean code, prepare for PR

**Tasks**:
1. **Code cleanup**
   - Remove debug console.logs
   - Add JSDoc comments to hook
   - Ensure consistent naming
   - Format with Prettier

2. **Update user documentation**
   - User guide: How to expand/collapse sidebar
   - Mention keyboard shortcut
   - Update screenshots (if needed)

3. **Update changelog**
   - Add feature to `/docs/user-guide/changelog.md`
   - Version bump (if applicable)

4. **Code review**
   - Self-review for accessibility
   - Check bundle size (no new dependencies added)
   - Verify no regressions

**Acceptance Criteria**:
- ✅ Code is clean and well-commented
- ✅ Documentation updated
- ✅ Changelog entry added
- ✅ Ready for PR

---

## 🎨 Design Decisions (Approved)

Based on design review discussion:

### Visual Design
- **Q1: Edge Tab Design** → **A) 48px vertical pill** (minimal, always visible)
- **Q2: Animation Speed** → **A) 300ms** (matches existing Sheet component)
- **Q6: Collapsed Tab Content** → **Minimal** (AI icon + selection indicator only, no message count)

### State Management
- **Q3: State Persistence** → **Global** (same across all documents, simple and robust)
- **Default State** → **COLLAPSED** (maximize editor space by default)
- **Document Switch** → **Reset to collapsed** (don't keep state per document)
- **Auto-Expand** → **YES** (expand when text selected, show hint once)

### Responsive & Interaction
- **Q4: Mobile Pattern** → **B) Inline narrow** (keep inline on all screen sizes)
- **Q5: Keyboard Shortcut** → **A) Cmd/Ctrl + Shift + A** (mnemonic for AI)

### Technical
- **No new dependencies** - Uses existing `tailwindcss-animate`, Lucide icons
- **localStorage only** - No Netlify Blobs sync (keep simple)
- **Global keyboard listener** - Works from anywhere in app

---

## 📊 Technical Specifications

### Component Structure
```
AIChatSidebar.tsx (updated)
├── useAISidebar() hook (new)
│   ├── isExpanded state
│   ├── isAnimating state
│   ├── toggleSidebar()
│   └── localStorage persistence
├── Collapsed Tab (new, 48px)
│   ├── AI Icon (BrainCircuit)
│   ├── Selection Indicator (Sparkles, conditional)
│   └── Tooltip ("Expand AI Assistant")
└── Expanded Content (existing, 256px)
    ├── Header with collapse button (updated)
    ├── SelectionIndicator
    ├── Messages
    └── Input
```

### Animation Timeline

**Expanding (48px → 256px):**
```
Time:    0ms        50ms                    300ms
         │──────────│──────────────────────│
Width:   │ 48 ────────────────→ 256       │ (ease-in-out)
Content: │          │ opacity 0 → 1        │ (ease-out, delayed)
Icon:    │ rotate 180° → 0°                │ (ease-in-out)
```

**Collapsing (256px → 48px):**
```
Time:    0ms             200ms    250ms           450ms
         │───────────────│────────│───────────────│
Content: │ opacity 1 → 0 │        │               │
Width:   │               │        │ 256 → 48      │
Icon:    │ rotate 0° → 180°       │               │
```

### CSS Classes
```tsx
// Container
className={cn(
  "h-full border-l bg-background flex flex-col shrink-0",
  "transition-[width] duration-300 ease-in-out",
  isExpanded ? "w-64" : "w-12"
)}

// Content (Header, Messages, Input)
className={cn(
  "transition-opacity duration-200",
  isExpanded
    ? "opacity-100 delay-50"
    : "opacity-0 pointer-events-none"
)}

// Collapsed Tab
className="w-full h-full flex flex-col items-center py-3 gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
```

### localStorage Keys
```typescript
AI_SIDEBAR_STATE_KEY = 'ai-sidebar-state'
AI_SIDEBAR_STATE_VALUES = 'expanded' | 'collapsed'
AI_SIDEBAR_AUTO_EXPAND_HINT = 'ai-sidebar-auto-expand-hint-shown'
```

### Design Tokens
```typescript
// Dimensions
SIDEBAR_WIDTH_EXPANDED = '256px'  // w-64
SIDEBAR_WIDTH_COLLAPSED = '48px'  // w-12

// Timing
TRANSITION_DURATION = 300  // ms
CONTENT_FADE_DURATION = 200  // ms
CONTENT_FADE_IN_DELAY = 50  // ms
ICON_ROTATE_DURATION = 200  // ms

// Focus Delays
FOCUS_INPUT_DELAY = 350  // ms (after expand animation)
FOCUS_EDITOR_DELAY = 450  // ms (after collapse animation)
```

---

## 🚀 Dependencies & Files

### New Files
- `/ritemark-app/src/components/hooks/use-ai-sidebar.ts` - Custom hook for sidebar state

### Modified Files
- `/ritemark-app/src/components/ai/AIChatSidebar.tsx` - Add expand/collapse UI and logic
- `/ritemark-app/src/components/Editor.tsx` - Pass additional props if needed

### No New npm Packages
All functionality uses existing dependencies:
- ✅ `tailwindcss-animate` (already installed)
- ✅ `lucide-react` (already installed)
- ✅ React hooks (built-in)
- ✅ Web Crypto API (browser native)
- ✅ localStorage (browser native)

---

## 📝 Testing Checklist

### Manual Testing
- [ ] Click collapsed tab → expands smoothly
- [ ] Click collapse button → collapses smoothly
- [ ] `Cmd/Ctrl + Shift + A` toggles sidebar
- [ ] Auto-expands when text selected (if collapsed)
- [ ] Resets to collapsed when switching documents
- [ ] State persists on page reload
- [ ] Focus moves to input on expand
- [ ] Focus returns to editor on collapse
- [ ] Tooltip shows on first auto-expand
- [ ] Works on mobile (<768px)
- [ ] Works on tablet (768-1023px)
- [ ] Works on desktop (≥1024px)
- [ ] No layout breaks with long messages
- [ ] Rapid toggling doesn't break animations

### Accessibility Testing
- [ ] Tab navigation works logically
- [ ] Screen reader announces state changes
- [ ] All buttons have clear labels
- [ ] ARIA attributes pass axe DevTools
- [ ] `prefers-reduced-motion` works
- [ ] Keyboard-only navigation works

### Browser Testing
- [ ] Chrome (desktop)
- [ ] Chrome (mobile)
- [ ] Firefox
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Edge

### Performance Testing
- [ ] Smooth 60 FPS animations
- [ ] No memory leaks (toggle 100 times)
- [ ] No console errors/warnings
- [ ] Bundle size unchanged (no new deps)

---

## 🎯 Success Metrics (Post-Launch)

**Usage Analytics** (if tracked):
- % of users who collapse sidebar at least once
- % of sessions with sidebar collapsed vs expanded
- Auto-expand trigger rate (selections that trigger expansion)
- Keyboard shortcut usage rate

**UX Feedback**:
- User reports of improved writing focus
- Reduced complaints about screen space
- Discoverability of AI features

**Technical Metrics**:
- Animation performance (target: 60 FPS)
- State persistence success rate
- No increase in error rates

---

## 📚 Related Documentation

- `AI-SIDEBAR-EXPAND-COLLAPSE-UX-DESIGN.md` - Detailed UX/UI design rationale
- `/ritemark-app/src/components/ai/AIChatSidebar.tsx` - Current implementation
- `/ritemark-app/src/components/ui/sidebar.tsx` - Left sidebar pattern (reference)
- `/ritemark-app/src/components/ui/sheet.tsx` - Animation patterns (reference)

---

## 🎉 Ready to Implement!

All design decisions finalized. Proceed with Phase 1 implementation.
