# Sprint 15: Share Button Testing Checklist

**Feature**: Google Drive Share Button Integration
**Status**: Testing Phase
**Last Updated**: October 22, 2025

---

## 🎯 Testing Overview

This checklist covers comprehensive manual testing for the Share Button feature across:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS Safari, Chrome Android)
- Keyboard accessibility
- Screen reader compatibility
- Error handling and edge cases

**Required Coverage**: 100% of test scenarios must pass before deployment.

---

## 📋 Pre-Testing Setup

### Environment Setup

- [ ] Development server running on `localhost:5173`
- [ ] Google Drive OAuth configured and working
- [ ] Test Google Drive account with appropriate permissions
- [ ] Test document opened in RiteMark editor
- [ ] Browser DevTools console open for error monitoring

### Test Data Preparation

- [ ] Create test document: "Share Button Test Document"
- [ ] Upload test document to Google Drive
- [ ] Note document ID for reference: `_______________`
- [ ] Verify document is accessible via Drive web UI

---

## 🖥️ Desktop Browser Testing

### Chrome Desktop (Primary Browser)

#### Basic Functionality
- [ ] **Share button visible** in top-right header
- [ ] **Share icon** (Share2 from Lucide) renders correctly
- [ ] **Button label** displays "Share" text
- [ ] **Button positioning** next to kebab menu (right side)
- [ ] **Button styling** matches shadcn Button component theme

#### Click Behavior
- [ ] **Click Share button** → Drive ShareClient dialog opens
- [ ] **ShareClient loads** without errors (check console)
- [ ] **Dialog positioning** centered over RiteMark UI
- [ ] **Dialog content** shows correct document name
- [ ] **Close dialog** → ShareClient closes cleanly

#### Permission Options
- [ ] **Viewer role** selectable in ShareClient
- [ ] **Commenter role** selectable in ShareClient
- [ ] **Editor role** selectable in ShareClient
- [ ] **Link sharing toggle** works (on/off)
- [ ] **Copy link button** copies shareable URL

#### Loading States
- [ ] **Loading spinner** shows during ShareClient initialization
- [ ] **Button disabled** while loading
- [ ] **Loading indicator** disappears when dialog opens
- [ ] **Button re-enables** after dialog closes

#### Error Handling
- [ ] **Disconnect network** → Click Share → Error toast appears
- [ ] **Error message** is user-friendly
- [ ] **Button re-enables** after error
- [ ] **Console logs** show detailed error for debugging
- [ ] **Retry logic** works after network restored

---

### Firefox Desktop

#### Basic Functionality
- [ ] Share button visible and clickable
- [ ] ShareClient dialog opens correctly
- [ ] No console errors on button click
- [ ] Dialog styling matches Chrome (no rendering issues)

#### Cross-Browser Compatibility
- [ ] Button hover states work correctly
- [ ] Loading spinner animates smoothly
- [ ] ShareClient iframe loads properly
- [ ] Keyboard focus visible on button

---

### Safari Desktop

#### Basic Functionality
- [ ] Share button visible and clickable
- [ ] ShareClient dialog opens correctly
- [ ] No console errors or warnings
- [ ] Dialog closes cleanly

#### Safari-Specific Issues
- [ ] No third-party cookie blocking errors
- [ ] ShareClient API loads (check for CSP issues)
- [ ] Button click doesn't trigger page zoom
- [ ] Dialog doesn't get blocked by Safari's popup blocker

---

### Edge Desktop

#### Basic Functionality
- [ ] Share button visible and clickable
- [ ] ShareClient dialog opens correctly
- [ ] No console errors
- [ ] Dialog functionality identical to Chrome

---

## 📱 Mobile Testing

### iOS Safari (iPhone/iPad)

#### Basic Functionality
- [ ] Share button visible in mobile header
- [ ] **Button size** minimum 44x44px (Apple HIG requirement)
- [ ] Tap Share button → Redirects to Drive sharing URL
- [ ] **URL format**: `https://drive.google.com/file/{fileId}/edit?usp=sharing`

#### Mobile-Specific Behavior
- [ ] No ShareClient dialog (expected - mobile fallback)
- [ ] Drive web UI opens in new tab/window
- [ ] Can change permissions in Drive web UI
- [ ] Can toggle link sharing in Drive web UI
- [ ] **Back button** returns to RiteMark

#### Touch Interactions
- [ ] Tap target large enough (no mis-taps)
- [ ] No double-tap zoom on button
- [ ] Loading state visible on tap
- [ ] Button doesn't shift layout on tap

#### iOS-Specific Issues
- [ ] No Safari popup blocking
- [ ] No "Open in app?" dialog interference
- [ ] Works in both portrait and landscape
- [ ] Works on iOS 15+ (minimum supported version)

---

