# RiteMark Project Roadmap

## 🎯 Mission
**"Google Docs for Markdown"** - WYSIWYG editor for AI-native non-technical users who need visual editing with cloud collaboration and markdown output.

## 🎯 Strategic Vision
Bridge the gap between technical markdown editors (too complex) and collaborative document editors (wrong output format) for content creators, marketing teams, and AI-native professionals.

## 📊 Major Milestones

### 🎯 Milestone 1: Visual Editor (Sprint 3-6) - ✅ COMPLETED
**Goal**: Working WYSIWYG markdown editor with document navigation
**Success**: ✅ Users edit visually, never see markdown syntax + seamless TOC navigation
**Progress**: ✅ Sprint 5 achieved complete visual editing experience with production-ready TOC

### 🎯 Milestone 2: Cloud Storage & Invisible Interface UX (Sprint 7-12) - 🚧 IN PROGRESS
**Goal**: Perfect single-user cloud experience with Johnny Ive invisible interface
**Success**: Users write seamlessly with Google Drive storage, zero UI clutter
**Progress**:
- ✅ Sprints 7-8: OAuth + Drive integration complete
- 🎯 Sprint 9: UX consolidation (fix 3-location UI problem)
- 🎯 Sprint 10: In-context formatting menu
- 🎯 Sprint 11-12: Enhanced operations & keyboard shortcuts

### 🎯 Milestone 3: AI Integration (Sprint 13-18)
**Goal**: Native AI writing assistance
**Success**: AI-powered content creation integrated naturally

### 🎯 Milestone 4: Platform Scale (Sprint 19+)
**Goal**: Enterprise features and marketplace readiness
**Success**: Self-sustaining platform with 10K+ users

## 🚀 AI Agentic Sprint Plan
**CRITICAL**: Each sprint = 1 PR maximum. Very small incremental steps for AI development team.

### ✅ Completed Sprints
- **Sprint 1-8**: Foundation, OAuth, Drive integration ✅ COMPLETED
- **Sprint 9-12**: UX enhancements, formatting, tables, images ✅ COMPLETED
- **Sprint 13**: Modal consolidation & accessibility ✅ COMPLETED
- **Sprint 14**: Landing page with SEO optimization ✅ COMPLETED (Oct 22, 2025)
- **Sprint 15**: Share button & state management fix ✅ COMPLETED (Oct 23, 2025)
- **Sprint 16**: Offline status indicator ✅ COMPLETED (Oct 25, 2025)
- **Sprint 17**: Version history & restore functionality ✅ COMPLETED (Oct 26, 2025)
- **Sprint 19**: OAuth security upgrade (user identity + drive.appdata) 🔄 READY FOR PR (Oct 30, 2025)

### 🎯 Sprint 4 Achievements Summary
✅ **Major Breakthrough**: True WYSIWYG markdown editing experience achieved
- ✅ TipTap editor with invisible interface (no chrome, pure focus)
- ✅ All 6 heading levels working with # shortcuts
- ✅ Auto-linking URLs (www.apple.com becomes clickable)
- ✅ Natural bullet point navigation with Enter key behavior
- ✅ Bold/italic formatting with keyboard shortcuts
- ✅ Mobile-responsive design maintained
- ✅ Production-ready codebase with comprehensive cleanup

### 🎯 Sprint 5 Achievements Summary
✅ **Revolutionary TOC Navigation**: Production-ready Table of Contents with ProseMirror state-based navigation
- ✅ Johnny Ive invisible interface - appears gracefully only when headings exist
- ✅ Google-style active heading detection ("topmost visible + look north" algorithm)
- ✅ Revolutionary ProseMirror state-based scroll system solving TipTap DOM timing issues
- ✅ Perfect scroll positioning with 10px offset for precise navigation
- ✅ Responsive design: fixed sidebar on desktop, overlay on mobile
- ✅ Event-driven architecture with useCallback optimization
- ✅ TypeScript 100% compliant with zero lint errors
- ✅ **MILESTONE 1 COMPLETED**: Core visual editing experience ready

### 🎯 Sprint 6 Achievements Summary
✅ **Enhanced Formatting**: Code blocks, ordered lists, and improved text selection
- ✅ Code block support with syntax highlighting readiness
- ✅ Ordered list functionality with proper nesting
- ✅ Enhanced text selection and cursor behavior
- ✅ TypeScript 100% compliant with zero errors

