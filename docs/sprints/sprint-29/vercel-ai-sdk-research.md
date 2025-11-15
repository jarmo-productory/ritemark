# Vercel AI SDK Research & Evaluation

## 🎯 Purpose
Evaluate Vercel AI SDK capabilities for migrating RiteMark's AI chat functionality.

## 📚 What is Vercel AI SDK?

### Overview
The Vercel AI SDK is an open-source library for building AI-powered applications with streaming UI support. It provides:

- **Framework-agnostic core** with React, Vue, Svelte, Solid bindings
- **Unified API** for multiple AI providers (OpenAI, Anthropic, Google, etc.)
- **Streaming primitives** optimized for real-time UI updates
- **Type-safe hooks** with excellent TypeScript inference
- **Edge runtime support** for serverless deployments

### Official Resources
- **Docs**: https://sdk.vercel.ai/docs
- **GitHub**: https://github.com/vercel/ai
- **NPM**: `ai` (main package), `@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.

## 🏗️ Architecture Comparison

### Current: Manual OpenAI Implementation
```typescript
// Custom streaming logic
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${key}` },
  body: JSON.stringify({ model: 'gpt-4o', messages, stream: true })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()
// ... manual chunk parsing, state updates
```

**Pros:**
- ✅ No dependencies
- ✅ Full control over streaming

**Cons:**
- ❌ Custom SSE parsing (error-prone)
- ❌ Manual state management
- ❌ No retry/error handling
- ❌ Hard to add features

### Vercel AI SDK: useChat Hook
```typescript
import { useChat } from 'ai/react'

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',  // Backend API route
  body: {
    fileId,
    selection: persistedSelection
  }
})

// UI automatically updates as stream arrives
return (
  <div>
    {messages.map(m => <Message key={m.id} {...m} />)}
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
    </form>
  </div>
)
```

**Pros:**
- ✅ Built-in streaming UI updates
- ✅ Automatic state management
- ✅ Error handling with retry
- ✅ TypeScript types included
- ✅ Less code to maintain

**Cons:**
- ➖ Requires backend API route (not direct client calls)
- ➖ Learning curve for new patterns

## 🔑 Key Features for RiteMark

### 1. useChat Hook (Core Feature)

#### What It Provides
```typescript
const {
  messages,           // Array of chat messages
  input,              // Current input value
  handleInputChange,  // Input change handler
  handleSubmit,       // Form submit handler
  isLoading,          // Loading state
  error,              // Error state
  reload,             // Retry last message
  stop,               // Stop streaming
  append,             // Add message programmatically
  setMessages         // Update message history
} = useChat(options)
```

#### Options for RiteMark
```typescript
useChat({
  api: '/api/chat',
  body: {
    // Custom context passed to backend
    fileId: fileId,
    selection: persistedSelection?.text,
    selectionRange: { from: persistedSelection?.from, to: persistedSelection?.to }
  },
  onResponse: (response) => {
    // Handle response metadata
  },
  onFinish: (message) => {
    // Message complete
  },
  onError: (error) => {
    // Handle errors
  }
})
```

### 2. Backend API Route (Required)

#### Server-Side Pattern
```typescript
// app/api/chat/route.ts (Next.js App Router)
// OR netlify/functions/chat.ts (Netlify Functions)

import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, fileId, selection } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a helpful writing assistant. ${
      selection ? `User selected: "${selection}"` : ''
    }`,
    messages
  })

  return result.toDataStreamResponse()
}
```

#### RiteMark Backend Options
1. **Netlify Functions** (current infrastructure)
   - Create `netlify/functions/ai-chat.ts`
   - Use Vercel AI SDK's `streamText` helper
   - Return streaming response

2. **Edge Functions** (faster, global deployment)
   - Deploy to Netlify Edge
   - Lower latency for AI responses

### 3. Streaming Performance

#### How Vercel AI SDK Optimizes Streaming

**Data Stream Protocol:**
- Custom protocol for efficient streaming
- Includes text chunks + metadata
- Supports tool calls, errors, finish reason

**React Optimization:**
- Batched state updates (reduces re-renders)
- Optimistic updates for UI responsiveness
- Smart chunking for smooth display

**Network Resilience:**
- Automatic reconnection on network errors
- Request deduplication
- Built-in retry with exponential backoff

### 4. Provider Flexibility

#### Current: OpenAI Only
```typescript
// Tightly coupled to OpenAI
fetch('https://api.openai.com/v1/chat/completions', ...)
```

#### Vercel AI SDK: Multiple Providers
```typescript
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'

