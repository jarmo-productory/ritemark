# Sprint 29: Client-Side AI Enhancement

**Duration**: 2-3 weeks
**Focus**: Improve existing client-side AI assistant
**Architecture**: Keep BYOK (Bring Your Own Key) model

---

## 🎯 Decision: Stay Client-Side

### Why NOT Migrate to Vercel AI SDK
❌ Vercel AI SDK requires server-side API routes
❌ Would break BYOK model (user-owned API keys)
❌ Would centralize costs on our server
❌ Adds complexity without clear UX wins

### Why ENHANCE Current Implementation
✅ Already using official OpenAI SDK client-side
✅ BYOK model (users pay for their own usage)
✅ No server costs
✅ Privacy-first (keys stay in browser, encrypted)
✅ Function calling already working well
✅ Solid foundation to build on

---

## 📊 Current State Analysis

### ✅ What's Working Well

1. **Security**
   - API keys encrypted in IndexedDB (AES-256-GCM)
   - Non-extractable CryptoKey
   - User-owned keys (BYOK)

2. **Architecture**
   - Official OpenAI SDK (`openai` package)
   - Function calling with tools (`replaceText`, `insertText`)
   - Conversation history support
   - Selection context integration

3. **UX**
   - Auto-expand on selection
   - Keyboard shortcuts (Ctrl+Shift+A)
   - Accessibility features
   - Tool type indicators (replace/insert icons)

### ⚠️ Pain Points & Opportunities

1. **No Streaming Responses**
   - Currently: Wait for full response (blocking)
   - User sees nothing until complete
   - Feels slow for long responses

2. **Limited Error Handling**
   - Basic retry logic
   - No exponential backoff
   - Network errors require manual refresh

3. **No Cancellation**
   - Can't abort long-running requests
   - 90s timeout but no user control

4. **Conversation UX**
   - No "thinking..." indicator
   - No token usage display
   - No cost estimation

5. **Tool Capabilities**
   - Only 2 tools (replace, insert)
   - Could add more (find, delete, format, etc.)

6. **Model Limitations**
   - Hardcoded `gpt-5-mini` (should this be gpt-4o-mini?)
   - No model selection UI
   - Can't compare responses

---

## 🚀 Enhancement Roadmap

### Phase 1: Streaming Responses (High Priority)

**Goal**: Add real-time streaming for AI responses

**Implementation:**
```typescript
// Current (blocking)
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages
})

// New (streaming)
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  stream: true
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || ''
  // Update UI with streaming content
  updateStreamingMessage(content)
}
```

