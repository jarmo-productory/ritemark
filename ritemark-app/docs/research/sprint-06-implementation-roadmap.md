# Sprint 6: Enhanced Editor Features - Implementation Roadmap

## Overview
This roadmap provides actionable implementation guidance for Sprint 6 Enhanced Editor Features, based on comprehensive research of TipTap/ProseMirror extensions. The implementation is designed to maintain RiteMark's Johnny Ive invisible interface philosophy while adding essential editing capabilities.

## Phase 1: Foundation (Week 1) - Bundle Impact: +12.7kB

### Task 1.1: Resolve Link Extension Conflicts (Day 1)
**Current Issue**: Link extension disabled due to duplicate warnings
**Solution**: Proper StarterKit configuration

```javascript
// File: src/components/Editor.tsx
// Remove comment and enable link extension properly
import Link from '@tiptap/extension-link'

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      listItem: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      link: false, // Disable StarterKit link to avoid conflicts
    }),
    Link.configure({
      HTMLAttributes: {
        class: 'tiptap-link',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
      openOnClick: false, // Disable for editing mode
      autolink: true,
      linkOnPaste: true,
    }),
    // ... existing extensions
  ],
})
```

**Testing Checklist**:
- [ ] Link creation via toolbar/keyboard shortcut
- [ ] Link editing in place
- [ ] Auto-linking of pasted URLs
- [ ] Mobile link editing experience

### Task 1.2: Code Block Implementation (Days 2-5)
**Primary Goal**: Add syntax-highlighted code blocks with invisible interface

#### Step 1: Install Dependencies
```bash
npm install @tiptap/extension-code-block-lowlight lowlight
```

#### Step 2: Update Editor Configuration
```javascript
// File: src/components/Editor.tsx
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      listItem: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false, // Disable to use CodeBlockLowlight
    }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'plaintext',
      HTMLAttributes: {
        class: 'tiptap-code-block',
      },
    }),
    // ... other extensions
  ],
})
```

#### Step 3: Johnny Ive Interface Styling
```css
/* Add to Editor.tsx styles */
.wysiwyg-editor .ProseMirror pre.tiptap-code-block {
  background: rgba(0, 0, 0, 0.03) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 16px !important;
  margin: 1em 0 !important;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  overflow-x: auto !important;
  position: relative !important;
  transition: background-color 0.2s ease !important;
}

.wysiwyg-editor .ProseMirror pre.tiptap-code-block:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.wysiwyg-editor .ProseMirror pre.tiptap-code-block code {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-size: inherit !important;
  font-family: inherit !important;
}

/* Syntax highlighting tokens */
.wysiwyg-editor .ProseMirror .hljs-keyword { color: #d73a49 !important; }
.wysiwyg-editor .ProseMirror .hljs-string { color: #032f62 !important; }
.wysiwyg-editor .ProseMirror .hljs-comment { color: #6a737d !important; font-style: italic !important; }
.wysiwyg-editor .ProseMirror .hljs-number { color: #005cc5 !important; }
.wysiwyg-editor .ProseMirror .hljs-function { color: #6f42c1 !important; }
.wysiwyg-editor .ProseMirror .hljs-variable { color: #e36209 !important; }

/* Mobile optimization */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror pre.tiptap-code-block {
    font-size: 13px !important;
    padding: 12px !important;
    margin: 0.75em 0 !important;
  }
}
```

#### Step 4: Language Selection Component (Optional Enhancement)
```typescript
// File: src/components/CodeBlockLanguageSelector.tsx
interface LanguageSelectorProps {
  editor: Editor
  onLanguageChange: (language: string) => void
}

export function CodeBlockLanguageSelector({ editor, onLanguageChange }: LanguageSelectorProps) {
  const languages = [
    { value: 'plaintext', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'css', label: 'CSS' },
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON' },
    { value: 'python', label: 'Python' },
    { value: 'bash', label: 'Bash' },
  ]

  return (
    <select
      className="code-language-selector"
      onChange={(e) => {
        onLanguageChange(e.target.value)
        editor.chain().focus().setCodeBlock({ language: e.target.value }).run()
      }}
    >
      {languages.map(lang => (
        <option key={lang.value} value={lang.value}>{lang.label}</option>
      ))}
    </select>
  )
}
```

