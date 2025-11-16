# Sprint 24: Document Context Tool - getFullDocument

**Status**: 🎯 Critical Addition (User Insight)
**Date**: November 4, 2025
**Type**: Read-Only Tool (Foundational)

---

## 🎯 The Missing Piece

**User Insight**: "User may want to ask: 'how do I improve this document?' - then the AI needs to READ the whole doc"

**Why This Matters**: Without full document context, AI is **blind** to:
- Document structure (sections, flow)
- Writing quality (consistency, tone)
- Missing content (gaps in logic)
- Overall coherence (does it make sense as a whole?)

---

## ❌ Current Limitation (Sprint 23)

**What AI Can See**:
- ✅ Selected text (if user selected something)
- ✅ Specific text mentioned in command ("replace 'hello'")
- ❌ **NOTHING ELSE** - AI is blind to rest of document

**User Frustration**:
```
User: "how do I improve this document?"
AI: "I can only see selected text. Please select what you want me to improve."
User: 😡 "I meant the WHOLE document!"
```

**Commands That Fail Without Full Context**:
- "summarize this document"
- "is this document well-structured?"
- "what's missing from this document?"
- "check if the tone is consistent"
- "does the conclusion match the introduction?"
- "rate this document out of 10"

---

## 🛠️ Tool 0: `getFullDocument` (Foundational)

**Purpose**: Give AI read-only access to entire document

**Type**: Read-Only (does NOT modify document)

**Priority**: **HIGHEST** - Should be implemented FIRST (before editing tools)

### Tool Signature

```typescript
interface GetFullDocumentParams {
  // No parameters needed - just return everything
}

interface GetFullDocumentResult {
  text: string          // Plain text content
  html: string          // HTML with formatting
  markdown: string      // Markdown output
  wordCount: number     // Total words
  headings: string[]    // All headings (for structure analysis)
  metadata?: {
    title?: string
    lastModified?: Date
    fileId?: string
  }
}
```

### OpenAI Function Definition

```typescript
const getFullDocumentTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getFullDocument',
    description: 'Read the entire document content for analysis, summarization, or providing feedback on the whole document. Use this when the user asks about the document as a whole rather than specific text.',
    parameters: {
      type: 'object',
      properties: {
        // No parameters - AI just calls this to read everything
      }
    }
  }
}
```

---

## 🎯 User Workflows (Document-Level Operations)

### Workflow 1: "How Do I Improve This Document?" (Most Common)

**User Command**: "how do I improve this document?"

**AI Execution**:
1. Calls `getFullDocument()` to read everything
2. Analyzes:
   - Structure (headings, sections)
   - Writing quality (clarity, conciseness)
   - Tone consistency
   - Missing elements (examples, transitions, conclusion)
3. Returns actionable feedback with specific suggestions

**AI Response Example**:
```
I've analyzed your document (1,247 words). Here are my suggestions:

**Structure**: Good! Clear introduction, 3 main sections, conclusion.

**Improvements Needed**:
1. Section 2 lacks examples - would you like me to add some?
2. Transition between sections 1-2 is abrupt - I can add a connecting paragraph
3. Conclusion doesn't reference the introduction - shall I strengthen this?
4. Tone shifts from formal (intro) to casual (section 3) - want me to make it consistent?

Would you like me to make these changes?
```

**Why This Works**:
- AI sees full context (not just selection)
- Specific, actionable suggestions
- User can approve/reject each change

---

### Workflow 2: "Summarize This Document"

**User Command**: "summarize this document"

**AI Execution**:
1. Calls `getFullDocument()`
2. Analyzes key points, structure, main arguments
3. Returns concise summary (3-5 sentences)

**AI Response Example**:
```
This document (1,247 words) discusses AI-powered writing assistants.

**Summary**: The document introduces the concept of AI writing tools, explains
their benefits for content creators, details three key features (text generation,
formatting, collaboration), and concludes that AI assistants will become essential
for modern writing workflows.

**Key Points**:
- Target audience: Content creators and marketing teams
- Main benefit: 2-3x faster writing with consistent quality
- Call to action: Try the tool for free
```

---

### Workflow 3: "Is This Document Well-Structured?"

**User Command**: "is this document well-structured?"

**AI Execution**:
1. Calls `getFullDocument()`
2. Analyzes heading hierarchy, section balance, logical flow
3. Returns structural assessment

**AI Response Example**:
```
**Structure Analysis**:

✅ **Strengths**:
- Clear heading hierarchy (H1 → H2 → H3)
- Balanced sections (300-400 words each)
- Logical flow (problem → solution → benefits → call to action)

⚠️ **Issues**:
- Section 2 has no subheadings (consider breaking into H3s)
- Section 3 is 3x longer than others (too dense)
- Missing transition between introduction and Section 1

**Recommendation**: Add subheadings in Section 2, split Section 3 into two sections.
Would you like me to make these changes?
```

---

## 🏗️ Implementation Strategy (CONFIRMED)

