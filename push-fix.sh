#!/bin/bash
cd /Users/jarmotuisk/Projects/ritemark
git add ritemark-app/src/services/auth/TokenManagerEncrypted.ts
git commit -m "fix(sprint-20): resolve TypeScript null/undefined type mismatch

Fixed TypeScript compilation error - converted undefined to null using ?? operator

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin feature/sprint-20-backend-token-refresh
