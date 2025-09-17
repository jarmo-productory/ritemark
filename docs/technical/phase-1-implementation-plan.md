# Phase 1 Implementation Plan: Minimal Viable Markdown Editor

## Overview

Transform the current "hello world" React app into a functional markdown editor in 2-3 days. Focus on immediate user value, not perfect architecture.

## Current State Assessment

**Existing Assets:**
- ✅ React 19 + TypeScript + Vite setup
- ✅ Tailwind CSS + shadcn/ui components
- ✅ Basic Button component working
- ✅ Build system and development environment

**What Needs to be Built:**
- Markdown editor component (textarea-based)
- Live preview pane
- Basic formatting toolbar
- localStorage persistence
- Simple file management

## Implementation Tasks

### Task 1: Basic Markdown Editor Core (4 hours)

**File:** `src/components/editor/MarkdownEditor.tsx`

```typescript
interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}
```

**Features:**
- Large textarea with monospace font
- Basic syntax highlighting via CSS (optional)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)
- Auto-expanding height
- Word count display

**Implementation approach:**
- Start with plain textarea, enhance incrementally
- Use CSS for basic syntax highlighting (not complex parser)
- Handle common markdown shortcuts with simple string manipulation

### Task 2: Live Preview Component (3 hours)

**File:** `src/components/editor/MarkdownPreview.tsx`

```typescript
interface MarkdownPreviewProps {
  content: string;
  className?: string;
}
```

**Features:**
- Real-time HTML rendering
- Basic markdown support (headings, bold, italic, lists, links)
- Responsive design
- Scroll sync with editor (nice-to-have)

**Technology choice:**
- Use `marked` library (lightweight, 31KB)
- Sanitize HTML output with `DOMPurify`
- Custom CSS for preview styling

### Task 3: Editor Toolbar (2 hours)

**File:** `src/components/editor/EditorToolbar.tsx`

```typescript
interface EditorToolbarProps {
  onFormat: (type: 'bold' | 'italic' | 'heading' | 'list') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  wordCount?: number;
}
```

**Features:**
- Bold, italic, heading buttons
- Unordered list button
- Undo/redo (if time permits)
- Word count display
- Responsive design using existing shadcn/ui buttons

### Task 4: localStorage Persistence (2 hours)

**File:** `src/hooks/useLocalStorage.ts`

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  // Standard localStorage hook with JSON serialization
  // Auto-save every 30 seconds
  // Handle storage events for cross-tab sync
}
```

**Features:**
- Auto-save current document every 30 seconds
- Restore content on app load
- Handle storage quota exceeded gracefully
- Cross-tab synchronization

### Task 5: Main App Layout (3 hours)

**File:** `src/App.tsx` (major refactor)

**Layout:**
```
┌─────────────────────────────────────┐
│ Header: Ritemark + New/Save buttons │
├─────────────────┬───────────────────┤
│                 │                   │
│   Markdown      │   Live Preview    │
│   Editor        │                   │
│   (Textarea)    │   (HTML)          │
│                 │                   │
├─────────────────┴───────────────────┤
│ Toolbar: Format buttons + Word count│
└─────────────────────────────────────┘
```

**Features:**
- Responsive split-pane layout
- Mobile-first design (stack vertically on small screens)
- Dark mode support (using existing Tailwind classes)
- Keyboard-friendly navigation

### Task 6: Basic File Management (4 hours)

**File:** `src/components/files/SimpleFileManager.tsx`

**Features:**
- Document list in sidebar (collapsible)
- "New Document" button
- Document titles (first line of markdown)
- Last modified timestamp
- Delete document (with confirmation)

**Storage approach:**
```typescript
// localStorage keys
'ritemark:documents' → Array<{id: string, title: string, modified: Date}>
'ritemark:document:${id}' → string (markdown content)
'ritemark:current-document' → string (current document ID)
```

## Technical Specifications

### Dependencies to Add

```json
{
  "dependencies": {
    "marked": "^13.0.3",          // Markdown parser
    "dompurify": "^3.1.7"         // HTML sanitization
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5"  // TypeScript types
  }
}
```

### Project Structure After Phase 1

```
src/
├── components/
│   ├── editor/
│   │   ├── MarkdownEditor.tsx
│   │   ├── MarkdownPreview.tsx
│   │   └── EditorToolbar.tsx
│   ├── files/
│   │   └── SimpleFileManager.tsx
│   └── ui/ (existing shadcn components)
├── hooks/
│   ├── useLocalStorage.ts
│   └── useEditor.ts
├── lib/
│   ├── markdown.ts
│   └── storage.ts
└── App.tsx
```

### CSS Classes to Define

```css
/* Editor-specific styles */
.markdown-editor {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  line-height: 1.6;
  tab-size: 2;
}

