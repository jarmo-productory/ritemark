# Sprint 22: Detailed Implementation Plan

**Goal**: Validate client-side AI tool execution with TipTap editor

---

## 📋 Task Breakdown

### Phase 1: Research & Design (4-6 hours)

#### Task 1.1: Analyze TipTap Command API
**Objective**: Understand how to programmatically manipulate TipTap editor

**Subtasks:**
- [ ] Read TipTap Commands API documentation
- [ ] Identify commands needed for `replaceText` tool
- [ ] Test basic command execution in browser console
- [ ] Document command syntax and parameters

**Deliverable**: `tiptap-commands-reference.md` with tested examples

**Acceptance Criteria:**
- Can execute `editor.commands.insertContentAt()` in console
- Understand position/range parameters
- Know how to get current editor content for context

---

#### Task 1.2: Design Tool Specification
**Objective**: Define `replaceText` tool interface

**Tool Specification:**
```typescript
interface ReplaceTextTool {
  name: "replaceText"
  description: "Replace text in the editor from position A to position B"
  parameters: {
    from: number      // Start position (character index)
    to: number        // End position (character index)
    newText: string   // Replacement text
  }
  execute: (editor: Editor, params: Parameters) => boolean
}
```

**Subtasks:**
- [ ] Define TypeScript interface for tool
- [ ] Specify parameter validation rules
- [ ] Design error handling (what if from > to?)
- [ ] Document TipTap command mapping

**Deliverable**: `tiptap-tools-spec.md` with `replaceText` specification

**Acceptance Criteria:**
- TypeScript interface compiles
- All edge cases considered (empty text, invalid range, etc.)
- Clear mapping to TipTap commands documented

---

### Phase 2: Implementation (6-8 hours)

#### Task 2.1: Create AI Tool Executor Service
**Objective**: Build service that executes tools on TipTap editor

**File**: `src/services/ai/toolExecutor.ts`

**Implementation:**
```typescript
import { Editor } from '@tiptap/react'

export interface ToolCall {
  tool: string
  arguments: Record<string, any>
}

export class ToolExecutor {
  constructor(private editor: Editor) {}

  execute(toolCall: ToolCall): boolean {
    switch (toolCall.tool) {
      case 'replaceText':
        return this.replaceText(toolCall.arguments)
      default:
        console.error(`Unknown tool: ${toolCall.tool}`)
        return false
    }
  }

  private replaceText(args: { from: number; to: number; newText: string }): boolean {
    const { from, to, newText } = args

    // Validate parameters
    if (from < 0 || to < from || to > this.editor.state.doc.content.size) {
      console.error('Invalid range')
      return false
    }

    // Execute TipTap command
    return this.editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, newText)
      .run()
  }
}
```

**Subtasks:**
- [ ] Create `toolExecutor.ts` service
- [ ] Implement `replaceText` method with validation
- [ ] Add error handling and logging
- [ ] Export service from `src/services/ai/index.ts`

**Acceptance Criteria:**
- TypeScript compiles with zero errors
- Service can be instantiated with TipTap editor instance
- `replaceText` method executes successfully in test

---

#### Task 2.2: Create Fake AI Command Parser
**Objective**: Simulate AI tool calling without real LLM

**File**: `src/services/ai/fakeAI.ts`

**Implementation:**
```typescript
export interface AICommand {
  intent: string
  toolCall: ToolCall
}

export class FakeAI {
  parse(userInput: string): AICommand | null {
    // Simple pattern matching (fake AI intelligence)
    const replaceMatch = userInput.match(/replace ["'](.+?)["'] with ["'](.+?)["']/i)

    if (replaceMatch) {
      const [_, oldText, newText] = replaceMatch

      // Find position of oldText in editor (simplified - assumes first occurrence)
      // In real implementation, AI would specify position or we'd use findText tool

      return {
        intent: `Replace "${oldText}" with "${newText}"`,
        toolCall: {
          tool: 'replaceText',
          arguments: {
            from: 0,  // Hardcoded for POC - will be dynamic in real version
            to: oldText.length,
            newText: newText
          }
        }
      }
    }

    return null
  }
}
```

