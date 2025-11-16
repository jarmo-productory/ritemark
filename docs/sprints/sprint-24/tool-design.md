# Sprint 24: Tool Design - Technical Specifications from User Needs

**Status**: 🎨 Design Phase
**Date**: November 4, 2025
**Prerequisites**: Read `jtbd-research.md` first

---

## 🎯 Design Philosophy

**Core Principle**: Tool signatures should match user mental models, not database schemas or API conventions.

Users say:
- "add examples **after this paragraph**" (not "insert at position 1247")
- "make **this** bold" (not "apply bold to range 45-67")
- "replace 'hello' **everywhere**" (not "loop through matches")

Our tools should accept commands the way users **think**, then handle the technical complexity internally.

---

## 🛠️ Tool 1: `replaceText` (Existing - Sprint 23)

### Current Implementation Review

**Signature** (Sprint 23):
```typescript
interface ReplaceTextParams {
  searchText: string  // Text to find (case-sensitive)
  newText: string     // Replacement text
}
```

**How It Works**:
1. User says: "replace 'hello' with 'goodbye'"
2. AI extracts: `{ searchText: "hello", newText: "goodbye" }`
3. Tool searches document for "hello" (case-insensitive)
4. If found, replaces ALL instances
5. Returns success/failure message

### Strengths (Keep for Sprint 24)
✅ Simple, intuitive signature
✅ Matches user mental model perfectly
✅ Handles multiple instances automatically
✅ Case-insensitive search (user-friendly)

### Limitations (Accept for Now)
❌ Can't replace only SOME instances (e.g., "first 2 occurrences")
❌ Can't use regex patterns (advanced use case)
❌ No position-based replacement (requires exact text match)

**Verdict**: Keep as-is. Handles 80% of replacement use cases perfectly.

---

## 🛠️ Tool 2: `insertText` (NEW - Sprint 24)

### User Mental Model Analysis

Users think about insertion in **3 ways**:

1. **Absolute positions** - "at the start/end"
2. **Relative positions** - "after this paragraph"
3. **Selection-based** - "here" (cursor/selection)

### Proposed Signature (Draft 1)

```typescript
interface InsertTextParams {
  // WHERE to insert (choose one strategy)
  position: {
    // Strategy 1: Absolute positions
    location?: 'start' | 'end'

    // Strategy 2: Relative to text
    after?: string   // Insert after this text
    before?: string  // Insert before this text

    // Strategy 3: Selection-based (if editor has selection)
    atSelection?: boolean
  }

  // WHAT to insert
  content: string
}
```

**Problem**: Too many options! Users get confused by optional fields.

### Simplified Signature (Draft 2) ⭐

```typescript
interface InsertTextParams {
  // Natural language position (AI interprets)
  where: string  // "start", "end", "after the introduction", "at cursor"

  // Content to insert
  content: string
}
```

**How It Works**:
1. User says: "add examples after the first paragraph"
2. AI calls: `insertText("after the first paragraph", "Example 1: ...\nExample 2: ...")`
3. Tool uses text search to find "first paragraph"
4. Inserts content after that paragraph
5. Returns success message

**Advantages**:
- ✅ Flexible: Handles all 3 strategies with single field
- ✅ User-friendly: Matches natural language
- ✅ AI-friendly: GPT-5 excellent at interpreting position strings
- ✅ Future-proof: Can add new position strategies without breaking API

**Disadvantages**:
- ❌ Ambiguous: "after the introduction" requires text search
- ❌ Fragile: If text not found, insertion fails
- ❌ Performance: Text search on every insertion

### Hybrid Approach (Draft 3 - RECOMMENDED) 🎯

```typescript
interface InsertTextParams {
  // Position strategy (structured + flexible)
  position:
    | { type: 'absolute', location: 'start' | 'end' }
    | { type: 'relative', anchor: string, placement: 'before' | 'after' }
    | { type: 'selection' }  // Use current editor selection

  // Content to insert
  content: string
}
```