.markdown-preview {
  line-height: 1.7;
  word-wrap: break-word;
}

.markdown-preview h1 { /* heading styles */ }
.markdown-preview h2 { /* heading styles */ }
/* etc. */
```

## Implementation Strategy

### Day 1: Core Editor (6-8 hours)
1. Set up dependencies (`npm install marked dompurify`)
2. Build MarkdownEditor component (textarea-based)
3. Build MarkdownPreview component
4. Connect them with live preview
5. Update App.tsx with basic layout

### Day 2: Toolbar and Persistence (6-8 hours)
1. Build EditorToolbar component
2. Implement formatting functions
3. Add localStorage persistence
4. Auto-save functionality
5. Handle keyboard shortcuts

### Day 3: File Management and Polish (4-6 hours)
1. Build SimpleFileManager component
2. Multiple document support
3. New/delete document functionality
4. Mobile responsiveness
5. Basic error handling

## Success Criteria

### Functional Requirements
- [ ] User can type markdown and see live preview
- [ ] Basic formatting (bold, italic, headings, lists) works
- [ ] Content automatically saves and restores on page reload
- [ ] Multiple documents can be created and switched between
- [ ] Works on both desktop and mobile devices
- [ ] No data loss under normal usage

### Performance Requirements
- [ ] App loads in under 3 seconds
- [ ] Typing response is immediate (< 16ms)
- [ ] Preview updates in real-time without lag
- [ ] Total JavaScript bundle under 200KB
- [ ] Works offline completely

### User Experience Requirements
- [ ] Zero learning curve for basic markdown editing
- [ ] Intuitive interface (no user manual needed)
- [ ] Graceful handling of browser storage limits
- [ ] Clear visual feedback for save status
- [ ] Keyboard shortcuts work as expected

## Risk Mitigation

### Technical Risks
**Risk:** Textarea performance with large documents
**Mitigation:** Use `textarea` initially, upgrade to CodeMirror only if needed

**Risk:** localStorage quota exceeded
**Mitigation:** Handle quota errors, show user warning, implement cleanup

**Risk:** Browser compatibility issues
**Mitigation:** Test on Chrome, Firefox, Safari, use standard APIs only

### User Experience Risks
**Risk:** Users expect rich text editor
**Mitigation:** Clear markdown preview shows formatting immediately

**Risk:** Accidental data loss
**Mitigation:** Auto-save every 30 seconds, confirm before delete

## Phase 1 to Phase 2 Transition

### What Phase 1 Proves
- Users actually want to edit markdown
- Live preview is valuable
- Local storage is sufficient for basic use
- Which formatting features are most used

### What Triggers Phase 2
- Users create more than 5 documents regularly
- Users request better file organization
- Users want to share/export their documents
- Local storage limitations become apparent

### Migration Strategy
- Abstract storage interface in Phase 1
- Keep localStorage as fallback in Phase 2
- Gradual migration without data loss

## Conclusion

Phase 1 focuses on **proving core value** with minimal complexity. Every feature must contribute to the primary goal: enabling users to write and preview markdown effectively.

The architecture is intentionally simple and can evolve based on real user feedback rather than anticipated requirements.