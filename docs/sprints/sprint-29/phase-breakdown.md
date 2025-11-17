# Sprint 29: Phase Breakdown - Widget Plugin Architecture

**Status**: 🚧 In Planning
**Focus**: Replace direct tool execution with widget-based execution
**Architecture**: Plugin-based widgets with deterministic algorithms

---

## 🎯 Problem Statement

### Current Bug (Direct Tool Execution)
```
User: "asenda GDPR → TAKS"
↓
OpenAI API (tool_choice: 'auto')
↓
OpenAI calls replaceText tool
↓
ToolExecutor executes IMMEDIATELY
↓
Bug: Only replaces FIRST occurrence (1/5 replaced)
↓
Shows "Replaced 'GDPR' with 'TAKS'" (misleading)
```

**Root Causes:**
1. ❌ **No preview** - User can't see what will change
2. ❌ **No control** - User can't approve/cancel
3. ❌ **Non-deterministic** - Tool execution logic can vary
4. ❌ **Single occurrence** - Only replaces first match
5. ❌ **No undo** - Changes happen immediately

---

## ✅ Solution: Widget Plugin Architecture

### New Flow (Widget-Based Execution)
```
User: "asenda GDPR → TAKS"
↓
OpenAI API (tool_choice: 'auto')
↓
OpenAI calls findAndReplace tool
↓
Instead of executing: CREATE WIDGET
↓
Widget shows in chat:
  "Found 5 occurrences of 'GDPR'"
  [Preview: line 12, 45, 67, 89, 101]
  [Replace All (5)] [Replace in Selection] [Cancel]
↓
User clicks "Replace All"
↓
DETERMINISTIC algorithm replaces ALL 5 occurrences
↓
Widget updates: "✓ Replaced 5 occurrences"
```

**Benefits:**
1. ✅ **Preview** - User sees what will change
2. ✅ **Control** - User approves/cancels
3. ✅ **Deterministic** - Consistent algorithm
4. ✅ **Bulk operations** - Replaces all occurrences
5. ✅ **Undo support** - ProseMirror transaction

---

## 📋 Phase Overview

### Phase 1: Widget Plugin System (Foundation)
**Goal**: Build extensible plugin infrastructure (minimal but complete)

**Tasks:**
- [ ] Create `WidgetPlugin` base class (abstract interface for future widgets)
- [ ] Create `WidgetRegistry` for plugin management (supports future plugins)
- [ ] Update `ToolExecutor` to route to widgets (extensible routing)
- [ ] Add widget rendering in `AIChatSidebar` (generic widget container)
- [ ] Widget state management (React hooks)

**Deliverable**: Extensible widget plugin system (ready for multiple widgets, but none implemented yet)

**Note**: Architecture supports many widgets, but we only implement ONE widget in Sprint 29.

---

### Phase 2: FindReplaceWidget (ONLY WIDGET IN SPRINT 29)
**Goal**: Implement ONLY FindReplaceWidget as proof-of-concept

**Tasks:**
- [ ] Create `FindReplaceWidget` component
- [ ] Implement deterministic find-all algorithm (`algorithms/findAndReplace.ts`)
- [ ] Add preview UI (show matches with context)
- [ ] Add user controls (Replace All, Cancel)
- [ ] Execute replacement via ProseMirror transaction
- [ ] Update widget status after execution

**Deliverable**: Find-and-replace works via widget system

**CRITICAL**: This is the ONLY widget in Sprint 29. Other widgets are future work.

---

### Phase 3: Integration with Existing `replaceText` Tool
**Goal**: Replace old direct-execution `replaceText` with `FindReplaceWidget`

**Tasks:**
- [ ] Update `toolDefinitions.ts`: `replaceText` → `findAndReplaceWidget`
- [ ] Update `toolExecutor.ts`: Route `findAndReplaceWidget` tool calls to widget
- [ ] Deprecate old direct-execution `replaceText` implementation
- [ ] Test migration: Ensure all existing use cases work via widget
- [ ] Remove old `replaceText` code after successful migration

**Deliverable**: `replaceText` functionality fully migrated to widget-based execution

**IMPORTANT**: Existing `insertText` tool remains AS-IS (not converted to widget yet).

---

### Phase 4: Testing, Refinement, and Documentation
**Goal**: Ensure production-ready quality for initial widget

