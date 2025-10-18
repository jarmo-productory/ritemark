# Comprehensive /docs Folder Refactoring Plan

**Analysis Date:** 2025-10-18
**Total Files:** 86 markdown files
**Total Directories:** 12 folders

---

## Executive Summary

This plan addresses scattered documentation across 12 folders, with 4 key issues:

1. **Sprint 9 already has nested structure** but files scattered in `/sprints`, `/architecture`, `/sprints/sprint-09`
2. **OAuth documentation scattered** across 4 locations (root, /security, /research, /security/oauth)
3. **Sprint-specific research files** orphaned in `/research/archived/`
4. **Root-level files** need proper organization

**Migration Threshold:** Only sprints with 3+ files get nested structure (Sprint 9, Sprint 11)

---

## Current State Analysis

### Sprint File Distribution

| Sprint | Total Files | Locations | Nested? | Action |
|--------|-------------|-----------|---------|--------|
| Sprint 01 | 1 file | /sprints | No | ✅ Keep flat |
| Sprint 02 | 1 file | /sprints | No | ✅ Keep flat (reports separate) |
| Sprint 03 | 2 files | /sprints | No | ✅ Keep flat |
| Sprint 05 | 1 file | /sprints | No | ✅ Keep flat |
| Sprint 06 | 1 file | /sprints | No | ✅ Keep flat (research archived) |
| Sprint 07 | 2 files | /sprints | No | ✅ Keep flat (research archived) |
| Sprint 08 | 2 files | /sprints | No | ✅ Keep flat |
| **Sprint 09** | **9 files** | **/sprints, /architecture, /sprints/sprint-09** | **Partial** | **🔥 CONSOLIDATE** |
| Sprint 10 | 2 files | /sprints, /research | No | ✅ Keep flat (research archived) |
| **Sprint 11** | **13 files** | **/sprints/sprint-11** | **Yes** | **✅ Already organized** |
| Sprint 12 | 2 files | /sprints | No | ✅ Keep flat |

### Sprint 9 File Breakdown (9 files across 3 locations)

**Currently in `/docs/sprints/sprint-09/` (7 files):**
```
component-diagram.txt                16,885 bytes
implementation-guide.md              15,228 bytes
postmortem.md                        28,726 bytes
README.md                            28,716 bytes
sidebar-architecture.md              93,508 bytes
sidebar-migration-plan.md            16,708 bytes
ux-consolidation.md                  26,718 bytes
```

**Scattered in `/docs/sprints/` (2 files):**
```
sprint-09-postmortem.md              (duplicate/alias)
sprint-09-ux-consolidation.md        (duplicate/alias)
sprint-09.1-sidebar-migration-plan.md
```

**Misplaced in `/docs/architecture/` (2 files):**
```
sprint-09-sidebar-architecture.md    (2059 lines)
SPRINT-09-IMPLEMENTATION-GUIDE.md
sprint-09-component-diagram.txt
```

### OAuth Documentation Scatter (13 files across 4 locations)

**Root level (3 files):**
```
oauth-single-popup-flow.md
oauth2-security-research.md
PRODUCTION-OAUTH-ISSUE-REPORT.md
```

**`/docs/security/` (4 files):**
```
oauth-production-error-audit-2025-10-05.md
oauth-security-audit-2025-10-04.md
oauth-security-audit-report.md
SECURITY-AUDIT-SUMMARY.md
```

**`/docs/security/oauth/` (11 files - ALREADY CONSOLIDATED!):**
```
google-oauth-setup-2025.md
oauth-architecture-summary.md
oauth-architecture.md
oauth-component-integration.md
oauth-security-audit.md
oauth-service-architecture.md
oauth-setup-guide.md
oauth-single-popup-flow.md
oauth2-security-research.md
PRODUCTION-OAUTH-ISSUE-REPORT.md
README.md
```

**`/docs/research/` (4 files):**
```
google-oauth-setup-2025.md
oauth-architecture-summary.md
oauth-component-integration.md
oauth-service-architecture.md
```

**`/docs/sprints/` (1 file):**
```
sprint-07-google-oauth-setup.md
```

### Research Folder Analysis

**Sprint-specific research (already archived):**
```
/research/archived/sprint-6-enhanced-features-research.md   (514 lines)
/research/archived/sprint-7-oauth-research.md               (524 lines)
/research/archived/sprint-10-in-context-formatting-audit.md  (62 lines)
```

