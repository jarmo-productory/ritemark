# Sprint 12: Images Support - Execution Plan

**Date:** October 11, 2025
**Status:** 📋 READY FOR EXECUTION
**Estimated Duration:** 16-20 hours
**Dependencies:** Sprint 11 (Tables) ✅ PENDING

---

## 🎯 Sprint Goal

**"Enable users to insert, upload, resize, and caption images in the WYSIWYG editor with Google Drive integration and markdown conversion support."**

---

## 📊 Sprint Overview

### What's Included (In Scope)
- ✅ Image insertion via toolbar button
- ✅ File picker for local image upload
- ✅ Google Drive image upload and storage
- ✅ Drag-and-drop image upload
- ✅ Image resizing (click and drag handles)
- ✅ Image positioning (inline, left, center, right)
- ✅ Alt text for accessibility
- ✅ Image captions (optional)
- ✅ Lazy loading for performance
- ✅ Image optimization (resize on upload)
- ✅ HTML-to-Markdown conversion (image links)
- ✅ Markdown-to-HTML parsing (image tags)
- ✅ Comprehensive tests (50+ test cases)
- ✅ Documentation (developer + user guides)

### What's Excluded (Out of Scope)
- ❌ Advanced image editing (crop, rotate, filters)
- ❌ Image galleries or carousels
- ❌ WebP/AVIF format conversion (use existing formats)
- ❌ Image CDN integration (use Google Drive URLs)
- ❌ Image search (Google Images API)
- ❌ Paste from clipboard (defer to Sprint 13+)

### Success Criteria
1. **User can insert images** via toolbar button or drag-and-drop
2. **Images upload to Google Drive** with proper authentication
3. **User can resize images** by dragging corner handles
4. **User can add alt text and captions** for accessibility
5. **Images convert correctly** to/from markdown (`![alt](url)` format)
6. **All automated tests pass** (50+ tests, 100% pass rate)
7. **Browser validation succeeds** (no console errors, images render correctly)

---

## 📐 Technical Architecture

### TipTap Extensions Required
```json
{
  "@tiptap/extension-image": "^3.4.3"
}
```

### Google Drive API Integration
**Upload Flow:**
1. User selects image file (local file picker)
2. Image file uploaded to Google Drive folder (via existing Drive service)
3. Drive returns shareable link (public URL)
4. Insert image node with Drive URL into editor

**Drive Service Extension (`src/services/drive/DriveImageUpload.ts`):**
```typescript
async function uploadImage(file: File): Promise<string> {
  // 1. Resize image if > 2MB (client-side canvas resize)
  // 2. Upload to Drive via multipart/form-data
  // 3. Set file permissions (shareable link)
  // 4. Return public URL
}
```

### Turndown Plugin
**Custom Rule:** Convert `<img>` → markdown image format
```javascript
turndownService.addRule('image', {
  filter: 'img',
  replacement: (content, node) => {
    const alt = node.getAttribute('alt') || ''
    const src = node.getAttribute('src') || ''
    return `![${alt}](${src})`
  }
})
```

### Markdown Parsing
**marked.js Default:** Parse markdown images → HTML
```javascript
// marked.js already handles ![alt](url) → <img> conversion
// No custom extension needed
```

---

## 🔄 Phase Breakdown (7 Phases)

### **Phase 1: Install TipTap Image Extension** (1 hour)
**Goal:** Add image dependency and configure editor

**Tasks:**
1. Install TipTap Image extension via npm
2. Import Image extension in Editor.tsx
3. Configure extension with default options (inline: true, resizable: true)
4. Add basic image CSS styling (max-width, centering)
5. Verify dev server compiles without errors
6. Test image insertion (manual smoke test with local URL)

**Success Criteria:**
- ✅ `npm run type-check` passes
- ✅ Dev server runs on localhost:5173
- ✅ Can manually insert image via `editor.commands.setImage({ src: 'url' })`

**Risks:**
- ⚠️ Extension version conflicts with existing TipTap packages
- **Mitigation:** Use exact version matching current `@tiptap/react` (v3.4.3)

---

### **Phase 2: Image Toolbar Button with Local File Picker** (3 hours)
**Goal:** Add image insertion button to toolbar with file upload

**Tasks:**
1. Create `ImageUploader.tsx` component (file input + preview)
2. Add image button to main toolbar (next to Table button)
3. Implement file picker (accept: image/png, image/jpeg, image/gif, image/webp)
4. Add file validation (max 10MB, supported formats only)
5. Implement client-side image preview (before upload)
6. Wire button to `editor.commands.setImage({ src })`
7. Add keyboard shortcut (Cmd+Shift+I)
8. Update toolbar tests

