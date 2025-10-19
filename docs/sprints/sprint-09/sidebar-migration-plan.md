# Sprint 9.1 — Sidebar-Based Layout Migration ✅ COMPLETED

**Date:** 2025-10-08  
**Completion:** 2025-01-27  
**Baseline:** `cd4518c` (Sprint 8 completion, reverted clean)  
**Branch:** `feat/shadcn-sidebar-poc`  
**Owner:** Jarmo + AI pair (Claude Code)

## 🎉 SPRINT COMPLETED SUCCESSFULLY

**All 8 phases completed with full functionality:**
- ✅ shadcn/ui sidebar integration with Tailwind v3.4.18
- ✅ Complete UI migration from legacy layout to modern sidebar
- ✅ OAuth authentication flow with Google Identity Services
- ✅ File management (new document, open from Drive)
- ✅ Document status and sync indicators
- ✅ Table of Contents with smooth navigation
- ✅ User account management
- ✅ Mobile-responsive design with collapsible sidebar
- ✅ Clean codebase with production-ready logging
- ✅ Fast Refresh compatibility fixed

---

## Goal
Move from the legacy fixed-position shell to a shadcn-compatible, flex-based layout with an expandable/collapsible sidebar, while preventing CSS conflicts via a strict “quarantine” of legacy styles.

- Replace global fixed layout with `SidebarProvider → Sidebar → SidebarInset` scaffold.
- Consolidate non‑writing UI (file actions, status, TOC, account) into the sidebar.
- Preserve editor functionality and content behavior during migration.

### Technical References (shadcn/ui Sidebar — 2025)
- Install shadcn/ui CLI and sidebar primitives (CLI copies components into the repo):
  - `npx shadcn@latest init` (if not already initialized)
  - `npx shadcn@latest add sidebar`
  - Likely additional primitives used by the layout: `button`, `separator`, `tooltip`, `sheet`, `skeleton` (add via `npx shadcn@latest add <component>`)
- Peer deps that are commonly required/used with generated components:
  - `@radix-ui/react-tooltip`, `@radix-ui/react-separator`, `@radix-ui/react-dialog`/`sheet` (depending on mobile sheet)
  - `lucide-react` for icons
  - `class-variance-authority`, `clsx`, `tailwind-merge`
- Core components/exports referenced by the official sidebar docs:
  - `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarInset`, `SidebarTrigger`, `SidebarRail`
- Minimal usage pattern (clean room shell):
  - Sidebar left, collapsible as icon rail; content in `SidebarInset` with its own scroll container.

---

## Strategy: Quarantine, Then Incremental Migration

1) "Quarantine" legacy CSS behind `.legacy-root` using build-time selector prefixing.
2) Introduce a clean-room `.rm-app` shell with shadcn sidebar scaffold (no custom CSS initially).
3) Migrate one UI group at a time; after each migration, remove the legacy render + CSS.
4) Validate visually and functionally at each step before proceeding.

---

## Phases & Tasks

### Phase 0 — Branch & Baseline (0.5h) ✅ COMPLETED
- ✅ Create `feat/shadcn-sidebar-poc` from `cd4518c`.
- ✅ Verify: `npm run type-check`, `npm run dev`, open `http://localhost:5173`.
- **Status**: Branch created, TypeScript compiles clean, dev server running, browser loads successfully at localhost:5173

### Phase 1 — CSS Quarantine Setup (1.0h) ✅ COMPLETED
- ✅ Wrap current app render in `.legacy-root` container.
- ✅ Configure `postcss-prefix-selector` (or equivalent) to prefix legacy stylesheet(s) with `.legacy-root` - **READY TO ENABLE**.
- Keep only safe truly-global base rules on `html, body` (font, color-scheme). Move layout-affecting rules behind `.legacy-root`.
- ✅ **RESOLVED**: Dev server fixed by Claude Code - now running on localhost:5173.
- **Status**: App wrapped in `.legacy-root`, dev server working, console clean, UI intact. Ready for Phase 2.

### Phase 2 — Clean-Room Scaffold (1.0–1.5h) ✅ COMPLETED
- ✅ Install shadcn/ui primitives required by the sidebar:
  - `npx shadcn@latest add sidebar button separator tooltip sheet skeleton breadcrumb`
