# Sprint 11: Advanced Table Support

**Status:** 📋 READY FOR EXECUTION
**Start Date:** October 11, 2025
**Estimated Duration:** 12-16 hours
**Current Phase:** Pre-Implementation

---

## 🎯 Quick Start (for AI agents)

**If you're implementing this sprint, read in this order:**

### 1. Required Reading (Start Here)
1. **[tables-plan.md](../sprint-11-tables-plan.md)** - Goals, deliverables, acceptance criteria
2. **[implementation-architecture.md](../sprint-11-implementation-architecture.md)** - Technical design decisions
3. **[task-breakdown.md](../sprint-11-task-breakdown.md)** - Step-by-step implementation tasks (50 tasks)

### 2. Context Documents (read if needed)
- **[tables-research.md](../sprint-11-tables-research.md)** - TipTap table extension analysis
- **[codebase-audit.md](../sprint-11-12-codebase-audit.md)** - Current state before sprint
- **[dependency-analysis.md](../sprint-11-dependency-analysis.md)** - Package versions and conflicts
- **[phase-breakdown.md](../sprint-11-phase-breakdown.md)** - Multi-phase execution plan (5 phases)
- **[orchestration-summary.md](../sprint-11-orchestration-summary.md)** - Swarm coordination details

---

## 📚 Document Organization

### Core Planning Documents
| Document | Purpose | Status | Lines |
|----------|---------|--------|-------|
| **tables-plan.md** | Sprint goals, scope, success criteria | ✅ Complete | 455 |
| **implementation-architecture.md** | System design, component hierarchy | ✅ Complete | 978 |
| **task-breakdown.md** | Detailed 50-task implementation plan | ✅ Complete | 2,687 |
| **phase-breakdown.md** | 5-phase execution strategy | ✅ Complete | 1,580 |

### Research & Analysis Documents
| Document | Purpose | Status | Lines |
|----------|---------|--------|-------|
| **tables-research.md** | TipTap table extension research | ✅ Complete | 558 |
| **codebase-audit.md** | Pre-sprint codebase analysis | ✅ Complete | 870 |
| **dependency-analysis.md** | Dependency compatibility analysis | ✅ Complete | 874 |
| **orchestration-summary.md** | Swarm coordination strategy | ✅ Complete | 243 |

---

## 🔗 Related Sprints

### Prerequisites
- **Sprint 10:** [Formatting Bubble Menu](../sprint-10-in-context-formatting-menu.md) ✅ COMPLETE
  - Establishes BubbleMenu pattern used in TableBubbleMenu
  - Provides UI/UX consistency baseline
  - Keyboard shortcut handling patterns

### Related Sprints
- **Sprint 12:** [Image Handling](../sprint-12-images-plan.md) 📋 PLANNED
  - Similar insertion patterns (toolbar button + slash command)
  - Markdown serialization parallels
  - Asset management patterns

- **Sprint 9:** [Sidebar Migration](../sprint-09-ux-consolidation.md) ✅ COMPLETE
  - UX patterns for table controls
  - Mobile-first design principles
  - Accessibility standards

### Future Dependencies
- **Sprint 13:** Slash Commands Enhancement
  - Will extend `/table` command with size picker
  - May add `/table-template` for pre-built layouts

---

## 📊 Sprint Status

### Progress Tracking
- **Started:** October 11, 2025
- **Current Phase:** Pre-Implementation (Phase 0: Planning)
- **Completion:** 0% (0/50 tasks)

### Phase Status
| Phase | Name | Tasks | Est. Time | Status |
|-------|------|-------|-----------|--------|
| **Phase 1** | Slash Command Infrastructure | 6 | 4-5 hours | ⏳ Not Started |
| **Phase 2** | Table Extension Integration | 10 | 3-4 hours | ⏳ Not Started |
| **Phase 3** | Table Controls UI | 12 | 2-3 hours | ⏳ Not Started |
| **Phase 4** | GFM Serialization | 10 | 2-3 hours | ⏳ Not Started |
| **Phase 5** | Testing & Validation | 14 | 2-3 hours | ⏳ Not Started |

### Key Milestones
- [ ] Slash command infrastructure complete (Phase 1)
- [ ] Table insertion working (Phase 2)
- [ ] Row/column operations functional (Phase 3)
- [ ] Markdown conversion working (Phase 4)
- [ ] All 40+ tests passing (Phase 5)

---

## 🏗️ Architecture Highlights