### 🎯 Sprint 7 Achievements Summary
✅ **Single-Popup OAuth Flow**: Invisible interface authentication with combined scopes
- ✅ **Removed dual OAuth popup** - Applied Johnny Ive "invisible interface" philosophy
- ✅ **Combined scopes** - `openid email profile https://www.googleapis.com/auth/drive.file` in single flow
- ✅ **Pure Google Identity Services** - Removed @react-oauth/google dependency
- ✅ **Bundle optimization** - 741KB → 590KB (20% smaller)
- ✅ **UX improvement** - 3 clicks → 2 clicks, 2 popups → 1 popup (40% faster)
- ✅ **Security compliance** - 2025 OAuth 2.0 standards with PKCE
- ✅ **CSP headers** - Updated for Google OAuth popup compatibility
- ✅ **Production deployment** - Live at https://ritemark.netlify.app
- ✅ **Privacy Policy** - Created `/privacy.html` for OAuth publishing
- ✅ **Terms of Service** - Created `/terms.html` for production use
- ✅ **Documentation** - Comprehensive OAuth flow, security audit, and troubleshooting guides
- ✅ **Foundation complete for Sprint 8 Google Drive integration**

### 🎯 Sprint 8 Achievements Summary
✅ **Complete Google Drive Integration**: Full file lifecycle with WYSIWYG markdown editing
- ✅ **Google Drive OAuth2 authentication** - Browser-based OAuth with `drive.file` scope
- ✅ **Responsive file picker** - Google Picker API (desktop) + custom browser (mobile)
- ✅ **WYSIWYG markdown editor** - TipTap with bidirectional markdown ↔ HTML conversion
- ✅ **Auto-save functionality** - 3s debounce with exponential backoff error handling
- ✅ **IndexedDB caching** - Offline support with local file persistence
- ✅ **Mobile-first PWA** - iOS Safari compatible with responsive design
- ✅ **Codex review approved** - No findings, production-ready code
- ✅ **Bundle size** - 824KB (gzipped: 254KB) within budget
- ✅ **14 research documents** - Architecture diagrams, API docs, integration guides
- ✅ **MILESTONE 2 FOUNDATION COMPLETE**: Core cloud collaboration infrastructure ready

### ✅ Completed Sprints (9-13)

#### **Sprint 9-12**: UX Consolidation & Enhanced Features ✅ COMPLETED
- Sprint 9: UX consolidation (deferred to Sprint 13) ✅
- Sprint 10: In-context formatting menu ✅
- Sprint 11: Table support with overlay controls ✅
- Sprint 12: Image upload to Google Drive ✅

#### **Sprint 13**: Modal/Overlay Consolidation ✅ COMPLETED
**Goal**: Fix UI/UX inconsistencies - consolidate all modals to shadcn Dialog
**Problem Solved**:
- 5 different modal implementations with inconsistent styling
- Z-index chaos (table controls appearing above modals)
- White scrim vs black scrim inconsistency
- Missing accessibility features

**Output**: 1 PR with unified modal system
**Success Criteria**: ✅ ALL MET
- ✅ All modals use shadcn Dialog component
- ✅ 100% consistent black/80 overlay
- ✅ 972+ lines of inline CSS removed
- ✅ Full WCAG 2.1 AA accessibility
- ✅ Table controls z-index bug fixed
- ✅ Zero TypeScript errors
- ✅ Zero breaking changes

**Key Achievements**:
- 4 components refactored in parallel using claude-flow swarm
- AuthModal: 459 → 227 lines (50% reduction)
- DriveFileBrowser: 451 → 182 lines (60% reduction)
- Code quality: 9.2/10 (Excellent)
- Ready for production deployment

**Date Completed**: October 20, 2025

---

#### **Sprint 14**: Landing Page Implementation ✅ COMPLETED
**Goal**: Professional marketing infrastructure for SEO and user acquisition
**Timeline**: 1 day (October 21-22, 2025)

**Key Achievements**:
- ✅ **Static landing page** - Professional hero, 5 feature cards, FAQ section
- ✅ **SEO optimization** - Meta tags, sitemap.xml, robots.txt, schema.org markup
- ✅ **Performance** - <1s FCP, >95 Lighthouse score, WebP images
- ✅ **Full user flow** - Landing → app → OAuth → editor working seamlessly
- ✅ **Mobile-responsive** - Works across all devices and screen sizes
- ✅ **Netlify deployment** - Production-ready with proper routing
- ✅ **60+ pages research** - Comprehensive competitor analysis and UX design

**Technical Stack**:
- Static HTML/CSS/JS (no build step for landing page)
- Vanilla JavaScript for interactive FAQ accordion
- WebP image optimization (81KB screenshot)
- Semantic HTML for accessibility

**Merge**: October 22, 2025 (commit: db8da7c)
**See**: `/docs/sprints/sprint-14/` for complete documentation

---

#### **Sprint 15**: Share Button & State Management Fix ✅ COMPLETED
**Goal**: Google Drive sharing integration with critical bug fixes
**Timeline**: 1 day (October 22-23, 2025)

