# Sprint 12: Image Support Research & Technical Specification

**Date:** October 11, 2025
**Research Agent:** Senior Research Analyst
**Status:** RESEARCH COMPLETE
**Sprint Type:** Feature Research & Planning

---

## 📋 Executive Summary

This research document provides a comprehensive analysis for implementing image support in RiteMark, targeting the "Google Docs for Markdown" vision with cloud-native image storage via Google Drive. The implementation will focus on non-technical users who need visual editing with drag-drop upload, inline image management, and mobile camera support.

**Key Findings:**
- TipTap official Image extension (v3.6.6) provides base functionality
- Third-party resizing extensions available (tiptap-extension-resize-image)
- Google Drive multipart upload supports binary image files
- IndexedDB + Cache API optimal for offline image caching in PWAs
- Browser-side compression reduces upload bandwidth by 60-80%
- WCAG 2.1 requires mandatory alt text for accessibility

**Recommended Approach:**
- Use TipTap Image extension + resizing library
- Store images in Google Drive, reference by file ID in markdown
- Implement client-side WebP compression before upload
- IndexedDB for offline image queue + thumbnail cache
- Mobile camera integration via MediaDevices API
- Enforce alt text for accessibility compliance

---

## 🎯 Feature Requirements (User Stories)

### User Story 1: Basic Image Upload
**As a** content creator
**I want to** add images to my documents by clicking a button or dragging files
**So that** I can illustrate my content visually without learning markdown syntax

**Acceptance Criteria:**
- ✅ Image button in toolbar/bubble menu opens file picker
- ✅ Drag-drop image files onto editor inserts inline
- ✅ Paste clipboard images (Ctrl+V / Cmd+V)
- ✅ Upload progress indicator during large file uploads
- ✅ Images appear inline in editor immediately after upload
- ✅ Error messages for unsupported formats or size limits

### User Story 2: Image Resizing
**As a** content creator
**I want to** resize images by dragging handles
**So that** I can control layout without technical knowledge

**Acceptance Criteria:**
- ✅ Resize handles appear when image is selected
- ✅ Maintains aspect ratio by default (shift-drag to override)
- ✅ Width can be set as percentage or pixels
- ✅ Visual feedback during resize (ghosted outline)
- ✅ Mobile: tap to select, pinch-to-zoom resize

### User Story 3: Alt Text & Captions
**As a** content creator
**I want to** add alt text and captions to images
**So that** my content is accessible and professional

**Acceptance Criteria:**
- ✅ Alt text dialog prompts immediately after upload
- ✅ Can edit alt text by clicking "Edit Alt Text" button on selected image
- ✅ Optional caption below image (visible to readers)
- ✅ Screen reader announces alt text when focused
- ✅ Warning indicator if alt text is missing

### User Story 4: Mobile Camera Upload
**As a** mobile user
**I want to** take photos with my phone camera and add them to documents
**So that** I can create content on-the-go

**Acceptance Criteria:**
- ✅ "Take Photo" button opens device camera
- ✅ Preview captured photo before inserting
- ✅ Auto-rotation correction (portrait/landscape)
- ✅ Option to compress image before upload
- ✅ Works on iOS Safari and Android Chrome

### User Story 5: Offline Image Management
**As a** user with unreliable internet
**I want to** add images offline and have them upload automatically when connected
**So that** I can work without interruption

**Acceptance Criteria:**
- ✅ Images added offline show "Pending Upload" indicator
- ✅ Auto-upload when network connection restored
- ✅ Thumbnail cached locally for instant display
- ✅ Retry logic for failed uploads (exponential backoff)
- ✅ User can manually retry failed uploads

---

## 🔍 Technical Architecture

### 1. TipTap Image Extension Analysis

#### Official Extension: `@tiptap/extension-image`

**Version:** 3.6.6 (latest, published Oct 2025)
**Compatibility:** TipTap v3.4.3 and above
**Bundle Size:** ~3KB gzipped

**Features:**
- ✅ `src` attribute (URL or data URL)
- ✅ `alt` attribute (accessibility text)
- ✅ `title` attribute (tooltip on hover)
- ✅ Custom HTML attributes via `HTMLAttributes` config
- ✅ Inline rendering (ProseMirror node)
- ✅ Markdown round-trip support: `![alt](url "title")`

**Limitations:**
- ❌ No built-in resizing (need third-party extension)
- ❌ No captions (only `title` attribute for tooltip)
- ❌ No alignment controls (left, center, right, full-width)
- ❌ No upload handling (must implement separately)

**Installation:**
```bash
npm install @tiptap/extension-image@latest
```

**Basic Usage:**
```typescript
import Image from '@tiptap/extension-image'

const editor = useEditor({
  extensions: [
    Image.configure({
      inline: true, // Allow inline images
      allowBase64: true, // Support data URLs for offline
      HTMLAttributes: {
        class: 'tiptap-image',
      },
    }),
  ],
})

// Insert image programmatically
editor.chain().focus().setImage({ src: url, alt: altText }).run()
```

