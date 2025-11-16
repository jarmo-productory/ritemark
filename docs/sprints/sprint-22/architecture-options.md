# Architecture Options Analysis: Client vs Server Tool Execution

**Sprint**: 22
**Decision**: Architecture approach for AI tool execution
**Status**: Analysis phase (POC in progress)

---

## 🎯 The Core Question

**Where should AI agent tools execute when manipulating the TipTap editor?**

This decision affects:
- Performance (latency)
- Editor state preservation (cursor, selection, undo/redo)
- Implementation complexity
- Security model
- User experience

---

## 🏗️ Option A: Client-Side Tool Execution (Sprint 22 POC)

### Architecture Flow
```
User: "Replace hello with goodbye"
  ↓
Browser: Send to Netlify Function (AI decides)
  ↓
AI: Returns tool call { tool: "replaceText", args: {...} }
  ↓
Browser: Execute TipTap command locally
  ↓
Editor: Updates visually (user sees change)
```

### Pros ✅

**1. Performance - Zero Network Latency**
- Tool execution happens instantly (no server round-trip)
- AI decides in ~1-2s, tools execute in <100ms
- Total time: ~1-2s vs 2-4s for server-side

**2. Editor State Preservation**
- Cursor position maintained
- Text selection preserved
- Undo/redo history intact
- Rich node state (tables, images) unaffected

**3. Direct TipTap Manipulation**
- Access to full TipTap API
- Can execute complex commands (e.g., `insertTable`, `setImage`)
- ProseMirror transactions work naturally

**4. User Experience**
- Feels responsive (instant visual feedback)
- No "flicker" from re-rendering entire document
- Progressive updates possible (AI calls multiple tools sequentially)

### Cons ❌

**1. Implementation Complexity**
- Need to stream tool calls from server to client
- Browser must parse and execute tool calls safely
- More complex error handling (network + execution failures)

**2. Security Concerns**
- Tools execute arbitrary code in browser
- Need validation layer (sanitize AI outputs before execution)
- XSS risk if AI returns malicious tool parameters

**3. Tool Design Challenges**
- Tools need access to TipTap editor instance
- Serializing editor state for AI context is tricky
- Hard to test (need browser environment)

