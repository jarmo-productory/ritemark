# Block Insertion UX Patterns for WYSIWYG Editors

**Project:** RiteMark - WYSIWYG Markdown Editor
**Current State:** BubbleMenu for text formatting (Bold, Italic, Link)
**Objective:** Add tables and images insertion with optimal UX
**Target Users:** Non-technical content creators
**Date:** 2025-10-11

---

## Executive Summary

### Recommended Approach for RiteMark

**Primary Method:** **Slash Commands (`/`)** with keyboard navigation
**Secondary Method:** **Floating Plus Button (`+`)** on hover for discoverability

**Rationale:**
1. **Slash commands** are now the industry standard (Notion, Dropbox Paper, Coda, Obsidian)
2. **Non-intrusive** - only appears when user types `/`, unlike persistent placeholders
3. **Keyboard-first** - Power users can insert blocks without touching mouse
4. **Mobile-compatible** - Works on mobile keyboards with virtual `/` key
5. **TipTap native support** - Multiple npm packages available (`@harshtalks/slash-tiptap`)

**Why Not Plus Button as Primary?**
- Dropbox Paper's research showed persistent UI hints ("Type / to quick add") made the editor "almost completely unusable"
- Plus button on hover is less discoverable than slash commands
- Requires precise mouse positioning (difficult on mobile)
- Better as **fallback/secondary method** for users who don't discover slash commands

---

## 1. Pattern Comparison Table

| Pattern | Trigger | Position | Keyboard Nav | Mobile Support | Accessibility | Discoverability | TipTap Support |
|---------|---------|----------|--------------|----------------|---------------|-----------------|----------------|
| **Slash Commands** | Type `/` | Inline at cursor | ✅ Full (↑↓ Enter Esc) | ✅ Virtual keyboard | ✅ Screen reader | ⭐⭐⭐⭐ High | ✅ `@harshtalks/slash-tiptap` |
| **Plus Button** | Hover empty line | Left margin | ❌ Limited | ⚠️ Touch-only | ⚠️ Requires ARIA | ⭐⭐ Medium | ✅ Custom implementation |
| **Toolbar Button** | Click toolbar | Top fixed | ✅ Tab navigation | ✅ Works | ✅ Full support | ⭐⭐⭐ High | ✅ Native TipTap menus |
| **Right-Click Menu** | Context menu | At cursor | ❌ No | ❌ Long-press | ⚠️ Limited | ⭐ Low | ✅ Custom implementation |

**Winner:** Slash Commands (best balance of UX, accessibility, and implementation ease)

---

## 2. Slash Commands Deep Dive

### How Notion Implements Slash Commands

**User Flow:**
1. User types `/` anywhere in the document
2. Command palette appears **inline at cursor position**
3. Palette shows **most popular blocks first**:
   - Text blocks (paragraph, heading, quote)
   - Media blocks (image, video, file)
   - Lists (bulleted, numbered, todo)
   - Advanced (table, code, embed)
4. User can:
   - **Scroll with arrow keys** (↑/↓)
   - **Type to filter** (e.g., `/table` shows only table)
   - **Press Enter** to insert selected block
   - **Press Esc** to close palette
   - **Continue typing** after `/` to narrow results

**Visual Behavior:**
- **Position:** Appears directly below the `/` character (not at top of screen)
- **Animation:** Smooth fade-in (100-200ms)
- **Size:** ~400px wide, max 6-8 items visible before scrolling
- **Grouping:** Blocks grouped by category (Basic, Media, Database, etc.)
- **Icons:** Each block has a small icon for visual scanning
- **Keyboard highlight:** Selected item has blue background

**Keyboard Shortcuts:**
- `/text` → Plain text block
- `/h1` → Heading 1
- `/h2` → Heading 2
- `/table` → Table
- `/image` → Image upload
- `/code` → Code block
- `/todo` → Todo list

**Mobile Behavior:**
- Virtual keyboard includes `/` key (no special workaround needed)
- Touch-optimized: Larger hit areas (48px minimum)
- Scrollable list with touch gestures
- No hover states (replaced with tap-and-hold for preview)

