# GPT-5 Deep Dive: Table of Contents Not Updating (Still Broken After useCallback Fix)

## Problem Status: STILL BROKEN

We applied a `useCallback` fix to make `updateHeadings` stable, but the TOC **still doesn't update** when headings change.

### What We Fixed (Didn't Work)

**Before:**
```typescript
useEffect(() => {
  if (!editor) return

  const updateHeadings = () => {
    const newHeadings = collectHeadings()
    setHeadings(newHeadings)
  }

  updateHeadings()
  editor.on('update', updateHeadings)
  editor.on('transaction', updateHeadings)

  return () => {
    editor.off('update', updateHeadings)
    editor.off('transaction', updateHeadings)
  }
}, [editor, collectHeadings])
```

**After (Still Broken):**
```typescript
// Made updateHeadings stable with useCallback
const updateHeadings = useCallback(() => {
  const newHeadings = collectHeadings()
  setHeadings(newHeadings)
}, [collectHeadings])

useEffect(() => {
  if (!editor) return

  updateHeadings()
  editor.on('update', updateHeadings)
  editor.on('transaction', updateHeadings)

  return () => {
    editor.off('update', updateHeadings)
    editor.off('transaction', updateHeadings)
  }
}, [editor, updateHeadings])
```

### User Testing Evidence

**Test 1: Changed heading text from "A-Näidisdokument" to "AB-Näidisdokument"**
- ❌ TOC still shows old truncated text: "Näidisdokument: EIS-i kölblikkus..."
- ✅ Editor shows new text: "AB-Näidisdokument: EIS-i kölblikkuse kriteeriumids"

**Test 2: Added new heading "new missing heading"**
- ❌ TOC doesn't show the new heading at all
- ✅ Heading visible in editor

## Current Full Component Code

```typescript
import { useState, useEffect, useCallback } from 'react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { Editor as TipTapEditor } from '@tiptap/react'

interface Heading {
  id: string
  level: number
  textContent: string
  pos: number
}

interface TableOfContentsNavProps {
  editor?: TipTapEditor | null
}

export function TableOfContentsNav({ editor }: TableOfContentsNavProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Slugify helper for generating stable IDs
  const slugify = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
  }, [])

  // Extract headings from ProseMirror document state (not DOM)
  const collectHeadings = useCallback((): Heading[] => {
    if (!editor) return []

    const headings: Heading[] = []
    const usedIds = new Set<string>()

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level || 1
        const textContent = node.textContent.trim()

        if (textContent) {
          const baseId = `heading-${level}-${slugify(textContent)}`
          let id = baseId
          let counter = 1

          // Ensure unique IDs by adding counter if needed
          while (usedIds.has(id)) {
            id = `${baseId}-${counter}`
            counter++
          }

          usedIds.add(id)
          headings.push({
            id,
            level,
            textContent,
            pos
          })
        }
      }
    })

    return headings
  }, [editor, slugify])

  // Stable update function that collects and sets headings
  const updateHeadings = useCallback(() => {
    const newHeadings = collectHeadings()
    setHeadings(newHeadings)
  }, [collectHeadings])

  // Subscribe to editor updates when editor content changes
  useEffect(() => {
    if (!editor) return

    // Initial extraction
    updateHeadings()

    // Subscribe to editor updates (cover both doc updates and transactions)
    editor.on('update', updateHeadings)
    editor.on('transaction', updateHeadings)

    return () => {
      editor.off('update', updateHeadings)
      editor.off('transaction', updateHeadings)
    }
  }, [editor, updateHeadings])

  // ... rest of component (scroll tracking, rendering)
}
```

## Questions for GPT-5

### 1. Are the TipTap Events Actually Firing?

**Hypothesis:** Maybe `editor.on('update')` and `editor.on('transaction')` aren't firing when headings change?

**How to verify:**
- Add `console.log('[TOC] update event fired')` inside `updateHeadings`
- See if logs appear when user edits headings

### 2. Is `collectHeadings()` Reading Stale Editor State?

**Hypothesis:** The `collectHeadings` function has `editor` in its dependency array, but maybe `editor.state.doc` has already changed, and we're reading an old version?

**Possible issues:**
- `editor` prop reference is stable, but `editor.state` changes
- `collectHeadings` closure captures old `editor` instance?
- `editor.state.doc.descendants()` iterates over old document?

### 3. Is the Event Listener Attachment Broken?

**Hypothesis:** Maybe TipTap's `editor.on()` / `editor.off()` doesn't work with function references from `useCallback`?

**How to test:**
- Try using a ref-based approach instead of `useCallback`
- Try inline function (even if it causes re-subscription)

### 4. Is `slugify` Causing Unnecessary Recreations?

**Code:**
```typescript
const slugify = useCallback((text: string): string => {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}, [])

const collectHeadings = useCallback((): Heading[] => {
  // Uses slugify
}, [editor, slugify])
```

**Question:** Even though `slugify` has empty deps, does React consider it a new function reference on each render?

### 5. Is There a Race Condition Between Events?

**Hypothesis:** What if both `update` and `transaction` fire for the same change, causing multiple `setHeadings()` calls, and React batches them or drops updates?

