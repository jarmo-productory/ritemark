# Sprint 29 Phases 1-2 Implementation Plan

**Status:** Planning Phase
**Date:** 2025-11-17
**Decision:** Option A - Complete foundational streaming/cancellation before building additional widgets

## 🎯 Scope Definition

### In Scope
- ✅ Phase 1: Streaming Responses
- ✅ Phase 2: Request Cancellation UI
- ✅ FindReplaceWidget (after Phases 1-2 complete)

### Deferred to Future Sprints
- ❌ Web Search Integration
- ❌ Multi-Step Workflow Management
- ❌ Additional widgets (summarize, expand, translate)

**Rationale:** "Too many features are not good" - Focus on foundational improvements that benefit all current and future widgets.

---

## 📊 Current Sprint 29 Status

### Completed (90% of Phase 3)
- ✅ Widget Plugin Architecture (WidgetRegistry, WidgetRenderer)
- ✅ RephraseWidget with preview/execute pattern
- ✅ LLM intent detection → widget routing
- ✅ OpenAI function calling integration

### Not Started
- ❌ Phase 1: Streaming Responses (0%)
- ❌ Phase 2: Request Cancellation (10% - AbortController exists, no UI)
- ❌ FindReplaceWidget (architecture ready)

---

## 📋 Phase 1: Streaming Responses

### Current State Analysis

**File:** `src/services/ai/openAIClient.ts`

```typescript
// Current: Blocking call with 90s timeout
const response = await openai.chat.completions.create({
  model: 'gpt-5-nano',
  messages,
  tools: [rephraseTextTool, findAndReplaceAllTool, insertTextTool],
  tool_choice: 'auto'
})
```

**Problem:**
- User sees no progress for 1-3 seconds
- 90-second timeout feels unresponsive
- No indication AI is working

### Target Implementation

#### 1.1 OpenAI Streaming API

```typescript
// Enable streaming
const stream = await openai.chat.completions.create({
  model: 'gpt-5-nano',
  messages,
  tools: [...],
  tool_choice: 'auto',
  stream: true,  // ← Enable streaming
  stream_options: { include_usage: true }
}, {
  signal: abortSignal  // For cancellation
})

// Process stream chunks
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta

  if (delta?.content) {
    // Progressive content updates
    onStreamUpdate(delta.content)
  }

  if (delta?.tool_calls) {
    // Buffer tool call chunks
    bufferToolCall(delta.tool_calls)
  }
}
```

#### 1.2 Progressive UI Updates

**File:** `src/components/AIChat/AIChat.tsx`

**New State:**
```typescript
const [streamingMessage, setStreamingMessage] = useState<string>('')
const [isStreaming, setIsStreaming] = useState(false)
```

**Rendering Logic:**
```typescript
{isStreaming && (
  <Message
    role="assistant"
    content={streamingMessage}
    isStreaming={true}  // Shows typing indicator cursor
  />
)}
```

**UX Flow:**
```
User: "make this longer"
  ↓
[AI typing indicator]
  ↓
"I'll rephrase..."  ← Chunk 1
"I'll rephrase the selected..."  ← Chunk 2
"I'll rephrase the selected text to make it longer."  ← Complete
  ↓
[RephraseWidget appears with preview]
```

#### 1.3 Stream + Tool Calling Integration

**Challenge:** OpenAI streams tool calls incrementally

**Example Stream:**
```json
// Chunk 1
{"delta":{"tool_calls":[{"index":0,"function":{"name":"rep"}}]}}

// Chunk 2
{"delta":{"tool_calls":[{"index":0,"function":{"name":"rephrase"}}]}}

// Chunk 3
{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"text"}}]}}

// Chunk 4
{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\":\"longer"}}]}}
```

