# Sprint 18: Implementation Plan

**Status**: ✅ Ready for Execution
**Estimated Time**: 4-6 hours
**Target**: October 26, 2025

---

## 🎯 Implementation Strategy

### Golden Rule
**"Check existing state first, then build"** (CLAUDE.md mandate)

1. ✅ **State Check Complete**: DocumentMenu exists (Sprint 17)
2. ✅ **Validation Complete**: TipTap editor provides `getHTML()`
3. ✅ **Validation Complete**: TurndownService converts HTML → markdown
4. ✅ **Ready to Build**: All prerequisites verified

---

## 📋 Phase 1: Copy to Clipboard (2 hours)

### Task 1.1: Create Clipboard Utility (30 min)

**File**: `/ritemark-app/src/utils/clipboard.ts` (NEW)

```typescript
/**
 * Copy content to clipboard with dual format support
 * Provides both rich HTML and plain markdown for maximum compatibility
 */

export interface ClipboardCopyResult {
  success: boolean
  error?: string
}

export async function copyFormattedContent(
  html: string,
  markdown: string
): Promise<ClipboardCopyResult> {
  // Check browser support
  if (!navigator.clipboard || !window.isSecureContext) {
    return {
      success: false,
      error: 'Clipboard API not available (HTTPS required)'
    }
  }

  try {
    // Create ClipboardItem with both formats
    // CRITICAL: Must provide both text/html AND text/plain (W3C spec)
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([markdown], { type: 'text/plain' })
    })

    await navigator.clipboard.write([clipboardItem])

    return { success: true }

  } catch (error) {
    console.error('Clipboard copy failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Copy failed'
    }
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}
```

**Validation**:
- [ ] TypeScript compiles with no errors
- [ ] Exports both functions
- [ ] Handles W3C dual-format requirement

---

### Task 1.2: Update App.tsx Props (15 min)

**File**: `/ritemark-app/src/App.tsx`

**Current state** (line ~305):
```typescript
<DocumentMenu fileId={fileId} disabled={!fileId} />
```

**Change to**:
```typescript
<DocumentMenu
  fileId={fileId}
  disabled={!fileId}
  content={content}           // Add: Current markdown content
  editor={editor}             // Add: TipTap editor instance
  documentTitle={title}       // Add: For toast notifications
/>
```

**Validation**:
- [ ] TypeScript compiles
- [ ] No props missing
- [ ] DocumentMenu receives all required data

---

### Task 1.3: Update DocumentMenu Component (45 min)

**File**: `/ritemark-app/src/components/layout/DocumentMenu.tsx`

#### Step 1: Update Interface
```typescript
import { Copy } from "lucide-react"  // Add Copy icon
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"  // Add separator
import { copyFormattedContent } from "@/utils/clipboard"
import type { Editor as TipTapEditor } from '@tiptap/react'

interface DocumentMenuProps {
  fileId: string | null
  disabled?: boolean
  content: string              // NEW: Markdown content
  editor: TipTapEditor | null  // NEW: Editor instance for HTML
  documentTitle: string        // NEW: For toast messages
}
```

#### Step 2: Add Copy Handler
```typescript
export function DocumentMenu({
  fileId,
  disabled = false,
  content,
  editor,
  documentTitle
}: DocumentMenuProps) {

  // Existing version history handler...

  const handleCopyToClipboard = React.useCallback(async () => {
    if (!editor) {
      toast.error('Editor not ready')
      return
    }

    try {
      // Get HTML from TipTap editor
      const html = editor.getHTML()

      // Use existing markdown (already converted by TurndownService)
      const markdown = content

      // Copy both formats to clipboard
      const result = await copyFormattedContent(html, markdown)

      if (result.success) {
        toast.success('Copied to clipboard!', {
          description: `"${documentTitle}" ready to paste`
        })
      } else {
        toast.error('Failed to copy', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Copy failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [editor, content, documentTitle])

  // Keyboard shortcut: Cmd/Ctrl+Shift+C
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault()
        handleCopyToClipboard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCopyToClipboard])

  // ... rest of component
}
```

