# Visual Assets Specification - Sprint 14 Landing Page

**Status:** 📋 Specification Complete
**Purpose:** Detailed requirements for designer/team to create landing page images
**Created:** October 21, 2025
**Delivery Deadline:** Before landing page HTML implementation (Phase 2)

---

## 📋 Executive Summary

Since AI agents cannot generate actual images, this document provides complete specifications for a designer or team member to create the 5 required visual assets for the Sprint 14 landing page.

**Key Requirements:**
- 5 images total (hero + 4 features)
- WebP format for optimal performance
- Strict file size limits (<80KB combined target: ~250KB)
- Responsive design (2x variants for retina displays)
- Placeholder strategy for MVP launch without images

---

## 🎯 Image Specifications Overview

| Image ID | Purpose | Dimensions | Max Size | Format | Priority |
|----------|---------|------------|----------|--------|----------|
| hero.webp | Hero section visual | 1200×800px | 80KB | WebP | Critical |
| feature1.webp | WYSIWYG editing demo | 600×400px | 50KB | WebP | High |
| feature2.webp | Google Drive integration | 600×400px | 40KB | WebP | High |
| feature3.webp | Markdown output comparison | 800×400px | 50KB | WebP | High |
| feature5.webp | Mobile responsive design | 600×500px | 50KB | WebP | Medium |

**Total Target Size:** <250KB for all images combined (gzipped)

---

## 1️⃣ Hero Visual (hero.webp)

### Specifications

**File Details:**
- **Filename:** `hero.webp`
- **Location:** `/public/assets/landing/hero.webp`
- **Dimensions:** 1200×800px (3:2 aspect ratio)
- **Max File Size:** 80KB (WebP 85% quality)
- **Alt Text:** "RiteMark WYSIWYG markdown editor interface"
- **Loading:** Eager (above the fold, no lazy loading)

### Content Requirements

**What to Show:**
- Full RiteMark editor interface (actual app screenshot)
- Sample document with formatted text visible:
  - Heading (e.g., "Meeting Notes - Q4 Planning")
  - Bold and italic text
  - Bullet list (2-3 items)
  - Numbered list (optional)
  - Blockquote (optional)
- Toolbar visible at top with formatting buttons
- Clean, professional document (avoid lorem ipsum)
- Cursor visible in editor to indicate active editing

**Visual Style:**
- Bright, clean interface (use actual app colors from `src/styles/`)
- Soft shadows for depth (match existing UI design)
- High contrast for readability
- Avoid cluttered UI (hide unnecessary panels/menus)
- Professional but approachable aesthetic

**Screenshot Instructions:**
1. Open RiteMark app at `localhost:5173/app`
2. Create sample document with formatted text
3. Resize browser window to 1200×800px
4. Take full-window screenshot (include toolbar, editor content)
5. Crop to remove browser chrome (keep only app interface)
6. Export as WebP 85% quality
7. Verify file size <80KB

### Responsive Variants

**Desktop (1200×800px):**
- Full editor interface with all features visible
- Toolbar with all formatting buttons
- Sufficient text content to demonstrate WYSIWYG editing

**Tablet (768×512px):** *(Optional for Sprint 14, plan for Sprint 15)*
- Slightly zoomed interface
- Toolbar may wrap to 2 rows
- Maintain readability

**Mobile (600×400px):** *(Optional for Sprint 14, use feature5.webp instead)*
- Focus on editor content area
- Toolbar condensed (hamburger menu)

### Technical Requirements

**Compression:**
- Use Squoosh or ImageOptim
- WebP format, 85% quality target
- If >80KB, reduce quality to 75% or crop less visible areas
- Fallback PNG (for browsers without WebP support): <120KB

**Color Accuracy:**
- Match app's existing color scheme
- Primary blue: `#3b82f6`
- Background: `#f9fafb`
- Text: `#111827`
- Use actual app colors (no mockups with wrong colors)

**Accessibility:**
- High contrast text (≥4.5:1 ratio)
- Alt text: "RiteMark WYSIWYG markdown editor interface"
- Descriptive filename: `hero.webp` (no generic names like `image1.webp`)

---

## 2️⃣ Feature 1: WYSIWYG Editing (feature1.webp)

### Specifications