**Solution:**
```typescript
class ToolCallBuffer {
  private calls: Map<number, PartialToolCall> = new Map()

  addChunk(chunk: ToolCallDelta) {
    const existing = this.calls.get(chunk.index) || {}
    // Merge function name chunks
    if (chunk.function?.name) {
      existing.name = (existing.name || '') + chunk.function.name
    }
    // Merge argument chunks
    if (chunk.function?.arguments) {
      existing.args = (existing.args || '') + chunk.function.arguments
    }
    this.calls.set(chunk.index, existing)
  }

  isComplete(): boolean {
    // Check if all tool calls have complete JSON arguments
  }

  getToolCalls(): ToolCall[] {
    return Array.from(this.calls.values()).map(call => ({
      name: call.name,
      arguments: JSON.parse(call.args)
    }))
  }
}
```

#### 1.4 Error Handling

**Scenarios:**
1. **Network interruption mid-stream**
   ```typescript
   try {
     for await (const chunk of stream) { ... }
   } catch (error) {
     if (error.name === 'NetworkError') {
       showError('Connection lost. Please try again.')
     }
   }
   ```

2. **OpenAI rate limit during stream**
   ```typescript
   if (chunk.error?.code === 'rate_limit_exceeded') {
     showError('Rate limit reached. Please wait a moment.')
   }
   ```

3. **Malformed JSON in tool arguments**
   ```typescript
   try {
     const args = JSON.parse(toolCallBuffer.args)
   } catch {
     console.error('Invalid tool call JSON:', toolCallBuffer.args)
     showError('Invalid AI response. Please try again.')
   }
   ```

---

## 📋 Phase 2: Request Cancellation

### Current State Analysis

**File:** `src/services/ai/openAIClient.ts`

```typescript
// AbortController exists for timeout only
const controller = new AbortController()
const timeoutId = setTimeout(() => {
  controller.abort()
}, 90000)
```

**Problem:**
- No UI cancel button
- User cannot stop in-flight requests
- Must wait or reload page

### Target Implementation

#### 2.1 UI Cancel Button

**File:** `src/components/AIChat/AIChat.tsx`

**New State:**
```typescript
const [isStreaming, setIsStreaming] = useState(false)
const abortControllerRef = useRef<AbortController | null>(null)
```

**Cancel Handler:**
```typescript
const handleCancel = () => {
  console.log('[AIChat] User cancelled request')
  abortControllerRef.current?.abort()
  setIsStreaming(false)
  setStreamingMessage('')

  // Show cancellation message
  addMessage({
    role: 'system',
    content: 'Request cancelled',
    timestamp: Date.now()
  })
}
```

**UI Component:**
```tsx
{isStreaming ? (
  <button
    onClick={handleCancel}
    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
  >
    Cancel Request
  </button>
) : (
  <button
    onClick={handleSend}
    disabled={!input.trim()}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Send
  </button>
)}
```

#### 2.2 AbortController Integration

**File:** `src/services/ai/openAIClient.ts`

**Updated Method:**
```typescript
async chat(
  messages: Message[],
  onStreamUpdate?: (content: string) => void,
  abortSignal?: AbortSignal  // ← Accept external signal
): Promise<ChatResponse> {
  // Create controller for timeout
  const controller = new AbortController()

  // If external signal provided, forward abort to our controller
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      controller.abort()
    })
  }

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, 90000)

  try {
    const stream = await openai.chat.completions.create(
      { ... },
      { signal: controller.signal }
    )

    // Process stream...

  } catch (error) {
    if (error.name === 'AbortError') {
      if (abortSignal?.aborted) {
        throw new Error('Request cancelled by user')
      } else {
        throw new Error('Request timeout (90s)')
      }
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
```

#### 2.3 Cleanup After Cancellation

**Tasks:**
1. Clear partial streaming message from UI
2. Reset streaming state flags
3. Show "Request cancelled" system message
4. Re-enable chat input
5. Clear abort controller reference
6. Remove any partial widget previews