**Testing Checklist**:
- [ ] ``` trigger creates code block
- [ ] Syntax highlighting works for major languages
- [ ] Mobile code block editing
- [ ] Copy/paste code functionality
- [ ] Language selection interface

## Phase 2: Core Features (Week 2) - Bundle Impact: +20kB

### Task 2.1: Table Support Implementation (Days 1-3)
**Goal**: Add responsive, mobile-friendly table editing

#### Step 1: Install Table Extensions
```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell
```

#### Step 2: Table Configuration
```javascript
// File: src/components/Editor.tsx
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

const editor = useEditor({
  extensions: [
    // ... existing extensions
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'tiptap-table',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'tiptap-table-row',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'tiptap-table-header',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'tiptap-table-cell',
      },
    }),
  ],
})
```

#### Step 3: Table Styling (Johnny Ive Approach)
```css
/* Add to Editor.tsx styles */
.wysiwyg-editor .ProseMirror table.tiptap-table {
  border-collapse: collapse !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
  margin: 1em 0 !important;
  width: 100% !important;
  overflow: hidden !important;
}

.wysiwyg-editor .ProseMirror th.tiptap-table-header {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  padding: 12px !important;
  font-weight: 600 !important;
  text-align: left !important;
}

.wysiwyg-editor .ProseMirror td.tiptap-table-cell {
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  padding: 12px !important;
  vertical-align: top !important;
}

.wysiwyg-editor .ProseMirror table.tiptap-table:hover {
  border-color: rgba(59, 130, 246, 0.3) !important;
}

/* Mobile responsive tables */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror table.tiptap-table {
    font-size: 14px !important;
  }

  .wysiwyg-editor .ProseMirror th.tiptap-table-header,
  .wysiwyg-editor .ProseMirror td.tiptap-table-cell {
    padding: 8px !important;
  }
}

/* Table resize handles (invisible until needed) */
.tableWrapper {
  position: relative !important;
  overflow-x: auto !important;
  margin: 1em 0 !important;
}

.resize-cursor {
  cursor: col-resize !important;
}
```

### Task 2.2: Enhanced Text Selection with BubbleMenu (Days 4-5)
**Goal**: Context-sensitive formatting toolbar

#### Step 1: Install BubbleMenu
```bash
npm install @tiptap/extension-bubble-menu
```

#### Step 2: BubbleMenu Component
```typescript
// File: src/components/BubbleMenuComponent.tsx
import React, { useRef, useEffect } from 'react'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { Bold, Italic, Code, Link, Strikethrough } from 'lucide-react'
import type { Editor } from '@tiptap/react'

interface BubbleMenuComponentProps {
  editor: Editor
}

export function BubbleMenuComponent({ editor }: BubbleMenuComponentProps) {
  const bubbleMenuRef = useRef<HTMLDivElement>(null)

  return (
    <BubbleMenu
      editor={editor}
      element={bubbleMenuRef.current}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        interactive: true,
        trigger: 'selection',
      }}
    >
      <div
        ref={bubbleMenuRef}
        className="bubble-menu"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          aria-label="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          aria-label="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'active' : ''}
          aria-label="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'active' : ''}
          aria-label="Inline Code"
        >
          <Code size={16} />
        </button>
        <button
          onClick={() => {
            const url = window.prompt('URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={editor.isActive('link') ? 'active' : ''}
          aria-label="Add Link"
        >
          <Link size={16} />
        </button>
      </div>
    </BubbleMenu>
  )
}
```

#### Step 3: BubbleMenu Styling
```css
/* Add to Editor.tsx styles */
.bubble-menu {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  padding: 4px !important;
  display: flex !important;
  gap: 2px !important;
}

.bubble-menu button {
  border: none !important;
  background: transparent !important;
  padding: 8px !important;
  border-radius: 4px !important;
  transition: background-color 0.15s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #374151 !important;
  cursor: pointer !important;
}

.bubble-menu button:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.bubble-menu button.active {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #2563eb !important;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .bubble-menu {
    padding: 6px !important;
  }

  .bubble-menu button {
    padding: 10px !important;
    min-width: 44px !important;
    min-height: 44px !important;
  }
}
```

## Phase 3: Media & Polish (Week 3) - Bundle Impact: +13kB

### Task 3.1: Image Support (Days 1-3)
**Goal**: Drag & drop image support with Google Drive integration

#### Step 1: Install Image Extension
```bash
npm install @tiptap/extension-image
```

#### Step 2: Image Configuration
```javascript
// File: src/components/Editor.tsx
import Image from '@tiptap/extension-image'