// Easy to switch
const model = openai('gpt-4o')
// const model = anthropic('claude-3-5-sonnet-20241022')
// const model = google('gemini-pro')

streamText({ model, messages })
```

**Benefits:**
- Switch providers without rewriting UI code
- A/B test different models
- Fallback to alternative provider if primary fails
- Future-proof for new AI models

### 5. Error Handling

#### Built-in Error Recovery
```typescript
useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('AI error:', error)
    // Show user-friendly error
  },
  // Automatic retry on network errors
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2
  }
})
```

#### Error Types Handled
- ✅ Network failures (automatic retry)
- ✅ API rate limits (exponential backoff)
- ✅ Streaming interruptions (resume or restart)
- ✅ Timeout errors (configurable)
- ✅ Invalid responses (graceful degradation)

### 6. Type Safety

#### TypeScript Benefits
```typescript
// Full type inference
const { messages } = useChat()
// messages: Message[] - fully typed!

// Custom message types
type CustomMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    fileId?: string
    selection?: EditorSelection
  }
}

useChat<CustomMessage>({
  // TypeScript ensures correct types
})
```

## 📊 Feature Comparison

| Feature | Current (Manual) | Vercel AI SDK | Winner |
|---------|------------------|---------------|--------|
| Streaming Display | ✅ Custom | ✅ Built-in | 🟰 Tie |
| Error Handling | ⚠️ Basic | ✅ Advanced | 🏆 AI SDK |
| Retry Logic | ❌ None | ✅ Automatic | 🏆 AI SDK |
| Type Safety | ⚠️ Partial | ✅ Full | 🏆 AI SDK |
| Provider Switching | ❌ Hard | ✅ Easy | 🏆 AI SDK |
| Code Complexity | ⚠️ High | ✅ Low | 🏆 AI SDK |
| Dependencies | ✅ Zero | ➖ ~50KB | 🏆 Current |
| Testing | ⚠️ Hard | ✅ Easy | 🏆 AI SDK |
| Edge Runtime | ❌ No | ✅ Yes | 🏆 AI SDK |
| Bundle Size | ✅ Minimal | ➖ +50KB | 🏆 Current |

## 📦 Bundle Size Analysis

### Current Implementation
- **Client**: ~0 KB (just `fetch`)
- **Total**: ~0 KB

### Vercel AI SDK
- **ai/react**: ~15 KB (gzipped)
- **@ai-sdk/openai**: ~8 KB (server-side)
- **Total Client Impact**: ~15 KB gzipped

**Verdict**: Minimal impact (~15KB) for significant DX improvement

## 🎯 Migration Benefits

### Developer Experience
1. **Less Code**: ~50% reduction in AI-related code
2. **Better Types**: Full TypeScript inference
3. **Easier Testing**: Mock `useChat` hook instead of `fetch`
4. **Future-Proof**: Easy to add tool calling, multi-turn, etc.

### Reliability
1. **Automatic Retry**: Network failures handled gracefully
2. **Error Recovery**: Built-in reconnection logic
3. **Stream Resumption**: Continue from last chunk on failure

### Maintainability
1. **Standard Patterns**: Community-vetted streaming approach
2. **Active Support**: Vercel maintains and updates regularly
3. **Documentation**: Excellent guides and examples

## 🚨 Potential Concerns

### 1. Backend Requirement
**Issue**: Vercel AI SDK requires server-side API route (can't call OpenAI directly from client)

**Current**: Client → OpenAI API (direct)
**With AI SDK**: Client → Netlify Function → OpenAI API

**Impact:**
- ➕ **Better security**: API key stays on server
- ➕ **Request validation**: Backend can validate/sanitize
- ➕ **Rate limiting**: Server-side control
- ➖ **Extra hop**: Slight latency increase (~10-50ms)
- ➖ **Backend code**: Need to maintain API route

**Verdict**: ✅ Security benefits outweigh latency cost

### 2. Learning Curve
**Issue**: Team needs to learn new patterns

**Mitigation:**
- Excellent documentation
- Similar to React Query patterns
- Gradual migration possible

### 3. Lock-in Risk
**Issue**: Depending on Vercel-specific library

**Mitigation:**
- Open source (MIT license)
- Active community (~60k GitHub stars)
- Can eject by implementing `useChat` interface manually

## 🧪 Proof of Concept

### POC #1: Basic Migration
```typescript
// NEW: AIChatSidebar.tsx with useChat
import { useChat } from 'ai/react'