### System Overview
```
User Interface Layer
├─ Toolbar (Table Insertion Button)
├─ Slash Command Menu (/table)
└─ Table Controls (TableBubbleMenu)

TipTap Editor Core
├─ Table Extension (@tiptap/extension-table)
├─ TableRow Extension (@tiptap/extension-table-row)
├─ TableCell Extension (@tiptap/extension-table-cell)
├─ TableHeader Extension (@tiptap/extension-table-header)
└─ SlashCommand Extension (DIY using @tiptap/suggestion)

Data Serialization Layer
├─ HTML → Markdown (Turndown Service with custom table rule)
└─ Markdown → HTML (marked.js with GFM extension)
```

### Key Technical Decisions

**1. DIY Slash Commands (Not Community Extension)**
- **Why:** TipTap v3 compatibility + smaller bundle size
- **Impact:** +28 KB gzipped (vs. 70+ KB for community extensions)
- **Trade-off:** More dev time (~4-6 hours) but full control over UX

**2. GFM Markdown Table Format**
- **Why:** Industry standard (GitHub, GitLab, Stack Overflow)
- **Impact:** Merged cells lose structure (lossy conversion)
- **Trade-off:** Simplicity and compatibility over advanced features

**3. TableBubbleMenu for Context Controls**
- **Why:** Consistent with Sprint 10's FormattingBubbleMenu
- **Impact:** Non-intrusive, mobile-compatible
- **Trade-off:** Requires menu priority logic (table menu vs. format menu)

### Component Hierarchy
```
Editor.tsx
├─ TipTap Extensions
│  ├─ StarterKit
│  ├─ Table, TableRow, TableCell, TableHeader
│  └─ SlashCommandExtension (NEW)
│
├─ UI Components
│  ├─ FormattingBubbleMenu (Sprint 10)
│  ├─ TableBubbleMenu (NEW)
│  │  └─ RowControls, ColumnControls, CellControls, HeaderToggle
│  └─ SlashCommandMenu (NEW)
│     └─ CommandsList
│
└─ Markdown Serialization
   ├─ Turndown Service (HTML → Markdown)
   └─ marked.js (Markdown → HTML)
```

---

## 📦 Dependencies

### Required Dependencies (Sprint 11)
| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `@tiptap/extension-table` | ^3.6.6 | Table node and commands | +2.7 KB gzipped |
| `turndown-plugin-gfm` | ^1.0.2 | GFM markdown export | +0.96 KB gzipped |
| `tippy.js` | ^6.3.7 | Slash menu positioning | +14.5 KB gzipped |
| `@tiptap/suggestion` | ^3.6.6 | Slash command support | +2.2 KB gzipped |

**Total Bundle Impact:** +20.36 KB gzipped (+6.7% from baseline 305.16 KB)

### Compatibility Matrix
| Component | Current | Required | Compatible? |
|-----------|---------|----------|-------------|
| @tiptap/core | 3.6.5 | ^3.6.6 | ✅ Yes |
| React | 19.1.1 | ^18.0.0 | ✅ Yes |
| TypeScript | 5.x | 5.x | ✅ Yes |

### Security Audit
- ✅ 0 vulnerabilities found
- ✅ All packages from verified publishers
- ✅ No known CVEs in any dependency

---

## 🚀 Implementation Roadmap

### Phase 1: Slash Command Infrastructure (4-5 hours)
**Goal:** Enable `/table` slash command with keyboard navigation

**Deliverables:**
- `SlashCommandExtension.tsx` - TipTap extension using `@tiptap/suggestion`
- `CommandsList.tsx` - React component with keyboard navigation
- `commands.ts` - 7 basic commands (headings, lists, code block, table)
- CSS styling for slash menu

**Success Criteria:**
- ✅ Typing `/` shows command menu
- ✅ Arrow keys navigate, Enter executes, Esc closes
- ✅ Commands filter by search query
- ✅ No console errors

**Key Risks:**
- 🟡 Slash menu positioning issues on mobile (Mitigation: Use tippy.js with fallback)

---

### Phase 2: Table Extension Integration (3-4 hours)
**Goal:** Basic table insertion and editing via TipTap extensions

**Deliverables:**
- Install TipTap table extensions (4 packages)
- Configure Table, TableRow, TableCell, TableHeader
- Add table CSS styling
- Test table insertion via slash command

**Success Criteria:**
- ✅ `/table` command inserts 3x3 table
- ✅ Cells are editable
- ✅ Tab key navigates between cells
- ✅ Column resizing works

**Key Risks:**
- 🟡 Table CSS conflicts with existing editor styles (Mitigation: Use `.ritemark-table` class prefix)

---

### Phase 3: Table Controls UI (2-3 hours)
**Goal:** Context menu for row/column operations

