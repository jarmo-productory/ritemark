# Sprint 23: Real AI Tool Implementation - Research & Audit

**Sprint Goal**: Implement first production AI tool with real LLM integration
**Architecture**: Client-side tool execution (validated in Sprint 22)
**Target**: Single `replaceText` tool with OpenAI or Anthropic Claude
**Date**: November 3, 2025

---

## 🎯 Executive Summary

**Sprint 22 Validated**: Client-side AI tool execution works (POC successful)
**Sprint 23 Objective**: Replace POC with production-ready AI integration
**Critical Decision**: Choose LLM provider (OpenAI vs Anthropic vs Vercel AI SDK)

**Recommendation**: Start with **OpenAI SDK directly** (simplest, proven, 80 lines)

---

## 📊 Current State (Post-Sprint 22)

### ✅ What We Have
- `ToolExecutor` service - Executes TipTap commands (KEEP)
- `FakeAI` parser - Hardcoded pattern matching (REPLACE)
- `AICommandPOC` UI - Testing interface (REPLACE)
- TipTap integration working
- Client-side architecture validated

### ❌ What We Need
- Real LLM API integration (OpenAI or Anthropic)
- Intelligent text search (find "hello" anywhere in document)
- Context awareness (understand document structure)
- Production UI (not gray testing box)
- Error handling (API failures, rate limits)
- Streaming responses (show AI thinking)

---

## 🔍 Critical Decisions for Sprint 23

### Decision 1: LLM Provider

**Option A: OpenAI SDK (Recommended for Sprint 23)** ⭐
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Client-side usage
})

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [{ role: "user", content: prompt }],
  tools: [{ type: "function", function: replaceTextTool }]
})
```

**Pros:**
- ✅ Simple integration (80 lines of code)
- ✅ 15 KB bundle size
- ✅ Function calling mature (2+ years production)
- ✅ Well-documented
- ✅ RiteMark already uses OpenAI for other features

**Cons:**
- ⚠️ Need API key management (BYOK or proxy)
- ⚠️ Cost: $0.01 per request (gpt-4-turbo)

---

**Option B: Anthropic Claude SDK**
```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20250219",
  tools: [replaceTextTool],
  messages: [{ role: "user", content: prompt }]
})
```

**Pros:**
- ✅ Better at text editing (62-70% SWE-Bench)
- ✅ Zero tool-calling failures (benchmarks)
- ✅ Extended Thinking mode (multi-step reasoning)

**Cons:**
- ⚠️ Larger bundle (~30 KB)
- ⚠️ Newer function calling API
- ⚠️ Need backend proxy (no browser SDK officially)

---

**Option C: Vercel AI SDK** (Deferred to Sprint 24+)
```typescript
import { generateText } from 'ai'

