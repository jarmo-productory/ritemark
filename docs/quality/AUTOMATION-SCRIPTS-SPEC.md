# Documentation Automation Scripts - Technical Specification

**Purpose:** Detailed technical specifications for documentation validation and automation scripts
**Status:** 📋 Specification - Ready for Implementation
**Created:** October 18, 2025
**Implements:** `/docs/quality/DOCS-VALIDATION-FRAMEWORK.md` requirements

---

## 🎯 Overview

This document provides complete technical specifications for all documentation automation scripts referenced in the validation framework.

**Implementation Location:** `/scripts/docs/`

**Script Categories:**
1. **Validation Scripts** - Check documentation compliance
2. **Migration Scripts** - Automate structure migrations
3. **Generator Scripts** - Create documentation templates
4. **Report Scripts** - Generate validation reports

---

## 📋 Script 1: Sprint Structure Validator

### File Path
`/scripts/docs/validate-sprint-structure.sh`

### Purpose
Validates that ALL sprints are in nested directory structure with no flat files

### Dependencies
- bash 4.0+
- find
- grep
- git (for checking tracked files)

### Exit Codes
- `0` - All validations passed
- `1` - Flat sprint files detected
- `2` - Missing README.md in sprint folders
- `3` - Invalid sprint folder naming

### Implementation

```bash
#!/bin/bash
# /scripts/docs/validate-sprint-structure.sh
#
# Validates sprint documentation structure compliance
# Usage: ./validate-sprint-structure.sh [sprint-XX] [--fix]

set -e

SPRINTS_DIR="docs/sprints"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating sprint documentation structure..."
echo ""

# Function: Check for flat sprint files
check_flat_files() {
    local flat_files=$(find "$SPRINTS_DIR" -maxdepth 1 -type f -name "sprint-*.md")

    if [ -n "$flat_files" ]; then
        echo -e "${RED}❌ VIOLATION: Flat sprint files detected${NC}"
        echo ""
        while IFS= read -r file; do
            echo -e "   ${RED}❌${NC} $file"

            # Extract sprint number
            sprint_num=$(echo "$file" | grep -oP 'sprint-\K\d+')
            echo -e "   ${YELLOW}ℹ️  Expected: $SPRINTS_DIR/sprint-$sprint_num/README.md${NC}"

            if [ "$1" == "--fix" ]; then
                echo -e "   ${YELLOW}🔧 Run: ./scripts/docs/migrate-sprint.sh sprint-$sprint_num${NC}"
            fi
            echo ""
        done <<< "$flat_files"

        EXIT_CODE=1
        return 1
    fi

    return 0
}

# Function: Check sprint folders have README.md
check_readme_files() {
    local sprint_folders=$(find "$SPRINTS_DIR" -maxdepth 1 -type d -name "sprint-*" | sort)

    if [ -z "$sprint_folders" ]; then
        echo -e "${YELLOW}⚠️  No sprint folders found${NC}"
        return 0
    fi

    local missing_readmes=0

    while IFS= read -r folder; do
        local sprint_name=$(basename "$folder")
        local readme_path="$folder/README.md"

        if [ ! -f "$readme_path" ]; then
            echo -e "${RED}❌ $sprint_name: Missing README.md${NC}"
            echo -e "   ${YELLOW}ℹ️  Run: ./scripts/docs/validate-readmes.sh --create $sprint_name${NC}"
            echo ""
            missing_readmes=$((missing_readmes + 1))
            EXIT_CODE=2
        else
            # Count files in sprint folder
            local file_count=$(find "$folder" -type f | wc -l)
            echo -e "${GREEN}✅ $sprint_name: Passed ($file_count files, README complete)${NC}"
        fi
    done <<< "$sprint_folders"

    if [ $missing_readmes -gt 0 ]; then
        return 1
    fi

    return 0
}

# Function: Validate sprint folder naming
check_folder_naming() {
    local invalid_folders=$(find "$SPRINTS_DIR" -maxdepth 1 -type d ! -name "sprint-[0-9][0-9]" ! -name "." ! -name ".." ! -name "sprints")

    if [ -n "$invalid_folders" ]; then
        echo -e "${RED}❌ VIOLATION: Invalid sprint folder names${NC}"
        echo ""
        while IFS= read -r folder; do
            echo -e "   ${RED}❌${NC} $(basename "$folder")"
            echo -e "   ${YELLOW}ℹ️  Expected format: sprint-XX (e.g., sprint-01, sprint-12)${NC}"
            echo ""
        done <<< "$invalid_folders"

        EXIT_CODE=3
        return 1
    fi

    return 0
}

# Main validation flow
main() {
    if [ "$1" == "--help" ]; then
        echo "Usage: $0 [sprint-XX] [--fix]"
        echo ""
        echo "Options:"
        echo "  sprint-XX    Validate specific sprint only"
        echo "  --fix        Show migration commands for violations"
        echo "  --help       Show this help message"
        exit 0
    fi

    # Check 1: Flat files
    check_flat_files "$1" || true

    # Check 2: README files
    check_readme_files || true

    # Check 3: Folder naming
    check_folder_naming || true

    echo ""
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ All sprint structure validations passed${NC}"
    else
        echo -e "${RED}❌ Sprint structure validation failed (exit code: $EXIT_CODE)${NC}"
        echo ""
        echo "Fix violations or use --fix flag for migration commands"
    fi

    exit $EXIT_CODE
}

main "$@"
```