**OpenAI Function Definition**:
```typescript
const insertTextTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'insertText',
    description: 'Insert new text at a specific position in the document',
    parameters: {
      type: 'object',
      properties: {
        position: {
          type: 'object',
          description: 'Where to insert the text',
          oneOf: [
            {
              properties: {
                type: { const: 'absolute' },
                location: { enum: ['start', 'end'] }
              },
              required: ['type', 'location']
            },
            {
              properties: {
                type: { const: 'relative' },
                anchor: { type: 'string', description: 'Text to search for' },
                placement: { enum: ['before', 'after'] }
              },
              required: ['type', 'anchor', 'placement']
            },
            {
              properties: {
                type: { const: 'selection' }
              },
              required: ['type']
            }
          ]
        },
        content: {
          type: 'string',
          description: 'The text to insert (can include markdown formatting)'
        }
      },
      required: ['position', 'content']
    }
  }
}
```

**User Command Examples**:

| User Says | AI Calls |
|-----------|----------|
| "add a summary at the top" | `insertText({ type: 'absolute', location: 'start' }, "Summary: ...")` |
| "add examples after this paragraph" | `insertText({ type: 'relative', anchor: "paragraph text...", placement: 'after' }, "Example 1...")` |
| "insert here" | `insertText({ type: 'selection' }, "content")` |

**Implementation Strategy**:

```typescript
// In toolExecutor.ts
async function executeInsertText(
  editor: Editor,
  params: InsertTextParams
): Promise<ToolResult> {
  let insertPosition: number

  // Resolve position strategy to TipTap position
  switch (params.position.type) {
    case 'absolute':
      insertPosition = params.position.location === 'start'
        ? 0
        : editor.state.doc.content.size
      break

    case 'relative':
      // Use text search to find anchor
      const anchorPos = findTextInDocument(editor, params.position.anchor)
      if (!anchorPos) {
        return { success: false, error: `Text not found: ${params.position.anchor}` }
      }
      insertPosition = params.position.placement === 'after'
        ? anchorPos.to
        : anchorPos.from
      break

    case 'selection':
      const { from, to } = editor.state.selection
      insertPosition = to  // Insert at end of selection
      break
  }

  // Execute insertion with TipTap
  editor.chain()
    .focus()
    .insertContentAt(insertPosition, params.content)
    .run()

  return {
    success: true,
    message: `Inserted text at ${params.position.type} position`
  }
}
```

---

## 🛠️ Tool 3: `applyFormatting` (NEW - Sprint 24)

### User Mental Model Analysis

Users think about formatting in **2 ways**:

1. **Target selection** - "make THIS bold" (what to format)
2. **Format type** - "bold", "italic", "heading 2" (how to format)

### Proposed Signature (Draft 1)

```typescript
interface ApplyFormattingParams {
  // WHAT to format (choose one)
  target: {
    text?: string         // Format specific text (e.g., "hello")
    selection?: boolean   // Format current editor selection
    all?: boolean         // Format entire document
  }

  // HOW to format
  format: 'bold' | 'italic' | 'heading' | 'bulletList' | 'orderedList' | 'blockquote'

  // Additional options
  options?: {
    level?: number        // For headings (1-6)
    listType?: 'bullet' | 'numbered'  // For lists
  }
}
```

**Problem**: Similar to insertText - too many optional fields!

### Simplified Signature (RECOMMENDED) 🎯

```typescript
interface ApplyFormattingParams {
  // Target strategy
  target:
    | { type: 'text', value: string }          // Format specific text
    | { type: 'selection' }                     // Format current selection
    | { type: 'all' }                           // Format entire document

  // Format to apply
  format: {
    type: 'bold' | 'italic' | 'heading' | 'bulletList' | 'orderedList' | 'blockquote'
    level?: number  // For headings (1-6)
  }
}
```

