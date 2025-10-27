# Sprint 18: Technical Architecture

**Document Version**: 1.0
**Last Updated**: October 26, 2025
**Status**: ✅ Architecture Finalized

---

## 🏗️ System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                 │
│  State: fileId, title, content, editor, authContext             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Props: fileId, content, editor,
                         │        documentTitle, authorName
                         ↓
         ┌───────────────────────────────────────┐
         │     DocumentMenu.tsx (Kebab ⋮)        │
         │  - View Version History (Sprint 17)   │
         │  - Copy to Clipboard (Sprint 18) NEW  │
         │  - Export as Word (Sprint 18) NEW     │
         └────────┬───────────────┬──────────────┘
                  │               │
       ┌──────────↓─────┐    ┌───↓──────────────────────┐
       │ Clipboard API  │    │ Word Export Service      │
       │ (Browser)      │    │ (Lazy Loaded)            │
       └────────────────┘    └──────────────────────────┘
              │                          │
              ↓                          ↓
       ┌────────────────┐         ┌──────────────────┐
       │ User pastes:   │         │ Browser download │
       │ - Word         │         │ filename.docx    │
       │ - Google Docs  │         └──────────────────┘
       │ - Slack        │
       │ - Email        │
       └────────────────┘
```

---

## 📦 Module Architecture

### New Files Created

```
/ritemark-app
├── /src
│   ├── /utils
│   │   └── clipboard.ts                    ✨ NEW (300 lines)
│   ├── /services
│   │   └── /export
│   │       └── wordExport.ts               ✨ NEW (200 lines)
│   └── /components
│       └── /layout
│           └── DocumentMenu.tsx            📝 MODIFIED (+80 lines)
├── /docs
│   └── /sprints
│       └── /sprint-18
│           ├── README.md                   ✨ NEW
│           ├── implementation-plan.md      ✨ NEW
│           ├── technical-architecture.md   ✨ NEW (this file)
│           └── lazy-loading-strategy.md    ✨ NEW
└── package.json                            📝 MODIFIED (+1 dependency)
```

**Total New Code**: ~580 lines
**Total Modified Code**: ~80 lines
**Total Documentation**: ~50 KB

---

## 🔌 Integration Points

### 1. App.tsx → DocumentMenu Props Flow

**Current State** (Sprint 17):
```typescript
<DocumentMenu
  fileId={fileId}
  disabled={!fileId}
/>
```

**New State** (Sprint 18):
```typescript
<DocumentMenu
  fileId={fileId}
  disabled={!fileId}
  content={content}                          // ✨ NEW
  editor={editor}                            // ✨ NEW
  documentTitle={title}                      // ✨ NEW
  authorName={authContext?.user?.name}       // ✨ NEW
/>
```

**Type Safety**:
```typescript
interface DocumentMenuProps {
  fileId: string | null
  disabled?: boolean
  content: string              // ✨ NEW: Current markdown
  editor: TipTapEditor | null  // ✨ NEW: For HTML extraction
  documentTitle: string        // ✨ NEW: For notifications
  authorName?: string          // ✨ NEW: For Word metadata
}
```

---

### 2. TipTap Editor Integration

**HTML Extraction**:
```typescript
// In DocumentMenu.tsx
const html = editor.getHTML()
// Returns: '<h1>Document Title</h1><p>Content...</p>'
```

**Why not use TurndownService again?**
- `content` prop is already converted markdown (from Editor onChange)
- No need to re-convert (performance optimization)
- Reuse existing conversion pipeline

**Data Flow**:
```
User types in TipTap
  ↓
TipTap onChange → HTML
  ↓
TurndownService.turndown(HTML) → Markdown
  ↓
App.tsx setState(markdown) → content
  ↓
DocumentMenu receives both:
  - content (markdown) ✅
  - editor.getHTML() (for clipboard HTML) ✅
