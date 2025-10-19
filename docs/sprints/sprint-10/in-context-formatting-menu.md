# Sprint 10: In-Context Formatting Menu

**Sprint Duration:** 7-10 days
**Sprint Goal:** Deliver a contextual formatting toolbar that appears on text selection
**Sprint Output:** 1 PR adding a TipTap bubble menu with contextual commands across desktop and touch
**Success Criteria:** Users can format selected text without leaving the writing surface, with invisible-interface consistency across devices

---

## 🎯 Sprint Vision & User Impact

### The Problem: Formatting requires hidden shortcuts
- Visual writers have no discoverable way to format text today
- Keyboard shortcuts exist for power users only and are undocumented
- Leaving the editor to find controls breaks the invisible-interface focus

### The Solution: Contextual bubble menu
- Bubble menu appears above a text selection with core formatting actions
- Fades away when the selection changes, keeping the canvas chrome-free
- Adapts to touch contexts with offset or fallback placement

**User Benefits:**
- Immediate, discoverable formatting without keyboard mnemonics
- Maintains the Johnny Ive invisible-interface philosophy (appears only when needed)
- Aligns with Medium/Notion mental models, aiding onboarding for non-technical users

---

## 🔧 Dependency Analysis

### ⚠️ Version Compatibility Verification (Web-Checked 2025-10-10)

**CRITICAL: All versions verified for compatibility to avoid debugging hell**

