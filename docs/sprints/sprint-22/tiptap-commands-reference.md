# TipTap Commands Reference - Sprint 22

**Research Date:** 2025-11-03
**Purpose:** Document TipTap command API for AI tool execution POC
**Target:** Validate that AI tools can manipulate TipTap editor in browser

---

## Executive Summary

TipTap provides a comprehensive command API through the editor instance. Commands are chainable and can be executed via `editor.chain().focus().command().run()` pattern. This research identifies the essential commands needed for the `replaceText` AI tool.

**Key Finding:** TipTap commands work best with **position-based operations** (insertContentAt, deleteRange) rather than text search/replace.

---

## Core Commands for Text Replacement

### 1. `deleteRange(range)` ✅ CRITICAL

**Purpose:** Delete text between two positions

**Signature:**
```typescript
deleteRange(range: { from: number, to: number }): Command
```

**Parameters:**
- `range.from` - Start position (integer, 0-indexed)
- `range.to` - End position (integer, 0-indexed)

**Behavior:**
- Removes all content between `from` and `to` positions
- Preserves document structure (doesn't break nodes)
- Can delete across multiple nodes
- Position 0 = start of document

**Existing Usage in RiteMark:**
```typescript
// From SlashCommands.tsx (line 46)
editor
  .chain()
  .focus()
  .deleteRange(range)
  .setNode('heading', { level: 1 })
  .run()
```

**Edge Cases:**
- ❌ If `from > to` → Command fails silently
- ❌ If `to` exceeds document length → Deletes to end of document
- ✅ Empty range (`from === to`) → No-op (safe)

**Return Value:** Boolean (true if successful)

---

### 2. `insertContentAt(position, content)` ✅ CRITICAL

**Purpose:** Insert content at specific position

**Signature:**
```typescript
insertContentAt(position: number, content: string | Node): Command
```

**Parameters:**
- `position` - Insertion point (integer, 0-indexed)
- `content` - HTML string, plain text, or ProseMirror node

**Behavior:**
- Inserts content WITHOUT replacing existing text
- Accepts HTML: `<p>Hello</p>`, `<strong>Bold</strong>`
- Accepts plain text: `"Hello world"`
- Position is BEFORE character at that index

**Example:**
```typescript
// Insert "Hello" at position 10
editor.chain()
  .focus()
  .insertContentAt(10, "Hello")
  .run()
```

**Edge Cases:**
- ❌ Position < 0 → Defaults to 0
- ❌ Position > doc.length → Appends to end
- ✅ HTML injection safe (TipTap sanitizes)
- ⚠️ Invalid HTML → May create unexpected nodes

**Existing Usage in RiteMark:**
```typescript
// From TablePicker.tsx (line 50)
editor.chain()
  .focus()
  .setTextSelection(editor.state.selection.to)
  .insertContent('\n')  // Note: insertContent, not insertContentAt
  .insertTable({ rows, cols, withHeaderRow: true })
  .run()
```

---

### 3. `setTextSelection(position)` ✅ HELPFUL

**Purpose:** Move cursor to specific position

**Signature:**
```typescript
setTextSelection(position: number | Range): Command
```

**Parameters:**
- `position` - Cursor position (integer) OR
- `{ from: number, to: number }` - Text range

**Behavior:**
- Moves cursor to position
- Can create text selection range
- Triggers `onSelectionUpdate` event
- Does NOT focus editor (use `.focus()` before)

**Existing Usage in RiteMark:**
```typescript
// From TableOverlayControls.tsx (line 215)
editor.chain()
  .focus()
  .addRowAfter()
  .setTextSelection(pos)
  .run()
```

**Edge Cases:**
- ❌ Position out of bounds → Clamps to valid range
- ✅ Position inside node → Places cursor inside
- ⚠️ Position in void node (image) → Moves to nearest valid position

**Return Value:** Boolean (true if selection set)

---

## Helper Commands for Context

### 4. `setContent(content)` ⚠️ AVOID FOR TOOLS

**Purpose:** Replace entire document

**Signature:**
```typescript
setContent(content: string | JSONContent, emitUpdate?: boolean): Command
```

**Why Avoid:**
- Replaces ENTIRE document (too destructive for AI tools)
- Breaks undo/redo history
- Loses cursor position
- **Use Case:** Loading files, not incremental edits

**Existing Usage:**
```typescript
// From Editor.tsx (line 410) - Loading external file
editor.commands.setContent(html)
```

---

### 5. `insertContent(content)` vs `insertContentAt(position, content)`

**Key Difference:**
- `insertContent()` → Inserts at CURRENT cursor position
- `insertContentAt()` → Inserts at SPECIFIC position

**For AI Tools:** Use `insertContentAt()` because:
- AI provides explicit positions (from: 10, to: 20)
- No dependency on current cursor state
- More predictable behavior

---

## Document Content Accessors

### Get Text Content

```typescript
// Plain text with default separators
const text = editor.getText()

// Custom block separator
const text = editor.getText({ blockSeparator: '\n\n' })
```

**Output Example:**
```
Input:  <p>Hello</p><p>World</p>
Output: "Hello\n\nWorld"  (with blockSeparator: '\n\n')
```

### Get Document Structure

```typescript
// Get as JSON (ProseMirror document format)
const json = editor.getJSON()

// Get as HTML
const html = editor.getHTML()
```

**JSON Format Example:**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Hello world"
        }
      ]
    }
  ]
}
```

### Get Current Position

```typescript
// Get cursor position
const pos = editor.state.selection.from