**Key Achievements**:
- ✅ **Share button** - Opens file in Google Drive for native sharing UI
- ✅ **Simplified approach** - URL-based sharing (no complex ShareClient API)
- ✅ **Popup blocker fix** - Static import keeps `window.open()` synchronous
- ✅ **TOC scroll fix** - Check state before changing state (prevents race conditions)
- ✅ **Universal principle** - "If you're already there, don't go there again"

**Critical Bug Fixes**:
1. **Share button popup blocker** (High severity)
   - Problem: `await import()` broke user activation context
   - Fix: Changed to static import, keeping `window.open()` synchronous

2. **TOC scroll state management** (Major severity)
   - Problem: `window.scrollTo()` called even when already at target position
   - Fix: 5-line state check eliminated race conditions and scroll interference
   - Learning: Always verify current state before modifying it (documented in `/CLAUDE.md`)

**Impact**:
- Share button works reliably across all browsers
- TOC navigation handles repeated clicks gracefully
- State management principle added to project instructions for all future work

**Merge**: October 23, 2025 (commit: 8eccc1a)
**See**: `/docs/sprints/sprint-15/` for complete documentation

---

#### **Sprint 16**: Offline Status Indicator ✅ COMPLETED
**Goal**: Real-time network connectivity feedback for users
**Timeline**: 1 day (October 24-25, 2025)

**Key Achievements**:
- ✅ **Network status detection** - Real-time online/offline detection with Google connectivity check
- ✅ **Visual indicator** - Color-coded status in header (green/red/orange/blue)
- ✅ **Accessibility** - `role="status"` and `aria-live="polite"` for screen readers
- ✅ **UX polish** - Share button disabled when offline with helpful tooltip
- ✅ **Production-ready** - Zero TypeScript errors, successful build

**Technical Implementation**:
- `useNetworkStatus` hook with exponential backoff retry (1s → 2s → 4s → 8s → 16s)
- Idempotent state management (Sprint 15 lesson applied)
- Mobile-responsive design with `hidden sm:inline` text
- Toast notifications for state transitions

**Codex Review**:
- Addressed legitimate dead code issues (removed unused refs/options)
- Rejected false alarm (NodeJS.Timeout works perfectly)
- Added UX improvements (offline Share button disable + accessibility)

**Merge**: October 25, 2025 (commit: 346001e)
**See**: `/docs/sprints/sprint-16/` for complete documentation

---

#### **Sprint 17**: Version History Feature ✅ COMPLETED
**Goal**: Complete Google Drive revision history with restore capability
**Timeline**: 2 days (October 25-26, 2025)
**Merge**: October 26, 2025 (commit: 95860e8)

**Core Features**:
- ✅ **Version History Modal** - Display Google Drive revision history with metadata
- ✅ **Restore Previous Versions** - Restore any revision with confirmation dialog
- ✅ **Revision Preview** - View file metadata (modified time, file size)
- ✅ **Keyboard shortcut** - ⌘⇧H to open version history
- ✅ **Progress Feedback** - Toast notifications for user feedback

**Bug Fixes**:
- ✅ **Restore button callback chain** - Fixed DocumentMenu → VersionHistoryModal prop passing
- ✅ **Context preservation** - Replaced `window.location.reload()` with proper state update
- ✅ **Version sort order** - Newest versions appear first (descending by modifiedTime)
- ✅ **Table HTML export** - Fixed TipTap table conversion to GFM markdown format

**Auth Flow Improvements**:
- ✅ **Token expiration detection** - 5-minute periodic validation checks
- ✅ **Unified AuthModal** - Single auth dialog for all scenarios (no more native popups)
- ✅ **Imperative auth triggering** - API errors can trigger re-authentication
- ✅ **Removed AuthErrorDialog** - Consolidated to single auth component

**Technical Implementation**:
- Google Drive Revisions API v3 integration
- React callback propagation (App → AppShell → DocumentMenu → VersionHistoryModal)
- DOM preprocessing for table HTML before Turndown conversion
- TypeScript 100% compliant with zero errors
- 22 files changed: 2,787 additions, 366 deletions

**Merge**: October 26, 2025 (commit: 8772a2e)
**PR**: #9 - Sprint 17: Version History Feature
**See**: `/docs/sprints/sprint-17/` for complete documentation

---

#### **Sprint 18**: Export Features (DEFERRED)
**Goal**: Copy to Clipboard & Word Export from DocumentMenu
**Status**: 📋 Deferred - Sprint 19 took priority

**Note**: Sprint 18 documentation complete but implementation deferred to prioritize Sprint 19 OAuth security upgrade

#### **Sprint 19**: OAuth Security Upgrade 🔄 READY FOR PR
**Goal**: User identity extraction + drive.appdata scope for cross-device sync
**Timeline**: 1 day (October 30, 2025)
**Status**: 🔄 **READY FOR PR** - Code Cleanup Complete
**Decision**: Backend token refresh moved to Sprint 20
**PR Status**: Awaiting user approval