**Benefits:**
- ✅ Instant feedback (see response as it's generated)
- ✅ Perceived performance improvement
- ✅ Can show "thinking..." state
- ✅ Better UX for long responses

**Complexity**: Medium (OpenAI SDK supports this out-of-the-box)

---

### Phase 2: Request Cancellation & Better Error Handling

**Goal**: Let users cancel requests and handle errors gracefully

**Features:**
1. **Cancel Button**
   ```typescript
   const abortController = new AbortController()

   // Pass to OpenAI
   const stream = await openai.chat.completions.create({
     model: 'gpt-4o',
     messages,
     stream: true
   }, {
     signal: abortController.signal
   })

   // Cancel on button click
   <button onClick={() => abortController.abort()}>Cancel</button>
   ```

2. **Exponential Backoff Retry**
   ```typescript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn()
       } catch (error) {
         if (i === maxRetries - 1) throw error
         const delay = Math.pow(2, i) * 1000  // 1s, 2s, 4s
         await new Promise(resolve => setTimeout(resolve, delay))
       }
     }
   }
   ```

3. **Network Error Recovery**
   - Detect offline state
   - Queue messages for retry
   - Show connection status

**Benefits:**
- ✅ User control over long requests
- ✅ Graceful failure recovery
- ✅ Better offline experience

**Complexity**: Low-Medium

---

### Phase 3: Intelligent AI Capabilities (The Real Vision)

**Goal**: Transform AI from simple text replacement to intelligent co-author

#### A. Smart Find-and-Replace Tool

**Problem**: Current `replaceText` only replaces one occurrence
**Solution**: New `findAndReplaceAll` tool with smart matching

```typescript
{
  name: 'findAndReplaceAll',
  description: 'Find all occurrences of a term/pattern and replace intelligently',
  parameters: {
    searchPattern: {
      type: 'string',
      description: 'Term to find (e.g., "user", "customer", "old brand name")'
    },
    replacement: {
      type: 'string',
      description: 'New term to replace with'
    },
    options: {
      matchCase: boolean,  // Case-sensitive matching
      wholeWord: boolean,  // Match whole words only
      preserveCase: boolean,  // "User" → "Customer", "user" → "customer"
      scope: 'document' | 'selection'  // Where to replace
    }
  }
}
```

**Example:**
- User: "Replace all instances of 'customer' with 'user'"
- AI: Calls `findAndReplaceAll("customer", "user", { preserveCase: true })`
- Result: "Customer" → "User", "customer" → "user", "CUSTOMER" → "USER"

**Benefits:**
- ✅ Bulk replacements (not one-by-one)
- ✅ Smart case handling
- ✅ Whole-word matching (avoid "customer" → "usertomer")

**Complexity**: Medium

---

#### B. Context-Aware Formatting from AI

**Problem**: AI needs to understand document structure better
**Solution**: Enhanced `insertText` with smart formatting detection

```typescript
{
  name: 'insertFormattedContent',
  description: 'Insert content with intelligent formatting based on context',
  parameters: {
    content: string,  // Raw content from AI
    position: { ... },
    formatting: {
      autoDetectStyle: boolean,  // Match surrounding text style
      preserveIndentation: boolean,  // Match parent list/section indent
      smartHeadingLevel: boolean,  // Auto-adjust heading level based on context
    }
  }
}
```

**Smart Behaviors:**
- Inserting into a list? Auto-format as list item
- Inserting after H2? Make new content H3 (not H2)
- Inserting into code block? Preserve formatting
- Detect document language (markdown, plain text) and adapt

**Benefits:**
- ✅ AI-generated content matches document style
- ✅ Less manual formatting after insertion
- ✅ Context-aware intelligence

**Complexity**: Medium-High

---

#### C. Widget Plugin Architecture (Interactive AI Tools)

**🎯 CRITICAL ARCHITECTURAL PIVOT: LLM for Intent, Widgets for Execution**

**Problem Statement:**
1. ❌ **Intent detection with keywords is wrong approach** - Brittle, fails on edge cases
2. ❌ **Immediate tool execution is bad UX** - No preview, no control, scary for users
3. ✅ **LLMs are excellent at intent detection** - Use `tool_choice: 'auto'` always
4. ✅ **LLMs are terrible at precise execution** - Character-level operations fail

**The Right Pattern:**
```
User Message
    ↓
LLM with tools (tool_choice: 'auto')
    ↓
LLM decides: "User wants to replace 'user' with 'customer'"
    ↓
Instead of executing immediately...
    ↓
Show Interactive Widget (React component)
    ↓
Widget shows preview: "Found 47 matches, will replace..."
    ↓
User controls execution: [Replace All] [Preview Changes] [Cancel]
    ↓
Deterministic algorithm executes replacements
```

**Architecture:**

**1. LLM Layer (Intent Detection)**
```typescript
// ALWAYS provide tools, let LLM decide
const response = await openai.chat.completions.create({
  messages: [...history, userMessage],
  tools: [
    findAndReplaceWidget,  // ← Returns widget config, not immediate execution
    insertTextWidget,
    formatTextWidget,
    // ... more widgets
  ],
  tool_choice: 'auto'  // ← ALWAYS auto, never conditional
})

// LLM calls tool with parameters
if (response.tool_calls?.[0]?.name === 'findAndReplaceWidget') {
  const args = JSON.parse(response.tool_calls[0].function.arguments)
  // args = { searchPattern: "user", replacement: "customer", options: {...} }

  // Don't execute immediately! Show widget instead
  return {
    type: 'widget',
    widgetName: 'FindAndReplaceWidget',
    params: args
  }
}
```

**2. Widget Layer (User Interface + Preview)**
```typescript
// services/ai/widgets/FindAndReplaceWidget.tsx
interface FindAndReplaceWidgetProps {
  searchPattern: string
  replacement: string
  options: {
    matchCase: boolean
    wholeWord: boolean
    preserveCase: boolean
    scope: 'document' | 'selection'
  }
  editor: Editor
}

export function FindAndReplaceWidget({ searchPattern, replacement, options, editor }: Props) {
  // Deterministic algorithm finds matches
  const matches = findMatches(editor, searchPattern, options)

  return (
    <div className="widget find-replace">
      <h3>Replace "{searchPattern}" with "{replacement}"</h3>
      <p>Found {matches.length} matches</p>

      {/* Preview section */}
      <div className="preview">
        {matches.slice(0, 5).map(match => (
          <div key={match.position}>
            <span className="before">{match.before}</span>
            <span className="highlight">{match.text}</span>
            <span className="after">{match.after}</span>
            →
            <span className="replacement">{match.replacementPreview}</span>
          </div>
        ))}
        {matches.length > 5 && <p>...and {matches.length - 5} more</p>}
      </div>

      {/* User controls */}
      <div className="actions">
        <button onClick={() => executeReplacements(matches)}>
          Replace All ({matches.length})
        </button>
        <button onClick={() => showFullPreview()}>
          Preview All Changes
        </button>
        <button onClick={() => closeWidget()}>
          Cancel
        </button>
      </div>
    </div>
  )
}
```

**3. Execution Layer (Deterministic Algorithm)**
```typescript
// services/ai/widgets/algorithms/findAndReplace.ts

/**
 * Deterministic find-and-replace algorithm
 * NO LLM involvement - precise, predictable, testable
 */
export function findMatches(
  editor: Editor,
  searchPattern: string,
  options: FindReplaceOptions
): Match[] {
  const text = editor.getText()
  const matches: Match[] = []

  // Build regex based on options
  const flags = options.matchCase ? 'g' : 'gi'
  const pattern = options.wholeWord
    ? new RegExp(`\\b${escapeRegex(searchPattern)}\\b`, flags)
    : new RegExp(escapeRegex(searchPattern), flags)

  // Find all matches
  let match
  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      position: match.index,
      text: match[0],
      before: text.slice(Math.max(0, match.index - 20), match.index),
      after: text.slice(match.index + match[0].length, match.index + match[0].length + 20),
      replacementPreview: options.preserveCase
        ? preserveCase(match[0], replacement)
        : replacement
    })
  }

  return matches
}

export function executeReplacements(editor: Editor, matches: Match[], replacement: string) {
  // Execute replacements from end to start (preserves positions)
  const sortedMatches = [...matches].sort((a, b) => b.position - a.position)

  editor.chain()
    .focus()
    .command(({ tr }) => {
      sortedMatches.forEach(match => {
        tr.delete(match.position, match.position + match.text.length)
        tr.insert(match.position, replacement)
      })
      return true
    })
    .run()
}
```

**Why This Architecture is Correct:**

**✅ LLM Strengths (Intent Detection):**
- "Replace all instances of customer with user" → Extract: search="customer", replace="user"
- "Change the name to lowercase" → Extract: operation="lowercase"
- "Fix the grammar in this paragraph" → Operation="grammar-fix", scope="paragraph"

**✅ Widget Strengths (User Control):**
- Preview before execution (no surprises)
- User can cancel or modify
- Interactive controls (replace all, replace one-by-one, skip)
- Clear visual feedback

**✅ Algorithm Strengths (Precise Execution):**
- Deterministic (same input = same output)
- Testable (unit tests for edge cases)
- Fast (no LLM latency)
- Reliable (no hallucinations)

**❌ What We're Avoiding (Anti-Patterns):**
- Keyword-based intent detection (brittle, fails on "replace the old text")
- Conditional tool availability (loses context, confuses LLM)
- Immediate execution without preview (scary, no undo)
- LLM doing character-level operations (imprecise, error-prone)

**File Structure:**
```
src/services/ai/
├── widgets/
│   ├── FindAndReplaceWidget.tsx        # UI component
│   ├── InsertTextWidget.tsx            # UI component
│   ├── FormatTextWidget.tsx            # UI component
│   ├── WidgetRenderer.tsx              # Widget container
│   └── algorithms/
│       ├── findAndReplace.ts           # Deterministic logic
│       ├── insertText.ts
│       └── formatText.ts
├── tools/
│   ├── findAndReplaceTool.ts           # OpenAI tool definition
│   ├── insertTextTool.ts
│   └── formatTextTool.ts
└── openAIClient.ts                     # Main client
```

**Integration with Chat:**
```typescript
// AIChatSidebar.tsx
const handleSend = async () => {
  const result = await executeCommand(userMessage, editor, selection, history)

  if (result.type === 'widget') {
    // Show widget instead of executing immediately
    setActiveWidget({
      name: result.widgetName,
      params: result.params
    })
  } else if (result.type === 'message') {
    // Regular chat message
    addMessage(result.content)
  }
}

// In JSX
{activeWidget && (
  <WidgetRenderer
    widget={activeWidget.name}
    params={activeWidget.params}
    editor={editor}
    onClose={() => setActiveWidget(null)}
  />
)}
```

**Benefits:**
- ✅ **User Control**: Preview before execution, can cancel
- ✅ **Extensibility**: Easy to add new widgets (table editor, image uploader, etc.)
- ✅ **Reliability**: Deterministic algorithms, no LLM unpredictability
- ✅ **Better UX**: Interactive components vs. black-box execution
- ✅ **Testability**: Widget logic can be unit tested
- ✅ **Clear Separation**: LLM for what, widgets for how

**Future Widget Examples:**
- `TableEditorWidget` - Visual table manipulation
- `ImageUploaderWidget` - Drag-and-drop image insertion
- `LinkPreviewWidget` - Show link metadata before inserting
- `CodeFormatterWidget` - Format code blocks with language selection
- `ChartBuilderWidget` - Interactive chart/diagram creation

**Complexity**: Medium-High (but correct architecture for long-term)

**See Also**: `/docs/architecture/ADR-005-widget-plugin-architecture.md`

---

#### D. Web Search Integration (Client-Side)

**Problem**: AI knowledge cutoff limits research capabilities
**Solution**: Integrate free client-side web search APIs

**Options:**

**1. DuckDuckGo Instant Answer API (Free, No API Key)**
```typescript
// Client-side fetch (CORS-friendly)
const searchQuery = encodeURIComponent("latest React 19 features")
const response = await fetch(
  `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1`
)
const results = await response.json()

// Send results to OpenAI as context
const aiResponse = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: `Web search results: ${JSON.stringify(results)}` },
    { role: 'user', content: userMessage }
  ]
})
```

**2. Brave Search API (Free Tier: 2000 queries/month)**
```typescript
// Requires API key (user provides, like OpenAI key)
const response = await fetch(
  `https://api.search.brave.com/res/v1/web/search?q=${query}`,
  {
    headers: {
      'X-Subscription-Token': await searchAPIKeyManager.getKey()
    }
  }
)
```

**3. SerpAPI (Free Tier: 100 searches/month)**
```typescript
// Requires API key
const response = await fetch(
  `https://serpapi.com/search.json?q=${query}&api_key=${apiKey}`
)
```

**AI Tool Definition:**
```typescript
{
  name: 'webSearch',
  description: 'Search the web for current information, facts, or research',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query (e.g., "React 19 new features", "AI trends 2025")'
    },
    numResults: {
      type: 'number',
      default: 5,
      description: 'Number of results to return (1-10)'
    }
  }
}
```

**User Experience:**
- User: "Research latest trends in AI writing assistants"
- AI: Calls `webSearch("AI writing assistants 2025")`
- AI: Receives top 5 results with summaries
- AI: Synthesizes research into answer

**Benefits:**
- ✅ Current information (beyond knowledge cutoff)
- ✅ Research capabilities
- ✅ Fact-checking
- ✅ Client-side (no server needed)

**Complexity**: Medium (DuckDuckGo = Low, Brave/SerpAPI = Medium)

**Recommendation**: Start with DuckDuckGo (free, no key), add Brave as optional upgrade

---

#### E. Multi-Step Process Memory & Workflow Management

**Problem**: Each message is isolated, AI forgets the plan
**Solution**: Persistent workflow state with step tracking

**Architecture:**
```typescript
interface WorkflowState {
  id: string
  plan: string[]  // e.g., ["Outline", "Research", "Draft intro", "Write body", "Conclusion"]
  currentStep: number
  stepResults: Map<number, string>  // What was accomplished in each step
  conversationHistory: Message[]
  metadata: {
    goal: string  // Overall objective
    startedAt: Date
    estimatedSteps: number
  }
}