#### Third-Party Resizing Extensions

**Option 1: `tiptap-extension-resize-image` (Recommended)**

**Version:** 1.3.0 (latest)
**Bundle Size:** ~8KB gzipped
**Features:**
- ✅ Drag handles for resizing
- ✅ Aspect ratio locking
- ✅ Width/height attributes
- ✅ Alignment (left, center, right, full-width)
- ✅ React, Vue, Next.js support
- ✅ Mobile-friendly touch events

**Installation:**
```bash
npm install tiptap-extension-resize-image
```

**Usage:**
```typescript
import { ResizableImageExtension } from 'tiptap-extension-resize-image'

const editor = useEditor({
  extensions: [
    ResizableImageExtension.configure({
      inline: true,
      allowBase64: true,
      maxWidth: 1200, // Max width in pixels
      defaultAlignment: 'center',
    }),
  ],
})
```

**Option 2: `tiptap-image-plus` (Advanced)**

**Features:**
- ✅ All features from resize-image
- ✅ Caption support (separate text node below image)
- ✅ Lightbox preview (click to enlarge)
- ✅ Image gallery mode (multiple images side-by-side)
- ⚠️ Larger bundle size (~15KB gzipped)

**Trade-off:** More features but heavier bundle. Recommended for v2 if captions are MVP-critical.

**Recommendation for Sprint 12:**
- Use `tiptap-extension-resize-image` for MVP
- Add `tiptap-image-plus` in Sprint 13 if captions needed

---

### 2. Google Drive Image Storage Strategy

#### Drive API Image Upload Flow

**Step 1: Client-Side Compression (Before Upload)**
```typescript
import imageCompression from 'browser-image-compression'

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Max file size 1MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true, // Non-blocking
    fileType: 'image/webp', // Convert to WebP (60% smaller)
  }

  const compressedFile = await imageCompression(file, options)
  return compressedFile
}
```

**Step 2: Multipart Upload to Drive**
```typescript
async function uploadImageToDrive(
  file: File,
  filename: string
): Promise<DriveFile> {
  const compressedFile = await compressImage(file)

  // Create multipart request
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadata = {
    name: filename,
    mimeType: compressedFile.type,
    parents: [DRIVE_IMAGES_FOLDER_ID], // Dedicated folder for images
  }

  // Read file as ArrayBuffer for binary upload
  const fileBuffer = await file.arrayBuffer()
  const fileBytes = new Uint8Array(fileBuffer)

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${compressedFile.type}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    btoa(String.fromCharCode(...fileBytes)) + // Base64 encode
    closeDelimiter

  const url = `${UPLOAD_API_BASE}/files?uploadType=multipart`
  const response = await driveClient.makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  })

  return response as DriveFile
}
```

**Step 3: Generate Thumbnail (Drive API)**
```typescript
// Get thumbnail URL for fast loading
const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`
```

**Step 4: Store Reference in Markdown**
```markdown
![Alt text](drive://fileId "Optional title")
```

**Benefits of Drive Storage:**
- ✅ No separate image hosting needed
- ✅ User's own Google Drive quota (15GB free)
- ✅ Automatic backups and version history
- ✅ Thumbnail API for fast previews
- ✅ OAuth already implemented in Sprint 8
- ✅ Works with `drive.file` scope (already authorized)

**Image Reference Strategy:**

**Option A: Drive File ID (Recommended)**
```markdown
![Product screenshot](drive://1a2b3c4d5e6f "Screenshot of dashboard")
```
**Pros:** Permanent reference, works offline (cached), no URL expiry
**Cons:** Custom markdown syntax, need renderer to convert to URL

**Option B: Drive Direct Link**
```markdown
![Product screenshot](https://drive.google.com/uc?id=1a2b3c4d5e6f "Screenshot")
```
**Pros:** Standard markdown, works in any viewer
**Cons:** Requires OAuth for private files, URL might expire

**Recommendation:** Use Option A (Drive File ID) with custom renderer in Editor.tsx

---

### 3. Offline Image Caching with IndexedDB

#### IndexedDB Schema for Images

```typescript
interface ImageCacheEntry {
  fileId: string // Drive file ID
  blob: Blob // Image binary data
  mimeType: string // image/webp, image/jpeg, etc.
  thumbnail: Blob // 400x300 thumbnail
  alt: string
  title?: string
  width?: number
  height?: number
  uploadStatus: 'uploaded' | 'pending' | 'failed'
  createdAt: number // Timestamp
  lastModified: number
}

// IndexedDB database
const DB_NAME = 'ritemark-images'
const DB_VERSION = 1
const STORE_NAME = 'images'

// Initialize database
async function initImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'fileId' })

      // Indexes for querying
      store.createIndex('uploadStatus', 'uploadStatus', { unique: false })
      store.createIndex('createdAt', 'createdAt', { unique: false })
    }
  })
}
```

#### Cache-First Image Loading Strategy

```typescript
async function loadImage(fileId: string): Promise<string> {
  // 1. Try IndexedDB cache first (instant)
  const cached = await getImageFromCache(fileId)
  if (cached) {
    return URL.createObjectURL(cached.blob)
  }

  // 2. Fetch from Drive (network request)
  const driveFile = await driveClient.getFile(fileId)
  const imageUrl = await driveClient.getFileContent(fileId)

  // 3. Cache for future use
  const blob = await fetch(imageUrl).then(r => r.blob())
  await cacheImage(fileId, blob, driveFile)

  return URL.createObjectURL(blob)
}
```

#### Offline Upload Queue

```typescript
interface PendingUpload {
  localId: string // Temporary ID (UUID)
  file: File
  alt: string
  title?: string
  retryCount: number
  createdAt: number
}

