# Sprint 18: Lazy Loading Strategy for Word Export

**Document Purpose**: Detailed optimization strategy for lazy loading the Word export library
**Target Bundle Size**: 0 KB initial load, ~500 KB on first Word export
**Technology**: Dynamic import() with React code splitting
**Status**: ✅ Production-ready pattern

---

## 🎯 Problem Statement

**Challenge**: Word export requires `@mohtasham/md-to-docx` library (~500 KB)

**Constraints**:
- Initial page load must remain fast (<1s FCP)
- Most users may never export to Word
- Cannot bloat main application bundle
- Must maintain professional UX during library download

**Solution**: Lazy load the library only when user clicks "Export as Word"

---

## 📦 Bundle Splitting Analysis

### Without Lazy Loading (❌ Bad)

```
Main Bundle:
├── React + TipTap + Drive API: ~800 KB
├── @mohtasham/md-to-docx: ~500 KB
└── Total: ~1.3 MB (gzipped: ~400 KB)

Initial Load: 1.3 MB downloaded
First Word Export: 0 KB (already loaded)
```

**Problems**:
- 62% larger initial bundle (800 KB → 1.3 MB)
- Slower time to interactive for ALL users
- Wasted bandwidth for users who never export to Word

### With Lazy Loading (✅ Good)

```
Main Bundle:
└── React + TipTap + Drive API: ~800 KB

Word Export Chunk (lazy):
└── @mohtasham/md-to-docx: ~500 KB

Initial Load: 800 KB downloaded (0% increase)
First Word Export: +500 KB (one-time download)
Subsequent Exports: 0 KB (browser cached)
```

**Benefits**:
- No impact on initial page load
- Library downloaded only when needed
- Browser caches chunk for future exports
- Professional loading UX during download

---

## 🔧 Implementation Pattern

### Dynamic Import with Error Handling

**File**: `/ritemark-app/src/services/export/wordExport.ts`

```typescript
/**
 * Word export service with lazy loading
 * Library is loaded dynamically on first use
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

export async function exportToWord(
  markdown: string,
  options: WordExportOptions
): Promise<WordExportResult> {
  try {
    // CRITICAL: Dynamic import - library NOT in main bundle
    // Browser downloads ~500 KB chunk on first call only
    const { markdownToDocx } = await import('@mohtasham/md-to-docx')

    // Convert markdown to .docx buffer
    const docxBuffer = await markdownToDocx({
      markdown,
      fontSize: 12,
      fontFamily: 'Calibri',
      alignment: 'left',
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

    // Handle different error types
    if (error.message?.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Network error - please check your connection'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
}

/**
 * Sanitize filename for cross-platform compatibility
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')  // Windows/Mac/Linux invalid chars
    .replace(/\s+/g, '_')            // Spaces → underscores
    .substring(0, 200)               // Max length (leave room for .docx)
}
```

---

## 🎨 UX Pattern with Loading States

**File**: `/ritemark-app/src/components/layout/DocumentMenu.tsx`

```typescript
import { toast } from "sonner"
import { exportToWord } from "@/services/export/wordExport"

const handleExportWord = React.useCallback(async () => {
  if (!content) {
    toast.error('No content to export')
    return
  }

  try {
    // STEP 1: Show loading toast immediately
    // User sees "Preparing Word document..." while library downloads
    const loadingToast = toast.loading('Preparing Word document...')

    // STEP 2: Call exportToWord (triggers dynamic import)
    // First call: Downloads ~500 KB library + converts document
    // Subsequent calls: Uses cached library, only converts
    const result = await exportToWord(content, {
      documentTitle: documentTitle,
      author: authorName,
      createdAt: new Date().toISOString()
    })

    // STEP 3: Dismiss loading toast
    toast.dismiss(loadingToast)

    // STEP 4: Show success/error
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
```

**User Experience Timeline**:
```
User clicks "Export as Word"
  ↓ <50ms
Toast shows: "Preparing Word document..."
  ↓ 500ms-1.5s (first export only, downloads library)
  ↓ OR 100-500ms (subsequent exports, uses cache)
Toast updates: "Exported to Word!"
  ↓ Immediate
Browser downloads: Document-Title.docx
```

---

## ⚡ Performance Metrics

### First Word Export (Cold Start)

**Timeline**:
1. **User Click** → Handler invoked (0ms)
2. **Loading Toast** → Shows immediately (+10ms)
3. **Dynamic Import** → Browser fetches chunk (+500-1500ms, network dependent)
4. **Library Execution** → Converts markdown to .docx (+100-500ms, document size dependent)
5. **File Download** → Browser triggers download (+50ms)
6. **Success Toast** → Shown to user (+10ms)

**Total Time**: 660ms - 2060ms (0.6s - 2s)

**Network Breakdown**:
- Fast 4G: ~500-800ms library download
- Slow 3G: ~1200-1500ms library download
- Offline: Immediate failure with network error

### Subsequent Word Exports (Warm Start)

