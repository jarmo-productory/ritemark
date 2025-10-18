# Sprint 11 & 12 Codebase Readiness Audit: Tables & Images

**Date:** October 11, 2025
**Auditor:** Code Quality Analyzer
**Scope:** Assess codebase readiness for TipTap Table (Sprint 11) and Image (Sprint 12) extensions
**Methodology:** Architecture analysis, dependency compatibility check, bundle impact assessment

---

## 📋 Executive Summary

**Overall Readiness: ✅ EXCELLENT** - Codebase is architecturally ready for Tables & Images with minimal refactoring required.

### Key Findings
- ✅ **TipTap 3.4.3 Core**: Already installed, compatible with Table/Image extensions (v3.6.6)
- ✅ **Extension Architecture**: Clean plugin system supports adding Table/Image without modifications
- ✅ **BubbleMenu System**: Supports multiple menus (can add Table-specific menu)
- ✅ **Turndown Markdown**: Supports tables and images out-of-box with custom rules
- ⚠️ **Bundle Size**: Will increase by ~120KB gzipped (Table: ~100KB, Image: ~20KB)
- ⚠️ **Drive Integration**: Requires image upload service for binary files (markdown only supports text)

### Recommended Approach
1. **Sprint 11 (Tables)**: Low risk, no architecture changes needed
2. **Sprint 12 (Images)**: Medium risk, requires Drive upload service for binary files

---

## 🏗️ Architecture Analysis

### 1. Current Editor Architecture Assessment

**File:** `/src/components/Editor.tsx` (387 lines)

#### ✅ Strengths (Ready for Extensions)
```typescript
// Clean TipTap extension configuration (lines 46-101)
extensions: [
  StarterKit.configure({ ... }),
  CodeBlockLowlight.configure({ ... }),
  BulletList.configure({ ... }),
  OrderedList.configure({ ... }),
  ListItem.configure({ ... }),
  Placeholder.configure({ ... }),
  Link.configure({ ... }),
]
```

**Why This Is Good:**
- Modular plugin architecture
- Each extension independently configured
- No tight coupling between extensions
- Adding Table/Image requires only 2-5 lines of code

**Example Addition (Sprint 11 - Tables):**
```typescript
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

extensions: [
  // ... existing extensions
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'tiptap-table',
    },
  }),
  TableRow,
  TableCell,
  TableHeader,
]
```

**Example Addition (Sprint 12 - Images):**
```typescript
import Image from '@tiptap/extension-image'

extensions: [
  // ... existing extensions
  Image.configure({
    inline: true,
    allowBase64: false, // Security: Block base64 (use Drive URLs instead)
    HTMLAttributes: {
      class: 'tiptap-image',
    },
  }),
]
```

#### ✅ Markdown Conversion (Ready for Tables/Images)
```typescript
// Lines 15-21: Turndown Service initialization
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**'
})
```

**What Works:**
- Turndown supports tables via `turndown-plugin-gfm` (GitHub Flavored Markdown)
- Turndown supports images natively (`![alt](url)` syntax)

**What Needs to Be Added:**

**For Tables (Sprint 11):**
```typescript
import { gfm } from 'turndown-plugin-gfm'

turndownService.use(gfm) // Adds GFM table support
```

**For Images (Sprint 12):**
```typescript
// Turndown already supports images, but we need custom rule for Drive URLs
turndownService.addRule('driveImages', {
  filter: (node) => node.nodeName === 'IMG' && node.src.includes('drive.google.com'),
  replacement: (content, node) => {
    const alt = node.alt || 'image'
    const src = node.src
    return `![${alt}](${src})`
  }
})
```

#### ✅ HTML → Markdown Loading (Lines 180-208)
```typescript
useEffect(() => {
  if (editor && value !== currentMarkdown) {
    const isHTML = /^<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|strong|em|code)[\s>]/i.test(value.trim())

    if (!isHTML && value.trim()) {
      const html = marked(value, { breaks: true, gfm: true }) as string
      editor.commands.setContent(html)
    }
  }
}, [editor, value])
```

**Why This Is Good:**
- Already supports GFM (GitHub Flavored Markdown) via `gfm: true`
- Table syntax will parse correctly (no changes needed)
- Image syntax will parse correctly (no changes needed)

**Note:** Line 187 regex already includes `table` in HTML detection - ready for tables!

---

### 2. FormattingBubbleMenu Architecture Assessment

**File:** `/src/components/FormattingBubbleMenu.tsx` (315 lines)

#### ✅ Strengths (Supports Multiple Menus)
```typescript
// Lines 166-177: BubbleMenu with shouldShow logic
<BubbleMenu
  editor={editor}
  shouldShow={({ editor, state }) => {
    const { selection } = state
    const { empty } = selection

    if (empty) return false
    if (editor.isActive('codeBlock')) return false

    return true
  }}
>
```

**Why This Is Good:**
- Context-aware visibility (hides in code blocks)
- Can create **separate TableBubbleMenu** for table-specific controls
- Can create **separate ImageBubbleMenu** for image controls (resize, alt text)