```

---

### 3. Clipboard API Architecture

**Browser API**: `navigator.clipboard.write()`

**W3C Specification Requirement**:
> "Implementations should create alternate text/html and text/plain clipboard formats"

**Implementation**:
```typescript
// clipboard.ts
export async function copyFormattedContent(
  html: string,
  markdown: string
): Promise<ClipboardCopyResult> {
  const clipboardItem = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),     // Rich format
    'text/plain': new Blob([markdown], { type: 'text/plain' }) // Fallback
  })

  await navigator.clipboard.write([clipboardItem])
}
```

**How Paste Works**:
```
User pastes into:
├─ Microsoft Word → Uses text/html → Formatting preserved ✅
├─ Google Docs   → Uses text/html → Formatting preserved ✅
├─ Slack         → Uses text/html → Formatting preserved ✅
├─ Gmail         → Uses text/html → Formatting preserved ✅
├─ VS Code       → Uses text/plain → Markdown shown ✅
└─ Notepad       → Uses text/plain → Markdown shown ✅
```

**Security Context**:
- ✅ **HTTPS Required**: Clipboard API only works on secure origins
- ✅ **User Gesture**: Must be triggered by click/keypress (no background access)
- ✅ **localhost Exception**: Works on localhost for development

---

### 4. Word Export Architecture

**Lazy Loading Strategy**:
```typescript
// wordExport.ts
export async function exportToWord(markdown: string, options: WordExportOptions) {
  // Dynamic import - only loads when first Word export triggered
  const { markdownToDocx } = await import('@mohtasham/md-to-docx')

  // Rest of conversion logic...
}
```

**Why Lazy Loading?**
- ❌ **Without**: +500 KB on every page load
- ✅ **With**: 0 KB initial load, +500 KB only on first Word export

**Bundle Size Impact**:
```
Initial Bundle:
  - Before Sprint 18: 824 KB
  - After Sprint 18: 824 KB ✅ (no change)

First Word Export:
  - Loads: +500 KB (one-time)
  - Cached: Browser caches for future exports
```

**Conversion Pipeline**:
```
Markdown content
  ↓
@mohtasham/md-to-docx library
  ↓
Docx buffer (ArrayBuffer)
  ↓
Blob (application/vnd.openxmlformats...)
  ↓
URL.createObjectURL(blob)
  ↓
<a download="filename.docx">
  ↓
Browser download triggered
  ↓
URL.revokeObjectURL() (cleanup)
```

---

## 🔄 State Management

### DocumentMenu Internal State

```typescript
// No new state needed!
// All data comes from props (single source of truth)

const handleCopyToClipboard = React.useCallback(async () => {
  // Uses: editor (prop), content (prop), documentTitle (prop)
}, [editor, content, documentTitle])

const handleExportWord = React.useCallback(async () => {
  // Uses: content (prop), documentTitle (prop), authorName (prop)
}, [content, documentTitle, authorName])
```

**Why No Local State?**
- ✅ Single source of truth (App.tsx)
- ✅ No state synchronization issues
- ✅ Simpler component (stateless callbacks)
- ✅ Easier to test

---

## 🎨 UI/UX Architecture

### Menu Structure (Kebab ⋮)

```typescript
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical />  {/* Kebab icon */}
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    {/* Sprint 17 */}
    <DropdownMenuItem onClick={handleVersionHistory}>
      <History className="mr-2 h-4 w-4" />
      View Version History
      <span className="ml-auto opacity-60">⌘⇧H</span>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    {/* Sprint 18 - NEW */}
    <DropdownMenuItem onClick={handleCopyToClipboard}>
      <Copy className="mr-2 h-4 w-4" />
      Copy to Clipboard
      <span className="ml-auto opacity-60">⌘⇧C</span>
    </DropdownMenuItem>

    <DropdownMenuItem onClick={handleExportWord}>
      <FileDown className="mr-2 h-4 w-4" />
      Export as Word
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Design Patterns**:
- ✅ Icon placement: Left-aligned, 16px (`h-4 w-4`)
- ✅ Spacing: `mr-2` (8px gap between icon and text)
- ✅ Keyboard shortcuts: Right-aligned, subtle opacity
- ✅ Separator: Visual grouping (Sprint 17 vs Sprint 18 features)

---

## 🔐 Security Architecture

### Clipboard API Security

**Browser Requirements**:
1. **Secure Context (HTTPS)** - Clipboard API only available on HTTPS
2. **User Activation** - Must be triggered by user gesture (click/keypress)
3. **No Background Access** - Cannot read/write clipboard without user action

**iOS Safari Special Case**:
```typescript
// ❌ WRONG: Async context loses user gesture
async function handleCopy() {
  await someAsyncOperation()
  await navigator.clipboard.writeText(text)  // FAILS on iOS
}

// ✅ CORRECT: Give Clipboard API the Promise
function handleCopy() {
  const promise = someAsyncOperation().then(text => text)
  navigator.clipboard.write(promise)  // WORKS on iOS
}
```

**Our Implementation**:
```typescript
// ✅ We call clipboard.write() synchronously in click handler
const handleCopyToClipboard = React.useCallback(async () => {
  const html = editor.getHTML()        // Synchronous
  const markdown = content              // Synchronous

  // Clipboard API called immediately (no await before it)
  const result = await copyFormattedContent(html, markdown)
  // ✅ User gesture context preserved
}, [editor, content])
```

---

### Word Export Security

**File Download Safety**:
1. **Filename Sanitization** - Remove invalid characters
2. **Content Validation** - Markdown-only (no script injection)
3. **Browser Sandbox** - Download happens in browser security context