// Store pending uploads in IndexedDB
const UPLOAD_QUEUE_STORE = 'upload-queue'

// Process queue when online
async function processUploadQueue(): Promise<void> {
  const queue = await getPendingUploads()

  for (const upload of queue) {
    try {
      // Upload to Drive
      const driveFile = await uploadImageToDrive(upload.file, upload.file.name)

      // Replace temporary src in editor
      replaceImageSrc(upload.localId, driveFile.id)

      // Remove from queue
      await removePendingUpload(upload.localId)
    } catch (error) {
      // Increment retry count
      upload.retryCount++
      if (upload.retryCount > 3) {
        // Show error to user after 3 retries
        showUploadError(upload)
      } else {
        // Exponential backoff retry
        await sleep(1000 * Math.pow(2, upload.retryCount))
      }
    }
  }
}

// Listen for online event
window.addEventListener('online', processUploadQueue)
```

**Storage Capacity:**
- Chrome: 60% of total disk space per origin
- Typical: 5-10GB available for images
- Cleanup strategy: Delete cached images older than 30 days (keep frequently accessed)

---

### 4. Mobile Camera Integration

#### MediaDevices API for Camera Access

```typescript
interface CameraUploadOptions {
  quality: 'high' | 'medium' | 'low'
  compress: boolean
}

async function capturePhotoFromCamera(
  options: CameraUploadOptions = { quality: 'high', compress: true }
): Promise<File> {
  // Request camera permission
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment', // Rear camera (change to 'user' for selfie)
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  })

  // Create video element to display camera feed
  const video = document.createElement('video')
  video.srcObject = stream
  video.play()

  // Wait for video to load
  await new Promise(resolve => {
    video.onloadedmetadata = resolve
  })

  // Capture frame to canvas
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0)

  // Stop camera
  stream.getTracks().forEach(track => track.stop())

  // Convert canvas to Blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.85)
  })

  // Compress if needed
  const file = new File([blob], `photo-${Date.now()}.webp`, {
    type: 'image/webp',
  })

  if (options.compress) {
    return compressImage(file)
  }

  return file
}
```

#### Alternative: HTML File Input with Camera

```typescript
// Simpler approach - use file input with capture attribute
<input
  type="file"
  accept="image/*"
  capture="environment" // Opens camera directly on mobile
  onChange={handleImageUpload}
/>
```

**Recommendation:** Use `<input capture>` for MVP (simpler), add MediaDevices API in Sprint 13 for advanced features (preview, filters).

---

### 5. Image Optimization & Compression

#### Browser-Side Compression Library

**Recommended: `browser-image-compression`**

**Installation:**
```bash
npm install browser-image-compression
```

**Features:**
- ✅ JPEG, PNG, WebP, BMP support
- ✅ Multi-threaded (Web Worker) compression
- ✅ Non-blocking (doesn't freeze UI)
- ✅ TypeScript support
- ✅ Auto-rotation (EXIF orientation)
- ✅ 60-80% size reduction

**Configuration:**
```typescript
import imageCompression from 'browser-image-compression'

const compressionOptions = {
  maxSizeMB: 1, // Max file size after compression
  maxWidthOrHeight: 1920, // Max dimension
  useWebWorker: true, // Non-blocking
  fileType: 'image/webp', // Convert to WebP (best compression)
  initialQuality: 0.85, // Quality (0-1)
  alwaysKeepResolution: false, // Allow downscaling
  exifOrientation: true, // Auto-rotate based on EXIF
}