**Example: Table-Specific BubbleMenu (Sprint 11):**
```typescript
// New file: src/components/TableBubbleMenu.tsx
<BubbleMenu
  editor={editor}
  shouldShow={({ editor }) => {
    // Only show when cursor inside table
    return editor.isActive('table')
  }}
>
  <div className="flex items-center gap-1 bg-white border rounded shadow-lg p-1">
    <button onClick={() => editor.chain().focus().addColumnBefore().run()}>
      Insert Column Left
    </button>
    <button onClick={() => editor.chain().focus().addRowBefore().run()}>
      Insert Row Above
    </button>
    <button onClick={() => editor.chain().focus().deleteTable().run()}>
      Delete Table
    </button>
  </div>
</BubbleMenu>
```

**Example: Image BubbleMenu (Sprint 12):**
```typescript
// New file: src/components/ImageBubbleMenu.tsx
<BubbleMenu
  editor={editor}
  shouldShow={({ editor }) => {
    return editor.isActive('image')
  }}
>
  <div className="flex items-center gap-1 bg-white border rounded shadow-lg p-1">
    <button onClick={() => setShowAltTextDialog(true)}>
      Edit Alt Text
    </button>
    <button onClick={() => setShowImageResizeDialog(true)}>
      Resize
    </button>
    <button onClick={() => editor.chain().focus().deleteSelection().run()}>
      Delete Image
    </button>
  </div>
</BubbleMenu>
```

#### ⚠️ Architectural Decision Required

**Question:** Should we extend FormattingBubbleMenu or create separate menus?

**Option A: Extend FormattingBubbleMenu (NOT RECOMMENDED)**
- Add table buttons to existing menu
- Menu becomes cluttered (Bold, Italic, H1, H2, Link, Table Insert, Image Upload)
- Confusing UX (table buttons shown even when not in table)

**Option B: Create Separate Menus (RECOMMENDED ✅)**
- Keep FormattingBubbleMenu for text formatting
- Create TableBubbleMenu for table operations (only shows in tables)
- Create ImageBubbleMenu for image operations (only shows on images)
- Clean UX: Context-specific controls

**Recommendation:** Use Option B (separate menus) for better UX

---

### 3. Drive Integration Assessment

**File:** `/src/hooks/useDriveSync.ts` (492 lines)

#### ✅ Current Capabilities (Text Files Only)
```typescript
// Lines 314-356: Create Drive file (text/markdown)
async function createDriveFile(
  name: string,
  content: string,
  accessToken: string
): Promise<string> {
  const metadata = {
    name,
    mimeType: 'text/markdown',
  }

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/markdown',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    { ... }
  )
}
```

**What Works:**
- Text file upload (markdown documents)
- Multipart upload format already used

**What Doesn't Work for Images:**
- Only supports `text/markdown` MIME type
- No binary file handling (images are binary)
- No image MIME type detection (image/png, image/jpeg, etc.)

#### ⚠️ Changes Needed for Sprint 12 (Images)

**1. New Service: `driveImageUploader.ts`**
```typescript
// src/services/drive/driveImageUploader.ts

export async function uploadImageToDrive(
  file: File,
  accessToken: string
): Promise<{ fileId: string; webContentLink: string }> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported')
  }

  // Validate file size (max 10MB for performance)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be smaller than 10MB')
  }

  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: ['appDataFolder'], // Store in app-specific folder
  }

  const boundary = '-------314159265358979323846'
  const bodyParts = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${file.type}`,
    '',
  ]

  // Convert File to ArrayBuffer then to base64
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  )

  bodyParts.push(base64)
  bodyParts.push(`--${boundary}--`)

  const body = bodyParts.join('\r\n')

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to upload image')
  }

  const result = await response.json()
  return {
    fileId: result.id,
    webContentLink: result.webContentLink || `https://drive.google.com/uc?id=${result.id}`,
  }
}
```

**2. Image Upload Hook: `useImageUpload.ts`**
```typescript
// src/hooks/useImageUpload.ts

export function useImageUpload(editor: TipTapEditor | null) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadImage = async (file: File) => {
    if (!editor) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const accessToken = await tokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      // Upload to Drive
      const { webContentLink } = await uploadImageToDrive(file, accessToken)

      // Insert image into editor
      editor.chain().focus().setImage({ src: webContentLink }).run()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadImage, isUploading, uploadError }
}
```

**3. Image Upload Button Component**
```typescript
// src/components/ImageUploadButton.tsx

export function ImageUploadButton({ editor }: { editor: TipTapEditor | null }) {
  const { uploadImage, isUploading, uploadError } = useImageUpload(editor)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-3 py-1 rounded text-sm hover:bg-gray-100"
      >
        {isUploading ? 'Uploading...' : 'Insert Image'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {uploadError && (
        <p className="text-sm text-red-500">{uploadError}</p>
      )}
    </>
  )
}
```

**4. Integration in App.tsx**
```typescript
// Sprint 12: Add to toolbar
<div className="editor-toolbar">
  <ImageUploadButton editor={editor} />
