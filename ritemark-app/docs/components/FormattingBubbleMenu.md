# FormattingBubbleMenu Component

## Overview

The `FormattingBubbleMenu` component provides a context-sensitive formatting toolbar that appears when users select text in the RiteMark editor. Built with TipTap's BubbleMenu component, it offers an intuitive, Google Docs-style interface for applying text formatting without requiring knowledge of markdown syntax.

**Key Features:**
- Appears dynamically on text selection
- Context-aware (hides in code blocks)
- Keyboard shortcut support
- Visual feedback for active formatting
- Smart link validation with auto-protocol handling

## Dependencies

### Required Packages
```json
{
  "@tiptap/react": "^2.x.x",
  "@tiptap/extension-link": "^2.x.x",
  "@radix-ui/react-dialog": "^1.x.x",
  "lucide-react": "^0.x.x"
}
```

### Internal Dependencies
- `@/components/ui/button` - shadcn/ui Button component for consistent styling
- TipTap Editor instance with Bold, Italic, Heading, and Link extensions enabled

## API Reference

### Props

```typescript
interface FormattingBubbleMenuProps {
  editor: TipTapEditor | null
}
```

#### `editor`
- **Type:** `Editor | null` (from `@tiptap/react`)
- **Required:** Yes
- **Description:** The TipTap editor instance. Must have the following extensions installed:
  - `Bold`
  - `Italic`
  - `Heading` (levels 1 and 2)
  - `Link`

### Component State

The component manages three internal state variables:

```typescript
const [showLinkDialog, setShowLinkDialog] = useState(false)  // Controls link dialog visibility
const [linkUrl, setLinkUrl] = useState('')                    // Current link URL input
const [urlError, setUrlError] = useState('')                  // URL validation error message
```

## Features

### 1. Bold Formatting
- **Button Label:** `B` (bold, semibold font)
- **Keyboard Shortcut:** `Ctrl+B` (Windows/Linux) or `Cmd+B` (Mac)
- **Behavior:** Toggles bold formatting on selected text
- **Visual Feedback:** Button background changes to gray when active

### 2. Italic Formatting
- **Button Label:** `I` (italic font style)
- **Keyboard Shortcut:** `Ctrl+I` (Windows/Linux) or `Cmd+I` (Mac)
- **Behavior:** Toggles italic formatting on selected text
- **Visual Feedback:** Button background changes to gray when active

### 3. Heading 1
- **Button Label:** `H1`
- **Keyboard Shortcut:** None (click only)
- **Behavior:** Converts selected line to Heading 1 (largest heading)
- **Visual Feedback:** Button background changes to gray when active

### 4. Heading 2
- **Button Label:** `H2`
- **Keyboard Shortcut:** None (click only)
- **Behavior:** Converts selected line to Heading 2 (medium heading)
- **Visual Feedback:** Button background changes to gray when active

### 5. Link Management
- **Button Icon:** Link icon (from `lucide-react`)
- **Keyboard Shortcut:** `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Behavior:** Opens dialog for adding/editing/removing links
- **Visual Feedback:** Button background changes to gray when text has a link

#### Link Dialog Features
- **Add Mode:** Shows "Add Link" title and "Add" button
- **Edit Mode:** Shows "Edit Link" title, "Update" and "Remove" buttons
- **URL Input:** Accepts both full URLs and bare domains
- **Auto-focus:** Input field auto-focuses when dialog opens
- **Enter Key:** Pressing Enter submits the form
- **Escape Key:** Closes dialog via Radix Dialog behavior

## URL Validation & Normalization

### `normalizeUrl(url: string): string`

Automatically prepends `https://` protocol to bare domain inputs.

**Examples:**
```typescript
normalizeUrl('example.com')         // Returns: 'https://example.com'
normalizeUrl('https://example.com') // Returns: 'https://example.com'
normalizeUrl('http://example.com')  // Returns: 'http://example.com'
normalizeUrl('   ')                 // Returns: ''
```

**Algorithm:**
1. Trim whitespace
2. Check if string starts with `http://` or `https://` (case-insensitive)
3. If no protocol found, prepend `https://`
4. Return normalized URL

### `isValidUrl(url: string): boolean`

Validates URLs using the native JavaScript `URL()` constructor.

**Examples:**
```typescript
isValidUrl('example.com')           // true (after normalization)
isValidUrl('https://example.com')   // true
isValidUrl('not a url')             // false
isValidUrl('ftp://example.com')     // false (only http/https allowed)
```

**Validation Rules:**
- Must be parseable by `URL()` constructor
- Protocol must be `http:` or `https:`
- Empty strings return `false`