**OpenAI Function Definition**:
```typescript
const applyFormattingTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'applyFormatting',
    description: 'Apply formatting to text in the document (bold, italic, headings, lists)',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'object',
          description: 'What text to format',
          oneOf: [
            {
              properties: {
                type: { const: 'text' },
                value: { type: 'string', description: 'Text to find and format' }
              },
              required: ['type', 'value']
            },
            {
              properties: {
                type: { const: 'selection' }
              },
              required: ['type']
            },
            {
              properties: {
                type: { const: 'all' }
              },
              required: ['type']
            }
          ]
        },
        format: {
          type: 'object',
          properties: {
            type: {
              enum: ['bold', 'italic', 'heading', 'bulletList', 'orderedList', 'blockquote']
            },
            level: {
              type: 'number',
              minimum: 1,
              maximum: 6,
              description: 'Heading level (only for heading format)'
            }
          },
          required: ['type']
        }
      },
      required: ['target', 'format']
    }
  }
}
```

**User Command Examples**:

| User Says | AI Calls |
|-----------|----------|
| "make this bold" | `applyFormatting({ type: 'selection' }, { type: 'bold' })` |
| "make 'hello' bold" | `applyFormatting({ type: 'text', value: 'hello' }, { type: 'bold' })` |
| "make 'Introduction' a heading 2" | `applyFormatting({ type: 'text', value: 'Introduction' }, { type: 'heading', level: 2 })` |
| "make all 'TODO' items bold" | `applyFormatting({ type: 'text', value: 'TODO' }, { type: 'bold' })` |

**Implementation Strategy**:

```typescript
// In toolExecutor.ts
async function executeApplyFormatting(
  editor: Editor,
  params: ApplyFormattingParams
): Promise<ToolResult> {
  // Step 1: Find all target positions
  let positions: Array<{ from: number, to: number }> = []

  switch (params.target.type) {
    case 'selection':
      const { from, to } = editor.state.selection
      positions = [{ from, to }]
      break

    case 'text':
      // Find all instances of text in document
      positions = findAllTextOccurrences(editor, params.target.value)
      if (positions.length === 0) {
        return { success: false, error: `Text not found: ${params.target.value}` }
      }
      break

    case 'all':
      positions = [{ from: 0, to: editor.state.doc.content.size }]
      break
  }

  // Step 2: Apply formatting to all positions
  let chain = editor.chain().focus()

  for (const pos of positions) {
    chain = chain.setTextSelection({ from: pos.from, to: pos.to })

    switch (params.format.type) {
      case 'bold':
        chain = chain.toggleBold()
        break
      case 'italic':
        chain = chain.toggleItalic()
        break
      case 'heading':
        chain = chain.toggleHeading({ level: params.format.level || 1 })
        break
      case 'bulletList':
        chain = chain.toggleBulletList()
        break
      case 'orderedList':
        chain = chain.toggleOrderedList()
        break
      case 'blockquote':
        chain = chain.toggleBlockquote()
        break
    }
  }

  chain.run()

  return {
    success: true,
    message: `Applied ${params.format.type} to ${positions.length} location(s)`
  }
}
```

---

## 🎯 Selection-Aware Architecture (CRITICAL)

**Core Principle**: Chat must ALWAYS know what text is selected

### Why Selection Context is Essential

**User Mental Model** (from JTBD research):
- When I select text, the AI sees it
- "make this bold" means "make THE SELECTION bold"
- I shouldn't have to tell AI what I just selected

**Technical Challenge**:
- Editor lives in `<Editor />` component
- Chat lives in `<AIChatSidebar />` component
- Selection state must flow between them **in real-time**

### Selection State Management

**Data Structure**:
```typescript
// Shared interface for selection context
interface EditorSelection {
  text: string        // Selected text content
  from: number        // Start position (TipTap position)
  to: number          // End position (TipTap position)
  isEmpty: boolean    // True if no selection
  wordCount?: number  // Optional: for UI display
}
```

**State Flow**:
```
Editor (TipTap) → React State → ChatSidebar → AI System Prompt → Tool Execution
       ↓                ↓              ↓                ↓                ↓
   onSelectionUpdate  useState    Display UI    "Selected: X"   Use selection
```

### Implementation Pattern

**Option 1: Props Passing (Recommended for Sprint 24)**

