# Sprint 24: JTBD Research - What Users Actually Need from AI Writing Assistant

**Status**: 🔍 Research Phase
**Date**: November 4, 2025
**Focus**: Jobs To Be Done framework - user needs first, technology second

---

## 🎯 Core Question: What Jobs Do Users Hire the AI For?

When users click the AI chat button, what are they **actually trying to accomplish**? Not "what features do they want" but "what outcome are they seeking"?

### Jobs Users Want Done (Observed from Sprint 23)

1. **Job: Fix embarrassing typos in published documents**
   - User Story: "I shared a doc with my team and just noticed I misspelled 'definately' everywhere"
   - Current Solution: Find each instance manually, click, fix
   - Desired Outcome: "replace 'definately' with 'definitely'" → Done
   - Pain Point: Repetitive clicking, risk of missing instances

2. **Job: Improve weak writing without rewriting from scratch**
   - User Story: "This paragraph is too informal for a client proposal"
   - Current Solution: Select text, rewrite manually, hope it's better
   - Desired Outcome: AI suggests professional alternative, user approves/rejects
   - Pain Point: Hard to judge own writing objectively

3. **Job: Add missing content without disrupting flow**
   - User Story: "I need to add examples after this paragraph but I'm in the zone"
   - Current Solution: Place cursor, break concentration, think of examples
   - Desired Outcome: "add 3 examples after this paragraph" → AI inserts them
   - Pain Point: Breaking writing flow kills momentum

4. **Job: Make text consistent with style guide**
   - User Story: "Make all headings Title Case" or "Bold all product names"
   - Current Solution: Search for each, format manually
   - Desired Outcome: AI applies formatting consistently across document
   - Pain Point: Tedious, error-prone, hard to catch all instances

5. **Job: Transform structure without losing content**
   - User Story: "Convert this numbered list into bullet points" or "Make this paragraph into a table"
   - Current Solution: Copy, delete, recreate structure, paste
   - Desired Outcome: AI restructures while preserving content
   - Pain Point: Risk of losing content during manual restructuring

---

## 🎯 CRITICAL UX PRINCIPLE: Selection-Aware Chat

**User Mental Model**: "If I select text, the AI sees it"

### The Selection Context Problem

**What Users Expect** (Google Docs model):
1. User selects text: "This paragraph needs work"
2. User clicks "Bold" button → Text becomes bold
3. **OR** User says to AI: "make this bold" → AI knows "this" = selection

**What Users DON'T Expect** (broken mental model):
1. User selects text
2. AI asks: "What text do you want to make bold?"
3. User thinks: "I just selected it! Aren't you watching?" 😡

### Why This Matters

**Selection context is the PRIMARY way users interact with text editors:**
- Google Docs: Select → Format button
- Microsoft Word: Select → Right-click menu
- VS Code: Select → Command palette
- **RiteMark AI**: Select → Tell AI what to do with selection

**User Commands That Assume Selection Context**:
- "make this bold" (THIS = current selection)
- "improve this" (THIS = current selection)
- "rewrite this professionally" (THIS = current selection)
- "add examples after this" (THIS = current selection)
- "convert this to a list" (THIS = current selection)

### Technical Implementation Requirements

**Chat Sidebar Must Know**:
1. ✅ What text is currently selected (if any)
2. ✅ Selection position (from/to) for tool calls
3. ✅ Selection content (for AI context)
4. ✅ When selection changes (real-time updates)

**AI Prompt Engineering**:
```typescript
// EVERY message to AI includes selection context
const messages = [
  {
    role: 'system',
    content: `You are editing a document. Current selection: "${selectedText || 'none'}"`
  },
  {
    role: 'user',
    content: userCommand  // "make this bold"
  }
]
```

**Tool Execution**:
```typescript
// When user says "make this bold"
// AI knows to use selection target (not text search)
applyFormatting(
  { type: 'selection' },  // Use current selection (AI was told about it)
  { type: 'bold' }
)
```

### User Workflows (Selection-First)

#### Workflow 1: "Improve This Paragraph" (Most Common)

**Step 1: User Actions**:
1. Reads document
2. Sees weak paragraph
3. **Selects paragraph with mouse** (natural editing gesture)
4. Opens chat sidebar

**Step 2: Chat UI Shows**:
```
┌─────────────────────────────────────┐
│ 📝 Selected: "This paragraph is..." │  ← Confirmation UI
│    (47 words)                        │
├─────────────────────────────────────┤
│ User: make this more professional   │
│ AI: I'll improve the selected text  │
│ [Applying changes...]                │
└─────────────────────────────────────┘
```

**Step 3: AI Understands**:
- "this" = selected text
- Action: replaceText with improved version
- Target: current selection (no search needed)

