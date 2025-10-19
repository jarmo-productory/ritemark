# Documentation Validation Framework

**Purpose:** Automated validation system to enforce documentation governance rules
**Status:** 🚧 Specification Complete - Implementation Pending
**Created:** October 18, 2025
**Enforces:** `/docs/quality/DOCUMENTATION-GOVERNANCE.md` rules

---

## 🎯 Overview

This framework provides automated validation of documentation structure through:
- **Pre-commit hooks** - Block commits that violate rules
- **CI/CD pipeline checks** - Prevent merges of invalid documentation
- **CLI validation scripts** - Manual validation and repair tools
- **Real-time IDE linting** - Catch issues during editing

---

## 📋 Validation Scripts

### 1. Sprint Structure Validator

**Script:** `/scripts/docs/validate-sprint-structure.sh`

**Purpose:** Ensures ALL sprints are in nested directory structure

**Checks:**
- ✅ No sprint files directly in `/docs/sprints/` (must be in subdirectories)
- ✅ Every sprint folder has mandatory `README.md`
- ✅ Sprint folders follow naming convention `sprint-XX/`
- ✅ README.md contains all required sections

**Usage:**
```bash
# Validate all sprints
./scripts/docs/validate-sprint-structure.sh

# Validate specific sprint
./scripts/docs/validate-sprint-structure.sh sprint-11

# Auto-fix violations (interactive)
./scripts/docs/validate-sprint-structure.sh --fix
```

**Exit Codes:**
- `0` - All validations passed
- `1` - Structure violations found
- `2` - Missing README.md files
- `3` - README.md missing required sections

**Example Output:**
```
🔍 Validating sprint documentation structure...

✅ Sprint 9: Passed (6 files, README complete)
✅ Sprint 11: Passed (10 files, README complete)
❌ Sprint 1: FAILED
   ❌ Flat file detected: /docs/sprints/sprint-01-foundation.md
   ℹ️  Expected: /docs/sprints/sprint-01/README.md
   ℹ️  Run with --fix to migrate automatically

❌ Sprint 10: FAILED
   ❌ Missing README.md in /docs/sprints/sprint-10/
   ℹ️  Run with --create-readme to generate

Summary: 2 passed, 2 failed
Exit code: 1
```

---

### 2. README Structure Validator

**Script:** `/scripts/docs/validate-readmes.sh`

**Purpose:** Validates all sprint README.md files have required sections

**Required Sections:**
- 🎯 Quick Start (for AI agents) - REQUIRED
- 📚 Document Organization - REQUIRED
- 📊 Sprint Status - REQUIRED
- 🔗 Related Sprints - OPTIONAL
- 🏗️ Architecture Highlights - OPTIONAL
- 📦 Dependencies - OPTIONAL

**Checks:**
- ✅ README exists in every sprint folder
- ✅ Contains "Quick Start" section with reading order
- ✅ Contains "Document Organization" table
- ✅ Contains "Sprint Status" section
- ✅ All internal file links are valid
- ✅ No orphaned files (files not mentioned in README)

**Usage:**
```bash
# Validate all sprint READMEs
./scripts/docs/validate-readmes.sh

# Validate specific sprint README
./scripts/docs/validate-readmes.sh sprint-11

# Generate missing README
./scripts/docs/validate-readmes.sh --create sprint-10
```

**Example Output:**
```
🔍 Validating sprint README.md files...

✅ /docs/sprints/sprint-09/README.md
   ✅ Quick Start section found
   ✅ Document Organization table found
   ✅ Sprint Status section found
   ✅ All file links valid (6/6)
   ✅ No orphaned files

❌ /docs/sprints/sprint-11/README.md
   ✅ Quick Start section found
   ✅ Document Organization table found
   ❌ Sprint Status section MISSING
   ⚠️  1 orphaned file: research-notes.md not mentioned

Summary: 1 passed, 1 failed, 1 warning
Exit code: 1
```

---

### 3. Link Checker

**Script:** `/scripts/docs/check-links.sh`

**Purpose:** Validates all internal documentation links are valid

