#!/bin/bash
# DRY Violation Detection Script
# User tool to manually check for architectural duplications
# NOT automated - run manually when you suspect duplication issues

echo "🔍 DRY Violation Scanner (User Tool)"
echo "===================================="
echo "Purpose: Help find architectural duplications"
echo "Run this manually when you suspect code duplication"
echo ""

# 1. Find deprecated tokenManager imports
echo "1️⃣ Checking for DEPRECATED tokenManager imports..."
TOKENMANAGER_COUNT=$(grep -r "from.*['\"].*tokenManager['\"]" ritemark-app/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "tokenManagerEncrypted" | grep -v "userIdentityManager" | wc -l | xargs)
if [ "$TOKENMANAGER_COUNT" -gt 0 ]; then
  echo "   ⚠️  Found $TOKENMANAGER_COUNT files using OLD tokenManager:"
  grep -r "from.*['\"].*tokenManager['\"]" ritemark-app/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "tokenManagerEncrypted" | grep -v "userIdentityManager" | sed 's/^/      /'
else
  echo "   ✅ No deprecated tokenManager imports"
fi
echo ""

# 2. Find files with similar names (potential duplicates)
echo "2️⃣ Checking for files with similar names..."
echo "   Searching services directory for potential duplicates..."
find ritemark-app/src/services -name "*.ts" ! -name "*.test.ts" -exec basename {} \; 2>/dev/null | sort | while read -r file; do
  base=$(echo "$file" | sed 's/\.[^.]*$//')
  count=$(find ritemark-app/src/services -name "*${base}*" ! -name "*.test.ts" 2>/dev/null | wc -l | xargs)
  if [ "$count" -gt 1 ]; then
    echo "   ⚠️  Multiple files matching '$base':"
    find ritemark-app/src/services -name "*${base}*" ! -name "*.test.ts" 2>/dev/null | sed 's/^/      /'
  fi
done | head -20
echo ""

# 3. Check for TODO migration comments
echo "3️⃣ Checking for TODO migration comments..."
TODO_COUNT=$(grep -r "TODO.*migrate" ritemark-app/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "   ⚠️  Found $TODO_COUNT TODO migration comments:"
  grep -r "TODO.*migrate" ritemark-app/src --include="*.ts" --include="*.tsx" 2>/dev/null | head -10 | sed 's/^/      /'
else
  echo "   ✅ No TODO migration comments"
fi
echo ""

# 4. Summary
echo "===================================="
echo "📊 Summary:"
echo "   - Deprecated tokenManager: $TOKENMANAGER_COUNT files"
echo "   - TODO migrations: $TODO_COUNT comments"
echo ""
echo "💡 What to do:"
echo "   - Review findings above"
echo "   - Decide if cleanup is needed"
echo "   - See: docs/architecture/DRY-AUDIT-SPRINT-26.md"
echo "===================================="