- ✅ Create barebone AppShell using Tailwind v3 utilities only:
  - `SidebarProvider → AppSidebar → SidebarInset` structure
  - Left: `Sidebar` with `collapsible="icon"` and `side="left"`
  - Right: `SidebarInset` with header (breadcrumb + trigger) and placeholder content
- ✅ **CRITICAL ISSUE RESOLVED**: Tailwind v4.x incompatibility with shadcn sidebar
  - **Root Cause**: Tailwind v4 (canary) doesn't properly handle `w-[var(--sidebar-width)]` syntax
  - **Solution**: Downgraded from v4.1.14 → **v3.4.18 (stable)**
  - **Files Modified**:
    - Uninstalled: `@tailwindcss/vite`, `@tailwindcss/postcss`
    - Installed: `tailwindcss@^3.4.18`, `postcss`, `autoprefixer`
    - Created: `tailwind.config.ts` (v3 format with sidebar colors)
    - Updated: `postcss.config.js` (standard Tailwind v3 plugins)
    - Updated: `src/index.css` (@tailwind directives instead of @import)
    - Fixed: `src/components/ui/sidebar.tsx` (w-[var(--sidebar-width)] syntax)
  - **Locked in CLAUDE.md**: Tailwind v3.4.18 is now the official version
- ✅ **RESOLVED**: Fixed vite package installation issue
- ✅ **RESOLVED**: Fixed VariantProps type import error (must use `type VariantProps`)
- ✅ **RESOLVED**: Created use-mobile hook for responsive behavior
- ✅ **RESOLVED**: Fixed breadcrumb import paths (@/lib/utils)
- ✅ **RESOLVED**: CSS variable scoping (inline styles on SidebarProvider)
- **Status**: Barebone scaffold fully functional, sidebar collapsing properly (304px → 48px), ready for Phase 3.

### Phase 3 — Move File Actions (0.5–1.0h) ✅ COMPLETED
- ✅ Migrated FileMenu functionality to AppSidebar component
- ✅ Added props interface (onNewDocument, onOpenFromDrive) to AppSidebar
- ✅ Wired file actions through AppShell → App.tsx
- ✅ Added console logging for debugging
- ✅ Changed "Application" group to "File" group (clearer naming)
- ✅ Removed "Home" menu item (unused)
- ✅ Deleted obsolete FileMenu.tsx component
- ✅ **TESTED**: Both buttons work correctly, console logs confirm handler execution
- **Status**: File actions fully migrated, ready for Phase 4

### Phase 4 — Move Document Status/Title (0.5–1.0h) ✅ COMPLETED
- ✅ Created DocumentStatus component with title + sync status display
- ✅ Wired useDriveSync hook in App.tsx with document state (fileId, title, content)
- ✅ Passed syncStatus and documentTitle props through AppShell → AppSidebar
- ✅ Integrated into sidebar footer showing:
  - Document title with FileText icon
  - Sync status with color-coded states (Saving.../Saved X ago/Error/Offline)
  - Icons from lucide-react (Loader2, Check, AlertCircle, CloudOff)
  - Time-ago formatting for lastSaved timestamp
- ✅ **TESTED**: TypeScript compiles clean, dev server running, UI renders correctly
- ✅ **VERIFIED**: Sidebar component adapts to collapsed mode (truncation works)
- **Files Created**: `/src/components/sidebar/DocumentStatus.tsx`
- **Files Modified**: `App.tsx` (added useDriveSync hook), `AppShell.tsx` (props wiring), `app-sidebar.tsx` (footer integration)
- **Note**: Legacy SaveStatus.tsx component remains for now (will remove in Phase 7 De-Quarantine)

**🔄 AUTHENTICATION FLOW INTEGRATION (Added during Phase 4)**
- ✅ Added AuthProvider wrapper in main.tsx for global auth state
- ✅ Integrated DriveFilePicker modal in App.tsx (opens on "Open from Drive")
- ✅ Conditional sidebar rendering based on auth state:
  - **NOT authenticated**: Shows "Sign in to Google" button with icon and explanation
  - **Authenticated**: Shows full sidebar (File actions, TOC, Document Status, Settings)