**Component Structure:**
```tsx
<ImageUploader
  onUpload={(file) => {
    // Upload to Drive
    const url = await uploadImage(file)
    editor.commands.setImage({ src: url })
  }}
/>
```

**Success Criteria:**
- ✅ Image button appears in toolbar
- ✅ Clicking button opens file picker
- ✅ Selected image shows preview
- ✅ Image uploads (local storage first, Drive in Phase 3)
- ✅ Keyboard shortcut works (Cmd+Shift+I)

**Risks:**
- ⚠️ Large image files (> 10MB) cause browser hang
- **Mitigation:** Add file size validation, show error message for oversized files

---

### **Phase 3: Google Drive Image Upload** (4 hours)
**Goal:** Upload images to Google Drive and use shareable links

**Tasks:**
1. Create `src/services/drive/DriveImageUpload.ts` service
2. Implement `uploadImage(file: File): Promise<string>` function:
   - Resize image if > 2MB (canvas-based resizing)
   - Upload to Drive folder (multipart/form-data)
   - Set file permissions (shareable link, anyone with link can view)
   - Return public Drive URL
3. Integrate DriveImageUpload with ImageUploader component
4. Add OAuth error handling (re-authenticate if token expired)
5. Add progress indicator (loading spinner during upload)
6. Test with various image formats (PNG, JPEG, GIF, WebP)
7. Test with large images (> 2MB, verify resizing)

**Drive API Request:**
```typescript
// Upload multipart request
const metadata = {
  name: file.name,
  parents: ['ritemark-images-folder-id']
}
const form = new FormData()
form.append('metadata', JSON.stringify(metadata))
form.append('file', file)

const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form
})
```

**Success Criteria:**
- ✅ Images upload to Google Drive successfully
- ✅ Shareable link generated (public URL)
- ✅ Images display in editor using Drive URL
- ✅ OAuth re-authentication works if token expired
- ✅ Progress indicator shows during upload

**Risks:**
- ⚠️ Drive API rate limits (429 errors)
- **Mitigation:** Implement exponential backoff retry logic
- ⚠️ OAuth token expiration during upload
- **Mitigation:** Refresh token before upload, handle 401 errors gracefully

---

### **Phase 4: Drag-and-Drop Image Upload** (2 hours)
**Goal:** Enable drag-and-drop image upload into editor

**Tasks:**
1. Add `onDrop` event handler to Editor.tsx
2. Implement drag-and-drop detection (check for image files)
3. Extract image file from drop event
4. Upload to Drive via DriveImageUpload service
5. Insert image at drop position (cursor location)
6. Add visual feedback (highlight drop zone on dragover)
7. Test drag-and-drop on desktop and mobile (touch)

**Success Criteria:**
- ✅ User can drag image file into editor
- ✅ Image uploads to Drive automatically
- ✅ Image inserts at drop position
- ✅ Visual feedback shows drop zone

**Risks:**
- ⚠️ Mobile drag-and-drop not supported (no touch events)
- **Mitigation:** Fallback to file picker button on mobile

---

### **Phase 5: Image Resizing and Positioning** (3 hours)
**Goal:** Enable image resizing via drag handles and positioning options

**Tasks:**
1. Configure TipTap Image extension with `resizable: true`
2. Add CSS for resize handles (corner and edge handles)
3. Implement resize logic (update width/height on drag)
4. Create `ImagePositionMenu.tsx` component (inline, left, center, right)
5. Add positioning buttons to image context menu
6. Wire positioning to CSS classes (float: left, margin: auto, etc.)
7. Test resizing with various aspect ratios
8. Test positioning on mobile (responsive behavior)

**Positioning Options:**
- **Inline:** Default (image flows with text)
- **Left:** Float left, text wraps right
- **Center:** Center-aligned, no text wrap
- **Right:** Float right, text wraps left

**Success Criteria:**
- ✅ User can resize images by dragging handles
- ✅ Aspect ratio preserved during resize
- ✅ User can change image position (left, center, right)
- ✅ Responsive behavior on mobile (no overflow)

**Risks:**
- ⚠️ Resize handles conflict with text selection
- **Mitigation:** Use `pointer-events: none` on non-interactive elements

---

### **Phase 6: Alt Text, Captions, and Lazy Loading** (3 hours)
**Goal:** Add accessibility features and performance optimizations