**Timeline**:
1. **User Click** → Handler invoked (0ms)
2. **Loading Toast** → Shows immediately (+10ms)
3. **Dynamic Import** → Returns cached module (+5ms, instant from browser cache)
4. **Library Execution** → Converts markdown to .docx (+100-500ms)
5. **File Download** → Browser triggers download (+50ms)
6. **Success Toast** → Shown to user (+10ms)

**Total Time**: 175ms - 575ms (0.2s - 0.6s)

**Why Faster**:
- Browser cache: `@mohtasham/md-to-docx` chunk cached after first load
- No network request for library
- Only conversion time remains

---

## 🧠 Browser Caching Behavior

### How Vite Handles Lazy Chunks

**Build Output**:
```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js           (main bundle: ~800 KB)
│   ├── md-to-docx-xyz789.js      (lazy chunk: ~500 KB)
│   └── ...other chunks
```

**Cache Headers** (set by Netlify/hosting):
```
assets/md-to-docx-xyz789.js:
  Cache-Control: public, max-age=31536000, immutable
  ETag: "xyz789"
```

**Browser Behavior**:
- First export: Downloads `md-to-docx-xyz789.js` from CDN
- Stores in browser cache with 1-year expiry
- Subsequent exports: Serves from disk cache (0ms network time)
- Cache persists across browser sessions
- Cache invalidated only on new deployment (hash changes)

### Cache Validation

**Test Pattern**:
```javascript
// First export: Check network tab
// Should see: GET /assets/md-to-docx-xyz789.js (200 OK, 500 KB, 500-1500ms)

// Second export: Check network tab
// Should see: GET /assets/md-to-docx-xyz789.js (200 OK, from cache, 0ms)
```

---

## 🔒 Error Handling Strategy

### Error Categories

**1. Network Errors** (Dynamic Import Fails)

```typescript
// Scenario: User offline, CDN down, firewall blocks CDN
catch (error) {
  if (error.message?.includes('Failed to fetch')) {
    return {
      success: false,
      error: 'Network error - please check your connection'
    }
  }
}
```

**User Experience**:
- Loading toast shows for 10-30s (browser timeout)
- Error toast: "Network error - please check your connection"
- Retry: User can click "Export as Word" again when online

**2. Conversion Errors** (Library Execution Fails)

```typescript
// Scenario: Invalid markdown, memory exhausted, library bug
catch (error) {
  console.error('Word export failed:', error)
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Export failed'
  }
}
```

**User Experience**:
- Loading toast dismisses immediately
- Error toast shows specific error message
- User can report issue or try different document

**3. Download Errors** (Blob/Download Fails)

```typescript
// Scenario: Browser blocks download, disk full, permissions error
// Error caught at file download stage, not library stage
```

**User Experience**:
- Browser shows native download error
- User can retry or check browser settings

---

## 📊 Bundle Analysis Validation

### Vite Build Command

```bash
npm run build -- --report

# Output shows chunk sizes:
# dist/assets/index-abc123.js        800 KB
# dist/assets/md-to-docx-xyz789.js   500 KB
```

### Lighthouse Performance Impact

**Before Lazy Loading** (if we added to main bundle):
- First Contentful Paint: 1.2s → 1.8s (+600ms, worse)
- Time to Interactive: 2.1s → 3.2s (+1.1s, worse)
- Bundle Size: 800 KB → 1.3 MB (+62%, worse)

**After Lazy Loading** (current approach):
- First Contentful Paint: 1.2s → 1.2s (no change ✅)
- Time to Interactive: 2.1s → 2.1s (no change ✅)
- Bundle Size: 800 KB → 800 KB (no change ✅)
- Word Export Chunk: 0 KB → 500 KB (only when used ✅)

---

## 🧪 Testing Strategy

### Unit Tests

**Test**: Dynamic import returns correct module

```typescript
// tests/services/export/wordExport.test.ts
import { exportToWord } from '@/services/export/wordExport'

jest.mock('@mohtasham/md-to-docx', () => ({
  markdownToDocx: jest.fn().mockResolvedValue(Buffer.from('fake-docx-data'))
}))

test('exports markdown to Word successfully', async () => {
  const result = await exportToWord('# Hello World', {
    documentTitle: 'Test Document'
  })

  expect(result.success).toBe(true)
  expect(result.error).toBeUndefined()
})

test('handles network errors gracefully', async () => {
  jest.spyOn(global, 'import').mockRejectedValue(new Error('Failed to fetch'))

  const result = await exportToWord('# Hello', { documentTitle: 'Test' })

  expect(result.success).toBe(false)
  expect(result.error).toContain('Network error')
})
```

### Integration Tests

**Test**: Full user flow with loading states