// Store in IndexedDB (persist across page reloads)
const workflowDB = await openDB('ritemark-workflows', 1, {
  upgrade(db) {
    db.createObjectStore('workflows', { keyPath: 'id' })
  }
})
```

**User Experience:**

**Step 1: Define Process**
```
User: "Help me write a blog post about AI assistants. Break it into steps."

AI: "I'll help you write this in 5 steps:
1. Brainstorm key points and outline
2. Research current trends (web search)
3. Draft introduction
4. Write main sections
5. Write conclusion and polish

Ready to start with step 1?"

[Workflow created with 5 steps]
```

**Step 2-5: Execute Steps**
```
User: "Yes, let's start"

AI: "📍 Step 1/5: Brainstorming
Let's identify your key points. What's your main argument about AI assistants?"

User: [provides input]

AI: [Creates outline, saves to stepResults[1]]

"✅ Step 1 complete! Here's your outline:
- Intro
- Current state of AI
- Benefits
- Challenges
- Future

Ready for step 2 (Research)?"
```

**Step N: Resume After Break**
```
[User closes browser, returns next day]

AI: "👋 Welcome back! We're on step 3/5 of your blog post about AI assistants.
Previous steps completed:
✅ Step 1: Outline created
✅ Step 2: Research completed (5 sources)

