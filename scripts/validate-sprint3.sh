#!/bin/bash

# Sprint 3 TextEditor Component - Comprehensive Validation Script
# Quality Validator - Automated validation suite

set -e

echo "🔍 Starting Sprint 3 TextEditor Component Validation..."
echo "=================================================="

cd "$(dirname "$0")/../ritemark-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation results tracking
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0

# Function to log results
log_result() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $message"
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $message"
            ((VALIDATION_ERRORS++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $message"
            ((VALIDATION_WARNINGS++))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC}: $message"
            ;;
    esac
}

# Check if TextEditor component exists
echo -e "\n${BLUE}1. Checking TextEditor Component Implementation...${NC}"
if [ -f "src/components/TextEditor.tsx" ] || [ -f "src/components/ui/TextEditor.tsx" ] || [ -f "src/components/TextEditor/index.tsx" ]; then
    log_result "PASS" "TextEditor component file found"
else
    log_result "FAIL" "TextEditor component not found - Implementation Coder hasn't completed Sprint 3"
    echo "Expected locations: src/components/TextEditor.tsx, src/components/ui/TextEditor.tsx, or src/components/TextEditor/index.tsx"
    exit 1
fi

# TypeScript Compilation Check
echo -e "\n${BLUE}2. TypeScript Compilation Validation...${NC}"
if npm run type-check > /dev/null 2>&1; then
    log_result "PASS" "TypeScript compilation successful"
else
    log_result "FAIL" "TypeScript compilation errors found"
    npm run type-check
fi

# ESLint Validation
echo -e "\n${BLUE}3. ESLint Code Quality Check...${NC}"
if npm run lint > /dev/null 2>&1; then
    log_result "PASS" "ESLint validation passed"
else
    log_result "FAIL" "ESLint violations found"
    npm run lint
fi

# Prettier Format Check
echo -e "\n${BLUE}4. Code Formatting Validation...${NC}"
if npm run format:check > /dev/null 2>&1; then
    log_result "PASS" "Code formatting is consistent"
else
    log_result "WARN" "Code formatting inconsistencies found"
    npm run format:check
fi

# Unit Tests Execution
echo -e "\n${BLUE}5. Unit Tests Execution...${NC}"
if npm run test:run > /dev/null 2>&1; then
    log_result "PASS" "All unit tests passed"
else
    log_result "FAIL" "Unit test failures detected"
    npm run test:run
fi

# Build Process Validation
echo -e "\n${BLUE}6. Build Process Validation...${NC}"
if npm run build > /dev/null 2>&1; then
    log_result "PASS" "Build process completed successfully"

    # Check bundle size
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1 2>/dev/null || echo "Unknown")
    log_result "INFO" "Build size: $BUILD_SIZE"
else
    log_result "FAIL" "Build process failed"
    npm run build
fi

# Component Integration Check
echo -e "\n${BLUE}7. Component Integration Validation...${NC}"
if grep -q "TextEditor" src/App.tsx; then
    log_result "PASS" "TextEditor component integrated into App.tsx"
else
    log_result "WARN" "TextEditor component not found in App.tsx - may need integration"
fi

# Mobile Responsiveness Check (Basic)
echo -e "\n${BLUE}8. Mobile Responsiveness Validation...${NC}"
# Check for responsive CSS classes or media queries
if grep -rq "responsive\|mobile\|tablet\|desktop\|sm:\|md:\|lg:\|xl:" src/components/ 2>/dev/null; then
    log_result "PASS" "Responsive design patterns detected"
else
    log_result "WARN" "Limited responsive design patterns found"
fi

# Accessibility Check (Basic)
echo -e "\n${BLUE}9. Accessibility Validation...${NC}"
# Check for accessibility attributes
if grep -rq "aria-\|role=\|tabindex\|alt=" src/components/ 2>/dev/null; then
    log_result "PASS" "Accessibility attributes detected"
else
    log_result "WARN" "Limited accessibility attributes found"
fi

# Check for textarea element (core requirement)
echo -e "\n${BLUE}10. Core Functionality Validation...${NC}"
if grep -rq "textarea\|<textarea" src/components/ 2>/dev/null; then
    log_result "PASS" "Textarea element found in components"
else
    log_result "FAIL" "Textarea element not found - core requirement missing"
fi

# Generate Summary Report
echo -e "\n${BLUE}=================================================="
echo "Sprint 3 TextEditor Component - Validation Summary"
echo "==================================================${NC}"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 VALIDATION PASSED${NC}"
    echo "   No critical issues found"

    if [ $VALIDATION_WARNINGS -eq 0 ]; then
        echo -e "${GREEN}   Perfect score - No warnings${NC}"
        OVERALL_STATUS="EXCELLENT"
    else
        echo -e "${YELLOW}   $VALIDATION_WARNINGS warnings found${NC}"
        OVERALL_STATUS="GOOD"
    fi
else
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo "   $VALIDATION_ERRORS critical issues found"
    echo "   $VALIDATION_WARNINGS warnings found"
    OVERALL_STATUS="FAILED"
fi

# Save results to file
REPORT_FILE="../docs/sprint3-validation-report.md"
cat > "$REPORT_FILE" << EOF
# Sprint 3 TextEditor Component - Validation Report

**Date**: $(date)
**Validator**: Quality Validator Agent
**Overall Status**: $OVERALL_STATUS

## Summary
- Critical Issues: $VALIDATION_ERRORS
- Warnings: $VALIDATION_WARNINGS
- Overall Status: $OVERALL_STATUS

## Validation Results

### ✅ Passed Checks
$(grep "✅ PASS" <<< "$LOG_OUTPUT" || echo "None")

### ❌ Failed Checks
$(grep "❌ FAIL" <<< "$LOG_OUTPUT" || echo "None")

### ⚠️ Warnings
$(grep "⚠️ WARN" <<< "$LOG_OUTPUT" || echo "None")

## Recommendations

Based on the validation results, here are the recommended actions:

1. Address all critical issues (❌ FAIL) before Sprint completion
2. Review and resolve warnings (⚠️ WARN) for optimal quality
3. Ensure TextEditor component meets all Sprint 3 requirements
4. Verify mobile responsiveness across all breakpoints
5. Complete accessibility testing with screen readers
6. Perform manual user experience validation

## Sprint 3 Success Criteria

- [ ] TextEditor component implemented and functional
- [ ] Mobile responsive design across all breakpoints
- [ ] Accessibility features properly implemented
- [ ] TypeScript compilation without errors
- [ ] Professional, non-intimidating user interface
- [ ] Ultra-small scope maintained (no feature creep)

## Approval Status

EOF

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo "✅ **APPROVED** - Sprint 3 ready for completion" >> "$REPORT_FILE"
    exit 0
else
    echo "❌ **REQUIRES FIXES** - Critical issues must be resolved" >> "$REPORT_FILE"
    exit 1
fi