**File Details:**
- **Filename:** `feature1.webp`
- **Location:** `/public/assets/landing/feature1.webp`
- **Dimensions:** 600×400px (3:2 aspect ratio)
- **Max File Size:** 50KB (WebP 80% quality)
- **Alt Text:** "Visual formatting with RiteMark toolbar"
- **Loading:** Lazy (below the fold)

### Content Requirements

**What to Show:**
- Animated GIF (converted to WebP) or screenshot showing:
  - User clicking toolbar buttons (Bold, Italic, Heading)
  - Text changing in real-time (before/after)
  - Toolbar highlighted when button clicked
- Focus on toolbar and immediate text area (not full editor)
- 2-3 second animation loop (if GIF)

**Visual Style:**
- Zoom in on toolbar (larger than full editor view)
- Highlight active formatting (e.g., bold button pressed, text turns bold)
- Use motion to demonstrate interactivity
- Show user's cursor clicking buttons

**Creation Instructions:**
1. Open RiteMark app
2. Type sample text: "The quick brown fox jumps over the lazy dog"
3. Record screen while:
   - Selecting "quick" and clicking Bold button
   - Selecting "brown fox" and clicking Italic button
   - Clicking at start of line, then Heading 2 button
4. Use QuickTime or OBS to record 3-5 seconds
5. Convert to GIF using Gifski or FFMPEG
6. Convert GIF to WebP animation using Squoosh
7. Optimize to <50KB

**Alternative (Static Screenshot):**
If animation exceeds 50KB, use static image showing:
- Toolbar at top
- Text with bold/italic/heading formatting visible
- Cursor hovering over Bold button
- Add subtle visual cue (e.g., glow) to indicate interactivity

### Technical Requirements

**Compression:**
- Animated WebP (if possible): <50KB, 10fps, 3-second loop
- Static WebP (fallback): <30KB, 85% quality
- Fallback PNG: <60KB

**Frame Rate:**
- If animated: 10-15 fps (sufficient for UI interaction)
- If static: N/A

**Accessibility:**
- Alt text: "Visual formatting with RiteMark toolbar"
- Avoid rapid flashing (accessibility seizure risk)
- Smooth transitions (no jarring cuts)

---

## 3️⃣ Feature 2: Google Drive Integration (feature2.webp)

### Specifications

**File Details:**
- **Filename:** `feature2.webp`
- **Location:** `/public/assets/landing/feature2.webp`
- **Dimensions:** 600×400px (3:2 aspect ratio)
- **Max File Size:** 40KB (WebP 80% quality)
- **Alt Text:** "Auto-save to Google Drive"
- **Loading:** Lazy (below the fold)

### Content Requirements

**What to Show:**
- RiteMark editor with auto-save indicator visible:
  - "Saved to Drive" message (green checkmark icon)
  - Timestamp: "Last saved: 2 minutes ago"
- Google Drive logo or icon visible (indicates integration)
- Sample document being edited (any formatted text)
- Status bar or notification area highlighted

**Visual Style:**
- Close-up of editor top-right corner (where save indicator appears)
- Subtle animation (optional): checkmark appearing after "Saving..."
- Green color for success indicator
- Professional, trustworthy aesthetic

**Creation Instructions:**
1. Open RiteMark app with Google Drive connected
2. Make an edit (type text)
3. Wait for auto-save to complete
4. Screenshot when "Saved to Drive" message appears
5. Crop to focus on save indicator and surrounding context
6. Ensure Google Drive logo/icon is visible
7. Export as WebP 80% quality

**Alternative (Mockup):**
If auto-save UI isn't implemented yet, create mockup showing:
- Editor interface (simplified)
- Notification: "✓ Saved to Drive - 2 minutes ago"
- Google Drive icon in corner
- Clean, minimal design

### Technical Requirements

**Compression:**
- WebP 80% quality: <40KB
- Fallback PNG: <60KB

**Branding:**
- Use official Google Drive colors (green/blue/yellow)
- Include Google Drive logo (proper usage per brand guidelines)
- Do NOT use unofficial logos or modified colors

**Accessibility:**
- Alt text: "Auto-save to Google Drive"
- High contrast for save status text
- Clear visual hierarchy (status message prominent)

---

## 4️⃣ Feature 3: Markdown Output (feature3.webp)

### Specifications

**File Details:**
- **Filename:** `feature3.webp`
- **Location:** `/public/assets/landing/feature3.webp`
- **Dimensions:** 800×400px (2:1 aspect ratio, wider for split-screen)
- **Max File Size:** 50KB (WebP 80% quality)
- **Alt Text:** "Visual editing to markdown conversion"
- **Loading:** Lazy (below the fold)

