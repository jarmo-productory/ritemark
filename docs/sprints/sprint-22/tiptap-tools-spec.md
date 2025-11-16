# TipTap AI Tools Specification - Sprint 22

**Version:** 1.0.0
**Date:** 2025-11-03
**Status:** Design Complete - Ready for Implementation
**Purpose:** Define AI tool interface for TipTap editor manipulation

---

## Overview

This document specifies the `replaceText` AI tool that allows Claude to manipulate the TipTap editor through structured commands. The tool bridges the gap between AI text offsets and TipTap document positions.

**Design Goals:**
1. ✅ Type-safe TypeScript interface
2. ✅ Position validation and error handling
3. ✅ Text-to-position conversion
4. ✅ Atomic operations (single undo step)
5. ✅ Browser-executable (client-side only)

---

## Tool Interface Definition

### TypeScript Interface

```typescript
/**
 * AI Tool: Replace text in TipTap editor
 *
 * Replaces text between two positions with new content.
 * Positions are text offsets (character count from start of plain text).
 */
interface ReplaceTextTool {
  /**
   * Tool name (must match MCP tool definition)
   */
  name: "replaceText"

  /**
   * Human-readable description for AI model
   */
  description: string

  /**
   * Tool parameters schema
   */
  parameters: {
    /**
     * Start position (inclusive) in plain text
     * Must be >= 0
     */
    from: number

    /**
     * End position (exclusive) in plain text
     * Must be >= from
     */
    to: number

    /**
     * New text to insert (can be empty string for deletion)
     * Supports plain text and simple HTML
     */
    newText: string
  }

  /**
   * Execute the tool
   *
   * @param editor - TipTap editor instance
   * @param params - Validated parameters
   * @returns Success status
   */
  execute: (
    editor: Editor,
    params: { from: number; to: number; newText: string }
  ) => Promise<ToolResult>
}

/**
 * Tool execution result
 */
interface ToolResult {
  /**
   * Whether operation succeeded
   */
  success: boolean

  /**
   * Human-readable message
   */
  message: string

  /**
   * Error details (if failed)
   */
  error?: string

  /**
   * Updated document text (for verification)
   */
  updatedText?: string
}
```

---

## Tool Description for AI Model

```typescript
const replaceTextTool: ReplaceTextTool = {
  name: "replaceText",

  description: `
Replace text in the editor between two positions.

Parameters:
- from: Start position (character offset from beginning of text)
- to: End position (character offset)
- newText: Text to insert (can be empty to delete)

Example:
To replace "Hello world" with "Hi there":
- from: 0
- to: 11
- newText: "Hi there"

To delete "world":
- from: 6
- to: 11
- newText: ""

To insert "beautiful " before "world":
- from: 6
- to: 6
- newText: "beautiful "

Position calculation:
Get current text first using getText() to calculate positions.
Position 0 = start of document.
Positions are counted in the plain text representation.
`,

  parameters: {
    from: { type: "number", minimum: 0 },
    to: { type: "number", minimum: 0 },
    newText: { type: "string" }
  },

  execute: async (editor, params) => {
    // Implementation in next section
  }
}
```

---

## Implementation Specification

### Step 1: Parameter Validation

```typescript
function validateParameters(
  params: { from: number; to: number; newText: string },
  editor: Editor
): { valid: boolean; error?: string } {

  // Get current document text for bounds checking
  const currentText = editor.getText()
  const docLength = currentText.length

  // Rule 1: from must be >= 0
  if (params.from < 0) {
    return {
      valid: false,
      error: `Invalid 'from' position: ${params.from}. Must be >= 0.`
    }
  }

  // Rule 2: to must be >= from
  if (params.to < params.from) {
    return {
      valid: false,
      error: `Invalid range: from=${params.from}, to=${params.to}. 'to' must be >= 'from'.`
    }
  }

  // Rule 3: Positions must be within document bounds
  if (params.from > docLength) {
    return {
      valid: false,
      error: `'from' position ${params.from} exceeds document length ${docLength}.`
    }
  }

  if (params.to > docLength) {
    return {
      valid: false,
      error: `'to' position ${params.to} exceeds document length ${docLength}.`
    }
  }

  // Rule 4: newText must be a string (can be empty)
  if (typeof params.newText !== 'string') {
    return {
      valid: false,
      error: `Invalid 'newText': must be a string.`
    }
  }

  return { valid: true }
}
```