**Accessibility:**
- **ARIA role:** `role="listbox"` for palette
- **ARIA labels:** Each item has descriptive label ("Insert table block")
- **Keyboard-only navigation:** Full support without mouse
- **Screen reader:** Announces "Command palette, 24 items, use arrow keys to navigate"

---

### How Dropbox Paper Implements Slash Commands

**Key Difference from Notion:**
- **Initially tried persistent placeholder** ("Type / to quick add")
- **Users HATED IT** - called it "really, really distracting"
- **Final solution:** Slash commands work, but NO visual hints

**Lessons Learned:**
> "The concept was too distracting and heavy for Paper, where its simplicity is its strength. We ended up keeping support for slash commands, but we removed the placeholder text and menu to keep the UI clean and lightweight."

**Implications for RiteMark:**
- **Don't show persistent hints** ("Type / to add blocks")
- **Only show palette AFTER user types `/`**
- **Keep UI minimal and distraction-free**

---

### How Coda/Obsidian Implement Slash Commands

**Coda:**
- Similar to Notion, but with **more AI suggestions**
- Palette learns from user behavior (shows recently used blocks first)
- Supports **nested commands** (e.g., `/table → 3x3` for predefined sizes)

**Obsidian:**
- Uses **Command Palette** (`Cmd+P`) for global commands
- Slash commands (`/`) for block insertion
- Heavy keyboard shortcut integration

---

## 3. Plus Button Deep Dive

### How Notion Implements Plus Button

**User Flow:**
1. User hovers over **empty line** or existing block
2. **Six-dot handle** (`⋮⋮`) appears on left margin
3. **Plus button (`+`)** appears next to six-dot handle
4. Clicking `+` opens **same menu as slash commands**
5. Menu positioned directly below the plus button

**Visual Behavior:**
- **Position:** Left margin, ~10px from text edge
- **Appearance:** Only visible on hover (desktop) or always visible (mobile)
- **Size:** 24x24px button with 44x44px touch target
- **Animation:** Fade-in on hover (200ms delay to prevent flicker)
- **Color:** Light gray when inactive, dark gray on hover

**Mobile Behavior:**
- **No hover on mobile** - Plus button always visible on empty lines
- **Tap behavior:** Opens full-screen block menu
- **Alternative:** Long-press empty line also shows menu

**Problems with Plus Button:**
1. **Low discoverability** - Users don't know to hover left margin
2. **Precision required** - Mouse must hover exact position
3. **Conflicts with text selection** - Can interfere with selecting first word
4. **Mobile limitations** - Always-visible buttons clutter UI

---

### How Medium Implements Plus Button

**User Flow:**
1. User presses **Enter** to create new line
2. **Crosshair icon (`⊕`)** appears on left margin
3. Clicking crosshair opens **compact toolbar**:
   - Image upload
   - Embed (YouTube, Twitter, etc.)
   - Divider line
4. Toolbar disappears as soon as user starts typing

**Visual Behavior:**
- **Position:** Inline with cursor, left margin
- **Appearance:** Gray circle with plus sign
- **Hide behavior:** Disappears immediately when typing starts
- **Show behavior:** Reappears on new empty line

**Why Medium's Approach Works:**
- **Minimal distraction** - Only shows on empty lines
- **Context-aware** - Only shows relevant actions (no text formatting)
- **Auto-hide** - Gets out of the way when not needed

---

## 4. Toolbar Button Deep Dive

### How Google Docs Implements Toolbar

**User Flow:**
1. User clicks **Insert** menu in top toolbar
2. Dropdown shows:
   - Image → Opens file picker
   - Table → Shows size picker (NxM grid)
   - Drawing → Opens drawing tool
   - Link → Opens link dialog
3. Selected item inserted at cursor position

**Visual Behavior:**
- **Position:** Top toolbar (fixed on scroll)
- **Grouping:** Insert menu groups all block types
- **Keyboard:** `Alt+I` opens Insert menu, then arrow keys navigate

**Mobile Behavior:**
- **Simplified toolbar** - Only most common actions visible
- **Overflow menu (•••)** - Less common actions hidden
- **Bottom sheet** - Insert menu opens as bottom sheet on mobile

---

## 5. TipTap Implementation

### Available TipTap Extensions for Slash Commands

#### 1. **@harshtalks/slash-tiptap** (Recommended)

