# Widget Plugin Architecture - Complete Diagrams

**Status**: 🚧 In Planning
**Purpose**: Visual reference for widget-based tool execution architecture

---

## 📊 Table of Contents

1. [Execution Flow: Old vs New](#execution-flow-old-vs-new)
2. [Widget Lifecycle Diagram](#widget-lifecycle-diagram)
3. [Component Interaction Diagram](#component-interaction-diagram)
4. [Folder Structure Visualization](#folder-structure-visualization)
5. [Plugin Registration Flow](#plugin-registration-flow)
6. [Widget State Machine](#widget-state-machine)
7. [Deterministic Algorithm Flow](#deterministic-algorithm-flow)

---

## 1. Execution Flow: Old vs New

### ❌ OLD FLOW (Broken - Direct Execution)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                   │
│  "asenda GDPR → TAKS"                                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   OPENAI API CALL                                   │
│  - Model: gpt-4o                                                    │
│  - Messages: [conversation history + user message]                 │
│  - Tools: [replaceText, insertText]                                │
│  - tool_choice: 'auto'                                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               OPENAI DECIDES TO USE TOOL                            │
│  Tool: replaceText                                                  │
│  Arguments: {                                                       │
│    searchTerm: "GDPR",                                              │
│    replacement: "TAKS"                                              │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│            TOOL EXECUTOR (IMMEDIATE EXECUTION) 🔴                   │
│  function executeToolCall(toolCall) {                               │
│    if (toolCall.name === 'replaceText') {                           │
│      return await replaceText(args)  // ← EXECUTES IMMEDIATELY      │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PROSEMIRROR COMMAND EXECUTION                          │
│  - Find "GDPR" in document                                          │
│  - Replace FIRST occurrence only 🔴                                 │
│  - Update editor state                                              │
│                                                                     │
│  Result: 1/5 occurrences replaced                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SHOW RESULT TO USER                               │
│  "✓ Replaced 'GDPR' with 'TAKS'"                                    │
│                                                                     │
│  User sees: 4 occurrences still say "GDPR" 🔴                       │
│  User expectation: All 5 should be replaced 🔴                      │
└─────────────────────────────────────────────────────────────────────┘

Problems:
🔴 No preview - User can't see what will change
🔴 No control - User can't approve/cancel
🔴 Only replaces FIRST occurrence (bug)
🔴 Misleading success message
🔴 No undo possible (immediate execution)
```

---

### ✅ NEW FLOW (Widget-Based Execution)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                   │
│  "asenda GDPR → TAKS"                                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   OPENAI API CALL                                   │
│  - Model: gpt-4o                                                    │
│  - Messages: [conversation history + user message]                 │
│  - Tools: [findAndReplace, insertText]  ← NEW TOOL                 │
│  - tool_choice: 'auto'                                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               OPENAI DECIDES TO USE TOOL                            │
│  Tool: findAndReplace                                               │
│  Arguments: {                                                       │
│    search: "GDPR",                                                  │
│    replace: "TAKS",                                                 │
│    options: {                                                       │
│      matchCase: false,                                              │
│      wholeWord: true,                                               │
│      preserveCase: true                                             │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│          TOOL EXECUTOR (CREATES WIDGET) ✅                          │
│  function executeToolCall(toolCall) {                               │
│    if (toolCall.name === 'findAndReplace') {                        │
│      const widget = WidgetRegistry.createWidget(                    │
│        'findAndReplace',                                            │
│        toolCall.arguments                                           │
│      )                                                              │
│      return widget  // ← RETURNS WIDGET, NOT RESULT ✅              │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  WIDGET INITIALIZATION ✅                           │
│  class FindReplaceWidget extends WidgetPlugin {                     │
│    async initialize(editor, args) {                                 │
│      // 1. Run deterministic find algorithm                         │
│      this.matches = findAllMatches(                                 │
│        editor.state.doc,                                            │
│        args.search,                                                 │
│        args.options                                                 │
│      )                                                              │
│                                                                     │
│      // 2. Generate preview data                                    │
│      this.preview = this.matches.map(match => ({                    │
│        text: match.text,                                            │
│        lineNumber: getLineNumber(match.from),                       │
│        context: getContext(match.from, match.to)                    │
│      }))                                                            │
│                                                                     │
│      // 3. Set status to preview                                    │
│      this.status = 'preview'                                        │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  WIDGET RENDERED IN CHAT ✅                         │
│  ┌─────────────────────────────────────────────────────┐            │
│  │ 🔍 Find and Replace                                 │            │
│  ├─────────────────────────────────────────────────────┤            │
│  │ Found 5 occurrences of "GDPR"                       │            │
│  │                                                     │            │
│  │ Preview:                                            │            │
│  │ • Line 12: "...complies with GDPR regulations..."   │            │
│  │ • Line 45: "...GDPR compliance requirements..."     │            │
│  │ • Line 67: "...following GDPR guidelines..."        │            │
│  │ • Line 89: "...GDPR data protection..."             │            │
│  │ • Line 101: "...under GDPR framework..."            │            │
│  │                                                     │            │
│  │ [Replace All (5)] [Selection] [Cancel]             │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                     │
│  User can see EXACTLY what will change ✅                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   USER CLICKS "REPLACE ALL" ✅                      │
│  - User has preview ✅                                              │
│  - User makes informed decision ✅                                  │
│  - User controls execution ✅                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  WIDGET EXECUTION ✅                                │
│  async execute(userChoice: 'all' | 'selection') {                   │
│    // 1. Set status                                                 │
│    this.status = 'executing'                                        │
│                                                                     │
│    // 2. Create ProseMirror transaction                             │
│    const tr = editor.state.tr                                       │
│                                                                     │
│    // 3. Apply deterministic algorithm (reverse order)              │
│    const sortedMatches = this.matches.sort((a, b) => b.from - a.from)│
│    sortedMatches.forEach(match => {                                 │
│      tr.replaceWith(                                                │
│        match.from,                                                  │
│        match.to,                                                    │
│        schema.text(this.replacement)                                │
│      )                                                              │
│    })                                                               │
│                                                                     │
│    // 4. Dispatch transaction                                       │
│    editor.view.dispatch(tr)                                         │
│                                                                     │
│    // 5. Update status                                              │
│    this.status = 'completed'                                        │
│    this.result = {                                                  │
│      success: true,                                                 │
│      replacedCount: this.matches.length                             │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ALL 5 OCCURRENCES REPLACED ✅                          │
│  - Deterministic algorithm ensures consistency ✅                   │
│  - All matches replaced in single transaction ✅                    │
│  - ProseMirror undo/redo works ✅                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  WIDGET UPDATES UI ✅                               │
│  ┌─────────────────────────────────────────────────────┐            │
│  │ 🔍 Find and Replace                                 │            │
│  ├─────────────────────────────────────────────────────┤            │
│  │ ✓ Replaced 5 occurrences of "GDPR" with "TAKS"     │            │
│  │                                                     │            │
│  │ Changed:                                            │            │
│  │ • Line 12: GDPR → TAKS                              │            │
│  │ • Line 45: GDPR → TAKS                              │            │
│  │ • Line 67: GDPR → TAKS                              │            │
│  │ • Line 89: GDPR → TAKS                              │            │
│  │ • Line 101: GDPR → TAKS                             │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                     │
│  Accurate result message ✅                                         │
│  Widget remains in chat history ✅                                  │
└─────────────────────────────────────────────────────────────────────┘

Benefits:
✅ Preview before execution
✅ User control (approve/cancel)
✅ Replaces ALL occurrences (not just first)
✅ Accurate result messages
✅ Undo/redo supported
✅ Deterministic algorithm
✅ Widget history preserved
```

---

## 2. Widget Lifecycle Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                      WIDGET LIFECYCLE                                 │
└───────────────────────────────────────────────────────────────────────┘

     [CREATED]                       Initial state when widget spawned
         │
         │ WidgetRegistry.createWidget(toolName, args)
         │ new FindReplaceWidget(args)
         │
         ▼
    [INITIALIZING] ───────────┐      Running find algorithm
         │                    │      Generating preview data
         │                    │      Loading dependencies
         │                    │
         │ widget.initialize()│
         │                    │
         │                    │      Timeout: 30s
         │                    │      ↓
         │                    └──→ [ERROR] ──→ Show error message
         │                           Status: 'error'
         │                           message: 'Initialization failed'
         ▼
     [PREVIEW] ────────────────┐     Preview UI rendered
         │                     │     User sees matches
         │                     │     Buttons: [Execute] [Cancel]
         │                     │
         │                     │     User clicks [Cancel]
         │                     │     ↓
         │                     └──→ [CANCELLED]
         │                           Status: 'cancelled'
         │                           Widget shows "Cancelled by user"
         │
         │ User clicks [Execute]
         │
         ▼
    [EXECUTING] ──────────────┐     Running replacement algorithm
         │                    │     Dispatching ProseMirror transaction
         │                    │     Updating editor state
         │                    │
         │ widget.execute()   │
         │                    │     Execution fails (error)
         │                    │     ↓
         │                    └──→ [ERROR]
         │                           Status: 'error'
         │                           message: 'Execution failed'
         │                           [Retry] button available
         ▼
    [COMPLETED] ──────────────┐     Execution successful
         │                    │     Result displayed
         │                    │     Widget UI updated
         │
         │                    │     User clicks [Undo]
         │                    │     ↓
         │                    └──→ [UNDONE]
         │                           Status: 'undone'
         │                           Widget shows "Undone"
         │                           [Redo] button available
         ▼
    [ARCHIVED]                      Widget in chat history
                                    Read-only state
                                    No user interaction

State Transitions:
─────────────────
CREATED → INITIALIZING → PREVIEW → EXECUTING → COMPLETED → ARCHIVED
    │           │           │          │
    │           │           │          └──→ ERROR
    │           │           │
    │           │           └──────────────→ CANCELLED
    │           │
    │           └──────────────────────────→ ERROR
    │
    └──────────────────────────────────────→ ERROR (immediate failure)

State Properties:
─────────────────
type WidgetStatus =
  | 'created'      // Widget just created
  | 'initializing' // Running find algorithm
  | 'preview'      // Showing preview to user
  | 'executing'    // Running replacement
  | 'completed'    // Execution successful
  | 'cancelled'    // User cancelled
  | 'error'        // Error occurred
  | 'undone'       // User undid the action
  | 'archived'     // Widget in history (read-only)
```

---

## 3. Component Interaction Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                   COMPONENT INTERACTION FLOW                          │
└───────────────────────────────────────────────────────────────────────┘

   USER                 UI                   AI                 EDITOR
    │                   │                    │                    │
    │                   │                    │                    │
    │  "asenda GDPR→TAKS"                    │                    │
    ├──────────────────>│                    │                    │
    │                   │                    │                    │
    │                   │  sendMessage()     │                    │
    │                   ├───────────────────>│                    │
    │                   │                    │                    │
    │                   │         OpenAI API Call                 │
    │                   │                    ├────────────┐       │
    │                   │                    │            │       │
    │                   │                    │   gpt-4o   │       │
    │                   │                    │   decides  │       │
    │                   │                    │   to use   │       │
    │                   │                    │   tool     │       │
    │                   │                    │            │       │
    │                   │                    │<───────────┘       │
    │                   │                    │                    │
    │                   │  Tool Call: findAndReplace             │
    │                   │<───────────────────┤                    │
    │                   │                    │                    │
    │                   │  ToolExecutor.executeToolCall()         │
    │                   │  ┌──────────────────────────────┐       │
    │                   │  │ WidgetRegistry.createWidget()│       │
    │                   │  │   ↓                          │       │
    │                   │  │ new FindReplaceWidget()      │       │
    │                   │  │   ↓                          │       │
    │                   │  │ widget.initialize(editor)    │────>  │
    │                   │  │   ↓                          │       │
    │                   │  │ findAllMatches() ────────────┼──────>│
    │                   │  │   ↓                          │       │
    │                   │  │ return widget                │<──────┤
    │                   │  └──────────────────────────────┘       │
    │                   │                    │                    │
    │                   │  widget (preview)  │                    │
    │                   │<───────────────────┤                    │
    │                   │                    │                    │
    │                   │  WidgetRenderer    │                    │
    │                   │  renders widget    │                    │
    │  Preview UI       │  in chat           │                    │
    │<──────────────────┤                    │                    │
    │                   │                    │                    │
    │  ┌────────────────────────────────┐    │                    │
    │  │ Found 5 occurrences of "GDPR"  │    │                    │
    │  │ [Replace All] [Cancel]         │    │                    │
    │  └────────────────────────────────┘    │                    │
    │                   │                    │                    │
    │  Click [Replace All]                   │                    │
    ├──────────────────>│                    │                    │
    │                   │                    │                    │
    │                   │  widget.execute('all')                  │
    │                   ├───────────────────────────────────────> │
    │                   │                    │                    │
    │                   │                    │  createTransaction │
    │                   │                    │  replaceMatches    │
    │                   │                    │  dispatch(tr)      │
    │                   │                    │<───────────────────┤
    │                   │                    │                    │
    │                   │  result: { success: true, count: 5 }    │
    │                   │<───────────────────┤                    │
    │                   │                    │                    │
    │                   │  Update widget UI  │                    │
    │  Success Message  │  status: 'completed'                    │
    │<──────────────────┤                    │                    │
    │                   │                    │                    │
    │  ┌────────────────────────────────┐    │                    │
    │  │ ✓ Replaced 5 occurrences       │    │                    │
    │  │   GDPR → TAKS                  │    │                    │
    │  └────────────────────────────────┘    │                    │
    │                   │                    │                    │


Component Responsibilities:
───────────────────────────

┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   AIChatSidebar  │  │  ToolExecutor   │  │ WidgetRegistry   │
├──────────────────┤  ├─────────────────┤  ├──────────────────┤
│ - Render chat    │  │ - Route tools   │  │ - Plugin storage │
│ - User input     │  │ - Create widgets│  │ - Widget factory │
│ - Show messages  │  │ - No execution  │  │ - Discovery      │
│ - Render widgets │  │ - Return widget │  │ - Lifecycle mgmt │
└──────────────────┘  └─────────────────┘  └──────────────────┘

┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  WidgetRenderer  │  │  WidgetPlugin   │  │ FindReplaceWidget│
├──────────────────┤  ├─────────────────┤  ├──────────────────┤
│ - Widget UI      │  │ - Base class    │  │ - Find algorithm │
│ - Status display │  │ - Lifecycle     │  │ - Preview gen    │
│ - Action buttons │  │ - State mgmt    │  │ - Execute logic  │
│ - Result display │  │ - Interface     │  │ - UI rendering   │
└──────────────────┘  └─────────────────┘  └──────────────────┘
```

---

## 4. Folder Structure Visualization

```
ritemark-app/
├── src/
│   ├── ai/                                   # AI features
│   │   │
│   │   ├── openAIClient.ts                   # OpenAI API integration
│   │   │   ├─ chatWithOpenAI()               # Main API call
│   │   │   ├─ streamChatWithOpenAI()         # Streaming version
│   │   │   └─ buildMessages()                # Message formatting
│   │   │
│   │   ├── toolExecutor.ts                   # Tool execution routing
│   │   │   ├─ executeToolCall()              # Routes to widgets (NEW)
│   │   │   └─ legacyExecute()                # Old direct execution (DEPRECATED)
│   │   │
│   │   ├── toolDefinitions.ts                # OpenAI tool schemas
│   │   │   ├─ findAndReplaceTool             # NEW widget-based tool
│   │   │   ├─ insertTextTool                 # NEW widget-based tool
│   │   │   ├─ replaceTextTool                # OLD (to be removed)
│   │   │   └─ insertTextToolOld              # OLD (to be removed)
│   │   │
│   │   ├── widgets/                          # 🆕 Widget plugin system
│   │   │   │
│   │   │   ├── WidgetPlugin.ts               # Base class for all widgets
│   │   │   │   ├─ abstract class WidgetPlugin
│   │   │   │   ├─ initialize(editor, args)   # Setup phase
│   │   │   │   ├─ execute(userChoice)        # Execution phase
│   │   │   │   ├─ cancel()                   # Cancel action
│   │   │   │   ├─ undo()                     # Undo action
│   │   │   │   └─ getState()                 # Current state
│   │   │   │
│   │   │   ├── WidgetRegistry.ts             # Plugin management
│   │   │   │   ├─ register(name, WidgetClass)
│   │   │   │   ├─ createWidget(name, args)
│   │   │   │   ├─ getWidget(id)
│   │   │   │   └─ listWidgets()
│   │   │   │
│   │   │   ├── WidgetRenderer.tsx            # Renders widgets in chat
│   │   │   │   ├─ <WidgetRenderer widget={...} />
│   │   │   │   ├─ renderPreview()
│   │   │   │   ├─ renderExecuting()
│   │   │   │   ├─ renderCompleted()
│   │   │   │   └─ renderError()
│   │   │   │
│   │   │   └── plugins/                      # Individual widget plugins
│   │   │       │
│   │   │       └── FindReplaceWidget.tsx     # ONLY WIDGET IN INITIAL IMPLEMENTATION
│   │   │           ├─ class FindReplaceWidget extends WidgetPlugin
│   │   │           ├─ initialize()           # Find all matches
│   │   │           ├─ execute()              # Replace matches
│   │   │           ├─ renderPreview()        # Show matches
│   │   │           └─ renderCompleted()      # Show result
│   │   │
│   │   │       # FUTURE WIDGETS (Not implemented yet):
│   │   │       # ├── InsertTextWidget.tsx      # Future: Insert text plugin
│   │   │       # ├── DeleteTextWidget.tsx      # Future: Delete text plugin
│   │   │       # ├── FormatTextWidget.tsx      # Future: Format text plugin
│   │   │       # ├── TableEditorWidget.tsx     # Future: Table manipulation
│   │   │       # └── ImageUploaderWidget.tsx   # Future: Image upload
│   │   │
│   │   └── algorithms/                       # 🆕 Deterministic algorithms
│   │       │
│   │       └── findAndReplace.ts             # ONLY ALGORITHM IN INITIAL IMPLEMENTATION
│   │           ├─ findAllMatches()           # Find all occurrences
│   │           ├─ replaceMatches()           # Replace all matches
│   │           ├─ preserveCase()             # Case preservation logic
│   │           └─ wholeWordMatch()           # Whole word matching
│   │
│   │       # FUTURE ALGORITHMS (Not implemented yet):
│   │       # ├── insertText.ts               # Future: Insert text logic
│   │       # ├── deleteText.ts               # Future: Delete text logic
│   │       # └── formatText.ts               # Future: Format text logic
│   │
│   └── components/
│       │
│       └── AIChatSidebar.tsx                 # Main chat UI
│           ├─ renderMessages()               # Render chat messages
│           ├─ renderWidget()                 # Render widget in chat
│           ├─ handleSend()                   # Send message to OpenAI
│           └─ handleToolCall()               # Handle tool execution

File Count (Initial Implementation):
───────────────────────────────────
Total files: 10 (Sprint 29 initial scope)
  - Core AI: 3 (openAIClient, toolExecutor, toolDefinitions)
  - Widget System: 3 (WidgetPlugin, WidgetRegistry, WidgetRenderer)
  - Widget Plugins: 1 (FindReplaceWidget ONLY)
  - Algorithms: 1 (findAndReplace.ts ONLY)
  - UI: 1 (AIChatSidebar)
  - Tests: ~10 (1 test file per implementation file)

Future Expansion (Post-Sprint 29):
───────────────────────────────────
  - Additional Widget Plugins: InsertText, DeleteText, FormatText, TableEditor, ImageUpload
  - Additional Algorithms: insertText, deleteText, formatText, tableManipulation, imageProcessing

Dependencies (Initial Implementation):
──────────────────────────────────────
openAIClient.ts → toolExecutor.ts → WidgetRegistry → WidgetPlugin
                                  ↓
                           plugins/FindReplaceWidget.tsx (ONLY widget)
                                  ↓
                           algorithms/findAndReplace.ts (ONLY algorithm)

Future Dependencies (Post-Sprint 29):
─────────────────────────────────────
Additional plugins will extend WidgetPlugin:
  - InsertTextWidget → algorithms/insertText.ts
  - DeleteTextWidget → algorithms/deleteText.ts
  - FormatTextWidget → algorithms/formatText.ts
```

---

## 5. Plugin Registration Flow

```
┌───────────────────────────────────────────────────────────────────────┐
│                      PLUGIN REGISTRATION FLOW                         │
└───────────────────────────────────────────────────────────────────────┘

APPLICATION STARTUP
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  main.tsx (or App.tsx initialization)                               │
├─────────────────────────────────────────────────────────────────────┤
│  import { WidgetRegistry } from './ai/widgets/WidgetRegistry'       │
│  import { FindReplaceWidget } from './ai/widgets/plugins/...'       │
│  import { InsertTextWidget } from './ai/widgets/plugins/...'        │
│                                                                     │
│  // Register all built-in widgets                                  │
│  WidgetRegistry.register('findAndReplace', FindReplaceWidget)       │
│  WidgetRegistry.register('insertText', InsertTextWidget)            │
│  WidgetRegistry.register('deleteText', DeleteTextWidget)            │
│  WidgetRegistry.register('formatText', FormatTextWidget)            │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WidgetRegistry (singleton)                                         │
├─────────────────────────────────────────────────────────────────────┤
│  class WidgetRegistry {                                             │
│    private static plugins = new Map<string, typeof WidgetPlugin>()  │
│    private static instances = new Map<string, WidgetPlugin>()       │
│                                                                     │
│    static register(name: string, WidgetClass: typeof WidgetPlugin) {│
│      this.plugins.set(name, WidgetClass)                            │
│      console.log(`✅ Registered widget: ${name}`)                   │
│    }                                                                │
│                                                                     │
│    static createWidget(name: string, args: any): WidgetPlugin {     │
│      const WidgetClass = this.plugins.get(name)                     │
│      if (!WidgetClass) {                                            │
│        throw new Error(`Widget '${name}' not found`)                │
│      }                                                              │
│                                                                     │
│      const widget = new WidgetClass(args)                           │
│      const id = generateWidgetId()                                  │
│      this.instances.set(id, widget)                                 │
│      return widget                                                  │
│    }                                                                │
│                                                                     │
│    static getWidget(id: string): WidgetPlugin | undefined {         │
│      return this.instances.get(id)                                  │
│    }                                                                │
│                                                                     │
│    static listWidgets(): string[] {                                 │
│      return Array.from(this.plugins.keys())                         │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

RUNTIME (Tool Call Received)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  toolExecutor.ts                                                    │
├─────────────────────────────────────────────────────────────────────┤
│  async function executeToolCall(toolCall: ToolCall) {               │
│    const { name, arguments: args } = toolCall                       │
│                                                                     │
│    // Create widget instead of executing                            │
│    const widget = WidgetRegistry.createWidget(name, args)           │
│                                                                     │
│    // Initialize widget                                             │
│    await widget.initialize(editor, args)                            │
│                                                                     │
│    // Return widget (not execution result)                          │
│    return {                                                         │
│      type: 'widget',                                                │
│      widget                                                         │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AIChatSidebar.tsx                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  const handleToolCall = async (toolCall) => {                       │
│    const result = await executeToolCall(toolCall)                   │
│                                                                     │
│    if (result.type === 'widget') {                                  │
│      // Add widget to chat                                          │
│      setMessages(prev => [...prev, {                                │
│        role: 'widget',                                              │
│        widget: result.widget                                        │
│      }])                                                            │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  // Render widgets in chat                                          │
│  {messages.map(msg => (                                             │
│    msg.role === 'widget' ? (                                        │
│      <WidgetRenderer widget={msg.widget} />                         │
│    ) : (                                                            │
│      <MessageBubble message={msg} />                                │
│    )                                                                │
│  ))}                                                                │
└─────────────────────────────────────────────────────────────────────┘

REGISTRY STATE (After Registration)
┌─────────────────────────────────────────────────────────────────────┐
│  WidgetRegistry.plugins Map                                         │
├─────────────────────────────────────────────────────────────────────┤
│  'findAndReplace'  → FindReplaceWidget class                        │
│  'insertText'      → InsertTextWidget class                         │
│  'deleteText'      → DeleteTextWidget class                         │
│  'formatText'      → FormatTextWidget class                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  WidgetRegistry.instances Map (runtime)                             │
├─────────────────────────────────────────────────────────────────────┤
│  'widget-123'  → FindReplaceWidget instance (status: 'preview')     │
│  'widget-456'  → InsertTextWidget instance (status: 'completed')    │
│  'widget-789'  → DeleteTextWidget instance (status: 'executing')    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Widget State Machine

```
┌───────────────────────────────────────────────────────────────────────┐
│                    WIDGET STATE MACHINE                               │
└───────────────────────────────────────────────────────────────────────┘

                              ┌─────────┐
                              │ CREATED │
                              └────┬────┘
                                   │
                   WidgetRegistry.createWidget()
                   new FindReplaceWidget(args)
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  INITIALIZING    │
                         │                  │
                         │ - Run algorithm  │
                         │ - Generate data  │
                         │ - Prepare UI     │
                         └────┬─────────┬───┘
                              │         │
                    Success   │         │ Error
                              │         │
                              ▼         ▼
                         ┌─────────┐ ┌───────┐
                         │ PREVIEW │ │ ERROR │
                         │         │ └───────┘
                         │ UI:     │
                         │ - Show  │
                         │   matches│
                         │ - [Exec]│
                         │ - [Cancel]
                         └─┬───┬───┘
                           │   │
            User clicks    │   │ User clicks
            [Execute]      │   │ [Cancel]
                           │   │
                           ▼   ▼
                     ┌──────────┐  ┌───────────┐
                     │EXECUTING │  │ CANCELLED │
                     │          │  └───────────┘
                     │ - Create │
                     │   transaction
                     │ - Apply  │
                     │   changes│
                     │ - Dispatch
                     └─┬──────┬─┘
                       │      │
            Success    │      │ Error
                       │      │
                       ▼      ▼
                  ┌──────────┐ ┌───────┐
                  │COMPLETED │ │ ERROR │
                  │          │ │       │
                  │ UI:      │ │ UI:   │
                  │ - Show   │ │ - Show│
                  │   result │ │   error│
                  │ - [Undo] │ │ - [Retry]
                  └────┬─────┘ └───────┘
                       │
        User clicks    │
        [Undo]         │
                       ▼
                  ┌────────┐
                  │ UNDONE │
                  │        │
                  │ UI:    │
                  │ - Show │
                  │   undone│
                  │ - [Redo]│
                  └────┬───┘
                       │
        Time passes    │
        or new widget  │
                       ▼
                  ┌──────────┐
                  │ ARCHIVED │
                  │          │
                  │ - Read-  │
                  │   only   │
                  │ - History│
                  └──────────┘

State Properties:
─────────────────
interface WidgetState {
  status: WidgetStatus
  data?: any           // Algorithm results
  preview?: any        // Preview data
  result?: any         // Execution result
  error?: Error        // Error if failed
  timestamp: Date      // State change time
}

State Transitions:
──────────────────
CREATED       → INITIALIZING  (automatic)
INITIALIZING  → PREVIEW       (success)
INITIALIZING  → ERROR         (failure)
PREVIEW       → EXECUTING     (user clicks execute)
PREVIEW       → CANCELLED     (user clicks cancel)
EXECUTING     → COMPLETED     (success)
EXECUTING     → ERROR         (failure)
COMPLETED     → UNDONE        (user clicks undo)
COMPLETED     → ARCHIVED      (time passes)
ERROR         → INITIALIZING  (user clicks retry)
UNDONE        → COMPLETED     (user clicks redo)
CANCELLED     → ARCHIVED      (time passes)

Allowed User Actions by State:
───────────────────────────────
CREATED       → (none - automatic transition)
INITIALIZING  → (none - automatic transition)
PREVIEW       → [Execute] [Cancel]
EXECUTING     → (none - automatic transition)
COMPLETED     → [Undo]
ERROR         → [Retry] [Cancel]
UNDONE        → [Redo]
CANCELLED     → (none - final state)
ARCHIVED      → (none - read-only)
```

---

## 7. Deterministic Algorithm Flow

```
┌───────────────────────────────────────────────────────────────────────┐
│              DETERMINISTIC FIND-AND-REPLACE ALGORITHM                 │
└───────────────────────────────────────────────────────────────────────┘

INPUT:
  - document: ProseMirror document
  - searchTerm: "GDPR"
  - replacement: "TAKS"
  - options: {
      matchCase: false,
      wholeWord: true,
      preserveCase: true,
      scope: 'document'
    }

PHASE 1: FIND ALL MATCHES
┌─────────────────────────────────────────────────────────────────────┐
│  function findAllMatches(doc, searchTerm, options)                  │
├─────────────────────────────────────────────────────────────────────┤
│  const matches = []                                                 │
│  let position = 0                                                   │
│                                                                     │
│  // Traverse document linearly                                      │
│  doc.descendants((node, pos) => {                                   │
│    if (node.isText) {                                               │
│      const text = node.text                                         │
│      let searchIndex = 0                                            │
│                                                                     │
│      while (true) {                                                 │
│        // Find next occurrence                                      │
│        const index = options.matchCase                              │
│          ? text.indexOf(searchTerm, searchIndex)                    │
│          : text.toLowerCase().indexOf(                              │
│              searchTerm.toLowerCase(),                              │
│              searchIndex                                            │
│            )                                                        │
│                                                                     │
│        if (index === -1) break                                      │
│                                                                     │
│        // Whole word check (if enabled)                             │
│        if (options.wholeWord) {                                     │
│          const before = text[index - 1]                             │
│          const after = text[index + searchTerm.length]              │
│          if (isWordChar(before) || isWordChar(after)) {             │
│            searchIndex = index + 1                                  │
│            continue  // Skip this match                             │
│          }                                                          │
│        }                                                            │
│                                                                     │
│        // Found a valid match                                       │
│        matches.push({                                               │
│          from: pos + index + 1,                                     │
│          to: pos + index + 1 + searchTerm.length,                   │
│          text: text.substring(index, index + searchTerm.length),    │
│          lineNumber: getLineNumber(pos + index + 1),                │
│          context: getContext(text, index, searchTerm.length)        │
│        })                                                           │
│                                                                     │
│        searchIndex = index + 1                                      │
│      }                                                              │
│    }                                                                │
│  })                                                                 │
│                                                                     │
│  return matches  // DETERMINISTIC: Same input always yields same matches│
└─────────────────────────────────────────────────────────────────────┘

PHASE 2: GENERATE PREVIEW
┌─────────────────────────────────────────────────────────────────────┐
│  function generatePreview(matches)                                  │
├─────────────────────────────────────────────────────────────────────┤
│  return matches.map(match => ({                                     │
│    lineNumber: match.lineNumber,                                    │
│    text: match.text,                                                │
│    context: match.context,                                          │
│    position: { from: match.from, to: match.to }                     │
│  }))                                                                │
└─────────────────────────────────────────────────────────────────────┘

PHASE 3: USER APPROVAL
┌─────────────────────────────────────────────────────────────────────┐
│  Widget UI shows preview:                                           │
│  ┌─────────────────────────────────────────────────┐                │
│  │ Found 5 occurrences of "GDPR"                   │                │
│  │                                                 │                │
│  │ • Line 12: "...complies with GDPR regulations..."│                │
│  │ • Line 45: "...GDPR compliance requirements..." │                │
│  │ • Line 67: "...following GDPR guidelines..."    │                │
│  │ • Line 89: "...GDPR data protection..."         │                │
│  │ • Line 101: "...under GDPR framework..."        │                │
│  │                                                 │                │
│  │ [Replace All (5)]  [Cancel]                     │                │
│  └─────────────────────────────────────────────────┘                │
│                                                                     │
│  User clicks [Replace All (5)]                                      │
└─────────────────────────────────────────────────────────────────────┘

PHASE 4: REPLACE ALL MATCHES (DETERMINISTIC)
┌─────────────────────────────────────────────────────────────────────┐
│  function replaceMatches(editor, matches, replacement, options)     │
├─────────────────────────────────────────────────────────────────────┤
│  // CRITICAL: Sort matches in REVERSE order (high to low position)  │
│  // This ensures earlier positions stay valid after replacements    │
│  const sortedMatches = matches.sort((a, b) => b.from - a.from)      │
│                                                                     │
│  // Create single transaction for all replacements                  │
│  let tr = editor.state.tr                                           │
│                                                                     │
│  // Apply all replacements in single transaction                    │
│  sortedMatches.forEach(match => {                                   │
│    const replacementText = options.preserveCase                     │
│      ? preserveCase(match.text, replacement)                        │
│      : replacement                                                  │
│                                                                     │
│    // Replace text at this position                                 │
│    tr.replaceWith(                                                  │
│      match.from,                                                    │
│      match.to,                                                      │
│      schema.text(replacementText)                                   │
│    )                                                                │
│  })                                                                 │
│                                                                     │
│  // Dispatch single transaction (supports undo/redo)                │
│  editor.view.dispatch(tr)                                           │
│                                                                     │
│  return {                                                           │
│    success: true,                                                   │
│    replacedCount: matches.length                                    │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

PHASE 5: CASE PRESERVATION (if enabled)
┌─────────────────────────────────────────────────────────────────────┐
│  function preserveCase(original: string, replacement: string)       │
├─────────────────────────────────────────────────────────────────────┤
│  // ALL UPPERCASE → ALL UPPERCASE                                   │
│  if (original === original.toUpperCase()) {                         │
│    return replacement.toUpperCase()                                 │
│    // "GDPR" → "TAKS"                                               │
│  }                                                                  │
│                                                                     │
│  // First letter uppercase → First letter uppercase                 │
│  if (original[0] === original[0].toUpperCase()) {                   │
│    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase()│
│    // "Gdpr" → "Taks"                                               │
│  }                                                                  │
│                                                                     │
│  // all lowercase → all lowercase                                   │
│  return replacement.toLowerCase()                                   │
│  // "gdpr" → "taks"                                                 │
└─────────────────────────────────────────────────────────────────────┘

OUTPUT:
  - All 5 occurrences replaced in single transaction
  - GDPR → TAKS (case preserved)
  - Undo/redo works (single transaction)
  - Deterministic (same input always yields same output)

EXAMPLE EXECUTION:
──────────────────
Input document:
  "We comply with GDPR regulations. The GDPR compliance is mandatory.
   Following gdpr guidelines is important. The Gdpr framework defines
   data protection under GDPR."

Matches found (5):
  1. Line 1, pos 16: "GDPR" (ALL CAPS)
  2. Line 1, pos 45: "GDPR" (ALL CAPS)
  3. Line 2, pos 10: "gdpr" (all lowercase)
  4. Line 2, pos 40: "Gdpr" (Title Case)
  5. Line 3, pos 22: "GDPR" (ALL CAPS)

Replacement with preserveCase: true
  1. "GDPR" → "TAKS" (ALL CAPS preserved)
  2. "GDPR" → "TAKS" (ALL CAPS preserved)
  3. "gdpr" → "taks" (all lowercase preserved)
  4. "Gdpr" → "Taks" (Title Case preserved)
  5. "GDPR" → "TAKS" (ALL CAPS preserved)

Output document:
  "We comply with TAKS regulations. The TAKS compliance is mandatory.
   Following taks guidelines is important. The Taks framework defines
   data protection under TAKS."

✅ DETERMINISTIC: Same input always produces same output
✅ CONSISTENT: All matches replaced uniformly
✅ REVERSIBLE: Single transaction supports undo
```

---

## 🎯 Key Architectural Decisions

### 1. Widget-Based Execution (Not Direct)
**Reason**: User control, preview, deterministic execution

### 2. Plugin Architecture
**Reason**: Extensibility, maintainability, separation of concerns

### 3. Deterministic Algorithms
**Reason**: Consistency, predictability, testability

### 4. Single Transaction for Bulk Operations
**Reason**: Undo/redo support, atomic operations

### 5. Registry Pattern for Plugin Management
**Reason**: Loose coupling, easy plugin addition/removal

### 6. State Machine for Widget Lifecycle
**Reason**: Clear state transitions, predictable behavior

---

**Status**: ✅ Architecture documented
**Next Steps**: Implement Phase 1 (Widget Plugin System)
**References**:
- `/docs/sprints/sprint-29/phase-breakdown.md` - Implementation phases
- `/docs/sprints/sprint-29/sprint-29-ai-enhancements.md` - Sprint overview