**Deliverables:**
- `TableBubbleMenu.tsx` - Context menu component
- Row controls (Add Before, Add After, Delete)
- Column controls (Add Before, Add After, Delete)
- Cell controls (Merge, Split)
- Header row toggle
- Keyboard shortcuts (Cmd+Shift+↑/↓/←/→)

**Success Criteria:**
- ✅ Menu appears when cursor in table
- ✅ All row/column operations work
- ✅ Cell merging/splitting functional
- ✅ Header toggle changes first row styling

**Key Risks:**
- 🟢 Low risk (follows proven FormattingBubbleMenu pattern)

---

### Phase 4: GFM Serialization (2-3 hours)
**Goal:** Convert tables to/from GitHub Flavored Markdown

**Deliverables:**
- Turndown table rule (HTML → Markdown)
- Header row handling (`|---|` separator)
- Pipe character escaping (`\|`)
- Round-trip conversion validation

**Success Criteria:**
- ✅ Tables convert to GFM markdown on save
- ✅ Markdown tables load correctly in editor
- ✅ Round-trip preserves structure and content
- ✅ Edge cases handled (empty cells, pipes)

**Key Risks:**
- 🟡 Merged cells lose structure in markdown (Mitigation: Document limitation, duplicate content)

---

### Phase 5: Testing & Validation (2-3 hours)
**Goal:** Comprehensive testing and quality assurance

**Deliverables:**
- 40+ automated tests (Jest + React Testing Library)
- TypeScript compilation passes (`npm run type-check`)
- ESLint passes (`npm run lint`)
- Browser validation (Chrome DevTools MCP)
- Mobile testing (iOS Safari, Chrome Android)
- Accessibility audit (axe-core)

**Success Criteria:**
- ✅ All 40+ tests pass (100% pass rate)
- ✅ Zero TypeScript errors
- ✅ Zero console errors in browser
- ✅ Mobile features work correctly
- ✅ Accessibility score >90 (Lighthouse)

**Key Risks:**
- 🟢 Low risk (follows established testing patterns)

---

## 🎯 Success Criteria (Definition of Done)

Sprint 11 is **COMPLETE** when ALL of the following are true:

### Functional Requirements
- [ ] User can insert tables via `/table` slash command
- [ ] User can add/delete rows and columns
- [ ] User can merge/split cells
- [ ] User can toggle header row formatting
- [ ] Tables convert to GFM markdown on save
- [ ] Markdown tables load correctly in editor
- [ ] Keyboard shortcuts work for all operations

### Technical Requirements
- [ ] All 40+ automated tests pass (100% pass rate)
- [ ] `npm run type-check` passes (zero TypeScript errors)
- [ ] `npm run lint` passes (zero errors)
- [ ] Dev server runs on localhost:5173 without errors
- [ ] Browser validation successful (zero console errors)
- [ ] Performance acceptable (no lag with 10x10 tables)
- [ ] Mobile responsive (all features work on touch devices)

### Quality Requirements
- [ ] Code reviewed and approved
- [ ] No regressions in existing features
- [ ] Accessibility audit passed (Lighthouse >90)
- [ ] Visual design consistent with app theme
- [ ] Bundle size increase < 120 KB gzipped

### Documentation Requirements
- [ ] Developer documentation complete (500+ lines)
- [ ] User guide complete (300+ lines)
- [ ] Keyboard shortcuts documented
- [ ] Troubleshooting guide exists
- [ ] README updated with table features

---

## 📝 Quick Reference

### File Locations
```
ritemark-app/
├─ src/
│  ├─ components/
│  │  ├─ Editor.tsx                   (MODIFY)
│  │  └─ TableBubbleMenu.tsx          (NEW)
│  │
│  └─ extensions/
│     ├─ SlashCommandExtension.tsx    (NEW)
│     ├─ CommandsList.tsx             (NEW)
│     └─ commands.ts                  (NEW)
│
├─ tests/
│  └─ components/
│     ├─ TableBubbleMenu.test.tsx     (NEW)
│     ├─ SlashCommands.test.tsx       (NEW)
│     └─ TableMarkdown.test.tsx       (NEW)
│
└─ docs/
   ├─ components/
   │  ├─ TableBubbleMenu.md           (NEW)
   │  └─ SlashCommands.md             (NEW)
   │
   └─ user-guide/
      └─ tables.md                     (NEW)
```

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `/` | Open slash command menu |
| `Cmd+Shift+T` | Insert table (future) |
| `Cmd+Shift+↑` | Add row before |
| `Cmd+Shift+↓` | Add row after |
| `Cmd+Shift+←` | Add column before |
| `Cmd+Shift+→` | Add column after |
| `Tab` | Next cell |
| `Shift+Tab` | Previous cell |