- ✅ File loading handler wired to useDriveSync.loadFile()
- **Files Modified**: `main.tsx` (AuthProvider), `app-sidebar.tsx` (auth check + sign-in UI), `App.tsx` (DriveFilePicker integration)

**📊 LOGICAL FLOW (User Journey)**
```
Initial state → Check logged in?
├─ NO  → Display "Log in with Google" button
│         ├─ Click → Google OAuth popup
│         ├─ Success? YES → Return to initial (now logged in)
│         ├─ Success? NO  → Error: "Try again?" → Retry loop
│         └─ Cancel → Return to initial
│
└─ YES → Display "Open" and "Create new" buttons in sidebar
          ├─ Click "Open" → Google Picker dialog → Load file to editor
          └─ Click "Create new" → Internal dialog (filename) → Create file in My Drive → Load to editor
```

**🐛 ISSUE DISCOVERED**: Token expiry validation
- Current: AuthContext checks sessionStorage presence only (user data exists)
- Problem: Expired tokens pass auth check but fail when Drive API called
- Console errors: "Access token expired, attempting refresh" → "No OAuth token available"
- **FIX APPLIED**: ✅ Added token expiry validation in AuthContext mount effect
  - Checks `expiresAt` timestamp against `Date.now()`
  - Clears all session data if expired
  - Sets user to null to trigger sign-in UI
- **Status**: Token validation fixed in AuthContext.tsx:17-49

**🔐 OAUTH POPUP IMPLEMENTATION (Phase 4.1)** ✅ COMPLETED
- ✅ Replaced broken `googleAuth.login()` (full-page redirect) with GIS tokenClient pattern
- ✅ Implemented `window.google.accounts.oauth2.initTokenClient()` in app-sidebar.tsx
- ✅ OAuth flow:
  1. Initialize tokenClient on component mount with retry logic
  2. User clicks "Sign in to Google" button
  3. `tokenClient.requestAccessToken()` opens OAuth popup (NOT full-page redirect)
  4. Callback receives access_token
  5. Fetch user info from Google API (`/oauth2/v2/userinfo`)
  6. Store userData and tokens in sessionStorage with expiresAt timestamp
  7. Reload page to update auth state
- **Files Modified**: `app-sidebar.tsx:26-89` (added TokenClient interface, useEffect for init, handleSignIn)
- **Pattern Reference**: Sprint 8 AuthModal.tsx:18-116 (GIS tokenClient implementation)
- **Validation**: TypeScript compilation passes, dev server running, Google Identity Services script loaded

### Phase 5 — Move Table of Contents (1.0–1.5h) ✅ COMPLETED
- ✅ Migrated TableOfContents component to sidebar content area
- ✅ Implemented smooth scroll behavior within content area
- ✅ Added responsive behavior for mobile sheet interaction
- ✅ Deleted legacy TOC component and styles
- **Status**: TOC fully functional in sidebar, smooth navigation working

### Phase 6 — Move Account/User (0.5h) ✅ COMPLETED
- ✅ Added UserAccountInfo component to sidebar footer
- ✅ Integrated with existing auth flows and user data
- ✅ Removed legacy placement and styles
- ✅ Added user profile display with avatar and name
- **Status**: User account controls fully migrated to sidebar

### Phase 7 — De-Quarantine (1.0–2.0h) ✅ COMPLETED
- ✅ Removed `.legacy-root` wrapper and prefixed rules
- ✅ Cleaned up unused CSS rules and layout globals
- ✅ Fixed Fast Refresh compatibility issue (separated useSidebar hook)
- ✅ Strategic console log cleanup (kept errors, removed debug noise)
- **Status**: Clean codebase, no legacy CSS conflicts, production-ready logging

### Phase 8 — Cleanup & PR (0.5–1.0h) ✅ COMPLETED
- ✅ Removed dead components (FileMenu.tsx, TableOfContents.tsx, SaveStatus.tsx, AuthStatus.tsx)
- ✅ Cleaned up unused imports and dependencies
- ✅ Updated documentation with completion status
- ✅ Fixed TypeScript compilation and linting issues
- **Status**: Codebase clean, ready for commit and push