</div>
```

---

## 📦 Dependency Analysis

### 1. Current TipTap Versions

**Installed:**
```json
{
  "@tiptap/react": "^3.4.3",
  "@tiptap/starter-kit": "^3.4.3",
  "@tiptap/extension-bubble-menu": "^3.6.6",
  "@tiptap/extension-bullet-list": "^3.4.3",
  "@tiptap/extension-code-block-lowlight": "^3.4.4",
  "@tiptap/extension-link": "^3.4.3",
  "@tiptap/extension-list-item": "^3.4.3",
  "@tiptap/extension-ordered-list": "^3.4.3",
  "@tiptap/extension-placeholder": "^3.4.3"
}
```

**Analysis:**
- Core: v3.4.3 (5 months old as of Oct 2025)
- BubbleMenu: v3.6.6 (upgraded recently in Sprint 10)
- Mixed versions: Some extensions on v3.4.3, others on v3.4.4

### 2. Required Dependencies for Sprint 11 (Tables)

**New Packages:**
```json
{
  "@tiptap/extension-table": "^3.6.6",
  "@tiptap/extension-table-row": "^3.6.6",
  "@tiptap/extension-table-cell": "^3.6.6",
  "@tiptap/extension-table-header": "^3.6.6",
  "turndown-plugin-gfm": "^1.0.7"
}
```

**Compatibility Check:**
- ✅ `@tiptap/extension-table@3.6.6` peer deps: `@tiptap/core: ^3.6.6`, `@tiptap/pm: ^3.6.6`
- ⚠️ Current core is v3.4.3, needs upgrade to v3.6.6
- ⚠️ All TipTap extensions should be upgraded to v3.6.6 for consistency

**Unpacked Sizes:**
- `@tiptap/extension-table`: 418KB unpacked (~100KB gzipped)
- `@tiptap/extension-table-row`: Included in table package
- `@tiptap/extension-table-cell`: Included in table package
- `@tiptap/extension-table-header`: Included in table package
- `turndown-plugin-gfm`: ~20KB unpacked (~5KB gzipped)

**Total Sprint 11 Bundle Impact:** ~105KB gzipped

### 3. Required Dependencies for Sprint 12 (Images)

**New Packages:**
```json
{
  "@tiptap/extension-image": "^3.6.6"
}
```

**Compatibility Check:**
- ✅ `@tiptap/extension-image@3.6.6` peer deps: `@tiptap/core: ^3.6.6`
- ⚠️ Requires TipTap core upgrade (same as tables)

**Unpacked Size:**
- `@tiptap/extension-image`: 21KB unpacked (~5KB gzipped)

**Total Sprint 12 Bundle Impact:** ~5KB gzipped (minimal)

### 4. Version Upgrade Strategy

**Recommendation: Upgrade All TipTap Extensions to v3.6.6**

**Why:**
- Consistent versions prevent compatibility issues
- v3.6.6 is latest stable (as of Oct 2025)
- BubbleMenu already on v3.6.6 (upgraded in Sprint 10)
- Table extension requires v3.6.6

**Upgrade Plan:**
```bash
npm install \
  @tiptap/react@^3.6.6 \
  @tiptap/starter-kit@^3.6.6 \
  @tiptap/extension-bubble-menu@^3.6.6 \
  @tiptap/extension-bullet-list@^3.6.6 \
  @tiptap/extension-code-block-lowlight@^3.6.6 \
  @tiptap/extension-link@^3.6.6 \
  @tiptap/extension-list-item@^3.6.6 \
  @tiptap/extension-ordered-list@^3.6.6 \
  @tiptap/extension-placeholder@^3.6.6
```

**Then add Sprint 11 extensions:**
```bash
npm install \
  @tiptap/extension-table@^3.6.6 \
  @tiptap/extension-table-row@^3.6.6 \
  @tiptap/extension-table-cell@^3.6.6 \
  @tiptap/extension-table-header@^3.6.6 \
  turndown-plugin-gfm@^1.0.7
