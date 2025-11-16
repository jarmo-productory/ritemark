# Sprint 23: Implementation Plan

**Goal**: Real AI Tool with OpenAI + Chat Sidebar UI
**Timeline**: 1 day (8-10 hours)
**Architecture**: Client-side tool execution

---

## 📋 Implementation Phases

### Phase 1: Remove POC Code (30 minutes)

**Objective**: Clean up Sprint 22 POC, keep what we need

**Tasks:**
- [ ] Delete `src/components/ai/AICommandPOC.tsx` (POC UI)
- [ ] Delete `src/services/ai/fakeAI.ts` (fake AI parser)
- [ ] Keep `src/services/ai/toolExecutor.ts` (will refactor)
- [ ] Remove POC integration from `src/components/Editor.tsx`
- [ ] Verify TypeScript compiles after deletions

**Success Criteria:**
- POC code removed
- TypeScript compiles with zero errors
- Editor still works (no broken imports)

---

### Phase 2: OpenAI SDK Integration (2-3 hours)

**Objective**: Set up OpenAI function calling with `replaceText` tool

**Tasks:**
1. **Install OpenAI SDK**
   ```bash
   cd ritemark-app
   npm install openai
   ```

2. **Create OpenAI Client Service** (`src/services/ai/openAIClient.ts`)
   - Initialize OpenAI client
   - Define `replaceText` tool specification
   - Implement function calling
   - Handle API errors (rate limits, network failures)
   - Return tool call or error message

3. **Tool Specification**
   ```typescript
   const replaceTextTool = {
     type: "function",
     function: {
       name: "replaceText",
       description: "Replace a specific text string in the document",
       parameters: {
         type: "object",
         properties: {
           searchText: {
             type: "string",
             description: "The exact text to find and replace"
           },
           newText: {
             type: "string",
             description: "The replacement text"
           }
         },
         required: ["searchText", "newText"]
       }
     }
   }
   ```

4. **Environment Variables**
   - Add to `.env.local`: `VITE_OPENAI_API_KEY`
   - Document in README: Users need to provide their own key

5. **Error Handling**
   - API key missing
   - Rate limit exceeded (429)
   - Network timeout (30s)
   - Invalid response format

**Deliverable:**
- `src/services/ai/openAIClient.ts` (150-200 lines)
- Function calling working with GPT-4 Turbo
- Error handling for common failures

**Success Criteria:**
- Can call OpenAI API with function calling
- Returns tool call: `{ tool: "replaceText", args: { searchText, newText } }`
- Error handling works (graceful failures)
- TypeScript compiles

---

### Phase 3: Text Search Implementation (1-2 hours)

**Objective**: Find text in document and convert to TipTap positions

**Tasks:**
1. **Create Text Search Service** (`src/services/ai/textSearch.ts`)
   - `findTextInDocument(editor, searchText)` function
   - Returns `{ from: number, to: number } | null`

2. **Text-to-Position Conversion**
   ```typescript
   function findTextInDocument(editor: Editor, searchText: string): Position | null {
     // Get plain text from editor
     const plainText = editor.getText()

     // Find text offset
     const textOffset = plainText.indexOf(searchText)
     if (textOffset === -1) return null

     // Convert text offset to TipTap document position
     const docFrom = textOffsetToDocPosition(editor, textOffset)
     const docTo = docFrom + searchText.length

     return { from: docFrom, to: docTo }
   }
   ```

3. **Position Conversion Algorithm**
   - Handle block separators (paragraphs, headings)
   - Account for TipTap node overhead
   - Test with multi-line documents

4. **Edge Cases**
   - Text not found → return null
   - Text spans multiple paragraphs → find first occurrence
   - Case-sensitive matching (for now)

**Deliverable:**
- `src/services/ai/textSearch.ts` (~80 lines)
- `findTextInDocument()` working correctly
- Handles edge cases gracefully

**Success Criteria:**
- Finds "hello" in "hello world" → returns correct position
- Finds text in multi-paragraph documents
- Returns null if text not found
- TypeScript compiles

---

### Phase 4: Refactor ToolExecutor (1 hour)

**Objective**: Update ToolExecutor to use text search instead of positions

**Tasks:**
1. **Update Interface** (`src/services/ai/toolExecutor.ts`)
   ```typescript
   interface ReplaceTextArgs {
     searchText: string  // NEW: AI provides search text
     newText: string
   }
   ```