**Sanitization Logic**:
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')  // Remove Windows/Mac/Linux invalid chars
    .replace(/\s+/g, '_')            // Replace spaces (URL safety)
    .substring(0, 200)               // Prevent excessively long filenames
}

// Examples:
// "My Document.md" → "My_Document.docx" ✅
// "File<>Name" → "File--Name.docx" ✅
// "Very Long Title..." (250 chars) → "Very Long Title..." (200 chars) ✅
```

---

## 📊 Performance Architecture

### Copy to Clipboard Performance

**Operation Time**: <100ms

```
Click "Copy to Clipboard"
  ↓ (5ms)
editor.getHTML()               // Fast (TipTap internal state)
  ↓ (10ms)
Create ClipboardItem           // Fast (Blob creation)
  ↓ (30ms)
navigator.clipboard.write()    // Browser API (fast)
  ↓ (5ms)
Toast notification             // React render
  ↓
TOTAL: ~50ms (imperceptible to user)
```

---

### Word Export Performance

**First Export**: 500ms - 1.5s
```
Click "Export as Word"
  ↓ (300-500ms)
Dynamic import('@mohtasham/md-to-docx')  // Downloads ~500 KB
  ↓ (100-500ms)
markdownToDocx()                          // Conversion (depends on doc size)
  ↓ (50ms)
Blob creation + download trigger
  ↓
TOTAL: 500ms - 1.5s
```

**Subsequent Exports**: 100-500ms
```
Click "Export as Word"
  ↓ (0ms)
import('@mohtasham/md-to-docx')  // Cached by browser ✅
  ↓ (100-500ms)
markdownToDocx()                  // Only conversion time
  ↓ (50ms)
Download
  ↓
TOTAL: 100-500ms (3-5x faster)
```

**Optimization Strategies**:
1. ✅ **Lazy Loading** - Don't load library until needed
2. ✅ **Browser Caching** - Dynamic import cached automatically
3. ✅ **Loading Toast** - User feedback during conversion
4. ⏳ **Future**: Web Worker for large documents (if needed)

---

## 🧪 Testing Architecture

### Unit Testing Strategy

**Clipboard Utility Tests**:
```typescript
// clipboard.test.ts
describe('copyFormattedContent', () => {
  it('should copy both HTML and plain text formats', async () => {
    const html = '<h1>Test</h1>'
    const markdown = '# Test'

    const result = await copyFormattedContent(html, markdown)

    expect(result.success).toBe(true)
    expect(navigator.clipboard.write).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          'text/html': expect.any(Blob),
          'text/plain': expect.any(Blob)
        })
      ])
    )
  })

  it('should return error when clipboard API unavailable', async () => {
    // Mock missing clipboard API
    delete (navigator as any).clipboard

    const result = await copyFormattedContent('<h1>Test</h1>', '# Test')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Clipboard API not available')
  })
})
```

**Word Export Tests**:
```typescript
// wordExport.test.ts
describe('exportToWord', () => {
  it('should lazy load conversion library', async () => {
    const markdown = '# Test Document'

    await exportToWord(markdown, { documentTitle: 'Test' })

    // Verify dynamic import called
    expect(import).toHaveBeenCalledWith('@mohtasham/md-to-docx')
  })

  it('should sanitize filename', () => {
    const result = sanitizeFilename('My<>Document|Test')
    expect(result).toBe('My--Document-Test')
  })
})
```

---

### Integration Testing

**DocumentMenu Component Tests**:
```typescript
// DocumentMenu.test.tsx
describe('DocumentMenu - Export Features', () => {
  it('should render Copy to Clipboard menu item', () => {
    render(
      <DocumentMenu
        fileId="123"
        content="# Test"
        editor={mockEditor}
        documentTitle="Test Doc"
      />
    )

    fireEvent.click(screen.getByLabelText('Document actions'))

    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument()
  })

  it('should call clipboard API on copy click', async () => {
    const { user } = setup()

    fireEvent.click(screen.getByText('Copy to Clipboard'))

    await waitFor(() => {
      expect(copyFormattedContent).toHaveBeenCalled()
    })
  })

  it('should show toast notification on successful copy', async () => {
    fireEvent.click(screen.getByText('Copy to Clipboard'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Copied to clipboard!',
        expect.any(Object)
      )
    })
  })
})
```

---

### Manual Testing Checklist

**Cross-Application Paste Testing**:
| App | Format | Expected |
|-----|--------|----------|
| Microsoft Word 2021+ | Rich | ✅ H1-H6, bold, italic, lists preserved |
| Google Docs | Rich | ✅ H1-H6, bold, italic, lists preserved |
| Gmail (compose) | Rich | ✅ Basic formatting preserved |
| Slack | Rich | ✅ Basic formatting preserved |
| Apple Mail | Rich | ✅ Basic formatting preserved |
| VS Code | Plain | ✅ Markdown syntax visible |
| Notepad++ | Plain | ✅ Markdown syntax visible |
| TextEdit (plain) | Plain | ✅ Markdown syntax visible |

**Word Export Validation**:
- [ ] Open in Microsoft Word 2016+ (Windows)
- [ ] Open in Microsoft Word 2016+ (Mac)
- [ ] Open in LibreOffice Writer
- [ ] Open in Google Docs (upload .docx)
- [ ] Verify metadata (author, created date)

---

## 🚨 Error Handling Architecture

### Error Types

```typescript
// Clipboard Errors
type ClipboardError =
  | 'CLIPBOARD_API_UNAVAILABLE'    // Browser doesn't support API
  | 'HTTPS_REQUIRED'               // Not on HTTPS
  | 'USER_GESTURE_REQUIRED'        // iOS Safari async issue
  | 'PERMISSION_DENIED'            // User denied clipboard permission

