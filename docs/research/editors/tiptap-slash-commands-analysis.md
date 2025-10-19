# TipTap Slash Commands Research & Analysis

**Date:** 2025-10-11
**Project:** RiteMark
**Current TipTap Version:** 3.4.3 (with mixed 3.6.x extensions)
**Current Bundle Size:** 305.16 KB gzipped

---

## Executive Summary

**Recommendation: Use `tiptap-slash-react` v1.1.4**

After comprehensive research of TipTap slash command extensions, `tiptap-slash-react` emerges as the best choice for RiteMark:

- ✅ **MIT Licensed** - No legal restrictions
- ✅ **Lightweight** - Minimal dependencies (only tippy.js)
- ✅ **Simple API** - Easy to integrate with existing editor
- ✅ **Customizable** - Supports custom commands and styling
- ✅ **TypeScript** - Full type safety
- ✅ **Active** - Updated October 2024
- ⚠️ **TipTap v2 only** - Requires staying on v2.x (we're currently on v3.x)

**Alternative if staying on TipTap v3:** Build custom extension using `@tiptap/suggestion` (official experimental approach).

---

## 1. TipTap Slash Command Landscape

### Official TipTap Status

**Critical Finding:** TipTap does NOT have an official slash commands extension.

- **Experimental Only**: https://tiptap.dev/docs/examples/experiments/slash-commands
- **Status**: "Experiment, currently not supported or maintained"
- **Package**: No published npm package
- **Approach**: Copy source code and create your own extension
- **Base**: Uses `@tiptap/suggestion` utility

### Official Paid Option

TipTap offers a **Notion-like template** with slash commands as part of their **UI Components** (requires paid subscription):

- **Pricing**: Start plan or higher
- **URL**: https://tiptap.dev/docs/ui-components/templates/notion-like-editor
- **Not suitable** for open-source project like RiteMark

---

## 2. Community Extensions Comparison

| Extension | Version | Last Updated | TipTap v3 Compatible? | Bundle Size | License | Maintenance | Stars |
|-----------|---------|--------------|----------------------|-------------|---------|-------------|-------|
| **tiptap-slash-react** | 1.1.4 | Oct 2024 | ❌ v2.7.x only | ~50KB | MIT | ✅ Active | Unknown |
| **@harshtalks/slash-tiptap** | 1.3.0 | 2024 | ❌ v2.7.x only | ~80KB | MIT | ✅ Active | Unknown |
| **reactjs-tiptap-editor** | 0.3.27 | 2024 | ❌ v2.26.x only | 500KB+ | MIT | ✅ Active | 200+ |
| **Novel by Steven Tey** | Latest | 2024 | ❌ v2.x only | Unknown | MIT | ✅ Active | 12k+ |

### Key Finding: **ALL community extensions require TipTap v2.x**

**Problem:** RiteMark is on TipTap v3.4.3, which is incompatible with all community slash command extensions.

**Our Options:**
1. **Downgrade to TipTap v2.x** - Risky, may break existing code
2. **Build custom extension** - More work, but compatible with v3.x
3. **Wait for v3 extensions** - Could take months

---

## 3. Extension Deep Dive

### Option A: tiptap-slash-react (Recommended if downgrading to v2)

**GitHub:** https://github.com/hamza2001-max/TipTap-Slash-React
**npm:** https://www.npmjs.com/package/tiptap-slash-react
**Version:** 1.1.4 (Updated October 2024)

#### Peer Dependencies
```json
{
  "@tiptap/core": "^2.7.0",
  "@tiptap/react": "^2.0.0",
  "@tiptap/suggestion": "^2.0.0",
  "react": "^17.0.0 || ^18.0.0",
  "tippy.js": "^6.3.7"
}
```

#### Installation
```bash
npm install tiptap-slash-react
```

#### Basic Usage
```typescript
import { useEditor } from "@tiptap/react";
import { SlashSuggestion, filterCommandItems } from "tiptap-slash-react";
import "tiptap-slash-react/dist/index.css";

const editor = useEditor({
  extensions: [
    StarterKit,
    SlashSuggestion.configure({
      suggestion: {
        items: ({ query }) => filterCommandItems(query),
      },
    }),
  ],
});
```

#### Custom Commands
```typescript
interface CustomCommandItem {
  title: string;
  icon?: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
}

const customCommands: CustomCommandItem[] = [
  {
    title: "Heading 1",
    icon: <H1Icon />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: "Table",
    icon: <TableIcon />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertTable({ rows: 3, cols: 3 }).run(),
  },
  {
    title: "Bullet List",
    icon: <ListIcon />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
];

const editor = useEditor({
  extensions: [
    SlashSuggestion.configure({
      commandItems: customCommands,
      suggestion: {
        items: ({ query }) => filterCommandItems(query, customCommands),
      },
    }),
  ],
});
```

#### Features
- ✅ Customizable trigger character (default: "/")
- ✅ Filterable command items
- ✅ Keyboard navigation (arrow keys + Enter)
- ✅ Custom rendering of suggestion list
- ✅ Custom icons support
- ✅ TypeScript support

#### Bundle Size Impact
- **Package size:** ~50KB unpacked
- **Dependencies:** Only tippy.js (~20KB gzipped)
- **Total impact:** ~70KB (estimated)

#### Pros
- Lightweight and focused
- Simple API
- Active maintenance (Oct 2024)
- MIT licensed
- Good TypeScript support

#### Cons
- **TipTap v2 only** (incompatible with our v3.4.3)
- Limited documentation
- Small community (newer package)
- No built-in command library (must define your own)

---

### Option B: @harshtalks/slash-tiptap

**GitHub:** https://github.com/harshtalks/tiptap-plugins
**npm:** https://www.npmjs.com/package/@harshtalks/slash-tiptap
**Version:** 1.3.0 (2024)

#### Dependencies
```json
{
  "@tiptap/pm": "^2.7.2",
  "@tiptap/react": "^2.7.2",
  "@tiptap/suggestion": "^2.7.2",
  "@xstate/store": "^2.6.0",
  "cmdk": "^1.0.0",
  "react": "^18.3.1",
  "tippy.js": "^6.3.7"
}
```

#### Features
- Built on `@tiptap/suggestion`
- Uses `cmdk` package for command palette (Notion-style)
- Headless UI components
- XState for state management

#### Bundle Size Impact
- **Package + deps:** ~80KB unpacked
- **cmdk library:** ~30KB gzipped
- **@xstate/store:** ~10KB gzipped
- **Total impact:** ~120KB (estimated)

#### Pros
- Notion-like UX
- Headless UI (customizable)
- TypeScript support
- Active maintenance

#### Cons
- **TipTap v2 only**
- Heavier dependencies (cmdk + xstate)
- More complex API
- Overkill for simple use case

---

### Option C: reactjs-tiptap-editor (All-in-one)

**GitHub:** https://github.com/hunghg255/reactjs-tiptap-editor
**npm:** https://www.npmjs.com/package/reactjs-tiptap-editor
**Version:** 0.3.27 (2024)

#### What It Is
A **complete WYSIWYG editor** (not just slash commands) based on TipTap and Shadcn UI.

#### Bundle Size Impact
- **Package size:** 500KB+ unpacked
- **Dependencies:** 50+ packages (full Radix UI suite, Excalidraw, Mermaid, etc.)
- **Total impact:** ~200KB+ gzipped additional

#### Pros
- Complete editor solution
- Includes slash commands
- Shadcn UI styling (matches our stack)
- Many built-in extensions

#### Cons
- **TipTap v2 only**
- **Massive bundle size** (would double our current bundle)
- Opinionated design
- May conflict with our existing editor
- Overkill for just adding slash commands

#### Verdict
❌ **Not recommended** - Too heavy and opinionated for just adding slash commands.

---

### Option D: Novel by Steven Tey (Reference Implementation)

**GitHub:** https://github.com/steven-tey/novel (12k+ stars)
**Status:** Popular Notion-style editor with AI features

#### What It Is
- Full-featured editor (not a library)
- TipTap-based with AI autocompletion
- Uses OpenAI and Vercel AI SDK
- Includes slash commands

#### Why Not Use It?
- Not designed as a library (it's a template)
- **TipTap v2 only**
- Heavy dependencies (AI features we don't need)
- Would require significant refactoring to extract slash commands

#### Value
✅ **Excellent reference** for implementation patterns and UX design.

---

## 4. DIY Implementation with @tiptap/suggestion

Since all community extensions require TipTap v2, and RiteMark is on v3, we need a **custom implementation**.

### Base: @tiptap/suggestion (Official TipTap Utility)

**What it does:**
- Detects trigger characters (e.g., `/`)
- Shows popup menu at cursor position
- Handles keyboard navigation
- Manages suggestion state

**Already used by:**
- Mention extension
- Emoji extension
- All slash command extensions

### Step-by-Step Implementation Guide

#### Step 1: Install Dependencies

```bash
# Already installed (check our package.json)
# @tiptap/react: ^3.4.3 ✅
# @tiptap/starter-kit: ^3.4.3 ✅

# Need to add:
npm install tippy.js@^6.3.7
```

**Bundle impact:** ~20KB gzipped (tippy.js only)

#### Step 2: Create SlashCommand Extension

```typescript
// src/extensions/SlashCommand.tsx
import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import tippy from 'tippy.js'
import CommandsList from './CommandsList'

export interface CommandItem {
  title: string
  description?: string
  icon?: React.ReactNode
  command: ({ editor, range }: any) => void
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
```

#### Step 3: Create Commands List Component

```typescript
// src/extensions/CommandsList.tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react'
import type { Editor } from '@tiptap/react'

interface CommandsListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export const CommandsList = forwardRef((props: CommandsListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    )
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="slash-commands-menu">
      {props.items.map((item, index) => (
        <button
          key={index}
          className={`command-item ${
            index === selectedIndex ? 'is-selected' : ''
          }`}
          onClick={() => selectItem(index)}
        >
          {item.icon && <span className="icon">{item.icon}</span>}
          <div>
            <div className="title">{item.title}</div>
            {item.description && (
              <div className="description">{item.description}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
})
```

#### Step 4: Define Command Items

```typescript
// src/extensions/commands.ts
import { Editor, Range } from '@tiptap/react'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Table,
  Image
} from 'lucide-react' // Already in our dependencies

export const getSlashCommands = (editor: Editor) => [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
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
    icon: <Heading2 size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 2 })
        .run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 3 })
        .run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: <List size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
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
    description: 'Ordered list',
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleOrderedList()
        .run()
    },
  },
  {
    title: 'Code Block',
    description: 'Code snippet with syntax highlighting',
    icon: <Code size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleCodeBlock()
        .run()
    },
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: <Table size={18} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
]
```

#### Step 5: Add to Editor Extensions

```typescript
// src/components/Editor.tsx
import { SlashCommand } from '../extensions/SlashCommand'
import { getSlashCommands } from '../extensions/commands'

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // ... existing config
    }),
    // ... other extensions
    SlashCommand.configure({
      suggestion: {
        items: ({ query }: { query: string }) => {
          const commands = getSlashCommands(editor)
          return commands.filter((item) =>
            item.title.toLowerCase().startsWith(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer
          let popup: any

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(CommandsList, {
                props,
                editor: props.editor,
              })

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },

            onUpdate(props: any) {
              component.updateProps(props)

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              })
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

              return component.ref?.onKeyDown(props)
            },

            onExit() {
              popup[0].destroy()
              component.destroy()
            },
          }
        },
      },
    }),
  ],
})
```

#### Step 6: Add Styling

```css
/* src/extensions/SlashCommand.css */
.slash-commands-menu {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 4px;
  min-width: 280px;
  max-height: 400px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.command-item:hover,
.command-item.is-selected {
  background: #f1f5f9;
}

.command-item .icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.command-item .title {
  font-weight: 500;
  font-size: 14px;
  color: #1e293b;
}

.command-item .description {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
```

### Bundle Size Impact (DIY Approach)

**New Dependencies:**
- `tippy.js`: ~20KB gzipped

**Custom Code:**
- `SlashCommand.tsx`: ~2KB
- `CommandsList.tsx`: ~3KB
- `commands.ts`: ~2KB
- `SlashCommand.css`: ~1KB

**Total Impact:** ~28KB (vs. 70KB+ for tiptap-slash-react)

**Savings:** ~42KB compared to community extension

---

## 5. Recommended Implementation Plan

### Phase 1: Research Validation ✅
- [x] Evaluate community extensions
- [x] Test TipTap v2 vs v3 compatibility
- [x] Assess bundle size impact

### Phase 2: Proof of Concept (Next Step)
- [ ] Install tippy.js dependency
- [ ] Create basic SlashCommand extension
- [ ] Test with 2-3 simple commands (headings, lists)
- [ ] Verify keyboard navigation works
- [ ] Test on mobile (touch interactions)

### Phase 3: Full Implementation
- [ ] Add all planned commands:
  - [ ] Headings (H1-H6)
  - [ ] Lists (bullet, numbered)
  - [ ] Code blocks
  - [ ] Tables (requires `@tiptap/extension-table`)
  - [ ] Images (requires image upload flow)
- [ ] Add command filtering/search
- [ ] Add command categories (optional)
- [ ] Mobile-optimized popup positioning
- [ ] Accessibility (ARIA labels, keyboard nav)

### Phase 4: Polish
- [ ] Custom icons (lucide-react)
- [ ] Animations (smooth popup transitions)
- [ ] Dark mode support
- [ ] User preferences (enable/disable slash commands)
- [ ] Documentation for users

---

## 6. Alternative: Downgrade to TipTap v2

### If We Choose tiptap-slash-react

**Pros:**
- Ready-to-use solution
- Less code to maintain
- Community support

**Cons:**
- **Requires TipTap v2.x downgrade**
- Risk of breaking existing editor
- May miss v3 features/improvements
- Vendor lock-in to outdated version

### Downgrade Steps

```bash
# 1. Uninstall TipTap v3
npm uninstall @tiptap/react @tiptap/starter-kit @tiptap/extension-* @tiptap/core

# 2. Install TipTap v2.7.x
npm install @tiptap/react@^2.7.0 \
  @tiptap/starter-kit@^2.7.0 \
  @tiptap/extension-bubble-menu@^2.7.0 \
  @tiptap/extension-bullet-list@^2.7.0 \
  @tiptap/extension-code-block-lowlight@^2.7.0 \
  @tiptap/extension-link@^2.7.0 \
  @tiptap/extension-list-item@^2.7.0 \
  @tiptap/extension-ordered-list@^2.7.0 \
  @tiptap/extension-placeholder@^2.7.0 \
  @tiptap/extension-table-of-contents@^2.7.0

# 3. Install slash commands
npm install tiptap-slash-react

# 4. Test everything!
npm run dev
npm run build
npm run test
```

**Estimated Risk:** 🟡 MEDIUM
- TipTap v3 is backward-compatible for most features
- Our editor code is simple (no advanced v3-only features)
- BUT: Requires thorough testing of all editor functionality

**Recommendation:** ⚠️ **NOT RECOMMENDED**
- TipTap v3 is the future (just released)
- Better to build compatible solution than lock into v2
- More sustainable long-term strategy

---

## 7. Bundle Size Analysis

### Current Bundle (Before Slash Commands)
```
dist/assets/index-BOLpkYNR.js   981.35 kB │ gzip: 305.16 kB
```

### Projected Bundle (After Adding Slash Commands)

| Approach | Additional Size (gzipped) | New Total | % Increase |
|----------|--------------------------|-----------|------------|
| **DIY with tippy.js** | ~28KB | ~333KB | +9% |
| **tiptap-slash-react** (v2) | ~70KB | ~375KB | +23% |
| **@harshtalks/slash-tiptap** (v2) | ~120KB | ~425KB | +39% |
| **reactjs-tiptap-editor** (v2) | ~200KB+ | ~505KB+ | +65% |

### Recommendation
✅ **DIY approach** - Minimal bundle size increase (+9%) while maintaining TipTap v3 compatibility.

---

## 8. Mobile Considerations

### Touch Interactions
- ❌ Slash commands less intuitive on mobile (no keyboard)
- ✅ Alternative: Toolbar button to trigger slash menu
- ✅ Consider: Long-press to show command palette

### Mobile-First Design

```typescript
// Detect mobile and adjust UX
const isMobile = window.innerWidth < 768

// Option 1: Disable slash commands on mobile
SlashCommand.configure({
  enabled: !isMobile,
})

// Option 2: Add toolbar button for mobile
<button onClick={() => editor.commands.insertContent('/')}>
  Insert Block
</button>

// Option 3: Long-press to trigger
const handleLongPress = () => {
  // Show slash menu programmatically
}
```

### Popup Positioning
- Ensure popup fits on small screens
- Adjust `placement` based on viewport
- Consider full-screen modal on mobile

---

## 9. Code Examples - Ready to Use

### Example 1: Minimal Slash Command (2 commands)

```typescript
// Minimal implementation for testing
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export const SimpleSlashCommand = Extension.create({
  name: 'simpleSlashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        command: ({ editor, range, props }) => {
          // Execute command
          props.command({ editor, range })
        },
        items: ({ query }) => {
          return [
            {
              title: 'Heading 1',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range)
                  .setHeading({ level: 1 }).run()
              },
            },
            {
              title: 'Bullet List',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range)
                  .toggleBulletList().run()
              },
            },
          ].filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let container: HTMLDivElement

          return {
            onStart: (props) => {
              container = document.createElement('div')
              container.className = 'slash-menu'
              document.body.appendChild(container)

              // Render items
              props.items.forEach(item => {
                const btn = document.createElement('button')
                btn.textContent = item.title
                btn.onclick = () => props.command(item)
                container.appendChild(btn)
              })
            },
            onUpdate: (props) => {
              // Update items
            },
            onExit: () => {
              container?.remove()
            },
          }
        },
      }),
    ]
  },
})
```

**Usage:**
```typescript
const editor = useEditor({
  extensions: [StarterKit, SimpleSlashCommand],
})
```

### Example 2: Full-Featured Slash Command

See **Section 4** for complete DIY implementation with:
- TypeScript types
- React components
- Keyboard navigation
- Filtering/search
- Custom icons
- Tippy.js popups

---

## 10. Final Recommendation

### Recommended Approach: **Build Custom Extension (DIY)**

**Why:**
1. ✅ **TipTap v3 Compatible** - Future-proof
2. ✅ **Lightweight** - Only +28KB gzipped
3. ✅ **Customizable** - Full control over UX
4. ✅ **No vendor lock-in** - Own the code
5. ✅ **Learning opportunity** - Understand TipTap internals
6. ✅ **Mobile-optimized** - Can adapt for touch

**Why Not Community Extensions:**
1. ❌ All require TipTap v2.x (we're on v3.4.3)
2. ❌ Heavier bundle size
3. ❌ Less control over implementation
4. ❌ May not work with our existing setup

### Implementation Timeline

**Week 1: MVP** (5-8 hours)
- Install tippy.js
- Create basic SlashCommand extension
- Add 5 core commands (H1-H3, lists)
- Test keyboard navigation

**Week 2: Full Feature** (8-12 hours)
- Add all commands (tables, images, code blocks)
- Add filtering/search
- Mobile optimization
- Styling and animations

**Week 3: Polish** (4-6 hours)
- Accessibility improvements
- Dark mode support
- User documentation
- Unit tests

**Total Effort:** 17-26 hours

### Dependencies to Add

```bash
npm install tippy.js@^6.3.7
```

**That's it!** Everything else is already in our stack (lucide-react for icons).

---

## 11. Next Steps

1. **Get Approval** - Review this document with team
2. **Create POC** - Implement basic slash command (2-3 commands)
3. **Test UX** - Validate interaction patterns
4. **Full Implementation** - Build complete command palette
5. **Deploy** - Ship to production

---

## Appendix: Resources

### Official Documentation
- TipTap Slash Commands (Experimental): https://tiptap.dev/docs/examples/experiments/slash-commands
- TipTap Suggestion Utility: https://tiptap.dev/docs/editor/api/utilities/suggestion
- Tippy.js Documentation: https://atomiks.github.io/tippyjs/

### Community Extensions
- tiptap-slash-react: https://github.com/hamza2001-max/TipTap-Slash-React
- @harshtalks/slash-tiptap: https://github.com/harshtalks/tiptap-plugins
- reactjs-tiptap-editor: https://github.com/hunghg255/reactjs-tiptap-editor
- Novel (Reference): https://github.com/steven-tey/novel

### Example Implementations
- Mention Extension (uses Suggestion): https://github.com/ueberdosis/tiptap/tree/main/packages/extension-mention
- TipTap Source Code: https://github.com/ueberdosis/tiptap

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
**Author:** Research Agent (Claude Code)