### Test Cases

```bash
# Test 1: Detect flat sprint file
mkdir -p docs/sprints
touch docs/sprints/sprint-01-test.md
./scripts/docs/validate-sprint-structure.sh
# Expected: Exit 1, error message for flat file

# Test 2: Detect missing README
mkdir -p docs/sprints/sprint-02
touch docs/sprints/sprint-02/plan.md
./scripts/docs/validate-sprint-structure.sh
# Expected: Exit 2, error for missing README

# Test 3: All valid
mkdir -p docs/sprints/sprint-03
touch docs/sprints/sprint-03/README.md
./scripts/docs/validate-sprint-structure.sh
# Expected: Exit 0, all checks pass
```

---

## 📋 Script 2: README Structure Validator

### File Path
`/scripts/docs/validate-readmes.sh`

### Purpose
Validates that all sprint README.md files contain required sections

### Required Sections Detection
Uses pattern matching to detect required headers:
- `## 🎯 Quick Start` or `## Quick Start` (REQUIRED)
- `## 📚 Document Organization` (REQUIRED)
- `## 📊 Sprint Status` (REQUIRED)

### Implementation

```bash
#!/bin/bash
# /scripts/docs/validate-readmes.sh
#
# Validates sprint README.md structure and content
# Usage: ./validate-readmes.sh [sprint-XX] [--create]

set -e

SPRINTS_DIR="docs/sprints"
EXIT_CODE=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Validating sprint README.md files..."
echo ""

# Function: Check required sections in README
check_readme_sections() {
    local readme_path="$1"
    local sprint_name=$(basename $(dirname "$readme_path"))

    echo -e "${YELLOW}Checking${NC} $readme_path"

    # Check for required sections
    local quick_start=$(grep -c "## .*Quick Start" "$readme_path" || echo "0")
    local doc_org=$(grep -c "## .*Document Organization" "$readme_path" || echo "0")
    local sprint_status=$(grep -c "## .*Sprint Status" "$readme_path" || echo "0")

    local all_pass=true

    if [ "$quick_start" -eq "0" ]; then
        echo -e "   ${RED}❌ Missing 'Quick Start' section${NC}"
        all_pass=false
    else
        echo -e "   ${GREEN}✅ Quick Start section found${NC}"
    fi

    if [ "$doc_org" -eq "0" ]; then
        echo -e "   ${RED}❌ Missing 'Document Organization' section${NC}"
        all_pass=false
    else
        echo -e "   ${GREEN}✅ Document Organization section found${NC}"
    fi

    if [ "$sprint_status" -eq "0" ]; then
        echo -e "   ${RED}❌ Missing 'Sprint Status' section${NC}"
        all_pass=false
    else
        echo -e "   ${GREEN}✅ Sprint Status section found${NC}"
    fi

    # Check for orphaned files
    check_orphaned_files "$readme_path" "$sprint_name"

    echo ""

    if [ "$all_pass" = false ]; then
        EXIT_CODE=1
        return 1
    fi

    return 0
}

# Function: Check for orphaned files (files not mentioned in README)
check_orphaned_files() {
    local readme_path="$1"
    local sprint_name="$2"
    local sprint_dir=$(dirname "$readme_path")

    # Get all .md files except README
    local all_files=$(find "$sprint_dir" -name "*.md" ! -name "README.md" -exec basename {} \;)

    if [ -z "$all_files" ]; then
        return 0
    fi

    local orphaned_count=0
    while IFS= read -r file; do
        # Check if file is mentioned in README
        if ! grep -q "$file" "$readme_path"; then
            if [ $orphaned_count -eq 0 ]; then
                echo -e "   ${YELLOW}⚠️  Orphaned files (not mentioned in README):${NC}"
            fi
            echo -e "      - $file"
            orphaned_count=$((orphaned_count + 1))
        fi
    done <<< "$all_files"

    if [ $orphaned_count -gt 0 ]; then
        echo -e "   ${YELLOW}ℹ️  Add these files to 'Document Organization' table${NC}"
    else
        echo -e "   ${GREEN}✅ No orphaned files${NC}"
    fi
}

# Function: Generate README template
generate_readme_template() {
    local sprint_num="$1"
    local sprint_dir="docs/sprints/sprint-$sprint_num"
    local readme_path="$sprint_dir/README.md"

    if [ -f "$readme_path" ]; then
        echo -e "${RED}❌ README already exists: $readme_path${NC}"
        exit 1
    fi

    cat > "$readme_path" <<'EOF'
# Sprint XX: [Feature Name]

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
EOF

    sed -i '' "s/Sprint XX/Sprint $sprint_num/g" "$readme_path"
    echo -e "${GREEN}✅ Generated README template: $readme_path${NC}"
}

# Main validation flow
main() {
    if [ "$1" == "--create" ]; then
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Sprint number required${NC}"
            echo "Usage: $0 --create sprint-XX"
            exit 1
        fi

        local sprint_num=$(echo "$2" | grep -oP '\d+' || echo "")
        if [ -z "$sprint_num" ]; then
            echo -e "${RED}❌ Error: Invalid sprint format. Use sprint-XX${NC}"
            exit 1
        fi

        generate_readme_template "$sprint_num"
        exit 0
    fi

    # Validate all sprint READMEs
    local readmes=$(find "$SPRINTS_DIR" -name "README.md" | sort)

    if [ -z "$readmes" ]; then
        echo -e "${YELLOW}⚠️  No sprint READMEs found${NC}"
        exit 0
    fi

    local passed=0
    local failed=0

    while IFS= read -r readme; do
        if check_readme_sections "$readme"; then
            passed=$((passed + 1))
        else
            failed=$((failed + 1))
        fi
    done <<< "$readmes"

    echo ""
    echo "Summary: $passed passed, $failed failed"

    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${RED}❌ README validation failed${NC}"
    else
        echo -e "${GREEN}✅ All README validations passed${NC}"
    fi

    exit $EXIT_CODE
}

main "$@"
```