const editor = useEditor({
  extensions: [
    // ... existing extensions
    Image.configure({
      HTMLAttributes: {
        class: 'tiptap-image',
      },
      inline: false,
      allowBase64: true,
    }),
  ],
})
```

#### Step 3: Image Styling
```css
/* Add to Editor.tsx styles */
.wysiwyg-editor .ProseMirror img.tiptap-image {
  max-width: 100% !important;
  height: auto !important;
  border-radius: 8px !important;
  margin: 1em 0 !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  transition: box-shadow 0.2s ease !important;
}

.wysiwyg-editor .ProseMirror img.tiptap-image:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

/* Mobile image optimization */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror img.tiptap-image {
    margin: 0.75em 0 !important;
    border-radius: 6px !important;
  }
}
```

### Task 3.2: Performance Optimization (Days 4-5)
**Goal**: Implement lazy loading and bundle optimization

#### Step 1: Dynamic Extension Loading
```typescript
// File: src/hooks/useEditorExtensions.ts
import { useMemo } from 'react'
import type { Extension } from '@tiptap/react'

export function useEditorExtensions(features: string[]) {
  return useMemo(async () => {
    const extensions: Extension[] = []

    // Always load core extensions
    const { default: StarterKit } = await import('@tiptap/starter-kit')
    const { default: Placeholder } = await import('@tiptap/extension-placeholder')

    extensions.push(
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      })
    )

    // Conditionally load based on features
    if (features.includes('codeBlock')) {
      const { default: CodeBlockLowlight } = await import('@tiptap/extension-code-block-lowlight')
      const { createLowlight, common } = await import('lowlight')
      const lowlight = createLowlight(common)

      extensions.push(CodeBlockLowlight.configure({ lowlight }))
    }

    if (features.includes('table')) {
      const [
        { default: Table },
        { default: TableRow },
        { default: TableHeader },
        { default: TableCell }
      ] = await Promise.all([
        import('@tiptap/extension-table'),
        import('@tiptap/extension-table-row'),
        import('@tiptap/extension-table-header'),
        import('@tiptap/extension-table-cell')
      ])

      extensions.push(
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell
      )
    }

    return extensions
  }, [features])
}
```

#### Step 2: Bundle Analysis Setup
```bash
npm install --save-dev webpack-bundle-analyzer vite-bundle-analyzer
```

Add to package.json:
```json
{
  "scripts": {
    "analyze": "npx vite-bundle-analyzer dist/",
    "build:analyze": "npm run build && npm run analyze"
  }
}
```

## Phase 4: Advanced Features (Week 4) - Bundle Impact: +15kB

### Task 4.1: Additional Formatting Extensions (Days 1-2)
```bash
npm install @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-text-align
```

### Task 4.2: Mobile Experience Enhancement (Days 3-5)
**Goal**: Touch-optimized interactions and responsive design

#### Touch Event Optimization
```css
/* Enhanced touch targets */
.wysiwyg-editor .ProseMirror {
  -webkit-touch-callout: none !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  user-select: text !important;
  touch-action: manipulation !important;
}

/* Touch selection handles */
.wysiwyg-editor .ProseMirror::selection {
  background: rgba(59, 130, 246, 0.2) !important;
}