**Why Recommended:**
- Built on official `@tiptap/suggestion` extension
- Headless UI components (full styling control)
- Full keyboard navigation support
- Uses `cmdk` package (same as VSCode Command Palette)
- Active maintenance (last updated 1 year ago, but stable)

**Installation:**
```bash
npm install @harshtalks/slash-tiptap
```

**Basic Setup:**
```typescript
import { Slash, enableKeyboardNavigation, SlashCmdProvider } from '@harshtalks/slash-tiptap'

// Define slash commands
const suggestions = [
  {
    title: 'Insert Table',
    icon: <TableIcon />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3 }).run()
    },
  },
  {
    title: 'Insert Image',
    icon: <ImageIcon />,
    command: ({ editor, range }) => {
      const url = window.prompt('Image URL')
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
      }
    },
  },
]

// Configure editor with Slash extension
const editor = useEditor({
  extensions: [
    StarterKit,
    Slash.configure({
      suggestion: {
        items: () => suggestions,
      },
    }),
  ],
  editorProps: {
    handleDOMEvents: {
      keydown: (_, event) => enableKeyboardNavigation(event),
    },
  },
})

// Wrap editor in SlashCmdProvider
export function Editor() {
  return (
    <SlashCmdProvider>
      <EditorContent editor={editor} />
    </SlashCmdProvider>
  )
}
```

**Keyboard Navigation:**
- **Arrow Up/Down** - Navigate suggestions
- **Enter** - Execute selected command
- **Escape** - Close menu
- **Tab** - Close menu and continue typing
- **Type after `/`** - Filter suggestions

**Customization:**
```typescript
// Custom styling (headless UI)
const SlashMenu = () => (
  <div className="slash-menu bg-white border rounded shadow-lg p-2">
    {suggestions.map(item => (
      <button
        key={item.title}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded"
      >
        {item.icon}
        <span>{item.title}</span>
      </button>
    ))}
  </div>
)
```

**Bundle Size Impact:**
- Core extension: ~5KB (gzipped)
- `cmdk` dependency: ~15KB (gzipped)
- **Total:** ~20KB (acceptable for feature richness)

---

#### 2. **TipTap UI Components - Slash Dropdown Menu** (Official)

**Pros:**
- Official TipTap support
- Pre-styled components (less customization needed)
- AI integration built-in
- Recent updates (2 weeks ago)

**Cons:**
- **Requires TipTap Pro subscription** (paid)
- Less flexibility for custom styling
- Larger bundle size (~40KB)

**Installation:**
```bash
npm install @tiptap-pro/ui-components
```

**Basic Setup:**
```typescript
import { SlashDropdownMenu, useSlashDropdownMenu } from '@tiptap-pro/ui-components'

const editor = useEditor({
  extensions: [StarterKit, SlashDropdownMenu],
})
```

---

#### 3. **TipTap Experimental Slash Commands** (Not Recommended)

**Why Not Recommended:**
- **Not published as npm package** (must copy source code)
- No official support or maintenance
- Experimental status (may break in future updates)

**Source:**
- https://tiptap.dev/docs/examples/experiments/slash-commands

---

### Recommended Extensions for Tables & Images

#### **@tiptap/extension-table** (Tables)

**Installation:**
```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

**Setup:**
```typescript
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

const editor = useEditor({
  extensions: [
    StarterKit,
    Table.configure({
      resizable: true, // Allow column resizing
    }),
    TableRow,
    TableCell,
    TableHeader,
  ],
})
```

**Slash Command Integration:**
```typescript
{
  title: 'Insert 3x3 Table',
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range) // Remove the "/" character
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  },
}
```

**Bundle Size:**
- Table extension: ~8KB (gzipped)
- Includes table utilities (add/remove rows/columns)

---

#### **@tiptap/extension-image** (Images)

**Installation:**
```bash
npm install @tiptap/extension-image
```

**Setup:**
```typescript
import { Image } from '@tiptap/extension-image'

