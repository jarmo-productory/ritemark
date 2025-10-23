# Export Templates Research

**Date**: October 22, 2025
**Sprint**: TBD (Future sprint - not yet scheduled)
**Theme**: Export templates for SSGs and AI tools
**Status**: ✅ Research Complete (implementation timing TBD)

---

## 🎯 Quick Start for AI Agents

**Reading Order**:
1. This README (navigation and overview)
2. `codebase-audit.md` (current export capabilities - START HERE)
3. `ssg-frontmatter-formats.md` (Hugo, Jekyll, Next.js templates)
4. `ai-prompt-patterns.md` (ChatGPT, Claude prompt wrappers)
5. `export-ux-patterns.md` (menu structure and UX patterns)

**Skip if not needed**: All documents are required reading for implementation

---

## 📊 Research Summary

### Features Researched

| Feature | Complexity | Implementation Time | User Value |
|---------|-----------|---------------------|------------|
| **Hugo Export** | Low | 4 hours | High - Popular SSG |
| **Jekyll Export** | Low | 3 hours | High - GitHub Pages |
| **AI Tool Copy** | Low | 3 hours | Very High - Universal |
| **Export Menu UX** | Low | 2 hours | High - Discoverability |

**Total Research**: 4 agents, 5 hours, 4 comprehensive documents

---

## 📚 Research Documents

| Document | Size | Purpose | Status |
|----------|------|---------|--------|
| `codebase-audit.md` | 16 KB | Current state analysis | ✅ Complete |
| `ssg-frontmatter-formats.md` | 36 KB | SSG export templates | ✅ Complete |
| `ai-prompt-patterns.md` | 36 KB | AI tool prompt wrappers | ✅ Complete |
| `export-ux-patterns.md` | 28 KB | Menu structure and UX | ✅ Complete |
| `README.md` (this file) | 4 KB | Navigation guide | ✅ Complete |

**Total**: 120 KB of research documentation

---

## 🔍 Key Findings

### 1. **Existing Infrastructure is Excellent** ✅

From `codebase-audit.md`:
- ✅ Markdown conversion quality: 5/5 (TurndownService + GFM tables)
- ✅ Live markdown always available (no re-conversion needed)
- ✅ All metadata accessible (title, dates, user info)
- 🚫 Missing: Export menu UI and download handlers

**Conclusion**: Only need to add UI and download logic - no architectural changes required

---

### 2. **SSG Export Templates Ready for Implementation** 📦

From `ssg-frontmatter-formats.md`:
- **Hugo**: YAML/TOML/JSON support, ISO 8601 dates (most flexible)
- **Jekyll**: YAML-only, strict parsing, permalink patterns (most popular)
- **Next.js/MDX**: React integration, SEO metadata (most modern)
- **Gatsby**: GraphQL-optimized, flat structure (best for CMSs)

**Code Deliverables**:
- 5 TypeScript interfaces
- 6 template generation functions
- 6 real-world examples
- Production-ready code samples

---

### 3. **AI Prompt Patterns Well-Researched** 🤖

From `ai-prompt-patterns.md`:
- **ChatGPT**: Natural language, instruction-based patterns
- **Claude**: XML-structured, long-form analysis patterns
- **Gemini**: Structured reasoning, multimodal patterns
- **9 Template Types**: Review, analyze, improve, summarize, expand, etc.

**Code Deliverables**:
- Template registry system
- Clipboard API with mobile support
- Toast notifications (Sonner)
- Full React component implementation

---

### 4. **Export UX Patterns Identified** 🎨

From `export-ux-patterns.md`:
- **Menu Structure**: DropdownMenuSub with 1-level nesting
- **Icon Placement**: Left-aligned, 16px, consistent spacing
- **Loading States**: Loader2 spinner → Check icon → Auto-reset (1.5s)
- **Clipboard Integration**: Submenu option, not separate button
- **Browser Support**: 96.8% global coverage with fallback

**Code Deliverables**:
- Complete FileMenu component
- State management patterns
- Download + clipboard implementations
- Accessibility attributes

---

## 🏗️ Architecture Decisions

### Integration Point

**Recommended Location**: `DocumentStatus.tsx` (sidebar footer)