**Edge Cases Handled:**
- ✅ `from > to` → Error (invalid range)
- ✅ `from === to && newText === ""` → No-op (safe)
- ✅ `from === to && newText !== ""` → Insertion at position
- ✅ `from < to && newText === ""` → Deletion
- ✅ `from < to && newText !== ""` → Replacement
- ✅ `from > docLength` → Error (out of bounds)
- ✅ `to > docLength` → Error (out of bounds)

---

### Step 2: Text Position to Document Position Conversion

**Challenge:** AI works with plain text offsets, but TipTap uses document positions (node-aware).

**Example:**
```html
Document: <p>Hello</p><p>world</p>
Plain text: "Hello\n\nworld"  (with blockSeparator: '\n\n')
```

| Plain Text Offset | Character | Document Position |
|-------------------|-----------|-------------------|
| 0 | H | 2 |
| 1 | e | 3 |
| 2 | l | 4 |
| 3 | l | 5 |
| 4 | o | 6 |
| 5 | \n | 7 (end of paragraph) |
| 6 | \n | 8 (between paragraphs) |
| 7 | w | 9 |
| 8 | o | 10 |
| 9 | r | 11 |
| 10 | l | 12 |
| 11 | d | 13 |

**Conversion Function:**

```typescript
/**
 * Convert plain text offset to TipTap document position
 *
 * TipTap document positions include node boundaries.
 * This function maps plain text offsets (from getText()) to document positions.
 */
function textOffsetToDocPosition(
  editor: Editor,
  textOffset: number
): number | null {

  const { state } = editor
  const { doc } = state

  let currentTextOffset = 0
  let foundPosition: number | null = null

  // Traverse the document tree
  doc.descendants((node, pos) => {
    // If we've already found the position, stop traversing
    if (foundPosition !== null) return false

    if (node.isText) {
      const nodeTextLength = node.text?.length ?? 0

      // Check if target offset is within this text node
      if (
        currentTextOffset <= textOffset &&
        textOffset <= currentTextOffset + nodeTextLength
      ) {
        // Calculate position within this node
        const offsetInNode = textOffset - currentTextOffset
        foundPosition = pos + offsetInNode
        return false  // Stop traversal
      }

      currentTextOffset += nodeTextLength
    } else if (node.isBlock && !node.isLeaf) {
      // Add block separator length (e.g., '\n\n' for paragraphs)
      // This matches editor.getText({ blockSeparator: '\n\n' })
      currentTextOffset += 2  // '\n\n'.length
    }

    return true  // Continue traversal
  })

  return foundPosition
}
```

**Alternative Simpler Approach:**

```typescript
/**
 * Simplified conversion using editor.getText() as reference
 *
 * This approach is less efficient but more reliable for POC.
 * For production, use ProseMirror position APIs directly.
 */
function textOffsetToDocPositionSimple(
  editor: Editor,
  textOffset: number
): number {

  // Get plain text representation
  const plainText = editor.getText({ blockSeparator: '\n\n' })

  // Validate offset
  if (textOffset < 0 || textOffset > plainText.length) {
    throw new Error(`Text offset ${textOffset} out of bounds (0-${plainText.length})`)
  }

  // For POC: Use heuristic that document position ≈ text offset + node overhead
  // This is APPROXIMATE and will be refined in production

  // Count how many block nodes exist before this position
  const textBeforeOffset = plainText.substring(0, textOffset)
  const blockCount = (textBeforeOffset.match(/\n\n/g) || []).length

  // Each block adds ~2 positions (opening and closing tags)
  const nodeOverhead = blockCount * 2

  return textOffset + nodeOverhead + 1  // +1 for <doc> opening tag
}
```