/* Improved tap targets for mobile */
@media (max-width: 768px) {
  .bubble-menu button,
  .toolbar button {
    min-width: 44px !important;
    min-height: 44px !important;
    padding: 12px !important;
  }
}
```

## Testing Strategy

### Unit Testing
```typescript
// File: src/components/__tests__/Editor.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '../Editor'

describe('Enhanced Editor Features', () => {
  test('creates code block with triple backticks', async () => {
    const user = userEvent.setup()
    render(<Editor value="" onChange={() => {}} />)

    const editor = screen.getByRole('textbox')
    await user.type(editor, '```javascript\nconsole.log("test")\n```')

    expect(screen.getByText('console.log("test")')).toBeInTheDocument()
  })

  test('creates table and allows editing', async () => {
    // Table creation and editing tests
  })

  test('shows bubble menu on text selection', async () => {
    // BubbleMenu interaction tests
  })
})
```

### Performance Testing
```typescript
// File: src/utils/performanceMonitor.ts
export function measureEditorPerformance() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`${entry.name}: ${entry.duration}ms`)
    }
  })

  observer.observe({ entryTypes: ['measure'] })

  return {
    markStart: (name: string) => performance.mark(`${name}-start`),
    markEnd: (name: string) => {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
  }
}
```

### Mobile Testing Checklist
- [ ] Touch selection on iOS Safari
- [ ] Touch selection on Android Chrome
- [ ] Code block scrolling on mobile
- [ ] Table editing with touch
- [ ] BubbleMenu positioning on small screens
- [ ] Performance on lower-end devices

## Rollback Strategy

### Extension Disabling
```typescript
// File: src/config/editorFeatures.ts
export const EDITOR_FEATURES = {
  codeBlock: process.env.VITE_FEATURE_CODE_BLOCK !== 'false',
  table: process.env.VITE_FEATURE_TABLE !== 'false',
  bubbleMenu: process.env.VITE_FEATURE_BUBBLE_MENU !== 'false',
  image: process.env.VITE_FEATURE_IMAGE !== 'false',
}
```

### Performance Monitoring
```typescript
// File: src/utils/performanceGuard.ts
export function performanceGuard(fn: Function, maxTime: number = 100) {
  return function(...args: any[]) {
    const start = performance.now()
    const result = fn.apply(this, args)
    const end = performance.now()

    if (end - start > maxTime) {
      console.warn(`Performance warning: ${fn.name} took ${end - start}ms`)
    }

    return result
  }
}
```

## Success Metrics & Monitoring

### Bundle Size Targets
- **Phase 1**: +12.7kB (code blocks) ✅
- **Phase 2**: +20kB cumulative (tables + bubble menu) ✅
- **Phase 3**: +13kB cumulative (images + optimization) ✅
- **Phase 4**: +15kB cumulative (additional features) ✅
- **Total Target**: <60kB increase (140kB final size)

### Performance Targets
- **Time to Interactive**: <3s on 3G mobile
- **First Contentful Paint**: <2s
- **Editor Ready Time**: <1s after initial load

### User Experience Metrics
- **Code Block Creation**: <3 interactions
- **Table Creation**: <5 interactions
- **Mobile Editing**: Equivalent to desktop experience
- **Touch Target Size**: ≥44px for all interactive elements

## Implementation Files Summary

### New Files to Create
```
src/
├── components/
│   ├── BubbleMenuComponent.tsx
│   ├── CodeBlockLanguageSelector.tsx
│   └── __tests__/
│       └── Editor.enhanced.test.tsx
├── hooks/
│   └── useEditorExtensions.ts
├── config/
│   └── editorFeatures.ts
└── utils/
    ├── performanceMonitor.ts
    └── performanceGuard.ts
```

### Modified Files
```
src/
├── components/
│   └── Editor.tsx (major updates)
└── package.json (new dependencies)
```

This implementation roadmap provides a structured approach to enhancing RiteMark's editor while maintaining performance, mobile experience, and the Johnny Ive invisible interface design philosophy. Each phase builds upon the previous one, allowing for incremental delivery and testing.