#### React 19 + TipTap 3.6.5 Compatibility ✅
- **Status**: Generally compatible but with known caveats
- **Known Issues**:
  - `NodeViewWrapper` can break React error boundaries ([GitHub #7033](https://github.com/ueberdosis/tiptap/issues/7033))
  - `isActive()` for Link extension may lag by one render ([GitHub #6626](https://github.com/ueberdosis/tiptap/issues/6626))
- **Mitigations**:
  - Avoid wrapping TipTap components in error boundaries
  - Use `editor?.isActive('link')` with optional chaining to handle undefined states
  - TipTap 3.6.6 (latest) has active React 19 support improvements

#### Tailwind CSS v3.4.18 + TipTap BubbleMenu ✅
- **Status**: **Fully compatible** (verified via community implementations)
- **Evidence**:
  - [minimal-tiptap](https://github.com/Aslam97/minimal-tiptap) uses Tailwind v3 + BubbleMenu successfully
  - TipTap docs confirm `HTMLAttributes` works with Tailwind classes
  - shadcn/ui TipTap integrations ([allshadcn.com](https://allshadcn.com/tools/shadcn-tiptap/)) use Tailwind v3
- **Note**: **DO NOT UPGRADE to Tailwind v4** - shadcn/ui sidebar components break with v4 (as documented in CLAUDE.md)

#### Radix UI Tooltip 1.2.8 + React 19 ✅
- **Status**: Compatible with React 19
- **Evidence**:
  - Radix UI 1.2.8 (latest) removes peer dependency warnings for React
  - No reported incompatibilities with React 19 in recent releases
  - shadcn/ui uses Radix UI Tooltip successfully with React 19

#### TipTap BubbleMenu + shadcn/ui Integration ✅
- **Status**: **Verified working** via community implementations
- **Production Examples**:
  - [Aslam97/minimal-tiptap](https://github.com/Aslam97/minimal-tiptap) - shadcn CLI installable
  - [Shadcn TipTap by Niaz Morshed](https://allshadcn.com/tools/shadcn-tiptap/) - Pre-built extensions for shadcn/ui
- **Pattern**: Use `editorProps.attributes.class` for Tailwind styling

#### Tippy.js (BubbleMenu Positioning) ✅
- **Status**: Built-in via TipTap BubbleMenu extension
- **Version**: Bundled with `@tiptap/extension-bubble-menu@3.6.5`
- **No additional dependency required** - BubbleMenu uses Tippy.js internally

### ✅ Final Compatibility Assessment
**All dependencies are compatible with current stack:**
- ✅ React 19.1.1
- ✅ TipTap 3.6.5 (with minor known issues documented above)
- ✅ Tailwind CSS 3.4.18 (v3 locked for shadcn compatibility)
- ✅ Radix UI 1.2.8
- ✅ shadcn/ui components

### TipTap Extensions (Already Installed)
- **`@tiptap/extension-bubble-menu@3.6.5`** (via `@tiptap/react@3.6.5`) - Core bubble menu component
- **`@tiptap/extension-link@3.6.5`** - Link formatting support (not yet configured in Editor.tsx)
- **`@tiptap/react@3.6.5`** - React bindings for TipTap editor
- **`@tiptap/starter-kit@3.6.5`** - Base formatting commands (bold, italic, headings)
- **`@tiptap/extension-code-block-lowlight@3.6.5`** - Code block support
- **`@tiptap/extension-bullet-list@3.6.5`** - Bullet list formatting
- **`@tiptap/extension-ordered-list@3.6.5`** - Numbered list formatting

### UI Dependencies (shadcn/ui + Radix)
- **`@radix-ui/react-tooltip@1.2.8`** - Accessible tooltips for button hints
- **`lucide-react@0.544.0`** - Icon library for formatting buttons
- **`tailwindcss@3.4.18`** - Styling system (v3 locked for shadcn compatibility)
- **`tailwindcss-animate@1.0.7`** - Animation utilities for transitions

### Existing Patterns to Reuse
1. **Editor Event Subscriptions** (`TableOfContentsNav.tsx:83-87`)
   - Pattern: `editor.on('update', callback)` with cleanup via `editor.off('update', callback)`
   - Ensures no memory leaks from event listeners
   - Example: BubbleMenu should subscribe to selection changes similarly

2. **ProseMirror State Access** (`TableOfContentsNav.tsx:40-65`)
   - Use `editor.state.doc.descendants()` for node traversal
   - Use `editor.view.coordsAtPos()` for positioning calculations
   - Pattern proven for accurate DOM-independent positioning

3. **Autosave Debounce** (`useDriveSync.ts:174-182`)
   - 3-second debounce via `AutoSaveManager`
   - BubbleMenu commands must trigger `onChange` which flows through debounce
   - No direct Drive API calls from BubbleMenu component

4. **Component Memoization** (`TableOfContentsNav.tsx:25-31`)
   - Use `useCallback` for stable function references
   - Prevents unnecessary re-renders when editor updates

### Integration Points
- **Editor.tsx:90-99** - `onEditorReady` fires on create AND update (must handle idempotency)
- **AppShell.tsx:42** - Editor instance passed to sidebar components via props
- **useDriveSync.ts:187-191** - Content changes trigger autosave via `onChange` callback

---

## 📐 Detailed Technical Specification

### Component Architecture

#### Primary Component: `FormattingBubbleMenu.tsx`
```typescript
interface FormattingBubbleMenuProps {
  editor: TipTapEditor | null
}

export function FormattingBubbleMenu({ editor }: FormattingBubbleMenuProps) {
  // Component wraps TipTap's BubbleMenu with custom UI
}
```

**Responsibilities:**
- Render TipTap `BubbleMenu` component with custom children
- Provide formatting buttons with command execution
- Manage link prompt state (open/closed, URL input value)
- Handle keyboard navigation (Tab, Esc, Enter)
- Apply invisible-interface styling (muted, minimal)

#### Sub-Component: `LinkPrompt.tsx` (Inline URL Input)
```typescript
interface LinkPromptProps {
  editor: TipTapEditor
  onClose: () => void
  existingUrl?: string
}

export function LinkPrompt({ editor, onClose, existingUrl }: LinkPromptProps) {
  // Minimalist input for URL with confirm/cancel
}
```

**Responsibilities:**
- Capture URL input with validation (`https://` prefix enforcement)
- Apply link to current selection via `editor.chain().setLink({ href: url }).run()`
- Remove link via `editor.chain().unsetLink().run()`
- Handle Esc to close, Enter to confirm

### TipTap BubbleMenu API Integration

#### Configuration Pattern
```typescript
import { BubbleMenu } from '@tiptap/react'

<BubbleMenu
  editor={editor}
  tippyOptions={{
    duration: 100,
    placement: 'top',
    offset: [0, 8], // 8px above selection
    maxWidth: 'none',
  }}
  shouldShow={({ editor, view, state, from, to }) => {
    // Show only for non-empty text selections
    const { doc, selection } = state
    const { empty } = selection

    // Hide in code blocks
    if (editor.isActive('codeBlock')) return false

    // Hide for empty selections
    if (empty) return false

    return true
  }}
>
  {/* Custom formatting buttons */}
</BubbleMenu>
```

#### Key Configuration Properties
- **`tippyOptions.duration`**: 100ms fade (meets <150ms requirement)
- **`tippyOptions.placement`**: `'top'` for desktop, `'bottom'` for mobile (adaptive)
- **`tippyOptions.offset`**: `[0, 8]` provides 8px clearance above selection
- **`shouldShow`**: Guards against code blocks and empty selections

### Link Extension Configuration

#### Add to Editor.tsx Extensions Array
```typescript
import Link from '@tiptap/extension-link'

extensions: [
  // ... existing extensions
  Link.configure({
    openOnClick: false, // Prevent accidental navigation
    HTMLAttributes: {
      class: 'tiptap-link',
    },
    validate: (url) => {
      // Enforce https:// prefix
      return url.startsWith('https://') || url.startsWith('http://')
    },
  }),
]
```

### State Management Strategy

#### Local State (within FormattingBubbleMenu)
```typescript
const [showLinkPrompt, setShowLinkPrompt] = useState(false)
const [linkUrl, setLinkUrl] = useState('')
```

**Why Local State:**
- Link prompt is ephemeral UI (no need for global state)
- Menu visibility controlled by TipTap's BubbleMenu `shouldShow`
- Active formatting states queried directly from `editor.isActive('bold')`, etc.

#### No Redux/Context Needed
- Editor instance passed via props (already available in AppShell)
- Formatting commands are synchronous (`editor.chain().toggleBold().run()`)
- No async operations requiring loading states

### Command Execution Pattern

#### Formatting Buttons
```typescript
const handleBold = () => {
  editor?.chain().focus().toggleBold().run()
}

const handleHeading = (level: 1 | 2 | 3) => {
  editor?.chain().focus().toggleHeading({ level }).run()
}

const handleClearFormatting = () => {
  editor?.chain().focus().clearNodes().unsetAllMarks().run()
}
```

#### Active State Detection
```typescript
const isBold = editor?.isActive('bold') ?? false
const isItalic = editor?.isActive('italic') ?? false
const isHeading2 = editor?.isActive('heading', { level: 2 }) ?? false
```

### Mobile Adaptation Strategy

#### Detect Touch Device
```typescript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
```

#### Adaptive Placement
```typescript
tippyOptions={{
  placement: isTouchDevice ? 'bottom' : 'top',
  offset: isTouchDevice ? [0, 16] : [0, 8], // Extra offset for touch handles
}}
```

#### Fallback: Bottom Sheet (Future Enhancement)
If BubbleMenu positioning fails on mobile (overlaps with handles):
- Detect via viewport constraints
- Render alternative fixed-bottom toolbar
- Slide-in animation from bottom edge
- **Not required for MVP** - document findings during testing

### Performance Considerations

#### Memoization Strategy
```typescript
const formatButtons = useMemo(() => [
  { command: 'bold', icon: Bold, label: 'Bold' },
  { command: 'italic', icon: Italic, label: 'Italic' },
  // ... other buttons
], [])

const handleCommand = useCallback((command: string) => {
  editor?.chain().focus().toggleMark(command).run()
}, [editor])
```

**Why:**
- Button array doesn't change (stable reference)
- Command handler only re-creates when editor instance changes
- Prevents re-renders on every editor update

#### Avoid Layout Thrash
- Use `transform` for animations (GPU-accelerated)
- Avoid `top`/`left` changes during transitions
- Rely on Tippy.js for positioning (handles RAF internally)

### Keyboard Navigation Implementation

#### Focus Trap Pattern
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    setShowLinkPrompt(false)
    editor?.chain().focus().run()
  }

  if (e.key === 'Tab') {
    // Cycle through buttons (handled by native focus)
    // No custom logic needed if buttons are focusable
  }
}
```

#### ARIA Attributes
```typescript
<div role="toolbar" aria-label="Text formatting">
  <button
    aria-pressed={isBold}
    aria-label="Bold"
    onClick={handleBold}
  >
    <Bold size={16} />
  </button>
</div>
```

---

## 📋 Requirements Specification

### 1. Selection-triggered Bubble Menu
- Use TipTap `BubbleMenu` (or equivalent) bound to the existing editor instance
- Render menu only when the selection is non-empty and not within disallowed nodes (e.g., code blocks)
- Guard against duplicate event bindings by respecting `onEditorReady` firing on create/update
- Apply subtle show/hide animation (<150 ms) with opacity/scale to keep transitions calm

### 2. Formatting Command Coverage
- Provide buttons for **Bold**, **Italic**, **Heading levels 1–3**, **Bullet list**, **Ordered list**, and **Code block toggle**
- Include a simple **Clear formatting** action to reset inline styles when needed
- Reflect active state per command (e.g., toggle button appearance when selection already bold)
- Reuse TipTap command API; ensure markdown round-trip remains intact via existing Turndown logic

### 3. Inline Link Creation & Editing
- Enable TipTap `Link` extension with configuration that enforces `https://` prefixes
- Bubble action opens a minimalist inline prompt (URL input + confirm/cancel) positioned near selection
- Allow removing links via the same control without exposing raw markdown
- Validate input and surface friendly error messaging without breaking invisible-interface tone

### 4. Invisible-Interface Styling
- Match editor typography, keeping controls muted (neutral background, soft shadow)
- Avoid labels when icons are self-explanatory; supply accessible tooltips for assistive tech only
- Auto-hide when pointer leaves the selection for >1 s or user presses `Esc`
- Respect light/dark preferences if future themes are introduced (keep palettes tokenized)

### 5. Mobile & Touch Behaviour
- Offset the bubble vertically to avoid overlapping native selection handles (iOS/Android)
- If viewport constraints prevent safe placement, pivot to a bottom anchored sheet that slides in/out
- Ensure 44 px minimum tap targets with generous spacing and no hover-only interactions
- Document findings from the mobile spike for future reuse

### 6. Accessibility & Keyboard Support
- Provide keyboard navigation (Tab/Shift+Tab cycling, Enter/Space to activate, Esc to dismiss)
- Use `role="toolbar"` with grouped buttons and ARIA pressed state for toggles
- Maintain focus order that returns to the editor after dismissal without breaking typing flow
- Include unit/integration tests covering keyboard workflows and screen-reader announcements

### 7. Sync & Performance Safeguards
- Bubble menu must not interfere with Drive sync indicators or delay autosave debounce
- Reuse existing styling utilities to prevent layout thrash and keep typing latency <16 ms
- Monitor for unnecessary re-renders; memoize menu component where appropriate

---

## 🚀 Step-by-Step Implementation Plan (Incremental with Validation Gates)

**Philosophy: Build → Test → Validate → Next Step (NO jumping ahead)**

### Phase 1: Foundation Setup (1-2 hours)
**Goal: Get Link extension working WITHOUT BubbleMenu first**

#### Step 1.1: Configure Link Extension in Editor.tsx
```typescript
// Add Link import
import Link from '@tiptap/extension-link'

// Add to extensions array (line ~87)
Link.configure({
  openOnClick: false,
  HTMLAttributes: { class: 'tiptap-link' },
  validate: (url) => url.startsWith('https://') || url.startsWith('http://'),
}),
```

**Validation Gate 1.1:**
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] Browser console has NO errors at localhost:5173
- [ ] Can manually create link via browser console: `editor.chain().focus().setLink({ href: 'https://example.com' }).run()`

#### Step 1.2: Test Link Extension with Manual Commands
```bash
# In browser console at localhost:5173
# 1. Select some text manually
# 2. Run: window.__editor.chain().focus().setLink({ href: 'https://example.com' }).run()
# 3. Verify text becomes blue link
# 4. Run: window.__editor.isActive('link') // Should return true
```

**Validation Gate 1.2:**
- [ ] Link styling appears (blue text, underline)
- [ ] Clicking link DOES NOT navigate (openOnClick: false works)
- [ ] `isActive('link')` returns correct boolean
- [ ] Link roundtrips through markdown (save → reload → link still works)

**⚠️ STOP HERE IF VALIDATION FAILS - Debug before continuing**

---

### Phase 2: Minimal BubbleMenu (2-3 hours)
**Goal: Get empty BubbleMenu appearing on selection**

#### Step 2.1: Create Minimal BubbleMenu Component
```typescript
// File: ritemark-app/src/components/FormattingBubbleMenu.tsx
import { BubbleMenu } from '@tiptap/react'
import type { Editor as TipTapEditor } from '@tiptap/react'

interface FormattingBubbleMenuProps {
  editor: TipTapEditor | null
}

export function FormattingBubbleMenu({ editor }: FormattingBubbleMenuProps) {
  if (!editor) return null

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top' }}
    >
      <div className="bg-white border rounded shadow-lg p-2">
        TEST BUBBLE MENU
      </div>
    </BubbleMenu>
  )
}
```

#### Step 2.2: Wire BubbleMenu into App.tsx (or wherever Editor is rendered)
```typescript
import { FormattingBubbleMenu } from './components/FormattingBubbleMenu'

// Inside component render:
<Editor value={content} onChange={handleChange} onEditorReady={setEditor} />
<FormattingBubbleMenu editor={editor} />
```

**Validation Gate 2.1:**
- [ ] Type-check passes
- [ ] Dev server starts without errors
- [ ] Browser console clean (NO React errors)
- [ ] Select text → "TEST BUBBLE MENU" appears above selection
- [ ] Deselect text → menu disappears
- [ ] Menu positions correctly above selection (not at top of page)

**⚠️ STOP HERE IF MENU DOESN'T APPEAR - Check editor instance passing**

#### Step 2.3: Test Menu Lifecycle
```bash
# Manual browser tests:
# 1. Select text slowly → menu should appear smoothly
# 2. Change selection → menu should reposition
# 3. Click outside editor → menu should disappear
# 4. Select inside code block → menu should NOT appear (add shouldShow logic)
```

**Validation Gate 2.2:**
- [ ] Menu appears/disappears smoothly (no flicker)
- [ ] Menu follows selection changes
- [ ] Menu hides in code blocks (implement `shouldShow`)

---

### Phase 3: Add Formatting Buttons (3-4 hours)
**Goal: Bold, Italic, Headings work from BubbleMenu**

#### Step 3.1: Add Basic Formatting Buttons
```typescript
import { Bold, Italic, Heading1, Heading2 } from 'lucide-react'

// Inside BubbleMenu children:
<div className="flex gap-1 bg-white border rounded shadow-lg p-2">
  <button
    onClick={() => editor.chain().focus().toggleBold().run()}
    className={editor.isActive('bold') ? 'bg-blue-100' : ''}
  >
    <Bold size={16} />
  </button>
  <button
    onClick={() => editor.chain().focus().toggleItalic().run()}
    className={editor.isActive('italic') ? 'bg-blue-100' : ''}
  >
    <Italic size={16} />
  </button>
  <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
    <Heading1 size={16} />
  </button>
  <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
    <Heading2 size={16} />
  </button>
</div>
```

**Validation Gate 3.1:**
- [ ] Bold button makes text bold
- [ ] Bold button highlights when text is bold (isActive works)
- [ ] Italic button works + active state correct
- [ ] H1/H2 buttons convert selection to headings
- [ ] Formatting persists after menu closes
- [ ] Autosave triggers (check Drive status in sidebar)

**Validation Gate 3.2 (Critical Markdown Roundtrip):**
```bash
# 1. Make text bold via bubble menu
# 2. Check browser network tab - should see Drive API call after 3s
# 3. Refresh page (Cmd+R)
# 4. Verify bold text still bold after reload
```
- [ ] Bold survives page reload (markdown roundtrip works)
- [ ] Italic survives reload
- [ ] Headings survive reload

**⚠️ STOP IF FORMATTING DOESN'T PERSIST - Turndown config issue**

---

### Phase 4: Link Prompt UI (2-3 hours)
**Goal: Add/edit/remove links via inline prompt**

#### Step 4.1: Add Link Button to BubbleMenu
```typescript
import { Link as LinkIcon } from 'lucide-react'

const [showLinkPrompt, setShowLinkPrompt] = useState(false)

// Add to button row:
<button onClick={() => setShowLinkPrompt(true)}>
  <LinkIcon size={16} />
</button>
```

#### Step 4.2: Create LinkPrompt Component
```typescript
{showLinkPrompt && (
  <div className="mt-2 flex gap-2">
    <input
      type="url"
      placeholder="https://example.com"
      className="border px-2 py-1 text-sm"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          editor.chain().focus().setLink({ href: e.currentTarget.value }).run()
          setShowLinkPrompt(false)
        }
        if (e.key === 'Escape') {
          setShowLinkPrompt(false)
        }
      }}
    />
    <button onClick={() => setShowLinkPrompt(false)}>Cancel</button>
  </div>
)}
```

**Validation Gate 4.1:**
- [ ] Link button opens input field
- [ ] Enter key creates link
- [ ] Escape key closes prompt
- [ ] Link appears with correct styling (blue, underlined)
- [ ] Link isActive state works (button highlights when on link)

**Validation Gate 4.2 (Edit Existing Link):**
- [ ] Click link button when selection already has link → prompt shows current URL
- [ ] Changing URL updates link (doesn't create duplicate)
- [ ] Empty URL + Enter removes link

---

### Phase 5: Polish & Accessibility (2-3 hours)
**Goal: Keyboard nav, ARIA, mobile adaptation**

#### Step 5.1: Add Keyboard Navigation
```typescript
// Add role and ARIA
<div role="toolbar" aria-label="Text formatting" className="...">
```

#### Step 5.2: Add Tooltip Hints (Radix UI)
```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

<Tooltip>
  <TooltipTrigger asChild>
    <button onClick={...}>
      <Bold size={16} />
    </button>
  </TooltipTrigger>
  <TooltipContent>Bold (Cmd+B)</TooltipContent>
</Tooltip>
```

#### Step 5.3: Mobile Adaptation
```typescript
const isTouchDevice = 'ontouchstart' in window

tippyOptions={{
  placement: isTouchDevice ? 'bottom' : 'top',
  offset: isTouchDevice ? [0, 16] : [0, 8],
}}
```

**Validation Gate 5.1:**
- [ ] Tab key cycles through buttons
- [ ] Enter/Space activates focused button
- [ ] Screen reader announces button states
- [ ] Mobile: Menu appears below selection (not covered by handles)
- [ ] Mobile: Touch targets are 44px minimum

---

### Phase 6: Testing & Browser Validation (2-3 hours)
**Goal: Automated tests + cross-browser manual testing**

#### Step 6.1: Unit Tests
```typescript
// File: ritemark-app/src/components/FormattingBubbleMenu.test.tsx
import { render, screen } from '@testing-library/react'
import { FormattingBubbleMenu } from './FormattingBubbleMenu'

describe('FormattingBubbleMenu', () => {
  it('renders when editor provided', () => {
    const mockEditor = { /* mock TipTap editor */ }
    render(<FormattingBubbleMenu editor={mockEditor} />)
    // Assert buttons present
  })
})
```

#### Step 6.2: Chrome DevTools MCP Validation
```bash
# Use MCP tools to validate in real browser:
mcp__chrome-devtools__new_page { url: "http://localhost:5173" }
mcp__chrome-devtools__wait_for { text: "Start writing" }
mcp__chrome-devtools__take_screenshot
mcp__chrome-devtools__list_console_messages
```

**Validation Gate 6.1:**
- [ ] Unit tests pass: `npm run test`
- [ ] Type-check passes: `npm run type-check`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

**Validation Gate 6.2 (Browser Console Clean):**
- [ ] NO React errors in console
- [ ] NO TypeScript errors in browser
- [ ] NO network errors
- [ ] NO memory leaks (check Performance tab)

---

### Phase 7: Cleanup & Documentation (1-2 hours)
**Goal: Production-ready code**

#### Step 7.1: Code Cleanup Checklist
- [ ] Remove all console.logs
- [ ] Remove unused imports
- [ ] Add proper TypeScript types (no `any`)
- [ ] Memoize button handlers with `useCallback`
- [ ] Add JSDoc comments to exported functions

#### Step 7.2: Update Documentation
- [ ] Update this sprint doc with implementation notes
- [ ] Update audit doc with findings (mobile behavior, etc.)
- [ ] Update roadmap.md Sprint 10 status → COMPLETED

---

## 🎯 Success Metrics (Final Validation)

**Before claiming "DONE", verify:**
1. ✅ Dev server runs without errors: `npm run dev`
2. ✅ Type-check passes: `npm run type-check`
3. ✅ Tests pass: `npm run test`
4. ✅ Build succeeds: `npm run build`
5. ✅ Browser console clean at localhost:5173
6. ✅ Bold/Italic/Headings work from BubbleMenu
7. ✅ Links can be added/edited/removed
8. ✅ Formatting survives page reload (markdown roundtrip)
9. ✅ Mobile: Menu doesn't overlap selection handles
10. ✅ Keyboard: Tab/Esc/Enter work correctly
11. ✅ Autosave still triggers after formatting changes
12. ✅ No performance regression (typing latency <16ms)

---

## ✅ Definition of Done
- Bubble menu renders and hides exactly per selection state on desktop and mobile
- All specified formatting commands function with correct active-state feedback
- Link workflow supports add, edit, and remove without exposing markdown syntax
- Keyboard navigation and screen-reader announcements validated via testing
- Autosave behaviour unchanged (no regression in debounce cadence or status indicators)
- Documentation updated (`docs/roadmap.md` sprint section + audit addendum if behaviour diverges)
- Single PR passes lint, tests, and retains invisible-interface design integrity

---

## 🧭 Reference Materials
- `docs/roadmap.md:114` – Sprint 10 objective and feature expectations
- `docs/research/sprint-10-in-context-formatting-audit.md` – Detailed background research, risks, and open questions
- `docs/strategy/design-philosophy.md` – Johnny Ive invisible-interface principles to respect
- `docs/research/ux-analysis-non-technical-users.md` – Accessibility and touch guidelines for non-technical editors
- `ritemark-app/src/components/Editor.tsx` – Current TipTap configuration and `onEditorReady` behaviour
- `ritemark-app/src/hooks/useDriveSync.ts` – Autosave debounce controls and sync state handling
- `ritemark-app/src/components/sidebar/TableOfContentsNav.tsx` – Example of editor event subscriptions to mirror
- `ritemark-app/src/components/layout/AppShell.tsx` – Layout component that passes editor instance to sidebar
- `ritemark-app/package.json` – Installed dependencies (TipTap extensions, Radix UI, etc.)