### Chrome Android (Smartphone/Tablet)

#### Basic Functionality
- [ ] Share button visible in mobile header
- [ ] **Button size** minimum 48x48dp (Android Material Design)
- [ ] Tap Share button → Redirects to Drive sharing URL
- [ ] Drive app or web UI opens

#### Android-Specific Behavior
- [ ] **Drive app installed**: Opens in Drive app
- [ ] **No Drive app**: Opens in Chrome browser
- [ ] Can change permissions in Drive interface
- [ ] **Back button** returns to RiteMark

#### Touch Interactions
- [ ] Tap ripple effect works (Material Design)
- [ ] Loading state visible on tap
- [ ] No layout shift on tap
- [ ] Works with Android accessibility (TalkBack)

---

## ⌨️ Keyboard Accessibility Testing

### Keyboard Navigation

#### Tab Order
- [ ] **Tab key** focuses Share button (correct order in header)
- [ ] **Focus indicator** visible on Share button
- [ ] **Focus style** meets WCAG 2.1 contrast requirements
- [ ] **Tab away** removes focus cleanly

#### Keyboard Activation
- [ ] **Enter key** on focused button → Opens ShareClient
- [ ] **Space bar** on focused button → Opens ShareClient
- [ ] **Escape key** closes ShareClient dialog (if open)
- [ ] **Tab key** navigates inside ShareClient

### Keyboard Shortcuts
- [ ] **Cmd+Shift+S** (Mac) opens Share dialog
- [ ] **Ctrl+Shift+S** (Windows/Linux) opens Share dialog
- [ ] Keyboard shortcut works when editor has focus
- [ ] Keyboard shortcut shows in tooltip/help menu

---

## 🔊 Screen Reader Testing (WCAG 2.1 AA)

### VoiceOver (macOS)

#### Button Announcement
- [ ] **Button role** announced as "Share, button"
- [ ] **Button state** announced (enabled/disabled)
- [ ] **Loading state** announced when active
- [ ] **Error state** announced when share fails

#### Dialog Accessibility
- [ ] **Dialog opens** → VoiceOver announces dialog title
- [ ] **Focus moves** to ShareClient dialog
- [ ] **Dialog closes** → Focus returns to Share button
- [ ] **Error toast** announced to screen reader

---

### NVDA/JAWS (Windows)

#### Button Announcement
- [ ] Button announced as "Share, button"
- [ ] Disabled state announced correctly
- [ ] Loading state announced during API call
- [ ] Keyboard shortcuts announced in help

---

### TalkBack (Android)

#### Mobile Accessibility
- [ ] Share button announced correctly
- [ ] Tap hint provided ("Double tap to share")
- [ ] Loading state announced
- [ ] Error messages read aloud

---

## 🚫 Error Handling & Edge Cases

### Network Errors

- [ ] **No internet connection** → Error toast: "Unable to open sharing options. Check your connection."
- [ ] **Network timeout** → Error toast after 10 seconds
- [ ] **API rate limit** → Error toast: "Too many requests. Try again later."
- [ ] **Button re-enables** after all errors

### API Errors

- [ ] **ShareClient fails to load** → Fallback to Drive URL
- [ ] **Invalid file ID** → Error toast: "Document not found"
- [ ] **OAuth token expired** → Prompts re-authentication
- [ ] **Insufficient permissions** → Error: "You don't have permission to share this document"

### Edge Cases

#### No File Open
- [ ] **Button disabled** when no document open
- [ ] **Tooltip shows** "Open a document to share" (on hover)
- [ ] **Click does nothing** when disabled
- [ ] **Keyboard activation** blocked when disabled

#### File Not Saved to Drive
- [ ] **New unsaved document** → Share button disabled
- [ ] **Tooltip shows** "Save to Drive first" (on hover)
- [ ] Prompts save before sharing (if applicable)

#### Concurrent Operations
- [ ] **Click Share twice rapidly** → Only one dialog opens
- [ ] **Save operation running** → Share button disabled
- [ ] **Another dialog open** → Share button disabled
- [ ] **Editor busy** → Share button shows loading state

### Browser Compatibility

#### Popup Blockers
- [ ] Safari popup blocker → Fallback to new tab
- [ ] Chrome popup blocker → User notification to allow
- [ ] Firefox popup blocker → Retry logic works

#### Third-Party Cookies
- [ ] **Safari third-party cookie blocking** → ShareClient still works
- [ ] **Brave browser** → ShareClient loads (or fallback to URL)
- [ ] **Firefox strict mode** → No blocking issues

---

## 🎨 Visual & UX Testing

### Button Styling

- [ ] **Hover state** shows background color change
- [ ] **Active state** (click) shows pressed effect
- [ ] **Disabled state** grayed out with reduced opacity
- [ ] **Loading state** shows spinner icon
- [ ] **Focus ring** visible and high contrast