---

## 📋 Script 3: Link Checker

### File Path
`/scripts/docs/check-links.sh`

### Purpose
Validates all internal markdown links are valid

### Link Types Validated
- Relative file links: `[text](./file.md)`
- Absolute repository links: `[text](/docs/path/file.md)`
- Anchor links: `[text](#section-name)`
- Combined: `[text](./file.md#section)`

### Implementation

```bash
#!/bin/bash
# /scripts/docs/check-links.sh
#
# Validates internal documentation links
# Usage: ./check-links.sh [file.md] [--fix]

set -e

DOCS_DIR="docs"
EXIT_CODE=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking documentation links..."
echo ""

# Function: Extract and validate links from markdown file
check_file_links() {
    local file="$1"
    local file_dir=$(dirname "$file")

    echo -e "${YELLOW}Checking${NC} $file"

    # Extract all markdown links [text](path)
    local links=$(grep -oP '\[.*?\]\(\K[^)]+' "$file" || echo "")

    if [ -z "$links" ]; then
        echo -e "   ${YELLOW}ℹ️  No links found${NC}"
        echo ""
        return 0
    fi

    local link_count=0
    local broken_count=0

    while IFS= read -r link; do
        # Skip external links (http/https)
        if [[ "$link" =~ ^https?:// ]]; then
            continue
        fi

        link_count=$((link_count + 1))

        # Split anchor from path
        local path=$(echo "$link" | cut -d'#' -f1)
        local anchor=$(echo "$link" | grep -oP '#\K.*' || echo "")

        # Resolve relative path
        local resolved_path=""
        if [[ "$path" =~ ^/ ]]; then
            # Absolute path from repo root
            resolved_path="$path"
        else
            # Relative path from current file
            resolved_path="$file_dir/$path"
        fi

        # Normalize path (resolve ../ and ./)
        resolved_path=$(realpath -m "$resolved_path" 2>/dev/null || echo "$resolved_path")

        # Check if file exists
        if [ -n "$path" ] && [ ! -f "$resolved_path" ]; then
            echo -e "   ${RED}❌ Broken link: $link${NC}"
            echo -e "      ${YELLOW}File not found: $resolved_path${NC}"
            broken_count=$((broken_count + 1))
            EXIT_CODE=1
        fi

        # Check anchor if present
        if [ -n "$anchor" ] && [ -f "$resolved_path" ]; then
            # Convert anchor to header format (lowercase, spaces to dashes)
            local header_pattern=$(echo "$anchor" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

            if ! grep -q "^#.*$header_pattern" "$resolved_path"; then
                echo -e "   ${RED}❌ Broken anchor: #$anchor${NC}"
                echo -e "      ${YELLOW}Header not found in: $resolved_path${NC}"
                broken_count=$((broken_count + 1))
                EXIT_CODE=1
            fi
        fi
    done <<< "$links"

    if [ $broken_count -eq 0 ]; then
        echo -e "   ${GREEN}✅ All links valid ($link_count checked)${NC}"
    else
        echo -e "   ${RED}❌ $broken_count broken links (of $link_count total)${NC}"
    fi

    echo ""
}

# Main validation flow
main() {
    if [ -n "$1" ] && [ -f "$1" ]; then
        # Check specific file
        check_file_links "$1"
    else
        # Check all markdown files in docs
        local md_files=$(find "$DOCS_DIR" -name "*.md" | sort)

        local file_count=0
        while IFS= read -r file; do
            check_file_links "$file"
            file_count=$((file_count + 1))
        done <<< "$md_files"

        echo ""
        echo "Checked $file_count markdown files"
    fi

    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${RED}❌ Link validation failed${NC}"
    else
        echo -e "${GREEN}✅ All link validations passed${NC}"
    fi

    exit $EXIT_CODE
}

main "$@"
```