**Subtasks:**
- [ ] Create `fakeAI.ts` with basic pattern matching
- [ ] Support command: `replace "X" with "Y"`
- [ ] Return tool call structure that ToolExecutor can execute
- [ ] Add tests for pattern matching

**Acceptance Criteria:**
- Parses `replace "hello" with "goodbye"` correctly
- Returns null for unrecognized commands
- TypeScript compiles

---

#### Task 2.3: Create POC UI Component
**Objective**: Simple UI to test AI tool execution

**File**: `src/components/ai/AICommandPOC.tsx`

**Implementation:**
```typescript
import { useState } from 'react'
import { useEditor } from '@tiptap/react'
import { ToolExecutor } from '@/services/ai/toolExecutor'
import { FakeAI } from '@/services/ai/fakeAI'

export function AICommandPOC({ editor }: { editor: Editor }) {
  const [command, setCommand] = useState('')
  const [result, setResult] = useState('')

  const handleExecute = () => {
    const fakeAI = new FakeAI()
    const parsed = fakeAI.parse(command)

    if (!parsed) {
      setResult('❌ Command not recognized')
      return
    }

    const executor = new ToolExecutor(editor)
    const success = executor.execute(parsed.toolCall)

    setResult(success
      ? `✅ Executed: ${parsed.intent}`
      : `❌ Execution failed`
    )
  }

  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-bold mb-2">AI Command POC</h3>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder='Try: replace "hello" with "goodbye"'
        className="w-full border p-2 rounded mb-2"
      />
      <button
        onClick={handleExecute}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Execute
      </button>
      {result && <p className="mt-2">{result}</p>}
    </div>
  )
}
```

**Subtasks:**
- [ ] Create `AICommandPOC.tsx` component
- [ ] Add to `Editor.tsx` (temporary - for testing only)
- [ ] Style with Tailwind (minimal, functional)
- [ ] Add to app for manual testing

**Acceptance Criteria:**
- Component renders in app
- Can type command and click Execute
- See success/failure feedback
- Editor updates visually when command executes

---

### Phase 3: Testing & Validation (2-4 hours)

#### Task 3.1: Manual Browser Testing
**Objective**: Validate POC works in real browser environment

**Test Scenarios:**
1. **Basic replacement**: Type "hello world" → Execute `replace "hello" with "goodbye"` → See "goodbye world"
2. **Undo functionality**: Execute command → Press Cmd+Z → See original text restored
3. **Invalid command**: Type gibberish → See error message
4. **Edge case - empty editor**: Execute command on empty document → Graceful error
5. **Edge case - selection**: Select text → Execute command → Verify behavior

**Deliverable**: `testing-results.md` with screenshots and findings

**Acceptance Criteria:**
- All 5 test scenarios documented
- Screenshots showing before/after
- Any bugs discovered are documented
- Decision on "ready for Sprint 24" or "need Sprint 23"

---

#### Task 3.2: TypeScript & Build Validation
**Objective**: Ensure code quality

**Checks:**
```bash
npm run type-check      # Zero TypeScript errors
npm run lint            # Zero ESLint warnings
npm run build           # Successful production build
```

**Acceptance Criteria:**
- All checks pass
- No console errors in browser
- Bundle size increase < 20KB

---

### Phase 4: Documentation & Decision (2-3 hours)

#### Task 4.1: Document Findings
**Objective**: Capture learnings for architecture decision

**Deliverable**: `sprint-22-results.md`

**Sections:**
1. **What Worked**
   - Client-side execution performance
   - TipTap command reliability
   - Undo functionality

2. **What Didn't Work**
   - Any issues with editor state
   - Browser compatibility problems
   - Unexpected edge cases

3. **Pros of Client-Side Approach**
   - Performance (latency)
   - Direct editor manipulation
   - Undo/redo support