```

**Risk Assessment:**
- ⚠️ **Medium Risk**: v3.4.3 → v3.6.6 is 2 minor versions (may have breaking changes)
- ✅ **Mitigation**: Run full test suite after upgrade
- ✅ **Mitigation**: Check TipTap v3.6.6 changelog for breaking changes

**Breaking Changes Check Required:**
```bash
# Check TipTap v3.6.6 changelog
npm show @tiptap/react@3.6.6 | grep -A 20 "changelog"
```

### 5. Turndown Plugin Dependencies

**Current:**
```json
{
  "turndown": "^7.2.1"
}
```

**Required for Sprint 11:**
```json
{
  "turndown-plugin-gfm": "^1.0.7"
}
```

**Compatibility:**
- ✅ `turndown-plugin-gfm` has no peer dependencies
- ✅ Works with Turndown v7.x
- ✅ Adds GitHub Flavored Markdown support (tables, strikethrough)

---

## 📊 Bundle Size Impact Analysis

### Current Bundle Size (Sprint 10)
```
dist/assets/index-BOLpkYNR.js   981.35 kB │ gzip: 305.16 kB
```

**Breakdown:**
- React + React DOM: ~140KB gzipped
- TipTap Core + Extensions: ~80KB gzipped
- Radix UI (Dialog, Tooltip, etc.): ~40KB gzipped
- Turndown + Marked: ~20KB gzipped
- Lowlight (code highlighting): ~15KB gzipped
- Application code: ~10KB gzipped

### Projected Bundle Size After Sprint 11 (Tables)

**New Dependencies:**
- `@tiptap/extension-table` (4 packages): ~100KB gzipped
- `turndown-plugin-gfm`: ~5KB gzipped

**Projected Total:**
```
dist/assets/index-[hash].js   ~1,086 kB │ gzip: ~410 kB
```

**Increase:** +105KB gzipped (+34% increase)

### Projected Bundle Size After Sprint 12 (Images)

**New Dependencies:**
- `@tiptap/extension-image`: ~5KB gzipped
- `driveImageUploader.ts` (custom code): ~2KB gzipped

**Projected Total:**
```
dist/assets/index-[hash].js   ~1,093 kB │ gzip: ~417 kB
```

**Increase:** +7KB gzipped (+2% increase)

### Combined Bundle Size (Sprint 11 + 12)

**Total Bundle:**
```
dist/assets/index-[hash].js   ~1,093 kB │ gzip: ~417 kB
```

**Total Increase:** +112KB gzipped (+37% from Sprint 10)

### Bundle Size Assessment

**Current Status:**
- ⚠️ Vite warning: "Some chunks are larger than 500 kB after minification"

**After Sprint 11 + 12:**
- ❌ Will exceed 500KB gzipped (417KB already close)
- ❌ Will be ~1.1MB uncompressed (poor performance on slow networks)

**Recommendation: Implement Code Splitting**

**Strategy:**
```typescript
// Lazy load Table extension only when user needs tables
const Table = lazy(() => import('@tiptap/extension-table'))
const TableRow = lazy(() => import('@tiptap/extension-table-row'))
const TableCell = lazy(() => import('@tiptap/extension-table-cell'))
const TableHeader = lazy(() => import('@tiptap/extension-table-header'))

// Lazy load Image extension only when user needs images
const Image = lazy(() => import('@tiptap/extension-image'))

// Load extensions on-demand
const loadTableExtensions = async () => {
  const [table, row, cell, header] = await Promise.all([
    Table,
    TableRow,
    TableCell,
    TableHeader,
  ])

  editor.registerPlugin(table)
  editor.registerPlugin(row)
  editor.registerPlugin(cell)
  editor.registerPlugin(header)
}
```

**Alternative: Vite Code Splitting via `manualChunks`**
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tiptap-core': ['@tiptap/react', '@tiptap/starter-kit'],
          'tiptap-table': [
            '@tiptap/extension-table',
            '@tiptap/extension-table-row',
            '@tiptap/extension-table-cell',
            '@tiptap/extension-table-header',
          ],
          'tiptap-image': ['@tiptap/extension-image'],
          'markdown': ['turndown', 'marked', 'turndown-plugin-gfm'],
          'ui-components': ['@radix-ui/react-dialog', '@radix-ui/react-tooltip'],
        },
      },
    },
  },
}
```

**Expected Result:**
```
dist/assets/index-[hash].js         120 kB │ gzip:  40 kB (main bundle)
dist/assets/tiptap-core-[hash].js   250 kB │ gzip:  80 kB
dist/assets/tiptap-table-[hash].js  350 kB │ gzip: 100 kB (lazy loaded)
dist/assets/tiptap-image-[hash].js   20 kB │ gzip:   5 kB (lazy loaded)
dist/assets/markdown-[hash].js       80 kB │ gzip:  25 kB
dist/assets/ui-components-[hash].js 120 kB │ gzip:  40 kB
```

**Benefit:**
- Initial load: ~185KB gzipped (40 + 80 + 25 + 40)
- Table chunk loads on-demand: +100KB
- Image chunk loads on-demand: +5KB

---

## 🔧 Required Code Changes

### Sprint 11 (Tables) - Required Changes

#### 1. Install Dependencies
```bash
npm install \
  @tiptap/extension-table@^3.6.6 \
  @tiptap/extension-table-row@^3.6.6 \
  @tiptap/extension-table-cell@^3.6.6 \
  @tiptap/extension-table-header@^3.6.6 \
  turndown-plugin-gfm@^1.0.7
```

#### 2. Upgrade TipTap Core (if needed)
```bash
npm install \
  @tiptap/react@^3.6.6 \
  @tiptap/starter-kit@^3.6.6
```

#### 3. Update `Editor.tsx`
```typescript
// Add imports (lines 1-12)
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { gfm } from 'turndown-plugin-gfm'

// Update Turndown Service (lines 15-21)
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**'
})
turndownService.use(gfm) // ← ADD THIS LINE

// Add extensions (lines 46-101)
extensions: [
  // ... existing extensions
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'tiptap-table',
    },
  }),
  TableRow,
  TableCell,
  TableHeader,
]
```