#### Workflow 2: "Format Selected Text"

```
User: [selects "Important Note:"]
User: "make this bold and a heading 2"

AI sees:
- Selection: "Important Note:"
- Intent: Bold + Heading 2

AI executes:
1. applyFormatting({ type: 'selection' }, { type: 'bold' })
2. applyFormatting({ type: 'selection' }, { type: 'heading', level: 2 })
```

#### Workflow 3: "Add Content After Selection"

```
User: [selects "Introduction paragraph"]
User: "add 3 examples after this"

AI sees:
- Selection: "Introduction paragraph"
- Intent: Insert after selection

AI executes:
insertText(
  { type: 'relative', anchor: selection.text, placement: 'after' },
  "Example 1: ...\nExample 2: ...\nExample 3: ..."
)
```

### Selection UI Feedback (Required Features)

**1. Selection Indicator in Chat**
```
┌─────────────────────────────────────┐
│ 📝 Selected Text (47 words)         │
│ "This paragraph needs improvement"  │
│ [Clear Selection]                    │
├─────────────────────────────────────┤
│ Chat messages...                     │
└─────────────────────────────────────┘
```

**2. Selection Change Events**
- When user selects text → Chat UI updates
- When user deselects → Chat UI clears
- When user changes selection → Chat UI updates

**3. "No Selection" State**
```
User: "make this bold"
AI: "Please select the text you want to make bold, then try again"
```

### Architecture Requirements

**State Management**:
```typescript
// Editor → ChatSidebar state flow
interface EditorSelection {
  text: string        // Selected text content
  from: number        // Start position
  to: number          // End position
  isEmpty: boolean    // No selection
}

// Pass to ChatSidebar via props or context
<AIChatSidebar
  editor={editor}
  selection={currentSelection}  // Real-time updates
  onSelectionChange={(sel) => setCurrentSelection(sel)}
/>
```

**Selection Context in AI Calls**:
```typescript
// openAIClient.ts - Include selection in EVERY call
async function executeCommand(
  prompt: string,
  editor: Editor,
  selection: EditorSelection  // NEW PARAMETER
) {
  const messages = [
    {
      role: 'system',
      content: selection.isEmpty
        ? 'You are editing a document. No text is currently selected.'
        : `You are editing a document. Selected text: "${selection.text}"`
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  // AI now knows about selection context
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages,
    tools: [replaceTextTool, insertTextTool, applyFormattingTool]
  })
}
```

---

## 🚫 Current System Limitations (Sprint 23 - Single Tool)

### What `replaceText` Can Do
✅ Replace existing text with new text (if exact match found)
✅ Example: "replace 'hello' with 'goodbye'"

### What `replaceText` CANNOT Do
❌ **Add new content** - Can't insert text without deleting something
❌ **Apply formatting** - Can't bold, italic, or change heading levels
❌ **Work with structure** - Can't convert lists, tables, or blockquotes
❌ **Multi-location edits** - Must know exact text to replace (no wildcards)
❌ **Contextual insertion** - Can't "add after this paragraph" without knowing exact end position

### Real User Frustrations (Observed)

**Scenario 1: User says "add a summary at the top"**
- AI Response: "I can only replace existing text. Please type the summary first, then I can modify it."
- User Reaction: "That defeats the purpose! I wanted AI to write it."
- **Gap**: No `insertText` tool

**Scenario 2: User says "make this paragraph bold"**
- AI Response: "I can replace the text. What should I replace it with?"
- User Reaction: "Just make it bold! Don't change the words!"
- **Gap**: No `applyFormatting` tool

**Scenario 3: User says "add examples after the introduction"**
- AI Response: "I need to know the exact ending text of the introduction to replace."
- User Reaction: "Why can't you just... add them? Like a normal editor?"
- **Gap**: No position-based insertion (only text-based replacement)

---

## 🎯 Jobs-to-Tools Mapping (Sprint 24 Solution)

### Tool 1: `replaceText` (Already Exists - Sprint 23) ✅
**Jobs It Serves:**
- Fix typos across document
- Improve specific text
- Replace outdated terms (e.g., "2024" → "2025")

**User Commands:**
- "replace 'hello' with 'goodbye'"
- "fix the typo 'definately' to 'definitely'"
- "change 'CEO' to 'Chief Executive Officer'"

**Technical Signature:**
```typescript
replaceText(searchText: string, newText: string)
```

---

### Tool 2: `insertText` (NEW - Sprint 24) 🎯
**Jobs It Serves:**
- Add missing content (examples, explanations, transitions)
- Insert AI-generated text (summaries, bullet points, conclusions)
- Expand abbreviated text ("e.g." → "for example")

**User Commands:**
- "add a summary at the top"
- "insert 3 examples after this paragraph"
- "add a conclusion at the end"
- "write a transition between these sections"

