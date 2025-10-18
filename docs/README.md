# RiteMark Documentation

**Welcome to the complete documentation for RiteMark - a WYSIWYG Markdown Editor for AI-Native Users**

> **"Google Docs for Markdown"** - Visual editing with cloud collaboration and markdown output.

---

## 🚀 Quick Start

**New to RiteMark?** Start here:
1. **[Executive Summary](executive-summary.md)** - Complete project overview and technical architecture
2. **[Roadmap](roadmap.md)** - Project milestones, sprint history, and future plans
3. **[Design Philosophy](design-philosophy.md)** - Johnny Ive invisible interface principles

---

## 📁 Documentation Structure

```
docs/
├── 📖 Getting Started
│   ├── executive-summary.md          # Complete project overview
│   ├── roadmap.md                     # Milestones & sprint plan
│   └── design-philosophy.md           # UX principles
│
├── 🏗️ Architecture
│   ├── component-design.md            # React component architecture
│   ├── technical-foundation-architecture.md
│   ├── drive-integration-architecture.md
│   └── sprint-specific architectures
│
├── 📋 Sprint Documentation
│   ├── sprint-01 through sprint-10    # Flat structure (legacy)
│   ├── sprint-11/                     # Nested structure (NEW PATTERN)
│   │   ├── README.md                  # Sprint overview
│   │   ├── tables-research.md         # Feature research
│   │   ├── implementation-architecture.md
│   │   ├── task-breakdown.md
│   │   └── REFACTORING-LEARNINGS.md   # Key lessons learned
│   └── sprint-12+                     # Future sprints (nested)
│
├── 🔐 Security
│   ├── oauth-security-audit-report.md
│   ├── SECURITY-AUDIT-SUMMARY.md
│   └── oauth/                         # OAuth-specific security docs
│
├── 📚 Research
│   ├── editors/                       # Editor framework analysis
│   ├── integrations/                  # Google Drive, Y.js research
│   ├── ux/                            # User experience research
│   └── archived/                      # Historical research
│
├── 💼 Business & Strategy
│   ├── market-positioning-analysis.md
│   ├── ai-native-user-research.md
│   ├── product-strategy-breakthrough.md
│   └── STRATEGIC_RESET.md
│
├── 🛠️ Technical Resources
│   ├── Technical-Specifications.md
│   ├── technical-decision-framework.md
│   ├── shadcn-ui-guide.md
│   └── tailwind-css-v4-guide.md
│
├── 📊 Reports & Validation
│   ├── validation-framework.md
│   ├── quality/CODE_QUALITY_ENFORCEMENT.md
│   └── reports/                       # Sprint audits & analysis
│
└── 📖 Master Documentation (this file)
    └── README.md
```

---

## 📖 Getting Started

### For Product Managers & Stakeholders
- **[Executive Summary](executive-summary.md)** - Technical architecture and business benefits
- **[Roadmap](roadmap.md)** - Project timeline and milestone tracking
- **[Market Positioning](business/market-positioning-analysis.md)** - Competitive analysis

### For Developers
- **[Technical Specifications](Technical-Specifications.md)** - Complete technical overview
- **[Component Design](architecture/component-design.md)** - React architecture
- **[Drive Integration](architecture/drive-integration-architecture.md)** - Google Drive API setup

### For UX/UI Designers
- **[Design Philosophy](design-philosophy.md)** - Invisible interface principles
- **[UX Research](research/ux/ux-analysis-non-technical-users.md)** - Non-technical user needs
- **[Block Insertion UX](research/block-insertion-ux-patterns.md)** - Interaction patterns

---

## 🏗️ Architecture Documentation

### Core Architecture
- **[Technical Foundation](architecture/technical-foundation-architecture.md)** - React + TypeScript + TipTap stack
- **[Component Design](architecture/component-design.md)** - Component hierarchy and patterns
- **[Drive Integration](architecture/drive-integration-architecture.md)** - Google Drive API architecture