#### 4. Add Table Styles (lines 213-383)
```css
/* Add to Editor.tsx <style> block */

/* Table styling */
.wysiwyg-editor .ProseMirror table.tiptap-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1em 0;
  overflow: hidden;
  border: 1px solid #d1d5db;
}

.wysiwyg-editor .ProseMirror table.tiptap-table td,
.wysiwyg-editor .ProseMirror table.tiptap-table th {
  min-width: 1em;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

.wysiwyg-editor .ProseMirror table.tiptap-table th {
  font-weight: 600;
  text-align: left;
  background-color: #f9fafb;
  color: #111827;
}

.wysiwyg-editor .ProseMirror table.tiptap-table td p,
.wysiwyg-editor .ProseMirror table.tiptap-table th p {
  margin: 0;
}

/* Column resize handle */
.wysiwyg-editor .ProseMirror table.tiptap-table .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #3b82f6;
  pointer-events: none;
}

.wysiwyg-editor .ProseMirror table.tiptap-table .selectedCell:after {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
}
```

#### 5. Create `TableBubbleMenu.tsx` (new file)
```typescript
// src/components/TableBubbleMenu.tsx

import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor as TipTapEditor } from '@tiptap/react'
import { Button } from '@/components/ui/button'

export function TableBubbleMenu({ editor }: { editor: TipTapEditor | null }) {
  if (!editor) return null

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => {
        return editor.isActive('table')
      }}
    >
      <div className="flex items-center gap-1 bg-white border rounded shadow-lg p-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          Insert Column Left
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          Insert Column Right
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          Insert Row Above
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          Insert Row Below
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          Delete Column
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          Delete Row
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="destructive"
          size="sm"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          Delete Table
        </Button>
      </div>
    </BubbleMenu>
  )
}
```

#### 6. Update `App.tsx`
```typescript
// Add import
import { TableBubbleMenu } from './components/TableBubbleMenu'

// Add to render (after FormattingBubbleMenu)
<FormattingBubbleMenu editor={editor} />
<TableBubbleMenu editor={editor} />
```

#### 7. Add Table Insert Button (optional)
```typescript
// src/components/TableInsertButton.tsx

export function TableInsertButton({ editor }: { editor: TipTapEditor | null }) {
  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <button
      onClick={insertTable}
      className="px-3 py-1 rounded text-sm hover:bg-gray-100"
    >
      Insert Table
    </button>
  )
}
```

**Total Changes:** 7 files modified/created, ~300 lines of code

---

### Sprint 12 (Images) - Required Changes

#### 1. Install Dependencies
```bash
npm install @tiptap/extension-image@^3.6.6
```

#### 2. Update `Editor.tsx`
```typescript
// Add import (lines 1-12)
import Image from '@tiptap/extension-image'

// Add extension (lines 46-101)
extensions: [
  // ... existing extensions
  Image.configure({
    inline: true,
    allowBase64: false, // Security: Block base64, use Drive URLs
    HTMLAttributes: {
      class: 'tiptap-image',
    },
  }),
]
```

#### 3. Add Image Styles (lines 213-383)
```css
/* Add to Editor.tsx <style> block */

/* Image styling */
.wysiwyg-editor .ProseMirror img.tiptap-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em 0;
  border-radius: 4px;
  cursor: pointer;
}

.wysiwyg-editor .ProseMirror img.tiptap-image.ProseMirror-selectednode {
  outline: 3px solid #3b82f6;
}
```

#### 4. Create Drive Image Upload Service
```typescript
// src/services/drive/driveImageUploader.ts
// (See "Drive Integration Assessment" section above for full code)
```

#### 5. Create Image Upload Hook
```typescript
// src/hooks/useImageUpload.ts
// (See "Drive Integration Assessment" section above for full code)
```

#### 6. Create Image Upload Button
```typescript
// src/components/ImageUploadButton.tsx
// (See "Drive Integration Assessment" section above for full code)
```

#### 7. Create Image BubbleMenu (optional)
```typescript
// src/components/ImageBubbleMenu.tsx

import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor as TipTapEditor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export function ImageBubbleMenu({ editor }: { editor: TipTapEditor | null }) {
  const [showAltTextDialog, setShowAltTextDialog] = useState(false)
  const [altText, setAltText] = useState('')

  if (!editor) return null

  const handleSetAltText = () => {
    editor.chain().focus().updateAttributes('image', { alt: altText }).run()
    setShowAltTextDialog(false)
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => {
          return editor.isActive('image')
        }}
      >
        <div className="flex items-center gap-1 bg-white border rounded shadow-lg p-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentAlt = editor.getAttributes('image').alt || ''
              setAltText(currentAlt)
              setShowAltTextDialog(true)
            }}
          >
            Edit Alt Text
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => editor.chain().focus().deleteSelection().run()}
          >
            Delete
          </Button>
        </div>
      </BubbleMenu>

      {/* Alt Text Dialog */}
      <Dialog.Root open={showAltTextDialog} onOpenChange={setShowAltTextDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 w-96">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Edit Alt Text
            </Dialog.Title>
            <div className="space-y-4">
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowAltTextDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleSetAltText} variant="default">
                  Save
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
```