**Checks:**
- ✅ All markdown links point to existing files
- ✅ All anchor links (#section) point to valid headers
- ✅ No broken cross-references between sprints
- ✅ All relative paths are correct

**Usage:**
```bash
# Check all documentation links
./scripts/docs/check-links.sh

# Check specific file
./scripts/docs/check-links.sh docs/sprints/sprint-11/README.md

# Fix broken relative paths automatically
./scripts/docs/check-links.sh --fix
```

**Example Output:**
```
🔍 Checking documentation links...

✅ /docs/README.md (45 links checked)
✅ /docs/sprints/sprint-09/README.md (23 links checked)
❌ /docs/sprints/sprint-11/README.md
   ❌ Broken link: ../sprint-11-tables-plan.md (should be ./tables-plan.md)
   ❌ Broken anchor: #implementation-details (header not found)
   ⚠️  External link timeout: https://example.com/api

Summary: 2 passed, 1 failed, 1 warning
Exit code: 1
```

---

### 4. Security Documentation Validator

**Script:** `/scripts/docs/validate-security-docs.sh`

**Purpose:** Enforces immutability and audit trail rules for security documentation

**Checks:**
- ✅ Security audit files are append-only (no deletions)
- ✅ All security docs have complete metadata
- ✅ OAuth audit trail is chronological
- ✅ No missing audit entries

**Usage:**
```bash
# Validate security documentation
./scripts/docs/validate-security-docs.sh

# Check audit trail integrity
./scripts/docs/validate-security-docs.sh --audit-trail
```

---

## 🔧 Pre-Commit Hook Integration

**File:** `.git/hooks/pre-commit`

**Purpose:** Block commits that violate documentation governance rules

**Installation:**
```bash
# Copy hook template
cp scripts/docs/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Hook Behavior:**
```bash
#!/bin/bash
# .git/hooks/pre-commit (MANDATORY for all documentation commits)

echo "🔍 Validating documentation structure..."

# Run validation scripts
./scripts/docs/validate-sprint-structure.sh
SPRINT_EXIT=$?

./scripts/docs/validate-readmes.sh
README_EXIT=$?

./scripts/docs/check-links.sh
LINKS_EXIT=$?

# Block commit if any validation fails
if [ $SPRINT_EXIT -ne 0 ] || [ $README_EXIT -ne 0 ] || [ $LINKS_EXIT -ne 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: Documentation validation failed"
    echo ""
    echo "Fix the issues above or use --no-verify to bypass (NOT RECOMMENDED)"
    exit 1
fi

echo ""
echo "✅ All documentation validations passed"
exit 0
```

**Bypass (Emergency Use Only):**
```bash
# Skip pre-commit validation (creates quality debt)
git commit --no-verify -m "Emergency fix"

# This creates a quality debt entry and triggers alerts
```

---

## 🚀 CI/CD Pipeline Integration

**File:** `.github/workflows/validate-docs.yml`

**Purpose:** Prevent merges of invalid documentation to main branch

**Workflow:**
```yaml
name: Documentation Validation

on:
  pull_request:
    paths:
      - 'docs/**'
  push:
    branches:
      - main
      - 'feat/**'

jobs:
  validate-documentation:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Validate sprint structure
        run: ./scripts/docs/validate-sprint-structure.sh

      - name: Validate sprint READMEs
        run: ./scripts/docs/validate-readmes.sh

      - name: Check documentation links
        run: ./scripts/docs/check-links.sh

      - name: Validate security documentation
        run: ./scripts/docs/validate-security-docs.sh

      - name: Generate validation report
        if: failure()
        run: |
          echo "## ❌ Documentation Validation Failed" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "See job logs for detailed validation errors." >> $GITHUB_STEP_SUMMARY
```

**Pull Request Checks:**
- ✅ All validation scripts must pass
- ✅ No broken links allowed
- ✅ All new sprints must have README.md
- ✅ Security documentation must pass audit trail validation

**Status Checks:**
- Required status check: `validate-documentation`
- Blocks merge if validation fails
- Shows detailed error messages in PR comments

---

## 🛠️ Automation Scripts

### Create New Sprint

**Script:** `/scripts/docs/create-sprint.sh`

**Purpose:** Automatically create properly structured sprint directory

**Usage:**
```bash
# Create new sprint with template README
./scripts/docs/create-sprint.sh 12

# Creates:
# /docs/sprints/sprint-12/
# ├── README.md (from template)
# └── sprint-plan.md (placeholder)
```

**Generated README Template:**
```markdown
# Sprint 12: [Feature Name]

## 🎯 Quick Start (for AI agents)

**Required Reading (in order):**
1. `sprint-plan.md` - Sprint goals and deliverables

## 📚 Document Organization

| Document | Purpose | Status | Lines |
|----------|---------|--------|-------|
| sprint-plan.md | Sprint planning and goals | 🚧 In Progress | TBD |

## 📊 Sprint Status

- **Phase:** Planning
- **Progress:** 0%
- **Started:** [Date]
- **Target Completion:** TBD

---

**Status:** 🚧 Sprint planning in progress
**Created:** [Date]
**Last Updated:** [Date]
```

---

### Migrate Flat Sprint

**Script:** `/scripts/docs/migrate-sprint.sh`

**Purpose:** Migrate existing flat sprint files to nested structure

**Usage:**
```bash
# Migrate single flat file to nested structure
./scripts/docs/migrate-sprint.sh sprint-01

# Migrates:
# /docs/sprints/sprint-01-foundation.md
# To:
# /docs/sprints/sprint-01/
# ├── README.md (auto-generated)
# └── foundation.md (renamed from sprint-01-foundation.md)
```

**Migration Process:**
1. Create `/docs/sprints/sprint-XX/` directory
2. Use `git mv` to move flat file to nested directory
3. Remove `sprint-XX-` prefix from filename
4. Generate README.md with file links
5. Validate new structure

**Dry Run:**
```bash
# Preview migration without making changes
./scripts/docs/migrate-sprint.sh sprint-01 --dry-run
```

---

## 📊 Validation Reports

### Daily Validation Summary

**Script:** `/scripts/docs/generate-validation-report.sh`

**Purpose:** Generate comprehensive documentation health report

**Output:** `/docs/quality/validation-report.md`

**Includes:**
- Total sprints validated
- Validation pass/fail rates
- Broken links summary
- Missing README count
- Quality debt items
- Trends over time

**Example Report:**
```markdown
# Documentation Validation Report

**Generated:** October 18, 2025 14:30 UTC
**Commit:** a3f5b92

## 📊 Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Total Sprints** | 12 | - |
| **Validation Pass Rate** | 83% (10/12) | ⚠️ |
| **Broken Links** | 5 | ❌ |
| **Missing READMEs** | 2 | ❌ |
| **Quality Debt Items** | 3 | ⚠️ |

## ❌ Failed Validations

### Sprint 1
- Missing README.md
- Flat file structure detected

### Sprint 10
- README missing "Sprint Status" section
- 1 broken link: ../architecture/oauth.md

## 🔗 Broken Links

1. `/docs/sprints/sprint-10/README.md` → `../architecture/oauth.md` (moved to /docs/security/oauth/)
2. `/docs/sprints/sprint-11/README.md` → `#implementation-details` (anchor not found)

## 📈 Trends

- Week over week: 10% improvement in validation pass rate
- 3 sprints migrated to nested structure this week
- Quality debt reduced by 25%
```

---

## 🧪 Testing & Quality Assurance

### Validation Script Tests

**Location:** `/tests/docs/validation-tests.sh`

**Purpose:** Test validation scripts themselves

**Test Cases:**
1. ✅ Detects flat sprint files
2. ✅ Detects missing README.md
3. ✅ Validates README required sections
4. ✅ Detects broken internal links
5. ✅ Detects orphaned files
6. ✅ Validates security audit immutability

**Run Tests:**
```bash
# Run all validation tests
./tests/docs/validation-tests.sh

# Run specific test category
./tests/docs/validation-tests.sh --category sprint-structure
```

---

## 🚨 Error Handling & Recovery

### Common Validation Failures

#### 1. Flat Sprint File Detected
**Error:** `sprint-01-foundation.md` found in `/docs/sprints/`
**Fix:** Run `./scripts/docs/migrate-sprint.sh sprint-01`

#### 2. Missing README.md
**Error:** No README.md in `/docs/sprints/sprint-10/`
**Fix:** Run `./scripts/docs/validate-readmes.sh --create sprint-10`

#### 3. Broken Internal Link
**Error:** Link `../sprint-11-tables-plan.md` → should be `./tables-plan.md`
**Fix:** Run `./scripts/docs/check-links.sh --fix`

#### 4. Orphaned File
**Error:** File `research-notes.md` not mentioned in README.md
**Fix:** Add file to README "Document Organization" table

---

## 📚 Integration with Documentation Governance

This validation framework enforces the rules defined in:
- `/docs/quality/DOCUMENTATION-GOVERNANCE.md`

**Key Rules Enforced:**
- **Rule 1.1:** ALL sprints are nested directories ✅
- **Rule 2.1:** Every sprint has README.md ✅
- **Rule 2.2:** README contains required sections ✅
- **Rule 3.1:** All file links are valid ✅
- **Rule 4.1:** Security docs are append-only ✅

---

## 🎯 Success Metrics

**Target Validation Scores:**
- ✅ **100% sprint structure compliance** (all sprints nested)
- ✅ **100% README coverage** (every sprint has README.md)
- ✅ **95% link validity** (< 5% broken links allowed temporarily during refactoring)
- ✅ **Zero flat sprint files** in `/docs/sprints/`

**Current Status:**
- Sprint structure compliance: 75% (9/12 sprints nested)
- README coverage: 75% (9/12 have READMEs)
- Link validity: 92% (5 broken links pending fixes)
- Flat sprint files: 3 remaining (Sprint 1, 2, 10)

---

## 📝 Next Steps

1. **Implement validation scripts** (see `/docs/quality/AUTOMATION-SCRIPTS-SPEC.md`)
2. **Install pre-commit hooks** for all developers
3. **Enable CI/CD validation** in GitHub Actions
4. **Migrate remaining flat sprints** (Sprint 1, 2, 10)
5. **Fix broken links** (5 pending)
6. **Generate baseline validation report**

---

**Status:** 📋 Specification Complete
**Implementation:** Pending approval
**Created by:** Claude Code
**Last Updated:** October 18, 2025