```typescript
// In Editor parent component (e.g., App.tsx or EditorContainer.tsx)
const [currentSelection, setCurrentSelection] = useState<EditorSelection>({
  text: '',
  from: 0,
  to: 0,
  isEmpty: true
})

// Listen to TipTap selection changes
useEffect(() => {
  if (!editor) return

  const updateSelection = () => {
    const { from, to, empty } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')

    setCurrentSelection({
      text,
      from,
      to,
      isEmpty: empty,
      wordCount: text.split(/\s+/).filter(Boolean).length
    })
  }

  editor.on('selectionUpdate', updateSelection)
  editor.on('transaction', updateSelection)

  return () => {
    editor.off('selectionUpdate', updateSelection)
    editor.off('transaction', updateSelection)
  }
}, [editor])

// Pass to ChatSidebar
<AIChatSidebar
  editor={editor}
  selection={currentSelection}  // Real-time selection context
/>
```

**Option 2: Context API (Future Enhancement)**

```typescript
// For larger apps, use React Context
const EditorSelectionContext = createContext<EditorSelection | null>(null)

export function EditorSelectionProvider({ children, editor }) {
  const [selection, setSelection] = useState<EditorSelection>(...)

  // Same useEffect as above

  return (
    <EditorSelectionContext.Provider value={selection}>
      {children}
    </EditorSelectionContext.Provider>
  )
}

// In ChatSidebar
function AIChatSidebar() {
  const selection = useContext(EditorSelectionContext)
  // Use selection in AI calls
}
```

### ChatSidebar UI with Selection Feedback

**Selection Indicator Component**:
```typescript
function SelectionIndicator({ selection }: { selection: EditorSelection }) {
  if (selection.isEmpty) {
    return (
      <div className="text-muted text-sm p-2 bg-muted/50 rounded">
        💡 Tip: Select text to give AI context
      </div>
    )
  }

  return (
    <div className="border rounded p-3 mb-3 bg-blue-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Selected Text</span>
          <span className="text-xs text-muted-foreground">
            ({selection.wordCount} words)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.commands.setTextSelection({ from: 0, to: 0 })}
        >
          Clear
        </Button>
      </div>
      <p className="text-sm mt-2 text-muted-foreground truncate">
        "{selection.text.substring(0, 100)}..."
      </p>
    </div>
  )
}

// In AIChatSidebar render
<AIChatSidebar selection={selection}>
  <SelectionIndicator selection={selection} />
  {/* Chat messages */}
</AIChatSidebar>
```

### AI System Prompt with Selection Context

**Every AI call includes selection**:
```typescript
// In openAIClient.ts
async function executeCommand(
  prompt: string,
  editor: Editor,
  selection: EditorSelection  // NEW REQUIRED PARAMETER
): Promise<AICommandResult> {
  const openai = await createOpenAIClient()
  if (!openai) {
    return { success: false, error: 'API key not configured' }
  }

  // Build system message with selection context
  const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: selection.isEmpty
      ? 'You are editing a document. No text is currently selected.'
      : `You are editing a document. Currently selected text: "${selection.text}"\n\nWhen the user says "this" or "selected text", they are referring to the text above.`
  }

  // User message
  const userMessage: OpenAI.ChatCompletionUserMessageParam = {
    role: 'user',
    content: prompt
  }

  // Call OpenAI with selection context
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [systemMessage, userMessage],
    tools: [replaceTextTool, insertTextTool, applyFormattingTool],
    tool_choice: 'auto'
  })

  // Process tool calls (AI now knows about selection)
  // ...
}
```

### Tool Execution with Selection Context

**Modify tool executors to accept selection**:

```typescript
// In toolExecutor.ts

// Update function signatures
async function executeReplaceText(
  editor: Editor,
  params: ReplaceTextParams,
  selection: EditorSelection  // NEW
): Promise<ToolResult> {
  // If user says "replace this" and has selection, use selection.text
  const searchText = params.searchText === 'this' && !selection.isEmpty
    ? selection.text
    : params.searchText

  // Rest of implementation...
}

async function executeInsertText(
  editor: Editor,
  params: InsertTextParams,
  selection: EditorSelection  // NEW
): Promise<ToolResult> {
  // If position type is 'selection', use selection.to
  if (params.position.type === 'selection') {
    if (selection.isEmpty) {
      return {
        success: false,
        error: 'No text selected. Please select text first.'
      }
    }

    // Insert at end of selection
    editor.chain()
      .focus()
      .insertContentAt(selection.to, params.content)
      .run()

    return { success: true, message: 'Inserted after selection' }
  }

  // Rest of implementation...
}

async function executeApplyFormatting(
  editor: Editor,
  params: ApplyFormattingParams,
  selection: EditorSelection  // NEW
): Promise<ToolResult> {
  // If target type is 'selection', use selection positions
  if (params.target.type === 'selection') {
    if (selection.isEmpty) {
      return {
        success: false,
        error: 'No text selected. Please select the text you want to format.'
      }
    }

    // Apply formatting to selection
    editor.chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .toggleBold()  // Or whatever format
      .run()

    return { success: true, message: 'Applied formatting to selection' }
  }

  // Rest of implementation...
}
```

### User Experience Improvements

**1. Visual Feedback When Selection Changes**
```typescript
// In ChatSidebar
useEffect(() => {
  if (!selection.isEmpty) {
    // Show toast notification
    toast.info(`Selected: "${selection.text.substring(0, 30)}..."`)
  }
}, [selection.text])
```

**2. Smart Defaults Based on Selection**
```typescript
// If user types command while text is selected
if (!selection.isEmpty) {
  // Suggest selection-based actions
  const suggestions = [
    "make this bold",
    "improve this",
    "add examples after this",
    "convert this to a list"
  ]
}
```

**3. Contextual Error Messages**
```typescript
// When tool requires selection but none exists
if (selection.isEmpty) {
  return {
    error: "Please select the text you want to format, then try again",
    suggestion: "💡 Tip: Click and drag to select text, then tell me what to do with it"
  }
}
```

### Testing Selection Integration

**Unit Tests**:
```typescript
describe('Selection-aware tools', () => {
  it('should use selection for "make this bold"', async () => {
    // Setup: Select text
    editor.commands.setTextSelection({ from: 0, to: 5 })
    const selection = {
      text: 'Hello',
      from: 0,
      to: 5,
      isEmpty: false
    }

    // User command
    const result = await executeCommand(
      'make this bold',
      editor,
      selection
    )

    // Assert: Tool used selection
    expect(result.success).toBe(true)
    expect(editor.getHTML()).toContain('<strong>Hello</strong>')
  })

  it('should error when no selection for "make this bold"', async () => {
    const selection = { text: '', from: 0, to: 0, isEmpty: true }

    const result = await executeCommand(
      'make this bold',
      editor,
      selection
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Please select')
  })
})
```

### Migration from Sprint 23

**Breaking Change**: Add `selection` parameter to `executeCommand`

**Before (Sprint 23)**:
```typescript
const result = await executeCommand(userPrompt, editor)
```

**After (Sprint 24)**:
```typescript
const result = await executeCommand(userPrompt, editor, currentSelection)
```

**Migration Checklist**:
- [ ] Add selection state management to Editor parent component
- [ ] Pass selection to ChatSidebar via props
- [ ] Update `executeCommand` signature to accept selection
- [ ] Update all tool executors to accept selection
- [ ] Add selection indicator UI to ChatSidebar
- [ ] Update AI system prompt to include selection context
- [ ] Add tests for selection-based operations

---

## 🔗 Tool Integration (3-Tool System)

### OpenAI Configuration

```typescript
// In openAIClient.ts
const AI_TOOLS: OpenAI.ChatCompletionTool[] = [
  replaceTextTool,     // Existing (Sprint 23)
  insertTextTool,      // NEW (Sprint 24)
  applyFormattingTool  // NEW (Sprint 24)
]

// Pass all tools to OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: conversationHistory,
  tools: AI_TOOLS,  // AI can choose ANY of these 3 tools
  tool_choice: 'auto'  // Let AI decide which tool to use
})
```