### Sprint-Specific Architecture
- **[Sprint 9 Sidebar Architecture](architecture/sprint-09-sidebar-architecture.md)** - Shadcn sidebar migration
- **[Sprint 9 Implementation Guide](architecture/SPRINT-09-IMPLEMENTATION-GUIDE.md)** - Component diagram and flow

---

## 📋 Sprint Documentation

### Understanding Sprint Organization

**Two Documentation Patterns:**

1. **Flat Structure (Sprints 1-10)** - Legacy pattern
   - Single markdown file per sprint
   - Example: `sprint-08-drive-api-integration.md`

2. **Nested Structure (Sprint 11+)** - NEW PATTERN ⭐
   - Dedicated folder per sprint with multiple files
   - Example: `sprint-11/` contains:
     - `README.md` - Sprint overview
     - `tables-research.md` - Feature research
     - `implementation-architecture.md` - Technical design
     - `task-breakdown.md` - Detailed task planning
     - `REFACTORING-LEARNINGS.md` - Key lessons learned

**Why the Change?**
Complex features (like table support) require comprehensive documentation across multiple dimensions (research, architecture, implementation, testing). Nested structure provides better organization and discoverability.

### Sprint History

#### ✅ Completed Sprints (Milestone 1 & 2 Foundation)

| Sprint | Focus | Status | Key Achievements |
|--------|-------|--------|------------------|
| **[Sprint 1](sprints/sprint-01-foundation-setup.md)** | Foundation | ✅ Complete | React + TypeScript + Vite setup |
| **[Sprint 2](sprints/sprint-02-advanced-cicd.md)** | Strategic Pivot | ✅ Complete | Evidence-based pivot to standalone editor |
| **[Sprint 3](sprints/sprint-03.md)** | Basic Editor | ✅ Complete | First working text editor |
| **Sprint 4** | WYSIWYG | ✅ Complete | TipTap editor with invisible interface |
| **[Sprint 5](sprints/sprint-05-document-navigation.md)** | Navigation | ✅ Complete | Revolutionary TOC with ProseMirror state |
| **[Sprint 6](sprints/sprint-06-enhanced-editor-features.md)** | Enhanced Features | ✅ Complete | Code blocks, ordered lists, text selection |
| **[Sprint 7](sprints/sprint-07-google-oauth-setup.md)** | OAuth Setup | ✅ Complete | Single-popup OAuth flow |
| **[Sprint 8](sprints/sprint-08-drive-api-integration.md)** | Drive Integration | ✅ Complete | Complete file lifecycle with auto-save |
| **[Sprint 9](sprints/sprint-09-ux-consolidation.md)** | UX Consolidation | ✅ Complete | Shadcn sidebar migration |
| **[Sprint 10](sprints/sprint-10-in-context-formatting-menu.md)** | Formatting Menu | ✅ Complete | Selection-based formatting bubble |

#### 🚧 In Progress

| Sprint | Focus | Status | Documentation |
|--------|-------|--------|---------------|
| **[Sprint 11](sprints/sprint-11/)** | Table Support | 🚧 In Progress | **Nested structure** - See folder contents |

**Sprint 11 Key Documents:**
- **[README.md](sprints/sprint-11/README.md)** - Sprint overview and navigation
- **[tables-research.md](sprints/sprint-11/tables-research.md)** - TipTap table extension analysis
- **[implementation-architecture.md](sprints/sprint-11/implementation-architecture.md)** - Technical design
- **[REFACTORING-LEARNINGS.md](sprints/sprint-11/REFACTORING-LEARNINGS.md)** - **Critical lessons for AI agents** ⭐

#### 🔮 Planned Sprints

| Sprint | Focus | Status | Goal |
|--------|-------|--------|------|
| **Sprint 12** | Image Support | 📋 Planned | Image upload, resize, caption |
| **Sprint 13+** | Real-Time Collaboration | 📋 Future | Y.js CRDT integration |

---

## 🔐 Security Documentation

