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

SPRINT_NUM=$(echo "$1" | sed -E 's/.*([0-9]+).*/\1/' | grep -E '^[0-9]+$' || echo "")
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

# Find ALL flat sprint files for this sprint number
FLAT_FILES=$(find "$SPRINTS_DIR" -maxdepth 1 -type f -name "$SPRINT_NAME-*.md" -o -name "$SPRINT_NAME.md")

if [ -z "$FLAT_FILES" ]; then
    echo -e "${RED}❌ Error: No flat files found matching pattern: $SPRINTS_DIR/$SPRINT_NAME*.md${NC}"
    exit 1
fi

echo -e "${YELLOW}Found flat files:${NC}"
echo "$FLAT_FILES" | while read file; do
    echo "  - $file"
done
echo ""

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

    # Step 2: Move all files
    echo -e "${BLUE}Step 2:${NC} Moving files..."
    echo "$FLAT_FILES" | while read FLAT_FILE; do
        # Extract filename without sprint prefix
        BASENAME=$(basename "$FLAT_FILE")

        # Remove sprint-XX- or sprint-XX prefix
        FILENAME=$(echo "$BASENAME" | sed "s/^$SPRINT_NAME-//; s/^$SPRINT_NAME\.md$/main.md/")

        echo "  Moving: $BASENAME → $FILENAME"
        git mv "$FLAT_FILE" "$NESTED_DIR/$FILENAME"
    done
    echo -e "${GREEN}✅ All files moved${NC}"
    echo ""

    # Step 3: Generate README
    echo -e "${BLUE}Step 3:${NC} Generating README.md..."

    # Get list of moved files
    FILES_LIST=$(find "$NESTED_DIR" -name "*.md" ! -name "README.md" -exec basename {} \; | sort)

    cat > "$NESTED_DIR/README.md" <<EOF
# Sprint $SPRINT_NUM: [Feature Name]

## 🎯 Quick Start (for AI agents)

**Required Reading (in order):**
EOF

    # Add files to reading order
    echo "$FILES_LIST" | while read file; do
        echo "1. \`$file\` - [Description]" >> "$NESTED_DIR/README.md"
    done

    cat >> "$NESTED_DIR/README.md" <<EOF

## 📚 Document Organization

| Document | Purpose | Status | Lines |
|----------|---------|--------|-------|
EOF

    # Add files to table
    echo "$FILES_LIST" | while read file; do
        LINES=$(wc -l < "$NESTED_DIR/$file" | tr -d ' ')
        echo "| $file | [Description] | ✅ Complete | $LINES |" >> "$NESTED_DIR/README.md"
    done

    cat >> "$NESTED_DIR/README.md" <<EOF

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

    echo -e "${GREEN}🎉 Migration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review generated README.md and update [Feature Name] and [Description] placeholders"
    echo "2. Update document purposes in the table"
    echo "3. Commit changes: git commit -m 'Migrate $SPRINT_NAME to nested structure'"
else
    echo "Would perform these steps:"
    echo "  1. mkdir -p $NESTED_DIR"
    echo "  2. git mv files to $NESTED_DIR"
    echo "  3. Generate $NESTED_DIR/README.md"
    echo ""
    echo "Run without --dry-run to execute migration"
fi