const editor = useEditor({
  extensions: [
    StarterKit,
    Image.configure({
      inline: false, // Block-level images (like Medium)
      allowBase64: true, // Allow base64 images
    }),
  ],
})
```

**Slash Command Integration (with File Picker):**
```typescript
{
  title: 'Insert Image',
  command: ({ editor, range }) => {
    // Option 1: URL input
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
    }

    // Option 2: File picker (recommended)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        editor.chain().focus().deleteRange(range).setImage({ src: reader.result }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  },
}
```

**Bundle Size:**
- Image extension: ~3KB (gzipped)

---

### **Recommended Full Setup for RiteMark**

```typescript
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { Image } from '@tiptap/extension-image'
import { Slash, enableKeyboardNavigation, SlashCmdProvider } from '@harshtalks/slash-tiptap'
import { TableIcon, ImageIcon, TextIcon } from 'lucide-react'

// Define slash commands
const slashCommands = [
  {
    title: 'Paragraph',
    description: 'Start writing with plain text',
    icon: <TextIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table',
    icon: <TableIcon size={16} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
  {
    title: 'Image',
    description: 'Upload an image',
    icon: <ImageIcon size={16} />,
    command: ({ editor, range }) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = () => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setImage({ src: reader.result as string })
            .run()
        }
        reader.readAsDataURL(file)
      }
      input.click()
    },
  },
]

// Editor setup
export function useRiteMarkEditor() {
  return useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false }),
      Slash.configure({
        suggestion: {
          items: () => slashCommands,
        },
      }),
    ],
    editorProps: {
      handleDOMEvents: {
        keydown: (_, event) => enableKeyboardNavigation(event),
      },
    },
  })
}

// Component usage
export function Editor() {
  const editor = useRiteMarkEditor()

  return (
    <SlashCmdProvider>
      <EditorContent editor={editor} />
    </SlashCmdProvider>
  )
}
```

**Total Bundle Size Impact:**
- Base TipTap: ~40KB
- Table extensions: ~8KB
- Image extension: ~3KB
- Slash menu extension: ~20KB
- **Total:** ~71KB (acceptable for rich editor features)

---

## 6. Mobile Strategy

### Slash Commands on Mobile

**How `/` Character Works on Mobile:**
- ✅ **iOS keyboards:** `/` is available via **"123"** key (numbers/symbols)
- ✅ **Android keyboards:** `/` is on **symbol page** (usually one tap away)
- ✅ **No special workarounds needed** - Native keyboard support

**Touch-Optimized Slash Menu:**
1. **Larger hit areas** - Minimum 48x48px tap targets
2. **Thumb-friendly positioning** - Menu appears below keyboard (not above)
3. **Swipe to dismiss** - Gesture support for closing menu
4. **No hover states** - Replace with tap-and-hold for previews
5. **Simplified list** - Show 4-5 most common blocks first

**Mobile-Specific Challenges:**
- **Virtual keyboard covers content** - Position menu above keyboard
- **Fat finger problem** - Increase button sizes and spacing
- **No keyboard shortcuts** - Rely more on visual icons/labels

**Recommended Mobile UX:**
```typescript
// Detect mobile device
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)

