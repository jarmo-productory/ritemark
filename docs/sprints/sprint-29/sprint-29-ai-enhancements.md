# Sprint 29: Client-Side AI Enhancement

**Duration**: 2-3 weeks
**Focus**: Improve existing client-side AI assistant
**Architecture**: Keep BYOK (Bring Your Own Key) model

---

## 🎯 Decision: Stay Client-Side

### Why NOT Migrate to Vercel AI SDK
❌ Vercel AI SDK requires server-side API routes
❌ Would break BYOK model (user-owned API keys)
❌ Would centralize costs on our server
❌ Adds complexity without clear UX wins

### Why ENHANCE Current Implementation
✅ Already using official OpenAI SDK client-side
✅ BYOK model (users pay for their own usage)
✅ No server costs
✅ Privacy-first (keys stay in browser, encrypted)
✅ Function calling already working well
✅ Solid foundation to build on

---

## 📊 Current State Analysis

### ✅ What's Working Well

1. **Security**
   - API keys encrypted in IndexedDB (AES-256-GCM)
   - Non-extractable CryptoKey
   - User-owned keys (BYOK)

2. **Architecture**
   - Official OpenAI SDK (`openai` package)
   - Function calling with tools (`replaceText`, `insertText`)
   - Conversation history support
   - Selection context integration

3. **UX**
   - Auto-expand on selection
   - Keyboard shortcuts (Ctrl+Shift+A)
   - Accessibility features
   - Tool type indicators (replace/insert icons)

### ⚠️ Pain Points & Opportunities

1. **No Streaming Responses**
   - Currently: Wait for full response (blocking)
   - User sees nothing until complete
   - Feels slow for long responses

2. **Limited Error Handling**
   - Basic retry logic
   - No exponential backoff
   - Network errors require manual refresh

3. **No Cancellation**
   - Can't abort long-running requests
   - 90s timeout but no user control

4. **Conversation UX**
   - No "thinking..." indicator
   - No token usage display
   - No cost estimation

5. **Tool Capabilities**
   - Only 2 tools (replace, insert)
   - Could add more (find, delete, format, etc.)

6. **Model Limitations**
   - Hardcoded `gpt-5-mini` (should this be gpt-4o-mini?)
   - No model selection UI
   - Can't compare responses

---

## 🚀 Enhancement Roadmap

### Phase 1: Streaming Responses (High Priority)

**Goal**: Add real-time streaming for AI responses

**Implementation:**
```typescript
// Current (blocking)
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages
})

// New (streaming)
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  stream: true
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || ''
  // Update UI with streaming content
  updateStreamingMessage(content)
}
```