**Tasks:**
1. **Alt Text:**
   - Create `ImageAltTextDialog.tsx` component (Radix Dialog)
   - Add "Edit Alt Text" button to image context menu
   - Wire dialog to `editor.commands.updateAttributes('image', { alt })`
   - Test with screen readers (accessibility validation)
2. **Captions:**
   - Create `ImageCaptionInput.tsx` component (inline editable text)
   - Add caption below image (optional, hidden if empty)
   - Store caption in image node attributes
   - Convert caption to markdown (append as italic text below image)
3. **Lazy Loading:**
   - Configure TipTap Image extension with `loading: "lazy"`
   - Add `loading="lazy"` attribute to `<img>` tags
   - Test with long documents (verify images load on scroll)
4. **Image Optimization:**
   - Resize images on upload (max 1920px width)
   - Compress JPEG images (quality: 85%)
   - Convert PNG to JPEG if no transparency (smaller file size)

**Success Criteria:**
- ✅ User can add/edit alt text for images
- ✅ User can add captions below images
- ✅ Images lazy load (only load when scrolled into view)
- ✅ Images optimized on upload (smaller file sizes)

**Risks:**
- ⚠️ Caption markdown conversion may break table layouts
- **Mitigation:** Convert caption to HTML `<figcaption>` instead of markdown text

---

### **Phase 7: Testing and Documentation** (4 hours)
**Goal:** Write comprehensive tests and documentation

**Tasks:**
1. **Automated Tests** (`ImageFeatures.test.tsx`):
   - Image insertion (file picker) (4 tests)
   - Google Drive upload (5 tests: success, error, retry, OAuth)
   - Drag-and-drop upload (4 tests)
   - Image resizing (5 tests: width, height, aspect ratio)
   - Image positioning (4 tests: inline, left, center, right)
   - Alt text (4 tests: add, edit, delete, accessibility)
   - Captions (4 tests: add, edit, delete, markdown conversion)
   - Lazy loading (3 tests: loading attribute, scroll behavior)
   - Markdown conversion (8 tests: round-trip, edge cases)
   - Edge cases (5 tests: large images, invalid formats, network errors)
   - **Total: 50+ tests**
2. **Developer Documentation** (`docs/components/ImageFeatures.md`):
   - API reference
   - Google Drive integration guide
   - Configuration options
   - Code examples
   - Troubleshooting
3. **User Documentation** (`docs/user-guide/images.md`):
   - How to insert images
   - How to upload to Google Drive
   - How to resize and position images
   - How to add alt text and captions
   - Keyboard shortcuts reference
4. **README updates:**
   - Add "Images" to feature list
   - Link to image documentation

**Success Criteria:**
- ✅ 50+ tests written and passing (100% pass rate)
- ✅ Developer docs complete (600+ lines)
- ✅ User docs complete (400+ lines)
- ✅ All links working
- ✅ Browser validation passed (Chrome DevTools MCP)

**Risks:**
- ⚠️ Test flakiness with file upload and async Drive API
- **Mitigation:** Mock Drive API calls, use fake file objects in tests

---

## 📋 Detailed Task List (60 Tasks)

### Phase 1: Install TipTap Image Extension (6 tasks)
- [ ] **Task 1.1**: Install `@tiptap/extension-image` (npm install)
- [ ] **Task 1.2**: Import Image extension in `Editor.tsx`
- [ ] **Task 1.3**: Configure extension with default options (inline, resizable)
- [ ] **Task 1.4**: Add basic image CSS styling (max-width, centering)
- [ ] **Task 1.5**: Verify TypeScript compilation (`npm run type-check`)
- [ ] **Task 1.6**: Manual smoke test: insert image via console

### Phase 2: Image Toolbar Button with File Picker (10 tasks)
- [ ] **Task 2.1**: Create `src/components/ImageUploader.tsx` component
- [ ] **Task 2.2**: Design file picker UI (hidden input + button trigger)
- [ ] **Task 2.3**: Implement file validation (max 10MB, image formats only)
- [ ] **Task 2.4**: Add client-side image preview (canvas or blob URL)
- [ ] **Task 2.5**: Create Image button icon (Image from lucide-react)
- [ ] **Task 2.6**: Add image button to main toolbar (next to Table button)
- [ ] **Task 2.7**: Wire file picker to insertImage command
- [ ] **Task 2.8**: Add keyboard shortcut (Cmd+Shift+I) in Editor.tsx
- [ ] **Task 2.9**: Test image insertion (local URLs first)
- [ ] **Task 2.10**: Update toolbar tests to include image button

