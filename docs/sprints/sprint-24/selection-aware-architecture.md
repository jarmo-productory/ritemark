# Sprint 24: Selection-Aware Architecture - Critical Design Update

**Status**: 📋 Architecture Refinement
**Date**: November 4, 2025
**Impact**: MAJOR - Changes core user interaction model

---

## 🎯 The Key Insight

**User Observation**: "Chat should be aware of the selected text"

**Why This Matters**: Users expect AI to "see" what they've selected, just like any other editor feature (Bold button, Copy, etc.). This is NOT an optional enhancement - it's a **core user expectation** based on decades of text editor UX patterns.

---

## 🧠 User Mental Model

**When I select text and click "Bold" button** → Text becomes bold ✅
**When I select text and say "make this bold" to AI** → AI should know "this" = selection ✅

**Google Docs Model** (What Users Expect):
1. Select text
2. Click feature button
3. Feature acts on selection

**RiteMark AI Model** (What We Must Build):
1. Select text
2. Tell AI what to do
3. AI acts on selection (because AI "sees" it)

---

## ❌ What Would Fail Without Selection Context

**Bad UX** (Without Selection Awareness):
```
User: [selects "This paragraph needs work"]
User: "make this bold"
AI: "What text do you want to make bold?"
User: 😡 "I JUST SELECTED IT!"
```

**Good UX** (With Selection Awareness):
```
User: [selects "This paragraph needs work"]
AI Chat Shows: 📝 Selected: "This paragraph needs work" (5 words)
User: "make this bold"
AI: ✅ Applied bold to selected text
```

---

## 🏗️ Architecture Changes Required

### 1. State Management (NEW)

**What**: Track editor selection in real-time and pass to ChatSidebar

**Where**: Editor parent component (App.tsx or EditorContainer.tsx)

**How**:
```typescript
const [currentSelection, setCurrentSelection] = useState<EditorSelection>({
  text: '',
  from: 0,
  to: 0,
  isEmpty: true
})

useEffect(() => {
  if (!editor) return

  const updateSelection = () => {
    const { from, to, empty } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')

    setCurrentSelection({
      text,
      from,
      to,
      isEmpty: empty,
      wordCount: text.split(/\s+/).filter(Boolean).length
    })
  }

  editor.on('selectionUpdate', updateSelection)
  editor.on('transaction', updateSelection)

  return () => {
    editor.off('selectionUpdate', updateSelection)
    editor.off('transaction', updateSelection)
  }
}, [editor])
```

---

### 2. ChatSidebar Props (BREAKING CHANGE)

**Before (Sprint 23)**:
```typescript
<AIChatSidebar editor={editor} />
```

**After (Sprint 24)**:
```typescript
<AIChatSidebar
  editor={editor}
  selection={currentSelection}  // NEW PROP
/>
```

---

### 3. Selection UI Indicator (NEW Component)

**Purpose**: Show user what AI "sees"

**Visual Design**:
```
┌─────────────────────────────────────┐
│ 📝 Selected Text (47 words)         │
│ "This paragraph needs improvement"  │
│ [Clear Selection]                    │
├─────────────────────────────────────┤
│ Chat messages...                     │
└─────────────────────────────────────┘
```

**When No Selection**:
```
┌─────────────────────────────────────┐
│ 💡 Tip: Select text to give AI     │
│    context                           │
├─────────────────────────────────────┤
│ Chat messages...                     │
└─────────────────────────────────────┘
```

---

### 4. AI System Prompt (BREAKING CHANGE)

**Before (Sprint 23)**:
```typescript
const messages = [
  { role: 'user', content: userPrompt }
]
```

**After (Sprint 24)**:
```typescript
const messages = [
  {
    role: 'system',
    content: selection.isEmpty
      ? 'You are editing a document. No text is currently selected.'
      : `You are editing a document. Currently selected text: "${selection.text}"\n\nWhen the user says "this" or "selected text", they are referring to the text above.`
  },
  { role: 'user', content: userPrompt }
]
```

**Why This Works**: GPT-5-mini is EXCELLENT at understanding contextual references like "this" when given explicit context.

---

### 5. Tool Executors (BREAKING CHANGE)

**Before (Sprint 23)**:
```typescript
async function executeReplaceText(
  editor: Editor,
  params: ReplaceTextParams
): Promise<ToolResult>
```

**After (Sprint 24)**:
```typescript
async function executeReplaceText(
  editor: Editor,
  params: ReplaceTextParams,
  selection: EditorSelection  // NEW PARAMETER
): Promise<ToolResult>
```

**Why**: Tools need selection context to handle commands like:
- "replace this with..." (this = selection.text)
- "make this bold" (this = selection.from/to)
- "add examples after this" (this = selection anchor point)

