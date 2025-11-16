# Sprint 26: Client-Side Error Monitoring (MVP)

**Sprint Goal**: Enable AI agents to see browser-side errors through Netlify function logs.

## 🎯 The Problem

**AI Agent Blind Spot**:
```
Browser Console Error → 🚫 AI Agent CANNOT see
User must manually paste error → Slow, error-prone
```

## 💡 The Solution (MVP)

**Route browser errors through Netlify Functions**:
```
Browser Error → errorReporter.ts →
  POST /.netlify/functions/log-client-error →
    Netlify logs → ✅ AI Agent sees via CLI
```

**AI Agent monitors**:
```bash
netlify logs:function log-client-error
```

## 📋 What We're Building

**4 Files, ~35 Lines of Code, 20 Minutes**:

1. **Netlify Function** (10 lines) - Logs errors from browser
2. **Error Reporter** (15 lines) - Sends errors to function
3. **Fix Encryption Error** (1 line) - Trigger auto-cleanup
4. **Add to Catch Blocks** (4 lines) - Wire into existing error handling
5. **Update CLAUDE.md** (5 lines) - Document monitoring commands

## 🚀 Implementation Checklist

- [ ] Create `netlify/functions/log-client-error.ts`
- [ ] Create `ritemark-app/src/utils/errorReporter.ts`
- [ ] Fix `settingsEncryption.ts` error message
- [ ] Add `reportError()` to 2 catch blocks
- [ ] Update CLAUDE.md with monitoring commands
- [ ] Test: Trigger error, check function logs
- [ ] Deploy and validate

## ✅ Success Criteria

**Must Work**:
- ✅ AI agent can see browser errors via `netlify logs:function log-client-error`
- ✅ Errors include: message, context (file.function), timestamp
- ✅ Fire-and-forget (never blocks user)
- ✅ Encryption error triggers auto-cleanup

**Testing**:
```bash
# Monitor logs
netlify logs:function log-client-error

# Trigger decryption error (open settings in different browser)
# Error should appear in logs with context
```

## 📚 Sprint Documents

- `README.md` (this file) - Sprint overview
- `implementation.md` - Code to write (copy-paste ready)

## 🔗 Related Work

**Fixes Issue Discovered in Sprint 26**:
- User reported: "Getting decryption error when opening settings"
- AI agent couldn't see browser console error
- Had to manually ask user for error details

**Related Sprints**:
- Sprint 20: OAuth token management
- Sprint 23: Settings encryption
- Sprint 26 (earlier): Netlify Blobs `connectLambda()` fix

## 🎯 Why MVP?

**Avoid Overengineering**:
- ❌ No error categories (encryption/auth/drive) - just use context
- ❌ No severity levels (high/medium/low) - all errors matter
- ❌ No userId/userAgent fields - not needed for debugging
- ❌ No React Error Boundary - add later if we see component crashes

**Add Later If Needed**:
- 🔮 Error categorization (if we need filtering beyond grep)
- 🔮 User action breadcrumbs (if context isn't enough)
- 🔮 React Error Boundary (if we see component crashes)

## ⏱️ Estimated Time

- Implementation: 15 minutes
- Testing: 5 minutes
- Documentation: 5 minutes
- **Total: 25 minutes**

---

**Next**: Read `implementation.md` for copy-paste ready code.