2. **Integrate Text Search**
   ```typescript
   private replaceText(args: ReplaceTextArgs): boolean {
     const { searchText, newText } = args

     // Find text position in document
     const position = findTextInDocument(this.editor, searchText)

     if (!position) {
       console.error(`Text "${searchText}" not found in document`)
       return false
     }

     // Execute TipTap command
     return this.editor
       .chain()
       .focus()
       .insertContentAt({ from: position.from, to: position.to }, newText)
       .run()
   }
   ```

3. **Error Messages**
   - Text not found → helpful error
   - Invalid parameters → clear validation message

**Deliverable:**
- Updated `src/services/ai/toolExecutor.ts`
- Uses text search instead of hardcoded positions
- Better error messages

**Success Criteria:**
- Finds text dynamically (not hardcoded positions)
- Returns helpful errors
- TypeScript compiles

---

### Phase 5: Chat Sidebar UI (3-4 hours)

**Objective**: Create simple chat sidebar (no history, just current request/response)

**Tasks:**
1. **Create Chat Sidebar Component** (`src/components/ai/AIChatSidebar.tsx`)
   - Fixed right sidebar (300px width)
   - Text input at bottom
   - Single message display (no history)
   - Loading state during API call
   - Send button (or Enter key)

2. **UI Structure**
   ```
   ┌─────────────────────────────────────┐
   │ Editor (Left)      │ AI Chat (Right) │
   │                    │                 │
   │                    │ ┌─────────────┐ │
   │                    │ │ User:       │ │
   │                    │ │ "replace    │ │
   │                    │ │  hello with │ │
   │                    │ │  goodbye"   │ │
   │                    │ └─────────────┘ │
   │                    │                 │
   │                    │ ┌─────────────┐ │
   │                    │ │ AI:         │ │
   │                    │ │ ✅ Replaced │ │
   │                    │ │ "hello" →   │ │
   │                    │ │ "goodbye"   │ │
   │                    │ └─────────────┘ │
   │                    │                 │
   │                    │ ┌─────────────┐ │
   │                    │ │ [Input...]  │ │
   │                    │ │ [Send] ─────│ │
   │                    │ └─────────────┘ │
   └─────────────────────────────────────┘
   ```

3. **State Management**
   ```typescript
   const [userMessage, setUserMessage] = useState('')
   const [aiResponse, setAIResponse] = useState('')
   const [isLoading, setIsLoading] = useState(false)
   ```

4. **Integration Flow**
   ```typescript
   const handleSend = async () => {
     setIsLoading(true)

     // Call OpenAI API
     const result = await openAIClient.executeCommand(userMessage, editor)

     if (result.success) {
       setAIResponse(`✅ ${result.message}`)
     } else {
       setAIResponse(`❌ ${result.error}`)
     }

     setIsLoading(false)
   }
   ```

5. **Styling (Tailwind)**
   - Fixed position: right side
   - Width: 300px (desktop), full screen (mobile)
   - Border left: subtle divider
   - Johnny Ive invisible interface style
   - Clean, minimal design

6. **Mobile Responsiveness**
   - Overlay on mobile (not side-by-side)
   - Toggle button to show/hide
   - Full screen when open

**Deliverable:**
- `src/components/ai/AIChatSidebar.tsx` (~150 lines)
- Simple, clean UI
- Shows user message + AI response (no history)
- Mobile responsive

**Success Criteria:**
- Sidebar renders on right side
- Can type message and send
- Shows loading state
- Displays AI response
- Mobile responsive (overlay)
- TypeScript compiles

---

### Phase 6: Integration & Testing (2 hours)

**Objective**: Connect everything and validate end-to-end

**Tasks:**
1. **Integrate Chat Sidebar into Editor**
   - Add to `src/components/Editor.tsx`
   - Pass editor instance to sidebar
   - Layout: Editor (left) + Sidebar (right)

2. **End-to-End Flow Test**
   ```
   User: "replace hello with goodbye"
     ↓
   AIChatSidebar → OpenAIClient.executeCommand()
     ↓
   OpenAI API (function calling)
     ↓
   Returns: { tool: "replaceText", args: { searchText: "hello", newText: "goodbye" } }
     ↓
   ToolExecutor.execute()
     ↓
   TextSearch.findTextInDocument()
     ↓
   TipTap: editor.commands.insertContentAt()
     ↓
   Success → Display: "✅ Replaced 'hello' with 'goodbye'"
   ```