Ready to continue with step 3 (Draft intro)?"
```

**Implementation:**
```typescript
// System message includes workflow context
const systemMessage = workflowState ? `
You are helping with a multi-step workflow.

WORKFLOW PLAN:
${workflowState.plan.map((step, i) =>
  `${i + 1}. ${step} ${i < workflowState.currentStep ? '✅' : i === workflowState.currentStep ? '🔄' : '⏳'}`
).join('\n')}

CURRENT STEP: ${workflowState.currentStep + 1}/${workflowState.plan.length}
STEP GOAL: ${workflowState.plan[workflowState.currentStep]}

PREVIOUS RESULTS:
${Array.from(workflowState.stepResults.entries()).map(([step, result]) =>
  `Step ${step + 1}: ${result.substring(0, 200)}...`
).join('\n')}

Your task: Guide the user through the current step. When complete, ask if they're ready for the next step.
` : 'You are a helpful writing assistant.'

// Save workflow state after each message
await workflowDB.put('workflows', workflowState)
```

**UI Enhancements:**
```typescript
// Workflow progress indicator
<div className="workflow-progress">
  <h3>Blog Post Progress</h3>
  <div className="steps">
    {plan.map((step, i) => (
      <div key={i} className={i === currentStep ? 'active' : i < currentStep ? 'complete' : ''}>
        {i < currentStep ? '✅' : i === currentStep ? '🔄' : '⏳'} {step}
      </div>
    ))}
  </div>
  <button onClick={() => saveWorkflow()}>💾 Save Progress</button>
  <button onClick={() => endWorkflow()}>✅ Complete Workflow</button>