**Implementation:**
```typescript
const handleCancel = () => {
  // 1. Abort the request
  abortControllerRef.current?.abort()

  // 2. Clear streaming state
  setIsStreaming(false)
  setStreamingMessage('')

  // 3. Clear abort reference
  abortControllerRef.current = null

  // 4. Show cancellation message
  addMessage({
    role: 'system',
    content: 'Request cancelled',
    timestamp: Date.now()
  })

  // 5. Re-enable input (automatically handled by isStreaming state)
}
```

---

## 🔧 Implementation Tasks

### Phase 1: Streaming (8 tasks)
1. Research OpenAI streaming API documentation
2. Add `stream: true` to OpenAI API calls
3. Implement chunk processing loop with tool call buffering
4. Update AIChat state management for streaming
5. Add progressive message rendering in UI
6. Implement stream error handling (network, rate limit, JSON)
7. Test streaming with different prompts
8. Validate streaming works with all 3 tools (rephrase, findReplace, insertText)

### Phase 2: Cancellation (6 tasks)
9. Add "Cancel" button to AIChat UI (replaces Send during streaming)
10. Wire cancel button to AbortController
11. Handle abort signal in streaming loop
12. Show "Request cancelled" system message
13. Clean up partial responses and state on cancel
14. Test cancellation at different stream stages

### Testing & Validation (4 tasks)
15. Run `npm run type-check` (zero errors required)
16. Test in browser at localhost:5173 (streaming + cancellation)
17. Test error scenarios (network fail, rate limit, mid-stream cancel)
18. Commit and deploy to staging for validation

**Total:** 18 tasks

---

## 📂 Files to Modify

### Core Changes
- `src/services/ai/openAIClient.ts`
  - Enable streaming API
  - Tool call buffering
  - Accept external AbortSignal
  - Stream error handling

- `src/components/AIChat/AIChat.tsx`
  - Streaming state management
  - Progressive message rendering
  - Cancel button UI
  - AbortController ref management

### Potential New Files
- `src/hooks/useAIStreaming.ts` - Custom hook for streaming logic (if complexity warrants)
- `src/types/streaming.ts` - TypeScript types for streaming responses

### No Changes Needed
- `src/services/ai/toolExecutor.ts` - Execution happens after stream completes
- `src/services/ai/widgets/` - Widgets work unchanged with streaming
- `src/services/ai/tools/` - Tool definitions unchanged

---

## ⚠️ Technical Considerations

### 1. Widget Preview Timing

**Question:** Show widget preview during streaming or after completion?

**Recommendation:** Wait for complete tool call
- **Why:** Prevents UI flicker from partial data
- **Trade-off:** Slight delay before preview appears
- **Mitigation:** Show "Preparing preview..." message during tool call parsing

### 2. Multiple Tool Calls

**Scenario:** AI calls multiple tools in sequence

**Example:**
```
User: "find all 'TODO' and replace with 'DONE', then make the result formal"
  ↓
Tool 1: findAndReplaceAll({ find: "TODO", replace: "DONE" })
Tool 2: rephrase({ style: "formal" })
```

**Question:** Stream both tool calls or execute sequentially?

**Recommendation:** Execute sequentially with streaming for each
- Show first widget preview
- User confirms/cancels
- If confirmed, execute and show second widget
- Better UX than showing both previews simultaneously

### 3. Stream Buffering Strategy

**OpenAI Chunk Sizes:** Typically 1-50 characters per chunk

**UI Update Frequency:**
- **Too frequent:** Janky rendering, high CPU
- **Too infrequent:** Feels sluggish

**Recommendation:**
```typescript
const BUFFER_UPDATE_MS = 50  // Update UI every 50ms

let buffer = ''
let lastUpdate = Date.now()

for await (const chunk of stream) {
  buffer += chunk.delta?.content || ''

  const now = Date.now()
  if (now - lastUpdate >= BUFFER_UPDATE_MS) {
    onStreamUpdate(buffer)
    buffer = ''
    lastUpdate = now
  }
}

// Flush remaining buffer
if (buffer) onStreamUpdate(buffer)
```

