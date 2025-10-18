# Sprint 10 Background Research Audit: In-Context Formatting Menu

## 1. Objectives & Scope
- Document the current editor capabilities and UX constraints ahead of Sprint 10.
- Identify dependencies, risks, and unanswered questions for introducing a selection-triggered floating formatting menu.
- Align planned work with the invisible-interface design system and Drive sync behaviours defined for Milestone 2.

## 2. Current Implementation Baseline
- **Editor stack**: TipTap StarterKit with custom bullet/ordered lists, list items, code block highlighting, and placeholder extensions; no BubbleMenu or Link extension wired into the runtime yet (`src/components/Editor.tsx:42`).
- **Formatting access**: StarterKit still wires default inline shortcuts (e.g., Mod+B / Mod+I) while our custom `handleKeyDown` handler layers on code block and list toggles, but there is still no visible affordance for any formatting (`src/components/Editor.tsx:42`, `src/components/Editor.tsx:104`).
- **Inline styling**: The ProseMirror surface is chrome-free, using inline CSS to keep the writing canvas minimal (`src/components/Editor.tsx:200`).
- **Layout**: Document editor isolates controls in the shadcn sidebar/header, keeping the content column unobstructed; word/character counts appear only when text exists (`src/components/layout/DocumentEditor.tsx:27`).
- **Drive sync**: Auto-save defaults to a 3 s debounce (configurable via the `debounceMs` option) and tracks sync status states (`synced`, `saving`, `error`, `offline`), so any new UI must avoid blocking saves or obscuring status feedback (`src/hooks/useDriveSync.ts:1`, `src/hooks/useDriveSync.ts:47`).
- **Sprint 9 output**: Consolidated controls into the left sidebar to satisfy invisible-interface goals; the writing surface must stay uncluttered by default (`docs/sprints/sprint-09-ux-consolidation.md:26`).

## 3. UX & Design Guardrails
- **Roadmap expectation**: Sprint 10 must deliver a Medium/Notion-style floating toolbar that appears on selection, offering bold, italic, heading levels, lists, and links (`docs/roadmap.md:114`).
- **Invisible interface**: UI appears only when needed, avoids obvious labels, and must gracefully disappear after use (`docs/design-philosophy.md:5`).
- **Non-technical UX**: Contextual tools should provide visual feedback, large touch targets, and progressive disclosure while hiding markdown complexity (`docs/research/ux-analysis-non-technical-users.md:25`).

## 4. Technical Dependencies & Gaps
- **Bubble menu tooling**: Need to introduce TipTap's `BubbleMenu` component (available via `@tiptap/extension-bubble-menu@3.6.5`) and ensure it respects selection updates without conflicting with existing `onEditorReady` hooks, which currently fire on create and every update (`ritemark-app/src/components/Editor.tsx:90`, `ritemark-app/src/components/Editor.tsx:99`).
- **Link workflows**: Although `@tiptap/extension-link@3.6.5` is installed, it is not yet configured; Sprint 10 requires inline link creation/editing to avoid scope creep into later sprints (`ritemark-app/package.json:37`).
- **Selection state handling**: No current listeners track selection changes beyond TOC scroll detection, so we must establish a robust selection observer that cooperates with TOC event subscriptions (`ritemark-app/src/components/sidebar/TableOfContentsNav.tsx:83`).
- **Accessibility**: Need ARIA roles, keyboard navigation (tab/escape behaviour), and focus management so the floating menu supports screen readers and alternative input methods (reinforced by accessibility criteria in `docs/research/ux-analysis-non-technical-users.md:103`).
- **Styling system**: Ensure new components use existing Tailwind utility patterns or shadcn primitives to maintain consistent animation/elevation without reintroducing permanent chrome.

## 5. Risks & Constraints
- **Mobile/touch positioning**: Bubble menu must not interfere with native selection handles on iOS/Android; may need platform-specific offsets or fallback UI.
- **Save-state clarity**: Floating toolbar should not conflict with Drive status indicators relegated to the sidebar—decide whether to surface save cues in-context or leave that responsibility to sidebar components.
- **Performance**: Additional listeners must avoid degrading typing latency (<16 ms) and should reuse existing debounce mechanisms where possible (`docs/research/ux-analysis-non-technical-users.md:177`).
- **Testing debt**: Current Vitest suite lacks editor interaction tests; introducing UI without test coverage risks regressions in selection and formatting flows (`src/App.test.tsx:1`).
- **Scope discipline**: Maintain single-sprint rule—avoid slipping advanced formatting (tables, custom blocks) or collaborative cues slated for later milestones (`docs/roadmap.md:127`).

## 6. Open Questions
1. **Mobile fallback**: Do we adopt an alternative control (e.g., bottom sheet) when selection handles overlap the toolbar?
2. **Link editing UX**: Should the menu trigger a minimalist inline prompt, or defer to a dialog that still honours invisible-interface principles?
3. **Keyboard support**: What shortcut or key sequence dismisses the toolbar, and how do we ensure tab order remains intuitive?
4. **Animation system**: Are existing shadcn/tailwind animations sufficient for the appear/disappear transitions, or do we need bespoke motion guidelines?
5. **Analytics/telemetry**: Do we capture usage data for formatting actions to feed future AI assistance work?

## 7. Recommended Next Steps
1. **Spike BubbleMenu integration**: Prototype TipTap bubble menu with selection event handling, verifying no regressions in Drive sync or TOC listeners.
2. **Define UX behaviours**: Collaborate with design to lock positioning, transition timing, and mobile adaptations aligned with invisible-interface principles.
3. **Implement Link extension**: Configure TipTap `Link` with minimal inline editing workflow and accessibility compliance.
4. **Draft test plan**: Add Vitest/RTL cases covering selection-based formatting, keyboard navigation, and focus management.
5. **Document decisions**: Update sprint page and design notes once behaviours are finalised to keep roadmap context current.
6. **Capture mobile spike learnings**: Fold outcomes from touch/mobile experimentation into the implementation brief so positioning or component structure changes get absorbed early.

## 8. Reference Index
- `docs/roadmap.md:114` – Sprint 10 goal & feature list.
- `docs/sprints/sprint-09-ux-consolidation.md:26` – Sidebar consolidation outcomes informing chrome expectations.
- `docs/design-philosophy.md:5` – Invisible-interface principles.
- `docs/research/ux-analysis-non-technical-users.md:25` – UX best practices for contextual tooling and accessibility.
- `ritemark-app/src/components/Editor.tsx:42` – Current TipTap extension configuration.
- `ritemark-app/src/components/Editor.tsx:90`, `ritemark-app/src/components/Editor.tsx:99` – `onEditorReady` firing on create/update.
- `ritemark-app/src/components/Editor.tsx:104` – Keyboard shortcut handling for formatting.
- `ritemark-app/src/components/layout/AppShell.tsx:48` – Editor layout component and header integration.
- `ritemark-app/src/hooks/useDriveSync.ts:80` – Auto-save debounce and status management.
- `ritemark-app/src/components/sidebar/TableOfContentsNav.tsx:83` – Existing ProseMirror state subscriptions to coexist with selection logic.
- `ritemark-app/package.json:30` – TipTap dependencies already installed for formatting/link extensions.