---

## 📊 Impact Analysis

### High Impact Changes (MUST DO)

1. ✅ Add selection state management to Editor parent
2. ✅ Update `executeCommand` signature to accept selection
3. ✅ Pass selection to all tool executors
4. ✅ Include selection in AI system prompt

**Risk**: BREAKING CHANGES - All Sprint 23 code must be updated

**Mitigation**: Clear migration path documented in tool-design.md

---

### Medium Impact Changes (SHOULD DO)

1. ✅ Add SelectionIndicator UI component to ChatSidebar
2. ✅ Show visual feedback when selection changes
3. ✅ Add "Clear Selection" button

**Risk**: UX inconsistency if skipped

**Mitigation**: Can be added incrementally after core functionality works

---

### Low Impact Changes (NICE TO HAVE)

1. Smart command suggestions based on selection
2. Toast notifications when selection changes
3. Selection-aware autocomplete

**Risk**: None - Pure enhancements

**Mitigation**: Defer to Sprint 25+ if needed

---

## 🎯 User Workflows (Selection-First)

### Workflow 1: "Improve Selected Paragraph"

**User Journey**:
1. User reads document, finds weak paragraph
2. **Selects paragraph with mouse** (natural gesture)
3. Opens chat sidebar
4. Sees: "📝 Selected: [first 100 chars]"
5. Says: "make this more professional"
6. AI: Understands "this" = selection.text
7. Tool: `replaceText(selection.text, improvedVersion)`
8. Result: Paragraph improved, selection preserved

**Success Metrics**:
- Zero confusion about what "this" means
- No need to copy/paste text into chat
- Feels like using Bold button

---

### Workflow 2: "Format Selection"

**User Journey**:
1. User selects "Important Note:"
2. Chat shows: "📝 Selected: 'Important Note:' (2 words)"
3. User: "make this bold and heading 2"
4. AI: Chains 2 tools
   - `applyFormatting({ type: 'selection' }, { type: 'bold' })`
   - `applyFormatting({ type: 'selection' }, { type: 'heading', level: 2 })`
5. Result: Text is now bold heading 2

**Why Selection Context Matters**:
- Without it: AI would ask "which text?"
- With it: AI uses selection.from/to directly
- Zero friction, instant result

---

### Workflow 3: "Add Content After Selection"

**User Journey**:
1. User selects introduction paragraph
2. Chat shows selection
3. User: "add 3 examples after this"
4. AI: Understands "this" = selection
5. Tool: `insertText({ type: 'relative', anchor: selection.text, placement: 'after' }, examples)`
6. Result: Examples added right after introduction

**Alternative Without Selection**:
- User would have to describe where to insert ("after the introduction paragraph that starts with...")
- Fragile - breaks if user edits introduction
- Verbose - more typing required

---

## 🔧 Technical Implementation Details

### EditorSelection Interface

```typescript
interface EditorSelection {
  text: string        // Plain text content
  from: number        // TipTap position (start)
  to: number          // TipTap position (end)
  isEmpty: boolean    // True if no selection
  wordCount?: number  // For UI display
}
```

**Why These Fields**:
- `text`: For AI context and text search
- `from/to`: For tool execution (formatting, insertion)
- `isEmpty`: For conditional logic (show/hide UI)
- `wordCount`: For user feedback ("47 words selected")

---

### Event Listeners (Performance Consideration)

**TipTap Events Used**:
- `selectionUpdate`: Fired when selection changes
- `transaction`: Fired on every document change

**Why Both**:
- Some selection changes don't trigger `selectionUpdate`
- `transaction` catches all changes but fires more often
- Using both ensures we never miss a selection change

**Performance**:
- Events are cheap (just reading editor state)
- Debouncing NOT needed (state updates are fast)
- No re-renders if selection text hasn't changed (React memo)

---

### AI Prompt Engineering (Critical for Tool Selection)

**System Prompt Strategy**:
```typescript
// ALWAYS include selection context (even if empty)
const systemPrompt = selection.isEmpty
  ? 'You are editing a document. No text is currently selected.'
  : `You are editing a document. Currently selected text: "${selection.text}"\n\nWhen the user says "this" or "selected text", they are referring to the text above.`
```

