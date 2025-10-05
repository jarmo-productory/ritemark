# Claude Code Configuration - RiteMark: WYSIWYG Markdown Editor for AI-Native Users

## 🎯 PROJECT VISION
**"Google Docs for Markdown"** - A WYSIWYG editor targeting AI-native non-technical users who need visual editing with cloud collaboration and markdown output.

## 🔄 AI-ASSISTED CODING LIFECYCLE (Complements SPARC)

### **🚨 CRITICAL: ALWAYS CHECK EXISTING STATE FIRST**
**MANDATORY FIRST STEP BEFORE ANY WORK:**
1. **Read current codebase** - Check what already exists
2. **Test current state** - Run/build/demo existing functionality
3. **Report findings immediately** - Don't waste tokens on redundant analysis
4. **NEVER deploy swarms/agents for already completed work**

### **6-Step Engineering Process (ONLY after verifying work needed):**

1. **Research/Audit** - Context-specific analysis (market, technical, user research - scope varies by task)
2. **Plan Sprint** - Task breakdown, sprint planning, and roadmap alignment
3. **Code** - Implementation following SPARC methodology phases
4. **Testing, Validating, QA** - Quality assurance, validation, and testing
5. **Cleanup** - Code review, optimization, and technical debt reduction
6. **Commit → Code review → Deploy** - Git workflow and deployment process

### **Integration with SPARC Methodology:**
- **🚨 PRE-STEP**: Always check existing state first (read code, test functionality)
- **Research/Audit** feeds into SPARC **Specification** phase (ONLY if work needed)
- **Plan Sprint** structures SPARC workflow execution and agent coordination
- **Code** phase executes full SPARC cycle (Specification → Pseudocode → Architecture → Refinement → Completion)
- **Testing/QA** validates SPARC outputs and ensures quality
- **Cleanup** ensures maintainable, production-ready code
- **Commit workflow** maintains project integrity and deployment readiness

### **🚨 TOKEN WASTE PREVENTION PROTOCOL:**
1. **ALWAYS** read current sprint files and codebase first
2. **ALWAYS** test/run existing functionality before analysis
3. **IMMEDIATELY** report if work already complete
4. **NEVER** deploy agents/swarms for completed tasks
5. **ASK** for next steps rather than assume work needed

### **📁 DIRECTORY MANAGEMENT RULES:**
**CRITICAL: NEVER create new directories without checking existing structure first**

**MANDATORY BEFORE CREATING ANY DIRECTORY:**
1. **Search existing tree**: Use `find . -type d -name "*keyword*"` or `ls -la` to check existing folders
2. **Use similar directories**: If `/docs/research` exists, use it instead of creating `/research`
3. **Follow existing patterns**: Match the project's established folder structure
4. **Only create NEW directories** if no similar/suitable directory exists

**Examples:**
- ❌ `mkdir docs/research` without checking if it exists
- ✅ `find . -name "*research*" -type d` first, then use existing folder
- ❌ `mkdir src/components` without checking existing structure
- ✅ Check `ls src/` first, use existing patterns

**File Organization Priority:**
1. Use existing directories that match purpose
2. Follow established project structure patterns
3. Only create new directories when absolutely necessary
4. Ask user before creating new top-level directories

### **✅ MANDATORY VALIDATION BEFORE CLAIMING "DONE" (Step 4.5):**

**🚨 ABSOLUTE REQUIREMENT: You must ALWAYS run these validations before telling the user work is complete:**

```bash
# 1. TypeScript compilation (zero errors required)
npm run type-check

# 2. Development server loads without errors
curl -s localhost:5173 | grep -q "RiteMark" && echo "✅ Server OK" || echo "❌ Server FAILED"

# 3. Check browser console for runtime errors (manual step - REQUIRED)
# Open localhost:5173 in browser, check DevTools Console for:
# - Import errors (red messages)
# - React component errors
# - Network errors (if applicable)
# - TypeScript errors in browser

# 4. Verify core functionality works (manual step - REQUIRED)
# - Can you see the UI?
# - Can you interact with buttons/inputs?
# - Are there any visual errors or broken layouts?
```

