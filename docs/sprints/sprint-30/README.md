# Sprint 30: UX Polish & Interaction Improvements

**Status:** Planned
**Priority:** High
**Sprint Goal:** Enhance user experience by fixing interaction issues and adding resizable UI components

## Overview

Sprint 30 focuses on critical UX improvements that address user workflow interruptions and provide better control over the workspace layout.

## Scope

### 1. Fix Autosave Closing Command Palette ⚠️ (Critical)

**Problem:**
- Aggressive 3-second autosave triggers state updates
- State updates cause command palette (slash commands) to close unexpectedly
- Interrupts user workflow when inserting headings, lists, tables, etc.

**Solution Approach:**
- Pause autosave while command palette is active
- Track command palette open/close state in SlashCommands extension
- Modify AutoSaveManager to check UI state before scheduling saves
- Resume autosave when palette closes

**Technical Details:**
```typescript
// Track command palette state
const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

// Modify SlashCommands.tsx onStart/onExit to update state
// Modify AutoSaveManager.scheduleSave() to check state before saving
```

**Files to Modify:**
- `src/extensions/SlashCommands.tsx` - Add state tracking
- `src/services/drive/autoSaveManager.ts` - Add pause mechanism
- `src/hooks/useDriveSync.ts` - Pass palette state to autosave

**Acceptance Criteria:**
- [ ] Command palette stays open during autosave cycle
- [ ] Autosave resumes after palette closes
- [ ] No data loss risk (pending saves execute after)
- [ ] Works with 3s debounce (no need to increase)

---

### 2. Resizable AI Chat Sidebar

**Problem:**
- Fixed-width AI chat sidebar (288px)
- Users need more space to read AI responses
- Limited screen real estate on smaller displays

**Solution Approach:**
- Add drag handle on left border of AI sidebar
- Allow horizontal resizing between min/max bounds
- Persist width preference in localStorage
- Smooth drag experience with visual feedback

**Technical Details:**
```typescript
// Resizable sidebar configuration
const MIN_WIDTH = 240 // px
const MAX_WIDTH = 600 // px
const DEFAULT_WIDTH = 288 // px (current)

// Drag handle on left edge
// Store width: localStorage.setItem('ai-sidebar-width', width)
```

**Files to Modify:**
- `src/components/ai/AIChatSidebar.tsx` - Add resize logic
- `src/index.css` - Add drag handle styling
- Create new hook: `src/hooks/useResizablePanel.ts` (reusable)

**Features:**
- Drag from left border to resize
- Min width: 240px (readable minimum)
- Max width: 600px (prevent consuming entire screen)
- Double-click border to reset to default
- Persist width across sessions
- Smooth resize animation
- Visual drag indicator (cursor change, border highlight)

**Acceptance Criteria:**
- [ ] Drag handle visible on left border of AI sidebar
- [ ] Smooth resize on drag (no jank)
- [ ] Width persists across page reloads
- [ ] Respects min/max bounds
- [ ] Double-click resets to default width
- [ ] Works on mobile (touch events)

---

## Implementation Plan

### Phase 1: Autosave Fix (Priority 1)
**Estimated Time:** 2-3 hours

1. **Research & Design** (30 min)
   - Review current autosave flow
   - Design state management for palette tracking
   - Identify edge cases

2. **Implementation** (1.5 hours)
   - Add command palette state tracking
   - Modify AutoSaveManager with pause mechanism
   - Wire up state to useDriveSync
   - Add unit tests

3. **Testing** (1 hour)
   - Manual testing with slash commands
   - Test autosave resume after palette closes
   - Edge case testing (rapid open/close, navigation, etc.)

### Phase 2: Resizable Sidebar (Priority 2)
**Estimated Time:** 3-4 hours

1. **Create Reusable Hook** (1 hour)
   - Build `useResizablePanel` hook
   - Handle mouse/touch events
   - Add localStorage persistence
   - Unit tests

2. **Integrate with AI Sidebar** (1 hour)
   - Add drag handle UI
   - Wire up resize logic
   - Add visual feedback

3. **Polish & Testing** (1-2 hours)
   - Smooth animations
   - Edge case handling (min/max)
   - Cross-browser testing
   - Mobile testing

---

## Technical Considerations

### Autosave Pause Mechanism
**Options:**
1. **Global state** (Context API) - More complex, but allows pausing for any UI
2. **Ref-based tracking** - Simpler, less re-renders
3. **Event-based** - Emit events on palette open/close

**Recommended:** Ref-based with Context fallback for future extensibility

### Resizable Panel Implementation
**Libraries to Consider:**
- `react-resizable-panels` - Well-maintained, accessible
- Custom implementation - More control, smaller bundle

**Recommended:** Custom implementation using `useResizablePanel` hook for:
- Full control over behavior
- Smaller bundle size
- Reusable for other panels (future: editor width, sidebars)

---

## Success Metrics

**User Experience:**
- ✅ No command palette interruptions during typing
- ✅ Users can customize workspace layout
- ✅ Improved productivity with larger AI response area

**Technical:**
- ✅ No increase in autosave debounce time
- ✅ No data loss risk
- ✅ Smooth 60fps resize performance
- ✅ Works across all supported browsers

---

## Future Enhancements (Out of Scope)

- Resizable editor width (separate from sidebar)
- Save layout presets
- Multi-panel layouts
- Keyboard shortcuts for resize
- Accessibility improvements (screen reader announcements)

---

## Related Documentation

- [AutoSaveManager Service](../../architecture/auto-save.md)
- [TipTap Extensions](../../architecture/tiptap-extensions.md)
- [UI State Management](../../architecture/state-management.md)

---

## Notes

- **Breaking Changes:** None
- **Migration Required:** No
- **Feature Flags:** Consider adding `ENABLE_RESIZABLE_SIDEBAR` flag for gradual rollout
- **Analytics:** Track sidebar resize events to understand usage patterns

---

**Created:** 2025-11-17
**Sprint Duration:** TBD
**Assigned:** Claude Code + User Review