### Content Requirements

**What to Show:**
- Split-screen comparison (50/50 layout):
  - **Left side:** RiteMark WYSIWYG editor with formatted text
  - **Right side:** Raw markdown output of same content
- Same content visible on both sides:
  - Heading: "# Meeting Notes"
  - Bold text: "**Action Items**"
  - List: "- [ ] Task 1"
  - Link: "[Google](https://google.com)"
- Arrow or divider between panels (indicates conversion)

**Visual Style:**
- Clear visual separation (vertical line or gradient)
- Left side: bright, colorful (WYSIWYG)
- Right side: monospace font, code-like appearance
- Use syntax highlighting on markdown side (optional)
- Equal weight to both panels (50/50 split)

**Creation Instructions:**

**Option A (Real Screenshot):**
1. Open RiteMark app
2. Create document with formatted text (heading, bold, list, link)
3. Open browser DevTools to view markdown source
4. Take side-by-side screenshot using split-screen tool
5. Crop to 800×400px

**Option B (Mockup - Recommended):**
1. Design split-screen mockup in Figma or similar tool:
   - Left: WYSIWYG editor with formatted text
   - Right: Markdown code with syntax highlighting
2. Export as 800×400px PNG
3. Convert to WebP using Squoosh
4. Optimize to <50KB

**Sample Content:**
```
Left (WYSIWYG):              Right (Markdown):
─────────────────────────────────────────────
Meeting Notes                # Meeting Notes

Action Items:                **Action Items:**
□ Review Q4 goals            - [ ] Review Q4 goals
□ Update roadmap             - [ ] Update roadmap

Resources                    ## Resources
Google                       [Google](https://google.com)
```

### Technical Requirements

**Compression:**
- WebP 80% quality: <50KB
- Fallback PNG: <75KB

**Typography:**
- Left side: Sans-serif (match app font)
- Right side: Monospace (code font like Fira Code or Monaco)
- Font sizes readable at 800×400px (not too small)

**Accessibility:**
- Alt text: "Visual editing to markdown conversion"
- High contrast on markdown side (light background, dark text)
- Clear visual separation between panels

---

## 5️⃣ Feature 5: Mobile Responsive Design (feature5.webp)

### Specifications

**File Details:**
- **Filename:** `feature5.webp`
- **Location:** `/public/assets/landing/feature5.webp`
- **Dimensions:** 600×500px (6:5 aspect ratio, slight portrait)
- **Max File Size:** 50KB (WebP 80% quality)
- **Alt Text:** "RiteMark responsive design on mobile and desktop"
- **Loading:** Lazy (below the fold)

### Content Requirements

**What to Show:**
- Side-by-side mockup:
  - **Left (40%):** iPhone showing RiteMark mobile interface
  - **Right (60%):** Desktop/laptop showing RiteMark desktop interface
- Same document visible on both devices (indicates sync)
- Mobile shows touch-optimized toolbar
- Desktop shows full toolbar with all buttons
- Devices at slight angle (3D perspective) for visual interest

**Visual Style:**
- Clean, modern mockup (not actual photos of devices)
- Use device frames (iPhone, MacBook) from mockup libraries
- White/light background for mockup
- Subtle shadows for depth
- Professional presentation (not amateur/cluttered)

**Creation Instructions:**

**Option A (Use Mockup Generator):**
1. Use Mockuuups, Placeit, or similar tool
2. Upload RiteMark screenshots (mobile + desktop)
3. Select iPhone + MacBook mockup template
4. Position side-by-side with slight rotation
5. Export as PNG, convert to WebP
6. Optimize to <50KB

**Option B (Manual Composition in Figma):**
1. Find device mockup templates (iPhone 14, MacBook Pro)
2. Take screenshots of RiteMark at mobile (375px) and desktop (1440px) widths
3. Composite screenshots into device frames
4. Arrange side-by-side with 40/60 split
5. Add subtle shadow and background
6. Export as WebP