**Component Tree**:
```
App.tsx (add content prop)
  └─> AppSidebar (forward content prop)
      └─> DocumentStatus (add ExportMenu)
          └─> [NEW] ExportMenu component
```

**Why Here?**:
- ✅ Already has document context (file name, Drive file)
- ✅ Familiar location (users look at sidebar footer)
- ✅ Minimal prop drilling (2 components)
- ✅ Clean separation of concerns

---

### File Structure

```
ritemark-app/src/
├── services/export/
│   ├── exportTemplates.ts      [NEW] Template registry
│   ├── exportMetadata.ts       [NEW] Metadata collector
│   └── ssgFrontmatter.ts       [NEW] Frontmatter generators
├── components/
│   └── ExportMenu.tsx          [NEW] Export menu component
├── utils/
│   └── download.ts             [NEW] Download file handler
└── hooks/
    └── useClipboard.ts         [NEW] Clipboard hook (from research)
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (4 hours)

**Files to Create**:
1. `/src/services/export/exportTemplates.ts` (template registry)
2. `/src/services/export/ssgFrontmatter.ts` (Hugo, Jekyll generators)
3. `/src/utils/download.ts` (download handler)
4. `/src/hooks/useClipboard.ts` (clipboard hook)

**Deliverables**: Core export infrastructure ready

---

### Phase 2: UI Integration (3 hours)

**Files to Edit**:
1. `ExportMenu.tsx` (new component with DropdownMenuSub)
2. `DocumentStatus.tsx` (integrate ExportMenu)
3. `AppSidebar.tsx` (forward content prop)
4. `App.tsx` (pass content prop)

**Deliverables**: Export menu visible in UI

---

### Phase 3: Testing (2 hours)

**Test Cases**:
- [ ] Hugo export includes correct YAML frontmatter
- [ ] Jekyll export includes required fields
- [ ] AI tool copy wraps content with prompt
- [ ] Clipboard API works on desktop + mobile
- [ ] Download works in Chrome, Firefox, Safari
- [ ] Toast notifications show success/error
- [ ] Loading states display correctly

**Deliverables**: All features validated

---

## 🎯 Success Criteria

### Must Have ✅

1. **Export Menu Integration**
   - Visible in DocumentStatus sidebar footer
   - DropdownMenuSub with nested options
   - Keyboard accessible (Tab navigation)
   - Mobile responsive

2. **Export Templates**
   - Hugo export with YAML frontmatter
   - Jekyll export with YAML frontmatter
   - AI tool copy with prompt wrapper
   - Raw markdown export (baseline)

3. **Clipboard & Download**
   - Clipboard copy works (96.8% browser support)
   - File download works (Blob + URL.createObjectURL)
   - Toast notifications (success/error)
   - Mobile compatibility (iOS 13.4+, Android)

4. **Quality Gates**
   - Zero TypeScript errors
   - All existing tests pass
   - No breaking changes
   - Accessibility validated (keyboard + ARIA)

---

## 🔗 Related Documentation

### Prerequisites
- ✅ Sprint 15a: Drive integration features (share, offline, version history)
- ✅ Sprint 8: Google Drive OAuth and file operations
- ✅ Sprint 13: Modal consolidation (shadcn Dialog)

### Follow-up
- ⏳ Sprint 16+: Real-time collaboration (Future)
- ⏳ Landing page optimization (Post-Sprint 15)

---

## 📊 Research Metrics

### Effort Summary
- **Research Time**: 5 hours (4 parallel agents)
- **Estimated Implementation**: 9 hours (3 phases)
- **Total Sprint Time**: 14 hours (~2 days)

### Code Delivered
- **Research Documents**: 4 files (120 KB)
- **Code Samples**: 40+ production-ready snippets
- **TypeScript Interfaces**: 10+ interfaces
- **Component Examples**: 5+ full components

---

## 🚀 Ready to Start

**Next Steps**:
1. ✅ Research complete (4/4 documents)
2. ⏳ Create Sprint 16 implementation plan
3. ⏳ Begin Phase 1 (export templates foundation)

**Approval Required**: User sign-off to proceed with implementation

---

**Date Created**: October 22, 2025
**Research Completed**: October 22, 2025
**Implementation Start**: Pending user approval