3. **Test Scenarios**
   - Basic replacement: "replace hello with goodbye" ✅
   - Text not found: "replace xyz with abc" → Error message
   - API failure: Invalid API key → Error message
   - Undo: Cmd+Z after AI edit → Restores original
   - Multi-word: "replace hello world with goodbye universe"

4. **Browser Validation**
   ```bash
   npm run type-check  # Zero errors
   npm run dev         # Start server
   # Open localhost:5173
   # Test all scenarios manually
   ```

5. **Error Handling Validation**
   - Missing API key → Clear error in UI
   - Rate limit → Helpful message with retry suggestion
   - Network timeout → "Request timed out, please try again"

**Deliverable:**
- Fully integrated system
- All test scenarios passing
- Browser validation complete

**Success Criteria:**
- All test scenarios work
- Error handling graceful
- Undo/redo works
- TypeScript compiles
- No console errors

---

## 🔧 Technical Specifications

### OpenAI Configuration

```typescript
// src/services/ai/openAIClient.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Client-side usage
})

export async function executeCommand(
  prompt: string,
  editor: Editor
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      tools: [replaceTextTool],
      tool_choice: "auto"
    })

    const toolCall = response.choices[0].message.tool_calls?.[0]

    if (!toolCall) {
      return { success: false, error: "AI didn't understand the command" }
    }

    const args = JSON.parse(toolCall.function.arguments)
    const executor = new ToolExecutor(editor)
    const success = executor.execute({ tool: "replaceText", arguments: args })

    if (success) {
      return {
        success: true,
        message: `Replaced "${args.searchText}" with "${args.newText}"`
      }
    } else {
      return {
        success: false,
        error: `Text "${args.searchText}" not found in document`
      }
    }
  } catch (error) {
    if (error.status === 429) {
      return { success: false, error: "Rate limit exceeded. Please try again in a moment." }
    }
    return { success: false, error: error.message }
  }
}
```

---

## 📦 Deliverables Checklist

### Code Files
- [ ] Remove: `src/components/ai/AICommandPOC.tsx`
- [ ] Remove: `src/services/ai/fakeAI.ts`
- [ ] Create: `src/services/ai/openAIClient.ts` (OpenAI integration)
- [ ] Create: `src/services/ai/textSearch.ts` (Text finding logic)
- [ ] Update: `src/services/ai/toolExecutor.ts` (Use text search)
- [ ] Create: `src/components/ai/AIChatSidebar.tsx` (Chat UI)
- [ ] Update: `src/components/Editor.tsx` (Integrate sidebar)
- [ ] Update: `src/services/ai/index.ts` (Export new services)

### Configuration
- [ ] Add: `.env.local` with `VITE_OPENAI_API_KEY`
- [ ] Update: Package.json (add `openai` dependency)

### Documentation
- [ ] Update: Sprint 23 README (mark complete)
- [ ] Create: `testing-results.md` (browser validation)
- [ ] Update: Roadmap (Sprint 23 complete)

---

## ✅ Success Criteria

**Must Work:**
- [ ] User types: "replace hello with goodbye" in chat sidebar
- [ ] AI processes request via OpenAI function calling
- [ ] Editor updates with "goodbye" at correct position
- [ ] Chat shows: "✅ Replaced 'hello' with 'goodbye'"
- [ ] Undo works (Cmd+Z restores original)
- [ ] Error handling: text not found → clear message
- [ ] Error handling: API failure → graceful error
- [ ] Chat sidebar is mobile responsive
- [ ] TypeScript compiles with zero errors
- [ ] No console errors in browser

**Nice to Have (Sprint 24+):**
- [ ] Streaming responses
- [ ] Chat history
- [ ] Multiple tool support
- [ ] Command suggestions

---

## 🚀 Execution Notes

**Agent Coordination:**
- Phase 1: Cleanup agent (30 min)
- Phase 2: OpenAI integration agent (2-3 hours)
- Phase 3: Text search agent (1-2 hours)
- Phase 4: ToolExecutor refactor agent (1 hour)
- Phase 5: UI agent (3-4 hours)
- Phase 6: Testing agent (2 hours)

**Total Estimated Time:** 9.5-12.5 hours (1-1.5 days)

**Critical Path:** Phase 2 (OpenAI) must complete before Phase 4-6

**Parallel Work:**
- Phase 3 (text search) can run parallel to Phase 2 (OpenAI)
- Phase 5 (UI) depends on Phase 2 (needs API to test)

---

**Ready for swarm deployment!**