// Get selection range
const from = editor.state.selection.from
const to = editor.state.selection.to

// Get selected text
const selectedText = editor.state.doc.textBetween(from, to, '\n')
```

---

## Command Chaining Pattern

All commands follow this pattern:

```typescript
editor
  .chain()           // Start chain
  .focus()           // Focus editor first (optional but recommended)
  .command1()        // Execute command 1
  .command2()        // Execute command 2
  .run()             // Commit all commands atomically
```

**Why Chain?**
- Atomic operations (all or nothing)
- Single undo/redo entry
- Better performance
- Type-safe API

**Anti-Pattern:**
```typescript
// ❌ DON'T DO THIS (creates 3 undo steps)
editor.commands.focus()
editor.commands.deleteRange(range)
editor.commands.insertContentAt(pos, text)

// ✅ DO THIS (1 undo step)
editor.chain()
  .focus()
  .deleteRange(range)
  .insertContentAt(pos, text)
  .run()
```

---

## Testing Commands in Browser Console

**Step 1: Get Editor Instance**

RiteMark exposes the editor via `onEditorReady` callback. To access in console:

```javascript
// Find editor in React DevTools or use this hack:
const editorElement = document.querySelector('.ProseMirror')
const editorView = editorElement?.pmViewDesc?.view
const editor = editorView?.state  // Limited access

// Better: Add to window in development
// In Editor.tsx, add:
if (import.meta.env.DEV) {
  window.__editor = editor
}
```

**Step 2: Test Commands**

```javascript
// Get editor instance
const editor = window.__editor

// Test deleteRange
editor.chain().focus().deleteRange({ from: 0, to: 10 }).run()

// Test insertContentAt
editor.chain().focus().insertContentAt(0, "Hello").run()

// Test setTextSelection
editor.chain().focus().setTextSelection(10).run()

// Get current content
console.log(editor.getText())
console.log(editor.getHTML())
```

---

## Command Error Handling

Commands return boolean success status:

```typescript
const success = editor.chain()
  .focus()
  .deleteRange({ from: 0, to: 10 })
  .run()

if (!success) {
  console.error('Command failed')
}
```

**Common Failures:**
- Invalid position (out of bounds)
- Editor not focused
- Document structure violation (e.g., delete across incompatible nodes)
- Command not available (missing extension)

---

## Position Calculation from Text

**Challenge:** AI tools work with text offsets, but TipTap uses document positions.

**Position Types:**
1. **Text Offset** - Character count in plain text (what AI sees)
2. **Document Position** - Node boundary aware (what TipTap uses)

**Example:**
```html
<p>Hello</p><p>world</p>
```

**Text Offset:**
```
0: H
1: e
2: l
3: l
4: o
5: \n  (implicit line break)
6: w
7: o
8: r
9: l
10: d
```

**Document Position:**
```
0: <doc>
1: <p>
2: H
3: e
4: l
5: l
6: o
7: </p>
8: <p>
9: w
10: o
11: r
12: l
13: d
14: </p>
15: </doc>
```

**Conversion Required!** See `tiptap-tools-spec.md` for conversion logic.

---

## Recommendations for AI Tools

### ✅ DO:
1. Use `deleteRange()` + `insertContentAt()` for text replacement
2. Chain commands for atomic operations
3. Validate positions before executing
4. Get document text first for context
5. Handle command failures gracefully

### ❌ DON'T:
1. Use `setContent()` for incremental edits
2. Assume text offsets = document positions
3. Skip position validation
4. Execute commands without `.focus()`
5. Create multiple undo steps for single operation

---

## Next Steps

1. Design `replaceText` tool specification → `tiptap-tools-spec.md`
2. Implement text-to-position converter
3. Build error handling for edge cases
4. Create browser validation tests

---

## References

- **TipTap Commands API:** https://tiptap.dev/docs/editor/api/commands
- **TipTap Editor API:** https://tiptap.dev/docs/editor/api/editor
- **RiteMark Editor Component:** `/ritemark-app/src/components/Editor.tsx`
- **Slash Commands Usage:** `/ritemark-app/src/extensions/SlashCommands.tsx`
- **Table Controls Usage:** `/ritemark-app/src/components/TableOverlayControls.tsx`