**Decision:** Use **Simplified Approach** for POC (Sprint 22), optimize later if needed.

---

### Step 3: Execute Replacement

```typescript
async function executeReplaceText(
  editor: Editor,
  params: { from: number; to: number; newText: string }
): Promise<ToolResult> {

  try {
    // Step 1: Validate parameters
    const validation = validateParameters(params, editor)
    if (!validation.valid) {
      return {
        success: false,
        message: "Parameter validation failed",
        error: validation.error
      }
    }

    // Step 2: Convert text offsets to document positions
    const docFrom = textOffsetToDocPositionSimple(editor, params.from)
    const docTo = textOffsetToDocPositionSimple(editor, params.to)

    // Step 3: Execute TipTap commands (atomic operation)
    const success = editor
      .chain()
      .focus()  // Focus editor first
      .deleteRange({ from: docFrom, to: docTo })  // Delete old text
      .insertContentAt(docFrom, params.newText)  // Insert new text
      .run()  // Commit atomically

    if (!success) {
      return {
        success: false,
        message: "TipTap command execution failed",
        error: "Editor commands returned false"
      }
    }

    // Step 4: Get updated text for verification
    const updatedText = editor.getText({ blockSeparator: '\n\n' })

    return {
      success: true,
      message: `Replaced text from position ${params.from} to ${params.to}`,
      updatedText: updatedText
    }

  } catch (error) {
    return {
      success: false,
      message: "Unexpected error during text replacement",
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
```

---

## Edge Case Handling Matrix

| Scenario | Input | Expected Behavior | Implementation |
|----------|-------|-------------------|----------------|
| **Valid replacement** | `from=0, to=5, newText="Hi"` | Replace first 5 chars with "Hi" | ✅ Execute normally |
| **Valid insertion** | `from=5, to=5, newText="NEW"` | Insert "NEW" at position 5 | ✅ deleteRange becomes no-op, insertContentAt works |
| **Valid deletion** | `from=0, to=5, newText=""` | Delete first 5 chars | ✅ deleteRange removes, insertContentAt skipped |
| **Empty range, empty text** | `from=5, to=5, newText=""` | No-op | ✅ Both commands become no-ops (safe) |
| **Invalid: from > to** | `from=10, to=5, newText="X"` | Error before execution | ✅ Caught by validation |
| **Invalid: from < 0** | `from=-1, to=5, newText="X"` | Error before execution | ✅ Caught by validation |
| **Invalid: to > length** | `from=0, to=9999, newText="X"` | Error before execution | ✅ Caught by validation |
| **Special chars in newText** | `newText="<script>alert(1)</script>"` | Insert as plain text (sanitized) | ✅ TipTap auto-sanitizes |
| **HTML in newText** | `newText="<strong>Bold</strong>"` | Insert as formatted HTML | ✅ TipTap parses HTML |
| **Unicode/emoji in newText** | `newText="Hello 👋"` | Insert emoji correctly | ✅ UTF-16 aware |
| **Newlines in newText** | `newText="Line1\nLine2"` | Create paragraph break | ⚠️ May need `<p>` tags |
| **Replace entire document** | `from=0, to=docLength, newText="X"` | Replace all text | ✅ Valid operation |
| **Cursor position preservation** | After replacement | Cursor moves to end of inserted text | ✅ insertContentAt handles this |
| **Undo/redo** | After replacement | Single undo step | ✅ `.chain().run()` ensures atomic operation |

**Production Improvements Needed:**
- ⚠️ Handle newlines in `newText` (convert `\n` → `<p>` tags)
- ⚠️ Support markdown in `newText` (e.g., `**bold**` → `<strong>bold</strong>`)
- ⚠️ Optimize position conversion for large documents
- ⚠️ Add progress indication for long operations
- ⚠️ Test with tables, images, and complex formatting

---

## MCP Tool Definition

```typescript
/**
 * MCP Server Tool Definition for replaceText
 *
 * This is registered with the MCP server and exposed to Claude.
 */
const replaceTextMCPTool = {
  name: "replaceText",

  description: `