### Phase 3: Google Drive Image Upload (12 tasks)
- [ ] **Task 3.1**: Create `src/services/drive/DriveImageUpload.ts`
- [ ] **Task 3.2**: Implement `uploadImage(file: File)` function
- [ ] **Task 3.3**: Add client-side image resizing (canvas resize if > 2MB)
- [ ] **Task 3.4**: Implement Drive multipart upload request
- [ ] **Task 3.5**: Set file permissions (shareable link, anyone with link)
- [ ] **Task 3.6**: Return public Drive URL from upload function
- [ ] **Task 3.7**: Integrate DriveImageUpload with ImageUploader component
- [ ] **Task 3.8**: Add OAuth error handling (401 errors)
- [ ] **Task 3.9**: Add Drive API rate limit handling (429 errors, exponential backoff)
- [ ] **Task 3.10**: Add progress indicator (loading spinner during upload)
- [ ] **Task 3.11**: Test with various image formats (PNG, JPEG, GIF, WebP)
- [ ] **Task 3.12**: Test with large images (> 2MB, verify resizing)

### Phase 4: Drag-and-Drop Image Upload (8 tasks)
- [ ] **Task 4.1**: Add `onDrop` event handler to Editor.tsx
- [ ] **Task 4.2**: Implement drag-and-drop detection (check for image files)
- [ ] **Task 4.3**: Extract image file from drop event
- [ ] **Task 4.4**: Upload dropped image via DriveImageUpload
- [ ] **Task 4.5**: Insert image at drop position (cursor location)
- [ ] **Task 4.6**: Add visual feedback (highlight drop zone on dragover)
- [ ] **Task 4.7**: Test drag-and-drop on desktop
- [ ] **Task 4.8**: Test drag-and-drop on mobile (fallback to file picker)

### Phase 5: Image Resizing and Positioning (10 tasks)
- [ ] **Task 5.1**: Configure TipTap Image extension with `resizable: true`
- [ ] **Task 5.2**: Add CSS for resize handles (corner and edge handles)
- [ ] **Task 5.3**: Implement resize logic (update width/height on drag)
- [ ] **Task 5.4**: Add aspect ratio preservation during resize
- [ ] **Task 5.5**: Create `ImagePositionMenu.tsx` component
- [ ] **Task 5.6**: Add positioning buttons (inline, left, center, right)
- [ ] **Task 5.7**: Wire positioning to CSS classes (float, margin)
- [ ] **Task 5.8**: Test resizing with various aspect ratios
- [ ] **Task 5.9**: Test positioning on desktop
- [ ] **Task 5.10**: Test responsive behavior on mobile

### Phase 6: Alt Text, Captions, and Lazy Loading (12 tasks)
- [ ] **Task 6.1**: Create `ImageAltTextDialog.tsx` component (Radix Dialog)
- [ ] **Task 6.2**: Add "Edit Alt Text" button to image context menu
- [ ] **Task 6.3**: Wire dialog to updateAttributes command
- [ ] **Task 6.4**: Test alt text with screen readers (accessibility)
- [ ] **Task 6.5**: Create `ImageCaptionInput.tsx` component (inline editable)
- [ ] **Task 6.6**: Add caption below image (optional, hidden if empty)
- [ ] **Task 6.7**: Store caption in image node attributes
- [ ] **Task 6.8**: Convert caption to HTML `<figcaption>` (not markdown text)
- [ ] **Task 6.9**: Configure Image extension with `loading: "lazy"`
- [ ] **Task 6.10**: Test lazy loading with long documents
- [ ] **Task 6.11**: Implement image optimization (resize, compress)
- [ ] **Task 6.12**: Test optimization (verify smaller file sizes)

### Phase 7: Testing and Documentation (16 tasks)
- [ ] **Task 7.1**: Create `tests/components/ImageFeatures.test.tsx`
- [ ] **Task 7.2**: Write image insertion tests (4 tests)
- [ ] **Task 7.3**: Write Google Drive upload tests (5 tests)
- [ ] **Task 7.4**: Write drag-and-drop tests (4 tests)
- [ ] **Task 7.5**: Write image resizing tests (5 tests)
- [ ] **Task 7.6**: Write image positioning tests (4 tests)
- [ ] **Task 7.7**: Write alt text tests (4 tests)
- [ ] **Task 7.8**: Write caption tests (4 tests)
- [ ] **Task 7.9**: Write lazy loading tests (3 tests)
- [ ] **Task 7.10**: Write markdown conversion tests (8 tests)
- [ ] **Task 7.11**: Write edge case tests (5 tests)
- [ ] **Task 7.12**: Run all tests and verify 100% pass rate
- [ ] **Task 7.13**: Create `docs/components/ImageFeatures.md` (developer docs)
- [ ] **Task 7.14**: Create `docs/user-guide/images.md` (user guide)
- [ ] **Task 7.15**: Update README with image features
- [ ] **Task 7.16**: Browser validation via Chrome DevTools MCP

