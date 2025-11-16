#!/bin/bash

# Modal Testing Script for RiteMark
# Sprint 13 - Manual Testing Helper
# Usage: ./manual-test-script.sh

set -e

echo "🧪 RiteMark Modal Testing Script"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dev server is running
echo -e "${BLUE}[1/7] Checking dev server...${NC}"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server is running on localhost:5173${NC}"
else
    echo -e "${YELLOW}⚠️  Dev server not running. Starting...${NC}"

    # Kill any existing process on port 5173
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true

    # Start dev server in background
    npm run dev > /tmp/ritemark-dev.log 2>&1 &
    SERVER_PID=$!

    echo -e "${BLUE}Waiting for server to start...${NC}"
    sleep 5

    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Dev server started successfully (PID: $SERVER_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start dev server. Check /tmp/ritemark-dev.log${NC}"
        exit 1
    fi
fi

echo ""

# Run TypeScript type check
echo -e "${BLUE}[2/7] Running TypeScript type check...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript errors found. Fix before testing!${NC}"
    exit 1
fi

echo ""

# Check for console errors in running app
echo -e "${BLUE}[3/7] Checking server response...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Server responding with HTTP 200${NC}"
else
    echo -e "${RED}❌ Server error: HTTP $HTTP_CODE${NC}"
    exit 1
fi

echo ""

# Verify critical files exist
echo -e "${BLUE}[4/7] Verifying modal components...${NC}"
COMPONENTS=(
    "src/components/WelcomeScreen.tsx"
    "src/components/auth/AuthModal.tsx"
    "src/components/drive/DriveFilePicker.tsx"
    "src/components/drive/DriveFileBrowser.tsx"
    "src/components/ImageUploader.tsx"
    "src/components/ui/dialog.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        echo -e "${GREEN}✅ Found: $component${NC}"
    else
        echo -e "${RED}❌ Missing: $component${NC}"
        exit 1
    fi
done

echo ""

# Check overlay styling in dialog.tsx
echo -e "${BLUE}[5/7] Verifying overlay styling...${NC}"
if grep -q "bg-black/80" src/components/ui/dialog.tsx; then
    echo -e "${GREEN}✅ Dialog overlay uses bg-black/80${NC}"
else
    echo -e "${RED}❌ Dialog overlay missing black/80 styling!${NC}"
    exit 1
fi

echo ""

# Check z-index hierarchy
echo -e "${BLUE}[6/7] Verifying z-index hierarchy...${NC}"
if grep -q "z-50" src/components/ui/dialog.tsx; then
    echo -e "${GREEN}✅ Dialog uses z-index: 50${NC}"
else
    echo -e "${YELLOW}⚠️  Dialog z-index not verified${NC}"
fi

echo ""

# Print manual testing instructions
echo -e "${BLUE}[7/7] Manual Testing Required${NC}"
echo ""
echo -e "${YELLOW}🚨 IMPORTANT: Automated browser testing unavailable${NC}"
echo -e "${YELLOW}   Please perform manual testing using the checklist:${NC}"
echo ""
echo -e "📋 Test Checklist:"
echo -e "  1. Open http://localhost:5173 in browser"
echo -e "  2. Test WelcomeScreen modal (initial load)"
echo -e "  3. Test AuthModal (click user avatar)"
echo -e "  4. Test DriveFilePicker (open from Drive)"
echo -e "  5. Test DriveFileBrowser (mobile view)"
echo -e "  6. Test ImageUploader (insert image)"
echo -e "  7. Verify table controls hidden behind modals"
echo -e "  8. Check browser console for errors"
echo ""
echo -e "${BLUE}📖 Full testing guide:${NC}"
echo -e "   docs/sprints/sprint-13/modal-testing-report.md"
echo ""
echo -e "${GREEN}✅ Pre-flight checks complete!${NC}"
echo -e "${GREEN}   Ready for manual browser testing at:${NC}"
echo -e "${GREEN}   ${BLUE}http://localhost:5173${NC}"
echo ""

# Open browser automatically (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}🌐 Opening browser...${NC}"
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${BLUE}🌐 Opening browser...${NC}"
    xdg-open http://localhost:5173 2>/dev/null || true
fi

echo ""
echo -e "${YELLOW}📝 After testing, document results in:${NC}"
echo -e "   docs/sprints/sprint-13/modal-testing-report.md"
echo ""