4. **Cons of Client-Side Approach**
   - Complexity
   - Security concerns
   - Tool validation challenges

**Acceptance Criteria:**
- Honest assessment of POC
- Clear pros/cons list
- Recommendation: Proceed to Sprint 24 or Sprint 23?

---

#### Task 4.2: Architecture Decision Checkpoint
**Objective**: Decide next sprint

**Decision Matrix:**

| Criteria | Client-Side (Sprint 22) | Server-Side (Sprint 23) | Recommendation |
|----------|-------------------------|-------------------------|----------------|
| Performance | ⚡ Fast (no network) | 🐢 Slower (round-trip) | ? |
| Editor State | ✅ Preserves state | ⚠️ Loses selection/cursor | ? |
| Complexity | ⚠️ Complex | ✅ Simple | ? |
| Security | ⚠️ Need validation | ✅ Server-controlled | ? |
| Undo/Redo | ✅ Works naturally | ⚠️ Need custom handling | ? |

**Decision:**
- ✅ **Proceed to Sprint 24** (skip Sprint 23) if client-side POC is clearly superior
- ⚠️ **Proceed to Sprint 23** if significant concerns remain
- 🔄 **Do both** if need to compare architectures empirically

---

## 🎯 Sprint Success Criteria

**Minimum Viable POC:**
- [ ] User can type command in UI
- [ ] Command executes TipTap editor change
- [ ] Visual feedback shows success/failure
- [ ] Undo works (Cmd+Z reverts change)
- [ ] TypeScript compiles with zero errors
- [ ] Works in Chrome/Safari/Firefox

**Documentation Complete:**
- [ ] `tiptap-tools-spec.md` exists with `replaceText` spec
- [ ] `testing-results.md` shows manual test results
- [ ] `sprint-22-results.md` documents findings and recommendation
- [ ] Updated roadmap.md with next sprint decision

**Clear Path Forward:**
- [ ] Decision made: Sprint 23 or Sprint 24?
- [ ] If Sprint 24: Architecture locked, ready to build real AI
- [ ] If Sprint 23: Understand what to test in server-side POC

---

## 🚫 Out of Scope

**Do NOT implement in Sprint 22:**
- ❌ Real LLM API calls (OpenAI/Anthropic)
- ❌ Multiple tools (only `replaceText`)
- ❌ Production UI/UX (just functional demo)
- ❌ Streaming responses
- ❌ Advanced error handling
- ❌ Security hardening
- ❌ Performance optimization
- ❌ Mobile testing (desktop browser only)

---

## 📦 Deliverables Checklist

- [ ] `src/services/ai/toolExecutor.ts` - Tool execution service
- [ ] `src/services/ai/fakeAI.ts` - Command parser (fake AI)
- [ ] `src/components/ai/AICommandPOC.tsx` - POC UI component
- [ ] `docs/sprints/sprint-22/tiptap-tools-spec.md` - Tool specification
- [ ] `docs/sprints/sprint-22/testing-results.md` - Manual test results
- [ ] `docs/sprints/sprint-22/sprint-22-results.md` - Findings and recommendation
- [ ] Updated `docs/roadmap.md` - Next sprint decision

---

## 🔗 References

**TipTap Documentation:**
- https://tiptap.dev/docs/editor/api/commands
- https://tiptap.dev/docs/editor/core-concepts/transactions
- https://tiptap.dev/docs/editor/api/editor

**Related Sprint Docs:**
- `/docs/sprints/sprint-8/` - TipTap editor foundation
- `/docs/research/agents/deep-research/research-brief-tiptap-ai-agent.md` - AI integration research

**Architecture Research:**
- Research Brief Section 2: Client vs Server Tool Execution
- Research Brief Section 3: TipTap Tool Design

---

**Estimated Effort**: 14-21 hours
**Target Duration**: 2-3 days
**Risk Level**: Medium (architecture validation)