**Sample Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐         ┌──────────────┐   │
│  │ 📱 │         │  💻 Desktop  │   │
│  │ Ph │         │              │   │
│  │ on │         │   RiteMark   │   │
│  │ e  │         │   Editor     │   │
│  └────┘         └──────────────┘   │
│ Mobile            Desktop           │
└─────────────────────────────────────┘
```

### Technical Requirements

**Compression:**
- WebP 80% quality: <50KB
- Fallback PNG: <75KB

**Device Selection:**
- Mobile: iPhone 14 Pro or similar modern device (avoid outdated models)
- Desktop: MacBook Pro or generic laptop (avoid Windows-specific designs)
- Use neutral/professional device colors (Space Gray, Silver)

**Accessibility:**
- Alt text: "RiteMark responsive design on mobile and desktop"
- Clear visibility of both devices
- Sufficient contrast for device screens

---

## 📦 Placeholder Strategy (MVP Launch Without Images)

If images are not ready by deployment, use this placeholder approach to maintain layout and load instantly (<1s FCP).

### HTML Placeholder Implementation

```html
<!-- Hero Image Placeholder -->
<div class="hero-image-placeholder" role="img" aria-label="RiteMark editor interface (image loading)">
  <div class="placeholder-content">
    <svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
    <p>RiteMark Editor Preview</p>
  </div>
</div>

<!-- Feature Image Placeholder -->
<div class="feature-image-placeholder" role="img" aria-label="Feature demonstration (image loading)">
  <div class="placeholder-content">
    <svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="9" y1="9" x2="15" y2="9"></line>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
    <p>Feature Demo</p>
  </div>
</div>
```

### CSS Placeholder Styling

```css
/* Hero Placeholder (1200×800px) */
.hero-image-placeholder {
  width: 100%;
  max-width: 1200px;
  aspect-ratio: 3 / 2;
  background: linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%);
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero-image-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to { left: 100%; }
}

.placeholder-content {
  text-align: center;
  color: #6b7280;
  z-index: 1;
}

.placeholder-icon {
  color: #9ca3af;
  margin-bottom: 8px;
}