### Multi-Tool Orchestration

**User Says**: "write an introduction and make it a heading 2"

**AI Thinks**:
1. First, I need to INSERT text (use `insertText`)
2. Then, I need to APPLY formatting (use `applyFormatting`)

**AI Executes**:
```typescript
// Call 1: Insert introduction
await insertText(
  { type: 'absolute', location: 'start' },
  "Introduction\n\nThis document explains..."
)

// Call 2: Format as heading
await applyFormatting(
  { type: 'text', value: 'Introduction' },
  { type: 'heading', level: 2 }
)
```

**Challenge**: Multi-step operations require conversation memory
- AI needs to remember it just inserted "Introduction"
- Then format that specific text in next call

**Solution**: Use OpenAI conversation context
```typescript
const conversationHistory = [
  { role: 'user', content: "write an introduction and make it a heading 2" },
  { role: 'assistant', content: "I'll insert an introduction paragraph first", tool_calls: [...] },
  { role: 'tool', content: "Success: Inserted introduction", tool_call_id: "..." },
  { role: 'assistant', content: "Now I'll format it as heading 2", tool_calls: [...] }
]
```

---

## 🎨 UX Design Patterns

### Pattern 1: Progressive Disclosure

**Principle**: Show advanced features only when needed

**Example**: Heading level selection
```
User: "make this a heading"
AI: "What level heading? (1-6)"
User: "2"
AI: [applies heading 2]
```

Better:
```
User: "make this a heading 2"
AI: [applies heading 2 directly, no follow-up question]
```

**Design Rule**: If 80% of users want heading 2, make it the default. Only ask for clarification when ambiguous.

---

### Pattern 2: Contextual Defaults

**Principle**: Infer intent from document state

**Example**: Bold formatting
```
User: "make this bold"

# If text is selected:
AI: [applies bold to selection]

# If no selection:
AI: "Please select the text you want to make bold, then try again"
```

**Design Rule**: Use editor selection as implicit context whenever possible.

---

### Pattern 3: Forgiving Interpretation

**Principle**: Handle variations of same command

**Example**: Insert at start
```
User variations:
- "add at the top"
- "insert at the beginning"
- "put this at the start"
- "write this first"

AI interprets all as:
insertText({ type: 'absolute', location: 'start' }, content)
```

**Design Rule**: GPT-5 handles this naturally. Don't over-constrain command syntax.

---

## 🚨 Error Handling Strategy

### Error Categories

