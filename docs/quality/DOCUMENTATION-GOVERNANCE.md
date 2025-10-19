# Documentation Governance - STRICT Rules & Enforcement

**Version:** 1.0.0
**Date:** October 18, 2025
**Status:** 🚨 MANDATORY - All rules are enforced
**Scope:** All documentation in `/docs/` folder

---

## 🎯 Core Principle

> **"Documentation is Code. Code is Documentation. Both must be production-ready before merge."**

All documentation follows the same quality standards as production code:
- ✅ Must pass automated validation
- ✅ Must be reviewed before merge
- ✅ Must be maintainable and accurate
- ✅ Must follow established patterns
- ✅ Must serve AI agents and humans equally

---

## 📋 Table of Contents

1. [Sprint Documentation Rules](#sprint-documentation-rules)
2. [File Naming Conventions](#file-naming-conventions)
3. [README Requirements](#readme-requirements)
4. [Security Documentation Rules](#security-documentation-rules)
5. [Validation & Enforcement](#validation--enforcement)
6. [Automation & Tooling](#automation--tooling)
7. [Migration Procedures](#migration-procedures)
8. [Consequences & Penalties](#consequences--penalties)

---

## 1. Sprint Documentation Rules

### **Rule 1.1: ALL Sprints Are Nested Directories**

**ABSOLUTE REQUIREMENT:** Every sprint, regardless of size or complexity, MUST be a nested directory structure.

```bash
# ✅ CORRECT - Always use nested structure
/docs/sprints/
├── sprint-01/
│   ├── README.md              # Mandatory
│   └── foundation-setup.md    # Main content
├── sprint-02/
│   ├── README.md              # Mandatory
│   └── advanced-cicd.md       # Main content
├── sprint-11/
│   ├── README.md              # Mandatory
│   ├── tables-plan.md
│   ├── implementation-architecture.md
│   └── ... (8+ files)

# ❌ FORBIDDEN - No flat sprint files
/docs/sprints/
├── sprint-01-foundation-setup.md     # WRONG
├── sprint-02.md                       # WRONG
```

**Rationale:**
- Zero if/else logic in validation
- Consistent structure from day one
- Easy to expand without migration
- README always present for navigation
- Predictable for AI agents

**Enforcement:**
- Pre-commit hook blocks flat sprint files
- CI/CD validates all sprints are nested
- Sprint creation script enforces structure

---

### **Rule 1.2: Sprint Folder Structure**

**Mandatory Contents:**
```
/docs/sprints/sprint-XX/
├── README.md                  # MANDATORY - Navigation guide
├── .sprint-metadata.json      # MANDATORY - Tracking data
├── [descriptive-name].md      # Main sprint document
└── ... (additional files)     # Optional supporting docs
```

**README.md MUST include:**
- 🎯 Quick Start (for AI agents)
- 📚 Document Organization table
- 🔗 Related Sprints
- 📊 Sprint Status
- 🎯 Success Criteria / Definition of Done

**Minimum Files:** 2 (README.md + at least one content file)
**Maximum Files:** Unlimited
**Naming Pattern:** Descriptive kebab-case (no sprint-XX- prefix inside folder)

---

### **Rule 1.3: Sprint Creation Process**

**REQUIRED:** All sprints MUST be created via automation script.

```bash
# Command
npm run sprint:create <number> "<name>"

# Example
npm run sprint:create 13 "Slash Commands Enhancement"

# Auto-generates:
/docs/sprints/sprint-13/
├── README.md (from template, pre-filled with sprint info)
├── .sprint-metadata.json (tracking: created date, status, etc.)
└── slash-commands-enhancement-plan.md (empty template)
```

**Manual creation is FORBIDDEN:**
- Ensures consistent structure
- Pre-fills README template
- Creates tracking metadata
- Updates master /docs/README.md
- Prevents structural errors

**Enforcement:**
- Pre-commit hook checks for `.sprint-metadata.json`
- If missing → sprint created manually → block commit
- CI/CD validates metadata exists and is valid

---

### **Rule 1.4: Sprint Lifecycle Documentation**

**MANDATORY at each phase:**

**Phase 1: Planning**
```
sprint-XX/
├── README.md
└── [name]-plan.md (goals, scope, acceptance criteria)
```

**Phase 2: Implementation**
```
sprint-XX/
├── README.md
├── [name]-plan.md
├── implementation-architecture.md (if complex)
├── task-breakdown.md (if >10 tasks)
└── dependency-analysis.md (if new dependencies)
```

**Phase 3: Completion**
```
sprint-XX/
├── README.md
├── [name]-plan.md
├── ... (implementation docs)
├── completion-report.md OR postmortem.md
└── LEARNINGS.md (what worked, what didn't)
```

**FORBIDDEN:**
- Starting sprint without plan document
- Completing sprint without learnings documentation
- Mixing sprint files with other folders (architecture, research)

**Enforcement:**
- Sprint branch cannot merge without completion docs
- CI/CD checks for required phase documents
- Code review checklist includes doc validation

---

## 2. File Naming Conventions

### **Rule 2.1: Naming Pattern**

**Format:** `[category]-[topic]-[type].md` (all lowercase, kebab-case)

**Inside Sprint Folders:**
```bash
# ✅ CORRECT - Descriptive names (folder provides sprint context)
tables-plan.md
implementation-architecture.md
codebase-audit.md
dependency-analysis.md
postmortem.md

# ❌ WRONG - Redundant prefix
sprint-11-tables-plan.md      # Folder already says sprint-11
s11-plan.md                   # Abbreviations forbidden
TablesPlan.md                 # Wrong casing
plan.md                       # Not descriptive enough
01-plan.md                    # Don't number files
```

**Outside Sprint Folders:**
```bash
# ✅ CORRECT - Include category for context
oauth-setup-guide.md
component-table-menu-design.md
api-drive-integration-spec.md

# ❌ WRONG
OAuthSetup.md                 # Wrong casing
oauth_setup.md                # Underscores forbidden
setup.md                      # Missing context
```

**Enforcement:**
- Pre-commit hook validates file names
- Regex pattern: `^[a-z0-9-]+\.md$`
- CI/CD linting checks naming
- Automated rename suggestions if violated

---

### **Rule 2.2: Forbidden Patterns**

**NEVER use:**
- ❌ CamelCase (`TablesPlan.md`)
- ❌ snake_case (`tables_plan.md`)
- ❌ UPPERCASE (`TABLES-PLAN.md`)
- ❌ Abbreviations (`s11-plan.md`)
- ❌ Numbers as prefixes (`01-plan.md`)
- ❌ Spaces (`tables plan.md`)
- ❌ Special characters (`tables@plan.md`)

**Exception:** README.md (must be exactly `README.md` - uppercase)

---

## 3. README Requirements

### **Rule 3.1: README Structure Template**

Every nested folder (sprint, topic, category) with 2+ files MUST have README.md.

**Mandatory Sections:**

```markdown
# [Title]

**Status:** [📋 Planning | 🚧 In Progress | ✅ Complete]
**Start Date:** YYYY-MM-DD
**Completion Date:** YYYY-MM-DD (if complete)

---

## 🎯 Quick Start (for AI agents)

**If you're [implementing/researching/reviewing] this [sprint/topic], read in this order:**

1. **[filename.md]** - [Purpose, what you'll learn]
2. **[filename.md]** - [Purpose, what you'll learn]
3. **[filename.md]** - [Purpose, what you'll learn]

---

## 📚 Document Organization

| Document | Purpose | Status | Lines | Last Updated |
|----------|---------|--------|-------|--------------|
| [name.md] | [purpose] | [status] | [count] | YYYY-MM-DD |
| [name.md] | [purpose] | [status] | [count] | YYYY-MM-DD |

---

## 🔗 Related Documentation

**Prerequisites:**
- [Link to prerequisite docs]

**Dependencies:**
- [Link to dependency docs]

**Future Work:**
- [Link to related future sprints/work]

---

## 📊 Status & Progress

[Status-specific content - varies by type]

For sprints:
- Current Phase: [phase name]
- Completion: X% (X/Y tasks)
- Key Milestones: [list]

---

## 🎯 Success Criteria

**This [sprint/topic] is COMPLETE when:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

[Additional sections as needed: Architecture, Dependencies, etc.]
```

**Enforcement:**
- Template validation script checks for required sections
- CI/CD fails if sections missing
- Automated README generator uses this template

---

### **Rule 3.2: README Quality Standards**

**Requirements:**
- ✅ All links must be valid (no 404s)
- ✅ Line counts must be accurate
- ✅ Last updated dates must be current
- ✅ Status must match actual state
- ✅ Reading order must be logical
- ✅ No typos (automated spell check)

**Forbidden:**
- ❌ Broken internal links
- ❌ Outdated status indicators
- ❌ Placeholder text ("TODO: fill this in")
- ❌ Incorrect file references
- ❌ Missing required sections

**Enforcement:**
- Link checker runs on every commit
- Spell checker validates prose
- Date validator checks "Last Updated" freshness
- CI/CD validates README completeness

---

### **Rule 3.3: README Generation & Updates**

**Auto-generation triggers:**
- Sprint creation → README from template
- Adding 2nd file to folder → README reminder
- Completing sprint → Update status to "✅ Complete"

**Manual updates required:**
- Reading order changes
- New files added
- Status changes
- Architecture highlights

**Enforcement:**
- Git hooks remind to update README when files change
- CI/CD warns if README older than other files in folder
- PR checklist includes "README updated?"

---

## 4. Security Documentation Rules

### **Rule 4.1: Security Docs Are Immutable**

**CRITICAL:** Security documentation is an audit trail - deletion is FORBIDDEN.

```bash
# ✅ ALLOWED
- Create new security document
- Update existing doc (with version tracking)
- Archive old doc to /security/archived/
- Consolidate docs (with full merge tracking)

# ❌ FORBIDDEN
- Delete security audit report
- Modify past audit without version note
- Remove production incident reports
- Overwrite historical security data
```

**Enforcement:**
- Git hook blocks deletion of `/docs/security/**/*`
- Modification requires version header:
  ```markdown
  **Version History:**
  - v1.0 (2025-10-01): Initial audit
  - v1.1 (2025-10-05): Updated with production findings
  ```
- Automated backup before any security doc edit
- PR review requires security team approval

---

### **Rule 4.2: OAuth Documentation Single Source of Truth**

**Structure:**
```
/docs/security/oauth/
├── README.md                    # Mandatory navigation
├── oauth-setup-guide.md         # Single setup document
├── oauth-security-audit.md      # Consolidated audits
├── oauth-architecture.md        # Design decisions
└── archived/                    # Historical versions
    ├── oauth-audit-2025-10-04.md
    └── oauth-audit-2025-10-05.md
```

**FORBIDDEN:**
- OAuth docs outside `/docs/security/oauth/`
- Duplicate OAuth setup guides
- Multiple "current" audit reports

**Enforcement:**
- Duplicate detector scans on every commit
- CI/CD fails if OAuth doc found elsewhere
- Automated consolidation warning if duplicate detected

---

## 5. Validation & Enforcement

### **Rule 5.1: Pre-Commit Validation**

**Script Location:** `.git/hooks/pre-commit`

**Checks performed:**
1. No sprint files outside nested folders
2. Every sprint folder has README.md
3. File naming convention compliance
4. No docs in `/src/` folder
5. Security docs not deleted
6. README sections complete

**Exit codes:**
- `0` = All checks passed
- `1` = Validation failed (blocks commit)
- `2` = Warning (allows commit with notice)

**Bypass (emergency only):**
```bash
# Requires explicit reason
git commit --no-verify -m "docs: emergency fix [skip-hooks: reason]"
```

---

### **Rule 5.2: CI/CD Pipeline Validation**

**Workflow:** `.github/workflows/docs-validation.yml`

**Checks:**
```yaml
jobs:
  validate-docs:
    steps:
      - Check sprint structure (all nested)
      - Validate README sections
      - Check broken links
      - Detect duplicates
      - Spell check
      - Validate code examples
      - Check naming conventions
      - Security docs audit trail
```

**Failure = PR blocked:**
- Cannot merge until all checks pass
- Automated comment on PR with failures
- Links to governance docs for reference

---

### **Rule 5.3: AI Agent Navigation Test**

**MANDATORY:** Documentation must be navigable by AI agents in ≤3 file reads.

**Test Scenarios:**
```bash
# Scenario 1: Find Sprint 11 implementation
Query: "How do I implement tables feature?"
Expected: docs/sprints/sprint-11/README.md → implementation-architecture.md
Max reads: 2 files
Pass: ✅ if found in ≤3 reads

# Scenario 2: OAuth setup
Query: "How to configure OAuth?"
Expected: docs/security/oauth/README.md → oauth-setup-guide.md
Max reads: 2 files
Pass: ✅ if found in ≤3 reads

# Scenario 3: Current sprint status
Query: "What sprint are we on?"
Expected: docs/roadmap.md → sprint-XX/README.md
Max reads: 2 files
Pass: ✅ if found in ≤3 reads
```

**Failure indicators:**
- ❌ AI reads >5 files to find answer
- ❌ Encounters broken link
- ❌ README missing or incomplete
- ❌ Misleading file names

**Enforcement:**
- Automated AI navigation test in CI/CD
- Tests run on every PR that touches /docs/
- Must pass before merge allowed

---

## 6. Automation & Tooling

### **Rule 6.1: Required Scripts**

**Location:** `/scripts/docs/`

**Mandatory scripts:**

```bash
# Sprint management
scripts/docs/create-sprint.sh <number> "<name>"
scripts/docs/migrate-sprint.sh <number> "<name>"
scripts/docs/complete-sprint.sh <number>

# Validation
scripts/docs/validate-structure.sh
scripts/docs/validate-readmes.sh
scripts/docs/check-links.sh
scripts/docs/detect-duplicates.sh

# Maintenance
scripts/docs/update-readme-dates.sh
scripts/docs/archive-stale-docs.sh
scripts/docs/generate-metrics.sh
```

**Usage enforcement:**
- Sprint creation ONLY via script
- Manual creation blocked by pre-commit
- Scripts included in CI/CD pipeline

---

### **Rule 6.2: Automated Remediation**

**Auto-fix (with user approval):**
- ✅ Rename files to correct format
- ✅ Generate missing README sections
- ✅ Update "last modified" dates
- ✅ Fix broken internal links
- ✅ Spell check corrections

**Require human intervention:**
- ⚠️ Architecture decisions
- ⚠️ Content rewrites
- ⚠️ Document deletion/archival
- ⚠️ Major structural changes
- ⚠️ Security doc modifications

---

### **Rule 6.3: Documentation Metrics**

**Tracked automatically:**
- Total docs count
- Broken links count
- README completeness %
- Stale docs (>90 days)
- Documentation debt score
- AI navigation test pass rate

**Quality gates:**
- Documentation debt must decrease sprint-over-sprint
- No merge if debt increases
- Monthly doc review required
- Stale docs must be updated or archived

---

## 7. Migration Procedures

### **Rule 7.1: Existing Flat Sprints Migration**

**Current state (as of 2025-10-18):**
- Sprint 1-8, 10, 12: Flat files (need migration)
- Sprint 9, 11: Already nested ✅

**Migration command:**
```bash
npm run sprint:migrate-all-flat

# Or individually:
npm run sprint:migrate 01 "Foundation Setup"
npm run sprint:migrate 02 "Advanced CI/CD"
# ... etc
```

**Migration process:**
1. Create `sprint-XX/` directory
2. Move existing file into directory
3. Rename file (remove `sprint-XX-` prefix)
4. Generate README.md from template
5. Create `.sprint-metadata.json`
6. Update `/docs/README.md` master navigation
7. Git commit: `refactor: migrate sprint-XX to nested structure`

**Timeline:**
- Phase 1: Migrate Sprint 1-8 (Day 1)
- Phase 2: Migrate Sprint 10, 12 (Day 1)
- Phase 3: Update CLAUDE.md (Day 1)
- Phase 4: Enable strict validation (Day 2)

---

### **Rule 7.2: Post-Migration Validation**

**After migration, verify:**
- [ ] All sprints are nested directories
- [ ] Every sprint has README.md
- [ ] All READMEs have required sections
- [ ] No flat sprint files remain
- [ ] Master /docs/README.md updated
- [ ] All links working
- [ ] AI navigation tests pass

**Rollback plan:**
- Git branch: `docs/migration-to-nested`
- If issues: `git revert` migration commits
- Fix issues, re-run migration
- Only merge when all validation passes

---

## 8. Consequences & Penalties

### **Rule 8.1: Merge Blocking**

**PR CANNOT be merged if:**
- ❌ Documentation validation fails
- ❌ Pre-commit hooks bypassed without reason
- ❌ README missing for nested folder
- ❌ Broken links detected
- ❌ Sprint structure violated
- ❌ File naming incorrect
- ❌ Security docs deleted
- ❌ AI navigation test fails

**Override:** Requires approval from 2+ maintainers with documented reason.

---

### **Rule 8.2: Quality Debt**

**Documentation debt tracked like technical debt:**

**Debt Indicators:**
- Missing READMEs
- Broken links
- Stale docs (>90 days old)
- Duplicate content
- Outdated code examples
- Incomplete sections

**Quality gate:**
- Doc debt must decrease sprint-over-sprint
- New debt not allowed without remediation plan
- Monthly review required
- High-debt PRs require extra review

**Metrics:**
```bash
# Example debt score
Total docs: 100
Missing READMEs: 5 (-10 points)
Broken links: 3 (-6 points)
Stale docs: 10 (-20 points)
Duplicates: 2 (-8 points)

Doc Debt Score: -44 points (POOR - remediation required)
```

---

### **Rule 8.3: Exceptions Process**

**When rules must be broken:**

1. Create exception request issue
2. Document reason for exception
3. Propose mitigation plan
4. Get approval from maintainers
5. Document exception in README
6. Set review date (max 30 days)

**Exception template:**
```markdown
## Exception Request: [Brief description]

**Rule being broken:** [Rule number and description]
**Reason:** [Why is this exception necessary?]
**Mitigation:** [How will we minimize impact?]
**Review date:** [When will we revisit this?]
**Approval:** [Maintainer signatures]
```

---

## 📊 Appendix A: Validation Scripts

### Sprint Structure Validator
```bash
#!/bin/bash
# scripts/docs/validate-structure.sh

echo "🔍 Validating sprint structure..."

# Check for flat sprint files
flat_sprints=$(find docs/sprints -maxdepth 1 -name "sprint-*.md" 2>/dev/null)
if [ ! -z "$flat_sprints" ]; then
    echo "❌ Found flat sprint files (must be nested):"
    echo "$flat_sprints"
    exit 1
fi

# Check every sprint has README
for sprint_dir in docs/sprints/sprint-*/; do
    if [ ! -f "$sprint_dir/README.md" ]; then
        echo "❌ Missing README.md in: $sprint_dir"
        exit 1
    fi

    if [ ! -f "$sprint_dir/.sprint-metadata.json" ]; then
        echo "⚠️  Missing metadata in: $sprint_dir"
        echo "   Sprint may have been created manually"
    fi
done

echo "✅ Sprint structure validation passed"
```

### README Section Validator
```bash
#!/bin/bash
# scripts/docs/validate-readmes.sh

echo "🔍 Validating README sections..."

required_sections=(
    "Quick Start"
    "Document Organization"
    "Sprint Status"
    "Success Criteria"
)

for readme in docs/sprints/sprint-*/README.md; do
    echo "Checking: $readme"

    for section in "${required_sections[@]}"; do
        if ! grep -q "## .*$section" "$readme"; then
            echo "❌ Missing section in $readme: $section"
            exit 1
        fi
    done
done

echo "✅ README validation passed"
```

---

## 📊 Appendix B: Sprint Creation Template

**Auto-generated by:** `npm run sprint:create <number> "<name>"`

**README.md template:**
```markdown
# Sprint [NUMBER]: [NAME]

**Status:** 📋 PLANNING
**Start Date:** [AUTO-FILLED]
**Estimated Duration:** TBD

---

## 🎯 Quick Start (for AI agents)

**If you're implementing this sprint, read in this order:**

1. **[name]-plan.md** - Goals, deliverables, acceptance criteria

---

## 📚 Document Organization

| Document | Purpose | Status | Last Updated |
|----------|---------|--------|--------------|
| [name]-plan.md | Sprint plan | 📝 Draft | [DATE] |

---

## 🔗 Related Sprints

**Prerequisites:**
- [List prerequisite sprints]

**Future Dependencies:**
- [List future sprints that depend on this]

---

## 📊 Sprint Status

- **Current Phase:** Planning
- **Completion:** 0% (0/0 tasks)
- **Key Milestones:**
  - [ ] Planning complete
  - [ ] Implementation complete
  - [ ] Testing complete

---

## 🎯 Success Criteria

**This sprint is COMPLETE when:**
- [ ] [Define specific success criteria]
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code reviewed and merged

---

**Created:** [DATE]
**Created by:** Sprint automation script
**Template version:** 1.0.0
```

---

## 📝 Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-10-18 | Initial documentation governance rules | Documentation Team |

---

## 🔗 Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
- [CODE_QUALITY_ENFORCEMENT.md](CODE_QUALITY_ENFORCEMENT.md) - Code quality rules
- [docs/README.md](../README.md) - Master documentation navigation

---

**Status:** ✅ APPROVED
**Enforcement:** MANDATORY
**Review Cycle:** Quarterly
**Next Review:** 2026-01-18