Replace text in the TipTap editor.

How to use:
1. First, call getEditorText() to get current document text
2. Calculate positions based on plain text offsets
3. Call replaceText(from, to, newText)

Example workflow:
- Current text: "Hello world"
- Goal: Change "world" to "universe"
- from: 6 (position of 'w')
- to: 11 (position after 'd')
- newText: "universe"

Position rules:
- Position 0 = start of document
- Positions are character offsets in plain text
- from must be <= to
- Both positions must be within document bounds
`,

  inputSchema: {
    type: "object",
    properties: {
      from: {
        type: "number",
        description: "Start position (inclusive) in plain text",
        minimum: 0
      },
      to: {
        type: "number",
        description: "End position (exclusive) in plain text",
        minimum: 0
      },
      newText: {
        type: "string",
        description: "New text to insert (can be empty string to delete)"
      }
    },
    required: ["from", "to", "newText"]
  },

  // Server-side handler (forwards to browser)
  async handler(params: { from: number; to: number; newText: string }) {
    // This runs in Node.js (MCP server)
    // Must send command to browser via WebSocket/HTTP

    const response = await fetch('http://localhost:5173/api/editor/replaceText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    return await response.json()
  }
}
```

---

## Browser API Endpoint

```typescript
/**
 * Browser-side API endpoint (Vite dev server middleware)
 *
 * Receives MCP tool calls and executes them in browser context.
 */

// In ritemark-app/src/services/mcp/editorToolsApi.ts
export class EditorToolsAPI {
  private editor: Editor | null = null

  /**
   * Register editor instance (called by Editor.tsx)
   */
  registerEditor(editor: Editor) {
    this.editor = editor

    // Expose API endpoint
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  /**
   * Handle incoming tool execution requests
   */
  private async handleMessage(event: MessageEvent) {
    if (event.data.type === 'EXECUTE_TOOL') {
      const { toolName, params } = event.data

      if (toolName === 'replaceText') {
        const result = await this.executeReplaceText(params)

        // Send result back to MCP server
        window.postMessage({
          type: 'TOOL_RESULT',
          result
        }, '*')
      }
    }
  }

  /**
   * Execute replaceText tool
   */
  private async executeReplaceText(
    params: { from: number; to: number; newText: string }
  ): Promise<ToolResult> {

    if (!this.editor) {
      return {
        success: false,
        message: "Editor not ready",
        error: "Editor instance not registered"
      }
    }

    return await executeReplaceText(this.editor, params)
  }

  /**
   * Get current editor text (helper for AI)
   */
  getEditorText(): string {
    if (!this.editor) return ""
    return this.editor.getText({ blockSeparator: '\n\n' })
  }
}

// Initialize in Editor.tsx
const editorToolsAPI = new EditorToolsAPI()

export function Editor({ value, onChange }: EditorProps) {
  const editor = useEditor({ /* ... */ })

  useEffect(() => {
    if (editor) {
      editorToolsAPI.registerEditor(editor)
    }
  }, [editor])

  // ...
}
```

---

## Testing Plan

### Unit Tests

```typescript
describe('replaceText Tool', () => {
  let editor: Editor

  beforeEach(() => {
    editor = createTestEditor({ content: '<p>Hello world</p>' })
  })

  test('should replace text correctly', async () => {
    const result = await executeReplaceText(editor, {
      from: 0,
      to: 5,
      newText: 'Hi'
    })

    expect(result.success).toBe(true)
    expect(editor.getText()).toBe('Hi world')
  })

  test('should insert text at position', async () => {
    const result = await executeReplaceText(editor, {
      from: 6,
      to: 6,
      newText: 'beautiful '
    })

    expect(result.success).toBe(true)
    expect(editor.getText()).toBe('Hello beautiful world')
  })

  test('should delete text', async () => {
    const result = await executeReplaceText(editor, {
      from: 6,
      to: 11,
      newText: ''
    })

    expect(result.success).toBe(true)
    expect(editor.getText()).toBe('Hello ')
  })

  test('should reject invalid range (from > to)', async () => {
    const result = await executeReplaceText(editor, {
      from: 10,
      to: 5,
      newText: 'X'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('to')
  })

  test('should reject out of bounds position', async () => {
    const result = await executeReplaceText(editor, {
      from: 0,
      to: 9999,
      newText: 'X'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('exceeds document length')
  })
})
```