**Error Messages:**
- Empty input: `"Please enter a URL"`
- Invalid format: `"Please enter a valid URL (e.g., example.com or https://example.com)"`

## Implementation Details

### BubbleMenu Positioning

The bubble menu uses TipTap's built-in positioning logic:

```typescript
<BubbleMenu
  editor={editor}
  shouldShow={({ editor, state }) => {
    const { selection } = state
    const { empty } = selection

    // Don't show if no text selected
    if (empty) return false

    // Don't show in code blocks
    if (editor.isActive('codeBlock')) return false

    return true
  }}
>
```

**Key Behaviors:**
- Only appears when text is selected (non-empty selection)
- Automatically hides in code blocks
- Positioned above/below selection to avoid overlap
- Repositions on scroll/resize

### Link Dialog Architecture

The component uses a **separate Radix Dialog** instead of inline input within the BubbleMenu:

**Why Separate Dialog?**
1. **Better UX:** Modal focus prevents accidental clicks outside
2. **Accessibility:** Radix Dialog provides ARIA attributes and focus trapping
3. **Keyboard Navigation:** Proper Tab order and Escape handling
4. **Mobile-Friendly:** Dialog works better on small screens than inline input

**Dialog Structure:**
```typescript
<Dialog.Root open={showLinkDialog} onOpenChange={setShowLinkDialog}>
  <Dialog.Portal>
    <Dialog.Overlay />  {/* Dark overlay background */}
    <Dialog.Content>    {/* Centered modal */}
      {/* Form content */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Event Handling

#### Mouse Events
```typescript
onMouseDown={(e) => e.preventDefault()}
```
All bubble menu buttons use `preventDefault()` on mousedown to prevent:
- Editor losing focus
- Text selection being cleared
- Cursor position changing

#### Keyboard Events
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const isMod = event.metaKey || event.ctrlKey
    if (isMod && event.key === 'k') {
      event.preventDefault()
      // Open link dialog only if text is selected
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [editor])
```

**Keyboard Shortcut Implementation:**
- Uses global `window` listener (not scoped to editor)
- Cross-platform: `metaKey` (Mac Cmd) or `ctrlKey` (Windows/Linux Ctrl)
- Prevents default browser behavior (Cmd+K opens address bar on Mac)
- Only opens dialog when text is selected

## Code Examples

### Basic Usage

```typescript
import { FormattingBubbleMenu } from '@/components/FormattingBubbleMenu'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

function MyEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: '<p>Select this text to see the formatting menu!</p>',
  })

  return (
    <>
      <EditorContent editor={editor} />
      <FormattingBubbleMenu editor={editor} />
    </>
  )
}
```

### Custom Link Extension Configuration

```typescript
import Link from '@tiptap/extension-link'

const editor = useEditor({
  extensions: [
    Link.configure({
      openOnClick: false,          // Don't follow links on click
      linkOnPaste: true,           // Auto-linkify pasted URLs
      HTMLAttributes: {
        class: 'text-blue-600 underline hover:text-blue-800',
        target: '_blank',          // Open links in new tab
        rel: 'noopener noreferrer', // Security attributes
      },
      validate: (url) => /^https?:\/\//.test(url), // Only allow http(s)
    }),
  ],
})
```

### Extending with Additional Formats

```typescript
// Add strikethrough button to BubbleMenu
import { Strike } from '@tiptap/extension-strike'

// In editor setup:
const editor = useEditor({
  extensions: [StarterKit, Link, Strike],
})

// In FormattingBubbleMenu.tsx, add button after Italic:
<button
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => editor.chain().focus().toggleStrike().run()}
  className={`px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors ${
    editor.isActive('strike') ? 'bg-gray-200' : ''
  }`}
  title="Strikethrough"
>
  <s>S</s>
</button>
```

## Styling

### Tailwind Classes Used

**Bubble Menu Container:**
```css
"flex items-center gap-1 bg-white border rounded shadow-lg p-1"
```

**Format Buttons:**
```css
"px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
```

**Active State:**
```css
"bg-gray-200"  /* Applied when format is active */
```

**Button Dividers:**
```css
"w-px h-6 bg-gray-300 mx-1"
```

### Customization

To change the bubble menu appearance, modify these classes:

```typescript
// Dark theme example:
<div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded shadow-lg p-1">
  <button
    className={`px-3 py-1 rounded text-sm text-gray-100 hover:bg-gray-700 ${
      editor.isActive('bold') ? 'bg-gray-600' : ''
    }`}
  >
    B
  </button>
</div>
```

## Troubleshooting

### Issue: BubbleMenu doesn't appear