#### Step 3: Add Menu Item
```typescript
<DropdownMenuContent align="end">
  <DropdownMenuItem
    onClick={handleVersionHistory}
    disabled={!fileId}
  >
    <History className="mr-2 h-4 w-4" />
    View Version History
    <span className="ml-auto text-xs tracking-widest opacity-60">
      ⌘⇧H
    </span>
  </DropdownMenuItem>

  {/* NEW: Separator */}
  <DropdownMenuSeparator />

  {/* NEW: Copy to Clipboard */}
  <DropdownMenuItem
    onClick={handleCopyToClipboard}
    disabled={!editor}
  >
    <Copy className="mr-2 h-4 w-4" />
    Copy to Clipboard
    <span className="ml-auto text-xs tracking-widest opacity-60">
      ⌘⇧C
    </span>
  </DropdownMenuItem>

  {/* Word export will be added in Phase 2 */}
</DropdownMenuContent>
```

**Validation**:
- [ ] Menu item appears in kebab dropdown
- [ ] Click triggers copy
- [ ] Keyboard shortcut ⌘⇧C works
- [ ] Toast notification shows on success/error
- [ ] Disabled state when editor not ready

---

### Task 1.4: Test Copy to Clipboard (30 min)

**Test Matrix**:

| Target App | Test | Expected Result |
|-----------|------|-----------------|
| Microsoft Word | Paste after copy | ✅ Formatting preserved (headings, bold, italic, lists) |
| Google Docs | Paste after copy | ✅ Formatting preserved |
| Gmail (compose) | Paste after copy | ✅ Formatting preserved |
| Slack | Paste after copy | ✅ Formatting preserved |
| VS Code | Paste after copy | ✅ Plain markdown shown |
| Notepad | Paste after copy | ✅ Plain markdown shown |

**Browser Testing**:
- [ ] Chrome: Copy works, paste preserves formatting
- [ ] Firefox: Copy works, paste preserves formatting
- [ ] Safari: Copy works, paste preserves formatting

**Error Cases**:
- [ ] HTTP (not HTTPS): Shows error toast about HTTPS requirement
- [ ] Editor not loaded: Menu item disabled
- [ ] Keyboard shortcut when editor not ready: Shows error toast

---

## 📋 Phase 2: Word Export (3 hours)

### Task 2.1: Add Dependency (5 min)

**File**: `/ritemark-app/package.json`

```bash
npm install @mohtasham/md-to-docx
```

**Validation**:
- [ ] `package.json` updated
- [ ] `package-lock.json` updated
- [ ] No conflicting dependencies

---

### Task 2.2: Create Word Export Service (45 min)

**File**: `/ritemark-app/src/services/export/wordExport.ts` (NEW)