**Technical Signature:**
```typescript
insertText(
  position: 'start' | 'end' | { after: string } | { before: string },
  content: string
)
```

**Why This Design?**
- **Position strategies**: User thinks in document structure (top/bottom/after X)
- **Flexible addressing**: Natural language position ("after the introduction")
- **No deletion**: Pure insertion, safer for users

---

### Tool 3: `applyFormatting` (NEW - Sprint 24) 🎯
**Jobs It Serves:**
- Make text consistent with style guide (bold, italic, headings)
- Emphasize important points (bold key terms)
- Restructure content (convert lists, change heading levels)

**User Commands:**
- "make this paragraph bold"
- "change 'Introduction' to a heading level 2"
- "make all product names bold"
- "convert this numbered list to bullet points"

**Technical Signature:**
```typescript
applyFormatting(
  target: string | 'selection' | 'all',
  format: 'bold' | 'italic' | 'heading' | 'list' | 'blockquote',
  options?: { level?: number, listType?: 'bullet' | 'numbered' }
)
```

**Why This Design?**
- **Target flexibility**: Apply to specific text, current selection, or globally
- **Rich formatting**: Cover most common WYSIWYG editor operations
- **Preserve content**: Only change formatting, never delete text

---

## 📊 User Workflow Analysis (3-Tool System)

### Workflow 1: "Write a Blog Post" (Common User Job)

**Step 1: AI Generates Draft**
```
User: "write a blog post introduction about markdown editors"
AI: [Uses insertText at 'start' to add introduction paragraph]
```

**Step 2: User Reviews, Sees Weak Point**
```
User: "this sentence is unclear: [selects text]"
AI: [Uses replaceText to improve selected sentence]
```

**Step 3: Add Structure**
```
User: "make 'Why Markdown Matters' a heading 2"
AI: [Uses applyFormatting to convert to h2]
```

**Step 4: Emphasize Key Points**
```
User: "bold 'WYSIWYG' and 'markdown' throughout the document"
AI: [Uses applyFormatting with target='all' for both terms]
```

**Result**: Complete blog post created through natural conversation, no manual clicking.

---

### Workflow 2: "Fix Existing Document" (Editing Job)

**Step 1: Fix Typos**
```
User: "replace 'definately' with 'definitely'"
AI: [Uses replaceText for all instances]
```

**Step 2: Add Missing Examples**
```
User: "add 2 examples after the first paragraph"
AI: [Uses insertText with position={ after: "first paragraph text..." }]
```

**Step 3: Reformat for Consistency**
```
User: "make all company names bold"
AI: [Uses applyFormatting with target='Apple', target='Google', etc.]
```

**Result**: Document fixed efficiently, no manual search-and-replace or formatting clicks.

---

## 🧠 Why This 3-Tool System Works (User Psychology)

### 1. **Matches Mental Model of Editing**
Users think in three fundamental editing operations:
- **Change existing text** (replaceText) - "Make this better"
- **Add new text** (insertText) - "Write me something"
- **Change appearance** (applyFormatting) - "Make this bold"

### 2. **Reduces Cognitive Load**
- Each tool has ONE clear purpose
- No overlapping functionality (no confusion about which tool to use)
- Natural language commands map cleanly to tools

### 3. **Safe and Predictable**
- `replaceText`: Only touches specified text
- `insertText`: Never deletes anything
- `applyFormatting`: Changes style, preserves content

Users can confidently experiment without fear of destroying their document.

### 4. **Enables Complex Workflows**
- Tools compose naturally ("first insert, then format, then replace")
- AI can chain multiple tools for complex requests
- Example: "add examples and make them italic" → insertText + applyFormatting

---

## 📈 Success Metrics for Sprint 24 (User-Centric)

### Primary Metrics (What Users Care About)

1. **Task Completion Rate**
   - Can user accomplish intended job? (Yes/No)
   - Target: >85% success rate on common jobs

2. **Confusion Events**
   - How often does AI say "I can't do that" or "I don't understand"?
   - Target: <10% of user commands result in confusion

3. **Manual Fallback Rate**
   - How often does user give up and edit manually?
   - Target: <20% of initiated tasks require manual completion

4. **Time to Complete Job**
   - How fast can user complete common jobs vs. manual editing?
   - Target: 2-3x faster with AI than manual

### Secondary Metrics (Technical Quality)

5. **Tool Selection Accuracy**
   - Does AI choose correct tool for user's intent?
   - Target: >90% correct tool selection

6. **Execution Success Rate**
   - When tool is called, does it succeed?
   - Target: >95% successful executions

---

## 🎨 UX Design Principles (Derived from JTBD)