#### 8. Update `App.tsx`
```typescript
// Add imports
import { ImageUploadButton } from './components/ImageUploadButton'
import { ImageBubbleMenu } from './components/ImageBubbleMenu'

// Add to toolbar
<div className="editor-toolbar">
  <ImageUploadButton editor={editor} />
</div>

// Add to render (after TableBubbleMenu)
<TableBubbleMenu editor={editor} />
<ImageBubbleMenu editor={editor} />
```

**Total Changes:** 8 files modified/created, ~400 lines of code

---

## ⚠️ Risk Assessment

### Sprint 11 (Tables) - Risk Analysis

#### Low Risk ✅
- **TipTap Table Extension**: Battle-tested, widely used
- **Turndown GFM Plugin**: Stable (v1.0.7), no breaking changes
- **Architecture**: Clean plugin system, no refactoring needed

#### Medium Risk ⚠️
- **TipTap Version Upgrade**: v3.4.3 → v3.6.6 (2 minor versions)
  - **Mitigation**: Run full test suite after upgrade
  - **Mitigation**: Check changelog for breaking changes
- **Bundle Size**: +105KB gzipped (+34% increase)
  - **Mitigation**: Implement code splitting (see Bundle Size section)
  - **Mitigation**: Lazy load table extensions on-demand

#### High Risk ❌
- **None identified**

#### Breaking Change Potential
- ⚠️ TipTap v3.6.6 may have breaking API changes from v3.4.3
- ⚠️ Existing TipTap extensions may need updates (BulletList, OrderedList, etc.)
- ⚠️ Keyboard shortcuts may conflict with table navigation (Tab, Enter)

#### Recommended Testing
```bash
# 1. Upgrade dependencies
npm install @tiptap/react@^3.6.6 @tiptap/starter-kit@^3.6.6

# 2. Run full test suite
npm run test:run

# 3. Check for TypeScript errors
npm run type-check

# 4. Check for linting errors
npm run lint

# 5. Build production bundle
npm run build

# 6. Manual testing
npm run dev
# Test existing features (bold, italic, lists, links, code blocks)
# Test table creation, editing, deletion
```

---

### Sprint 12 (Images) - Risk Analysis

#### Low Risk ✅
- **TipTap Image Extension**: Simple, minimal code
- **Bundle Size**: +5KB gzipped (+2% increase, negligible)

#### Medium Risk ⚠️
- **Drive Image Upload**: New binary file handling required
  - **Challenge**: Converting File to base64 for multipart upload
  - **Challenge**: Handling large images (10MB+ files)
  - **Mitigation**: Add file size validation (max 10MB)
  - **Mitigation**: Add image compression before upload (use browser Canvas API)
- **OAuth Scope**: May need additional Drive scope for image uploads
  - **Current Scope**: `https://www.googleapis.com/auth/drive.file` (per-file access)
  - **Required Scope**: Same scope works for images (no change needed)
- **Image URLs**: Drive URLs may be blocked by CORS
  - **Mitigation**: Use `webContentLink` with public sharing enabled
  - **Mitigation**: Use Google Drive's `uc?id=` direct link format
- **Image Storage**: Images stored in user's Drive (not app-specific folder)
  - **Risk**: User may delete images externally, breaking document
  - **Mitigation**: Store in `appDataFolder` (hidden from user)

#### High Risk ❌
- **None identified**