const result = await generateText({
  model: openai('gpt-4-turbo-preview'),
  tools: { replaceText: replaceTextTool },
  prompt: userPrompt
})
```

**Pros:**
- ✅ Automatic tool orchestration (handles loops)
- ✅ Streaming built-in
- ✅ React hooks for UI state

**Cons:**
- ⚠️ More abstraction (80 → 150+ lines)
- ⚠️ Sprint 23 goal is simplicity
- ✅ Good for Sprint 25+ (multi-tool orchestration)

---

### **Decision 1 Recommendation: OpenAI SDK (Direct)**

**Why:**
1. Fastest path to working feature (Sprint 23 = 1-2 days)
2. RiteMark already has OpenAI relationship
3. Can swap to Anthropic later (same tool interface)
4. Vercel AI SDK better for Sprint 25+ (multiple tools)

**Cost: $0.01 per edit with gpt-4-turbo** (acceptable for MVP)

---

## Decision 2: Text Search Strategy

**Problem**: AI returns `replace "hello" with "goodbye"` but we need document positions.

**Sprint 22 POC**: Hardcoded `from: 0, to: oldText.length` (wrong position)
**Sprint 23 Need**: Intelligent search to find "hello" at correct position

### Solution: `findTextInDocument()` Helper

```typescript
function findTextInDocument(editor: Editor, searchText: string): { from: number, to: number } | null {
  const plainText = editor.getText()
  const textOffset = plainText.indexOf(searchText)

  if (textOffset === -1) return null

  // Convert text offset to TipTap document position
  const docPosition = textOffsetToDocPosition(editor, textOffset)

  return {
    from: docPosition,
    to: docPosition + searchText.length
  }
}
```

**Complexity**: ~50 lines (text search + position conversion)
**Handles**: Case-sensitive search, first occurrence
**Future**: Fuzzy search, all occurrences (Sprint 25+)

---

## Decision 3: AI Tool Design

### Tool Specification for OpenAI

```typescript
const replaceTextTool = {
  type: "function",
  function: {
    name: "replaceText",
    description: "Replace a specific text string in the document",
    parameters: {
      type: "object",
      properties: {
        searchText: {
          type: "string",
          description: "The exact text to find and replace"
        },
        newText: {
          type: "string",
          description: "The replacement text"
        }
      },
      required: ["searchText", "newText"]
    }
  }
}
```

**Key Change from Sprint 22**:
- Old: AI provides positions (`from: 0, to: 5`)
- New: AI provides search text (`searchText: "hello"`)
- Browser finds positions using `findTextInDocument()`

**Why This Works Better:**
- ✅ AI doesn't need to calculate positions (it can't see TipTap doc structure)
- ✅ Browser has access to editor state (knows exact positions)
- ✅ Separation of concerns (AI = what to change, Browser = where it is)

---

## Decision 4: UI Approach

**Replace POC gray box with...**

### Option A: Inline Command Input (Recommended) ⭐

```typescript
// Simple input at bottom of editor
<div className="border-t pt-2">
  <input
    placeholder="Ask AI to edit... (e.g., 'make the title shorter')"
    onKeyDown={(e) => e.key === 'Enter' && handleAICommand(e.target.value)}
  />
</div>
```

**Pros:**
- ✅ Minimal UI (Johnny Ive invisible interface)
- ✅ Fast to implement (30 lines)
- ✅ Keyboard-focused (Enter to execute)

**Cons:**
- ⚠️ No conversation history
- ⚠️ No streaming feedback

---

### Option B: Chat Sidebar (Sprint 25+)

**Deferred**: Requires more UI work (Chat history, message bubbles, streaming)
**Better for**: Multi-turn conversations, complex edits

---

## Decision 5: Error Handling

### Critical Error Scenarios

**1. API Key Missing**
```typescript
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to .env')
}
```

**2. Text Not Found**
```typescript
const position = findTextInDocument(editor, searchText)
if (!position) {
  return { error: `Text "${searchText}" not found in document` }
}
```

**3. API Rate Limit**
```typescript
try {
  const response = await openai.chat.completions.create(...)
} catch (error) {
  if (error.status === 429) {
    return { error: 'Rate limit exceeded. Please try again in a moment.' }
  }
  throw error
}
```

**4. Network Timeout**
```typescript
const controller = new AbortController()
setTimeout(() => controller.abort(), 30000) // 30s timeout