**Tasks:**
- [ ] Unit tests for `findAndReplace.ts` algorithm (deterministic behavior)
- [ ] Component tests for `FindReplaceWidget.tsx` (preview UI, execution)
- [ ] Integration tests (OpenAI tool call → widget → execution flow)
- [ ] Browser validation (test in actual editor, not just unit tests)
- [ ] Performance testing (large documents with many matches)
- [ ] Documentation updates (ADR-005, Sprint 29 docs, code comments)

**Deliverable**: Production-ready FindReplaceWidget with comprehensive tests

---

### FUTURE PHASES (Post-Sprint 29)

These are NOT part of Sprint 29 scope:

**Future Phase A: Additional Widgets**
- [ ] Create `InsertTextWidget` (convert existing `insertText` tool)
- [ ] Create `DeleteTextWidget` (new feature)
- [ ] Create `FormatTextWidget` (new feature)
- [ ] Create `TableEditorWidget` (new feature)

**Future Phase B: Advanced FindReplace Features**
- [ ] Partial execution (select specific matches to replace)
- [ ] Regex pattern support
- [ ] Case preservation (GDPR → TAKS, Gdpr → Taks)
- [ ] Whole word matching
- [ ] Scope control (document vs selection)

**Future Phase C: Widget System Enhancements**
- [ ] Widget history/audit trail
- [ ] Widget templates (reusable patterns)
- [ ] Third-party widget plugin API

---

## 🏗️ Architecture Principles

### 1. Separation of Concerns
```
OpenAI Tool Call → Widget Creation → User Interaction → Deterministic Execution
     (AI)             (Plugin)          (User)            (Editor)
```

- **OpenAI**: Decides WHAT to do (intent detection)
- **Widget**: Shows WHAT WILL happen (preview)
- **User**: Decides WHETHER to do it (approval)
- **Editor**: Executes HOW to do it (deterministic)

### 2. Plugin-Based Architecture (Sprint 29 Scope)
```
src/ai/widgets/
├── core/                        # Extensible widget system (supports future plugins)
│   ├── types.ts                 # Shared types for all widgets
│   ├── WidgetPlugin.ts          # Base class for all widgets
│   ├── WidgetRegistry.ts        # Plugin registration/discovery
│   └── WidgetRenderer.tsx       # Renders widgets in chat
├── find-replace/                # ONLY WIDGET IN SPRINT 29
│   ├── index.ts                 # Public API
│   ├── FindReplaceWidget.tsx    # Find-and-replace widget component
│   ├── executor.ts              # Deterministic find/replace algorithm
│   └── types.ts                 # Widget-specific types
└── index.ts                     # Widget system public API

# FUTURE WIDGETS (Not in Sprint 29):
# ├── insert-text/               # Future: InsertTextWidget
# ├── delete-text/               # Future: DeleteTextWidget
# ├── format-text/               # Future: FormatTextWidget
# ├── table-editor/              # Future: TableEditorWidget
# └── image-upload/              # Future: ImageUploaderWidget
```

### 3. Deterministic Execution
```typescript
// ❌ OLD: Non-deterministic (varies by implementation)
replaceText(searchTerm, replacement)

// ✅ NEW: Deterministic algorithm
const matches = findAllMatches(searchTerm, document)
const result = replaceMatches(matches, replacement)
// Always replaces ALL matches in same way
```

### 4. User Control
```typescript
interface WidgetState {
  status: 'preview' | 'executing' | 'completed' | 'cancelled'
  preview: MatchPreview[]
  userChoice: null | 'all' | 'selection' | 'custom'
}

// Widget lifecycle:
preview → user interaction → execution → completed/cancelled
```

---

## 🔄 Widget Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. TOOL CALL RECEIVED (from OpenAI)                        │
│     - tool_name: 'findAndReplace'                           │
│     - arguments: { search: 'GDPR', replace: 'TAKS' }        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. WIDGET CREATION (ToolExecutor)                          │
│     - WidgetRegistry.createWidget('findAndReplace')         │
│     - Pass tool arguments to widget                         │
│     - Return widget instance (not execution result)         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. PREVIEW GENERATION (Widget)                             │
│     - Widget.initialize(editor, args)                       │
│     - Run find algorithm (deterministic)                    │
│     - Generate preview (matches, locations)                 │
│     - Render preview UI in chat                             │
│     Status: 'preview'                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. USER INTERACTION (Chat UI)                              │
│     - User sees preview                                     │
│     - User chooses action:                                  │
│       • Replace All (5 occurrences)                         │
│       • Replace in Selection                                │
│       • Cancel                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. EXECUTION (Widget + Editor)                             │
│     - Widget.execute(userChoice)                            │
│     - Create ProseMirror transaction                        │
│     - Apply deterministic algorithm                         │
│     - Update editor state                                   │
│     Status: 'executing' → 'completed'                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  6. RESULT UPDATE (Widget)                                  │
│     - Update widget UI with result                          │
│     - Show "✓ Replaced 5 occurrences"                       │
│     - Widget remains in chat as history                     │
│     Status: 'completed'                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Implementation Phases