### ✅ PRIMARY APPROACH: Context-First, Refresh-on-Demand

**User Insight**: "Chat should ALWAYS start by reading the full doc (markdown can be passed with initial prompt) - that gives the context. But we still need getFullDocument tool for when user changes the doc and AI needs to read again."

**This is the CORRECT architecture.** 🎯

---

### How It Works

**Step 1: EVERY conversation starts with full document context**

```typescript
async function executeCommand(
  prompt: string,
  editor: Editor,
  selection: EditorSelection
) {
  // Get full document (markdown format - clean and readable)
  const markdown = editor.storage.markdown.getMarkdown()
  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length

  // ALWAYS include full document in system prompt
  const systemMessage = {
    role: 'system',
    content: `You are editing a markdown document.

**Full Document Content** (${wordCount} words):
\`\`\`markdown
${markdown}
\`\`\`

**Currently Selected Text**: ${selection.isEmpty ? 'None' : `"${selection.text}"`}

When the user says "this document", they mean the full markdown content above.
When the user says "this" or "selected text", they mean the selected portion.

You have access to tools to modify this document. Analyze the full context before making suggestions.`
  }

  // User's message
  const userMessage = {
    role: 'user',
    content: prompt
  }

  // Call OpenAI with full context
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [systemMessage, userMessage, ...conversationHistory],
    tools: [getFullDocumentTool, replaceTextTool, insertTextTool, applyFormattingTool]
  })

  // AI now has full context from message #1
}
```

**Step 2: AI can refresh context if document changes**

```typescript
// Tool for mid-conversation refreshes
const getFullDocumentTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getFullDocument',
    description: 'Get the current full document content. Use this if the user has edited the document since the conversation started and you need to see the latest version.',
    parameters: {
      type: 'object',
      properties: {}  // No parameters - just refresh
    }
  }
}

// Implementation
async function executeGetFullDocument(
  editor: Editor
): Promise<ToolResult> {
  const markdown = editor.storage.markdown.getMarkdown()
  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length

  return {
    success: true,
    message: `Document refreshed (${wordCount} words)`,
    data: {
      markdown,
      wordCount,
      lastModified: new Date().toISOString()
    }
  }
}
```

---

### Why This Architecture is Optimal

**Benefits**:
1. ✅ **Zero latency** - AI has context from first message (no tool call delay)
2. ✅ **Better responses** - AI sees full document structure, can give holistic suggestions
3. ✅ **Handles edits** - If user changes doc mid-conversation, AI can refresh
4. ✅ **Simple** - Just pass markdown as text (no complex tool orchestration)
5. ✅ **Token efficient** - Only refresh when actually needed (not on every message)

**Example Conversation Flow**:
```
[Conversation starts - Full document in system prompt]

User: "how do I improve this document?"
AI: [Already has full context] "I've analyzed your 1,247-word document. Here are 4 suggestions..."

User: "ok, add examples in section 2"
AI: [Uses insertText tool, modifies document]

[User manually adds 200 more words to section 3]