**4. Framework Support Unknown**
- Vercel AI SDK may not support client-side tool execution
- Might need custom implementation
- Unknown unknowns (why isn't this pattern common?)

### Implementation Sketch

```typescript
// 1. User triggers AI request
const response = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Replace hello with goodbye",
    editorContent: editor.getJSON() // Send editor state
  })
})

// 2. AI returns tool calls
const { toolCalls } = await response.json()
// toolCalls = [{ tool: "replaceText", args: { from: 0, to: 5, newText: "goodbye" } }]

// 3. Execute tools in browser
const executor = new ToolExecutor(editor)
for (const toolCall of toolCalls) {
  executor.execute(toolCall)
}
```

### Risk Assessment

**🔴 High Risk Areas:**
- Security validation of AI-generated tool calls
- Streaming tool calls from server (if AI needs multiple round trips)
- Unknown framework support

**🟢 Low Risk Areas:**
- TipTap command execution (well-documented API)
- Undo/redo (TipTap handles automatically)
- Performance (fast by definition)

---

## 🏗️ Option B: Server-Side Tool Execution (Sprint 23 POC)

### Architecture Flow
```
User: "Replace hello with goodbye"
  ↓
Browser: Send to Netlify Function (markdown + prompt)
  ↓
AI: Decides + executes tools on markdown string
  ↓
AI: Returns modified markdown
  ↓
Browser: Update TipTap with new markdown
```

### Pros ✅

**1. Simplicity**
- AI has full context (entire markdown document)
- Tools are just string manipulation functions
- Single round-trip (browser → server → browser)

**2. Security**
- AI never executes code in browser
- Server controls all modifications
- Easy to validate/sanitize markdown output

**3. Framework Support**
- Standard pattern (Vercel AI SDK, OpenAI SDK support this)
- Well-documented examples
- Fewer unknowns

**4. Testable**
- Pure functions (markdown in → markdown out)
- Easy to unit test
- No browser environment needed

### Cons ❌

**1. Editor State Loss**
- Cursor position lost (resets to start or end)
- Text selection cleared
- Undo/redo history reset (new document loaded)
- Rich node state may be lost (table formatting, image metadata)

**2. Performance**
- Network round-trip adds 500ms-1s latency
- User sees "loading" state longer
- Feels less responsive

**3. Markdown Conversion Issues**
- TipTap → Markdown → TipTap conversions may lose fidelity
- Tables, images, custom nodes might break
- Complex formatting may not survive round-trip

**4. Limited Tool Capabilities**
- Tools only manipulate text (no access to TipTap commands)
- Can't execute advanced operations (insertTable, setImage)
- Harder to implement context-aware edits

### Implementation Sketch

```typescript
// 1. User triggers AI request
const markdown = editor.storage.markdown.getMarkdown()

const response = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Replace hello with goodbye",
    markdown: markdown
  })
})

// 2. AI modifies markdown and returns result
const { modifiedMarkdown } = await response.json()

// 3. Update editor (loses state)
editor.commands.setContent(modifiedMarkdown)
// ❌ Cursor position lost
// ❌ Selection cleared
// ❌ Undo history reset
```

### Risk Assessment

**🔴 High Risk Areas:**
- Editor state loss (major UX degradation)
- Markdown round-trip fidelity (data loss potential)
- Limited tool capabilities (can't do advanced operations)

**🟢 Low Risk Areas:**
- Security (server-controlled)
- Framework support (standard pattern)
- Testing (pure functions)

---

## 🏗️ Option C: Hybrid Approach (Future Consideration)

### Architecture Flow
```
User: "Replace hello with goodbye"
  ↓
Browser: Open WebSocket to Netlify Function
  ↓
AI: Decides on tool calls (server-side)
  ↓
AI: Sends tool call to browser via WebSocket
  ↓
Browser: Executes TipTap command
  ↓
Browser: Sends result back to AI via WebSocket
  ↓
AI: Continues multi-step reasoning
```

### Pros ✅
- Best of both worlds (AI reasoning server-side, execution client-side)
- Supports multi-step tool calling with AI checking results
- Editor state preserved

### Cons ❌
- Most complex implementation
- Netlify Functions have WebSocket limitations (10-minute timeout)
- Requires real-time bidirectional connection
- Overkill for MVP

### Decision
**Defer to Sprint 28+** - Only consider if client-side (Option A) proves insufficient

---

## 📊 Comparison Matrix

| Criteria | Client-Side (A) | Server-Side (B) | Hybrid (C) |
|----------|-----------------|-----------------|------------|
| **Performance** | ⚡ Fast (<100ms tool exec) | 🐢 Slower (+500ms-1s) | ⚡ Fast |
| **Editor State** | ✅ Preserved | ❌ Lost | ✅ Preserved |
| **Complexity** | ⚠️ High | ✅ Low | 🔴 Very High |
| **Security** | ⚠️ Need validation | ✅ Server-controlled | ⚠️ Need validation |
| **Undo/Redo** | ✅ Works naturally | ❌ History reset | ✅ Works naturally |
| **Tool Capabilities** | ✅ Full TipTap API | ⚠️ Text only | ✅ Full TipTap API |
| **Framework Support** | ⚠️ Unknown | ✅ Well-supported | ⚠️ Custom |
| **Testability** | ⚠️ Needs browser | ✅ Pure functions | ⚠️ Complex |
| **Markdown Fidelity** | ✅ No conversion | ⚠️ Round-trip issues | ✅ No conversion |
| **Latency** | 1-2s total | 2-4s total | 1-2s total |

---

## 🎯 Sprint 22 POC Goal

**Validate Client-Side Approach (Option A)**

**If Sprint 22 POC succeeds:**
- ✅ TipTap commands execute reliably from tool calls
- ✅ Editor state preserved (cursor, selection, undo)
- ✅ Performance acceptable (<2s total, <100ms tool execution)
- ✅ No major security blockers identified

**Then:** Proceed to Sprint 24 (Architecture Decision Document) - lock in Option A

**If Sprint 22 POC fails:**
- ❌ TipTap state conflicts cause issues
- ❌ Security validation too complex
- ❌ Framework doesn't support pattern

**Then:** Proceed to Sprint 23 (Server-Side POC) - test Option B before deciding

---

## 🔍 Decision Criteria

After Sprint 22 POC, evaluate:

**1. Technical Feasibility** (Must Have)
- [ ] Can we execute TipTap commands from tool calls?
- [ ] Does editor state remain stable?
- [ ] Can we validate AI outputs safely?

**2. User Experience** (High Priority)
- [ ] Does it feel fast and responsive?
- [ ] Is undo/redo behavior intuitive?
- [ ] Are there any visual glitches?

**3. Developer Experience** (Medium Priority)
- [ ] Is code maintainable?
- [ ] Can we test reliably?
- [ ] Does framework support pattern?

**4. Security** (Must Have)
- [ ] Can we prevent XSS attacks?
- [ ] Can we validate tool parameters?
- [ ] Are there any major vulnerabilities?

---

## 📝 Recommendation (Pre-POC)

**Hypothesis**: Client-side execution (Option A) is the right approach because:

1. **User Experience Priority** - Editor state preservation is critical for WYSIWYG editor
2. **Performance Matters** - RiteMark targets non-technical users who expect instant feedback
3. **Tool Capabilities** - Future features (tables, images) need full TipTap API access
4. **Risk is Manageable** - Security validation can be implemented (whitelist tools, validate params)

**BUT**: We need Sprint 22 POC to validate hypothesis before committing.

**Fallback**: If POC fails, Sprint 23 tests Option B (server-side) before final decision.

**Long-term**: If Option A succeeds but has limitations, consider Option C (hybrid) in Sprint 28+.

---

**Next Steps:**
1. Complete Sprint 22 POC (client-side execution)
2. Document findings in `sprint-22-results.md`
3. Make architecture decision: Sprint 23 (test Option B) or Sprint 24 (lock in Option A)
4. Update this document with POC results and final recommendation

---

**References:**
- Research Brief Section 2: Client vs Server Tool Execution
- TipTap Commands API: https://tiptap.dev/docs/editor/api/commands
- Vercel AI SDK Docs: https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