### Phase 1: Foundation (Week 1)

**Files to Create:**
```
src/ai/widgets/WidgetPlugin.ts
src/ai/widgets/WidgetRegistry.ts
src/ai/widgets/WidgetRenderer.tsx
```

**Changes to Existing:**
```
src/ai/toolExecutor.ts  # Route to widgets instead of direct execution
src/components/AIChatSidebar.tsx  # Render widgets in chat
```

**Success Criteria:**
- [ ] `WidgetRegistry.register()` works
- [ ] `ToolExecutor` creates widgets (not executes)
- [ ] `WidgetRenderer` displays widget UI in chat
- [ ] Widget state management (preview → execute → complete)

---

### Phase 2: First Widget (Week 2)

**Files to Create:**
```
src/ai/widgets/plugins/FindReplaceWidget.tsx
src/ai/algorithms/findAndReplace.ts  # Deterministic find algorithm
```

**Features:**
```typescript
interface FindReplaceWidgetState {
  status: 'preview' | 'executing' | 'completed'
  matches: Array<{
    text: string
    position: { from: number, to: number }
    lineNumber: number
    context: string  // Surrounding text for preview
  }>
  totalMatches: number
  userChoice: null | 'all' | 'selection' | 'cancel'
}
```

**UI Components:**
```
┌───────────────────────────────────────────────────────┐
│ 🔍 Find and Replace                                   │
├───────────────────────────────────────────────────────┤
│ Found 5 occurrences of "GDPR"                         │
│                                                       │
│ Preview:                                              │
│ • Line 12: "...complies with GDPR regulations..."     │
│ • Line 45: "...GDPR compliance requirements..."       │
│ • Line 67: "...following GDPR guidelines..."          │
│ • Line 89: "...GDPR data protection..."               │
│ • Line 101: "...under GDPR framework..."              │
│                                                       │
│ [Replace All (5)]  [Replace in Selection]  [Cancel]  │
└───────────────────────────────────────────────────────┘
```

**Success Criteria:**
- [ ] Widget shows preview of all matches
- [ ] "Replace All" works (deterministic)
- [ ] Widget updates to "✓ Replaced 5 occurrences"
- [ ] No direct execution (user must click button)

---

### Phase 3: Migration (Week 3)

**Create Additional Widgets:**
```
src/ai/widgets/plugins/InsertTextWidget.tsx
src/ai/widgets/plugins/DeleteTextWidget.tsx
src/ai/widgets/plugins/FormatTextWidget.tsx
```

**Deprecate Old Code:**
```typescript
// ❌ OLD: Direct execution in toolExecutor.ts
export async function executeToolCall(toolCall) {
  if (toolCall.name === 'replaceText') {
    return await replaceText(...)  // Direct execution
  }
}

// ✅ NEW: Widget creation
export async function executeToolCall(toolCall) {
  const widget = WidgetRegistry.createWidget(toolCall.name)
  return widget  // Return widget, not result
}
```

**Success Criteria:**
- [ ] All tools use widgets
- [ ] No direct execution remains
- [ ] `ToolExecutor` only creates widgets
- [ ] All widgets render in chat

---

### Phase 4: Advanced Features (Week 4)

**Features to Add:**
```typescript
// Case preservation
"GDPR" → "TAKS"
"Gdpr" → "Taks"
"gdpr" → "taks"

// Whole word matching
"customer" (don't match "customers", "customer's")

// Regex support
"\\buser(s)?\\b" → "customer$1"

// Scope control
scope: 'document' | 'selection' | 'custom-range'

// Partial execution
"Replace 3 out of 5 matches"
[x] Line 12
[x] Line 45
[ ] Line 67  (skip)
[x] Line 89
[ ] Line 101 (skip)
```

**Success Criteria:**
- [ ] Case preservation works
- [ ] Whole word matching works
- [ ] Regex patterns supported
- [ ] Users can select specific matches to replace
- [ ] Scope control works

---

## 🎯 Success Criteria (Sprint 29 Complete)