---

## 🚨 Risk Assessment & Mitigation

### High-Risk Areas

#### 1. **Google Drive Upload Reliability** (High Risk)
**Issue:** Network errors, OAuth token expiration, Drive API rate limits
**Impact:** Images fail to upload, users frustrated
**Mitigation:**
- Implement exponential backoff retry logic (max 3 retries)
- Refresh OAuth token before upload
- Handle 401 (auth) and 429 (rate limit) errors gracefully
- Show user-friendly error messages with retry button
- Cache uploaded images to avoid duplicate uploads

#### 2. **Large Image Performance** (High Risk)
**Issue:** Uploading 10MB+ images causes browser hang, slow editor
**Impact:** Poor user experience, editor becomes unusable
**Mitigation:**
- Add strict file size validation (max 10MB)
- Resize images client-side before upload (canvas-based, max 1920px width)
- Compress JPEG images (quality: 85%)
- Show progress indicator during upload
- Consider WebWorker for image processing (future optimization)

#### 3. **Mobile Drag-and-Drop** (Medium Risk)
**Issue:** Touch devices don't support standard drag-and-drop
**Impact:** Feature doesn't work on mobile
**Mitigation:**
- Fallback to file picker button on mobile
- Detect touch device (`window.ontouchstart !== undefined`)
- Show mobile-friendly file picker UI

### Low-Risk Areas
- ✅ TipTap Image extension is mature and stable
- ✅ File picker UI is simple (native input element)
- ✅ Markdown image conversion is straightforward (`![alt](url)`)

---

## 🎯 Definition of Done

Sprint 12 is **COMPLETE** when:
1. ✅ All 60 tasks checked off
2. ✅ All automated tests passing (50+ tests, 100% pass rate)
3. ✅ `npm run type-check` passes (zero TypeScript errors)
4. ✅ `npm run lint` passes (zero errors in Sprint 12 code)
5. ✅ Dev server runs without errors on localhost:5173
6. ✅ Browser validation completed (Chrome DevTools MCP or manual)
7. ✅ Documentation complete (developer + user guides)
8. ✅ User can insert, upload, resize, and caption images successfully
9. ✅ Images upload to Google Drive with shareable links
10. ✅ Images convert correctly to/from markdown
11. ✅ Code reviewed and approved for merge

---

## 📊 Sprint Metrics (Estimated)

| Metric | Target |
|--------|--------|
| **Total Tasks** | 60 tasks |
| **New Files** | 6-7 files (ImageUploader, DriveImageUpload, context menus, tests, docs) |
| **Lines of Code** | ~1,200 lines (components + services + tests) |
| **Documentation** | ~1,000 lines (developer + user docs) |
| **Tests** | 50+ tests |
| **Dependencies Added** | 1 package (TipTap Image extension) |
| **Bundle Size Impact** | ~10KB gzipped (Image extension) |
| **Estimated Time** | 16-20 hours |

---

## 🔗 Related Documentation

- [TipTap Image Extension](https://tiptap.dev/docs/editor/api/extensions/image)
- [Google Drive API: Upload Files](https://developers.google.com/drive/api/guides/manage-uploads)
- [Markdown Image Syntax](https://www.markdownguide.org/basic-syntax/#images-1)
- [Sprint 11 Tables Plan](./sprint-11-tables-plan.md)
- [Sprint 10 Completion Report](./sprint-10-completion-report.md)

---

## 📝 Next Steps After Sprint 12

**Sprint 13+: Enhanced Formatting** will include:
- Table cell alignment (left, center, right)
- Strikethrough and underline formatting
- Code inline formatting (backticks)
- Blockquotes and horizontal rules
- Paste from clipboard (images + text)

**Future Enhancements (Post-Sprint 13):**
- Advanced image editing (crop, rotate, filters)
- Image galleries and carousels
- WebP/AVIF format conversion
- Image CDN integration (Cloudflare Images)

---

**Sprint 12 Status:** 📋 READY FOR EXECUTION
**Approval Required:** YES (user confirmation after Sprint 11 completes)
**Estimated Start Date:** TBD (after Sprint 11 completion and user approval)