</div>
```

**Benefits:**
- ✅ Multi-step processes don't lose context
- ✅ Users can pause and resume
- ✅ AI remembers the plan and previous steps
- ✅ Great for long-form content creation
- ✅ Guides users through complex writing tasks

**Complexity**: High (but high value)

---

### Phase 3 Summary (The Real Vision)

| Feature | Priority | Complexity | Impact | Architecture Approach |
|---------|----------|------------|--------|----------------------|
| A. Smart Find-and-Replace | HIGH | Medium | High | Widget Plugin |
| B. Context-Aware Formatting | MEDIUM | Medium-High | Medium | Widget Plugin |
| C. Widget Plugin Architecture | **CRITICAL** | Medium-High | Very High | **Foundation for A, B, D** |
| D. Web Search Integration | MEDIUM | Medium | High | Traditional Tool (no widget) |
| E. Multi-Step Workflows | HIGH | High | Very High | State Management Layer |

**🎯 UPDATED Implementation Order (Widget-First Approach):**
1. **C. Widget Plugin Architecture** (Foundation - MUST build first)
   - Core widget system: `WidgetRenderer`, widget lifecycle
   - First widget: `FindAndReplaceWidget` (proves architecture)
   - Deterministic algorithm layer
2. **A. Smart Find-and-Replace** (Now just a widget implementation)
   - Add advanced options (case preservation, whole word, etc.)
   - Extend algorithm for complex patterns
3. **B. Context-Aware Formatting** (Second widget)
   - `FormatTextWidget` with style detection
   - Smart heading level, list formatting
4. **D. Web Search** (Traditional tool, no widget needed)
   - DuckDuckGo integration
   - Results passed to LLM as context
5. **E. Multi-Step Workflows** (Complex state management)
   - Workflow state persistence
   - Step tracking and resumption

**Total Estimated Time**: 3-4 weeks for all Phase 3 features

---

### Phase 4: Additional Tools (Optional)

**Goal**: Expand AI capabilities beyond replace/insert

**New Tools:**
1. **findText**: Search document for text
   ```typescript
   {
     name: 'findText',
     description: 'Find all occurrences of text in document',
     parameters: { searchQuery: string }
   }
   ```

2. **deleteText**: Remove text from document
   ```typescript
   {
     name: 'deleteText',
     description: 'Delete specified text from document',
     parameters: { textToDelete: string }
   }
   ```

3. **formatText**: Apply markdown formatting
   ```typescript
   {
     name: 'formatText',
     description: 'Apply formatting (bold, italic, heading) to text',
     parameters: {
       text: string,
       format: 'bold' | 'italic' | 'heading' | 'code'
     }
   }
   ```

4. **summarizeDocument**: Generate summary
   ```typescript
   {
     name: 'summarizeDocument',
     description: 'Create a summary of the document',
     parameters: { style: 'brief' | 'detailed' }
   }
   ```

**Benefits:**
- ✅ More powerful AI assistant
- ✅ Reduces manual editing
- ✅ Users can do more with natural language

**Complexity**: Medium (each tool needs implementation + testing)

---

### Phase 5: Model Selection (Optional)

**Goal**: Let users choose AI model

**Features:**
1. **Model Picker**
   - Dropdown in AI sidebar
   - Options: GPT-4o, GPT-4o-mini, GPT-3.5-turbo
   - Show pricing for each

2. **Model Comparison**
   - Split view: same prompt, different models
   - Compare response quality
   - Compare costs

3. **Default Model Preference**
   - Save preferred model in settings
   - Per-document model selection

**Benefits:**
- ✅ Cost control (use mini for simple tasks)
- ✅ Quality control (use 4o for complex tasks)
- ✅ User choice

**Complexity**: Low

---

## 📝 Sprint 29 Proposed Scope

### Must-Have (Week 1-2)
- [ ] **Phase 1: Streaming Responses** (HIGH PRIORITY)
  - Stream AI responses word-by-word
  - Add "thinking..." indicator
  - Improve perceived performance

- [ ] **Phase 2: Request Cancellation** (MEDIUM PRIORITY)
  - Add cancel button
  - Better error handling
  - Network status indicator

### Nice-to-Have (Week 3)
- [ ] **Phase 3: Enhanced UX** (LOW PRIORITY)
  - Token usage display
  - Cost estimation
  - Message actions (copy, regenerate)

### Future Sprints
- [ ] Phase 4: Additional Tools (Sprint 30+)
- [ ] Phase 5: Model Selection (Sprint 31+)

---

## 🛠️ Technical Implementation

### Streaming Implementation (Phase 1)

**Current Code (openAIClient.ts:274):**
```typescript
// ❌ Blocking call
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',  // Note: Should this be gpt-4o-mini?
  messages,
  tools: [replaceTextTool, insertTextTool],
  tool_choice: 'auto'
})
```

**New Streaming Pattern:**
```typescript
// ✅ Streaming call
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  tools: [replaceTextTool, insertTextTool],
  tool_choice: 'auto',
  stream: true  // Enable streaming
})

