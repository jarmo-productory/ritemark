# Sprint 29: Vercel AI SDK Migration Research

## 🎯 Quick Start

**Reading Order for AI Agents:**
1. This README (overview and context)
2. `current-state-audit.md` - Current OpenAI implementation analysis
3. `vercel-ai-sdk-research.md` - Vercel AI SDK capabilities and migration path
4. `migration-plan.md` - Step-by-step migration strategy

## 📚 Document Organization

| File | Purpose | Status | Size |
|------|---------|--------|------|
| `README.md` | Sprint navigation and overview | ✅ Complete | - |
| `current-state-audit.md` | Audit of current AI implementation | 📝 Pending | - |
| `vercel-ai-sdk-research.md` | Vercel AI SDK research and evaluation | 📝 Pending | - |
| `migration-plan.md` | Migration strategy and phases | 📝 Pending | - |

## 🔗 Related Sprints

**Prerequisites:**
- Sprint 24: AI Chat Sidebar implementation (current OpenAI implementation)
- Sprint 25: Selection persistence and AI context

**Dependencies:**
- Current implementation uses direct OpenAI API calls
- Token management via `tokenManagerEncrypted`
- Editor integration via TipTap

## 📊 Sprint Status

**Phase:** Research & Planning
**Start Date:** January 15, 2025
**Target Completion:** TBD
**Sprint Type:** Research-only (no implementation)

### Current Phase Breakdown
- [ ] Audit current AI implementation
- [ ] Research Vercel AI SDK capabilities
- [ ] Design migration strategy
- [ ] Document findings and recommendations

## 🎯 Sprint Objectives

### Primary Goal
Research Vercel AI SDK to determine migration path for current AI chat functionality.

### Scope: Migration Focus ONLY
**In Scope:**
- ✅ Migrate existing AI chat sidebar functionality
- ✅ Maintain current UX (selection context, streaming responses)
- ✅ Improve developer experience with AI SDK abstractions
- ✅ Evaluate streaming performance and reliability

**Out of Scope:**
- ❌ New AI features (assistants, tools, multi-turn conversations)
- ❌ Model switching UI
- ❌ Advanced RAG or vector search
- ❌ AI-powered autocomplete or inline suggestions

### Research Questions
1. **Architecture**: How does Vercel AI SDK compare to direct OpenAI API calls?
2. **Streaming**: Does AI SDK improve streaming response handling?
3. **Error Handling**: What built-in error recovery does AI SDK provide?
4. **Migration Path**: Can we migrate incrementally or all-at-once?
5. **Bundle Size**: What's the impact on client bundle?
6. **Type Safety**: Does AI SDK improve TypeScript experience?

## 🏗️ Current AI Implementation

### Stack
- **API**: Direct OpenAI API calls via `fetch`
- **Model**: GPT-4o (configurable)
- **UI**: Custom streaming UI in `AIChatSidebar.tsx`
- **Context**: Editor selection + file ID
- **Streaming**: Manual SSE parsing

### Key Files
- `ritemark-app/src/components/ai/AIChatSidebar.tsx` - Main chat UI
- `ritemark-app/src/services/ai/` - AI service layer (if exists)
- `ritemark-app/src/hooks/useAI.ts` - AI hooks (if exists)

## 📦 Vercel AI SDK Overview

### What is Vercel AI SDK?
Framework-agnostic library for building AI-powered applications with:
- **Unified API** for multiple providers (OpenAI, Anthropic, Google, etc.)
- **Streaming primitives** (`useChat`, `useCompletion`)
- **Type-safe hooks** for React
- **Server helpers** for API routes
- **Built-in error handling** and retry logic

### Why Consider Migration?
1. **Better DX**: React hooks instead of manual streaming
2. **Provider flexibility**: Easy to switch between OpenAI, Claude, etc.
3. **Battle-tested**: Used in production by Vercel and community
4. **TypeScript-first**: Excellent type inference
5. **Streaming optimized**: Handles SSE, chunk parsing, UI updates

## 🔍 Research Scope

### Phase 1: Current State Audit
- Document current OpenAI implementation
- Identify all AI touchpoints in codebase
- Map data flow (user input → API → UI update)
- List current limitations and pain points

### Phase 2: Vercel AI SDK Evaluation
- Review official documentation
- Analyze `useChat` vs custom streaming
- Compare error handling approaches
- Evaluate bundle size impact
- Test streaming performance

### Phase 3: Migration Planning
- Design migration strategy (incremental vs big-bang)
- Identify breaking changes
- Plan backward compatibility
- Define success metrics
- Estimate effort and risk

## 🚨 Critical Constraints

### Must Preserve
- ✅ Current UX (no user-facing changes)
- ✅ Editor selection context passing
- ✅ Streaming response display
- ✅ Token management integration
- ✅ Error handling behavior

### Must Avoid
- ❌ Introducing new dependencies without justification
- ❌ Breaking existing AI chat functionality
- ❌ Degrading streaming performance
- ❌ Adding unnecessary complexity

## 📝 Deliverables

### Research Outputs
1. **Current State Audit** - Complete analysis of existing implementation
2. **Vercel AI SDK Evaluation** - Feature comparison and recommendations
3. **Migration Plan** - Step-by-step migration strategy with risks
4. **Code Examples** - POC snippets showing migration approach

### Decision Points
- **Go/No-Go**: Should we migrate to Vercel AI SDK?
- **Migration Strategy**: Incremental or all-at-once?
- **Timeline**: When to implement migration?

## 🎓 Learning Resources

### Vercel AI SDK Documentation
- [Official Docs](https://sdk.vercel.ai/docs)
- [useChat Hook](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)
- [Streaming](https://sdk.vercel.ai/docs/concepts/streaming)
- [Error Handling](https://sdk.vercel.ai/docs/guides/error-handling)

### Community Resources
- [AI SDK Examples](https://github.com/vercel/ai/tree/main/examples)
- [Migration Guides](https://sdk.vercel.ai/docs/guides/migrating)

## 🎯 Success Criteria

### Research Complete When:
- [ ] Current implementation fully documented
- [ ] Vercel AI SDK capabilities evaluated
- [ ] Migration strategy designed and documented
- [ ] Go/No-Go decision made with justification
- [ ] If Go: Implementation plan ready for next sprint
- [ ] If No-Go: Alternative improvements documented

---

**Next Steps After Research:**
- If migration approved → Sprint 30: Implement Vercel AI SDK migration
- If not approved → Document alternative improvements to current implementation
