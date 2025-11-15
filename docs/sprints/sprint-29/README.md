# Sprint 29: Vercel AI SDK Migration

## 🎯 Quick Start

**Reading Order for AI Agents:**
1. This README (overview and context)
2. `sprint-29-vercel-ai-sdk-migration.md` - Complete sprint documentation (all-in-one)

## 📚 Document Organization

| File | Purpose | Status | Size |
|------|---------|--------|------|
| `README.md` | Sprint navigation and overview | ✅ Complete | - |
| `sprint-29-vercel-ai-sdk-migration.md` | Complete migration guide (research + plan + implementation) | ✅ Complete | ~10KB |

## 🔗 Related Sprints

**Prerequisites:**
- Sprint 24: AI Chat Sidebar implementation (current OpenAI implementation)
- Sprint 25: Selection persistence and AI context

## 📊 Sprint Status

**Phase:** Extended sprint (research + implementation + rollout)
**Duration:** 2-4 weeks (including gradual rollout)
**Type:** Research → Implementation → Rollout

### Phase Breakdown
- [ ] Phase 1: Setup & Foundation (Netlify function, feature flag)
- [ ] Phase 2: Component Migration (useChat implementation)
- [ ] Phase 3: Testing & Validation (metrics, UX verification)
- [ ] Phase 4: Gradual Rollout (10% → 100% over 4 weeks)
- [ ] Phase 5: Cleanup & Documentation (remove old code)

## 🎯 Sprint Objectives

### Primary Goal
Migrate AI chat from direct OpenAI calls to Vercel AI SDK for better security, developer experience, and maintainability.

### Scope: Migration Focus ONLY
**In Scope:**
- ✅ Migrate existing AI chat functionality
- ✅ Maintain current UX exactly
- ✅ Move API key server-side (security)
- ✅ Improve error handling
- ✅ Gradual rollout with feature flags

**Out of Scope:**
- ❌ New AI features
- ❌ Model switching UI
- ❌ Advanced RAG or vector search

### Decision: ✅ PROCEED
Security + DX benefits outweigh ~15KB cost

## 📝 Deliverables

1. Netlify function (`/.netlify/functions/ai-chat`)
2. New component (`AIChatSidebarV2` with useChat)
3. Feature flag (toggle between old/new)
4. Integration tests
5. Production deployment (100% rollout)
6. Updated documentation (ADR)

## ✅ Success Criteria

- [ ] Netlify function working
- [ ] UX matches exactly
- [ ] All tests passing
- [ ] 100% rollout complete
- [ ] Error rate <0.1%
- [ ] Old code removed

**Timeline:** Weeks 1 (setup), 2-4 (rollout), 4 (cleanup)
