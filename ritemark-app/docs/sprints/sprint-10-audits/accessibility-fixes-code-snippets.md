# Accessibility Fixes: Code Snippets
**Component:** FormattingBubbleMenu.tsx
**Date:** 2025-10-11

---

## 🔴 Critical Fix #1: Add Toolbar Role and ARIA Labels

### Current Code (Lines 131-198)
```tsx
<div className="flex items-center gap-1 bg-white border rounded shadow-lg p-1">
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => editor.chain().focus().toggleBold().run()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors ${
      editor.isActive('bold') ? 'bg-gray-200' : ''
    }`}
    title="Bold (Ctrl+B)"
  >
    B
  </button>
  {/* ... other buttons */}
</div>
```

### Fixed Code ✅
```tsx
<div
  role="toolbar"
  aria-label="Text formatting toolbar"
  className="flex items-center gap-1 bg-white border rounded shadow-lg p-1"
>
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => editor.chain().focus().toggleBold().run()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('bold') ? 'bg-gray-200' : ''
    }`}
    title="Bold (Ctrl+B)"
    aria-label="Bold"
    aria-pressed={editor.isActive('bold')}
    aria-keyshortcuts="Control+B"
  >
    B
  </button>

  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => editor.chain().focus().toggleItalic().run()}
    className={`px-3 py-1 rounded text-sm italic hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('italic') ? 'bg-gray-200' : ''
    }`}
    title="Italic (Ctrl+I)"
    aria-label="Italic"
    aria-pressed={editor.isActive('italic')}
    aria-keyshortcuts="Control+I"
  >
    I
  </button>

  <div className="w-px h-6 bg-gray-400 mx-1" aria-hidden="true" />

  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
    }`}
    title="Heading 1"
    aria-label="Heading level 1"
    aria-pressed={editor.isActive('heading', { level: 1 })}
  >
    H1
  </button>

  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
    }`}
    title="Heading 2"
    aria-label="Heading level 2"
    aria-pressed={editor.isActive('heading', { level: 2 })}
  >
    H2
  </button>

  <div className="w-px h-6 bg-gray-400 mx-1" aria-hidden="true" />

  <button
    onClick={handleOpenLinkDialog}
    onMouseDown={(e) => e.preventDefault()}
    className={`px-3 py-1 rounded text-sm hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors flex items-center ${
      editor.isActive('link') ? 'bg-gray-200' : ''
    }`}
    title="Add/Edit Link (Cmd+K)"
    aria-label="Insert or edit link"
    aria-pressed={editor.isActive('link')}
    aria-keyshortcuts="Control+K"
  >
    <Link2 size={16} />
  </button>
</div>
```

**Changes:**
1. ✅ Added `role="toolbar"` to container
2. ✅ Added `aria-label` to toolbar
3. ✅ Added `aria-label` to all buttons (Clear, descriptive names)
4. ✅ Added `aria-pressed` state (tells screen readers if formatting is active)
5. ✅ Added `aria-keyshortcuts` (announces keyboard shortcuts)
6. ✅ Added visible focus indicators (`focus-visible:ring-2`)
7. ✅ Changed divider color to `bg-gray-400` (higher contrast)
8. ✅ Added `aria-hidden="true"` to dividers (decorative only)

---

## 🔴 Critical Fix #2: Link Dialog Accessibility