**Critical Achievements**:
1. ✅ **User Identity Extraction** - `user.sub` from Google v1 endpoint (stable cross-device ID)
2. ✅ **User ID Fix** - v2 → v1 endpoint for consistent identity across sessions/devices
3. ✅ **drive.appdata Scope** - Added for cross-device settings sync (Sprint 20)
4. ✅ **401 Auto-Refresh** - Token refresh interceptor for better UX
5. ✅ **Auth Consolidation** - Deleted AuthModal, consolidated to WelcomeScreen (single source of truth)

**Infrastructure Ready (Future-Proof)**:
- ✅ TokenManagerEncrypted with AES-256-GCM encryption
- ✅ IndexedDB database created (`ritemark-tokens`)
- ✅ Encryption/decryption utilities complete
- ⚠️ No refresh tokens from Google Identity Services (browser-only OAuth limitation)
- ⚠️ Token rotation requires backend (deferred to future sprint if needed)

**Key Files Modified**:
- `src/components/WelcomeScreen.tsx` - v1 endpoint, user.sub extraction, TokenManagerEncrypted
- `src/services/auth/googleAuth.ts` - User identity extraction
- `src/services/drive/driveClient.ts` - 401 refresh interceptor
- `src/services/auth/TokenManagerEncrypted.ts` - AES-256-GCM encryption ready
- **Deleted**: `src/components/auth/AuthModal.tsx` (eliminated technical debt)

**Architecture Decision**: Browser-only OAuth (Option A) approved
- 1-hour access token sessions (standard for cloud apps like Google Docs)
- Zero server cost (serverless architecture maintained)
- Sprint 20 & 21 fully unblocked

**Value Score**: 7.2/10 (HIGH VALUE)
**See**: `/docs/sprints/sprint-19/` for complete documentation and architectural analysis

---

### 🔮 Future Sprints (Sprint 20+)

- **Sprint 20**: Cross-Device Settings Sync (Google Drive AppData) - ✅ UNBLOCKED
- **Sprint 21**: Rate Limiting + BYOK (Bring Your Own Key) - ✅ UNBLOCKED
- **Sprint 22+**: AI Writing Assistant (OpenAI/Anthropic integration)
- **Sprint 23+**: Real-Time Collaboration (Y.js CRDT)
- **Sprint 24+**: Collaboration UI & Presence
- **Sprint 25+**: Comments & Suggestions

**Note**: Mobile responsive design already implemented in Sprint 4

### 🔄 Sprint Rules for AI Development
1. **Maximum 1 PR per sprint** (enforce small increments)
2. **Single feature per sprint** (no combining features)
3. **Working demo after each sprint** (always deployable)
4. **Validate before next sprint** (test with real usage)
5. **Document decisions** (maintain context for AI agents)
6. **Distraction-free focus** (no split-screens, no preview panes)
7. **Pageless writing experience** (continuous flow, no artificial breaks)

## 📈 Success Metrics Per Sprint
- **Sprint Success**: Feature works as expected
- **Integration Success**: No breaking changes
- **User Success**: Can complete intended action
- **Technical Success**: Code quality maintained

---

**AI Development Principle**: Ultra-small increments, maximum learning, continuous validation
**Current Sprint**: Sprint 19 🔄 READY FOR PR - OAuth Security Upgrade (awaiting user approval)
**Next Sprint**: Sprint 20 (Cross-Device Sync + Backend Token Refresh)
**Last Completed**: Sprint 17 ✅ Version History Feature (October 26, 2025)
**Last Updated**: October 30, 2025 - Sprint 19 cleanup complete, awaiting PR approval

## 🎉 MILESTONE ACHIEVEMENTS

### ✅ MILESTONE 1: Complete Visual Editor (Sprints 3-6)
- Users write with full WYSIWYG editing (no markdown syntax visible)
- Seamless document navigation with intelligent Table of Contents
- Production-ready code with Johnny Ive invisible interface design

### 🚧 MILESTONE 2: Cloud Storage & Invisible Interface UX (Sprints 7-12)
**Foundation Complete (Sprints 7-8):**
- ✅ Google OAuth 2.0 authentication with single-popup flow
- ✅ Complete Google Drive file lifecycle (create, open, save, auto-save)
- ✅ WYSIWYG markdown editing with bidirectional conversion
- ✅ IndexedDB offline caching for reliability
- ✅ Mobile-first PWA architecture

**Next Steps (Sprints 9-12):**
- 🎯 Sprint 9: Fix 3-location UI problem, consolidate to single corner
- 🎯 Sprint 10: In-context formatting menu on text selection
- 🎯 Sprint 11-12: Enhanced operations & keyboard shortcuts
- **Note**: Real-time collaboration postponed to Sprint 13+ (after UX perfection)