**Generic research (keep):**
```
ai-integration-architecture.md
block-insertion-ux-patterns.md
google-drive-integration-analysis.md
milkdown-analysis.md
tiptap-block-insertion-architecture.md
tiptap-slash-commands-analysis.md
ux-analysis-non-technical-users.md
```

### Root-Level Files (9 files)

```
design-philosophy.md                  (Keep - high-level vision)
executive-summary.md                  (Keep - project overview)
roadmap.md                           (Keep - master roadmap)
Technical-Specifications.md          (Move to /technical/)
validation-framework.md              (Move to /quality/)
sprint3-implementation-plan.md       (Move to /sprints/)
oauth-single-popup-flow.md          (Move to /security/oauth/)
oauth2-security-research.md         (Move to /security/oauth/)
PRODUCTION-OAUTH-ISSUE-REPORT.md    (Move to /security/oauth/)
```

---

## Migration Plan

### Phase 1: Consolidate Sprint 9 Files (Priority: HIGH)

**Goal:** Merge all Sprint 9 files into `/docs/sprints/sprint-09/`

**Actions:**
```bash
# 1. Move misplaced architecture files
mv /docs/architecture/sprint-09-sidebar-architecture.md /docs/sprints/sprint-09/
mv /docs/architecture/SPRINT-09-IMPLEMENTATION-GUIDE.md /docs/sprints/sprint-09/
mv /docs/architecture/sprint-09-component-diagram.txt /docs/sprints/sprint-09/

# 2. Remove duplicates in /sprints/ (check if aliases first!)
# Compare files before deleting
diff /docs/sprints/sprint-09-postmortem.md /docs/sprints/sprint-09/postmortem.md
diff /docs/sprints/sprint-09-ux-consolidation.md /docs/sprints/sprint-09/ux-consolidation.md

# If identical, delete from /sprints/
rm /docs/sprints/sprint-09-postmortem.md
rm /docs/sprints/sprint-09-ux-consolidation.md

# 3. Handle sprint-09.1-sidebar-migration-plan.md
# Check if it's same as sidebar-migration-plan.md in sprint-09/
diff /docs/sprints/sprint-09.1-sidebar-migration-plan.md /docs/sprints/sprint-09/sidebar-migration-plan.md
# If different, move to sprint-09/
mv /docs/sprints/sprint-09.1-sidebar-migration-plan.md /docs/sprints/sprint-09/
```

**Expected Result:**
```
/docs/sprints/sprint-09/
├── README.md
├── component-diagram.txt
├── implementation-guide.md
├── postmortem.md
├── sidebar-architecture.md
├── sidebar-migration-plan.md
└── ux-consolidation.md
```

### Phase 2: Consolidate OAuth Documentation (Priority: MEDIUM)

**Goal:** All OAuth docs in `/docs/security/oauth/` with clear README

**Observation:** `/docs/security/oauth/` already contains 11 files and appears to be the canonical location!

**Actions:**
```bash
# 1. Verify /security/oauth/ is the source of truth
ls -lh /docs/security/oauth/

# 2. Remove duplicates from root level (they exist in /security/oauth/)
rm /docs/oauth-single-popup-flow.md
rm /docs/oauth2-security-research.md
rm /docs/PRODUCTION-OAUTH-ISSUE-REPORT.md

# 3. Move security audit files into /security/oauth/
mv /docs/security/oauth-production-error-audit-2025-10-05.md /docs/security/oauth/
mv /docs/security/oauth-security-audit-2025-10-04.md /docs/security/oauth/
mv /docs/security/oauth-security-audit-report.md /docs/security/oauth/

# 4. Remove OAuth duplicates from /research/ (already in /security/oauth/)
rm /docs/research/google-oauth-setup-2025.md
rm /docs/research/oauth-architecture-summary.md
rm /docs/research/oauth-component-integration.md
rm /docs/research/oauth-service-architecture.md

# 5. Cross-reference sprint-07-google-oauth-setup.md
# Keep in /sprints/ but add note pointing to /security/oauth/ for implementation details
```