### Current Code (Lines 204-252)
```tsx
<Dialog.Root open={showLinkDialog} onOpenChange={setShowLinkDialog}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 w-96">
      <Dialog.Title className="text-lg font-semibold mb-4">
        {editor.isActive('link') ? 'Edit Link' : 'Add Link'}
      </Dialog.Title>
      <div className="space-y-4">
        <div>
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value)
              setUrlError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSetLink()
              }
            }}
            placeholder="example.com or https://example.com"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {urlError && (
            <p className="text-sm text-red-500 mt-1">{urlError}</p>
          )}
        </div>
        {/* ... buttons */}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Fixed Code ✅
```tsx
<Dialog.Root open={showLinkDialog} onOpenChange={setShowLinkDialog}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
    <Dialog.Content
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 w-96"
      aria-describedby="link-dialog-description"
      onCloseAutoFocus={(e) => {
        // Prevent default focus behavior
        e.preventDefault()
        // Restore focus to editor after dialog closes
        setTimeout(() => {
          editor?.commands.focus()
        }, 0)
      }}
    >
      <Dialog.Title className="text-lg font-semibold mb-4">
        {editor.isActive('link') ? 'Edit Link' : 'Add Link'}
      </Dialog.Title>

      <Dialog.Description id="link-dialog-description" className="sr-only">
        Enter a URL to link the selected text. You can use plain domains like example.com or full URLs with https://.
      </Dialog.Description>

      <div className="space-y-4">
        <div>
          <label htmlFor="link-url-input" className="sr-only">
            Link URL
          </label>
          <input
            id="link-url-input"
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value)
              setUrlError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSetLink()
              }
            }}
            placeholder="example.com or https://example.com"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Link URL"
            aria-invalid={!!urlError}
            aria-describedby={urlError ? 'link-error' : undefined}
          />
          {urlError && (
            <p
              id="link-error"
              className="text-sm text-red-500 mt-1"
              role="alert"
            >
              {urlError}
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          {editor.isActive('link') && (
            <Button
              onClick={handleRemoveLink}
              variant="destructive"
              aria-label="Remove link from selected text"
            >
              <X aria-hidden="true" />
              Remove
            </Button>
          )}
          <Button
            onClick={() => setShowLinkDialog(false)}
            variant="outline"
            aria-label="Cancel and close dialog"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSetLink}
            variant="default"
            aria-label={editor.isActive('link') ? 'Update link URL' : 'Add link to selected text'}
          >
            <Check aria-hidden="true" />
            {editor.isActive('link') ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Changes:**
1. ✅ Added `Dialog.Description` with `sr-only` class (explains dialog purpose)
2. ✅ Added `<label>` for input with `sr-only` class
3. ✅ Added `id="link-url-input"` to input
4. ✅ Added `aria-label` to input (redundant with label, but explicit)
5. ✅ Added `aria-invalid` state (announces validation errors)
6. ✅ Added `aria-describedby` linking to error message
7. ✅ Added `role="alert"` to error message (immediate announcement)
8. ✅ Added `onCloseAutoFocus` handler (restores focus to editor)
9. ✅ Added `aria-label` to all dialog buttons (clear descriptions)
10. ✅ Added `aria-hidden="true"` to icon-only content

---

## 🔴 Critical Fix #3: Screen Reader Live Region

### Add to Component State (Top of FormattingBubbleMenu)
```tsx
export function FormattingBubbleMenu({ editor }: FormattingBubbleMenuProps) {
  // Existing state
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  // NEW: Screen reader announcement state
  const [announcement, setAnnouncement] = useState('')

  // NEW: Helper function to announce formatting changes
  const announceFormatting = (format: string, isActive: boolean) => {
    setAnnouncement(isActive ? `${format} applied` : `${format} removed`)
    setTimeout(() => setAnnouncement(''), 1000)
  }

  // ... rest of component
```

### Update Button Handlers
```tsx
// OLD: Direct editor commands
<button
  onClick={() => editor.chain().focus().toggleBold().run()}
  // ...
>

// NEW: Announce changes for screen readers
<button
  onClick={() => {
    const wasActive = editor.isActive('bold')
    editor.chain().focus().toggleBold().run()
    announceFormatting('Bold', !wasActive)
  }}
  // ...
>
```

### Add Live Region to JSX (Before BubbleMenu)
```tsx
return (
  <>
    {/* Screen reader live region - announces formatting changes */}
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>

    <BubbleMenu
      editor={editor}
      shouldShow={/* ... */}
    >
      {/* ... toolbar buttons */}
    </BubbleMenu>

    {/* Link dialog ... */}
  </>
)
```

**Full Handler Examples:**
```tsx
// Bold button handler
const handleBoldClick = () => {
  const wasActive = editor.isActive('bold')
  editor.chain().focus().toggleBold().run()
  announceFormatting('Bold', !wasActive)
}

// Italic button handler
const handleItalicClick = () => {
  const wasActive = editor.isActive('italic')
  editor.chain().focus().toggleItalic().run()
  announceFormatting('Italic', !wasActive)
}

// H1 button handler
const handleH1Click = () => {
  const wasActive = editor.isActive('heading', { level: 1 })
  editor.chain().focus().toggleHeading({ level: 1 }).run()
  announceFormatting('Heading 1', !wasActive)
}

// H2 button handler
const handleH2Click = () => {
  const wasActive = editor.isActive('heading', { level: 2 })
  editor.chain().focus().toggleHeading({ level: 2 }).run()
  announceFormatting('Heading 2', !wasActive)
}
```

---

## 🟠 High Priority Fix #4: Arrow Key Navigation

### Add Keyboard Navigation State
```tsx
import { useState, useRef, useEffect, useCallback } from 'react'

export function FormattingBubbleMenu({ editor }: FormattingBubbleMenuProps) {
  // Existing state
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)
  const [announcement, setAnnouncement] = useState('')

  // NEW: Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // NEW: Roving tabindex keyboard handler
  const handleToolbarKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const buttons = buttonRefs.current.filter(Boolean)
    let nextIndex = index

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = (index + 1) % buttons.length
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = (index - 1 + buttons.length) % buttons.length
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = buttons.length - 1
        break
      default:
        return
    }

    buttons[nextIndex]?.focus()
    setFocusedIndex(nextIndex)
  }, [])

  // ... rest of component
```

### Update Buttons with Roving Tabindex
```tsx
<div
  role="toolbar"
  aria-label="Text formatting toolbar"
  className="flex items-center gap-1 bg-white border rounded shadow-lg p-1"
>
  {/* Bold - Button index 0 */}
  <button
    ref={(el) => buttonRefs.current[0] = el}
    onKeyDown={(e) => handleToolbarKeyDown(e, 0)}
    tabIndex={focusedIndex === 0 ? 0 : -1}
    onClick={handleBoldClick}
    onMouseDown={(e) => e.preventDefault()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('bold') ? 'bg-gray-200' : ''
    }`}
    title="Bold (Ctrl+B)"
    aria-label="Bold"
    aria-pressed={editor.isActive('bold')}
    aria-keyshortcuts="Control+B"
  >
    B
  </button>

  {/* Italic - Button index 1 */}
  <button
    ref={(el) => buttonRefs.current[1] = el}
    onKeyDown={(e) => handleToolbarKeyDown(e, 1)}
    tabIndex={focusedIndex === 1 ? 0 : -1}
    onClick={handleItalicClick}
    onMouseDown={(e) => e.preventDefault()}
    className={`px-3 py-1 rounded text-sm italic hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('italic') ? 'bg-gray-200' : ''
    }`}
    title="Italic (Ctrl+I)"
    aria-label="Italic"
    aria-pressed={editor.isActive('italic')}
    aria-keyshortcuts="Control+I"
  >
    I
  </button>

  <div className="w-px h-6 bg-gray-400 mx-1" aria-hidden="true" />

  {/* H1 - Button index 2 */}
  <button
    ref={(el) => buttonRefs.current[2] = el}
    onKeyDown={(e) => handleToolbarKeyDown(e, 2)}
    tabIndex={focusedIndex === 2 ? 0 : -1}
    onClick={handleH1Click}
    onMouseDown={(e) => e.preventDefault()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
    }`}
    title="Heading 1"
    aria-label="Heading level 1"
    aria-pressed={editor.isActive('heading', { level: 1 })}
  >
    H1
  </button>

  {/* H2 - Button index 3 */}
  <button
    ref={(el) => buttonRefs.current[3] = el}
    onKeyDown={(e) => handleToolbarKeyDown(e, 3)}
    tabIndex={focusedIndex === 3 ? 0 : -1}
    onClick={handleH2Click}
    onMouseDown={(e) => e.preventDefault()}
    className={`px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${
      editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
    }`}
    title="Heading 2"
    aria-label="Heading level 2"
    aria-pressed={editor.isActive('heading', { level: 2 })}
  >
    H2
  </button>

  <div className="w-px h-6 bg-gray-400 mx-1" aria-hidden="true" />

  {/* Link - Button index 4 */}
  <button
    ref={(el) => buttonRefs.current[4] = el}
    onKeyDown={(e) => handleToolbarKeyDown(e, 4)}
    tabIndex={focusedIndex === 4 ? 0 : -1}
    onClick={handleOpenLinkDialog}
    onMouseDown={(e) => e.preventDefault()}
    className={`px-3 py-1 rounded text-sm hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors flex items-center ${
      editor.isActive('link') ? 'bg-gray-200' : ''
    }`}
    title="Add/Edit Link (Cmd+K)"
    aria-label="Insert or edit link"
    aria-pressed={editor.isActive('link')}
    aria-keyshortcuts="Control+K"
  >
    <Link2 size={16} aria-hidden="true" />
  </button>
</div>
```

**Key Changes:**
1. ✅ Added `buttonRefs` to track all toolbar buttons
2. ✅ Added `focusedIndex` state for roving tabindex
3. ✅ Added `handleToolbarKeyDown` for arrow key navigation
4. ✅ Set `tabIndex={focusedIndex === i ? 0 : -1}` (only one button tabbable at a time)
5. ✅ Arrow Left/Right moves between buttons
6. ✅ Home/End jumps to first/last button

---

## 🎨 CSS Addition: Screen Reader Only Utility

### Add to `src/index.css` or `src/App.css`
```css
/* Screen reader only - hides content visually but keeps it accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Allow focusing for keyboard navigation (optional, for skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Testing Validation Script

### Create `scripts/test-accessibility.sh`
```bash
#!/bin/bash

echo "🔍 Running Accessibility Tests..."

# 1. Check for ARIA attributes
echo "✅ Checking ARIA attributes..."
grep -r "aria-label\|aria-pressed\|aria-describedby\|role=" src/components/FormattingBubbleMenu.tsx | wc -l

# 2. Check for focus indicators
echo "✅ Checking focus indicators..."
grep -r "focus-visible:ring" src/components/FormattingBubbleMenu.tsx | wc -l

# 3. Check for screen reader live region
echo "✅ Checking live region..."
grep -r "aria-live" src/components/FormattingBubbleMenu.tsx | wc -l

# 4. Check for .sr-only utility
echo "✅ Checking .sr-only class..."
grep -r "sr-only" src/components/FormattingBubbleMenu.tsx | wc -l

# 5. Run Lighthouse audit (requires Chrome)
echo "✅ Running Lighthouse accessibility audit..."
npx lighthouse http://localhost:5173 --only-categories=accessibility --quiet --chrome-flags="--headless"

echo "✅ Accessibility tests complete!"
```

### Run Tests
```bash
chmod +x scripts/test-accessibility.sh
./scripts/test-accessibility.sh
```

---

## Automated Testing with Jest + jest-axe

### Install Dependencies
```bash
npm install --save-dev jest-axe @testing-library/jest-dom
```

### Create Test File: `src/components/__tests__/FormattingBubbleMenu.a11y.test.tsx`
```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { FormattingBubbleMenu } from '../FormattingBubbleMenu'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

expect.extend(toHaveNoViolations)

describe('FormattingBubbleMenu Accessibility', () => {
  let editor: any

  beforeEach(() => {
    editor = useEditor({
      extensions: [StarterKit],
      content: '<p>Test content</p>',
    })
  })

  it('should have no axe violations', async () => {
    const { container } = render(<FormattingBubbleMenu editor={editor} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have toolbar role', () => {
    const { getByRole } = render(<FormattingBubbleMenu editor={editor} />)
    expect(getByRole('toolbar')).toBeInTheDocument()
  })

  it('should have proper button labels', () => {
    const { getByLabelText } = render(<FormattingBubbleMenu editor={editor} />)
    expect(getByLabelText('Bold')).toBeInTheDocument()
    expect(getByLabelText('Italic')).toBeInTheDocument()
    expect(getByLabelText('Heading level 1')).toBeInTheDocument()
  })

  it('should announce aria-pressed state', () => {
    const { getByLabelText } = render(<FormattingBubbleMenu editor={editor} />)
    const boldButton = getByLabelText('Bold')
    expect(boldButton).toHaveAttribute('aria-pressed', 'false')
  })
})
```

---

## Manual Testing Checklist

### Screen Reader Testing (NVDA/VoiceOver)
```
☐ Toolbar is announced as "Text formatting toolbar"
☐ Bold button is announced as "Bold button, not pressed"
☐ When Bold is clicked, announced as "Bold applied"
☐ H1 button is announced as "Heading level 1 button"
☐ Link dialog title is read when opened
☐ URL input label is read before input field
☐ Validation errors are announced immediately
```

### Keyboard Navigation Testing
```
☐ Tab into toolbar, first button receives focus
☐ Arrow Right moves to next button
☐ Arrow Left moves to previous button
☐ Home key jumps to first button
☐ End key jumps to last button
☐ Cmd+K opens link dialog with text selected
☐ Tab through dialog: Input → Remove → Cancel → Add
☐ Enter key submits link from input
☐ Escape closes dialog and returns focus to editor
```

### Visual Testing
```
☐ Visible focus ring on all buttons (blue, 2px)
☐ Dividers visible in high contrast mode
☐ Focus indicators visible at 200% zoom
☐ No content cut off at 400% zoom
```

---

## Implementation Order

1. **Phase 1** (1 hour): Add ARIA attributes (role, aria-label, aria-pressed)
2. **Phase 2** (1 hour): Add focus indicators and fix divider contrast
3. **Phase 3** (2 hours): Implement live region for announcements
4. **Phase 4** (3 hours): Implement arrow key navigation (roving tabindex)
5. **Phase 5** (1 hour): Add Dialog.Description and input labels
6. **Phase 6** (1 hour): Add focus restoration after dialog closes
7. **Phase 7** (2 hours): Write automated tests with jest-axe
8. **Phase 8** (2 hours): Manual testing with screen readers

**Total: 13 hours**

---

**Next:** Implement Phase 1 fixes and validate with axe DevTools browser extension.