**Example sequence:**
1. User types "AB-Näidisdokument"
2. `transaction` event fires → `updateHeadings()` → `setHeadings(oldData)`
3. `update` event fires 1ms later → `updateHeadings()` → `setHeadings(newData)`
4. React batches both and only applies one?

### 6. Is the TipTap Editor Prop Changing?

**Hypothesis:** What if the `editor` prop passed to `TableOfContentsNav` is actually changing (new editor instance), causing the useEffect to re-run and detach/reattach listeners incorrectly?

**How to verify:**
```typescript
useEffect(() => {
  console.log('[TOC] Editor instance changed:', editor)
}, [editor])
```

### 7. Deep Clone vs Reference Comparison

**Code:**
```typescript
const updateHeadings = useCallback(() => {
  const newHeadings = collectHeadings()
  setHeadings(newHeadings)
}, [collectHeadings])
```

**Question:** Does React see `newHeadings` as different from old `headings`? If `collectHeadings()` returns the same array reference or deeply equal objects, React might not re-render?

**How to verify:**
```typescript
const updateHeadings = useCallback(() => {
  const newHeadings = collectHeadings()
  console.log('[TOC] Old headings:', headings)
  console.log('[TOC] New headings:', newHeadings)
  console.log('[TOC] Are they different?', headings !== newHeadings)
  setHeadings(newHeadings)
}, [collectHeadings, headings])
```

### 8. TipTap Event System Quirks

**Question:** Does TipTap's event system have any quirks with React's synthetic event system or `useCallback` references?

**Possible issues:**
- TipTap stores function references internally and compares them with `===`
- `editor.off(updateHeadings)` might not match `editor.on(updateHeadings)` if references differ
- TipTap might use WeakMap for event handlers, causing GC issues with `useCallback`

## Recommended Debugging Steps

### Step 1: Add Comprehensive Logging

```typescript
const updateHeadings = useCallback(() => {
  console.log('[TOC] updateHeadings called')
  console.log('[TOC] Editor state:', editor?.state.doc.nodeSize)
  const newHeadings = collectHeadings()
  console.log('[TOC] Collected headings:', newHeadings)
  console.log('[TOC] Setting headings state')
  setHeadings(newHeadings)
}, [collectHeadings, editor])

useEffect(() => {
  if (!editor) return

  console.log('[TOC] Attaching event listeners to editor')
  updateHeadings()

  editor.on('update', () => {
    console.log('[TOC] update event fired')
    updateHeadings()
  })

  editor.on('transaction', () => {
    console.log('[TOC] transaction event fired')
    updateHeadings()
  })

  return () => {
    console.log('[TOC] Detaching event listeners from editor')
    editor.off('update', updateHeadings)
    editor.off('transaction', updateHeadings)
  }
}, [editor, updateHeadings])
```

### Step 2: Try Direct Event Handler (No useCallback)

```typescript
useEffect(() => {
  if (!editor) return

  const handleUpdate = () => {
    console.log('[TOC] Editor updated, re-collecting headings')
    const headings: Heading[] = []
    const usedIds = new Set<string>()

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level || 1
        const textContent = node.textContent.trim()

        if (textContent) {
          const baseId = `heading-${level}-${slugify(textContent)}`
          let id = baseId
          let counter = 1

          while (usedIds.has(id)) {
            id = `${baseId}-${counter}`
            counter++
          }

          usedIds.add(id)
          headings.push({ id, level, textContent, pos })
        }
      }
    })

    console.log('[TOC] Setting new headings:', headings)
    setHeadings(headings)
  }

  handleUpdate() // Initial
  editor.on('update', handleUpdate)
  editor.on('transaction', handleUpdate)

  return () => {
    editor.off('update', handleUpdate)
    editor.off('transaction', handleUpdate)
  }
}, [editor]) // Only depend on editor
```

### Step 3: Check if Editor Prop is Stable

```typescript
const editorRef = useRef<TipTapEditor | null>(null)

useEffect(() => {
  if (editor !== editorRef.current) {
    console.log('[TOC] EDITOR INSTANCE CHANGED!')
    console.log('[TOC] Old editor:', editorRef.current)
    console.log('[TOC] New editor:', editor)
    editorRef.current = editor
  }
}, [editor])
```

## Expected Output

Please analyze:
1. **Why isn't the TOC updating** even after applying `useCallback`?
2. **What is the actual root cause?** (event not firing? stale state? React not re-rendering?)
3. **What debugging steps should we take first?** (logs, breakpoints, etc.)
4. **What is the correct fix?** (with explanation of why it works)

## Context

- **Editor:** TipTap (ProseMirror-based)
- **Framework:** React 18 with hooks
- **Issue:** TOC displays old heading text even after user edits it in the editor
- **Evidence:** Editor shows "AB-Näidisdokument", TOC shows "Näidisdokument"
- **New headings don't appear** in TOC at all

---

**Note to GPT-5:** This is a critical UX bug. Users expect the TOC to update in real-time as they edit. The current implementation fails silently - no errors in console, but no updates either. Please provide step-by-step debugging guidance.