### Commands Reference
```bash
# Installation
npm install @tiptap/extension-table@^3.6.6
npm install turndown-plugin-gfm@^1.0.2
npm install tippy.js@^6.3.7
npm install @tiptap/suggestion@^3.6.6

# Validation
npm run type-check
npm run lint
npm run test

# Development
npm run dev
curl localhost:5173
```

---

## 🚨 Known Limitations

### GFM Markdown Constraints
1. **Merged cells** don't convert perfectly (content duplicated in markdown)
2. **Column alignment** not preserved (GFM limitation)
3. **Cell styling** (colors, borders) lost in conversion
4. **Very wide tables** may need horizontal scrolling

### Performance Considerations
- **Large tables (20×20+)** may cause editor lag
- **Recommendation:** Warn users about table size limits (max 400 cells)
- **Future optimization:** Virtual scrolling for large tables

### Browser Support
- **Modern browsers only** (Chrome 90+, Safari 14+, Firefox 88+)
- **IE 11 not supported** (TipTap requirement)

---

## 🔗 External Resources

### Official Documentation
- [TipTap Table Extension](https://tiptap.dev/docs/editor/api/extensions/table)
- [GFM Table Specification](https://github.github.com/gfm/#tables-extension-)
- [Turndown Documentation](https://github.com/mixmark-io/turndown)
- [marked.js Documentation](https://marked.js.org/)

### Related Sprint Documentation
- [Sprint 10 Completion Report](../sprint-10-in-context-formatting-menu.md)
- [Sprint 12 Images Plan](../sprint-12-images-plan.md)
- [Sprint 9 UX Consolidation](../sprint-09-ux-consolidation.md)

---

## 📞 Team Coordination

### AI Agent Workflow
```bash
# Before starting a task
npx claude-flow@alpha hooks pre-task --description "[Task ID]: [Task Title]"

# After completing a task
npx claude-flow@alpha hooks post-task --task-id "[Task ID]"
npx claude-flow@alpha hooks post-edit --file "[modified-file]" --memory-key "sprint-11/[task-id]"

# Session management
npx claude-flow@alpha hooks session-restore --session-id "swarm-sprint-11"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Swarm Coordination
- **Swarm ID:** `swarm-sprint-11-tables`
- **Topology:** Mesh (peer-to-peer collaboration)
- **Max Agents:** 8
- **Primary Agents:** `researcher`, `coder`, `tester`, `reviewer`

---

## 📊 Metrics & Tracking

### Bundle Size Tracking
| Milestone | Bundle Size | Delta | % Increase |
|-----------|-------------|-------|------------|
| Sprint 10 Baseline | 305.16 KB | - | - |
| Sprint 11 Target | 325.52 KB | +20.36 KB | +6.7% |
| Sprint 11 Actual | TBD | TBD | TBD |

### Test Coverage Goals
| Category | Target | Actual |
|----------|--------|--------|
| Unit Tests | 40+ tests | TBD |
| Coverage | >90% | TBD |
| Pass Rate | 100% | TBD |

### Performance Benchmarks
| Metric | Target | Actual |
|--------|--------|--------|
| Table Insertion | <100ms | TBD |
| Row/Column Add | <50ms | TBD |
| Markdown Conversion | <200ms | TBD |
| 10×10 Table Rendering | <500ms | TBD |

---

## 🔄 Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-11 | 1.0 | Initial sprint planning complete | Planning Team |
| 2025-10-12 | 1.1 | Architecture and task breakdown finalized | Architecture Team |
| 2025-10-18 | 1.2 | README.md created for navigation | Researcher Agent |

---

## 📌 Next Steps After Sprint 11

**Sprint 12: Images** will include:
- Image insertion via slash command (`/image`)
- Google Drive image storage integration
- Image resizing and positioning
- Alt text and captions
- Lazy loading optimization
- Similar markdown serialization patterns

**Future Enhancements (Post-Sprint 12):**
- Table cell alignment (left, center, right)
- Table borders and custom styling
- CSV import/export
- Table sorting and filtering
- Table templates (pre-built layouts)

---

**Sprint 11 Status:** 📋 READY FOR EXECUTION
**Approval Required:** YES (user confirmation before starting)
**Estimated Start Date:** TBD (after user approval)
**Created by:** Research Agent (Sprint 11 Documentation Team)
**Last Updated:** October 18, 2025