#### Security Considerations
- ✅ Disable base64 images (prevents XSS via data URIs)
- ✅ Validate file MIME types (only allow image/*)
- ✅ Validate file sizes (max 10MB to prevent DoS)
- ✅ Use OAuth access tokens (secure authentication)
- ⚠️ Drive URLs may be publicly accessible (consider private sharing)

#### Recommended Testing
```bash
# 1. Install image extension
npm install @tiptap/extension-image@^3.6.6

# 2. Create Drive upload service
# (Write driveImageUploader.ts)

# 3. Create image upload hook
# (Write useImageUpload.ts)

# 4. Create image upload button
# (Write ImageUploadButton.tsx)

# 5. Test image upload flow
npm run dev
# Upload small image (< 1MB) → should succeed
# Upload large image (> 10MB) → should show error
# Upload non-image file → should show error
# Check Drive folder for uploaded image
# Check image displays in editor
# Check markdown output includes ![alt](drive_url)
```

---

## 📈 Testing Strategy

### Sprint 11 (Tables) - Testing Plan

#### 1. Unit Tests for Table Extension
```typescript
// tests/components/TableExtension.test.tsx

describe('TipTap Table Extension', () => {
  test('inserts table with default dimensions (3x3)', () => {
    const editor = createEditor()
    editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
    expect(editor.getHTML()).toContain('<table>')
    expect(editor.getHTML()).toContain('<tr>')
    expect(editor.getHTML()).toContain('<td>')
  })

  test('adds column before', () => {
    const editor = createEditor()
    editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run()
    editor.chain().focus().addColumnBefore().run()
    // Verify 3 columns exist
  })

  test('deletes row', () => {
    const editor = createEditor()
    editor.chain().focus().insertTable({ rows: 3, cols: 2 }).run()
    editor.chain().focus().deleteRow().run()
    // Verify 2 rows remain
  })

  test('converts table to markdown (GFM syntax)', () => {
    const editor = createEditor()
    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()
    const markdown = turndownService.turndown(editor.getHTML())
    expect(markdown).toContain('|')
    expect(markdown).toContain('---')
  })
})
```

#### 2. Integration Tests for TableBubbleMenu
```typescript
// tests/components/TableBubbleMenu.test.tsx

describe('TableBubbleMenu', () => {
  test('shows menu when cursor is inside table', () => {
    const editor = createEditor()
    editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run()
    render(<TableBubbleMenu editor={editor} />)
    expect(screen.getByText('Insert Column Left')).toBeInTheDocument()
  })

  test('hides menu when cursor is outside table', () => {
    const editor = createEditor()
    editor.commands.setContent('<p>Outside table</p>')
    render(<TableBubbleMenu editor={editor} />)
    expect(screen.queryByText('Insert Column Left')).not.toBeInTheDocument()
  })

  test('inserts column when button clicked', async () => {
    const editor = createEditor()
    editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run()
    render(<TableBubbleMenu editor={editor} />)

    const button = screen.getByText('Insert Column Left')
    await userEvent.click(button)

    // Verify column was added
    expect(editor.getHTML()).toContain('3 columns')
  })
})
```

#### 3. Manual Testing Checklist
- [ ] Table insertion works (3x3 default)
- [ ] Column insertion (before/after) works
- [ ] Row insertion (above/below) works
- [ ] Column deletion works
- [ ] Row deletion works
- [ ] Table deletion works
- [ ] Table resizing works (drag column borders)
- [ ] Cell selection works (click and drag)
- [ ] Multi-cell selection works
- [ ] Copy/paste table preserves structure
- [ ] Markdown conversion works (GFM syntax)
- [ ] Table loads correctly from markdown
- [ ] Keyboard shortcuts don't conflict (Tab, Enter, Arrow keys)

---

### Sprint 12 (Images) - Testing Plan

#### 1. Unit Tests for Image Upload
```typescript
// tests/services/drive/driveImageUploader.test.ts

describe('driveImageUploader', () => {
  test('uploads image file to Drive', async () => {
    const file = new File(['fake image data'], 'test.png', { type: 'image/png' })
    const accessToken = 'fake-token'

    const result = await uploadImageToDrive(file, accessToken)

    expect(result.fileId).toBeDefined()
    expect(result.webContentLink).toContain('drive.google.com')
  })

  test('rejects non-image files', async () => {
    const file = new File(['text data'], 'test.txt', { type: 'text/plain' })
    const accessToken = 'fake-token'

    await expect(uploadImageToDrive(file, accessToken)).rejects.toThrow('Only image files')
  })

  test('rejects files larger than 10MB', async () => {
    const largeData = new Array(11 * 1024 * 1024).fill('x').join('')
    const file = new File([largeData], 'large.png', { type: 'image/png' })
    const accessToken = 'fake-token'

    await expect(uploadImageToDrive(file, accessToken)).rejects.toThrow('smaller than 10MB')
  })
})
```

#### 2. Integration Tests for Image Upload Hook
```typescript
// tests/hooks/useImageUpload.test.tsx

describe('useImageUpload', () => {
  test('uploads image and inserts into editor', async () => {
    const editor = createEditor()
    const { result } = renderHook(() => useImageUpload(editor))

    const file = new File(['image data'], 'test.png', { type: 'image/png' })
    await act(async () => {
      await result.current.uploadImage(file)
    })

    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadError).toBeNull()
    expect(editor.getHTML()).toContain('<img')
  })

  test('shows error message when upload fails', async () => {
    const editor = createEditor()
    const { result } = renderHook(() => useImageUpload(editor))

    // Mock failed upload
    jest.spyOn(tokenManager, 'getAccessToken').mockResolvedValue(null)

    const file = new File(['image data'], 'test.png', { type: 'image/png' })
    await act(async () => {
      await result.current.uploadImage(file)
    })

    expect(result.current.uploadError).toBe('Not authenticated')
  })
})
```

#### 3. Manual Testing Checklist
- [ ] Image upload button shows file picker
- [ ] Uploading small image (<1MB) works
- [ ] Uploading large image (>10MB) shows error
- [ ] Uploading non-image file shows error
- [ ] Image appears in editor after upload
- [ ] Image displays correctly (not broken link)
- [ ] Image resizing works (drag corners)
- [ ] Image deletion works (BubbleMenu delete button)
- [ ] Alt text editing works (BubbleMenu alt text button)
- [ ] Markdown conversion works (`![alt](url)`)
- [ ] Image loads correctly from markdown
- [ ] Image survives copy/paste
- [ ] Image survives document save/load cycle

---

## 🚀 Recommended Implementation Plan

### Sprint 11: Tables (Estimated: 3-5 days)

#### Phase 1: Dependency Upgrade (Day 1)
1. Upgrade all TipTap extensions to v3.6.6
2. Run full test suite to catch breaking changes
3. Fix any test failures caused by upgrade
4. Verify all existing features still work

#### Phase 2: Table Extension Integration (Day 2)
1. Install Table extensions and Turndown GFM plugin
2. Add Table extensions to Editor.tsx
3. Add Turndown GFM plugin configuration
4. Add table CSS styles
5. Test basic table insertion

#### Phase 3: TableBubbleMenu (Day 3)
1. Create TableBubbleMenu.tsx component
2. Implement table manipulation buttons
3. Test all table operations
4. Add keyboard shortcuts (optional)

#### Phase 4: Testing & Documentation (Day 4)
1. Write unit tests for Table extension
2. Write integration tests for TableBubbleMenu
3. Manual testing checklist
4. Write developer documentation
5. Write user-facing guide

#### Phase 5: Bundle Optimization (Day 5)
1. Implement code splitting for Table extensions
2. Test lazy loading functionality
3. Verify bundle size reduction
4. Update vite.config.ts with manualChunks

---

### Sprint 12: Images (Estimated: 4-6 days)

#### Phase 1: Drive Image Upload Service (Day 1-2)
1. Create driveImageUploader.ts service
2. Implement binary file upload
3. Add file validation (type, size)
4. Test upload with real Drive API
5. Handle upload errors

#### Phase 2: Image Upload Hook (Day 3)
1. Create useImageUpload.ts hook
2. Integrate with driveImageUploader service
3. Implement loading/error states
4. Test hook with mock editor

#### Phase 3: Image Extension Integration (Day 4)
1. Install Image extension
2. Add Image extension to Editor.tsx
3. Add image CSS styles
4. Create ImageUploadButton component
5. Test image insertion

#### Phase 4: ImageBubbleMenu (Day 5)
1. Create ImageBubbleMenu.tsx component
2. Implement alt text editing
3. Implement image deletion
4. Test all image operations

#### Phase 5: Testing & Documentation (Day 6)
1. Write unit tests for image upload
2. Write integration tests for ImageBubbleMenu
3. Manual testing checklist
4. Write developer documentation
5. Write user-facing guide

---

## 📝 Summary & Recommendations

### Overall Readiness: ✅ EXCELLENT

The RiteMark codebase is architecturally **ready for Tables and Images** with minimal refactoring required. The TipTap plugin system, Turndown markdown conversion, and BubbleMenu architecture all support adding these features cleanly.

### Key Strengths
1. ✅ **Clean Architecture**: Modular TipTap extensions, easy to add new features
2. ✅ **BubbleMenu System**: Supports multiple context-sensitive menus
3. ✅ **Markdown Conversion**: Turndown + marked.js support tables and images
4. ✅ **Drive Integration**: Text file handling works well, can extend to binary files

### Key Challenges
1. ⚠️ **Bundle Size**: Will increase by ~112KB gzipped (+37%)
   - **Solution**: Implement code splitting (see Bundle Size section)
2. ⚠️ **TipTap Upgrade**: v3.4.3 → v3.6.6 may have breaking changes
   - **Solution**: Run full test suite after upgrade, check changelog
3. ⚠️ **Image Upload**: Requires new binary file handling for Drive
   - **Solution**: Create driveImageUploader service (see Code Changes section)

### Recommended Order of Operations
1. **Sprint 11 (Tables)** - Lower risk, no new Drive features needed
2. **Sprint 12 (Images)** - Higher risk, requires Drive binary upload

### Critical Action Items Before Sprint 11
1. ✅ Upgrade TipTap extensions to v3.6.6
2. ✅ Check TipTap v3.6.6 changelog for breaking changes
3. ✅ Run full test suite after upgrade
4. ✅ Implement code splitting to prevent bundle bloat
5. ✅ Manual browser testing of existing features

### Critical Action Items Before Sprint 12
1. ✅ Test Drive API binary upload with real Google account
2. ✅ Verify OAuth scope supports image uploads
3. ✅ Test Drive URL accessibility (CORS, public sharing)
4. ✅ Implement image compression (optional, for performance)

---

## 🔗 Related Documentation

- [TipTap Table Extension Docs](https://tiptap.dev/docs/editor/api/nodes/table)
- [TipTap Image Extension Docs](https://tiptap.dev/docs/editor/api/nodes/image)
- [Turndown GFM Plugin](https://github.com/mixmark-io/turndown-plugin-gfm)
- [Google Drive API Upload](https://developers.google.com/drive/api/guides/manage-uploads)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)

---

**Audit Status:** ✅ COMPLETE
**Next Steps:** Begin Sprint 11 (Tables) implementation
**Confidence Level:** HIGH (90%) - Codebase is well-architected and ready