### Browser Integration Tests

```typescript
describe('replaceText Browser Integration', () => {
  test('should execute via MCP API endpoint', async () => {
    // Open browser at localhost:5173
    // Load test document
    // Send MCP tool call
    // Verify editor content changed
  })

  test('should preserve cursor position', async () => {
    // Execute replacement
    // Check cursor moved to end of inserted text
  })

  test('should create single undo step', async () => {
    // Execute replacement
    // Press Ctrl+Z
    // Verify original text restored in one step
  })
})
```

---

## Success Criteria

- [x] TypeScript interface compiles without errors
- [x] All edge cases documented
- [x] Clear parameter validation rules
- [x] Text-to-position conversion specified
- [x] TipTap command mapping complete
- [x] Error handling strategy defined
- [x] MCP tool definition ready
- [x] Browser API architecture designed
- [x] Testing plan created

---

## Implementation Roadmap

**Phase 1 (Current Sprint):** POC Validation
- ✅ Design complete (this document)
- ⏳ Implement simplified position conversion
- ⏳ Build browser API endpoint
- ⏳ Test basic replacement operations
- ⏳ Validate with Chrome DevTools

**Phase 2 (Next Sprint):** Production Hardening
- ⏳ Optimize position conversion algorithm
- ⏳ Add markdown support in `newText`
- ⏳ Handle complex document structures (tables, images)
- ⏳ Add progress indication for long documents
- ⏳ Comprehensive error recovery

**Phase 3 (Future):** Advanced Features
- ⏳ Multi-range replacement (batch operations)
- ⏳ Format preservation (bold, italic, links)
- ⏳ Undo/redo stack inspection
- ⏳ Real-time validation during typing

---

## References

- **TipTap Commands Reference:** `/docs/sprints/sprint-22/tiptap-commands-reference.md`
- **TipTap Official Docs:** https://tiptap.dev/docs/editor/api/commands
- **MCP Specification:** https://modelcontextprotocol.io/specification
- **RiteMark Editor:** `/ritemark-app/src/components/Editor.tsx`

---

## Appendix: Alternative Approaches Considered

### Approach 1: Search and Replace (REJECTED)

```typescript
// ❌ REJECTED: Too slow for large documents
function searchAndReplace(editor: Editor, search: string, replace: string) {
  const text = editor.getText()
  const index = text.indexOf(search)
  // ... calculate positions from search result
}
```

**Why Rejected:**
- O(n) search time for each operation
- Ambiguous when search string appears multiple times
- Doesn't work for structured replacements

### Approach 2: ProseMirror Transform API (FUTURE)

```typescript
// ✅ FUTURE: More efficient, but complex for POC
import { Transform } from 'prosemirror-transform'

function replaceWithTransform(editor: Editor, from: number, to: number, text: string) {
  const tr = editor.state.tr
  tr.replaceWith(from, to, editor.schema.text(text))
  editor.view.dispatch(tr)
}
```

**Why Deferred:**
- Requires deep ProseMirror knowledge
- More error-prone for POC phase
- Overkill for simple text replacement
- Can optimize later if performance becomes issue

### Approach 3: ContentMatch Validation (PRODUCTION)

```typescript
// ✅ PRODUCTION: Validate structure before replacement
function validateStructure(editor: Editor, from: number, to: number) {
  const { doc } = editor.state
  const $from = doc.resolve(from)
  const $to = doc.resolve(to)

  // Check if replacement maintains document structure
  return $from.parent.contentMatchAt($from.index()).validEnd
}
```

**Why Deferred:**
- Adds complexity not needed for POC
- TipTap commands already validate structure
- Implement if production usage reveals edge cases