.placeholder-content p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* Feature Placeholder (600×400px) */
.feature-image-placeholder {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 3 / 2;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive */
@media (max-width: 640px) {
  .hero-image-placeholder {
    aspect-ratio: 4 / 3;
  }
}
```

### JavaScript Progressive Enhancement

```javascript
// Load real images after page load (progressive enhancement)
document.addEventListener('DOMContentLoaded', () => {
  const placeholders = document.querySelectorAll('.hero-image-placeholder, .feature-image-placeholder');

  placeholders.forEach(placeholder => {
    const imgSrc = placeholder.dataset.src;
    if (imgSrc) {
      const img = new Image();
      img.onload = () => {
        placeholder.style.backgroundImage = `url(${imgSrc})`;
        placeholder.classList.add('loaded');
      };
      img.src = imgSrc;
    }
  });
});
```

### Benefits of Placeholder Strategy

✅ **Instant Load:** Placeholders render immediately (<50ms)
✅ **Layout Stability:** No CLS (Cumulative Layout Shift) when images load
✅ **Graceful Degradation:** Works without images (no broken layout)
✅ **Progressive Enhancement:** Real images replace placeholders when ready
✅ **Professional Appearance:** Clean gray boxes better than broken image icons

### Deployment Timeline

**Phase 1 (MVP Launch):** Deploy with placeholders
**Phase 2 (1-3 days later):** Replace with real images (no layout changes needed)

---

## 🛠️ Image Optimization Tools

### Recommended Tools

**Compression:**
1. **Squoosh** (https://squoosh.app) - Best for WebP conversion
2. **ImageOptim** (macOS) - Batch optimization
3. **TinyPNG** (https://tinypng.com) - PNG fallbacks
4. **FFMPEG** (CLI) - GIF to WebP conversion

**Mockup Generators:**
1. **Mockuuups** (https://mockuuups.com) - Device mockups
2. **Placeit** (https://placeit.net) - Mockup templates
3. **Figma** (free tier) - Custom mockups

**Screenshot Tools:**
1. **CleanShot X** (macOS) - Advanced screenshots
2. **Snagit** (Windows/macOS) - Screen recording
3. **OBS Studio** (free) - Screen recording for GIFs

### Compression Workflow

**Step 1: Create Image**
- Use design tool or take screenshot
- Export as PNG (highest quality)

**Step 2: Optimize**
```bash
# Convert PNG to WebP using FFMPEG
ffmpeg -i hero.png -c:v libwebp -quality 85 hero.webp

# Or use Squoosh web interface (drag & drop)
```

**Step 3: Verify File Size**
```bash
ls -lh hero.webp
# Should show <80KB for hero, <50KB for features
```

**Step 4: Test Quality**
- Open in browser at actual size (e.g., 1200×800px for hero)
- Verify no visible compression artifacts
- Check text readability

**Step 5: Create Fallback**
```bash
# Create PNG fallback for older browsers
ffmpeg -i hero.webp hero.png
```

---

## ✅ Quality Checklist

Before delivering images, verify ALL of these:

### File Requirements
- [ ] All 5 images created (hero + 4 features)
- [ ] WebP format for all images
- [ ] File sizes within limits (hero <80KB, features <50KB each)
- [ ] Fallback PNG versions created (for browser compatibility)
- [ ] Filenames match spec exactly (hero.webp, feature1.webp, etc.)

### Visual Quality
- [ ] High resolution at target dimensions (no pixelation)
- [ ] Text readable at actual size (not blurry)
- [ ] Colors match app design system (blue #3b82f6, etc.)
- [ ] Consistent visual style across all images
- [ ] Professional appearance (no amateur/cluttered design)

### Content Accuracy
- [ ] Hero shows actual RiteMark editor interface
- [ ] Feature images demonstrate correct functionality
- [ ] No placeholder/lorem ipsum text in screenshots
- [ ] Google Drive branding correct (official logo/colors)
- [ ] Markdown syntax accurate in feature3.webp

### Accessibility
- [ ] Alt text provided for each image
- [ ] High contrast (≥4.5:1 ratio for text)
- [ ] No rapid flashing (if animated)
- [ ] Descriptive filenames (not image1.webp, image2.webp)

### Technical
- [ ] Aspect ratios correct (3:2 for hero, etc.)
- [ ] Responsive variants created (if needed)
- [ ] Images optimized (WebP 80-85% quality)
- [ ] No metadata/EXIF data (privacy concern)
- [ ] Files named consistently (lowercase, no spaces)

---

## 📋 Delivery Instructions

### For Designer/Team Member:

**What to Deliver:**
1. 5 WebP images (hero.webp, feature1.webp, feature2.webp, feature3.webp, feature5.webp)
2. 5 PNG fallbacks (hero.png, feature1.png, etc.)
3. Source files (PSD, Figma, etc.) for future edits
4. Brief notes on any design decisions or variations

**Where to Deliver:**
- Place images in `/public/assets/landing/` folder
- Commit to Git or send via secure file transfer
- Notify team when images are ready for integration

**Timeline:**
- Target: 24-48 hours after receiving this spec
- MVP launch can proceed with placeholders if images delayed

### For Developer Integrating Images:

**Integration Steps:**
1. Receive images from designer
2. Verify file sizes and dimensions
3. Place in `/public/assets/landing/` folder
4. Update `landing.html` to replace placeholders:

```html
<!-- Before (placeholder) -->
<div class="hero-image-placeholder" role="img">...</div>

<!-- After (real image) -->
<img src="/assets/landing/hero.webp" alt="RiteMark WYSIWYG editor interface" loading="eager" width="1200" height="800">
```

5. Test loading performance (Lighthouse audit)
6. Deploy to production

---

## 🎯 Success Criteria

**Sprint 14 visual assets are COMPLETE when:**

✅ All 5 images created and optimized
✅ Total file size <250KB (all images combined)
✅ Lighthouse Performance score >95 (images don't slow page)
✅ Images render correctly on mobile and desktop
✅ Alt text added for accessibility
✅ Fallback PNG versions available

**Fallback Success (if images delayed):**

✅ Placeholders implemented with shimmer animation
✅ Layout stable (no CLS when real images load later)
✅ Page loads <1 second without images
✅ Professional appearance maintained

---

## 📚 References

**Research Documents:**
- `/docs/sprints/sprint-14/landing-page-implementation-plan.md` - Full implementation plan
- `/docs/research/landing-page/landing-page-master-plan.md` - Design decisions

**Design System:**
- `/public/privacy.html` - Existing color scheme and typography
- `/src/styles/` - App CSS for color matching

**Tools:**
- Squoosh: https://squoosh.app
- Mockuuups: https://mockuuups.com
- WebP Guide: https://developers.google.com/speed/webp

---

**Created by:** Research Agent (Sprint 14 Swarm)
**Last Updated:** October 21, 2025
**Status:** 📋 Ready for Designer Assignment