**Expected Result:**
```
/docs/security/oauth/
├── README.md (update with index)
├── google-oauth-setup-2025.md
├── oauth-architecture-summary.md
├── oauth-architecture.md
├── oauth-component-integration.md
├── oauth-security-audit.md
├── oauth-security-audit-2025-10-04.md
├── oauth-production-error-audit-2025-10-05.md
├── oauth-service-architecture.md
├── oauth-setup-guide.md
├── oauth-single-popup-flow.md
├── oauth2-security-research.md
├── PRODUCTION-OAUTH-ISSUE-REPORT.md
└── SECURITY-AUDIT-SUMMARY.md (move from /security/)
```

### Phase 3: Clean Root-Level Files (Priority: HIGH)

**Goal:** Only keep high-level vision files at root

**Actions:**
```bash
# 1. Move technical specifications
mv /docs/Technical-Specifications.md /docs/technical/

# 2. Move validation framework
mv /docs/validation-framework.md /docs/quality/

# 3. Move Sprint 3 implementation plan
mv /docs/sprint3-implementation-plan.md /docs/sprints/
```

**Keep at Root:**
```
/docs/
├── design-philosophy.md          (High-level vision)
├── executive-summary.md          (Project overview)
└── roadmap.md                    (Master roadmap)
```

### Phase 4: Organize Research Folder (Priority: LOW)

**Goal:** Clear separation between archived sprint research and generic research

**Current State:**
```
/docs/research/
├── archived/
│   ├── sprint-6-enhanced-features-research.md
│   ├── sprint-7-oauth-research.md
│   └── sprint-10-in-context-formatting-audit.md
├── ai-integration-architecture.md
├── block-insertion-ux-patterns.md
├── google-drive-integration-analysis.md
├── milkdown-analysis.md
├── tiptap-block-insertion-architecture.md
├── tiptap-slash-commands-analysis.md
└── ux-analysis-non-technical-users.md
```

**Actions:**
```bash
# No changes needed - already well organized!
# Sprint-specific research already in archived/
# Generic research at root level
```

**Potential Future Organization (if research grows):**
```
/docs/research/
├── archived/           (Sprint-specific research)
├── editor/            (Editor-specific: milkdown, tiptap, block-insertion)
├── integrations/      (Drive API, OAuth, AI integration)
└── ux/                (UX patterns, user analysis)
```

### Phase 5: Sprint 2 Reports Consolidation (Priority: LOW)

**Goal:** Keep Sprint 2 audit reports with sprint files

**Current State:**
```
/docs/reports/sprint-2-pivot-audit.md
/docs/reports/sprint-2-audit-report.md
/docs/reports/sprint-2-decision-matrix.md
```

**Decision:** KEEP IN /reports/
- These are strategic audit documents, not sprint execution docs
- /reports/ folder contains marketplace analysis and strategic pivots
- Sprint 2 was a major strategic pivot, these are historical records

**No action needed.**

### Phase 6: Generate Master README (Priority: MEDIUM)

**Goal:** Create `/docs/README.md` as navigation hub

**Content Structure:**
```markdown
# RiteMark Documentation

> WYSIWYG Markdown Editor for AI-Native Users

## Quick Navigation

### 📋 Project Overview
- [Executive Summary](./executive-summary.md)
- [Design Philosophy](./design-philosophy.md)
- [Roadmap](./roadmap.md)

### 🏗️ Architecture
- [Technical Architecture](./architecture/technical-architecture.md)
- [Component Design](./architecture/component-design.md)
- [Drive Integration](./architecture/drive-integration-architecture.md)

### 🚀 Sprint Documentation
- [Active Sprint: Sprint 11 - Tables](./sprints/sprint-11/)
- [Sprint History](./sprints/)
- **Key Sprints:**
  - [Sprint 09 - UX Consolidation](./sprints/sprint-09/)
  - [Sprint 08 - Drive API Integration](./sprints/sprint-08-drive-api-integration.md)
  - [Sprint 07 - OAuth Setup](./sprints/sprint-07-google-oauth-setup.md)

### 🔒 Security & OAuth
- [OAuth Documentation Hub](./security/oauth/)
- [Security Audits](./security/)

### 🔬 Research & Analysis
- [Technical Research](./research/)
- [Archived Sprint Research](./research/archived/)

### 📊 Strategic Reports
- [Market Analysis](./reports/)
- [Sprint 2 Pivot Audit](./reports/sprint-2-pivot-audit.md)

### 🎯 Strategy & Business
- [Product Strategy](./strategy/)
- [Market Research](./business/)

### 🛠️ Technical Guides
- [Technical Documentation](./technical/)
- [Shadcn UI Guide](./technical/shadcn-ui-guide.md)
- [Tailwind CSS v4 Guide](./technical/tailwind-css-v4-guide.md)

### ✅ Quality Assurance
- [Code Quality Standards](./quality/)
```