**Why This Validation Failed in Sprint 8:**
- ❌ Agent claimed "testing passed" but only checked server response via `curl`
- ❌ Never opened browser to see actual JavaScript errors
- ❌ Import path errors (`import '../../types/google-api'`) broke in browser but not in build
- ❌ User saw red error overlay on first browser visit

**New Rule: NEVER claim work complete without browser validation**

**If you cannot open a browser (you're an AI), you MUST:**
1. Run `npm run type-check` (catches most issues)
2. Check dev server responds: `curl localhost:5173`
3. **USE CHROME DEVTOOLS MCP** (if installed) to inspect browser console errors
4. **EXPLICITLY TELL USER**: "I've validated TypeScript and server, but **you should check the browser** at localhost:5173 for runtime errors before I continue"

**Chrome DevTools MCP Setup (MANDATORY for Sprint Validation):**
```bash
# Install Official Chrome DevTools MCP (Google 2025 release)
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

**After Installation - You MUST Restart Claude Code for MCP tools to load**

**MCP Tools Available After Restart:**
- `mcp__chrome-devtools__new_page` - Open URL in Chrome
- `mcp__chrome-devtools__navigate_page` - Navigate to URL
- `mcp__chrome-devtools__list_pages` - List open tabs
- `mcp__chrome-devtools__screenshot_page` - Take screenshots
- `mcp__chrome-devtools__console_page` - Get console logs
- `mcp__chrome-devtools__execute_script` - Run JavaScript in browser

**Mandatory Browser Validation Workflow:**
```bash
# 1. Open localhost:5173 in Chrome via MCP
mcp__chrome-devtools__new_page { url: "http://localhost:5173" }

# 2. Get console logs to check for errors
mcp__chrome-devtools__console_page

# 3. Take screenshot to verify UI
mcp__chrome-devtools__screenshot_page

# 4. Execute test script if needed
mcp__chrome-devtools__execute_script { script: "document.querySelector('.file-menu-trigger')" }
```

**Alternative MCP Servers (if chrome-devtools doesn't work):**
- `chrome-debug` by Robert Headley - Advanced Chrome DevTools Protocol
- `puppeteer-mcp-server` - Direct Puppeteer automation

**Why Chrome DevTools MCP is Critical:**
- Catches React Hooks order errors (like FileMenu issue)
- Detects import path errors that break at runtime
- Validates actual browser rendering vs. server response
- Prevents user from seeing red error overlays

### **🧹 CLEANUP PHASE LESSONS LEARNED (Step 5):**

**CRITICAL: Cleanup is NOT optional - it's MANDATORY before commit:**

**What Must Be Removed:**
1. **Stale Code Files** - Remove unused/old component files (e.g., `TextEditor.tsx` when replaced by `Editor.tsx`)
2. **AI-Generated Comments** - Remove ALL unnecessary AI artifacts:
   - ❌ `/* Johnny Ive invisible interface */`
   - ❌ `// Add enhanced list support`
   - ❌ `// Beautiful selection styling`
   - ✅ Keep only comments that help NEXT DEVELOPER understand logic
3. **Misleading Names** - Fix development artifacts:
   - ❌ `MilkdownEditor.tsx` when using TipTap
   - ❌ Component names that don't match technology used
   - ✅ Names must accurately reflect implementation
4. **Build Artifacts** - Clean `dist/`, temp files, empty directories
5. **Console Noise** - Remove development logs, unused imports
6. **Dependency Bloat** - Remove unused packages from package.json

**Cleanup Validation Process:**
```bash
# 1. Remove stale files
find . -name "*.old" -o -name "*.backup" -delete
rm -rf dist/

# 2. Validate everything still works
npm run lint
npm run type-check
npm run build

# 3. Check file naming accuracy
ls src/components/  # Names should match technology used

# 4. Review comments for AI artifacts
grep -r "Johnny\|Add enhanced\|Beautiful\|AI generated" src/
```

**Why This Matters:**
- **Professional Code** - No development artifacts in production
- **Team Confusion** - Future developers don't get misled by wrong names
- **Maintainability** - Clean code is easier to understand and modify
- **Performance** - No unused code bloating bundle size

**Remember: USER WILL CALL OUT MISSED CLEANUP** - Always do thorough cleanup before claiming work complete!

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Claude Code Task Tool for Agent Execution

**Claude Code's Task tool is the PRIMARY way to spawn agents:**
```javascript
// ✅ CORRECT: Use Claude Code's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze React/Drive API patterns...", "researcher")
  Task("Frontend coder", "Implement React components with Drive integration...", "coder")
  Task("API specialist", "Build Google Drive API service layer...", "api-docs")
  Task("Test engineer", "Create browser-based tests for Drive operations...", "tester")
  Task("OAuth specialist", "Implement secure OAuth2 browser flow...", "security-manager")
```

**MCP tools are ONLY for coordination setup:**
- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files (React components, services, utils)
- `/src/components` - React components
- `/src/services` - Google Drive API services
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions
- `/tests` - Test files (Jest, React Testing Library)
- `/public` - Static assets and manifest files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files (OAuth, environment)
- `/scripts` - Build and deployment scripts

### 📋 Sprint & Roadmap Tracking

**Simple Progress Tracking Structure:**
- `/docs/roadmap.md` - Single source of truth for project roadmap
- `/docs/sprints/sprint-XX.md` - One file per sprint with tasks & progress

**Sprint Management Rules:**
- Sprints are numbered sequentially (sprint-01, sprint-02, sprint-03, etc.)
- **Highest number = current sprint** (no special "current" naming)
- **New sprint files created ONLY after previous sprint is completed**
- Each sprint file tracks progress through the 6-step AI-Assisted Coding Lifecycle
- Archives naturally - completed sprints remain as historical records

## Project Overview

**RiteMark** is a **WYSIWYG markdown editor** designed for **AI-native non-technical users** who want visual editing with cloud collaboration and markdown output. The project pivoted from complex marketplace integration to a clean, standalone approach following evidence-based user research.

**Strategic Position:** "Google Docs for Markdown" - bridging the gap between technical markdown editors and collaborative document editing.

**Target Users:** Content creators, marketing teams, and AI-native professionals who need markdown output but want visual editing and real-time collaboration.

**Key Features:**
- **Milkdown-based WYSIWYG editor** (no raw markdown visible to users)
- **Google Drive integration** for cloud-native file operations
- **Real-time collaboration** with Y.js CRDT technology
- **OAuth2 browser authentication** (no server complexity)
- **Mobile-first responsive design** for modern work patterns
- **AI-ready architecture** for future writing assistance integration
- **Professional UX** (anti-IDE design for non-technical users)

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `npm run build` - Build React app for production
- `npm run dev` - Start development server with hot reload
- `npm run test` - Run Jest tests with React Testing Library
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - ESLint with React and TypeScript rules
- `npm run lint:fix` - Auto-fix linting issues
- `npm run typecheck` - TypeScript type checking
- `npm run preview` - Preview production build locally

### 🚨 CRITICAL: Development Server Port Management
**ABSOLUTE RULE**: Web app MUST ALWAYS run on `localhost:5173` (never drift from this!)

**Before starting development server:**
1. **Kill any existing process on port 5173** first
2. **Always verify port is free** before running `npm run dev`
3. **Never use different ports** - this creates deployment and testing inconsistencies

**Port Management Commands:**
```bash
# Kill any process using port 5173
lsof -ti:5173 | xargs kill -9

# Then start development server
npm run dev

# Verify it's running on correct port
curl localhost:5173
```

**Why This Matters:**
- Consistent development environment across all sessions
- Prevents port conflicts and deployment issues
- Ensures all team members and AI agents use same URL
- Avoids browser cache and CORS issues from port switching

### Quality Assurance Commands (Step 4: Testing/Validation)
- `npm run test:coverage` - Generate test coverage reports
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run validate:accessibility` - WCAG accessibility validation
- `npm run validate:performance` - Lighthouse performance audits
- `npm run validate:security` - Security vulnerability scanning

### Google Cloud & OAuth Setup Commands
- `npm run setup:gcp` - Initialize Google Cloud Console project
- `npm run setup:oauth` - Configure OAuth2 credentials
- `npm run setup:drive` - Enable Google Drive API
- `npm run validate:env` - Validate environment variables

## SPARC Workflow Phases (Milkdown WYSIWYG Focus)

1. **Specification** - WYSIWYG requirements and user experience analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Milkdown plugin architecture and component design (`sparc run spec-pseudocode`)
3. **Architecture** - WYSIWYG editor with Drive integration and Y.js collaboration (`sparc run architect`)
4. **Refinement** - TDD with visual editing tests and Drive sync validation (`sparc tdd`)
5. **Completion** - Mobile-responsive deployment and real-time collaboration testing (`sparc run integration`)

## Code Style & Best Practices

### Milkdown WYSIWYG Standards
- **Visual-First Design**: No raw markdown visible to users
- **Plugin Architecture**: Modular Milkdown plugins for features
- **Y.js Integration**: Real-time collaborative editing with CRDT
- **Mobile Optimization**: Touch-friendly toolbar and interactions
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance**: Lazy loading for large documents

### React & TypeScript Standards
- **Component Design**: Functional components with hooks
- **TypeScript First**: Strict type checking enabled
- **Props Interface**: Define clear prop interfaces for Milkdown components
- **Custom Hooks**: Extract editor state and Drive operations into hooks
- **Error Boundaries**: Implement for editor crashes and Drive API failures
- **Testing**: React Testing Library with editor interaction tests

### Google Drive API Best Practices
- **OAuth Security**: Secure token storage and refresh
- **API Rate Limits**: Implement exponential backoff
- **Error Handling**: Graceful degradation for network failures
- **Real-time Sync**: Y.js CRDT with Drive persistence layer
- **Privacy**: Minimal scope requests (drive.file only)
- **Collaboration**: WebSocket fallback for Y.js provider

### Browser Security
- **CSP Headers**: Content Security Policy implementation
- **CORS Handling**: Proper cross-origin request setup
- **Token Security**: Secure storage of OAuth tokens
- **XSS Prevention**: Input sanitization for markdown content
- **Environment Safety**: Never expose API secrets to browser

## 🚀 Available Agents (Optimized for Frontend + Drive Integration)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Frontend Specialists
`react-developer`, `typescript-specialist`, `component-architect`, `hook-designer`, `state-manager`, `ui-designer`, `accessibility-expert`

### Google Drive Integration
`oauth-specialist`, `drive-api-expert`, `file-picker-dev`, `cloud-storage-architect`, `api-rate-limiter`, `auth-flow-designer`

### Browser & Security
`browser-security`, `oauth-security`, `csp-manager`, `cors-specialist`, `token-manager`, `privacy-auditor`, `xss-preventer`

### Testing & Quality
`react-tester`, `browser-tester`, `integration-tester`, `accessibility-tester`, `performance-tester`, `security-auditor`

### Build & Deployment
`vite-specialist`, `webpack-optimizer`, `static-deployer`, `cdn-manager`, `pwa-architect`, `performance-optimizer`

### SPARC Methodology (Frontend-Focused)
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Swarm Coordination
`mesh-coordinator`, `adaptive-coordinator`, `frontend-coordinator`, `api-coordinator`, `test-coordinator`

### GitHub & Repository
`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`

### Performance & Optimization
`perf-analyzer`, `bundle-analyzer`, `lighthouse-auditor`, `web-vitals-optimizer`, `memory-profiler`

### API & Services
`api-docs`, `service-architect`, `error-handler`, `retry-manager`, `cache-strategist`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently for actual work
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY COORDINATE:
- Swarm initialization (topology setup)
- Agent type definitions (coordination patterns)
- Task orchestration (high-level planning)
- Memory management
- Neural features
- Performance tracking
- GitHub integration

**KEY**: MCP coordinates the strategy, Claude Code's Task tool executes with real agents.

## 🚀 Quick Setup

```bash
# Add MCP servers (Claude Flow required, others optional)
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional: Cloud features
```

## MCP Tool Categories

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

### Flow-Nexus MCP Tools (Optional Advanced Features)
Flow-Nexus extends MCP capabilities with 70+ cloud-based orchestration tools:

**Key MCP Tool Categories:**
- **Swarm & Agents**: `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`
- **Sandboxes**: `sandbox_create`, `sandbox_execute`, `sandbox_upload` (cloud execution)
- **Templates**: `template_list`, `template_deploy` (pre-built project templates)
- **Neural AI**: `neural_train`, `neural_patterns`, `seraphina_chat` (AI assistant)
- **GitHub**: `github_repo_analyze`, `github_pr_manage` (repository management)
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe` (live monitoring)
- **Storage**: `storage_upload`, `storage_list` (cloud file management)

**Authentication Required:**
- Register: `mcp__flow-nexus__user_register` or `npx flow-nexus@latest register`
- Login: `mcp__flow-nexus__user_login` or `npx flow-nexus@latest login`
- Access 70+ specialized MCP tools for advanced orchestration

## 🚀 Agent Execution Flow with Claude Code

### The Correct Pattern:

1. **Optional**: Use MCP tools to set up coordination topology
2. **REQUIRED**: Use Claude Code's Task tool to spawn agents that do actual work
3. **REQUIRED**: Each agent runs hooks for coordination
4. **REQUIRED**: Batch all operations in single messages

### Example Full-Stack Development:

```javascript
// Single message with all agent spawning via Claude Code's Task tool
[Parallel Agent Execution]:
  Task("Backend Developer", "Build REST API with Express. Use hooks for coordination.", "backend-dev")
  Task("Frontend Developer", "Create React UI. Coordinate with backend via memory.", "coder")
  Task("Database Architect", "Design PostgreSQL schema. Store schema in memory.", "code-analyzer")
  Task("Test Engineer", "Write Jest tests. Check memory for API contracts.", "tester")
  Task("DevOps Engineer", "Setup Docker and CI/CD. Document in memory.", "cicd-engineer")
  Task("Security Auditor", "Review authentication. Report findings via hooks.", "reviewer")
  
  // All todos batched together
  TodoWrite { todos: [...8-10 todos...] }
  
  // All file operations together
  Write "backend/server.js"
  Write "frontend/App.jsx"
  Write "database/schema.sql"
```

## 📋 Agent Coordination Protocol

### Every Agent Spawned via Task Tool MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT WORKFLOW: MCP Coordinates, Claude Code Executes

```javascript
// Step 1: MCP tools set up coordination (optional, for complex tasks)
[Single Message - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }

// Step 2: Claude Code Task tool spawns ACTUAL agents that do the work
[Single Message - Parallel Agent Execution]:
  // Claude Code's Task tool spawns real agents concurrently
  Task("Research agent", "Analyze API requirements and best practices. Check memory for prior decisions.", "researcher")
  Task("Coder agent", "Implement REST endpoints with authentication. Coordinate via hooks.", "coder")
  Task("Database agent", "Design and implement database schema. Store decisions in memory.", "code-analyzer")
  Task("Tester agent", "Create comprehensive test suite with 90% coverage.", "tester")
  Task("Reviewer agent", "Review code quality and security. Document findings.", "reviewer")
  
  // Batch ALL todos in ONE call
  TodoWrite { todos: [
    {id: "1", content: "Research API patterns", status: "in_progress", priority: "high"},
    {id: "2", content: "Design database schema", status: "in_progress", priority: "high"},
    {id: "3", content: "Implement authentication", status: "pending", priority: "high"},
    {id: "4", content: "Build REST endpoints", status: "pending", priority: "high"},
    {id: "5", content: "Write unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Integration tests", status: "pending", priority: "medium"},
    {id: "7", content: "API documentation", status: "pending", priority: "low"},
    {id: "8", content: "Performance optimization", status: "pending", priority: "low"}
  ]}
  
  // Parallel file operations
  Bash "mkdir -p app/{src,tests,docs,config}"
  Write "app/package.json"
  Write "app/src/server.js"
  Write "app/tests/server.test.js"
  Write "app/docs/API.md"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Flow-Nexus Platform: https://flow-nexus.ruv.io (registration required for cloud features)

---

Remember: **Claude Flow coordinates, Claude Code creates!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.