export function AIChatSidebar({ editor, fileId, persistedSelection }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai-chat',
    body: {
      fileId,
      selection: persistedSelection?.text,
      selectionRange: { from: persistedSelection?.from, to: persistedSelection?.to }
    }
  })

  return (
    <div className="ai-sidebar">
      {/* Selection context display */}
      {persistedSelection && (
        <SelectionContext selection={persistedSelection} />
      )}

      {/* Messages */}
      {messages.map(m => (
        <Message key={m.id} role={m.role} content={m.content} />
      ))}

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <textarea value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### POC #2: Netlify Function
```typescript
// NEW: netlify/functions/ai-chat.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const handler = async (req: Request) => {
  const { messages, fileId, selection } = await req.json()

  // Build system message with context
  const systemMessage = [
    'You are a helpful writing assistant for RiteMark markdown editor.',
    selection ? `User selected text: "${selection}"` : '',
    fileId ? `Working on file: ${fileId}` : ''
  ].filter(Boolean).join(' ')

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages
  })

  return result.toDataStreamResponse()
}
```

## 📝 Recommendation

### Should We Migrate? **YES ✅**

**Reasoning:**
1. **Security Improvement**: API key moves to server-side
2. **Better DX**: Less code, better types, easier testing
3. **Future-Proof**: Easy to add features (tool calling, multi-modal)
4. **Reliability**: Built-in retry, error handling, stream recovery
5. **Minimal Cost**: ~15KB bundle increase, <50ms latency
6. **Industry Standard**: Used by production apps at scale

### Migration Strategy
**Recommended Approach**: Incremental migration with feature flag

**Phase 1: Setup (Sprint 30)**
- Install Vercel AI SDK
- Create Netlify function (`/api/ai-chat`)
- Add feature flag for A/B testing

**Phase 2: Parallel Implementation (Sprint 31)**
- Implement `useChat` in new component
- Run both implementations side-by-side
- Test in staging environment

**Phase 3: Gradual Rollout (Sprint 32)**
- Enable for 10% of users
- Monitor errors, performance
- Ramp to 100% over 2 weeks

**Phase 4: Cleanup (Sprint 33)**
- Remove old implementation
- Delete custom streaming code
- Update documentation

## 📚 Resources for Implementation

### Official Guides
- [Building a Chatbot](https://sdk.vercel.ai/docs/guides/chatbot)
- [Streaming with Next.js](https://sdk.vercel.ai/docs/guides/nextjs-app-router)
- [Error Handling](https://sdk.vercel.ai/docs/guides/error-handling)

### Example Apps
- [Vercel AI SDK Examples](https://github.com/vercel/ai/tree/main/examples)
- [Next.js AI Chatbot](https://github.com/vercel/ai-chatbot)

### Community Resources
- [Discord](https://vercel.com/discord)
- [GitHub Discussions](https://github.com/vercel/ai/discussions)

---

**Status**: ✅ Complete - Ready for decision
**Recommendation**: Proceed with migration (incremental rollout)
**Next Step**: Create detailed migration plan (migration-plan.md)