const response = await openai.chat.completions.create({
  ...config,
  signal: controller.signal
})
```

---

## 📦 Sprint 23 Implementation Plan

### Phase 1: Remove POC Code (30 min)
- Delete `src/components/ai/AICommandPOC.tsx`
- Delete `src/services/ai/fakeAI.ts`
- Keep `src/services/ai/toolExecutor.ts` (refactor as needed)
- Remove POC integration from `Editor.tsx`

### Phase 2: OpenAI Integration (2 hours)
- Install: `npm install openai`
- Create `src/services/ai/openAIClient.ts`
- Implement function calling with `replaceText` tool
- Add environment variable: `VITE_OPENAI_API_KEY`

### Phase 3: Text Search (1 hour)
- Create `src/services/ai/textSearch.ts`
- Implement `findTextInDocument(editor, searchText)`
- Handle text-to-position conversion
- Test with multi-line documents

### Phase 4: Update ToolExecutor (1 hour)
- Refactor to accept `searchText` instead of `from/to`
- Integrate `findTextInDocument()`
- Return helpful error messages

### Phase 5: Simple UI (1 hour)
- Create `src/components/ai/AICommandInput.tsx`
- Inline input below editor
- Enter key to execute
- Loading state during API call

### Phase 6: Testing & Polish (2 hours)
- Test with real OpenAI API
- Test error cases (text not found, API failure)
- Test undo/redo
- Browser validation

---

## 🎯 Success Criteria

### Must Have
- [ ] User types: "replace hello with goodbye"
- [ ] AI finds "hello" at correct position
- [ ] Editor updates with "goodbye"
- [ ] Undo works (Cmd+Z restores "hello")
- [ ] Error handling (text not found, API errors)
- [ ] TypeScript compiles with zero errors
- [ ] Works in Chrome/Safari/Firefox

### Nice to Have (Sprint 24+)
- [ ] Streaming responses (show AI thinking)
- [ ] Multiple occurrences handling
- [ ] Fuzzy text matching
- [ ] Command history
- [ ] Keyboard shortcuts

---

## 🔐 Security & API Keys

### Approach: BYOK (Bring Your Own Key)

**User provides their own OpenAI API key:**
```typescript
// src/contexts/SettingsContext.tsx (already exists from Sprint 21)
settings.apiKeys.openai = userProvidedKey
```

**Why BYOK:**
- ✅ Zero cost for RiteMark (user pays OpenAI directly)
- ✅ Already have settings infrastructure (Sprint 21)
- ✅ Users control their own usage/costs
- ✅ No rate limiting needed (user's own quota)

**Alternative (Future)**: RiteMark proxy with rate limiting (Sprint 25+)

---

## 📊 Estimated Effort

| Phase | Time | Complexity |
|-------|------|------------|
| Remove POC | 30 min | Low |
| OpenAI Integration | 2 hours | Medium |
| Text Search | 1 hour | Medium |
| ToolExecutor Update | 1 hour | Low |
| Simple UI | 1 hour | Low |
| Testing & Polish | 2 hours | Medium |
| **TOTAL** | **7.5 hours** | **1 day** |

---

## 🚀 Next Sprint Preview

**Sprint 24: Expand to 3 Tools**
- `insertText` - Add text at position
- `applyFormatting` - Bold, italic, heading
- Multi-step AI orchestration

**Sprint 25: Advanced Features**
- Vercel AI SDK migration (streaming)
- Chat sidebar UI
- Multi-turn conversations
- Command history

---

## 📚 Reference Materials

**API Documentation:**
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- TipTap Commands: https://tiptap.dev/docs/editor/api/commands
- TipTap Position System: https://tiptap.dev/docs/editor/core-concepts/schema

**Sprint 22 Learnings:**
- `/docs/sprints/sprint-22/tiptap-tools-spec.md` - Tool design
- `/docs/sprints/sprint-22/tiptap-commands-reference.md` - TipTap API
- `/docs/sprints/sprint-22/sprint-22-ACTUAL-results.md` - POC validation

**Research Brief (Reference Only):**
- `/docs/research/agents/deep-research/research-brief-tiptap-ai-agent.md`

---

## ✅ Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **LLM Provider** | OpenAI SDK (direct) | Simplest, proven, RiteMark already uses OpenAI |
| **Text Search** | `findTextInDocument()` helper | AI provides search text, browser finds position |
| **Tool Design** | `replaceText(searchText, newText)` | Simpler than position-based |
| **UI Approach** | Inline command input | Minimal, keyboard-focused, fast to implement |
| **API Keys** | BYOK (user provides) | Zero cost, already have settings UI |
| **Error Handling** | Graceful failures | Text not found, API errors, timeouts |

---

**Audit Complete**: Ready for Sprint 23 implementation
**Estimated Duration**: 1 day (7.5 hours)
**Risk Level**: Low (building on validated Sprint 22 architecture)
**Blockers**: None (all decisions made)