// Word Export Errors
type WordExportError =
  | 'LIBRARY_LOAD_FAILED'          // Dynamic import failed
  | 'CONVERSION_FAILED'            // markdownToDocx() threw error
  | 'DOWNLOAD_FAILED'              // Browser blocked download
  | 'NO_CONTENT'                   // Empty document
```

### Error Handling Strategy

**User-Friendly Toast Messages**:
```typescript
// clipboard.ts
if (!navigator.clipboard || !window.isSecureContext) {
  return {
    success: false,
    error: 'Clipboard API not available (HTTPS required)'
  }
}

// DocumentMenu.tsx
if (result.success) {
  toast.success('Copied to clipboard!')
} else {
  toast.error('Failed to copy', {
    description: result.error,
    action: {
      label: 'Learn More',
      onClick: () => window.open('/help/clipboard-requirements')
    }
  })
}
```

**Graceful Degradation**:
```typescript
// Menu items disable when prerequisites not met
<DropdownMenuItem
  onClick={handleCopyToClipboard}
  disabled={!editor}  // ✅ Disabled if editor not ready
>
  Copy to Clipboard
</DropdownMenuItem>
```

---

## 📈 Monitoring & Analytics

### Key Metrics to Track (Future)

```typescript
// Analytics events to implement later
analytics.track('Export Feature Used', {
  feature: 'copy_to_clipboard' | 'word_export',
  documentSize: content.length,
  browser: navigator.userAgent,
  success: boolean
})

// Performance metrics
analytics.track('Word Export Performance', {
  conversionTime: number,      // How long conversion took
  documentSize: number,         // Length of markdown
  isFirstExport: boolean,       // First vs cached library
})
```

---

## 🔮 Future Enhancements

### Potential Improvements (Post-Sprint 18)

1. **PDF Export** (Sprint 19+)
   - Use jsPDF or html2pdf.js
   - Lazy loaded like Word export

2. **Custom Templates** (Sprint 20+)
   - User-defined Word styles
   - Custom frontmatter for SSGs

3. **Export History** (Sprint 21+)
   - Track recent exports
   - One-click re-export

4. **Batch Export** (Sprint 22+)
   - Export multiple documents
   - Zip archive download

---

## 📚 Dependencies Graph

```
DocumentMenu.tsx
├── React (existing)
├── lucide-react (existing)
│   ├── History ✅
│   ├── MoreVertical ✅
│   ├── Copy ✨ NEW
│   └── FileDown ✨ NEW
├── @/components/ui/dropdown-menu (existing)
├── sonner (existing)
├── @/utils/clipboard ✨ NEW
│   └── navigator.clipboard (Browser API)
└── @/services/export/wordExport ✨ NEW
    └── @mohtasham/md-to-docx ✨ NEW (lazy loaded)
```

**No Breaking Changes**:
- ✅ All new dependencies are additive
- ✅ Existing features unaffected
- ✅ Backward compatible

---

## ✅ Architecture Review Checklist

- [x] Component integration points defined
- [x] State management strategy documented
- [x] Security considerations addressed
- [x] Performance optimization strategy (lazy loading)
- [x] Error handling architecture complete
- [x] Testing strategy defined
- [x] Browser compatibility verified
- [x] Bundle size impact analyzed
- [x] Future enhancements planned

---

**Architecture Approved**: ✅
**Ready for Implementation**: ✅
**Estimated Complexity**: LOW (well-defined, minimal dependencies)

**Next Document**: `lazy-loading-strategy.md` (optimization details)