---

## 📋 Script 4: Sprint Migration Tool

### File Path
`/scripts/docs/migrate-sprint.sh`

### Purpose
Automatically migrate flat sprint files to nested structure

### Migration Steps
1. Create nested directory (`/docs/sprints/sprint-XX/`)
2. Use `git mv` to move flat file
3. Remove `sprint-XX-` prefix from filename
4. Generate README.md
5. Validate new structure

### Implementation

```bash
#!/bin/bash
# /scripts/docs/migrate-sprint.sh
#
# Migrates flat sprint file to nested directory structure
# Usage: ./migrate-sprint.sh sprint-XX [--dry-run]

set -e

SPRINTS_DIR="docs/sprints"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Sprint number required${NC}"
    echo "Usage: $0 sprint-XX [--dry-run]"
    exit 1
fi

SPRINT_NUM=$(echo "$1" | grep -oP '\d+' || echo "")
if [ -z "$SPRINT_NUM" ]; then
    echo -e "${RED}❌ Error: Invalid sprint format. Use sprint-XX${NC}"
    exit 1
fi

SPRINT_NAME="sprint-$(printf "%02d" $SPRINT_NUM)"
DRY_RUN=false

if [ "$2" == "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${BLUE}🔍 DRY RUN MODE - No changes will be made${NC}"
    echo ""
fi

echo "🚀 Migrating $SPRINT_NAME to nested structure..."
echo ""

# Find flat sprint file
FLAT_FILE=$(find "$SPRINTS_DIR" -maxdepth 1 -type f -name "$SPRINT_NAME-*.md" | head -n 1)

if [ -z "$FLAT_FILE" ]; then
    echo -e "${RED}❌ Error: No flat file found matching pattern: $SPRINTS_DIR/$SPRINT_NAME-*.md${NC}"
    exit 1
fi

echo -e "${YELLOW}Found flat file:${NC} $FLAT_FILE"

# Extract filename without sprint prefix
FILENAME=$(basename "$FLAT_FILE" | sed "s/^$SPRINT_NAME-//")
echo -e "${YELLOW}New filename:${NC} $FILENAME"

# Create nested directory
NESTED_DIR="$SPRINTS_DIR/$SPRINT_NAME"
echo -e "${YELLOW}Target directory:${NC} $NESTED_DIR"
echo ""

# Migration steps
if [ "$DRY_RUN" = false ]; then
    # Step 1: Create directory
    echo -e "${BLUE}Step 1:${NC} Creating directory..."
    mkdir -p "$NESTED_DIR"
    echo -e "${GREEN}✅ Created $NESTED_DIR${NC}"
    echo ""

    # Step 2: Move file with git
    echo -e "${BLUE}Step 2:${NC} Moving file..."
    git mv "$FLAT_FILE" "$NESTED_DIR/$FILENAME"
    echo -e "${GREEN}✅ Moved to $NESTED_DIR/$FILENAME${NC}"
    echo ""

    # Step 3: Generate README
    echo -e "${BLUE}Step 3:${NC} Generating README.md..."
    cat > "$NESTED_DIR/README.md" <<EOF
# Sprint $SPRINT_NUM: [Feature Name]

## 🎯 Quick Start (for AI agents)

**Required Reading (in order):**
1. \`$FILENAME\` - Sprint documentation

## 📚 Document Organization

| Document | Purpose | Status | Lines |
|----------|---------|--------|-------|
| $FILENAME | Main sprint documentation | ✅ Complete | $(wc -l < "$NESTED_DIR/$FILENAME") |

## 📊 Sprint Status

- **Phase:** Completed (migrated to nested structure)
- **Migrated:** $(date +"%B %d, %Y")

---

**Status:** ✅ Migration complete
**Created:** $(date +"%B %d, %Y")
**Last Updated:** $(date +"%B %d, %Y")
EOF
    echo -e "${GREEN}✅ Generated README.md${NC}"
    echo ""

    # Step 4: Validate
    echo -e "${BLUE}Step 4:${NC} Validating structure..."
    ./scripts/docs/validate-sprint-structure.sh "$SPRINT_NAME"

    echo ""
    echo -e "${GREEN}🎉 Migration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review generated README.md and update [Feature Name]"
    echo "2. Add any additional documentation files to the sprint folder"
    echo "3. Update README.md Document Organization table"
    echo "4. Commit changes: git commit -m 'Migrate $SPRINT_NAME to nested structure'"
else
    echo "Would perform these steps:"
    echo "  1. mkdir -p $NESTED_DIR"
    echo "  2. git mv $FLAT_FILE $NESTED_DIR/$FILENAME"
    echo "  3. Generate $NESTED_DIR/README.md"
    echo "  4. Validate structure"
    echo ""
    echo "Run without --dry-run to execute migration"
fi
```