**Why This Works**:
1. GPT-5-mini excellent at contextual reference resolution
2. Explicit mapping: "this" → selection.text
3. Handles edge case: No selection (don't hallucinate)

**Example Resolution**:
```
User: "make this bold"
System: "Currently selected text: 'Hello world'"

AI understands:
- "this" refers to "Hello world"
- User wants bold formatting
- Use applyFormatting({ type: 'selection' }, { type: 'bold' })
```

---

## 🚨 Migration from Sprint 23

### Breaking Changes Summary

| Component | Sprint 23 | Sprint 24 | Migration Effort |
|-----------|-----------|-----------|------------------|
| `executeCommand` | `(prompt, editor)` | `(prompt, editor, selection)` | Medium |
| Tool executors | `(editor, params)` | `(editor, params, selection)` | Low |
| ChatSidebar props | `{ editor }` | `{ editor, selection }` | Low |
| AI system prompt | User message only | System + user messages | Medium |

**Total Estimated Migration Time**: 2-3 hours

---

### Step-by-Step Migration

**Step 1: Add Selection State (15 min)**
```typescript
// In App.tsx or Editor parent
const [selection, setSelection] = useState<EditorSelection>(...)
useEffect(() => { /* selection tracking */ }, [editor])
```

**Step 2: Update ChatSidebar (10 min)**
```typescript
<AIChatSidebar
  editor={editor}
  selection={selection}  // Pass new prop
/>
```

**Step 3: Update executeCommand (30 min)**
```typescript
// Add selection parameter
async function executeCommand(
  prompt: string,
  editor: Editor,
  selection: EditorSelection  // NEW
)

// Update system prompt to include selection
const messages = [
  { role: 'system', content: buildSelectionContext(selection) },
  { role: 'user', content: prompt }
]
```

**Step 4: Update Tool Executors (60 min)**
```typescript
// Add selection parameter to all 3 tools
executeReplaceText(editor, params, selection)
executeInsertText(editor, params, selection)
executeApplyFormatting(editor, params, selection)
```

**Step 5: Add UI Components (45 min)**
```typescript
// Create SelectionIndicator component
// Add to ChatSidebar
<SelectionIndicator selection={selection} />
```

**Step 6: Testing (30 min)**
```typescript
// Test selection-aware commands
"make this bold"  // With selection
"make this bold"  // Without selection (should error)
"improve this"    // With selection
```

---

## ✅ Updated Definition of Done

Sprint 24 is complete when:

**Selection Awareness**:
1. ✅ Chat sidebar shows what text is currently selected
2. ✅ AI understands "this" refers to selection
3. ✅ Commands like "make this bold" work when text is selected
4. ✅ Helpful error when user says "make this bold" with no selection

**Tool Functionality**:
5. ✅ `insertText` tool works with 3 position strategies
6. ✅ `applyFormatting` tool works with 3 target strategies
7. ✅ All 3 tools accept selection context parameter

**UX**:
8. ✅ Selection indicator updates in real-time
9. ✅ Word count shown for selections
10. ✅ Clear selection button works

**Testing**:
11. ✅ 30+ unit tests passing (10 per tool)
12. ✅ 10+ integration tests for multi-tool workflows
13. ✅ Selection-aware commands tested in browser

---

## 📈 Success Metrics (Updated)

### User Experience Metrics

**Selection Usage Rate**:
- Target: >70% of AI commands use selection context
- Measure: Track `selection.isEmpty` when `executeCommand` called

**Contextual Command Success**:
- Target: >90% of "this"/"that" commands resolve correctly
- Measure: Tool execution success rate when user says "this"

**User Confusion Events**:
- Target: <5% of commands result in "I don't understand"
- Measure: Error responses from AI

**Manual Editing Fallback**:
- Target: <15% of tasks require manual editing after AI attempt
- Measure: User actions after AI command completes

---

## 🔮 Future Enhancements (Beyond Sprint 24)

### Advanced Selection Features

**Multi-Selection Support**:
- Users select multiple non-contiguous text blocks
- AI acts on ALL selections simultaneously
- Example: "make all these bold" with 3 selections

**Selection History**:
- Remember last 5 selections
- User can say "use the previous selection"
- Useful for complex multi-step edits

**Smart Selection Expansion**:
- User selects part of word → AI expands to full word
- User selects partial sentence → AI expands to full sentence
- Intent-aware expansion based on command type

**Selection Suggestions**:
- AI suggests what to select
- "Would you like to select the entire paragraph?"
- Helpful when user command is ambiguous

---

## 📚 Key Takeaways

1. **Selection awareness is NOT optional** - It's how users expect all editor features to work
2. **"This" is the most common pronoun in editing commands** - Must resolve correctly
3. **Visual feedback builds trust** - Users need to see that AI "sees" their selection
4. **Breaking changes are justified** - Better to fix architecture now than accumulate tech debt
5. **Google Docs is the UX benchmark** - Users come with those expectations

---

**Last Updated**: November 4, 2025
**Impact**: CRITICAL - Changes core interaction model
**Approval Required**: Yes - Breaking changes to Sprint 23 code
**Estimated Implementation**: 2-3 hours for migration + 1 day for new features