**Benefits:**
- ✅ Instant feedback (see response as it's generated)
- ✅ Perceived performance improvement
- ✅ Can show "thinking..." state
- ✅ Better UX for long responses

**Complexity**: Medium (OpenAI SDK supports this out-of-the-box)

---

### Phase 2: Request Cancellation & Better Error Handling

**Goal**: Let users cancel requests and handle errors gracefully

**Features:**
1. **Cancel Button**
   ```typescript
   const abortController = new AbortController()

   // Pass to OpenAI
   const stream = await openai.chat.completions.create({
     model: 'gpt-4o',
     messages,
     stream: true
   }, {
     signal: abortController.signal
   })

   // Cancel on button click
   <button onClick={() => abortController.abort()}>Cancel</button>
   ```

2. **Exponential Backoff Retry**
   ```typescript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn()
       } catch (error) {
         if (i === maxRetries - 1) throw error
         const delay = Math.pow(2, i) * 1000  // 1s, 2s, 4s
         await new Promise(resolve => setTimeout(resolve, delay))
       }
     }
   }
   ```

3. **Network Error Recovery**
   - Detect offline state
   - Queue messages for retry
   - Show connection status

**Benefits:**
- ✅ User control over long requests
- ✅ Graceful failure recovery
- ✅ Better offline experience

**Complexity**: Low-Medium

---

### Phase 3: Enhanced Conversation UX

**Goal**: Improve visibility into AI operations

**Features:**
1. **Typing Indicators**
   - "AI is thinking..." while waiting
   - Animated dots or spinner
   - Shows model being used

2. **Token Usage Display**
   ```typescript
   // OpenAI returns usage in response
   const response = await openai.chat.completions.create({...})

   console.log({
     prompt_tokens: response.usage.prompt_tokens,
     completion_tokens: response.usage.completion_tokens,
     total_tokens: response.usage.total_tokens
   })

   // Show in UI: "Used 245 tokens (~$0.001)"
   ```

3. **Cost Estimation**
   - GPT-4o pricing: $2.50/1M input, $10/1M output
   - Show running cost per conversation
   - Warning if approaching limits

4. **Message Actions**
   - Copy message content
   - Regenerate response
   - Edit and resubmit

**Benefits:**
- ✅ Transparency (users see token costs)
- ✅ Control (regenerate, edit)
- ✅ Better understanding of AI behavior

**Complexity**: Low

---

### Phase 4: Additional Tools (Optional)

**Goal**: Expand AI capabilities beyond replace/insert

**New Tools:**
1. **findText**: Search document for text
   ```typescript
   {
     name: 'findText',
     description: 'Find all occurrences of text in document',
     parameters: { searchQuery: string }
   }
   ```

2. **deleteText**: Remove text from document
   ```typescript
   {
     name: 'deleteText',
     description: 'Delete specified text from document',
     parameters: { textToDelete: string }
   }
   ```

3. **formatText**: Apply markdown formatting
   ```typescript
   {
     name: 'formatText',
     description: 'Apply formatting (bold, italic, heading) to text',
     parameters: {
       text: string,
       format: 'bold' | 'italic' | 'heading' | 'code'
     }
   }
   ```

4. **summarizeDocument**: Generate summary
   ```typescript
   {
     name: 'summarizeDocument',
     description: 'Create a summary of the document',
     parameters: { style: 'brief' | 'detailed' }
   }
   ```

**Benefits:**
- ✅ More powerful AI assistant
- ✅ Reduces manual editing
- ✅ Users can do more with natural language

**Complexity**: Medium (each tool needs implementation + testing)

---

### Phase 5: Model Selection (Optional)

**Goal**: Let users choose AI model

**Features:**
1. **Model Picker**
   - Dropdown in AI sidebar
   - Options: GPT-4o, GPT-4o-mini, GPT-3.5-turbo
   - Show pricing for each

2. **Model Comparison**
   - Split view: same prompt, different models
   - Compare response quality
   - Compare costs

3. **Default Model Preference**
   - Save preferred model in settings
   - Per-document model selection

**Benefits:**
- ✅ Cost control (use mini for simple tasks)
- ✅ Quality control (use 4o for complex tasks)
- ✅ User choice

**Complexity**: Low

---

## 📝 Sprint 29 Proposed Scope

### Must-Have (Week 1-2)
- [ ] **Phase 1: Streaming Responses** (HIGH PRIORITY)
  - Stream AI responses word-by-word
  - Add "thinking..." indicator
  - Improve perceived performance

- [ ] **Phase 2: Request Cancellation** (MEDIUM PRIORITY)
  - Add cancel button
  - Better error handling
  - Network status indicator

### Nice-to-Have (Week 3)
- [ ] **Phase 3: Enhanced UX** (LOW PRIORITY)
  - Token usage display
  - Cost estimation
  - Message actions (copy, regenerate)

### Future Sprints
- [ ] Phase 4: Additional Tools (Sprint 30+)
- [ ] Phase 5: Model Selection (Sprint 31+)

---

## 🛠️ Technical Implementation

### Streaming Implementation (Phase 1)

**Current Code (openAIClient.ts:274):**
```typescript
// ❌ Blocking call
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',  // Note: Should this be gpt-4o-mini?
  messages,
  tools: [replaceTextTool, insertTextTool],
  tool_choice: 'auto'
})
```

**New Streaming Pattern:**
```typescript
// ✅ Streaming call
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  tools: [replaceTextTool, insertTextTool],
  tool_choice: 'auto',
  stream: true  // Enable streaming
})

// Process stream chunks
let accumulatedContent = ''
let toolCall: any = null

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta

  // Handle content streaming
  if (delta?.content) {
    accumulatedContent += delta.content
    onStreamUpdate?.(accumulatedContent)  // Update UI
  }

  // Handle tool calls (accumulated over chunks)
  if (delta?.tool_calls) {
    // Accumulate tool call data
    toolCall = mergeToolCallChunks(toolCall, delta.tool_calls[0])
  }
}

// Process final tool call if present
if (toolCall) {
  const args = JSON.parse(toolCall.function.arguments)
  // Execute tool...
}
```

**UI Updates (AIChatSidebar.tsx):**
```typescript
const [streamingMessage, setStreamingMessage] = useState<string>('')
const [isStreaming, setIsStreaming] = useState(false)

const handleSend = async () => {
  // ... existing code ...

  setIsStreaming(true)
  setStreamingMessage('')

  // Pass streaming callback
  const result = await executeCommand(
    userMessageContent,
    editor,
    persistedSelection,
    history,
    {
      onStream: (content) => {
        setStreamingMessage(content)  // Update UI in real-time
      }
    }
  )

  setIsStreaming(false)
  // ... rest of code ...
}

// In JSX
{isStreaming && (
  <div className="message assistant streaming">
    {streamingMessage}
    <span className="cursor">▊</span>
  </div>
)}
```

---

## ✅ Success Criteria

### Phase 1 (Streaming) Complete When:
- [ ] AI responses stream word-by-word (not blocking)
- [ ] "Thinking..." indicator shows while waiting
- [ ] Streaming feels responsive (<100ms first token)
- [ ] Tool calls still work correctly with streaming
- [ ] No regressions in existing functionality

### Phase 2 (Cancellation) Complete When:
- [ ] Users can cancel requests mid-stream
- [ ] Network errors retry automatically (3x)
- [ ] Offline state shows clear message
- [ ] No UI freezing on errors

### Phase 3 (Enhanced UX) Complete When:
- [ ] Token usage displayed after each message
- [ ] Estimated cost shown
- [ ] Messages can be copied/regenerated
- [ ] User feedback is positive

---

## 🎯 Why This Approach is Better

### vs. Vercel AI SDK Migration
| Aspect | Client-Side Enhancements | Vercel AI SDK |
|--------|-------------------------|---------------|
| **BYOK Model** | ✅ Preserved | ❌ Lost |
| **Server Costs** | ✅ Zero | ❌ High |
| **Privacy** | ✅ Keys in browser | ⚠️ Trust required |
| **Streaming** | ✅ Achievable | ✅ Built-in |
| **Complexity** | ✅ Low | ❌ High |
| **User Control** | ✅ Full | ❌ Limited |

### Key Benefits
1. **User Economics**: Users pay OpenAI directly (no markup, no intermediary)
2. **Privacy**: API keys never leave user's browser
3. **Simplicity**: No backend infrastructure needed
4. **Control**: Users own their data and usage
5. **Flexibility**: Can switch to any OpenAI-compatible API

---

## 📚 Resources

### OpenAI SDK Streaming
- [Streaming Documentation](https://github.com/openai/openai-node#streaming-responses)
- [Stream Helpers](https://github.com/openai/openai-node/blob/main/helpers.md#streaming-helpers)

### Example Code
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: userKey, dangerouslyAllowBrowser: true })

// Stream chat completions
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '')
}
```

---

**Status**: ✅ Ready to execute
**Recommendation**: Start with Phase 1 (Streaming) - highest user impact
**Timeline**: 2-3 weeks for all phases
**Risk**: Low (enhancing existing, not replacing)