User: "now summarize the whole document again"
AI: [Realizes document might have changed]
AI: [Calls getFullDocument() to see latest version]
AI: "Updated summary (now 1,447 words): ..."
```

---

### When AI Calls `getFullDocument` Tool

**Scenarios where AI refreshes context**:
1. User says "read the document again"
2. User mentions they edited something ("I just added a conclusion")
3. AI detects conversation is stale (many messages since initial context)
4. User asks for analysis after making changes

**AI Decision Logic** (handled by GPT-5-mini automatically):
- GPT-5 is smart enough to know when it needs fresh context
- Function description tells AI when to use: "if user has edited..."
- AI will call tool proactively when appropriate

---

### Alternative Approaches (Why We Rejected Them)

**❌ Tool-First (AI must call tool before every analysis)**:
- Adds 500ms+ latency to EVERY document-level query
- Worse UX (user waits for tool call)
- More complex (AI must remember to call tool)
- Wasted tool call when document hasn't changed

**❌ No Initial Context (Only provide on request)**:
- AI starts blind (doesn't know document exists)
- User must explicitly say "read the document first"
- Bad UX (extra back-and-forth)
- Misses obvious improvements

**✅ Context-First, Refresh-on-Demand (Our Approach)**:
- Best of both worlds
- Instant responses on first query
- Handles edits gracefully
- Simple implementation

---

## 📊 Token Usage Analysis

**Document Sizes & Token Costs**:

| Document Size | Words | Tokens (~1.3x words) | Claude Sonnet 4 Cost |
|---------------|-------|----------------------|----------------------|
| Short blog post | 500 | 650 | $0.0020 |
| Medium article | 1,500 | 1,950 | $0.0059 |
| Long document | 3,000 | 3,900 | $0.0117 |
| Very long | 5,000 | 6,500 | $0.0195 |

**Cost Analysis**:
- Including full document in system prompt: ~$0.02 per long document query
- User gets MUCH better results (AI sees full context)
- Worth the cost for document-level operations

**Optimization**:
- For simple commands ("make this bold"), don't include full document
- For document-level queries ("improve this document"), include full context
- Use smart prompt construction based on command type

---

## 🎯 Command Classification (When to Use Full Document)

### Always Use Full Document Context:

```
"summarize this document"
"how do I improve this document?"
"is this well-structured?"
"check if the tone is consistent"
"rate this document"
"what's missing from this document?"
"does the conclusion match the introduction?"
"restructure this document"
"make this document more professional"
```

### Never Use Full Document Context:

```
"make this bold" (selection-based)
"replace hello with goodbye" (text-based)
"add examples after this paragraph" (selection/anchor-based)
```

### Maybe Use Full Document Context:

```
"add a conclusion" (need to understand what was said before)
"add examples in section 2" (need to see section structure)
"fix all typos" (could use full context or incremental search)
```

---

## 🚨 Breaking Change Impact

### Updated Tool Count

**Before (Original Sprint 24 Plan)**: 3 tools
1. `replaceText` (Sprint 23)
2. `insertText` (NEW)
3. `applyFormatting` (NEW)

**After (With Document Context)**: 4 tools
0. `getFullDocument` (NEW - **FOUNDATIONAL**)
1. `replaceText` (Sprint 23)
2. `insertText` (NEW)
3. `applyFormatting` (NEW)

### Implementation Priority

**Phase 0**: Document Context (FIRST!) 🎯
- Implement `getFullDocument` or system prompt strategy
- Test document-level queries
- Validate token usage

**Phase 1**: `insertText` (SECOND)
- Now AI can say "I see your document lacks examples in Section 2. Let me add some."
- Uses full document context to understand structure

**Phase 2**: `applyFormatting` (THIRD)
- AI can say "I notice your headings are inconsistent. Let me fix that."
- Uses full document context to find all headings

---

## ✅ Updated Definition of Done

Sprint 24 is complete when:

**Document Context** (NEW):
1. ✅ AI can read full document content
2. ✅ User can ask "how do I improve this document?"
3. ✅ AI provides document-level analysis and suggestions
4. ✅ Token usage optimized (smart context inclusion)

**Selection Awareness**:
5. ✅ Chat sidebar shows selected text
6. ✅ AI understands "this" refers to selection

**Tool Functionality**:
7. ✅ `insertText` tool works
8. ✅ `applyFormatting` tool works
9. ✅ All tools accept selection context

---

## 🎨 UX Design for Document-Level Operations

### Chat Sidebar UI

**Document Analysis Mode**:
```
┌─────────────────────────────────────┐
│ 📄 Analyzing Document...            │
│ (1,247 words, 3 sections)           │
├─────────────────────────────────────┤
│ User: how do I improve this?        │
│                                      │
│ AI: I've analyzed your document.    │
│     Here are my suggestions:        │
│                                      │
│     1. Section 2 lacks examples     │
│        → [Add Examples]              │
│                                      │
│     2. Abrupt transition S1→S2      │
│        → [Fix Transition]            │
│                                      │
│     3. Tone inconsistency           │
│        → [Make Formal]               │
└─────────────────────────────────────┘
```

**Action Buttons**: User can click to execute specific improvements

---

## 🔮 Future Enhancements (Beyond Sprint 24)

### Advanced Document Analysis

**Readability Scores**:
- Flesch-Kincaid reading level
- Average sentence length
- Passive voice percentage

**SEO Analysis** (for blog posts):
- Keyword density
- Meta description quality
- Heading structure for SEO

**Structural Patterns**:
- "This document follows problem-solution structure"
- "Consider adding a 'Why This Matters' section"
- "Missing call-to-action"

---

## 📝 Implementation Checklist

**Phase 0: Document Context (2-3 hours)**:
- [ ] Decide: System prompt vs. tool call approach
- [ ] Implement full document retrieval
- [ ] Add to AI system prompt or tool registry
- [ ] Test token usage with different document sizes
- [ ] Test document-level queries ("summarize this")

**Phase 1-3: Other Tools** (as planned):
- [ ] `insertText` tool
- [ ] `applyFormatting` tool
- [ ] Selection awareness

---

## 🎯 Key Takeaways

1. **Document context is FOUNDATIONAL** - Should be Tool 0 (before editing tools)
2. **Read-only tools are safer** - Can't break anything, just provide context
3. **Token cost is worth it** - Users get MUCH better results with full context
4. **Smart context inclusion** - Only include full document when needed
5. **Document-level operations are common** - "Improve this document" is a top use case

---

**User Insight Impact**: CRITICAL - This changes Sprint 24 from "3 editing tools" to "1 read tool + 3 editing tools"

**Recommended Priority**: Implement `getFullDocument` FIRST (Phase 0), then editing tools

---

**Last Updated**: November 4, 2025
**Status**: CRITICAL ADDITION - Changes sprint scope
**Next Step**: Decide on system prompt vs. tool call approach
