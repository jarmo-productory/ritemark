# Current AI Implementation Audit

## 🎯 Purpose
Document the current OpenAI-based AI chat implementation to establish baseline for migration evaluation.

## 📊 Current Architecture

### Technology Stack
- **AI Provider**: OpenAI API (direct `fetch` calls)
- **Model**: GPT-4o (gpt-4o)
- **Streaming**: Server-Sent Events (SSE) via custom parsing
- **UI Framework**: React (TipTap editor integration)
- **State Management**: React hooks (local component state)

### Key Components

#### 1. AIChatSidebar Component
**Location**: `ritemark-app/src/components/ai/AIChatSidebar.tsx`

**Responsibilities:**
- Display chat messages (user + AI)
- Handle user input via textarea
- Manage streaming responses
- Display editor selection context
- Show loading states and errors

**Props:**
```typescript
interface AIChatSidebarProps {
  editor: TipTapEditor
  fileId: string | null
  liveSelection?: EditorSelection
  persistedSelection?: EditorSelection
  onClearSelection?: () => void
}
```

**Key Features:**
- ✅ Streaming response display (word-by-word)
- ✅ Selection context display (yellow highlight)
- ✅ Clear selection button
- ✅ Auto-scroll to latest message
- ✅ Error handling with retry

#### 2. API Integration
**Method**: Direct OpenAI API calls

**Current Implementation Pattern:**
```typescript
// Assumed pattern based on typical React streaming
const handleSendMessage = async () => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [...messages, { role: 'user', content: userMessage }],
      stream: true
    })
  })

  // Manual SSE parsing
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    // Parse SSE format, extract content
    // Update UI with streaming text
  }
}
```

#### 3. Context Management
**Editor Selection Context:**
- Persisted selection shown in sidebar
- Sent to OpenAI as part of system/user message
- Visual highlight in editor (yellow/amber)
- Clear button to remove context

**File Context:**
- File ID passed to sidebar
- Potentially used for document-specific context
- May include file metadata in prompts

### Current Data Flow

```
User Input (Textarea)
  ↓
Build OpenAI Messages Array
  ↓
Fetch OpenAI API (stream: true)
  ↓
Manual SSE Parsing (chunk by chunk)
  ↓
Update Local State (streaming text)
  ↓
React Re-render (display tokens)
  ↓
Complete → Add to Messages History
```

### Current Pain Points

#### 1. Manual Streaming Implementation
**Problem:**
- Custom SSE parsing logic (error-prone)
- Manual chunk decoding and UI updates
- Complex state management for streaming

**Impact:**
- More code to maintain
- Potential bugs in stream handling
- Harder to add features (e.g., tool calls)

#### 2. Error Handling
**Current State:**
```typescript
// Likely basic try-catch with error display
try {
  await streamResponse()
} catch (error) {
  setError('Failed to get response')
  // Manual retry logic?
}
```

**Limitations:**
- No automatic retry with backoff
- No network error recovery
- Limited error context for debugging

#### 3. Type Safety
**Issues:**
- OpenAI types may be manually defined or incomplete
- Streaming chunk types not fully typed
- Message format validation manual

#### 4. Testing Complexity
**Challenges:**
- Mocking streaming responses difficult
- SSE parsing logic hard to unit test
- Integration tests require OpenAI API mocking

### What Works Well

#### ✅ Strengths
1. **User Experience**: Smooth streaming display, good visual feedback
2. **Editor Integration**: Selection context works seamlessly
3. **UI/UX**: Clean sidebar design, intuitive controls
4. **Simplicity**: Direct API calls, no extra dependencies
5. **Performance**: Streaming feels responsive

### Technical Debt

#### Current Issues
1. **Code Duplication**: SSE parsing logic could be reused
2. **Hard-coded Model**: `gpt-4o` string literals (should be config)
3. **API Key Management**: Need to verify secure storage
4. **No Provider Abstraction**: Tightly coupled to OpenAI

#### Future-Proofing Concerns
1. **Model Switching**: Hard to add Claude, Gemini, etc.
2. **Advanced Features**: Tool calling, function calling, JSON mode
3. **Multimodal**: Adding image/vision support would require rewrites
4. **Rate Limiting**: No built-in rate limit handling

## 📦 Dependencies Audit

### Current AI-Related Dependencies
```json
// To be verified from package.json
{
  "@openai/openai": "version?",  // Or no package, just fetch?
  // Other AI-related packages?
}
```

**Bundle Size Impact:**
- Current implementation: Minimal (just `fetch`)
- No extra libraries for streaming

## 🔍 Code Locations to Audit

### Required Review
- [ ] `ritemark-app/src/components/ai/AIChatSidebar.tsx`
- [ ] `ritemark-app/src/hooks/useAI.ts` (if exists)
- [ ] `ritemark-app/src/services/ai/` (if exists)
- [ ] `ritemark-app/src/types/ai.ts` (if exists)
- [ ] Environment variables (OPENAI_API_KEY)
- [ ] API route handlers (if backend calls OpenAI)

### Questions to Answer
1. **Where is OpenAI API key stored?** (env var, backend, encrypted?)
2. **Client or server-side calls?** (security implications)
3. **Message history storage?** (local state, database, neither?)
4. **Prompt engineering?** (system messages, templates?)
5. **Token counting?** (for cost tracking or limits?)

## 📊 Performance Metrics

### Current Baseline (To Measure)
- **Time to First Token (TTFT)**: ? ms
- **Streaming Speed**: ? tokens/sec
- **Error Rate**: ? %
- **Bundle Size**: ? KB (AI-related code)
- **API Call Overhead**: ? ms

## 🎯 Migration Requirements

### Must Preserve
1. ✅ Streaming response display (word-by-word)
2. ✅ Editor selection context integration
3. ✅ Visual selection highlighting
4. ✅ Error states and user feedback
5. ✅ Auto-scroll behavior
6. ✅ Message history display

### Can Improve
1. 🔄 Error handling and retry logic
2. 🔄 Type safety for messages and responses
3. 🔄 Code maintainability (less custom streaming logic)
4. 🔄 Provider flexibility (OpenAI → others)
5. 🔄 Testing infrastructure

### Should Not Change
- ❌ User-facing behavior (UX must stay identical)
- ❌ Editor integration patterns
- ❌ Visual design and layout
- ❌ Performance characteristics

## 📝 Next Steps

1. **Code Review**: Read actual implementation files
2. **Measure Baseline**: Collect performance metrics
3. **Document API Calls**: Exact OpenAI API usage patterns
4. **Identify Gaps**: What's missing vs best practices?
5. **Compare with Vercel AI SDK**: Feature-by-feature comparison

---

**Status**: 📝 Draft - Needs actual code review to fill in specifics
**Last Updated**: January 15, 2025