---

## Validation Gates (Every Phase)
- TypeScript: `npm run type-check` → 0 errors.
- Dev server health: `npm run dev` then load `http://localhost:5173`.
- Browser checks (Cursor browser): console logs, page snapshot, screenshot.
- Visual at sm (375–640), md (768–1024), lg (1280+):
  - Sidebar expands/collapses without content shift bugs.
  - Content scrolls; page does not “double scroll”.
  - No z-index overlays hiding modals/sheets.
- Mobile sheet opens/closes; focus is trapped appropriately.

---

## Reference: React Usage Examples (shadcn/ui Sidebar)

### Minimal Shell
```tsx
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" side="left" className="border-r">
          <SidebarHeader>RiteMark</SidebarHeader>
          <SidebarContent>
            {/* nav / actions / toc go here */}
          </SidebarContent>
          <SidebarFooter>
            {/* user/account/status */}
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur">
            <div className="flex h-12 items-center gap-2 px-3">
              <SidebarTrigger />
              <h1 className="font-medium">Document</h1>
            </div>
          </header>
          <main className="p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
```

### Key Props & Patterns
- **`<Sidebar collapsible="icon" side="left" />`**: icon-rail when collapsed; left or right side.
- **`<SidebarTrigger />`**: button to toggle expand/collapse.
- **`<SidebarRail />`**: narrow rail visible when collapsed; often houses tooltips.
- **Widths**: use utilities on `Sidebar` like `className="w-64 md:w-72"`; the icon rail width is handled by the component styles.
- **Scroll**: keep `SidebarInset` as the scroll container (`overflow-auto`), not the page.
- **State**: `SidebarProvider` handles internal state; you can read with `useSidebar()` if the template exposes it (varies by component template).

### Programmatic Control & Shortcuts
```tsx
import { useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar/hooks"; // if exported by template

export function KeyboardToggle() {
  const { toggleSidebar } = useSidebar();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);
  return null;
}
```

### Mobile Sheet (Off-Canvas)
```tsx
// In many templates, mobile is handled automatically by the Sidebar
// via a Sheet under certain breakpoints. If not included, pair with Sheet:
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden">Menu</SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        {/* mount <Sidebar> content here for mobile */}
      </SheetContent>
    </Sheet>
  );
}
```

### Persisting State (Optional)
```tsx
// Basic localStorage persistence example (pseudo, adjust to template API)
import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar/hooks";

export function SidebarPersistence() {
  const { open, setOpen } = useSidebar();
  useEffect(() => {
    const saved = localStorage.getItem("rm:sidebar:open");
    if (saved != null) setOpen(saved === "true");
  }, [setOpen]);
  useEffect(() => {
    localStorage.setItem("rm:sidebar:open", String(open));
  }, [open]);
  return null;
}
```

Notes:
- Exact hook names vary by the generated component template; if `useSidebar` isn’t exported, keep purely declarative and control via `SidebarTrigger`.
- Prefer Tailwind utilities over custom CSS. If custom rules are necessary, scope them under `.rm-app`.

---

## Risks & Mitigations
- CSS bleed-through despite prefixing → Add stricter scoping: `.rm-app :where(*) { all: revert; }` selectively for problem areas; progressively re-apply needed utilities.
- Scroll locking regressions → Standardize container scroll: content uses `overflow-auto`; avoid `overflow: hidden` on `body`.
- Z-index conflicts with dialogs/sheets → Adopt a single z-index scale; ensure providers are mounted at the shell root.
- OAuth duplication → Ensure auth flows are only referenced via existing context/hooks; do not re-implement in new components.

---

## Timeline (Conservative)
- Day 1: Phases 0–2
- Day 2: Phases 3–5
- Day 3: Phases 6–8

---

## Deliverables
- New sidebar-based shell with consolidated non‑writing UI.
- Removed legacy layout code and styles.
- PR with screenshots, validation notes, and concise migration guide in the description.

---

## Out of Scope
- Editor engine changes (TipTap/Milkdown behavior).
- New features in file management or collaboration (only relocation).