async function optimizeImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, compressionOptions)
    console.log(`Compressed: ${file.size} → ${compressed.size} (${Math.round((1 - compressed.size / file.size) * 100)}% reduction)`)
    return compressed
  } catch (error) {
    console.error('Compression failed:', error)
    return file // Fallback to original
  }
}
```

**Performance Impact:**
- Compression time: ~200-500ms for 5MB image
- Size reduction: 60-80% for photos (JPEG/PNG → WebP)
- Upload time savings: 70% (e.g., 10s → 3s on 3G)

**Bundle Size Impact:**
- `browser-image-compression`: ~25KB gzipped
- **Total Sprint 12 bundle increase:** ~40KB gzipped (Image ext + Resize ext + Compression)

---

## 🎨 UX Design Patterns

### 1. Image Upload Methods

#### Method 1: Toolbar Button (Primary)
```
┌─────────────────────────────────────┐
│ [B] [I] [H1] [H2] [Link] [📷 Image]│ ← Toolbar
└─────────────────────────────────────┘
```
**Behavior:**
- Click → Open file picker
- Accepts: JPG, PNG, GIF, WebP, SVG
- Max size: 10MB per image

#### Method 2: Drag & Drop (Power Users)
```
┌─────────────────────────────────────┐
│ Lorem ipsum dolor sit amet...       │
│                                     │
│ [Drop image here to upload] ← Overlay
│                                     │
└─────────────────────────────────────┘
```
**Behavior:**
- Drag file over editor → Show overlay
- Drop → Upload and insert at cursor position
- Multiple files → Insert sequentially

#### Method 3: Paste (Clipboard)
```
Ctrl+V / Cmd+V → Detect image in clipboard
```
**Behavior:**
- Paste screenshot → Auto-upload
- Paste copied image from web → Download then upload
- Paste image file → Same as file picker

#### Method 4: Mobile Camera (Mobile Only)
```
┌─────────────────────────────────────┐
│ [📷 Take Photo] [📁 Choose File]    │ ← Mobile toolbar
└─────────────────────────────────────┘
```
**Behavior:**
- Take Photo → Open camera app
- Choose File → Open gallery picker

---

### 2. Image Resizing UI

**Desktop: Drag Handles**
```
┌─────────────────────────────┐
│ [●]              Image      [●]  ← Corner handles (8 total)
│                             │
│                             │
│ [●]                        [●]
└─────────────────────────────┘
```
**Behavior:**
- Click image → Show handles
- Drag corner → Resize (maintain aspect ratio)
- Shift+Drag → Free resize (no aspect lock)
- Double-click → Reset to original size

**Mobile: Pinch-to-Zoom**
```
Tap image → Select (show resize handles)
Pinch gesture → Resize
```

**Width Input (Advanced)**
```
┌────────────────────────────┐
│ Width: [____] px [v]       │ ← Dropdown: px, %, auto
└────────────────────────────┘
```

---

### 3. Alt Text & Captions

**Alt Text Dialog (Immediate Prompt After Upload)**
```
┌─────────────────────────────────────┐
│ Add Alt Text (Required)             │
│ ────────────────────────────────── │
│ [___________________________]       │
│ e.g., "Product screenshot showing   │
│ the dashboard with analytics"       │
│                                     │
│ [Skip for now]    [Save Alt Text]  │
└─────────────────────────────────────┘
```
**Behavior:**
- Appears immediately after upload completes
- Cannot dismiss without entering text or clicking "Skip"
- Saved alt text shows in tooltip on hover

**Edit Alt Text (After Upload)**
```
Click image → Show context menu
├─ Edit Alt Text
├─ Replace Image
├─ Align Left/Center/Right
└─ Delete Image
```

**Caption (Optional, Future Sprint)**
```
┌─────────────────────────────┐
│       [Image here]          │
│                             │
│ Caption: This is a demo     │ ← Editable caption below image
└─────────────────────────────┘
```

---

### 4. Upload Progress Indicators

**Small Image (<1MB): Instant**
```
[Image placeholder] → [Actual image] (instant)
```

**Large Image (>1MB): Progress Bar**
```
┌─────────────────────────────┐
│ [██████████░░░░░░] 60%      │ ← Progress bar
│ Uploading dashboard.png...  │
└─────────────────────────────┘
```

**Offline: Pending Indicator**
```
┌─────────────────────────────┐
│       [Image here]          │
│ ⚠️ Pending upload (offline) │ ← Warning badge
└─────────────────────────────┘
```

---

### 5. Error Handling

**File Too Large (>10MB)**
```
❌ File too large (15.3MB)
   Maximum allowed: 10MB
   [Compress & Upload] [Cancel]
```

**Unsupported Format**
```
❌ Unsupported format (.bmp)
   Supported: JPG, PNG, GIF, WebP, SVG
   [Choose Another File]
```

**Upload Failed (Network Error)**
```
❌ Upload failed (network error)
   [Retry] [Discard]
```

**Missing Alt Text Warning**
```
⚠️ Missing alt text (accessibility issue)
   [Add Alt Text]
```

---

## 🔒 Security Considerations

### 1. Image Sanitization

**XSS Prevention:**
```typescript
// Validate image MIME type (server-side verification)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml', // ⚠️ SVG requires additional sanitization
]