```typescript
/**
 * Word (.docx) export service with lazy loading
 * Dynamically imports conversion library only when needed
 */

export interface WordExportOptions {
  documentTitle: string
  author?: string
  createdAt?: string
}

export interface WordExportResult {
  success: boolean
  error?: string
}

/**
 * Export markdown to Word (.docx) file
 * Uses dynamic import for lazy loading (~500 KB library)
 */
export async function exportToWord(
  markdown: string,
  options: WordExportOptions
): Promise<WordExportResult> {
  try {
    // Lazy load Word conversion library
    // CRITICAL: Only loads on first Word export (not in initial bundle)
    const { markdownToDocx } = await import('@mohtasham/md-to-docx')

    // Convert markdown to .docx
    const docxBuffer = await markdownToDocx({
      markdown,
      fontSize: 12,
      fontFamily: 'Calibri',
      alignment: 'left',

      // Optional metadata
      ...(options.author && { author: options.author }),
      ...(options.createdAt && { createdDate: options.createdAt })
    })

    // Trigger browser download
    const blob = new Blob([docxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizeFilename(options.documentTitle)}.docx`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    URL.revokeObjectURL(url)

    return { success: true }

  } catch (error) {
    console.error('Word export failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
}

/**
 * Sanitize filename for safe download
 * Removes invalid characters for Windows/Mac/Linux
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars
    .replace(/\s+/g, '_')            // Replace spaces with underscores
    .substring(0, 200)               // Limit length (leave room for .docx)
}
```

**Validation**:
- [ ] TypeScript compiles
- [ ] Dynamic import syntax correct
- [ ] Filename sanitization works
- [ ] Blob download triggers correctly

---

### Task 2.3: Add Word Export to DocumentMenu (30 min)

**File**: `/ritemark-app/src/components/layout/DocumentMenu.tsx`

```typescript
import { FileDown } from "lucide-react"  // Add FileDown icon
import { exportToWord } from "@/services/export/wordExport"

// Add to DocumentMenuProps (if not already there)
interface DocumentMenuProps {
  // ... existing props
  authorName?: string  // NEW: From AuthContext
}

// Add Word export handler
const handleExportWord = React.useCallback(async () => {
  if (!content) {
    toast.error('No content to export')
    return
  }

  try {
    // Show loading toast
    const loadingToast = toast.loading('Preparing Word document...')

    const result = await exportToWord(content, {
      documentTitle: documentTitle,
      author: authorName,
      createdAt: new Date().toISOString()
    })

    // Dismiss loading toast
    toast.dismiss(loadingToast)

    if (result.success) {
      toast.success('Exported to Word!', {
        description: `${documentTitle}.docx downloaded`
      })
    } else {
      toast.error('Export failed', {
        description: result.error
      })
    }
  } catch (error) {
    toast.error('Export failed', {
      description: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}, [content, documentTitle, authorName])

// Add to menu items (after Copy to Clipboard)
<DropdownMenuItem onClick={handleExportWord}>
  <FileDown className="mr-2 h-4 w-4" />
  Export as Word
</DropdownMenuItem>
```

**Validation**:
- [ ] Menu item appears after "Copy to Clipboard"
- [ ] Click shows loading toast
- [ ] File downloads with correct name
- [ ] Loading toast dismisses on success/error

---

### Task 2.4: Pass Author Name from App.tsx (15 min)

**File**: `/ritemark-app/src/App.tsx`

```typescript
// Get auth context
const authContext = useContext(AuthContext)

// Update DocumentMenu props
<DocumentMenu
  fileId={fileId}
  disabled={!fileId}
  content={content}
  editor={editor}
  documentTitle={title}
  authorName={authContext?.user?.name}  // NEW: Pass author name
/>
```

**Validation**:
- [ ] AuthContext imported
- [ ] Author name passed to DocumentMenu
- [ ] Word export includes author metadata

---

### Task 2.5: Test Word Export (1 hour 15 min)

**Functional Testing** (30 min):
- [ ] Click "Export as Word" → File downloads
- [ ] Filename is sanitized correctly
- [ ] Loading toast appears and dismisses
- [ ] Success toast shows with filename

**Microsoft Word Testing** (30 min):
- [ ] Open exported .docx in Microsoft Word
- [ ] Headings render correctly (H1-H6)
- [ ] Bold/italic text preserved
- [ ] Lists (bullet and numbered) render correctly
- [ ] Tables render (if supported by library)
- [ ] Line breaks and paragraphs correct
- [ ] Author metadata visible in Word properties

**Browser Testing** (15 min):
- [ ] Chrome: Download works
- [ ] Firefox: Download works
- [ ] Safari: Download works

---

## 📋 Phase 3: Testing & Polish (1 hour)

### Task 3.1: Error Handling (20 min)

**Test Cases**:
- [ ] Offline: Copy shows error (Clipboard API unavailable)
- [ ] HTTP site: Copy shows HTTPS requirement error
- [ ] Editor not loaded: Menu items disabled
- [ ] Empty document: Word export handles gracefully
- [ ] Very large document (50+ pages): Test conversion time

**Expected Behavior**:
- All errors show user-friendly toast messages
- No console errors
- Graceful degradation (features disable, not crash)

---

### Task 3.2: Accessibility Testing (20 min)

**Keyboard Navigation**:
- [ ] Tab to kebab menu → Enter opens dropdown
- [ ] Arrow keys navigate menu items
- [ ] ⌘⇧C triggers copy (Mac)
- [ ] Ctrl+Shift+C triggers copy (Windows/Linux)
- [ ] Esc closes menu

**Screen Reader** (if available):
- [ ] Menu items announced correctly
- [ ] Keyboard shortcuts announced
- [ ] Success/error toasts announced

---

### Task 3.3: Cross-Browser Final Validation (20 min)

| Browser | Copy Test | Word Export | Notes |
|---------|-----------|-------------|-------|
| Chrome 131+ | ✅ | ✅ | |
| Firefox 133+ | ✅ | ✅ | |
| Safari 18+ | ✅ | ✅ | |
| Edge 131+ | ✅ | ✅ | |

**Mobile Testing** (Optional):
- [ ] iOS Safari: Copy works with user gesture
- [ ] Android Chrome: Copy works

---

## ✅ Final Checklist Before Commit

### Code Quality
- [ ] `npm run type-check` - Zero TypeScript errors
- [ ] `npm run lint` - Zero ESLint warnings
- [ ] `npm run build` - Build succeeds
- [ ] No console errors in browser
- [ ] No unused imports or variables

### Functionality
- [ ] Copy to Clipboard: Works in 4+ applications
- [ ] Word Export: Opens correctly in Microsoft Word
- [ ] Keyboard shortcuts work (⌘⇧C)
- [ ] Toast notifications show for all actions
- [ ] Loading states during Word export

### Documentation
- [ ] Code comments added for complex logic
- [ ] Sprint 18 README updated with completion date
- [ ] Roadmap updated with Sprint 18 completion

---

## 🚀 Deployment Steps

1. **Create PR**:
   ```bash
   git checkout -b sprint-18-export-features
   git add .
   git commit -m "Sprint 18: Add Copy to Clipboard and Word Export

   - Add dual-format clipboard copy (HTML + markdown)
   - Add Word (.docx) export with lazy loading
   - Integrate into DocumentMenu kebab
   - Add keyboard shortcuts (⌘⇧C)
   - Add toast notifications for all actions

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"

   git push origin sprint-18-export-features
   ```

2. **Create Pull Request**:
   - Title: "Sprint 18: Export Features - Copy to Clipboard & Word Export"
   - Description: Link to `/docs/sprints/sprint-18/README.md`
   - Request review from team

3. **Merge & Deploy**:
   - Merge to `main` after approval
   - Netlify auto-deploys
   - Verify on production URL

---

## 📊 Estimated Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| **Phase 1** | Copy to Clipboard | **2 hours** |
| 1.1 | Create clipboard utility | 30 min |
| 1.2 | Update App.tsx props | 15 min |
| 1.3 | Update DocumentMenu | 45 min |
| 1.4 | Test copy functionality | 30 min |
| **Phase 2** | Word Export | **3 hours** |
| 2.1 | Add dependency | 5 min |
| 2.2 | Create Word export service | 45 min |
| 2.3 | Add to DocumentMenu | 30 min |
| 2.4 | Pass author name | 15 min |
| 2.5 | Test Word export | 1h 15min |
| **Phase 3** | Testing & Polish | **1 hour** |
| 3.1 | Error handling | 20 min |
| 3.2 | Accessibility testing | 20 min |
| 3.3 | Cross-browser validation | 20 min |
| **TOTAL** | | **6 hours** |

**Contingency**: +1 hour for unexpected issues

---

**Implementation Start**: October 26, 2025
**Target Completion**: October 26, 2025 (same day)
**Status**: 🎯 Ready to Execute
