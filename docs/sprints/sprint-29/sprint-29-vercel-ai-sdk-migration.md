# Sprint 29: Vercel AI SDK Migration

**Duration**: Extended research + implementation sprint
**Focus**: Migrate AI chat from direct OpenAI calls to Vercel AI SDK
**Scope**: Current functionality ONLY (no new features)

---

## 🎯 Sprint Objectives

### Primary Goal
Migrate existing AI chat functionality from direct OpenAI API calls to Vercel AI SDK for better developer experience, security, and maintainability.

### Success Criteria
- [ ] Current AI implementation fully documented
- [ ] Vercel AI SDK evaluated and decision made
- [ ] Migration completed with zero user-facing changes
- [ ] Error rate <0.1%, no performance degradation
- [ ] All tests passing, production deployed

---

## 📊 Current State Analysis

### Technology Stack
- **AI Provider**: OpenAI API (direct `fetch` calls from client)
- **Model**: GPT-4o
- **Streaming**: Manual SSE parsing
- **UI**: Custom streaming in `AIChatSidebar.tsx`
- **Context**: Editor selection + file ID

### Pain Points
1. **Manual Streaming**: Custom SSE parsing logic (error-prone)
2. **No Retry Logic**: Network failures require manual refresh
3. **Type Safety**: Partial TypeScript coverage
4. **Security**: API key exposed to client (if client-side)
5. **Provider Lock-in**: Hard to switch to Claude/Gemini
6. **Testing Complexity**: Mocking streaming responses difficult

### What Works Well
- ✅ Smooth streaming UX
- ✅ Editor selection context integration
- ✅ Clean sidebar design
- ✅ Responsive performance

---

## 🔍 Vercel AI SDK Evaluation

### What is Vercel AI SDK?
Open-source library for building AI-powered streaming UIs:
- **Framework-agnostic** with React hooks
- **Unified API** for OpenAI, Anthropic, Google, etc.
- **Type-safe** with excellent TypeScript inference
- **Battle-tested** at production scale

### Key Features for RiteMark

#### 1. useChat Hook
```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { fileId, selection }
})
```

**Benefits:**
- ✅ Built-in state management (messages, input, loading)
- ✅ Automatic streaming UI updates
- ✅ Error handling with retry
- ✅ Less code to maintain

#### 2. Backend Integration (Required)
```typescript
// netlify/functions/ai-chat.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req) {
  const { messages, fileId, selection } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a writing assistant. ${selection ? `User selected: "${selection}"` : ''}`,
    messages
  })

  return result.toDataStreamResponse()
}
```

**Security Benefit**: API key stays on server (not exposed to client)

#### 3. Error Handling
- Automatic retry with exponential backoff
- Network error recovery
- Stream resumption on failure
- Timeout handling

#### 4. Provider Flexibility
```typescript
// Easy to switch providers
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

const model = openai('gpt-4o')
// const model = anthropic('claude-3-5-sonnet-20241022')
```

### Comparison

| Feature | Current | Vercel AI SDK | Winner |
|---------|---------|---------------|--------|
| Streaming | ✅ Custom | ✅ Built-in | 🟰 |
| Error Handling | ⚠️ Basic | ✅ Advanced | 🏆 SDK |
| Retry Logic | ❌ None | ✅ Auto | 🏆 SDK |
| Type Safety | ⚠️ Partial | ✅ Full | 🏆 SDK |
| Security | ⚠️ Client Key? | ✅ Server | 🏆 SDK |
| Provider Switch | ❌ Hard | ✅ Easy | 🏆 SDK |
| Code Complexity | ⚠️ High | ✅ Low | 🏆 SDK |
| Bundle Size | ✅ 0KB | ➖ ~15KB | 🏆 Current |
| Dependencies | ✅ Zero | ➖ +2 | 🏆 Current |

**Verdict**: Benefits outweigh costs (~15KB for significant DX/security improvement)

---

## 🚀 Migration Plan

### Phase 1: Setup & Foundation
**Tasks:**
- [ ] Install dependencies: `npm install ai @ai-sdk/openai`
- [ ] Create Netlify function: `netlify/functions/ai-chat.ts`
- [ ] Add environment variable: `OPENAI_API_KEY` (server-side)
- [ ] Create feature flag: `settings.experimental.useVercelAiSdk`
- [ ] Test function locally with Netlify CLI

**Deliverable**: Working backend endpoint that streams responses

### Phase 2: Component Migration
**Tasks:**
- [ ] Create `AIChatSidebarV2.tsx` using `useChat`
- [ ] Implement selection context integration
- [ ] Match existing UX exactly (same styling, behavior)
- [ ] Add conditional rendering based on feature flag
- [ ] Side-by-side testing (toggle between old/new)

**Code Example:**
```typescript
import { useChat } from 'ai/react'