### OAuth & Authentication
- **[OAuth Security Audit Report](security/oauth-security-audit-report.md)** - Comprehensive security analysis
- **[Security Audit Summary](security/SECURITY-AUDIT-SUMMARY.md)** - Executive summary
- **[Production OAuth Issue Report](PRODUCTION-OAUTH-ISSUE-REPORT.md)** - Production deployment fixes
- **[OAuth Single-Popup Flow](oauth-single-popup-flow.md)** - Implementation guide

### Security Audits (Chronological)
- **[2025-10-04 OAuth Security Audit](security/oauth-security-audit-2025-10-04.md)**
- **[2025-10-05 Production Error Audit](security/oauth-production-error-audit-2025-10-05.md)**

---

## 📚 Research Documentation

### Editor Framework Research
Located in `research/editors/`:
- **[Milkdown Analysis](research/milkdown-analysis.md)** - Original framework evaluation (pre-TipTap pivot)
- **[TipTap Block Insertion Architecture](research/tiptap-block-insertion-architecture.md)**
- **[TipTap Slash Commands Analysis](research/tiptap-slash-commands-analysis.md)**

### Google Drive Integration Research
Located in `research/integrations/`:
- **[Google Drive Integration Analysis](research/google-drive-integration-analysis.md)**
- **[OAuth Service Architecture](research/oauth-service-architecture.md)**
- **[OAuth Component Integration](research/oauth-component-integration.md)**
- **[OAuth Architecture Summary](research/oauth-architecture-summary.md)**
- **[Google OAuth Setup 2025](research/google-oauth-setup-2025.md)**

### UX Research
Located in `research/ux/`:
- **[UX Analysis - Non-Technical Users](research/ux-analysis-non-technical-users.md)**
- **[Block Insertion UX Patterns](research/block-insertion-ux-patterns.md)**
- **[AI Integration Architecture](research/ai-integration-architecture.md)**

### Sprint-Specific Research
- **[Sprint 6 Enhanced Features Research](research/sprint-6-enhanced-features-research.md)**
- **[Sprint 7 OAuth Research](research/sprint-7-oauth-research.md)**
- **[Sprint 10 In-Context Formatting Audit](research/sprint-10-in-context-formatting-audit.md)**

---

## 💼 Business & Strategy Documentation

### Market & Product Strategy
- **[Market Positioning Analysis](business/market-positioning-analysis.md)** - Competitive landscape
- **[AI-Native User Research](business/ai-native-user-research.md)** - Target audience analysis
- **[Product Strategy Breakthrough](strategy/product-strategy-breakthrough.md)** - Strategic direction
- **[Strategic Reset](strategy/STRATEGIC_RESET.md)** - Pivot from marketplace to standalone

### Strategic Reports
- **[Marketplace Analysis](reports/01-marketplace-analysis.md)** - Original marketplace research
- **[User Research Strategy](reports/02-user-research-strategy.md)** - Research methodology
- **[Sprint 2 Pivot Audit](reports/sprint-2-pivot-audit.md)** - Evidence-based pivot analysis
- **[Sprint 2 Decision Matrix](reports/sprint-2-decision-matrix.md)** - Strategic decision framework

### Validation & Planning
- **[Strategy Validation Analysis](strategy/strategy-validation-analysis.md)**
- **[Validation Playbook](strategy/VALIDATION_PLAYBOOK.md)**
- **[Strategic Implementation Plan](strategy/Strategic-Implementation-Plan.md)**

---

## 🛠️ Technical Resources

### Core Technical Documentation
- **[Technical Specifications](Technical-Specifications.md)** - Complete technical overview
- **[Technical Decision Framework](technical/technical-decision-framework.md)** - Decision-making process
- **[Architecture Comparison](technical/architecture-comparison.md)** - Framework evaluations

### UI Framework Guides
- **[Shadcn UI Guide](technical/shadcn-ui-guide.md)** - Component library usage
- **[Tailwind CSS v4 Guide](technical/tailwind-css-v4-guide.md)** - Styling framework