### Principle 1: Natural Language First
Users shouldn't learn tool syntax. They say what they want, AI figures out which tool to use.

**Good**: "add examples after this paragraph"
**Bad**: "use insertText tool with position=after and content=examples"

### Principle 2: Intelligent Defaults
AI infers context from conversation and document state.

**Example**: "make this bold"
- If text is selected → applyFormatting on selection
- If no selection → ask user "which text?"
- Never require explicit position/range from user

### Principle 3: Graceful Degradation
When AI can't complete job, explain WHY and suggest alternative.

**Example**: "add a table here"
- Response: "I can't create tables yet, but I can insert plain text. Would you like me to add a text-based table (using | characters) that you can convert later?"

### Principle 4: Undo Trust
Users should feel confident experimenting because they can undo.

- Every tool operation creates single undo step
- Toast notification confirms action (with undo button)
- Document history shows AI-made changes

---

## 🔮 Future Jobs (Beyond Sprint 24)

Understanding user jobs helps prioritize future sprints:

### High-Value Future Jobs
1. **Find and analyze** - "find all mentions of 'pricing'" (read-only tool)
2. **Restructure content** - "convert this paragraph into a bullet list"
3. **Generate complex structures** - "create a comparison table"
4. **Multi-document operations** - "copy this section to another document"
5. **Conditional formatting** - "make all sentences starting with 'Note:' italic"

### Tools Needed (Future Sprints)
- `findText` (Sprint 25?) - Search without modifying
- `deleteText` (Sprint 26?) - Remove content
- `createStructure` (Sprint 27?) - Tables, lists, blockquotes
- `moveText` (Sprint 28?) - Rearrange sections

---

## 🚀 Sprint 24 Implementation Order (User Value Priority)

### Phase 1: `insertText` (Highest User Value)
**Why First**: Most requested feature ("AI should write for me, not just edit")
**User Impact**: Unlocks content generation use case
**Risk**: Medium (position resolution complexity)

### Phase 2: `applyFormatting` (High User Value)
**Why Second**: Common pain point ("why can't you just make it bold?")
**User Impact**: Eliminates formatting tedium
**Risk**: Low (TipTap has excellent formatting APIs)

### Phase 3: Multi-Tool Orchestration (Medium User Value)
**Why Third**: Enables complex workflows but requires both tools working
**User Impact**: "Write and format" in single command
**Risk**: Medium (AI tool selection accuracy)

---

## 📝 Technical Requirements (Derived from User Needs)

### For `insertText` Tool

**Must Support**:
1. ✅ Absolute positions: "at the start", "at the end"
2. ✅ Relative positions: "after [text]", "before [text]"
3. ✅ Selection-based: "at cursor" (if user selected location)
4. ✅ Semantic positions: "after the introduction" (requires AI to understand structure)

**Nice to Have**:
- Heading-relative: "after the first h2"
- Paragraph-relative: "after the 3rd paragraph"

**Must NOT**:
- Insert at invalid positions (mid-word, inside code blocks)
- Destroy formatting of surrounding text

### For `applyFormatting` Tool

**Must Support**:
1. ✅ Text-based targeting: "make 'hello' bold"
2. ✅ Selection-based: "make this bold" (current editor selection)
3. ✅ Global targeting: "make all 'TODO' items bold"
4. ✅ Basic formats: bold, italic, heading (h1-h6), lists (bullet/numbered), blockquote

**Nice to Have**:
- Code blocks
- Links
- Strikethrough
- Text color

**Must NOT**:
- Change non-targeted text
- Break existing links or structure
- Remove content

---

## ✅ Definition of Done (User-Focused)

Sprint 24 is complete when a user can:

1. ✅ Say "add examples after this paragraph" and AI inserts content
2. ✅ Say "make this paragraph bold" and AI applies formatting
3. ✅ Say "write an introduction and make it a heading 2" and AI chains both tools
4. ✅ Undo any AI operation with Cmd+Z
5. ✅ See clear feedback about what AI did ("Added 3 examples", "Applied bold to 'hello'")
6. ✅ Get helpful errors if command fails ("I couldn't find 'hello' in the document")

**Success Test**: User can write a complete blog post using ONLY AI commands (no manual editing needed).

---

## 🎯 Next Steps

1. **Validate these user jobs** with actual usage data from Sprint 23
2. **Design tool signatures** based on user command patterns
3. **Build prototypes** for `insertText` and `applyFormatting`
4. **Test with real user commands** (collected from Sprint 23)
5. **Iterate based on failure modes** (when AI misunderstands intent)

**Remember**: Technology serves users, not the other way around. If implementation doesn't match user mental model, change the implementation (not the user).

---

**Last Updated**: November 4, 2025
**Next Document**: `tool-design.md` - Technical design derived from these user needs