---

## 📋 Script 5: Pre-Commit Hook

### File Path
`/scripts/docs/pre-commit-hook.sh` (template to copy to `.git/hooks/pre-commit`)

### Purpose
Block commits that violate documentation governance rules

### Implementation

```bash
#!/bin/bash
# .git/hooks/pre-commit
#
# Documentation validation pre-commit hook
# Blocks commits that violate documentation governance rules

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "🔍 Running documentation validation checks..."
echo ""

# Only run validation if docs files are being committed
if ! git diff --cached --name-only | grep -q '^docs/'; then
    echo -e "${GREEN}✅ No documentation changes - skipping validation${NC}"
    exit 0
fi

EXIT_CODE=0

# Check 1: Sprint structure
echo "Validating sprint structure..."
if ./scripts/docs/validate-sprint-structure.sh; then
    echo -e "${GREEN}✅ Sprint structure validation passed${NC}"
else
    EXIT_CODE=1
fi
echo ""

# Check 2: README files
echo "Validating README files..."
if ./scripts/docs/validate-readmes.sh; then
    echo -e "${GREEN}✅ README validation passed${NC}"
else
    EXIT_CODE=1
fi
echo ""

# Check 3: Links
echo "Checking documentation links..."
if ./scripts/docs/check-links.sh; then
    echo -e "${GREEN}✅ Link validation passed${NC}"
else
    EXIT_CODE=1
fi
echo ""

# Final result
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ COMMIT BLOCKED: Documentation validation failed${NC}"
    echo ""
    echo "Fix the validation errors above before committing."
    echo "Or use --no-verify to bypass (NOT RECOMMENDED)"
    exit 1
fi

echo -e "${GREEN}✅ All documentation validations passed${NC}"
echo ""
exit 0
```