### Implementation Plans
- **[Phase 1 Implementation Plan](technical/phase-1-implementation-plan.md)**
- **[Sprint 3 Implementation Plan](sprint3-implementation-plan.md)**
- **[TOC Scroll Navigation Research](technical/toc-scroll-navigation-research.md)**

### Legacy Technical Documents
- **[Marketplace Tech Requirements](technical/MARKETPLACE_TECH_REQUIREMENTS.md)** - Pre-pivot requirements (archived)

---

## 📊 Reports & Validation

### Quality Enforcement
- **[Validation Framework](validation-framework.md)** - Testing and validation strategy
- **[Code Quality Enforcement](quality/CODE_QUALITY_ENFORCEMENT.md)** - Quality standards

### Sprint Audit Reports
- **[Sprint 2 Audit Report](reports/sprint-2-audit-report.md)** - Pivot validation
- **[Sprint 3 Final Validation Report](sprints/Sprint-3-Final-Validation-Report.md)** - Editor validation
- **[Sprint 7 Completion Report](sprints/sprint-07-completion-report.md)** - OAuth completion
- **[Sprint 9 Postmortem](sprints/sprint-09-postmortem.md)** - Migration analysis

---

## 🤖 For AI Agents: Documentation Navigation Guide

### Critical Reading for AI Agents

**ALWAYS read these first before starting work:**
1. **[CLAUDE.md](../CLAUDE.md)** - Project instructions and AI-assisted coding lifecycle
2. **[Roadmap](roadmap.md)** - Current sprint and project status
3. **[Sprint 11 REFACTORING-LEARNINGS.md](sprints/sprint-11/REFACTORING-LEARNINGS.md)** - **MANDATORY reading** ⭐

### Understanding Sprint Documentation Patterns

**Pattern 1: Flat Structure (Sprints 1-10)**
```
docs/sprints/sprint-08-drive-api-integration.md
```
- Single markdown file
- All documentation in one place
- Use for simple, focused sprints

**Pattern 2: Nested Structure (Sprint 11+)** ⭐ **RECOMMENDED**
```
docs/sprints/sprint-11/
├── README.md                          # Sprint overview and navigation
├── tables-research.md                 # Feature research and analysis
├── implementation-architecture.md     # Technical design
├── task-breakdown.md                  # Detailed task planning
├── phase-breakdown.md                 # Implementation phases
├── dependency-analysis.md             # Dependency management
└── REFACTORING-LEARNINGS.md          # Key lessons learned
```
- Dedicated folder per sprint
- Multiple specialized files
- Better organization for complex features
- **Use this pattern for Sprint 11 and beyond**

### When to Use Nested vs Flat Structure

**Use Flat Structure when:**
- Sprint has single, focused feature
- Documentation fits in < 500 lines
- Minimal research required
- Quick implementation (1-2 days)

**Use Nested Structure when:**
- Complex feature requiring research
- Multiple implementation phases
- Need for architecture diagrams
- Requires detailed task breakdown
- Implementation spans multiple days
- **Example: Sprint 11 table support**

### Key Files for AI Agents

**Before Starting Work:**
1. Read `sprints/sprint-11/REFACTORING-LEARNINGS.md` - Critical lessons
2. Check `roadmap.md` - Verify current sprint status
3. Review sprint-specific `README.md` if nested structure

**During Implementation:**
1. Follow architecture docs in sprint folder
2. Use task-breakdown.md for step-by-step guidance
3. Document learnings in REFACTORING-LEARNINGS.md pattern

**After Completion:**
1. Update roadmap.md with sprint completion
2. Create REFACTORING-LEARNINGS.md if significant lessons learned
3. Update this master README.md with sprint status

---

## 📖 Directory Tree Visualization

Complete documentation structure:

```
docs/
├── README.md                          # This master navigation file
├── executive-summary.md               # Project overview
├── roadmap.md                         # Milestones & sprint plan
├── design-philosophy.md               # UX principles
├── Technical-Specifications.md        # Complete technical specs
├── validation-framework.md            # Testing strategy
│
├── architecture/                      # Architecture documentation
│   ├── component-design.md
│   ├── technical-foundation-architecture.md
│   ├── drive-integration-architecture.md
│   ├── sprint-09-sidebar-architecture.md
│   ├── sprint-09-component-diagram.txt
│   └── SPRINT-09-IMPLEMENTATION-GUIDE.md
│
├── business/                          # Business & market analysis
│   ├── market-positioning-analysis.md
│   ├── ai-native-user-research.md
│   └── market-research-foundation.md
│
├── quality/                           # Quality enforcement
│   └── CODE_QUALITY_ENFORCEMENT.md
│
├── reports/                           # Sprint audits & analysis
│   ├── 01-marketplace-analysis.md
│   ├── 02-user-research-strategy.md
│   ├── 03-marketplace-compliance-guide.md
│   ├── 04-kickstarter-framework-audit.md
│   ├── sprint-2-audit-report.md
│   ├── sprint-2-decision-matrix.md
│   └── sprint-2-pivot-audit.md
│
├── research/                          # Research documentation
│   ├── editors/                       # Editor framework analysis
│   ├── integrations/                  # Google Drive, Y.js research
│   ├── ux/                            # User experience research
│   ├── archived/                      # Historical research
│   ├── milkdown-analysis.md
│   ├── tiptap-slash-commands-analysis.md
│   ├── tiptap-block-insertion-architecture.md
│   ├── block-insertion-ux-patterns.md
│   ├── google-drive-integration-analysis.md
│   ├── oauth-service-architecture.md
│   ├── oauth-component-integration.md
│   ├── oauth-architecture-summary.md
│   ├── google-oauth-setup-2025.md
│   ├── ai-integration-architecture.md
│   ├── ux-analysis-non-technical-users.md
│   ├── sprint-6-enhanced-features-research.md
│   ├── sprint-7-oauth-research.md
│   └── sprint-10-in-context-formatting-audit.md
│
├── security/                          # Security documentation
│   ├── oauth/                         # OAuth-specific security
│   ├── oauth-security-audit-report.md
│   ├── SECURITY-AUDIT-SUMMARY.md
│   ├── oauth-security-audit-2025-10-04.md
│   └── oauth-production-error-audit-2025-10-05.md
│
├── sprints/                           # Sprint documentation
│   ├── sprint-01-foundation-setup.md
│   ├── sprint-02-advanced-cicd.md
│   ├── sprint-03.md
│   ├── Sprint-3-Final-Validation-Report.md
│   ├── sprint-05-document-navigation.md
│   ├── sprint-06-enhanced-editor-features.md
│   ├── sprint-07-google-oauth-setup.md
│   ├── sprint-07-completion-report.md
│   ├── sprint-08-drive-api-integration.md
│   ├── sprint-08-critical-fixes.md
│   ├── sprint-09-ux-consolidation.md
│   ├── sprint-09-postmortem.md
│   ├── sprint-09.1-sidebar-migration-plan.md
│   ├── sprint-10-in-context-formatting-menu.md
│   ├── sprint-11/                     # Nested structure (NEW)
│   │   ├── README.md
│   │   ├── tables-research.md
│   │   ├── implementation-architecture.md
│   │   ├── task-breakdown.md
│   │   ├── phase-breakdown.md
│   │   ├── dependency-analysis.md
│   │   ├── orchestration-summary.md
│   │   ├── research-codebase-audit.md
│   │   ├── research-execution-summary.md
│   │   ├── FILE-ORGANIZATION.md
│   │   └── REFACTORING-LEARNINGS.md   # Critical lessons
│   ├── sprint-12-images-research.md
│   └── sprint-12-images-plan.md
│
├── strategy/                          # Strategic planning
│   ├── product-strategy-breakthrough.md
│   ├── STRATEGIC_RESET.md
│   ├── Strategic-Implementation-Plan.md
│   ├── strategy-validation-analysis.md
│   ├── VALIDATION_PLAYBOOK.md
│   └── 04-naming-rationale.md
│
├── technical/                         # Technical resources
│   ├── technical-decision-framework.md
│   ├── architecture-comparison.md
│   ├── phase-1-implementation-plan.md
│   ├── shadcn-ui-guide.md
│   ├── tailwind-css-v4-guide.md
│   ├── toc-scroll-navigation-research.md
│   └── MARKETPLACE_TECH_REQUIREMENTS.md
│
└── Legacy root-level files
    ├── oauth-single-popup-flow.md
    ├── oauth2-security-research.md
    ├── PRODUCTION-OAUTH-ISSUE-REPORT.md
    └── sprint3-implementation-plan.md
```