export function AIChatSidebarV2({ editor, fileId, persistedSelection, onClearSelection }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai-chat',
    body: {
      fileId,
      selection: persistedSelection?.text,
      selectionRange: { from: persistedSelection?.from, to: persistedSelection?.to }
    }
  })

  return (
    <div className="ai-chat-sidebar">
      {persistedSelection && (
        <SelectionContext selection={persistedSelection} onClear={onClearSelection} />
      )}

      <Messages messages={messages} />

      {error && <ErrorDisplay error={error} />}

      <form onSubmit={handleSubmit}>
        <textarea value={input} onChange={handleInputChange} disabled={isLoading} />
        <button type="submit" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send'}</button>
      </form>
    </div>
  )
}
```

**Deliverable**: New implementation with feature parity

### Phase 3: Testing & Validation
**Tasks:**
- [ ] Test streaming performance (TTFT, tokens/sec)
- [ ] Test error scenarios (network failure, timeout, rate limit)
- [ ] Test selection context integration
- [ ] Compare with old implementation (UX should be identical)
- [ ] Test on staging environment
- [ ] Write integration tests

**Success Metrics:**
- Time to First Token (TTFT): <500ms (p95)
- Streaming Speed: ≥30 tokens/sec
- Error Rate: <0.1%
- API Latency: <100ms (p95)

**Deliverable**: Verified working implementation

### Phase 4: Gradual Rollout
**Rollout Strategy:**
1. **Week 1**: Enable for dev team (feature flag in settings)
2. **Week 2**: Enable for 10% of users (random selection)
3. **Week 3**: Ramp to 50% if metrics are good
4. **Week 4**: Full rollout (100% of users)

**Monitoring:**
- [ ] Error rate dashboard
- [ ] Streaming performance metrics
- [ ] User feedback/complaints
- [ ] Netlify function logs

**Rollback Plan**: Set feature flag to `false` globally if error rate >1%

**Deliverable**: 100% migration with stable metrics

### Phase 5: Cleanup & Documentation
**Tasks:**
- [ ] Remove old `AIChatSidebar.tsx` implementation
- [ ] Rename `AIChatSidebarV2.tsx` → `AIChatSidebar.tsx`
- [ ] Remove feature flag code
- [ ] Delete custom streaming logic
- [ ] Update documentation
- [ ] Create ADR (Architecture Decision Record)
- [ ] Bundle size analysis

**Deliverable**: Clean codebase with single AI implementation

---

## 🛠️ Technical Implementation

### Backend: Netlify Function
```typescript
// netlify/functions/ai-chat.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { messages, fileId, selection } = JSON.parse(event.body || '{}')

    // Build system message with context
    const systemMessage = [
      'You are a helpful writing assistant for RiteMark markdown editor.',
      selection ? `User selected: "${selection}"` : '',
      fileId ? `Working on file: ${fileId}` : ''
    ].filter(Boolean).join(' ')

    // Stream response
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemMessage,
      messages,
      temperature: 0.7,
      maxTokens: 2000
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: result.toDataStream()
    }
  } catch (error) {
    console.error('[AI Chat] Error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
```

### Frontend: React Component
```typescript
// ritemark-app/src/components/ai/AIChatSidebarV2.tsx
import { useChat } from 'ai/react'
import type { EditorSelection } from '@/types/editor'
import type { Editor as TipTapEditor } from '@tiptap/react'

interface Props {
  editor: TipTapEditor
  fileId: string | null
  liveSelection?: EditorSelection
  persistedSelection?: EditorSelection
  onClearSelection?: () => void
}

export function AIChatSidebarV2({ editor, fileId, persistedSelection, onClearSelection }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/.netlify/functions/ai-chat',
    body: {
      fileId,
      selection: persistedSelection?.text,
      selectionRange: persistedSelection ? {
        from: persistedSelection.from,
        to: persistedSelection.to
      } : undefined
    }
  })

  return (
    <div className="ai-chat-sidebar">
      {/* Selection context */}
      {persistedSelection && (
        <div className="selection-context">
          <span>{persistedSelection.text}</span>
          <button onClick={onClearSelection}>Clear</button>
        </div>
      )}

      {/* Messages */}
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="error">
          {error.message}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Ask AI assistant..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### Feature Flag Integration
```typescript
// ritemark-app/src/App.tsx
import { AIChatSidebar } from './components/ai/AIChatSidebar'
import { AIChatSidebarV2 } from './components/ai/AIChatSidebarV2'

const AIChatComponent = settings?.experimental?.useVercelAiSdk
  ? AIChatSidebarV2
  : AIChatSidebar

<AIChatComponent
  editor={editor}
  fileId={fileId}
  persistedSelection={lastSelection}
  onClearSelection={handleClearSelection}
/>
```

---

## ⚠️ Risk Assessment

### High Risk (Mitigations in place)
1. **Backend Latency**: Extra hop (client → Netlify → OpenAI)
   - **Mitigation**: Deploy to edge, monitor p95 latency

2. **Breaking Changes**: Users notice UX differences
   - **Mitigation**: Exact UX replication, gradual rollout

### Medium Risk
1. **Feature Flag Issues**: Toggle not working
   - **Mitigation**: Thorough testing, clear documentation

2. **Cost Increase**: Netlify function invocations
   - **Mitigation**: Monitor costs, optimize cold starts

### Low Risk
1. **Bundle Size**: +15KB gzipped
   - **Impact**: Negligible (~0.3% of typical bundle)

---

## 📝 Decision Record

### Recommendation: ✅ **PROCEED**

**Justification:**
1. **Security**: API key moves to server-side (critical improvement)
2. **Developer Experience**: 50% less code, better types, easier testing
3. **Reliability**: Built-in retry, error recovery, stream resumption
4. **Future-Proof**: Easy to add tool calling, multi-modal, provider switching
5. **Minimal Cost**: ~15KB bundle, <50ms latency (acceptable)
6. **Industry Standard**: Used in production by Vercel and community

**Timeline:** Extended sprint (2-4 weeks including rollout)

**Next Steps:**
1. Begin Phase 1: Setup & Foundation
2. Install dependencies and create Netlify function
3. Test locally before proceeding to implementation

---

## 📚 Resources

### Documentation
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [useChat Hook Reference](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)
- [Streaming Guide](https://sdk.vercel.ai/docs/concepts/streaming)

### Examples
- [AI SDK Examples](https://github.com/vercel/ai/tree/main/examples)
- [Next.js AI Chatbot](https://github.com/vercel/ai-chatbot)

---

**Status**: 📋 Ready to execute
**Estimated Duration**: 2-4 weeks (including gradual rollout)
**Risk Level**: 🟡 Medium (mitigated by incremental approach)
