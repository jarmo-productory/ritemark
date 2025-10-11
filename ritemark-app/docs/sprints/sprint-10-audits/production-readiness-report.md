# Sprint 10 Production Readiness Report: BubbleMenu Feature

**Date**: October 11, 2025
**Sprint**: Sprint 10 - TipTap BubbleMenu with Bold/Italic/H1/H2/Link
**Status**: ⚠️ GAPS IDENTIFIED - Production deployment blocked pending resolution
**Researcher**: AI Research Agent

---

## Executive Summary

Sprint 10 successfully implemented the core TipTap BubbleMenu feature with text formatting (Bold/Italic/H1/H2) and link management. User validation confirms link adding functionality works as expected. However, this production readiness audit has identified **7 HIGH-SEVERITY gaps** and **12 MEDIUM-SEVERITY risks** that must be addressed before production deployment.

### Critical Findings
1. **ZERO automated tests** for BubbleMenu component
2. **960KB minified bundle** (305KB gzipped) exceeds performance budget
3. **No mobile browser testing** conducted
4. **Memory leak risk** from keyboard event listeners
5. **Known Safari compatibility issues** with BubbleMenu flashing
6. **iOS native popup conflicts** with BubbleMenu
7. **Build errors** in TypeScript (unused variables)

---

## 1. Cross-Browser Compatibility Analysis

### Browser Compatibility Matrix