function isValidImageType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type)
}

// Sanitize SVG (remove scripts)
import DOMPurify from 'dompurify'

function sanitizeSVG(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true },
  })
}
```

**SVG Security:**
- ⚠️ SVG files can contain `<script>` tags (XSS risk)
- **Solution:** Run SVG through DOMPurify before rendering
- **Alternative:** Disable SVG support in MVP (add in Sprint 13)

**Recommendation for Sprint 12:**
- **Disable SVG support** in MVP (reduce attack surface)
- Only support raster formats: JPG, PNG, GIF, WebP
- Add SVG in Sprint 13 with proper sanitization

---

### 2. File Size Limits

**Client-Side Validation:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validateFileSize(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB`)
    return false
  }
  return true
}
```

**Why 10MB:**
- Reasonable for high-quality photos
- Prevents abuse (user uploading videos disguised as images)
- Compression reduces to ~1-2MB after WebP conversion

---

### 3. CORS & Content Security Policy

**CSP Headers (for Netlify deployment):**
```html
<!-- netlify.toml -->
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      img-src 'self' data: blob: https://drive.google.com https://lh3.googleusercontent.com;
      connect-src 'self' https://www.googleapis.com https://accounts.google.com;
    """
```

**Allow Google Drive image sources:**
- `https://drive.google.com` (thumbnail API)
- `https://lh3.googleusercontent.com` (user profile pictures)
- `data:` (base64 images for offline)
- `blob:` (IndexedDB cached images)

---

## ♿ Accessibility Requirements (WCAG 2.1)

### Success Criterion 1.1.1: Non-text Content (Level A)

**Requirement:** All images must have meaningful alternative text.

**Implementation:**
```typescript
// Enforce alt text on upload
async function uploadImage(file: File): Promise<void> {
  const driveFile = await uploadImageToDrive(file, file.name)

  // Prompt for alt text immediately
  const altText = await promptForAltText()

  if (!altText || altText.trim() === '') {
    // Show warning but allow skip
    const shouldSkip = confirm('Missing alt text. This reduces accessibility. Continue anyway?')
    if (!shouldSkip) {
      return // Cancel upload
    }
  }

  // Insert image with alt text
  editor.chain().focus().setImage({
    src: `drive://${driveFile.id}`,
    alt: altText || 'Image', // Fallback to generic alt
  }).run()
}
```

**Alt Text Best Practices:**
- **Concise:** <100 characters
- **Descriptive:** What's in the image, not "image of"
- **Context-aware:** Purpose of image in document
- **Decorative images:** Use empty alt (`alt=""`) if purely decorative

**Example:**
```markdown
✅ Good: ![Product dashboard showing analytics charts and user metrics](drive://abc123)
❌ Bad: ![Image](drive://abc123)
❌ Bad: ![Screenshot of dashboard](drive://abc123) ← Too generic
```

**Screen Reader Testing:**
- Test with VoiceOver (macOS/iOS)
- Test with NVDA (Windows)
- Test with TalkBack (Android)

---

### Success Criterion 2.1.1: Keyboard Accessible (Level A)

**Requirement:** All image functionality must be keyboard-accessible.

**Implementation:**
- Tab → Focus image
- Enter → Open context menu (Edit Alt Text, Replace, Delete)
- Arrow keys → Navigate between images
- Delete → Remove image (with confirmation)

**Context Menu (Keyboard):**
```
Image selected → Press Enter
├─ "E" → Edit Alt Text
├─ "R" → Replace Image
├─ "A" → Align (Left/Center/Right)
└─ "Delete" → Delete Image
```

---

## 📊 Performance Optimization

### 1. Lazy Loading Images

**Native Lazy Loading:**
```typescript
Image.configure({
  HTMLAttributes: {
    loading: 'lazy', // Native browser lazy loading
    decoding: 'async', // Non-blocking decode
  },
})
```

**Benefits:**
- Images below fold not loaded until scrolled
- Reduces initial page load time
- No JavaScript required (native browser feature)

**Browser Support:**
- Chrome 77+ (2019)
- Firefox 75+ (2020)
- Safari 15.4+ (2022)
- **Coverage:** 95% of users (2025)

---

### 2. Responsive Images (srcset)

**For Retina Displays:**
```markdown
![Alt](drive://abc123 "title")

<!-- Renders as: -->
<img
  src="https://drive.google.com/thumbnail?id=abc123&sz=w800"
  srcset="
    https://drive.google.com/thumbnail?id=abc123&sz=w800 1x,
    https://drive.google.com/thumbnail?id=abc123&sz=w1600 2x
  "
  alt="Alt"
  title="title"
  loading="lazy"
/>
```

**Benefits:**
- Serve 2x resolution for Retina displays
- Save bandwidth for low-DPI screens
- Drive API supports size parameter (`sz=w800`, `sz=w1600`)

---

### 3. Thumbnail Caching Strategy

**Cache Hierarchy:**
```
1. IndexedDB (offline cache) → Instant (0ms)
2. Browser Cache (HTTP cache) → Fast (50-100ms)
3. Drive API (network fetch) → Slow (500-2000ms)
```

**Cache-Control Headers:**
```typescript
// When fetching from Drive API
const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
fetch(thumbnailUrl, {
  headers: {
    'Cache-Control': 'max-age=86400', // Cache for 24 hours
  },
})
```

**IndexedDB Cache:**
- Store thumbnails for offline access
- Cleanup policy: Delete after 30 days
- Max cache size: 100MB (auto-purge oldest)

---

### 4. Bundle Size Impact Analysis

**Sprint 12 Dependencies:**

| Package | Size (gzipped) | Purpose |
|---------|----------------|---------|
| `@tiptap/extension-image` | ~3KB | Base image support |
| `tiptap-extension-resize-image` | ~8KB | Resize handles |
| `browser-image-compression` | ~25KB | WebP compression |
| `dompurify` (if SVG support) | ~20KB | SVG sanitization |
| **Total Impact** | **~36KB** | (56KB with SVG) |

**Comparison:**
- Current RiteMark bundle: ~120KB gzipped
- After Sprint 12: ~156KB gzipped
- **Increase:** 30% (acceptable for image support)

**Optimization Options (Future):**
- Lazy load compression library (load only when needed)
- Tree-shake DOMPurify if SVG disabled
- Use dynamic imports for camera features

---

## 🧪 Testing Strategy

### 1. Unit Tests (Vitest + React Testing Library)

**Test File:** `/tests/components/ImageUpload.test.tsx`

**Test Cases:**
```typescript
describe('Image Upload', () => {
  it('should open file picker when image button clicked', async () => {
    const { getByRole } = render(<Editor />)
    const imageButton = getByRole('button', { name: /image/i })

    await userEvent.click(imageButton)

    expect(fileInputMock).toHaveBeenCalled()
  })

  it('should validate file size (max 10MB)', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    })

    const error = validateFileSize(largeFile)

    expect(error).toContain('File too large')
  })

  it('should compress image before upload', async () => {
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })

    const compressed = await compressImage(file)

    expect(compressed.type).toBe('image/webp')
    expect(compressed.size).toBeLessThan(file.size)
  })

  it('should prompt for alt text after upload', async () => {
    const { getByRole, getByLabelText } = render(<Editor />)

    await uploadImage(mockFile)

    expect(getByLabelText(/alt text/i)).toBeInTheDocument()
  })

  it('should insert image with drive:// URL', async () => {
    const editor = mockEditor()

    await uploadImage(mockFile, editor)

    expect(editor.chain().setImage).toHaveBeenCalledWith({
      src: 'drive://abc123',
      alt: 'Test image',
    })
  })
})
```

**Coverage Goal:** 80% line coverage for image upload logic

---

### 2. Integration Tests (Vitest + Mock Drive API)

**Test File:** `/tests/integration/ImageDriveSync.test.tsx`

**Test Cases:**
```typescript
describe('Image Drive Sync', () => {
  it('should upload image to Drive and get file ID', async () => {
    mockDriveAPI.uploadFile.mockResolvedValue({ id: 'abc123' })

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })
    const result = await uploadImageToDrive(file, 'test.jpg')

    expect(result.id).toBe('abc123')
    expect(mockDriveAPI.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: 'image/webp', // Compressed
      })
    )
  })

  it('should queue upload when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false })

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })
    await uploadImage(file)

    const queue = await getPendingUploads()
    expect(queue).toHaveLength(1)
    expect(queue[0].file.name).toBe('test.jpg')
  })

  it('should process upload queue when back online', async () => {
    await addPendingUpload(mockFile)

    // Simulate going online
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(mockDriveAPI.uploadFile).toHaveBeenCalled()
    })
  })
})
```

---

### 3. E2E Tests (Playwright - Future Sprint)

**Test File:** `/tests/e2e/image-upload.spec.ts`

**Test Cases:**
```typescript
test('should upload image via drag and drop', async ({ page }) => {
  await page.goto('http://localhost:5173')

  // Simulate drag and drop
  const fileInput = await page.locator('input[type="file"]')
  await fileInput.setInputFiles('tests/fixtures/test-image.jpg')

  // Wait for upload
  await page.waitForSelector('img[alt="test-image"]')

  // Verify image rendered
  const image = await page.locator('img[alt="test-image"]')
  expect(await image.getAttribute('src')).toContain('drive://')
})

test('should resize image with drag handles', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await uploadTestImage(page)

  // Click image to select
  await page.click('img[alt="test-image"]')

  // Drag resize handle
  const handle = await page.locator('.resize-handle-bottom-right')
  await handle.dragTo(handle, { targetPosition: { x: 100, y: 100 } })

  // Verify new width
  const image = await page.locator('img[alt="test-image"]')
  const width = await image.evaluate(el => el.offsetWidth)
  expect(width).toBeGreaterThan(0)
})
```

---

### 4. Mobile Testing (Manual + BrowserStack)

**Test Devices:**
- iPhone 15 Pro (iOS 18) - Safari
- Samsung Galaxy S24 (Android 15) - Chrome
- iPad Pro (iOS 18) - Safari

**Test Scenarios:**
- Camera upload (Take Photo button)
- Gallery picker (Choose File button)
- Pinch-to-zoom resize
- Offline image queue
- Alt text input on mobile keyboard

---

## 📋 Implementation Roadmap

### Phase 1: Core Image Upload (Sprint 12.1)
**Duration:** 3-5 days
**Deliverables:**
- ✅ TipTap Image extension integration
- ✅ File picker button in toolbar
- ✅ Drag-drop upload
- ✅ Google Drive multipart upload
- ✅ Basic alt text prompt
- ✅ Upload progress indicator

**Testing:**
- Unit tests for upload logic
- Integration tests with mock Drive API
- Manual browser testing

---

### Phase 2: Image Resizing (Sprint 12.2)
**Duration:** 2-3 days
**Deliverables:**
- ✅ `tiptap-extension-resize-image` integration
- ✅ Drag handles for desktop
- ✅ Pinch-to-zoom for mobile
- ✅ Width input (pixels/percentage)
- ✅ Aspect ratio locking

**Testing:**
- E2E tests for resize interactions
- Mobile device testing (BrowserStack)

---

### Phase 3: Offline & Performance (Sprint 12.3)
**Duration:** 2-3 days
**Deliverables:**
- ✅ IndexedDB image cache
- ✅ Offline upload queue
- ✅ Auto-retry logic
- ✅ Thumbnail caching
- ✅ `browser-image-compression` integration
- ✅ WebP compression

**Testing:**
- Offline simulation tests
- Performance benchmarks (Lighthouse)
- Network throttling tests (3G/4G)

---

### Phase 4: Mobile Camera (Sprint 12.4)
**Duration:** 2-3 days
**Deliverables:**
- ✅ "Take Photo" button (mobile only)
- ✅ `<input capture>` for camera access
- ✅ Photo preview before insert
- ✅ Auto-rotation correction (EXIF)

**Testing:**
- iOS Safari camera test
- Android Chrome camera test
- Camera permission handling

---

### Phase 5: Accessibility & Polish (Sprint 12.5)
**Duration:** 2-3 days
**Deliverables:**
- ✅ Alt text enforcement
- ✅ Keyboard navigation (Tab, Enter, Delete)
- ✅ Context menu (Edit Alt Text, Replace, Delete)
- ✅ Screen reader testing
- ✅ WCAG 2.1 compliance audit

**Testing:**
- Screen reader testing (VoiceOver, NVDA)
- Keyboard-only navigation test
- WCAG automated scan (axe DevTools)

---

### Total Sprint 12 Duration: 11-17 days
**Recommended:** Split into 2 sprints (12.1-12.3 in Sprint 12, 12.4-12.5 in Sprint 13)

---

## ⚠️ Risk Assessment

### High Priority Risks

**Risk 1: Large File Upload Performance**
- **Impact:** 10MB image takes 30s to upload on 3G (poor UX)
- **Mitigation:** Client-side WebP compression (reduces to 1-2MB)
- **Fallback:** Show "Upload may take a while on slow networks" warning

**Risk 2: IndexedDB Storage Quota Exceeded**
- **Impact:** Cannot cache images offline if quota full
- **Mitigation:** Auto-cleanup (delete cached images older than 30 days)
- **Fallback:** Prompt user to free up space or disable offline cache

**Risk 3: Drive API Rate Limits (403 errors)**
- **Impact:** Bulk image uploads may hit rate limit
- **Mitigation:** Exponential backoff retry (already implemented in DriveClient)
- **Fallback:** Queue uploads with 1s delay between each

---

### Medium Priority Risks

**Risk 4: Browser Compatibility (Safari quirks)**
- **Impact:** Safari has known issues with IndexedDB and Web Workers
- **Mitigation:** Polyfills for older Safari versions
- **Testing:** Extensive iOS Safari testing

**Risk 5: SVG XSS Vulnerabilities**
- **Impact:** Malicious SVG could execute scripts
- **Mitigation:** Disable SVG in MVP, add in Sprint 13 with DOMPurify
- **Security:** Require CSP header `script-src 'none'` for SVG rendering

---

### Low Priority Risks

**Risk 6: Image Format Incompatibility**
- **Impact:** User uploads HEIC (iPhone format), not supported
- **Mitigation:** Show "Unsupported format" error, suggest converting to JPG
- **Future:** Add HEIC → JPG conversion library (heic2any)

---

## 📚 Technical Documentation Requirements

### Developer Docs (To Be Created)

**File:** `/docs/components/ImageUpload.md`
**Contents:**
- Architecture overview (TipTap + Drive + IndexedDB)
- API reference (upload functions, compression options)
- Configuration guide (max file size, allowed formats)
- Troubleshooting (common issues and solutions)
- Code examples (basic upload, custom compression)

---

### User Guide (To Be Created)

**File:** `/docs/user-guide/images.md`
**Contents:**
- How to add images (button, drag-drop, paste, camera)
- How to resize images (drag handles, width input)
- How to add alt text (accessibility importance)
- How to edit/replace/delete images
- Offline image handling (pending uploads)
- Troubleshooting (file too large, unsupported format)

---

## 🔗 Related Resources

### TipTap Documentation
- [TipTap Image Extension](https://tiptap.dev/docs/editor/extensions/nodes/image)
- [TipTap Custom Extensions](https://tiptap.dev/docs/editor/extensions/custom-extensions)

### Google Drive API
- [Upload Files Guide](https://developers.google.com/drive/api/guides/manage-uploads)
- [Multipart Upload Reference](https://developers.google.com/drive/api/guides/manage-uploads#multipart)
- [Thumbnail API](https://developers.google.com/drive/api/guides/manage-thumbnails)

### Third-Party Libraries
- [browser-image-compression](https://www.npmjs.com/package/browser-image-compression)
- [tiptap-extension-resize-image](https://www.npmjs.com/package/tiptap-extension-resize-image)
- [DOMPurify (SVG sanitization)](https://github.com/cure53/DOMPurify)

### Accessibility Standards
- [WCAG 2.1: Images of Text](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text.html)
- [WebAIM: Alternative Text](https://webaim.org/techniques/alttext/)

### PWA Best Practices
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MediaDevices: getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

## ✅ Research Completion Checklist

- ✅ TipTap Image extension analyzed (v3.6.6, compatible with v3.4.3)
- ✅ Third-party resizing libraries evaluated (recommended: tiptap-extension-resize-image)
- ✅ Google Drive binary upload strategy defined (multipart with base64 encoding)
- ✅ Offline caching architecture designed (IndexedDB + thumbnail cache)
- ✅ Mobile camera integration researched (MediaDevices API + `<input capture>`)
- ✅ Image compression library selected (browser-image-compression, ~60-80% reduction)
- ✅ Accessibility requirements defined (WCAG 2.1, mandatory alt text)
- ✅ UX patterns documented (Notion-style drag-drop, resize handles)
- ✅ Security considerations addressed (XSS prevention, file size limits, CSP)
- ✅ Performance optimizations identified (lazy loading, srcset, cache hierarchy)
- ✅ Testing strategy outlined (unit, integration, E2E, mobile)
- ✅ Implementation roadmap created (5 phases, 11-17 days total)
- ✅ Risk assessment completed (3 high, 2 medium, 1 low priority risks)
- ✅ Bundle size impact analyzed (+36KB gzipped, 30% increase)

---

## 📞 Next Steps for Sprint 12 Planning

**Before Sprint 12 Implementation:**

1. **Review this research document** with project stakeholders
2. **Prioritize features** (MVP vs. nice-to-have)
3. **Decide on SVG support** (disable for MVP to reduce security risk?)
4. **Confirm bundle size increase** (36KB acceptable?)
5. **Allocate development time** (split into Sprint 12 + Sprint 13?)

**Recommended MVP Scope (Sprint 12):**
- ✅ File picker button + drag-drop upload
- ✅ Google Drive storage with drive:// URLs
- ✅ Basic resize handles (desktop)
- ✅ Alt text prompt
- ✅ WebP compression
- ✅ Offline upload queue

**Deferred to Sprint 13:**
- ⏸️ Mobile camera (Take Photo button)
- ⏸️ SVG support with DOMPurify sanitization
- ⏸️ Image captions (tiptap-image-plus)
- ⏸️ Advanced alignment (left/center/right/full-width)
- ⏸️ Lightbox preview (click to enlarge)

**Questions for User:**
1. Should we disable SVG support in MVP for security? (Recommended: Yes)
2. Is 36KB bundle increase acceptable? (30% increase)
3. Should we split into Sprint 12 (core) + Sprint 13 (mobile/advanced)?
4. What is the maximum acceptable file size? (Recommended: 10MB)
5. Should alt text be mandatory or optional? (Recommended: Prompt but allow skip)

---

**Sprint 12 Research Status:** ✅ COMPLETE
**Date Completed:** October 11, 2025
**Researcher:** Senior Research Analyst
**Ready for Planning:** YES

---

*This document serves as the technical specification for Sprint 12 implementation. All architectural decisions, trade-offs, and recommendations are based on 2025 best practices and RiteMark's "Google Docs for Markdown" vision.*