// Adjust slash menu for mobile
const slashMenuConfig = {
  itemHeight: isMobile ? 56 : 40, // Larger tap targets on mobile
  maxVisible: isMobile ? 4 : 8, // Fewer items visible on small screens
  position: isMobile ? 'above-keyboard' : 'below-cursor',
}
```

---

### Alternative: Bottom Sheet for Mobile

**Instead of inline menu, use bottom sheet:**
```typescript
// Show bottom sheet on mobile when "/" is typed
if (isMobile) {
  return (
    <BottomSheet isOpen={showSlashMenu} onClose={closeMenu}>
      <div className="p-4 space-y-2">
        {slashCommands.map(cmd => (
          <button
            key={cmd.title}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow"
            onClick={() => cmd.command({ editor, range })}
          >
            {cmd.icon}
            <div className="text-left">
              <div className="font-semibold">{cmd.title}</div>
              <div className="text-sm text-gray-500">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
```

**Pros:**
- **Native feel** - Matches iOS/Android design patterns
- **Thumb-friendly** - Bottom of screen is easier to reach
- **More space** - Can show full descriptions and icons

**Cons:**
- **Covers editor** - User loses context of where block will be inserted
- **Requires modal dismissal** - Extra step vs. inline menu

---

## 7. Accessibility

### Keyboard-Only Workflow

**Slash Command Keyboard Navigation:**
1. Type `/` → Menu opens
2. **↑/↓ Arrow keys** → Navigate suggestions
3. **Enter** → Insert selected block
4. **Escape** → Close menu and continue typing
5. **Tab** → Close menu and insert tab character

**No-Mouse Alternative:**
- All blocks must be insertable via keyboard shortcuts
- Example: `Ctrl+Alt+T` for table, `Ctrl+Alt+I` for image
- Document shortcuts in **Accessibility Help** dialog (`Alt+0`)

---

### Screen Reader Support

**ARIA Attributes Required:**
```html
<!-- Slash menu container -->
<div
  role="listbox"
  aria-label="Insert block menu, type to filter"
  aria-activedescendant="slash-item-0"
>
  <!-- Each suggestion -->
  <div
    id="slash-item-0"
    role="option"
    aria-selected="true"
    aria-label="Insert table, opens table with 3 rows and 3 columns"
  >
    <TableIcon />
    <span>Table</span>
  </div>
</div>
```

**Screen Reader Announcements:**
```typescript
// When slash menu opens
announceToScreenReader("Command palette opened, 8 items available, use arrow keys to navigate")

// When selection changes
announceToScreenReader("Table: Insert a 3x3 table, 2 of 8")

// When command executes
announceToScreenReader("Table inserted with 3 rows and 3 columns")
```

---

### WCAG 2.1 Compliance Checklist

**Level A (Required):**
- ✅ Keyboard navigation for all interactive elements
- ✅ Text alternatives for icons (ARIA labels)
- ✅ No keyboard traps (can close menu with Esc)

**Level AA (Recommended):**
- ✅ Minimum 4.5:1 contrast ratio for text
- ✅ Focus visible (outline on selected item)
- ✅ Minimum 44x44px touch targets (mobile)

**Level AAA (Optional):**
- ✅ Enhanced focus indicators (2px border)
- ✅ No time limits on menu (stays open until dismissed)

---

### Accessibility Testing Tools

**Automated Testing:**
```bash
# Install axe-core for automated a11y testing
npm install --save-dev @axe-core/playwright

# Test slash menu accessibility
test('slash menu is accessible', async ({ page }) => {
  await page.type('[contenteditable]', '/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toHaveLength(0)
})
```

**Manual Testing:**
1. **Keyboard-only navigation** - Unplug mouse, use only keyboard
2. **Screen reader** - Test with NVDA (Windows) or VoiceOver (Mac)
3. **High contrast mode** - Test with Windows High Contrast
4. **Zoom** - Test at 200% zoom (WCAG requirement)

---

## 8. Recommendation

### Primary Method: Slash Commands with Keyboard Navigation

**Implementation Plan:**

#### Phase 1: Core Slash Menu (Sprint 10.1)
```typescript
// Install dependencies
npm install @harshtalks/slash-tiptap @tiptap/extension-table @tiptap/extension-image

// Core blocks to support:
const slashCommands = [
  'Paragraph',
  'Heading 1',
  'Heading 2',
  'Table',
  'Image',
  'Bullet List',
  'Numbered List',
]

// Expected behavior:
// - Type "/" → Menu opens inline at cursor
// - Type "/table" → Filter to only show table
// - Arrow keys → Navigate suggestions
// - Enter → Insert selected block
// - Esc → Close menu
```

**Success Metrics:**
- ✅ Menu opens within 100ms of typing `/`
- ✅ Keyboard navigation works without mouse
- ✅ Works on mobile (iOS Safari, Chrome Android)
- ✅ Screen reader announces menu and selections
- ✅ No accessibility violations in axe audit

---

#### Phase 2: Enhanced Blocks (Sprint 10.2)
```typescript
// Add more advanced blocks:
const advancedBlocks = [
  'Code Block',
  'Quote',
  'Divider',
  'Callout',
  'Toggle List',
]
```

---

#### Phase 3: Smart Filtering & Shortcuts (Sprint 10.3)
```typescript
// Add fuzzy search and shortcuts:
const smartSearch = {
  '/tb' → 'Table',
  '/img' → 'Image',
  '/h1' → 'Heading 1',
}

// Add recently used blocks (shown first)
const recentBlocks = getRecentlyUsedBlocks()
```

---

### Secondary Method: Floating Plus Button (Optional)

**Only implement if user research shows low discoverability of slash commands.**

**Implementation:**
```typescript
// Show plus button on hover (desktop only)
<FloatingMenu
  editor={editor}
  shouldShow={({ editor, state }) => {
    const { selection } = state
    const { empty } = selection

    // Only show on empty lines
    return empty && editor.isEmpty
  }}
>
  <button
    className="absolute left-[-40px] p-2 opacity-0 hover:opacity-100 transition-opacity"
    onClick={openSlashMenu}
  >
    <PlusIcon />
  </button>
</FloatingMenu>
```

**Warning:** Do NOT show persistent hints like Dropbox Paper tried - users found it "almost completely unusable".

---

## 9. Code Examples

### Complete TipTap Slash Menu Setup

```typescript
// File: src/extensions/SlashCommands.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { Image } from '@tiptap/extension-image'
import { Slash, enableKeyboardNavigation, SlashCmdProvider } from '@harshtalks/slash-tiptap'
import {
  TextIcon,
  Heading1Icon,
  Heading2Icon,
  TableIcon,
  ImageIcon,
  ListIcon,
  ListOrderedIcon,
} from 'lucide-react'

// Define slash command items
const slashCommandItems = [
  {
    title: 'Paragraph',
    description: 'Start writing with plain text',
    icon: <TextIcon size={16} />,
    keywords: ['p', 'text', 'paragraph'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setParagraph()
        .run()
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1Icon size={16} />,
    keywords: ['h1', 'heading1', 'title'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 1 })
        .run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2Icon size={16} />,
    keywords: ['h2', 'heading2', 'subtitle'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 2 })
        .run()
    },
  },
  {
    title: 'Table',
    description: 'Insert a table (3x3)',
    icon: <TableIcon size={16} />,
    keywords: ['table', 'grid'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
  {
    title: 'Image',
    description: 'Upload an image from your device',
    icon: <ImageIcon size={16} />,
    keywords: ['image', 'img', 'photo', 'picture'],
    command: ({ editor, range }) => {
      // Create hidden file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        // Convert to base64 for preview
        const reader = new FileReader()
        reader.onload = () => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setImage({ src: reader.result as string })
            .run()
        }
        reader.readAsDataURL(file)
      }

      input.click()
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a bulleted list',
    icon: <ListIcon size={16} />,
    keywords: ['ul', 'bullet', 'list'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: <ListOrderedIcon size={16} />,
    keywords: ['ol', 'numbered', 'ordered'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleOrderedList()
        .run()
    },
  },
]

// Editor component
export function EditorWithSlashCommands() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'ritemark-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'ritemark-image',
        },
      }),
      Slash.configure({
        suggestion: {
          items: ({ query }) => {
            // Filter commands by search query
            return slashCommandItems.filter(item => {
              const searchTerm = query.toLowerCase()
              return (
                item.title.toLowerCase().includes(searchTerm) ||
                item.keywords.some(kw => kw.includes(searchTerm))
              )
            })
          },
        },
      }),
    ],
    editorProps: {
      handleDOMEvents: {
        // Enable keyboard navigation (↑↓ Enter Esc)
        keydown: (_, event) => enableKeyboardNavigation(event),
      },
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none',
      },
    },
    content: '<p>Type <strong>/</strong> to insert blocks...</p>',
  })

  return (
    <SlashCmdProvider>
      <EditorContent editor={editor} />
    </SlashCmdProvider>
  )
}
```

---

### Styled Slash Menu Component

```typescript
// File: src/components/SlashMenu.tsx
import { useState, useEffect } from 'react'