// Process stream chunks
let accumulatedContent = ''
let toolCall: any = null

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta

  // Handle content streaming
  if (delta?.content) {
    accumulatedContent += delta.content
    onStreamUpdate?.(accumulatedContent)  // Update UI
  }

  // Handle tool calls (accumulated over chunks)
  if (delta?.tool_calls) {
    // Accumulate tool call data
    toolCall = mergeToolCallChunks(toolCall, delta.tool_calls[0])
  }
}

// Process final tool call if present
if (toolCall) {
  const args = JSON.parse(toolCall.function.arguments)
  // Execute tool...
}
```

**UI Updates (AIChatSidebar.tsx):**
```typescript
const [streamingMessage, setStreamingMessage] = useState<string>('')
const [isStreaming, setIsStreaming] = useState(false)

const handleSend = async () => {
  // ... existing code ...

  setIsStreaming(true)
  setStreamingMessage('')

  // Pass streaming callback
  const result = await executeCommand(
    userMessageContent,
    editor,
    persistedSelection,
    history,
    {
      onStream: (content) => {
        setStreamingMessage(content)  // Update UI in real-time
      }
    }
  )

  setIsStreaming(false)
  // ... rest of code ...
}

// In JSX
{isStreaming && (
  <div className="message assistant streaming">
    {streamingMessage}
    <span className="cursor">▊</span>
  </div>
)}
```

---

## ✅ Success Criteria

### Phase 1 (Streaming) Complete When:
- [ ] AI responses stream word-by-word (not blocking)
- [ ] "Thinking..." indicator shows while waiting
- [ ] Streaming feels responsive (<100ms first token)
- [ ] Tool calls still work correctly with streaming
- [ ] No regressions in existing functionality

### Phase 2 (Cancellation) Complete When:
- [ ] Users can cancel requests mid-stream
- [ ] Network errors retry automatically (3x)
- [ ] Offline state shows clear message
- [ ] No UI freezing on errors

### Phase 3 (Enhanced UX) Complete When:
- [ ] Token usage displayed after each message
- [ ] Estimated cost shown
- [ ] Messages can be copied/regenerated
- [ ] User feedback is positive

---

## 🎯 Why This Approach is Better

### vs. Vercel AI SDK Migration
| Aspect | Client-Side Enhancements | Vercel AI SDK |
|--------|-------------------------|---------------|
| **BYOK Model** | ✅ Preserved | ❌ Lost |
| **Server Costs** | ✅ Zero | ❌ High |
| **Privacy** | ✅ Keys in browser | ⚠️ Trust required |
| **Streaming** | ✅ Achievable | ✅ Built-in |
| **Complexity** | ✅ Low | ❌ High |
| **User Control** | ✅ Full | ❌ Limited |

### Key Benefits
1. **User Economics**: Users pay OpenAI directly (no markup, no intermediary)
2. **Privacy**: API keys never leave user's browser
3. **Simplicity**: No backend infrastructure needed
4. **Control**: Users own their data and usage
5. **Flexibility**: Can switch to any OpenAI-compatible API

---

## 📚 Resources

### OpenAI SDK Streaming
- [Streaming Documentation](https://github.com/openai/openai-node#streaming-responses)
- [Stream Helpers](https://github.com/openai/openai-node/blob/main/helpers.md#streaming-helpers)

### Example Code
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: userKey, dangerouslyAllowBrowser: true })

// Stream chat completions
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '')
}
```

---

**Status**: ✅ Ready to execute
**Recommendation**: Start with Phase 1 (Streaming) - highest user impact
**Timeline**: 2-3 weeks for all phases
**Risk**: Low (enhancing existing, not replacing)
