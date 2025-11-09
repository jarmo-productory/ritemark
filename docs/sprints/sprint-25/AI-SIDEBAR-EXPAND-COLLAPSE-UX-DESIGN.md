# Sprint 25: AI Chat Sidebar Expand/Collapse - UX/UI Design

**Sprint Duration**: TBD
**Status**: 📋 Design Phase
**Feature**: Graceful expand/collapse interaction for AI chat sidebar

---

## 🎯 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Design Objectives](#design-objectives)
3. [UX Design Recommendations](#ux-design-recommendations)
4. [Visual Design Specifications](#visual-design-specifications)
5. [Animation & Transition Design](#animation--transition-design)
6. [State Management & Persistence](#state-management--persistence)
7. [Accessibility Considerations](#accessibility-considerations)
8. [Responsive Behavior](#responsive-behavior)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Design Tokens](#design-tokens)

---

## Current State Analysis

### Existing Implementation

**Component Structure:**
- **Main Component**: `/ritemark-app/src/components/ai/AIChatSidebar.tsx` (309 lines)
- **Parent Container**: `/ritemark-app/src/components/Editor.tsx` (lines 481-506)
- **Supporting**: `/ritemark-app/src/components/ai/SelectionIndicator.tsx`
- **UI Library**: `/ritemark-app/src/components/ui/sidebar.tsx` (shadcn/ui)

**Current Layout:**
```tsx
<div className="flex h-full">
  <div className="wysiwyg-editor flex-1 overflow-y-auto">
    <EditorContent editor={editor} />
  </div>
  {editor && <AIChatSidebar ... />}
</div>
```

**Fixed Dimensions:**
- **Width**: 256px (`w-64`)
- **Height**: 100% (`h-full`)
- **Behavior**: Always visible, no collapse functionality
- **Border**: Left border separates from editor
- **Flex**: `shrink-0` prevents shrinking

**Content Structure (Top to Bottom):**
1. **Header** - Title, description, reset button (`border-b p-4`)
2. **SelectionIndicator** - Live text selection preview (amber gradient)
3. **Messages Area** - Scrollable chat messages (`flex-1 overflow-y-auto`)
4. **Input Area** - Text input + send button (`border-t p-4`)

**Technology Stack:**
- **Styling**: Tailwind CSS (no CSS modules or styled-components)
- **Animations**: `tailwindcss-animate` plugin (no Framer Motion)
- **Theming**: CSS variables (`--primary`, `--background`, etc.)
- **State**: React local state + props from parent

**Related Components:**
- **Left Sidebar** (`AppSidebar`): Already has expand/collapse via `SidebarProvider`
- **Sheet Component**: Uses slide-in/slide-out animations from right (300ms duration)

### Key Issues Identified

1. ❌ **No Collapsibility** - Sidebar permanently occupies 256px of screen space
2. ❌ **Content Conflict** - Users cannot reclaim space for editor
3. ❌ **No Visual Affordance** - Nothing indicates the sidebar can be controlled
4. ❌ **Inconsistent Patterns** - Left sidebar collapses, right sidebar does not
5. ❌ **Fixed on Small Screens** - No responsive adaptation for tablets/mobile

---

## Design Objectives

### Primary Goals

1. **Maximize Editor Space** - Allow users to reclaim 208px (256px - 48px) when AI is not needed
2. **Maintain Discoverability** - Keep AI feature visible even when collapsed
3. **Provide Context Awareness** - Show selection state and notifications on collapsed tab
4. **Ensure Smooth Transitions** - Graceful, performant animations that feel intentional
5. **Preserve User Preference** - Remember collapse state across sessions

### Success Criteria

- ✅ Users can toggle sidebar with single click
- ✅ Animation feels smooth and responsive (no jank)
- ✅ Collapsed state clearly indicates AI is available
- ✅ Selection indicator works in both states
- ✅ State persists across page reloads
- ✅ Keyboard accessible with clear shortcuts
- ✅ Responsive behavior on mobile/tablet
- ✅ No loss of chat context when toggling

---

## UX Design Recommendations

### 1. Interaction Pattern: Progressive Disclosure

#### Collapsed State (Minimal - 48px width)

**Purpose**: Reclaim screen space while keeping feature discoverable

**Visual Elements:**
```
┌────┐
│ 🤖 │  ← AI icon (centered, 20px)
│────│
│    │  ← Spacer
│ 💬 │  ← Message count badge (if >0 messages)
│────│
│    │  ← Spacer
│ ⚡ │  ← Selection indicator (shows when text selected)
│    │
│ ⌃  │  ← Expand chevron (bottom, on hover)
└────┘
```

**Interaction:**
- **Click anywhere** on tab → Expand sidebar
- **Hover** → Show subtle background highlight + tooltip
- **Badge pulse** → Animate when new AI message arrives (while collapsed)

#### Expanded State (Current - 256px width)

**Purpose**: Full-featured AI assistant interface

**Visual Elements:**
- Keep current design (Header + Selection + Messages + Input)
- **Add**: Collapse button in header (chevron-left icon)

**Interaction:**
- **Click chevron** → Collapse sidebar
- **Keyboard shortcut** → Toggle state

---

### 2. Toggle Mechanism Options

#### Option A: Edge Tab/Handle ⭐ RECOMMENDED

**Visual Design:**
```
Editor Content                    ┌────┐
                                  │ 🤖 │
Lorem ipsum dolor sit amet,       │ AI │
consectetur adipiscing elit.      │    │
                                  │ 💬 │
                                  │    │
                                  │ ⚡ │
                                  └────┘
                                   48px
```

**Pros:**
- ✅ Always visible and discoverable
- ✅ Consistent with common drawer patterns (DevTools, Figma, VS Code)
- ✅ Clear visual affordance for interaction
- ✅ Can show notification badges and selection state
- ✅ Hover states provide additional context

**Cons:**
- ⚠️ Adds 48px minimum width even when collapsed
- ⚠️ Requires careful icon/badge layout design

**Implementation:**
- Vertical flexbox with centered icons
- Click handler on entire tab (large touch target)
- Tooltip on hover: "Expand AI Assistant (⌃⇧A)"

---

#### Option B: Header Button

**Visual Design:**
```
┌─────────────────────────────────┐
│ [◀] AI Assistant          [↻]  │
│ Ask me to edit your document    │
└─────────────────────────────────┘
```

**Pros:**
- ✅ Intuitive placement within existing header
- ✅ No additional visual elements needed
- ✅ Clear collapse action (chevron points to edge)

**Cons:**
- ⚠️ Only visible when expanded (no collapsed affordance)
- ⚠️ Requires edge tab for collapsed state anyway

**Implementation:**
- Add chevron button to header (left side, before title)
- Icon rotates 180° when state changes
- Pairs with Option A (both needed for full solution)

---

#### Option C: Keyboard Shortcut ⭐ COMPLEMENTARY

**Shortcut**: `Cmd/Ctrl + Shift + A` (AI Assistant)

**Pros:**
- ✅ Power user efficiency
- ✅ No visual clutter
- ✅ Quick toggle while editing

**Cons:**
- ⚠️ Low discoverability for new users
- ⚠️ Must be shown in UI (tooltip, help menu)

**Implementation:**
- Global keyboard listener
- Show shortcut in tooltip and collapsed tab
- Announce in onboarding tips

---

### 3. Recommended Approach

**Combination Strategy:**

1. **Primary**: Edge tab/handle (Option A) - Always visible
2. **Secondary**: Header collapse button (Option B) - When expanded
3. **Tertiary**: Keyboard shortcut (Option C) - Power users

**Why this works:**
- Covers all user types (discoverable for beginners, efficient for power users)
- Consistent with existing patterns in design tools and IDEs
- Provides multiple entry points without overwhelming the UI

---

## Visual Design Specifications

### Collapsed Tab Design

**Dimensions:**
- **Width**: 48px (`w-12`)
- **Height**: 100% (`h-full`)
- **Padding**: 12px vertical, 8px horizontal
- **Border**: Left border (`border-l border-border`)

**Component Structure:**
```tsx
<div className="w-12 h-full border-l bg-background flex flex-col items-center py-3 gap-4 cursor-pointer hover:bg-muted/50 transition-colors">
  {/* AI Icon */}
  <div className="w-6 h-6 text-primary">
    <BrainCircuit /> {/* Lucide icon */}
  </div>

  {/* Message Count Badge (conditional) */}
  {messageCount > 0 && (
    <div className="relative">
      <MessageCircle className="w-5 h-5 text-muted-foreground" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">
        {messageCount}
      </span>
    </div>
  )}

  {/* Selection Indicator (conditional) */}
  {hasSelection && (
    <div className="w-6 h-6 text-amber-500 animate-pulse">
      <Sparkles />
    </div>
  )}

  {/* Expand Chevron (bottom) */}
  <div className="mt-auto w-5 h-5 text-muted-foreground">
    <ChevronLeft />
  </div>
</div>
```

**States:**
- **Default**: `bg-background`
- **Hover**: `bg-muted/50` with smooth transition
- **Active/Clicked**: Brief scale animation `transform: scale(0.95)`

**Icons:**
- **AI**: `BrainCircuit` or `Sparkles` (Lucide, 24px)
- **Messages**: `MessageCircle` (Lucide, 20px)
- **Selection**: `Zap` or `Sparkles` (Lucide, 24px, amber-500)
- **Expand**: `ChevronLeft` (Lucide, 20px)

---

### Expanded Header Design

**Updated Header with Collapse Button:**
```tsx
<div className="border-b p-4">
  <div className="flex items-center justify-between">
    {/* Left: Collapse Button + Title */}
    <div className="flex items-center gap-2">
      <button
        onClick={onCollapse}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
        aria-label="Collapse AI Assistant"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <div>
        <h2 className="font-semibold">AI Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Ask me to edit your document
        </p>
      </div>
    </div>

    {/* Right: Reset Button */}
    {messages.length > 0 && (
      <button
        onClick={handleClearChat}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
        aria-label="Reset chat"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    )}
  </div>
</div>
```

**Changes from Current:**
- **Added**: Collapse button (ChevronRight icon) before title
- **Layout**: Flex row with gap for better spacing
- **Icon Direction**: ChevronRight points toward collapse direction

---

## Animation & Transition Design

### Motion Principles

**Duration Guidelines:**
- **Expanding**: 300ms (feels responsive, not rushed)
- **Collapsing**: 300ms (symmetric with expanding)
- **Content Fade**: 200-250ms (faster than width change)
- **Icon Rotation**: 200ms (snappy, clear state change)

**Easing Functions:**
- **Width Transition**: `ease-in-out` (smooth acceleration/deceleration)
- **Content Fade**: `ease-out` (quick start, gentle end)
- **Icon Rotation**: `ease-in-out` (matches width transition)

**Why 300ms?**
- Matches existing Sheet component pattern (`duration-300`)
- Perceived as smooth and intentional by users
- Fast enough to feel responsive, slow enough to track visually
- Google Material Design recommendation for complex transitions

---

### Transition Sequence

#### Expanding (Collapsed → Expanded)

**Timing Diagram:**
```
0ms                   300ms
│─────────────────────│
│ Width: 48 → 256px   │ (ease-in-out)
  │─────────────────│
  50ms         300ms
  │ Content: 0 → 1 │   (fade-in, delayed start)

│──────│
0ms   200ms
│ Icon Rotate 0→180° │  (ease-in-out)
```

**Step-by-Step:**
1. **T=0ms**: User clicks collapsed tab
   - Width transition starts: `48px → 256px` (300ms)
   - Chevron rotation starts: `0° → 180°` (200ms)
   - Content remains hidden (`opacity: 0`)

2. **T=50ms**: Content fade begins
   - Header, messages, input fade in (250ms)
   - Slight delay prevents "flash" during width change

3. **T=200ms**: Icon rotation completes
   - Chevron now points right (collapse direction)

4. **T=300ms**: Animation complete
   - Sidebar fully expanded
   - Content fully visible
   - Focus moves to input field

---

#### Collapsing (Expanded → Collapsed)

**Timing Diagram:**
```
0ms              200ms           450ms
│────────────────│───────────────│
│ Content: 1 → 0 │               │ (fade-out, immediate)
                 │ Width: 256→48│ (ease-in-out, delayed)
│──────│
0ms   200ms
│ Icon Rotate 180→0° │            (ease-in-out)
```

**Step-by-Step:**
1. **T=0ms**: User clicks collapse button
   - Content fade-out starts: `opacity 1 → 0` (200ms)
   - Chevron rotation starts: `180° → 0°` (200ms)
   - Width remains `256px`

2. **T=200ms**: Content hidden
   - Content fully transparent (`opacity: 0`)
   - Content set to `display: none` (prevent interaction)
   - Width transition starts: `256px → 48px` (250ms)

3. **T=200ms**: Icon rotation completes
   - Chevron now points left (expand direction)

4. **T=450ms**: Animation complete
   - Sidebar fully collapsed to 48px
   - Only tab icons visible
   - Focus returns to editor

---

### CSS Implementation

**Tailwind Classes:**
```tsx
// Sidebar Container
className={cn(
  "h-full border-l bg-background flex flex-col shrink-0",
  "transition-[width] duration-300 ease-in-out",
  isExpanded ? "w-64" : "w-12"
)}

// Content Container (Header, Messages, Input)
className={cn(
  "transition-opacity duration-200",
  isExpanded
    ? "opacity-100 delay-50"
    : "opacity-0 pointer-events-none"
)}

// Chevron Icon
className={cn(
  "transition-transform duration-200 ease-in-out",
  isExpanded ? "rotate-0" : "rotate-180"
)}
```

**Performance Optimization:**
```tsx
// Add will-change hint for width transition
style={{
  willChange: isAnimating ? 'width' : 'auto'
}}

// Prevent content from affecting layout when hidden
{isExpanded && (
  <div className="flex-1 overflow-hidden">
    {/* Chat content */}
  </div>
)}
```

---

## State Management & Persistence

### Local State Structure

```typescript
// AIChatSidebar.tsx
interface AIChatSidebarState {
  isExpanded: boolean          // Current collapse state
  isAnimating: boolean         // True during transition
  messageCount: number         // Unread/total messages
  lastInteraction: number      // Timestamp for auto-behavior
}

// Custom Hook
function useAISidebar() {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('ai-sidebar-state')
    return saved === 'collapsed' ? false : true // Default: expanded
  })

  const [isAnimating, setIsAnimating] = useState(false)

  const toggleSidebar = useCallback(() => {
    setIsAnimating(true)
    setIsExpanded(prev => {
      const newState = !prev
      // Persist to localStorage
      localStorage.setItem(
        'ai-sidebar-state',
        newState ? 'expanded' : 'collapsed'
      )
      return newState
    })

    // Reset animating flag after transition
    setTimeout(() => setIsAnimating(false), 300)
  }, [])

  return { isExpanded, isAnimating, toggleSidebar }
}
```

### Persistence Strategy

**Storage Key**: `ai-sidebar-state`
**Values**: `"expanded"` | `"collapsed"`
**Default**: `"expanded"` (first-time users see full feature)

**Why localStorage?**
- ✅ Persists across page reloads
- ✅ Per-browser/device preference (user-specific)
- ✅ Simple API, no backend needed
- ✅ Consistent with existing app patterns

**Alternative (Future):**
- Could sync to user settings in Netlify Blobs
- Would enable cross-device preference sync
- Requires user authentication (already available)

---

### Smart Behaviors (Optional Enhancements)

#### Auto-Expand on Selection

```typescript
// Auto-expand when user makes text selection (if collapsed)
useEffect(() => {
  if (!isExpanded && liveSelection && !liveSelection.isEmpty) {
    // User selected text while sidebar collapsed
    // Auto-expand to show selection context
    toggleSidebar()

    // Show hint to user (first time only)
    if (!localStorage.getItem('ai-sidebar-auto-expand-hint-shown')) {
      toast.info('AI Assistant expanded to show your selection')
      localStorage.setItem('ai-sidebar-auto-expand-hint-shown', 'true')
    }
  }
}, [liveSelection, isExpanded])
```

**Pros**: Contextual, helpful for new users
**Cons**: Could be surprising, might interrupt flow
**Recommendation**: Make opt-in via settings

---

#### Keep Collapsed State Per-Document

```typescript
// Different collapse state for different documents
const storageKey = `ai-sidebar-state-${fileId || 'default'}`
```

**Pros**: Remembers context (e.g., always collapsed for quick notes)
**Cons**: More complex, might confuse users
**Recommendation**: Use global state (simpler, more predictable)

---

## Accessibility Considerations

### Keyboard Navigation

**Shortcuts:**
- `Cmd/Ctrl + Shift + A`: Toggle sidebar (global)
- `Escape`: Collapse sidebar when focused (optional)
- `Tab`: Move focus between sidebar elements

**Implementation:**
```typescript
// Global keyboard listener
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Shift + A
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
      e.preventDefault()
      toggleSidebar()
    }

    // Escape to collapse (only if sidebar is focused)
    if (e.key === 'Escape' && isExpanded && sidebarRef.current?.contains(document.activeElement)) {
      toggleSidebar()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isExpanded, toggleSidebar])
```

**Keyboard Shortcut Conflicts:**
- ✅ `Cmd+Shift+A` doesn't conflict with common editor shortcuts
- ✅ Not used by TipTap editor or browser defaults
- ✅ Mnemonic: "A" for AI Assistant

---

### ARIA Attributes

```tsx
<div
  role="complementary"
  aria-label="AI Assistant Sidebar"
  aria-expanded={isExpanded}
  aria-controls="ai-chat-content"
  id="ai-sidebar"
  ref={sidebarRef}
>
  {/* Collapsed Tab */}
  {!isExpanded && (
    <button
      onClick={toggleSidebar}
      aria-label={`Expand AI Assistant. ${messageCount} messages. ${hasSelection ? 'Text selected.' : ''} Press Ctrl+Shift+A to toggle.`}
      className="w-full h-full"
    >
      {/* Icons */}
    </button>
  )}

  {/* Expanded Content */}
  {isExpanded && (
    <div id="ai-chat-content">
      {/* Header with collapse button */}
      <button
        onClick={toggleSidebar}
        aria-label="Collapse AI Assistant. Press Ctrl+Shift+A to toggle."
      >
        <ChevronRight />
      </button>
      {/* ... rest of content */}
    </div>
  )}
</div>
```

**Screen Reader Announcements:**
```typescript
// Announce state changes to screen readers
const announce = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.className = 'sr-only' // Visually hidden
  announcement.textContent = message
  document.body.appendChild(announcement)
  setTimeout(() => announcement.remove(), 1000)
}

// In toggleSidebar:
if (newState) {
  announce('AI Assistant expanded')
} else {
  announce('AI Assistant collapsed')
}
```

---

### Focus Management

**Expanding:**
```typescript
// When sidebar expands, move focus to input field
if (isExpanded && !prevExpanded) {
  setTimeout(() => {
    inputRef.current?.focus()
  }, 350) // After animation completes (300ms + 50ms buffer)
}
```

**Collapsing:**
```typescript
// When sidebar collapses, return focus to editor
if (!isExpanded && prevExpanded) {
  setTimeout(() => {
    editor.commands.focus()
  }, 450) // After collapse animation (450ms total)
}
```

**Focus Trap (Optional):**
- Prevent Tab from leaving sidebar when expanded
- Use `react-focus-lock` or manual implementation
- Useful for keyboard-only users

---

### Color Contrast & Visual Indicators

**WCAG AA Compliance:**
- All text must meet 4.5:1 contrast ratio
- Icons must be paired with text labels or tooltips
- Hover states must not rely solely on color

**Testing:**
```bash
# Check contrast ratios
# Icon: text-primary on bg-background
# Badge: text-primary-foreground on bg-primary
# Hover: text-foreground on bg-muted
```

**Motion Preferences:**
```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .ai-sidebar {
    transition-duration: 0ms !important;
  }
}
```

---

## Responsive Behavior

### Breakpoint Strategy

**Desktop (≥1024px - lg):**
- **Layout**: Inline sidebar (current behavior)
- **Default State**: Expanded (or user preference)
- **Interaction**: Click tab/button or keyboard shortcut
- **Transition**: Width animation (48px ↔ 256px)

**Tablet (768px - 1023px - md):**
- **Layout**: Inline sidebar
- **Default State**: Collapsed (save screen space)
- **Interaction**: Same as desktop
- **Consideration**: Editor + 256px sidebar = tight fit

**Mobile (<768px - sm):**
- **Layout**: Sheet overlay (like existing Sheet component)
- **Default State**: Hidden (no inline sidebar)
- **Trigger**: Floating Action Button (FAB) bottom-right
- **Transition**: Slide-in from right (Sheet animation)

---

### Implementation Example

```tsx
function AIChatSidebar({ editor, fileId, liveSelection, persistedSelection, onClearSelection }: AIChatSidebarProps) {
  const isMobile = useIsMobile() // Custom hook (already exists in codebase)
  const { isExpanded, toggleSidebar } = useAISidebar()

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <>
        {/* Floating Action Button */}
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50"
          aria-label="Open AI Assistant"
        >
          <BrainCircuit className="w-6 h-6" />
          {messageCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
              {messageCount}
            </span>
          )}
        </button>

        {/* Sheet Overlay */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            {/* Same content as expanded desktop view */}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop/Tablet: Inline sidebar with collapse
  return (
    <div className={cn(
      "h-full border-l bg-background flex flex-col shrink-0",
      "transition-[width] duration-300 ease-in-out",
      isExpanded ? "w-64" : "w-12"
    )}>
      {/* Collapsed or Expanded content */}
    </div>
  )
}
```

---

### Mobile-Specific Considerations

**Floating Action Button (FAB):**
- Position: `fixed bottom-4 right-4` (always accessible)
- Size: 56px × 56px (Material Design standard)
- Icon: BrainCircuit or Sparkles (clear AI identity)
- Badge: Message count (if > 0)
- Z-index: Above editor, below modals

**Sheet Behavior:**
- Full-width on mobile (`w-full`)
- Max-width on larger mobiles (`sm:max-w-md`)
- Backdrop overlay (`bg-black/50`)
- Swipe-to-dismiss (if supported by Sheet component)

**Performance:**
- Don't render inline sidebar on mobile (save resources)
- Lazy-load Sheet content (only when opened)
- Unmount Sheet when closed (free memory)

---

## Implementation Roadmap

### Phase 1: Core Functionality (3-4 hours)

**Goals:**
- ✅ Basic expand/collapse functionality
- ✅ Smooth width transition
- ✅ State persistence (localStorage)

**Tasks:**
1. Create `useAISidebar` hook
   - State management (isExpanded, isAnimating)
   - localStorage read/write
   - Toggle function with callbacks

2. Update `AIChatSidebar.tsx`
   - Add conditional width classes (`w-64` vs `w-12`)
   - Add transition classes (`transition-[width] duration-300`)
   - Create collapsed tab layout (icons only)

3. Update header layout
   - Add collapse button (ChevronRight icon)
   - Adjust spacing for new button

4. Test basic functionality
   - Click to expand/collapse
   - State persists on reload
   - No visual glitches

**Acceptance Criteria:**
- Sidebar collapses to 48px on button click
- Sidebar expands to 256px on tab click
- Transition takes ~300ms
- State saved to localStorage
- No content overflow or layout breaks

---

### Phase 2: Polish & Animation (2-3 hours)

**Goals:**
- ✅ Content fade transitions
- ✅ Collapsed tab design with icons
- ✅ Selection indicator on collapsed tab

**Tasks:**
1. Implement content fade
   - Add opacity transitions to header, messages, input
   - Delay fade-in on expand (50ms)
   - Immediate fade-out on collapse

2. Design collapsed tab
   - AI icon (BrainCircuit)
   - Message count badge (conditional)
   - Selection indicator (Sparkles, conditional)
   - Expand chevron (bottom)

3. Add hover states
   - Collapsed tab: `hover:bg-muted/50`
   - Tooltip on hover: "Expand AI Assistant (⌃⇧A)"

4. Icon animations
   - Chevron rotation (0° ↔ 180°)
   - Selection indicator pulse (when active)

**Acceptance Criteria:**
- Content fades smoothly during transitions
- Collapsed tab shows relevant icons/badges
- Hover states provide visual feedback
- Tooltips explain functionality
- No animation jank or flashing

---

### Phase 3: Keyboard & Accessibility (2 hours)

**Goals:**
- ✅ Keyboard shortcuts
- ✅ ARIA attributes
- ✅ Focus management
- ✅ Screen reader announcements

**Tasks:**
1. Implement keyboard shortcut
   - Global listener for `Cmd/Ctrl + Shift + A`
   - Prevent default browser behavior
   - Show shortcut in tooltips

2. Add ARIA attributes
   - `role="complementary"`
   - `aria-label="AI Assistant Sidebar"`
   - `aria-expanded={isExpanded}`
   - Dynamic button labels

3. Manage focus
   - Focus input on expand
   - Return focus to editor on collapse
   - Implement focus trap (optional)

4. Screen reader support
   - Announce state changes ("AI Assistant expanded")
   - Clear button labels with context
   - Keyboard navigation hints

**Acceptance Criteria:**
- Keyboard shortcut toggles sidebar
- Screen readers announce state changes
- Focus moves logically during transitions
- All interactive elements are keyboard-accessible
- ARIA attributes pass validation

---

### Phase 4: Responsive & Edge Cases (2-3 hours)

**Goals:**
- ✅ Mobile sheet overlay
- ✅ Tablet optimizations
- ✅ Edge case handling

**Tasks:**
1. Mobile implementation
   - Detect mobile with `useIsMobile` hook
   - Render FAB instead of inline sidebar
   - Use Sheet component for overlay
   - Transfer all content to Sheet

2. Tablet optimizations
   - Default to collapsed on md breakpoint
   - Test with various screen sizes
   - Ensure editor has enough space

3. Handle edge cases
   - No API key state (show in collapsed tab)
   - Loading state (spinner on tab)
   - Empty messages (show hint in expanded view)
   - Long messages (test overflow)

4. Performance testing
   - Rapid toggle clicks (debounce if needed)
   - Multiple documents (state doesn't leak)
   - Memory usage (no leaks during animations)

**Acceptance Criteria:**
- Mobile users see FAB + Sheet overlay
- Tablet users have good experience (enough space)
- No crashes or layout breaks in edge cases
- Smooth performance even with rapid interactions
- State correctly isolated per document

---

### Phase 5: Testing & Documentation (1-2 hours)

**Goals:**
- ✅ Manual testing across browsers
- ✅ Update user documentation
- ✅ Code review and refinement

**Tasks:**
1. Cross-browser testing
   - Chrome, Firefox, Safari (desktop)
   - iOS Safari, Chrome Mobile (mobile)
   - Edge (Windows)

2. Visual regression testing
   - Compare before/after screenshots
   - Test dark mode (if applicable)
   - Check all breakpoints

3. Update documentation
   - User guide: How to use expand/collapse
   - Changelog: Add new feature
   - README: Update screenshots if needed

4. Code review
   - Check for accessibility issues
   - Optimize bundle size (no new dependencies)
   - Remove debug code
   - Add JSDoc comments

**Acceptance Criteria:**
- Feature works in all supported browsers
- No visual regressions
- Documentation updated
- Code passes review (clean, well-commented)

---

### Total Estimated Time: 10-15 hours

**Breakdown:**
- Phase 1 (Core): 3-4 hours
- Phase 2 (Polish): 2-3 hours
- Phase 3 (A11y): 2 hours
- Phase 4 (Responsive): 2-3 hours
- Phase 5 (Testing): 1-2 hours

**Risk Buffer:** +20% (2-3 hours) for unforeseen issues

---

## Design Tokens

### Dimensions

```typescript
// Sidebar Widths
export const AI_SIDEBAR_WIDTH_EXPANDED = '256px'  // w-64
export const AI_SIDEBAR_WIDTH_COLLAPSED = '48px'  // w-12

// Transition Durations
export const AI_SIDEBAR_TRANSITION_DURATION = 300  // ms
export const AI_SIDEBAR_CONTENT_FADE_DURATION = 200  // ms
export const AI_SIDEBAR_ICON_ROTATE_DURATION = 200  // ms

// Animation Delays
export const AI_SIDEBAR_CONTENT_FADE_IN_DELAY = 50  // ms
export const AI_SIDEBAR_CONTENT_FADE_OUT_DELAY = 0  // ms
export const AI_SIDEBAR_WIDTH_COLLAPSE_DELAY = 50  // ms

// Z-Index Layers
export const AI_SIDEBAR_Z_INDEX = 10  // Below modals (50), above editor (0)
export const AI_SIDEBAR_FAB_Z_INDEX = 40  // Below modals, above editor UI
```

### Easing Functions

```typescript
// CSS Easing
export const AI_SIDEBAR_EASING = 'ease-in-out'
export const AI_SIDEBAR_CONTENT_EASING = 'ease-out'

// Cubic Bezier (if using custom easing)
export const AI_SIDEBAR_EASING_BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)'  // Material Design standard
```

### Breakpoints

```typescript
// Tailwind Breakpoints (from config)
export const BREAKPOINT_SM = 640   // px
export const BREAKPOINT_MD = 768   // px
export const BREAKPOINT_LG = 1024  // px
export const BREAKPOINT_XL = 1280  // px

// Feature-Specific Breakpoints
export const AI_SIDEBAR_MOBILE_BREAKPOINT = BREAKPOINT_MD  // <768px = mobile/overlay
export const AI_SIDEBAR_TABLET_BREAKPOINT = BREAKPOINT_LG  // 768-1023px = default collapsed
export const AI_SIDEBAR_DESKTOP_BREAKPOINT = BREAKPOINT_LG  // ≥1024px = default expanded
```

### Colors

```typescript
// Using CSS Variables (existing theme)
// No new colors needed - uses existing design system

// Collapsed Tab
background: 'hsl(var(--background))'
border: 'hsl(var(--border))'
icon: 'hsl(var(--primary))'
iconMuted: 'hsl(var(--muted-foreground))'

// Hover State
hoverBackground: 'hsl(var(--muted) / 0.5)'

// Selection Indicator
selectionColor: 'hsl(var(--amber-500))'  // or custom --selection-indicator

// Badge
badgeBackground: 'hsl(var(--primary))'
badgeForeground: 'hsl(var(--primary-foreground))'
```

### Icon Sizes

```typescript
// Collapsed Tab Icons
export const AI_SIDEBAR_ICON_SIZE = 24       // px (w-6 h-6)
export const AI_SIDEBAR_ICON_SIZE_SMALL = 20  // px (w-5 h-5)
export const AI_SIDEBAR_BADGE_SIZE = 12       // px (w-3 h-3)

// Header Icons (expanded)
export const AI_SIDEBAR_HEADER_ICON_SIZE = 16  // px (w-4 h-4)
```

### Spacing

```typescript
// Collapsed Tab Padding
export const AI_SIDEBAR_TAB_PADDING_Y = 12  // px (py-3)
export const AI_SIDEBAR_TAB_PADDING_X = 8   // px (px-2)
export const AI_SIDEBAR_TAB_GAP = 16        // px (gap-4)

// Header Padding (expanded)
export const AI_SIDEBAR_HEADER_PADDING = 16  // px (p-4)
export const AI_SIDEBAR_HEADER_GAP = 8       // px (gap-2)
```

### Local Storage Keys

```typescript
// Persistence
export const AI_SIDEBAR_STATE_KEY = 'ai-sidebar-state'
export const AI_SIDEBAR_STATE_EXPANDED = 'expanded'
export const AI_SIDEBAR_STATE_COLLAPSED = 'collapsed'

// Onboarding Hints
export const AI_SIDEBAR_HINT_AUTO_EXPAND = 'ai-sidebar-auto-expand-hint-shown'
export const AI_SIDEBAR_HINT_KEYBOARD = 'ai-sidebar-keyboard-hint-shown'
```

### Keyboard Shortcuts

```typescript
// Primary Toggle
export const AI_SIDEBAR_TOGGLE_KEY = 'a'
export const AI_SIDEBAR_TOGGLE_META = true   // Cmd/Ctrl
export const AI_SIDEBAR_TOGGLE_SHIFT = true  // Shift

// Visual Representation: Cmd/Ctrl + Shift + A

// Secondary Actions
export const AI_SIDEBAR_COLLAPSE_KEY = 'Escape'  // When focused
```

---

## Summary & Next Steps

### Key Design Decisions

1. **Pattern**: Edge tab/handle + header button (dual affordance)
2. **Dimensions**: 48px collapsed ↔ 256px expanded
3. **Animation**: 300ms width transition + 200ms content fade
4. **Persistence**: localStorage (`ai-sidebar-state`)
5. **Responsive**: Inline (desktop/tablet), Sheet overlay (mobile)
6. **Keyboard**: Cmd/Ctrl + Shift + A
7. **Default**: Expanded (for discoverability)

### Design Philosophy

- **Progressive Disclosure**: Show AI when needed, hide when not
- **User Control**: Respect user's workspace preferences
- **Consistency**: Match existing patterns (left sidebar, Sheet)
- **Performance**: Native CSS transitions (no JS animation library)
- **Accessibility**: Keyboard-first, screen reader friendly
- **Responsiveness**: Adaptive to screen size and device

### Success Metrics (Post-Launch)

- **Adoption**: % of users who collapse sidebar at least once
- **Preference**: % of sessions with sidebar collapsed vs expanded
- **Engagement**: Does collapse affect AI usage frequency?
- **Discoverability**: Do users find the collapsed tab intuitive?
- **Performance**: Animation smoothness (60 FPS target)

### Open Questions for Product Team

1. **Auto-Expand Behavior**: Should sidebar auto-expand when user selects text? (Opt-in or default?)
2. **Per-Document State**: Should collapse state be global or per-document?
3. **Mobile FAB Position**: Bottom-right corner or alternative placement?
4. **Onboarding**: Show tooltip/hint on first use? ("Collapse sidebar for more space")
5. **Analytics**: Track collapse/expand events for future optimization?

---

**Ready for Implementation!**
This design has been thoroughly researched and is aligned with existing codebase patterns, design system, and user needs. Proceed to development when approved.

---

## References

### Codebase Components
- `/ritemark-app/src/components/ai/AIChatSidebar.tsx`
- `/ritemark-app/src/components/Editor.tsx`
- `/ritemark-app/src/components/ui/sidebar.tsx`
- `/ritemark-app/src/components/ui/sheet.tsx`
- `/ritemark-app/src/components/hooks/use-sidebar.ts`
- `/ritemark-app/tailwind.config.ts`

### Design Patterns
- shadcn/ui Sidebar Component
- Radix UI Dialog/Sheet (for mobile overlay)
- Material Design Motion Guidelines
- WCAG 2.1 AA Accessibility Standards

### External References
- [Material Design: Motion](https://material.io/design/motion/speed.html)
- [WCAG 2.1 Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)
- [CSS Transitions on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