```typescript
// tests/components/layout/DocumentMenu.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DocumentMenu } from '@/components/layout/DocumentMenu'

test('shows loading toast during Word export', async () => {
  const { user } = render(
    <DocumentMenu
      fileId="123"
      content="# Test"
      editor={mockEditor}
      documentTitle="Test Doc"
    />
  )

  // Open menu
  await user.click(screen.getByLabelText('Document actions'))

  // Click export
  await user.click(screen.getByText('Export as Word'))

  // Loading toast appears
  expect(screen.getByText('Preparing Word document...')).toBeInTheDocument()

  // Success toast replaces loading toast
  await waitFor(() => {
    expect(screen.getByText('Exported to Word!')).toBeInTheDocument()
  })
})
```

### Manual Testing

**Test Matrix**:

| Test Case | Expected Behavior | Pass/Fail |
|-----------|------------------|-----------|
| **First Export** (cold start) | - Loading toast 500-1500ms<br>- Success toast shows<br>- File downloads<br>- Network tab shows 500 KB chunk download | ⬜ |
| **Second Export** (warm start) | - Loading toast 100-500ms<br>- Success toast shows<br>- File downloads<br>- Network tab shows "from cache" | ⬜ |
| **Offline Export** | - Loading toast 10-30s<br>- Error toast: "Network error"<br>- No file download | ⬜ |
| **Invalid Markdown** | - Loading toast brief<br>- Error toast shows error<br>- No file download | ⬜ |
| **Large Document** (50+ pages) | - Loading toast 1-3s<br>- Success toast shows<br>- File downloads correctly | ⬜ |

---

## 🔄 Alternative Approaches Considered

### Approach 1: Preload on App Load

```typescript
// App.tsx
React.useEffect(() => {
  // Preload Word export library in background
  import('@mohtasham/md-to-docx')
}, [])
```

**Pros**: First export would be instant
**Cons**:
- Wastes 500 KB bandwidth for users who never export
- Delays Time to Interactive for all users
- Violates "only load what's needed" principle

**Decision**: ❌ Rejected

### Approach 2: Service Worker Prefetch

```typescript
// service-worker.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('word-export').then((cache) => {
      return cache.add('/assets/md-to-docx-xyz789.js')
    })
  )
})
```

**Pros**: Library cached before first export
**Cons**:
- Complex service worker setup
- Still downloads 500 KB for all users
- Cache management complexity

**Decision**: ❌ Rejected (maybe revisit for PWA in future)

### Approach 3: Lazy Load on Menu Open

```typescript
const handleMenuOpen = React.useCallback(() => {
  // Start loading library when menu opens
  import('@mohtasham/md-to-docx')
}, [])
```

**Pros**: Reduces perceived latency (library loads while user reads menu)
**Cons**:
- Loads library even if user doesn't click export
- Network bandwidth wasted if user closes menu
- Premature optimization

**Decision**: ❌ Rejected (current approach is cleaner)

### Approach 4: Current Implementation (Lazy Load on Click)

```typescript
export async function exportToWord(...) {
  const { markdownToDocx } = await import('@mohtasham/md-to-docx')
  // ...
}
```

**Pros**:
- Zero initial bundle impact
- Only loads when actually needed
- Simple implementation
- Standard React pattern
- Browser caching handles subsequent exports

**Cons**:
- First export has 500-1500ms download delay
- Offline users can't export

**Decision**: ✅ SELECTED

**Rationale**: Aligns with user instruction "1MB extra is not a problem (use lazy loading)" and modern web performance best practices.

---

## 📚 References

### Web Performance Best Practices

- [Lazy Loading Modules (web.dev)](https://web.dev/code-splitting-with-dynamic-imports/)
- [React Code Splitting (React Docs)](https://react.dev/reference/react/lazy)
- [Vite Code Splitting (Vite Docs)](https://vitejs.dev/guide/features.html#async-chunk-loading-optimization)

### Browser Caching

- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control Best Practices](https://csswizardry.com/2019/03/cache-control-for-civilians/)

### Dynamic Import API

- [JavaScript Dynamic Import (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [ECMAScript Proposal](https://github.com/tc39/proposal-dynamic-import)

---

## ✅ Implementation Checklist

**Phase 2.2: Create Word Export Service** (from implementation-plan.md)

- [ ] Install `@mohtasham/md-to-docx` dependency
- [ ] Create `/src/services/export/wordExport.ts` with dynamic import pattern
- [ ] Implement `exportToWord()` function with lazy loading
- [ ] Add filename sanitization function
- [ ] Add error handling for network failures
- [ ] Add TypeScript interfaces for options and result
- [ ] Test dynamic import works in development
- [ ] Verify chunk splitting in production build
- [ ] Validate browser caching behavior
- [ ] Test offline error handling

**Validation**:
```bash
# Build and check chunk sizes
npm run build -- --report

# Should see:
# dist/assets/index-[hash].js        ~800 KB
# dist/assets/md-to-docx-[hash].js   ~500 KB
```

---

**Status**: ✅ Ready for Implementation
**Estimated Time**: 45 minutes (Task 2.2 from implementation-plan.md)
**Next Step**: Implement in Phase 2 of Sprint 18 execution