### Responsive Design

#### Desktop (1920x1080)
- [ ] Share button visible in header
- [ ] Button text "Share" displayed
- [ ] Icon and text aligned correctly

#### Tablet (768x1024)
- [ ] Share button visible
- [ ] Button size appropriate for touch
- [ ] Text visible (not truncated)

#### Mobile (375x667)
- [ ] Share button visible
- [ ] Button large enough to tap (44x44px minimum)
- [ ] Icon-only mode if space constrained

### Dark Mode

- [ ] Share button visible in dark theme
- [ ] Icon color contrast sufficient (WCAG AA)
- [ ] Hover state visible in dark mode
- [ ] Loading spinner visible against dark background

---

## 🔒 Security Testing

### OAuth Token Handling

- [ ] **Share button** doesn't expose OAuth token in URL
- [ ] **ShareClient** uses secure token passing
- [ ] **Token refresh** works silently if expired
- [ ] **No token in console logs** (production mode)

### CSP (Content Security Policy)

- [ ] **ShareClient iframe** allowed by CSP headers
- [ ] **Drive API calls** not blocked by CSP
- [ ] **No CSP violations** in browser console

### Permissions

- [ ] **Only file owner** can change sharing settings
- [ ] **Viewer role** cannot access Share button (if applicable)
- [ ] **Editor role** can share document

---

## ⚡ Performance Testing

### Load Time

- [ ] **Share button renders** immediately with page load
- [ ] **ShareClient loads** within 2 seconds (desktop)
- [ ] **Mobile redirect** happens within 500ms
- [ ] **No UI blocking** during ShareClient initialization

### Memory Usage

- [ ] **Open/close Share dialog 10 times** → No memory leak
- [ ] **Browser DevTools memory profiler** shows stable heap size
- [ ] **No zombie event listeners** after dialog closes

---

## 📊 Test Results Summary

### Browser Coverage

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome  | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ |
| Firefox | ☐ Pass / ☐ Fail | N/A | ☐ |
| Safari  | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ |
| Edge    | ☐ Pass / ☐ Fail | N/A | ☐ |

### Accessibility Coverage

| Test Type | Status | Notes |
|-----------|--------|-------|
| Keyboard navigation | ☐ Pass / ☐ Fail | |
| Screen reader (VoiceOver) | ☐ Pass / ☐ Fail | |
| Screen reader (NVDA/JAWS) | ☐ Pass / ☐ Fail | |
| Focus management | ☐ Pass / ☐ Fail | |
| WCAG 2.1 AA compliance | ☐ Pass / ☐ Fail | |

### Error Handling Coverage

| Scenario | Status | Notes |
|----------|--------|-------|
| Network error | ☐ Pass / ☐ Fail | |
| API timeout | ☐ Pass / ☐ Fail | |
| No file open | ☐ Pass / ☐ Fail | |
| OAuth token expired | ☐ Pass / ☐ Fail | |
| ShareClient load failure | ☐ Pass / ☐ Fail | |

---

## ✅ Sign-Off Criteria

**All sections must pass before deployment:**

- [ ] **Desktop browsers**: All 4 browsers pass (Chrome, Firefox, Safari, Edge)
- [ ] **Mobile devices**: iOS Safari and Chrome Android pass
- [ ] **Keyboard accessibility**: 100% pass rate
- [ ] **Screen reader**: VoiceOver and NVDA pass
- [ ] **Error handling**: All 5 error scenarios handled gracefully
- [ ] **Performance**: No memory leaks, <2s load time
- [ ] **Security**: No token leaks, CSP compliant
- [ ] **Visual QA**: Dark mode and responsive design validated

---

## 🐛 Bug Tracking

### Known Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| (None yet) | - | - | - |

### Bugs Found During Testing

**Date**: ___________
**Tester**: ___________

1. **Bug #1**:
   - **Description**:
   - **Steps to reproduce**:
   - **Expected**:
   - **Actual**:
   - **Severity**: Critical / High / Medium / Low

---

## 📝 Testing Notes

### Environment Details

- **OS**: ___________
- **Browser versions**: ___________
- **Test account**: ___________
- **Test document ID**: ___________

### Additional Observations

(Add any notes about unexpected behavior, edge cases discovered, or suggestions for improvement)

---

## 🚀 Deployment Readiness

**Before merging PR:**

1. [ ] All test scenarios passed
2. [ ] No critical bugs remaining
3. [ ] Performance benchmarks met
4. [ ] Accessibility validated
5. [ ] Code review approved
6. [ ] User acceptance testing complete

**Sign-off**: ___________
**Date**: ___________

---

**Sprint 15 Success Criteria**: ✅ Share button fully functional, accessible, and tested across all platforms.