---

## 🔍 Quick Reference

### Find Documentation By Type

**Architecture:** `docs/architecture/`
**Business Strategy:** `docs/business/` or `docs/strategy/`
**Research:** `docs/research/`
**Security:** `docs/security/`
**Sprints:** `docs/sprints/`
**Technical Guides:** `docs/technical/`
**Quality:** `docs/quality/`
**Reports:** `docs/reports/`

### Find Documentation By Topic

**OAuth & Authentication:** `docs/security/` + `docs/research/oauth-*.md`
**Google Drive Integration:** `docs/architecture/drive-integration-architecture.md` + `docs/research/google-drive-*.md`
**Editor (TipTap):** `docs/research/tiptap-*.md`
**UX Design:** `docs/design-philosophy.md` + `docs/research/ux/`
**Market & Product:** `docs/business/` + `docs/strategy/`
**Sprints:** `docs/sprints/sprint-NN*/`

---

## 📝 Documentation Maintenance

### When to Update This README

**Add New Sprint:**
1. Update sprint table in "Sprint History" section
2. Link to sprint folder (if nested) or file (if flat)
3. Update "In Progress" or "Completed" status

**Add New Research:**
1. Add link under "Research Documentation"
2. Organize by category (editors, integrations, ux)

**New Architecture Docs:**
1. Add to "Architecture Documentation" section
2. Link from relevant sprint documentation

**Security Updates:**
1. Add to "Security Documentation" chronological list
2. Update security audit summary if needed

### Documentation Standards

**File Naming:**
- Use lowercase with hyphens: `sprint-11-tables-research.md`
- Prefix sprint files: `sprint-NN-feature-name.md`
- Use descriptive names: `oauth-security-audit-2025-10-04.md`

**Folder Structure:**
- Group related documents in folders
- Use nested structure for complex sprints (Sprint 11+)
- Keep flat structure for simple sprints (Sprint 1-10)

**Content Organization:**
- Always include README.md in nested sprint folders
- Use clear section headers with emojis for navigation
- Link between related documents
- Keep master README up to date

---

## 🎯 Current Project Status

**Active Sprint:** Sprint 11 - Table Support 🚧
**Last Updated:** 2025-10-18
**Documentation Version:** 2.0 (Nested structure pattern introduced)

**Recent Changes:**
- ✅ Sprint 11 nested structure implemented
- ✅ REFACTORING-LEARNINGS.md created with critical lessons
- ✅ Master README.md created as documentation homepage

**Next Steps:**
1. Complete Sprint 11 table implementation
2. Document Sprint 11 completion in roadmap.md
3. Plan Sprint 12 image support with nested structure

---

## 📚 Additional Resources

**External Documentation:**
- [TipTap Editor Documentation](https://tiptap.dev/docs)
- [Google Drive API Reference](https://developers.google.com/drive/api/v3/reference)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Shadcn UI Components](https://ui.shadcn.com/)

**Project Links:**
- Production: https://ritemark.netlify.app
- Repository: (internal)
- Issue Tracker: (internal)

---

**Master Documentation maintained by:** RiteMark Development Team
**For questions or updates:** Refer to CLAUDE.md for AI agent instructions