### MUST-HAVE (Sprint 29 Scope)
- [ ] Widget plugin system working (extensible architecture)
- [ ] FindReplaceWidget implemented and deployed
- [ ] Preview before execution (FindReplaceWidget shows all matches)
- [ ] User approval required (no auto-execution without clicking button)
- [ ] Deterministic algorithm (findAndReplace.ts - consistent results)
- [ ] Bulk operations (replace ALL occurrences, not just first)
- [ ] Migration complete (old `replaceText` deprecated, new widget works)

### OUT OF SCOPE (Future Sprints)
- ❌ InsertTextWidget (existing `insertText` tool remains AS-IS for now)
- ❌ DeleteTextWidget (future feature)
- ❌ FormatTextWidget (future feature)
- ❌ Case preservation (future enhancement)
- ❌ Regex support (future enhancement)
- ❌ Partial execution (future enhancement)

### STRETCH GOALS (Only if time permits in Sprint 29)
- [ ] Basic case preservation (GDPR → TAKS, Gdpr → Taks, gdpr → taks)
- [ ] Whole word matching toggle
- [ ] Match highlighting in editor (scroll to first match)

---

## 📁 File Structure (After Sprint 29)

```
ritemark-app/
├── src/
│   ├── services/
│   │   └── ai/
│   │       ├── openAIClient.ts          # OpenAI API integration
│   │       ├── toolExecutor.ts          # Routes to widgets (no direct execution)
│   │       ├── toolDefinitions.ts       # Tool schemas for OpenAI
│   │       └── widgets/                 # Widget plugin system
│   │           ├── core/                # Extensible widget system
│   │           │   ├── types.ts         # Shared types
│   │           │   ├── WidgetPlugin.ts  # Base class (abstract)
│   │           │   ├── WidgetRegistry.ts # Plugin management
│   │           │   └── WidgetRenderer.tsx # Renders widgets in chat
│   │           ├── find-replace/        # ONLY WIDGET IN SPRINT 29
│   │           │   ├── index.ts         # Public API
│   │           │   ├── FindReplaceWidget.tsx # Widget component
│   │           │   ├── executor.ts      # Deterministic find/replace logic
│   │           │   └── types.ts         # Widget-specific types
│   │           └── index.ts             # Widget system public API
│   └── components/
│       └── AIChatSidebar.tsx            # Renders widgets in chat

# FUTURE STRUCTURE (Post-Sprint 29):
# src/services/ai/widgets/
#   ├── insert-text/          # Future: InsertTextWidget
#   ├── delete-text/          # Future: DeleteTextWidget
#   ├── format-text/          # Future: FormatTextWidget
#   ├── table-editor/         # Future: TableEditorWidget
#   └── image-upload/         # Future: ImageUploaderWidget
```

---

## 🚀 Migration Strategy

### Old Tool Definition (Direct Execution)
```typescript
// ❌ OLD: toolDefinitions.ts
export const replaceTextTool = {
  type: 'function',
  function: {
    name: 'replaceText',
    description: 'Replace text in document',
    parameters: { ... }
  }
}

// ❌ OLD: toolExecutor.ts
if (toolName === 'replaceText') {
  const result = await replaceText(args)  // Direct execution
  return result
}
```

### New Widget-Based Definition
```typescript
// ✅ NEW: toolDefinitions.ts
export const findAndReplaceTool = {
  type: 'function',
  function: {
    name: 'findAndReplace',
    description: 'Find and replace text with preview',
    parameters: { ... }
  }
}

// ✅ NEW: toolExecutor.ts
if (toolName === 'findAndReplace') {
  const widget = WidgetRegistry.createWidget('findAndReplace', args)
  return widget  // Return widget, not result
}

// ✅ NEW: Widget handles execution
class FindReplaceWidget extends WidgetPlugin {
  async execute(userChoice: 'all' | 'selection') {
    const tr = editor.state.tr
    // Apply deterministic algorithm
    editor.view.dispatch(tr)
  }
}
```

---

## 📚 References

### Related Sprints
- **Sprint 26**: Token refresh bug (race conditions from parallel systems)
- **Sprint 19**: OAuth migration (incremental migration lessons)
- **Sprint 15**: TOC scrolling (state management lessons)

### Key Lessons Applied
1. **No parallel systems** (deprecate old, use new)
2. **Atomic migrations** (all-or-nothing, no partial states)
3. **Check state before changing state** (preview before execution)
4. **User control** (approval required, not auto-execution)
5. **Deterministic algorithms** (consistent, predictable results)

---

**Status**: ✅ Ready for implementation
**Estimated Time**: 4 weeks
**Risk**: Medium (significant refactor, but isolated to AI features)
**Benefit**: High (fixes core bug, enables future widget plugins)