### 4. Error Recovery

**Partial Stream Failure Scenarios:**

1. **Network drops mid-stream**
   - Save partial response
   - Show "Connection lost" error
   - Offer "Retry" button

2. **Rate limit hit during stream**
   - Save partial response
   - Show "Rate limit reached, please wait 60s"
   - Auto-retry after cooldown?

3. **Tool call JSON incomplete**
   - Detect unclosed braces in buffered arguments
   - Show "Invalid response, please try again"
   - Log full buffer for debugging

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- ✅ AI responses stream progressively in chat UI (visible character-by-character)
- ✅ No blocking 90s wait - user sees progress immediately
- ✅ Streaming works with all 3 tools:
  - `rephrase` → RephraseWidget preview
  - `findAndReplaceAll` → Future widget preview
  - `insertText` → Direct execution
- ✅ Error handling works for:
  - Network interruption mid-stream
  - OpenAI rate limits
  - Malformed tool call JSON
- ✅ Tool call buffering reconstructs complete JSON arguments
- ✅ Widget previews appear after stream completes (no flicker)

### Phase 2 Complete When:
- ✅ "Cancel" button appears during streaming (replaces Send button)
- ✅ Clicking cancel stops request immediately (within 100ms)
- ✅ UI shows "Request cancelled" system message
- ✅ Chat returns to ready state:
  - Streaming message cleared
  - Input re-enabled
  - Send button restored
- ✅ Partial responses cleaned up (no ghost messages)
- ✅ Cancellation works at any stream stage:
  - During initial response streaming
  - During tool call buffering
  - Before widget preview shown

---

## 📅 Estimated Effort

### Phase 1: Streaming Responses
- **Research:** 30 min (OpenAI docs, tool call streaming examples)
- **Implementation:** 2 hours
  - Streaming API integration: 45 min
  - Tool call buffering: 45 min
  - UI progressive rendering: 30 min
- **Testing:** 1 hour (different prompts, error scenarios)
- **Total:** 3.5 hours

### Phase 2: Request Cancellation
- **Implementation:** 1 hour
  - Cancel button UI: 20 min
  - AbortController wiring: 20 min
  - Cleanup logic: 20 min
- **Testing:** 30 min (cancel at different stages)
- **Total:** 1.5 hours

### Validation & Deployment
- **Type-check + browser testing:** 30 min
- **Staging deployment + validation:** 30 min
- **Total:** 1 hour

**Grand Total:** 6 hours

---

## 🚀 Next Steps

**After Phases 1-2 Complete:**
1. Build FindReplaceWidget (proves architecture extensibility)
2. Validate widget system with 2 working widgets
3. Sprint 29 complete ✅

**Future Sprints (Deferred):**
- Sprint 30: Web Search Integration?
- Sprint 31: Multi-Step Workflow Management?
- Sprint 32: Additional widgets (summarize, expand, translate)?

---

## 📝 Notes

**Key Decisions:**
- Streaming before cancellation (streaming is dependency for cancel UX)
- Wait for complete tool calls before showing widget previews (prevents flicker)
- Sequential execution for multiple tool calls (better UX than parallel)
- 50ms UI update buffering (balance between smooth and performant)

**Risks:**
- OpenAI streaming API changes (low - stable API)
- Tool call JSON reconstruction complexity (medium - requires careful buffering)
- Browser performance with rapid UI updates (low - 50ms buffer mitigates)

**Dependencies:**
- OpenAI SDK supports streaming: ✅ Yes
- Current widget system compatible with streaming: ✅ Yes (widgets execute after stream)
- AbortController browser support: ✅ Yes (all modern browsers)

---

**Last Updated:** 2025-11-17
**Status:** Awaiting approval to begin implementation