| Browser | Desktop Status | Mobile Status | Known Issues | Severity |
|---------|---------------|---------------|--------------|----------|
| **Chrome (Desktop)** | ✅ Expected to work | N/A | None found | LOW |
| **Chrome (Android)** | N/A | ⚠️ UNTESTED | Touch interaction untested | MEDIUM |
| **Firefox (Desktop)** | ⚠️ UNTESTED | N/A | TipTap v3 BubbleMenu reported issues | MEDIUM |
| **Safari (Desktop)** | ❌ KNOWN ISSUE | N/A | **BubbleMenu flashes on click** (GitHub #3471) | HIGH |
| **Safari (iOS)** | N/A | ❌ CRITICAL | **Native popup hides BubbleMenu** (GitHub #37) | CRITICAL |
| **Edge (Desktop)** | ⚠️ UNTESTED | N/A | Chromium-based, likely works | LOW |

### Known Issues from Research

#### **Safari Desktop - BubbleMenu Flashing (HIGH)**
- **Source**: GitHub Issue #3471 (TipTap repository)
- **Symptom**: BubbleMenu flashes/disappears when clicking formatting buttons (Bold, Italic, Link)
- **Root Cause**: Tippy.js positioning recalculation on Safari
- **Workaround**: Use `onMouseDown={(e) => e.preventDefault()}` (already implemented ✅)
- **Status**: Implemented preventative fix, but **needs live testing on Safari**

#### **iOS Safari - Native Popup Conflict (CRITICAL)**
- **Source**: GitHub Issue #37 (TipTap repository, 2018)
- **Symptom**: iOS native selection popup (Copy/Paste/Define) overlays BubbleMenu
- **Root Cause**: iOS automatically shows native menu on text selection
- **Impact**: BubbleMenu may be hidden or inaccessible on mobile
- **Status**: **UNTESTED - BLOCKS MOBILE DEPLOYMENT**

#### **TipTap v3 React Integration Issues**
- **Source**: GitHub Issue #6696 (July 2025)
- **Symptom**: BubbleMenu fails in Vue 2, style access errors
- **Impact**: React implementation unaffected, but indicates v3 stability concerns
- **Status**: Monitoring - no direct impact on React

#### **Radix Dialog on iOS - Keyboard Hiding Dialog**
- **Source**: GitHub Issue #2323 (Radix UI)
- **Symptom**: Mobile keyboard can hide the Link dialog when input gains focus
- **Impact**: User cannot see URL input field when keyboard opens
- **Status**: **UNTESTED - REQUIRES MOBILE TESTING**

---

## 2. Performance & Bundle Size Analysis

### Bundle Size Metrics

| Metric | Current Value | Recommended | Status |
|--------|--------------|-------------|--------|
| **JS Bundle (minified)** | 960 KB | < 500 KB | ❌ EXCEEDS by 92% |
| **JS Bundle (gzipped)** | 305 KB | < 200 KB | ⚠️ EXCEEDS by 53% |
| **CSS Bundle** | 40 KB | < 50 KB | ✅ ACCEPTABLE |
| **Total Page Weight** | 345 KB | < 250 KB | ⚠️ EXCEEDS by 38% |

### Performance Concerns

#### **1. Bundle Size Bloat (HIGH SEVERITY)**
```bash
dist/assets/index-BwVciICq.js   981.20 kB │ gzip: 305.11 kB
```

**Vite Warning Triggered**:
```
(!) Some chunks are larger than 500 kB after minification.
Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks
```

**Root Causes**:
- **TipTap Extensions**: StarterKit + CodeBlockLowlight + Link + BubbleMenu (~300 KB)
- **Lowlight Syntax Highlighting**: All common languages loaded (~150 KB)
- **Radix UI Dialog**: Heavy UI primitives (~50 KB)
- **Lucide Icons**: Not tree-shaken properly (~40 KB)
- **marked + turndown**: Markdown parsers (~60 KB)

**Recommendations**:
1. **Dynamic import** TipTap extensions (load on-demand)
2. **Lazy load** CodeBlockLowlight only when user inserts code
3. **Tree-shake** Lucide icons (import only used icons)
4. **Split vendors**: Separate TipTap into own chunk

#### **2. Re-render Performance (MEDIUM SEVERITY)**
```typescript
// Current implementation triggers re-render on every selection change
shouldShow={({ editor, state }) => {
  const { selection } = state
  const { empty } = selection
  if (empty) return false
  return true
}}
```

**Concerns**:
- BubbleMenu visibility check runs on **every** editor state change
- No debouncing implemented (TipTap default: 250ms)
- Rapid selections may cause flickering

**Recommendations**:
- Add `updateDelay` prop to BubbleMenu
- Consider memoization for `shouldShow` function

#### **3. Event Listener Memory Leak Risk (HIGH SEVERITY)**

**Current Implementation**:
```typescript
useEffect(() => {
  if (!editor) return

  const handleKeyDown = (event: KeyboardEvent) => {
    // Keyboard shortcut logic
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [editor])
```

**Risk Analysis**:
- ✅ Cleanup function implemented correctly
- ⚠️ **Dependency array only includes `editor`**
- ❌ If component remounts frequently, listeners may accumulate
- ❌ **No tests verify cleanup actually happens**

**Memory Leak Scenarios**:
1. User switches between multiple documents (editor changes)
2. Fast navigation causes component mount/unmount cycles
3. Editor crashes and re-initializes without cleanup

**Recommendations**:
1. Add integration test to verify listener cleanup
2. Use Chrome DevTools Memory Profiler to check for leaks
3. Consider using `useCallback` for `handleKeyDown` to stabilize reference

---

## 3. Edge Cases & Untested Scenarios

### High-Priority Edge Cases (MUST TEST)

#### **1. Rapid Selection Changes (MEDIUM SEVERITY)**
**Scenario**: User drags selection quickly across multiple paragraphs
**Expected**: BubbleMenu follows selection smoothly
**Risk**: BubbleMenu flickers or gets stuck
**Status**: ❌ UNTESTED

#### **2. Multi-line Selections with Mixed Formatting (HIGH SEVERITY)**
**Scenario**: User selects text with mixed bold, italic, and links
**Expected**: BubbleMenu shows accurate active states
**Risk**: Formatting buttons show incorrect state (e.g., Bold button active when only part of selection is bold)
**Status**: ❌ UNTESTED

#### **3. Nested Formatting (MEDIUM SEVERITY)**
**Scenario**: Apply bold → italic → link to same text
**Expected**: All three formats apply correctly
**Risk**: TipTap mark priority conflicts (e.g., link removes bold)
**Status**: ❌ UNTESTED

#### **4. Very Long URLs (>2000 characters) (LOW SEVERITY)**
**Scenario**: User pastes 3000+ character URL
**Expected**: Input accepts URL, validation passes/fails appropriately
**Risk**: Input field overflow, URL validation error, browser URL length limits
**Status**: ❌ UNTESTED

**Code Analysis**:
```typescript
// No length validation in current implementation
function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  // No max length check!
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}
```

**Recommendation**: Add max length validation (2000 chars per RFC 2616)

#### **5. Special Characters in URLs (MEDIUM SEVERITY)**
**Scenario**: User enters URL with:
- Unicode characters (emoji, non-Latin scripts)
- Unencoded spaces (`example.com/hello world`)
- Special chars (`[]{}|<>`)

**Expected**: URL encoding/validation handles gracefully
**Risk**: URL validation fails incorrectly, or accepts invalid URLs
**Status**: ❌ UNTESTED

**Code Analysis**:
```typescript
function isValidUrl(url: string): boolean {
  try {
    const normalized = normalizeUrl(url)
    const urlObj = new URL(normalized) // Throws on invalid URL
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false // Silent failure - user doesn't know WHY it failed
  }
}
```

**Recommendation**: Improve error messages for specific URL validation failures

#### **6. Links Without TLD (LOW SEVERITY)**
**Scenario**: User enters `localhost`, `file://`, `javascript:`, `data:`
**Expected**: Non-HTTP protocols rejected with clear error
**Risk**: XSS vulnerability if `javascript:` URLs allowed
**Status**: ⚠️ PARTIALLY SAFE (only allows http/https) but **UNTESTED**

**Security Check**:
```typescript
return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' // ✅ Prevents XSS
```

#### **7. BubbleMenu at Viewport Edges (HIGH SEVERITY)**
**Scenario**: User selects text at top/bottom of viewport
**Expected**: BubbleMenu repositions to stay visible (Floating UI handles this)
**Risk**: BubbleMenu cut off or positioned outside viewport
**Status**: ❌ UNTESTED

**Missing Configuration**:
```typescript
// Current implementation has NO tippyOptions configuration
<BubbleMenu editor={editor} shouldShow={...}>
  {/* No placement, flip, or shift options configured */}
</BubbleMenu>
```

**Recommendation**: Add Floating UI positioning options:
```typescript
<BubbleMenu
  editor={editor}
  tippyOptions={{
    placement: 'top',
    popperOptions: {
      modifiers: [
        { name: 'flip', options: { fallbackPlacements: ['bottom', 'top'] } },
        { name: 'preventOverflow', options: { padding: 8 } }
      ]
    }
  }}
>
```

#### **8. Mobile Touch Interactions (CRITICAL SEVERITY)**
**Scenario**: User taps to select text on iOS/Android
**Expected**: BubbleMenu appears after selection
**Risk**: iOS native popup blocks BubbleMenu, touch events not propagated correctly
**Status**: ❌ COMPLETELY UNTESTED

**Touch Interaction Concerns**:
- No `onTouchStart` handlers implemented
- BubbleMenu relies on mouse events (`onMouseDown`)
- iOS long-press to select may not trigger BubbleMenu

---

## 4. User Experience Polish Gaps

### Missing UX Features

#### **1. Loading States (MEDIUM SEVERITY)**
**Current**: No loading indicators when:
- Validating URL
- Saving link changes to TipTap

**Recommendation**: Add spinner or disabled state during async operations

#### **2. Tooltip Positioning Near Edges (HIGH SEVERITY)**
**Current**: No `tippyOptions` configured (see Section 3.7 above)
**Status**: ❌ NOT CONFIGURED

#### **3. Undo/Redo Support (LOW SEVERITY)**
**Current**: TipTap handles undo/redo natively
**Status**: ⚠️ NEEDS VERIFICATION (test Cmd+Z after formatting)

#### **4. Copy/Paste Link Formatting (MEDIUM SEVERITY)**
**Scenario**: User copies text with link, pastes elsewhere
**Expected**: Link formatting preserved
**Status**: ❌ UNTESTED

#### **5. Keyboard Accessibility (MEDIUM SEVERITY)**
**Current Shortcuts**:
- ✅ Bold: Ctrl+B (TipTap native)
- ✅ Italic: Ctrl+I (TipTap native)
- ✅ Link: Cmd+K (custom implementation)

**Missing**:
- ❌ No keyboard navigation within BubbleMenu (Tab between buttons)
- ❌ No ARIA labels for screen readers
- ❌ No focus trap in Link dialog

**Recommendation**: Add accessibility attributes:
```typescript
<button
  aria-label="Bold (Ctrl+B)"
  aria-pressed={editor.isActive('bold')}
  role="button"
  tabIndex={0}
>
```

---

## 5. Documentation Gaps

### User-Facing Documentation (CRITICAL)

#### **Missing User Guide**
- ❌ No documentation on keyboard shortcuts
- ❌ No explanation of link validation rules
- ❌ No mobile usage instructions

**Recommendation**: Create `/docs/user-guide/formatting.md`

### Developer Documentation (HIGH SEVERITY)

#### **Missing Component API Docs**
- ❌ No JSDoc comments in `FormattingBubbleMenu.tsx`
- ❌ No props interface documentation
- ❌ No usage examples

**Recommendation**: Add JSDoc:
```typescript
/**
 * FormattingBubbleMenu - Floating toolbar for text formatting
 *
 * Appears when user selects text, provides quick access to:
 * - Bold/Italic formatting
 * - Heading levels (H1/H2)
 * - Link insertion/editing
 *
 * @param {TipTapEditor | null} editor - TipTap editor instance
 * @returns {JSX.Element} BubbleMenu component
 *
 * @example
 * <FormattingBubbleMenu editor={editor} />
 */
```

### Deployment Documentation (MEDIUM SEVERITY)

#### **Missing Build Configuration Notes**
- ⚠️ No documentation of bundle size concerns
- ⚠️ No guidance on code-splitting strategy
- ❌ No performance monitoring setup

**Recommendation**: Document in `/docs/deployment/performance-optimization.md`

---

## 6. Testing Gaps

### Test Coverage Analysis

| Test Type | Coverage | Status | Priority |
|-----------|----------|--------|----------|
| **Unit Tests** | 0% | ❌ NONE | CRITICAL |
| **Integration Tests** | 0% | ❌ NONE | HIGH |
| **E2E Tests** | 0% | ❌ NONE | MEDIUM |
| **Mobile Tests** | 0% | ❌ NONE | CRITICAL |
| **Accessibility Tests** | 0% | ❌ NONE | MEDIUM |

### Critical Missing Tests

#### **1. BubbleMenu Lifecycle Tests (CRITICAL)**
```typescript
// Required tests:
describe('FormattingBubbleMenu', () => {
  it('should render when text is selected', () => {})
  it('should hide when selection is empty', () => {})
  it('should cleanup event listeners on unmount', () => {})
  it('should not render in code blocks', () => {})
})
```

#### **2. Keyboard Shortcut Tests (HIGH)**
```typescript
describe('Keyboard shortcuts', () => {
  it('should open link dialog on Cmd+K with selection', () => {})
  it('should not open link dialog without selection', () => {})
  it('should handle Cmd+B for bold', () => {})
  it('should handle Cmd+I for italic', () => {})
})
```

#### **3. URL Validation Tests (HIGH)**
```typescript
describe('URL validation', () => {
  it('should auto-add https:// protocol', () => {})
  it('should reject javascript: URLs', () => {})
  it('should reject URLs >2000 chars', () => {})
  it('should handle special characters', () => {})
  it('should accept valid URLs without protocol', () => {})
})
```

#### **4. Mobile Browser Tests (CRITICAL)**
```typescript
describe('Mobile interactions', () => {
  it('should handle touch selection on iOS', () => {})
  it('should position BubbleMenu above iOS native popup', () => {})
  it('should handle keyboard opening in link dialog', () => {})
})
```

#### **5. Memory Leak Tests (HIGH)**
```typescript
describe('Memory management', () => {
  it('should remove event listeners on unmount', () => {})
  it('should not accumulate listeners on editor change', () => {})
  it('should cleanup Radix Dialog portal on close', () => {})
})
```

---

## 7. Build & Type Safety Issues

### TypeScript Errors (MEDIUM SEVERITY)

**Current Build Output**:
```
src/App.tsx(17,9): error TS6133: 'isAuthenticated' is declared but its value is never read.
src/hooks/useDriveSync.ts(200,52): error TS6133: 'error' is declared but its value is never read.
```

**Status**: ❌ Build fails with `npm run build`
**Impact**: Cannot create production build
**Severity**: MEDIUM (easy fix, but blocks deployment)

**Fix Required**:
```typescript
// src/App.tsx - Remove unused variable
const authContext = useContext(AuthContext)
// Remove: const isAuthenticated = authContext?.isAuthenticated ?? false

// src/hooks/useDriveSync.ts - Use error or remove
// Option 1: Log error
} catch (error) {
  console.error('Drive sync error:', error)
}
// Option 2: Rename to _error to indicate intentionally unused
} catch (_error) {
  // Error intentionally ignored
}
```

---

## Risk Matrix

| Risk Category | Severity | Impact | Likelihood | Mitigation Priority |
|---------------|----------|--------|------------|---------------------|
| **Zero automated tests** | CRITICAL | High | Certain | P0 - IMMEDIATE |
| **iOS native popup conflict** | CRITICAL | High | High | P0 - IMMEDIATE |
| **960KB bundle size** | HIGH | High | Certain | P1 - URGENT |
| **Safari BubbleMenu flashing** | HIGH | Medium | Medium | P1 - URGENT |
| **Memory leak from listeners** | HIGH | Medium | Medium | P1 - URGENT |
| **BubbleMenu positioning at edges** | HIGH | Medium | High | P1 - URGENT |
| **TypeScript build errors** | MEDIUM | High | Certain | P2 - SOON |
| **Radix Dialog keyboard hiding** | MEDIUM | Medium | Medium | P2 - SOON |
| **URL validation edge cases** | MEDIUM | Low | Medium | P3 - NORMAL |
| **Accessibility gaps** | MEDIUM | Low | High | P3 - NORMAL |
| **Copy/paste link preservation** | LOW | Low | Low | P4 - BACKLOG |

---

## Recommended Actions Before Production

### P0 - IMMEDIATE (Block Deployment)

1. ✅ **Fix TypeScript build errors**
   - Remove unused `isAuthenticated` variable in `App.tsx`
   - Handle or suppress `error` variable in `useDriveSync.ts`
   - **Effort**: 5 minutes
   - **Owner**: Coder agent

2. ❌ **Add critical unit tests**
   - BubbleMenu lifecycle (mount/unmount/selection changes)
   - Keyboard shortcuts (Cmd+K, Cmd+B, Cmd+I)
   - URL validation (protocol, length, special chars)
   - Event listener cleanup
   - **Effort**: 4 hours
   - **Owner**: Tester agent

3. ❌ **Test on iOS Safari (real device)**
   - Verify BubbleMenu doesn't conflict with native popup
   - Test link dialog keyboard behavior
   - Verify touch selection triggers BubbleMenu
   - **Effort**: 2 hours
   - **Owner**: QA agent + Manual testing

### P1 - URGENT (Production Risk)

4. ❌ **Reduce bundle size below 500KB**
   - Dynamic import TipTap extensions
   - Lazy load CodeBlockLowlight
   - Tree-shake Lucide icons
   - Split vendor chunks
   - **Effort**: 6 hours
   - **Owner**: Performance optimizer agent

5. ❌ **Test Safari desktop**
   - Verify BubbleMenu doesn't flash on click
   - Test all formatting buttons
   - Verify link dialog behavior
   - **Effort**: 1 hour
   - **Owner**: QA agent

6. ❌ **Configure BubbleMenu positioning**
   - Add `tippyOptions` with `flip` and `preventOverflow` modifiers
   - Test positioning at viewport edges
   - **Effort**: 1 hour
   - **Owner**: Coder agent

7. ❌ **Add memory leak integration test**
   - Verify event listeners cleaned up on unmount
   - Test rapid editor changes don't accumulate listeners
   - Use Chrome DevTools Memory Profiler
   - **Effort**: 2 hours
   - **Owner**: Tester agent

### P2 - SOON (UX Gaps)

8. ❌ **Add accessibility attributes**
   - ARIA labels for all BubbleMenu buttons
   - Keyboard navigation (Tab between buttons)
   - Focus trap in Link dialog
   - Screen reader testing
   - **Effort**: 3 hours
   - **Owner**: Accessibility specialist

9. ❌ **Document keyboard shortcuts**
   - Create user guide with shortcut reference
   - Add tooltip hints in UI
   - **Effort**: 1 hour
   - **Owner**: Documentation agent

10. ❌ **Test mobile browsers (Android)**
    - Chrome Android touch interactions
    - BubbleMenu positioning on small screens
    - **Effort**: 1 hour
    - **Owner**: QA agent

### P3 - NORMAL (Polish)

11. ❌ **Add JSDoc documentation**
    - Document FormattingBubbleMenu API
    - Add usage examples
    - **Effort**: 1 hour
    - **Owner**: Documentation agent

12. ❌ **Test edge cases**
    - Very long URLs (>2000 chars)
    - Special characters in URLs
    - Mixed formatting selections
    - Copy/paste link preservation
    - **Effort**: 2 hours
    - **Owner**: Tester agent

---

## Deployment Readiness Checklist

### Code Quality
- [ ] TypeScript compilation passes without errors
- [ ] ESLint passes without warnings
- [ ] No console.error or console.warn in production build
- [ ] All TODO comments resolved or documented

### Testing
- [ ] Unit tests for FormattingBubbleMenu (80%+ coverage)
- [ ] Integration tests for keyboard shortcuts
- [ ] E2E tests for full formatting workflow
- [ ] Mobile browser testing (iOS + Android)
- [ ] Memory leak validation

### Performance
- [ ] Bundle size < 500 KB (minified)
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.0s
- [ ] No memory leaks detected

### Browser Compatibility
- [ ] Chrome Desktop ✅
- [ ] Chrome Android ❌
- [ ] Firefox Desktop ❌
- [ ] Safari Desktop ❌
- [ ] Safari iOS ❌
- [ ] Edge Desktop ❌

### Documentation
- [ ] User guide for formatting features
- [ ] Developer API documentation
- [ ] Deployment/build instructions
- [ ] Known issues documented

### Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [ ] Color contrast validation

---

## Conclusion

**Current Status**: ⚠️ **NOT READY FOR PRODUCTION**

Sprint 10 delivered a functional BubbleMenu feature with solid core implementation. However, **zero testing coverage** and **critical browser compatibility risks** make production deployment premature.

**Estimated Effort to Production Ready**: **22-25 hours**
- P0 work: 6 hours
- P1 work: 10 hours
- P2 work: 5 hours
- P3 work: 3 hours

**Recommended Next Steps**:
1. Fix TypeScript errors (5 min)
2. Deploy test coverage (4 hours)
3. Test on Safari + iOS (3 hours)
4. Optimize bundle size (6 hours)
5. Add accessibility (3 hours)

**Alternative**: If mobile deployment is not immediate priority, can deploy **desktop-only** after completing P0 + P1 Safari testing (estimated 10 hours).

---

## Appendix: Research Sources

### Search Queries Executed
1. "TipTap BubbleMenu production issues 2025 mobile browser compatibility"
2. "Radix Dialog floating UI positioning issues mobile iOS Safari"
3. "@tiptap/extension-bubble-menu memory leak event listener cleanup 2025"
4. "@tiptap/react BubbleMenu Safari iOS selection flicker rapid selection 2025"

### GitHub Issues Referenced
- TipTap #3471 - Bubble Menu flashes in Safari on click
- TipTap #37 - iOS testing concerns
- TipTap #6696 - BubbleMenu doesn't work in Vue 2 (v3 stability concern)
- TipTap #6634 - BubbleMenu shouldShow prop required
- Radix UI #2323 - Dialog keyboard hide on mobile
- Radix UI #3078 - Height jumps in iOS Safari

### Files Analyzed
- `/src/components/FormattingBubbleMenu.tsx` (255 lines)
- `/src/components/Editor.tsx` (385 lines)
- `/src/App.tsx` (150 lines)
- `/package.json` (dependency analysis)
- `/docs/sprints/sprint-09-postmortem.md` (lessons learned)

### Tools Used
- Vite bundle analyzer (981 KB bundle identified)
- TypeScript compiler (2 errors found)
- npm dependency tree analysis
- Web search (10+ sources)

---

**Report Generated**: October 11, 2025
**Next Review**: After P0/P1 fixes completed