interface SlashMenuProps {
  items: SlashCommandItem[]
  selectedIndex: number
  onSelect: (item: SlashCommandItem) => void
}

export function SlashMenu({ items, selectedIndex, onSelect }: SlashMenuProps) {
  return (
    <div
      role="listbox"
      aria-label="Insert block menu"
      className="
        bg-white
        border
        border-gray-200
        rounded-lg
        shadow-lg
        py-2
        w-80
        max-h-80
        overflow-y-auto
      "
    >
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          No matching blocks found
        </div>
      ) : (
        items.map((item, index) => (
          <button
            key={item.title}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => onSelect(item)}
            className={`
              w-full
              px-4
              py-3
              flex
              items-start
              gap-3
              hover:bg-gray-100
              transition-colors
              ${index === selectedIndex ? 'bg-blue-50' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5 text-gray-600">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-gray-900">
                {item.title}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {item.description}
              </div>
            </div>
            {index === selectedIndex && (
              <div className="flex-shrink-0 text-xs text-blue-600 mt-1">
                ↵
              </div>
            )}
          </button>
        ))
      )}
    </div>
  )
}
```

---

### Accessibility Helper

```typescript
// File: src/utils/accessibility.ts

/**
 * Announces message to screen readers without visual UI
 */
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only' // Visually hidden but readable by screen readers
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement is read
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Check if user prefers reduced motion (accessibility setting)
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs
}
```

---

## 10. Implementation Checklist

### Sprint 10.1: Core Slash Menu

**Dependencies:**
- [ ] Install `@harshtalks/slash-tiptap`
- [ ] Install `@tiptap/extension-table` + row/cell/header
- [ ] Install `@tiptap/extension-image`

**Components:**
- [ ] Create `SlashMenu.tsx` component
- [ ] Style with Tailwind (match existing BubbleMenu design)
- [ ] Add keyboard navigation (↑↓ Enter Esc)
- [ ] Add ARIA attributes for screen readers

**Slash Commands:**
- [ ] Paragraph
- [ ] Heading 1
- [ ] Heading 2
- [ ] Table (3x3 with header row)
- [ ] Image (file picker)
- [ ] Bullet List
- [ ] Numbered List

**Testing:**
- [ ] Unit tests for slash command filtering
- [ ] Integration tests for keyboard navigation
- [ ] E2E tests for full user flow (type "/" → select → insert)
- [ ] Accessibility audit with axe-core
- [ ] Manual testing with screen reader (VoiceOver/NVDA)
- [ ] Mobile testing (iOS Safari, Chrome Android)

**Documentation:**
- [ ] Update `/docs/components/SlashMenu.md`
- [ ] Add keyboard shortcuts to user guide
- [ ] Update CHANGELOG.md

---

### Sprint 10.2: Enhanced Blocks

**New Commands:**
- [ ] Code Block (with syntax highlighting)
- [ ] Quote
- [ ] Horizontal Divider
- [ ] Callout/Info Box

**Improvements:**
- [ ] Fuzzy search (e.g., "/tb" → "Table")
- [ ] Recently used blocks (show at top)
- [ ] Command grouping (Basic, Advanced, Media)

---

### Sprint 10.3: Polish & Optimization

**Performance:**
- [ ] Lazy load large blocks (table/image extensions)
- [ ] Debounce search filtering
- [ ] Optimize re-renders

**UX Enhancements:**
- [ ] Add slash command tutorial (first-time user)
- [ ] Show keyboard shortcuts in menu
- [ ] Add preview images for blocks

**Accessibility:**
- [ ] Add keyboard shortcut help dialog (`Alt+0`)
- [ ] Test with high contrast mode
- [ ] Test at 200% zoom

---

## Conclusion

**Slash commands are the clear winner** for RiteMark's block insertion UX:

1. **Industry Standard** - Notion, Dropbox Paper, Coda all use `/`
2. **Keyboard-First** - Power users never touch mouse
3. **Mobile-Compatible** - Works on virtual keyboards
4. **Accessible** - Full screen reader support
5. **TipTap Native** - Multiple npm packages available
6. **Non-Intrusive** - Only appears when user types `/`

**Next Steps:**
1. Install `@harshtalks/slash-tiptap` + table/image extensions
2. Build `SlashMenu.tsx` component with keyboard navigation
3. Add 7 core blocks (paragraph, headings, table, image, lists)
4. Test accessibility with axe-core and screen readers
5. Ship in Sprint 10.1

**Avoid:**
- ❌ Persistent UI hints ("Type / to add blocks") - users hate this
- ❌ Plus button as primary method - low discoverability
- ❌ Right-click menus - not keyboard accessible

---

**Research Completed:** 2025-10-11
**Ready for Implementation:** ✅ Yes
**Estimated Effort:** 2-3 sprints for full implementation