---

## 🎯 Installation Instructions

### Step 1: Make Scripts Executable

```bash
chmod +x scripts/docs/validate-sprint-structure.sh
chmod +x scripts/docs/validate-readmes.sh
chmod +x scripts/docs/check-links.sh
chmod +x scripts/docs/migrate-sprint.sh
chmod +x scripts/docs/pre-commit-hook.sh
```

### Step 2: Install Pre-Commit Hook

```bash
cp scripts/docs/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Step 3: Test Installation

```bash
# Test sprint structure validation
./scripts/docs/validate-sprint-structure.sh

# Test README validation
./scripts/docs/validate-readmes.sh

# Test link checker
./scripts/docs/check-links.sh

# Verify pre-commit hook
git commit --dry-run
```

---

## 📊 Usage Examples

### Example 1: Migrate Flat Sprint to Nested Structure

```bash
# Preview migration (dry run)
./scripts/docs/migrate-sprint.sh sprint-01 --dry-run

# Execute migration
./scripts/docs/migrate-sprint.sh sprint-01

# Validate result
./scripts/docs/validate-sprint-structure.sh sprint-01
```

### Example 2: Create New Sprint with Proper Structure

```bash
# Generate README template
./scripts/docs/validate-readmes.sh --create sprint-12

# Validate generated README
./scripts/docs/validate-readmes.sh sprint-12
```

### Example 3: Fix Broken Links

```bash
# Check all documentation links
./scripts/docs/check-links.sh

# Check specific file
./scripts/docs/check-links.sh docs/sprints/sprint-11/README.md

# Fix broken links manually based on output
```

---

## 🧪 Testing Checklist

Before deploying scripts, verify:
- [ ] All scripts are executable
- [ ] Exit codes are correct for all scenarios
- [ ] Color output works correctly
- [ ] Error messages are clear and actionable
- [ ] Help messages are complete
- [ ] Dry-run modes work correctly
- [ ] Pre-commit hook blocks invalid commits
- [ ] Pre-commit hook can be bypassed with `--no-verify`
- [ ] Scripts handle edge cases (empty directories, missing files, etc.)
- [ ] Git integration works correctly (git mv, git status, etc.)

---

## 📝 Next Steps

1. **Create `/scripts/docs/` directory**
2. **Implement validation scripts** (copy code from this spec)
3. **Install pre-commit hook**
4. **Test all scripts** with existing sprint documentation
5. **Migrate remaining flat sprints** (Sprint 1, 2, 10)
6. **Document results** in `/docs/quality/validation-report.md`

---

**Status:** 📋 Complete Specification - Ready for Implementation
**Implementation Time Estimate:** 2-3 hours
**Testing Time Estimate:** 1 hour
**Created by:** Claude Code
**Last Updated:** October 18, 2025