**Possible Causes:**
1. **Editor is null:** Check that `editor` prop is passed correctly
2. **No text selected:** BubbleMenu only shows on non-empty selection
3. **Inside code block:** BubbleMenu is intentionally hidden in code blocks
4. **Missing extensions:** Ensure Bold, Italic, Heading, Link extensions are installed

**Solution:**
```typescript
// Debug visibility
console.log('Editor:', editor)
console.log('Selection empty?', editor?.state.selection.empty)
console.log('In code block?', editor?.isActive('codeBlock'))
```

### Issue: Cmd+K doesn't open link dialog

**Possible Causes:**
1. **No text selected:** Keyboard shortcut only works with active selection
2. **Event listener not attached:** Check useEffect dependencies
3. **Browser intercepts shortcut:** Some extensions override Cmd+K

**Solution:**
```typescript
// Add debugging to keyboard handler:
const handleKeyDown = (event: KeyboardEvent) => {
  const isMod = event.metaKey || event.ctrlKey
  if (isMod && event.key === 'k') {
    console.log('Cmd+K pressed, selection:', editor?.state.selection)
    event.preventDefault()
    // ...
  }
}
```

### Issue: Link validation shows errors for valid URLs

**Possible Causes:**
1. **Special characters in URL:** URL constructor may fail on unencoded chars
2. **Protocol validation too strict:** Only http/https allowed

**Solution:**
```typescript
// More lenient validation:
function isValidUrl(url: string): boolean {
  try {
    const normalized = normalizeUrl(url)
    new URL(normalized)  // Remove protocol check
    return true
  } catch {
    return false
  }
}
```

### Issue: Dialog doesn't auto-focus input field

**Possible Causes:**
1. **Timing issue:** Input may not be mounted when focus is called
2. **Radix Dialog animation:** Focus happening before animation completes

**Solution:**
```typescript
// Increase timeout if needed:
useEffect(() => {
  if (showLinkDialog && linkInputRef.current) {
    setTimeout(() => linkInputRef.current?.focus(), 150) // Increase from 100ms
  }
}, [showLinkDialog])
```

### Issue: Formatting buttons don't prevent text deselection

**Possible Causes:**
1. **Missing `onMouseDown` handler:** Click events alone don't prevent focus loss
2. **Editor losing focus:** Need to call `.focus()` in command chain

**Solution:**
```typescript
// Always include both:
<button
  onMouseDown={(e) => e.preventDefault()}  // Prevents deselection
  onClick={() => editor.chain().focus().toggleBold().run()} // Refocuses editor
>
  B
</button>
```

## Accessibility

### Keyboard Navigation
- All formatting actions accessible via keyboard shortcuts
- Dialog supports Tab navigation between inputs and buttons
- Escape key closes dialog (Radix Dialog default)
- Enter key submits link form

### Screen Reader Support
- Button `title` attributes provide descriptive labels
- Radix Dialog provides ARIA attributes automatically
- Error messages announced when validation fails

### Focus Management
- Dialog traps focus when open
- Input auto-focuses on dialog open
- Focus returns to editor after dialog closes
- Editor maintains focus during formatting operations

## Performance Considerations

- **Event Listeners:** Single global keyboard listener (cleaned up on unmount)
- **Re-renders:** Component only re-renders when editor state changes
- **Dialog Portal:** Uses Radix Portal for optimal rendering
- **No Heavy Computations:** URL validation is synchronous and fast

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { FormattingBubbleMenu } from './FormattingBubbleMenu'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

describe('FormattingBubbleMenu', () => {
  it('renders bold button', () => {
    const editor = useEditor({
      extensions: [StarterKit],
      content: 'Hello world',
    })

    render(<FormattingBubbleMenu editor={editor} />)
    expect(screen.getByTitle(/bold/i)).toBeInTheDocument()
  })

  it('opens link dialog on Cmd+K', () => {
    // Test keyboard shortcut behavior
  })

  it('validates URLs correctly', () => {
    expect(isValidUrl('example.com')).toBe(true)
    expect(isValidUrl('not a url')).toBe(false)
  })
})
```

## Related Documentation

- [TipTap BubbleMenu API](https://tiptap.dev/docs/editor/api/extensions/bubble-menu)
- [TipTap Link Extension](https://tiptap.dev/docs/editor/api/marks/link)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [User Guide: Text Formatting](/docs/user-guide/formatting.md)

## Changelog

### v1.0.0 (Current)
- Initial implementation with Bold, Italic, H1, H2, Link support
- Smart URL validation and normalization
- Keyboard shortcut support (Cmd+K for links)
- Radix Dialog for link input
- Context-aware visibility (hides in code blocks)