---

## Migration Execution Steps

### Step 1: Backup Current State
```bash
# Create backup
tar -czf docs-backup-$(date +%Y%m%d).tar.gz /Users/jarmotuisk/Projects/ritemark/docs/

# Verify backup
tar -tzf docs-backup-$(date +%Y%m%d).tar.gz | head -20
```

### Step 2: Execute Phase 1 (Sprint 9 Consolidation)
```bash
# Run commands from Phase 1
# Validate each move
# Update internal links
```

### Step 3: Execute Phase 2 (OAuth Consolidation)
```bash
# Remove duplicates
# Verify /security/oauth/ is complete
# Update README in oauth folder
```

### Step 4: Execute Phase 3 (Root Cleanup)
```bash
# Move technical docs to proper folders
# Verify root only has 3 files
```

### Step 5: Generate Master README
```bash
# Create /docs/README.md
# Add navigation links
# Test all links
```

### Step 6: Update All Cross-References
```bash
# Search for broken links
grep -r "docs/sprint-09" /Users/jarmotuisk/Projects/ritemark/
grep -r "docs/oauth" /Users/jarmotuisk/Projects/ritemark/
grep -r "docs/Technical-Specifications" /Users/jarmotuisk/Projects/ritemark/

# Update references
```

---

## Validation Checklist

### Pre-Migration
- [ ] Backup created and verified
- [ ] All file counts documented
- [ ] Duplicate detection complete

### Post-Migration
- [ ] All Sprint 9 files in `/sprints/sprint-09/`
- [ ] All OAuth docs in `/security/oauth/`
- [ ] Root level has only 4 files (including new README.md)
- [ ] No broken internal links
- [ ] All markdown files render correctly
- [ ] Git status clean (no untracked files)

### Documentation Quality
- [ ] Master README.md created
- [ ] Sprint 09 README.md updated
- [ ] OAuth folder README.md updated
- [ ] All navigation paths tested

---

## File Count Summary

### Before Refactoring
- Total files: 86
- Sprint files scattered: 9 locations
- OAuth files scattered: 4 locations
- Root-level files: 9

### After Refactoring
- Total files: 86 (no files deleted, only reorganized)
- Sprint 9 files: 7 in `/sprints/sprint-09/`
- OAuth files: 14 in `/security/oauth/`
- Root-level files: 4 (README.md, executive-summary.md, design-philosophy.md, roadmap.md)

---

## Migration Priority Matrix

| Phase | Priority | Impact | Effort | Risk |
|-------|----------|--------|--------|------|
| Phase 1: Sprint 9 | HIGH | HIGH | Medium | Low |
| Phase 2: OAuth | MEDIUM | MEDIUM | Low | Very Low |
| Phase 3: Root Cleanup | HIGH | HIGH | Low | Very Low |
| Phase 4: Research | LOW | LOW | Very Low | Very Low |
| Phase 5: Sprint 2 Reports | LOW | LOW | None | None |
| Phase 6: Master README | MEDIUM | MEDIUM | Medium | Very Low |

**Recommended Execution Order:**
1. Phase 3 (Root Cleanup) - Quick wins
2. Phase 1 (Sprint 9) - High impact
3. Phase 2 (OAuth) - Already mostly done
4. Phase 6 (Master README) - Navigation
5. Phase 4 (Research) - Optional future work

---

## Success Metrics

✅ **Organization Clarity**: Any developer can find documentation in <30 seconds
✅ **Consistency**: All multi-file sprints follow same structure
✅ **Discoverability**: Master README provides clear navigation
✅ **Maintainability**: Clear rules for where new docs go
✅ **Zero Duplication**: No conflicting or redundant files

---

**Next Steps:**
1. Review this plan with team
2. Execute Phase 3 (quick wins)
3. Execute Phase 1 (Sprint 9 consolidation)
4. Create master README
5. Archive this plan in `/docs/sprints/sprint-11/`