**1. Not Found Errors** (User typo or text doesn't exist)
```typescript
{
  success: false,
  error: "Text 'hello' not found in document",
  suggestion: "Did you mean 'helo' or 'Hello'?"  // Fuzzy matching
}
```

**2. Ambiguous Errors** (Multiple matches, unclear intent)
```typescript
{
  success: false,
  error: "Found 5 instances of 'hello'. Please specify which one",
  suggestion: "Try: 'make the first hello bold' or 'make all hello bold'"
}
```

**3. Invalid Operation Errors** (Can't apply format to that content type)
```typescript
{
  success: false,
  error: "Cannot apply heading format to code blocks",
  suggestion: "Select text outside the code block and try again"
}
```

**4. Position Errors** (Can't insert at invalid position)
```typescript
{
  success: false,
  error: "Cannot insert text inside a link",
  suggestion: "Place cursor before or after the link and try again"
}
```

---

## 📊 Tool Selection Logic (AI Decision Making)

### How GPT-5 Chooses Tools

OpenAI uses function descriptions + user prompt to select tool. We optimize for clarity:

**replaceText**: "Replace **existing** text with new text"
- Keywords: "replace", "change", "fix typo", "update"

**insertText**: "Insert **new** text at a position"
- Keywords: "add", "insert", "write", "create", "append"

**applyFormatting**: "Apply formatting **without changing text**"
- Keywords: "bold", "italic", "heading", "format", "make it a list"

### Ambiguous Commands (Edge Cases)

**User**: "add bold to this paragraph"

**AI Interpretation**:
- ❌ Wrong: `insertText` (no new text being added)
- ❌ Wrong: `replaceText` (text isn't changing)
- ✅ Correct: `applyFormatting` (bold = formatting)

**AI Reasoning** (via function descriptions):
- "add bold" = apply formatting (not inserting new text)
- "to this paragraph" = target existing content

**Design Rule**: Function descriptions are CRITICAL for tool selection accuracy. Test with 100+ user commands.

---

## 🧪 Testing Strategy

### Unit Tests (Per Tool)

**insertText**:
```typescript
test('inserts at start', () => {
  const result = insertText(editor, {
    position: { type: 'absolute', location: 'start' },
    content: 'Hello'
  })
  expect(editor.getText()).toStartWith('Hello')
})

test('inserts after text', () => {
  editor.commands.setContent('Paragraph 1')
  insertText(editor, {
    position: { type: 'relative', anchor: 'Paragraph 1', placement: 'after' },
    content: '\n\nParagraph 2'
  })
  expect(editor.getText()).toContain('Paragraph 1\n\nParagraph 2')
})
```

**applyFormatting**:
```typescript
test('makes text bold', () => {
  editor.commands.setContent('Hello world')
  applyFormatting(editor, {
    target: { type: 'text', value: 'Hello' },
    format: { type: 'bold' }
  })
  expect(editor.getHTML()).toContain('<strong>Hello</strong>')
})
```

### Integration Tests (Multi-Tool)

```typescript
test('insert and format', async () => {
  // User: "add introduction and make it heading 2"
  await insertText(editor, {
    position: { type: 'absolute', location: 'start' },
    content: 'Introduction'
  })

  await applyFormatting(editor, {
    target: { type: 'text', value: 'Introduction' },
    format: { type: 'heading', level: 2 }
  })

  expect(editor.getHTML()).toContain('<h2>Introduction</h2>')
})
```

### User Acceptance Tests (Real Commands)

```typescript
const userCommands = [
  "add examples after the first paragraph",
  "make this bold",
  "replace hello with goodbye",
  "write a conclusion at the end",
  "make 'Introduction' a heading 2",
  "add bullet points here"
]

// Feed each command to AI, verify correct tool selection
for (const command of userCommands) {
  const result = await executeCommand(command, editor)
  expect(result.success).toBe(true)
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Tool Signatures ✅ (This Document)
- ✅ Define `insertText` signature
- ✅ Define `applyFormatting` signature
- ✅ OpenAI function definitions
- ✅ Error handling strategy

### Phase 2: Core Implementation (Next)
- [ ] Implement `insertText` tool executor
- [ ] Implement `applyFormatting` tool executor
- [ ] Add tools to OpenAI configuration
- [ ] Update `toolExecutor.ts` router

### Phase 3: Integration Testing
- [ ] Unit tests for each tool
- [ ] Integration tests for multi-tool workflows
- [ ] User acceptance tests with real commands
- [ ] Error handling tests

### Phase 4: UX Polish
- [ ] Toast notifications for tool actions
- [ ] Undo support for each tool
- [ ] Loading states during execution
- [ ] Error messages with suggestions

---

## 📚 References

**Sprint 23 Files**:
- `ritemark-app/src/services/ai/openAIClient.ts` - Current `replaceText` implementation
- `ritemark-app/src/services/ai/toolExecutor.ts` - Tool routing logic
- `ritemark-app/src/services/ai/textSearch.ts` - Text finding utilities

**TipTap Docs**:
- Commands API: https://tiptap.dev/docs/editor/api/commands
- insertContentAt: https://tiptap.dev/docs/editor/api/commands/insert-content-at
- toggleBold/toggleItalic: https://tiptap.dev/docs/editor/api/marks

**OpenAI Docs**:
- Function Calling: https://platform.openai.com/docs/guides/function-calling
- Tool Choice: https://platform.openai.com/docs/api-reference/chat/create#tool-choice

---

**Last Updated**: November 4, 2025
**Next Document**: `implementation-plan.md` - Step-by-step coding guide
