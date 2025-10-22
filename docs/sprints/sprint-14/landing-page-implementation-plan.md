# Landing Page Implementation Plan - Sprint 14

**Status:** 📋 Ready for Implementation
**Research Foundation:** 60+ pages, 4 parallel agents, comprehensive analysis
**Decision:** Option A - Separate Static Landing Page (unanimous recommendation)

---

## 📋 Executive Summary

**THE GOAL**: Build a static landing page at `ritemark.app/` that converts visitors to app users.

**THE APPROACH**: Separate static HTML file (landing.html) with zero build complexity.

**THE TIMELINE**: 2-3 days (18 hours) from start to production deployment.

**THE OUTCOME**: <1s load time, >95 Lighthouse score, 2% conversion rate target.

---

## 🎯 Content Strategy (Production-Ready Copy)

### Hero Section

**Headline (FINAL - Option 1)**:
```
Markdown Editor for People Who Hate Markdown
```
**Score:** 10/10 memorability, 10/10 clarity, humorous positioning

**Alternative Headlines** (if A/B testing in Sprint 15):
- Option 2: "Edit Like Google Docs, Export Like a Developer" (9/10)
- Option 3: "Write Visually. Export Markdown." (8/10)

**Subheadline**:
```
Edit documents like Google Docs. Collaborate in real-time. Export clean markdown for AI tools, GitHub, and developer workflows.
```
**Word count:** 20 words, anchors with "Google Docs" mental model

**Dual CTAs**:
- **Primary CTA**: "Start Writing Free" (blue button, prominent)
  - Links to: `/app`
  - Button style: `bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg`
- **Secondary CTA**: "See How It Works" (outline button)
  - Links to: `#demo` (scroll to demo video section)
  - Button style: `border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg`

---

### 5 Feature Cards (Bento-Box Grid)

**Layout**: 3-column grid on desktop, 1-column on mobile

**Feature 1: WYSIWYG Editing**
- **Icon**: ✏️ Pencil icon (Lucide `Edit` or similar)
- **Headline**: "Edit Like Google Docs"
- **Description**:
  ```
  No raw markdown syntax. No learning curve. Format text, add headings, create lists—just like any modern editor. Your content looks the same while editing as it does when published.
  ```
- **Visual**: GIF showing toolbar formatting (bold, italic, headings)

**Feature 2: Google Drive Integration**
- **Icon**: ☁️ Cloud icon (Lucide `Cloud` or `HardDrive`)
- **Headline**: "Cloud-Native File Management"
- **Description**:
  ```
  Auto-save to your Google Drive. Access from any device. Your files stay in your Drive—we never see your content. Works offline with IndexedDB caching for reliability.
  ```
- **Visual**: Screenshot of auto-save indicator

**Feature 3: Markdown Output**
- **Icon**: 📝 Code icon (Lucide `Code` or `Download`)
- **Headline**: "AI-Ready Markdown Export"
- **Description**:
  ```
  Export clean markdown for ChatGPT, Claude, GitHub, dev docs, and technical workflows—without touching syntax. Perfect for AI-native workflows and developer collaboration.
  ```
- **Visual**: Split-screen comparison (visual editor → markdown output)

**Feature 4: Real-Time Collaboration** *(Coming Soon badge)*
- **Icon**: 👥 Users icon (Lucide `Users`)
- **Headline**: "Work Together in Real-Time"
- **Description**:
  ```
  See teammates' cursors and edits instantly. Comment, suggest, and co-author—like Google Docs for markdown. Built with Y.js CRDT for conflict-free collaboration.
  ```
- **Visual**: GIF of two cursors editing (or placeholder mockup)
- **Badge**: "Coming in Sprint 15+" (small gray badge in corner)

**Feature 5: Mobile-First Design**
- **Icon**: 📱 Mobile icon (Lucide `Smartphone` or `Tablet`)
- **Headline**: "Write Anywhere, Anytime"
- **Description**:
  ```
  Optimized for touch and mobile workflows. Write on your phone, edit on desktop—seamless sync via Google Drive. PWA support for offline editing.
  ```
- **Visual**: Responsive design mockup (phone + desktop side-by-side)

---

### FAQ Section (5 Questions)

**FAQ 1: What is RiteMark?**
```
RiteMark is a WYSIWYG markdown editor for people who hate markdown syntax. Edit documents like Google Docs, collaborate in real-time, and export clean markdown for AI tools, GitHub, and developer workflows. No learning curve required—just write visually.
```

**FAQ 2: Is my data secure?**
```
Yes. RiteMark uses Google OAuth for authentication and stores your documents in your own Google Drive. We only access files you create or open with RiteMark—we never see your other Drive files. Your content stays private and encrypted.
```

**FAQ 3: Is RiteMark free?**
```
Yes. RiteMark is free and open-source software. Your documents are stored in your Google Drive (15 GB free tier, or upgrade to Google One for more storage). No hidden fees, no premium tiers.
```

**FAQ 4: Do I need to know markdown?**
```
No! RiteMark is designed for non-technical users. You edit visually (like Google Docs), and RiteMark handles the markdown conversion behind the scenes. The only time you see markdown is when you export.
```

**FAQ 5: How is RiteMark different from Notion or Google Docs?**
```
vs Notion: RiteMark exports clean markdown (Notion uses proprietary format). Your files stay in your Google Drive (Notion stores in their cloud).

vs Google Docs: RiteMark outputs markdown (Google Docs exports .docx). RiteMark is optimized for AI tools, GitHub, and developer workflows—not for printing documents.
```

---

## 🏗️ Technical Implementation

### File Structure

```
ritemark.app/
├── public/
│   ├── landing.html          ← NEW FILE (this sprint)
│   ├── landing.css            ← NEW FILE (external stylesheet)
│   ├── landing.js             ← NEW FILE (minimal interactivity)
│   ├── index.html             ← Existing (React app entry point)
│   ├── privacy.html           ← Existing (reference for design)
│   ├── terms.html             ← Existing (reference for design)
│   └── assets/
│       └── landing/           ← NEW FOLDER
│           ├── hero.webp      ← Hero visual
│           ├── feature1.webp  ← WYSIWYG editing GIF/screenshot
│           ├── feature2.webp  ← Google Drive screenshot
│           ├── feature3.webp  ← Markdown export comparison
│           └── feature5.webp  ← Mobile mockup
├── netlify.toml               ← UPDATE (add routing rules)
└── sitemap.xml                ← NEW FILE (SEO)
```

### Netlify Routing Configuration

**File:** `netlify.toml`

```toml
# Landing page at root
[[redirects]]
  from = "/"
  to = "/landing.html"
  status = 200

# React app at /app
[[redirects]]
  from = "/app/*"
  to = "/index.html"
  status = 200

# Catch-all for React app routing (fallback)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Why `/app` instead of `/editor`?**
- Industry standard (Notion, Figma, Linear use `/app`)
- Clearer for users (avoids "editing what?" confusion)
- Shorter URL (better for sharing)

---

### HTML Structure (landing.html)

**Template Base:** Use existing `privacy.html` as design system reference

**Semantic Structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO Meta Tags -->
  <title>RiteMark - Markdown Editor for People Who Hate Markdown</title>
  <meta name="description" content="Edit documents like Google Docs. Collaborate in real-time. Export clean markdown for AI tools, GitHub, and developer workflows. No syntax required.">

  <!-- Open Graph -->
  <meta property="og:title" content="RiteMark - Markdown Editor for People Who Hate Markdown">
  <meta property="og:description" content="Edit like Google Docs, export markdown for AI tools and GitHub. No learning curve.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://ritemark.app">
  <meta property="og:image" content="https://ritemark.app/assets/landing/og-image.png">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="RiteMark - Markdown Editor for People Who Hate Markdown">
  <meta name="twitter:description" content="Edit like Google Docs, export markdown for AI tools and GitHub.">

  <!-- Fonts (system font stack) -->
  <style>
    /* Inline Critical CSS (above-the-fold) */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 0;
      background: #f9fafb;
      color: #111827;
    }
    /* Hero section critical styles... */
  </style>

  <!-- External CSS (non-critical, defer loading) -->
  <link rel="stylesheet" href="/landing.css" media="print" onload="this.media='all'">

  <!-- Schema.org Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RiteMark",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "operatingSystem": "Web, iOS, Android"
  }
  </script>
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <h1>Markdown Editor for People Who Hate Markdown</h1>
    <p>Edit documents like Google Docs. Collaborate in real-time. Export clean markdown for AI tools, GitHub, and developer workflows.</p>
    <div class="cta-buttons">
      <a href="/app" class="btn-primary">Start Writing Free</a>
      <a href="#demo" class="btn-secondary">See How It Works</a>
    </div>
    <img src="/assets/landing/hero.webp" alt="RiteMark WYSIWYG editor interface" loading="eager">
  </section>

  <!-- Features Section (Bento-Box Grid) -->
  <section class="features">
    <div class="feature-grid">
      <!-- Feature cards from content strategy above -->
    </div>
  </section>

  <!-- Demo Video Section (optional, if video ready) -->
  <section id="demo" class="demo">
    <h2>See RiteMark in Action</h2>
    <!-- Video or carousel -->
  </section>

  <!-- FAQ Section -->
  <section class="faq">
    <h2>Frequently Asked Questions</h2>
    <!-- Accordion with 5 questions -->
  </section>

  <!-- Footer -->
  <footer>
    <nav>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="https://github.com/yourusername/ritemark">GitHub</a>
      <a href="mailto:hello@ritemark.app">Contact</a>
    </nav>
    <p>&copy; 2025 RiteMark. Open-source software.</p>
  </footer>

  <!-- Minimal JavaScript (deferred) -->
  <script src="/landing.js" defer></script>
</body>
</html>
```

---

### CSS Design System

**Color Palette** (match existing app):

```css
:root {
  /* Primary Colors */
  --primary: #3b82f6;           /* Teal/blue - Trust, technology */
  --primary-hover: #2563eb;     /* Darker blue on hover */
  --accent: #f59e0b;            /* Warm orange - Approachable */

  /* Neutral Colors */
  --background: #f9fafb;        /* Off-white - Reduces eye strain */
  --surface: #ffffff;           /* Pure white - Cards */
  --text-primary: #111827;      /* Dark gray - High readability */
  --text-secondary: #6b7280;    /* Medium gray - Supporting text */
  --border: #e5e7eb;            /* Light gray - Subtle separation */
}
```

**Typography Scale**:

```css
/* Hero Headline */
h1 {
  font-size: 48px;
  font-weight: 600;
  line-height: 1.1;
}

@media (max-width: 640px) {
  h1 {
    font-size: 32px;
  }
}

/* Subheadline */
.hero p {
  font-size: 20px;
  font-weight: 400;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .hero p {
    font-size: 18px;
  }
}

/* Body Text */
body {
  font-size: 16px;
  line-height: 1.6;
}
```

**Button Styles**:

```css
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  border: 2px solid var(--primary);
  color: var(--primary);
  padding: 10px 32px; /* 2px less to account for border */
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(59, 130, 246, 0.05);
}
```

**Bento-Box Grid** (Feature Cards):

```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.feature-card {
  background: var(--surface);
  padding: 32px;
  border-radius: 12px;
  border: 1px solid var(--border);
  transition: box-shadow 0.2s ease;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

---

### JavaScript Interactivity (landing.js)

**Minimal vanilla JS** (<5KB total):

```javascript
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Optional: Track CTA clicks (if analytics set up)
document.querySelectorAll('.btn-primary').forEach(button => {
  button.addEventListener('click', () => {
    // Analytics tracking (Plausible or GA)
    if (window.plausible) {
      window.plausible('CTA Click', { props: { button: 'Start Writing Free' } });
    }
  });
});

// Optional: FAQ accordion (if needed)
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', function() {
    this.classList.toggle('active');
    const answer = this.nextElementSibling;
    answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
  });
});
```

---

## 📸 Visual Assets Requirements

### Required Images (5 total)

**1. Hero Visual** (`hero.webp`)
- **Content**: Screenshot of RiteMark editor with sample document
- **Dimensions**: 1200x800px (3:2 aspect ratio)
- **File size**: <80KB (WebP format)
- **Alt text**: "RiteMark WYSIWYG markdown editor interface"

**2. Feature 1 - WYSIWYG Editing** (`feature1.webp`)
- **Content**: Animated GIF showing toolbar formatting (bold, italic, headings)
- **Dimensions**: 600x400px
- **File size**: <50KB
- **Alt text**: "Visual formatting with RiteMark toolbar"

**3. Feature 2 - Google Drive** (`feature2.webp`)
- **Content**: Screenshot of auto-save indicator or Drive integration
- **Dimensions**: 600x400px
- **File size**: <40KB
- **Alt text**: "Auto-save to Google Drive"

**4. Feature 3 - Markdown Output** (`feature3.webp`)
- **Content**: Split-screen showing visual editor on left, markdown output on right
- **Dimensions**: 800x400px (2:1 aspect ratio)
- **File size**: <50KB
- **Alt text**: "Visual editing to markdown conversion"

**5. Feature 5 - Mobile Design** (`feature5.webp`)
- **Content**: Mockup showing RiteMark on phone and desktop side-by-side
- **Dimensions**: 600x500px
- **File size**: <50KB
- **Alt text**: "RiteMark responsive design on mobile and desktop"

**Image Optimization:**
- Format: WebP (80-90% quality)
- Compression: Use Squoosh or ImageOptim
- Lazy loading: `loading="lazy"` attribute (except hero image)
- Fallback: PNG for browsers without WebP support

---

## 🎯 SEO Implementation

### Meta Tags Checklist

```html
<!-- Title Tag (50-60 characters) -->
<title>RiteMark - Markdown Editor for People Who Hate Markdown</title>

<!-- Meta Description (150-160 characters) -->
<meta name="description" content="Edit documents like Google Docs. Collaborate in real-time. Export clean markdown for AI tools, GitHub, and developer workflows. No syntax required.">

<!-- Canonical URL -->
<link rel="canonical" href="https://ritemark.app">

<!-- Robots -->
<meta name="robots" content="index, follow">

<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:title" content="RiteMark - Markdown Editor for People Who Hate Markdown">
<meta property="og:description" content="Edit like Google Docs, export markdown for AI tools and GitHub. No learning curve.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://ritemark.app">
<meta property="og:image" content="https://ritemark.app/assets/landing/og-image.png">
<meta property="og:site_name" content="RiteMark">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="RiteMark - Markdown Editor for People Who Hate Markdown">
<meta name="twitter:description" content="Edit like Google Docs, export markdown for AI tools and GitHub.">
<meta name="twitter:image" content="https://ritemark.app/assets/landing/og-image.png">
```

### Sitemap.xml

**File:** `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ritemark.app/</loc>
    <lastmod>2025-10-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ritemark.app/app</loc>
    <lastmod>2025-10-21</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ritemark.app/privacy</loc>
    <lastmod>2025-10-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://ritemark.app/terms</loc>
    <lastmod>2025-10-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

### Robots.txt

**File:** `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://ritemark.app/sitemap.xml
```

### Target Keywords

**Primary Keywords:**
- WYSIWYG markdown editor
- Markdown editor for non-technical users
- Google Docs for markdown

**Secondary Keywords:**
- Real-time markdown collaboration
- AI-ready markdown editor
- Visual markdown editor
- Cloud markdown editor

**Long-Tail Keywords:**
- Markdown editor that looks like Google Docs
- Export Google Docs to markdown
- Collaborate on markdown documents
- Markdown for AI tools

---

## 🧪 Testing Checklist

### Functional Testing

**Desktop Browsers** (test all flows):
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)

**Mobile Browsers** (test all flows):
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome (Pixel/Samsung)

**Test Scenarios:**
1. **Landing page loads** → Verify hero, features, FAQ, footer all render correctly
2. **Primary CTA** → Click "Start Writing Free" → Redirects to `/app` → WelcomeScreen appears
3. **Secondary CTA** → Click "See How It Works" → Smooth scrolls to demo section
4. **Privacy link** → Click Privacy Policy → Opens `/privacy` in same tab
5. **Terms link** → Click Terms of Service → Opens `/terms` in same tab
6. **Mobile responsive** → Resize browser → Layout adapts (3-col → 1-col, stacked buttons)

---

### Performance Testing

**Lighthouse Audit** (Chrome DevTools):

**Target Scores:**
- Performance: >95
- Accessibility: >95
- Best Practices: >95
- SEO: >95

**Core Web Vitals:**
- FCP (First Contentful Paint): <1 second
- LCP (Largest Contentful Paint): <2.5 seconds
- CLS (Cumulative Layout Shift): <0.1
- FID (First Input Delay): <100ms

**Image Optimization:**
- All images WebP format (<50KB each)
- Lazy loading on feature images
- Hero image loads eagerly (above the fold)

**CSS Optimization:**
- Critical CSS inlined (<14KB)
- Non-critical CSS deferred (external stylesheet)
- No unused CSS rules

**JavaScript Optimization:**
- Minimal JS (<5KB total)
- Deferred loading (`defer` attribute)
- No render-blocking scripts

---

### Accessibility Testing

**WCAG 2.1 AA Compliance:**

**Keyboard Navigation:**
- [ ] Tab key moves through all interactive elements (CTAs, links)
- [ ] Enter key activates buttons and links
- [ ] Focus indicators visible on all elements

**Screen Reader Testing:**
- [ ] VoiceOver (macOS/iOS) - Test hero, features, FAQ
- [ ] NVDA (Windows) - Test all sections
- [ ] All images have descriptive alt text
- [ ] Headings follow semantic hierarchy (h1 → h2 → h3)

**Color Contrast:**
- [ ] Text on background: ≥4.5:1 ratio (AA standard)
- [ ] Button text on background: ≥4.5:1 ratio
- [ ] Use WebAIM Contrast Checker

**Semantic HTML:**
- [ ] Proper heading structure (h1 for hero, h2 for sections)
- [ ] `<nav>` for footer navigation
- [ ] `<section>` for main content areas
- [ ] ARIA labels where needed (e.g., `aria-label` on icon-only buttons)

---

## 📊 Analytics & Tracking

### Plausible Analytics (Privacy-Compliant)

**Setup** (optional for MVP, recommended for Sprint 15):

```html
<!-- Add to <head> -->
<script defer data-domain="ritemark.app" src="https://plausible.io/js/script.js"></script>
```

**Custom Events:**
- `CTA Click` - Track "Start Writing Free" clicks
- `Demo View` - Track demo video plays
- `FAQ Expand` - Track which FAQ questions are opened

**Why Plausible?**
- Privacy-first (no cookies, GDPR compliant)
- Lightweight (<1KB script)
- Simple dashboard
- No GDPR consent banner required

---

## 🚀 Deployment Process

### Pre-Deployment Checklist

**Code Quality:**
- [ ] HTML validates (W3C Validator)
- [ ] CSS validates (no errors)
- [ ] No JavaScript console errors
- [ ] All links working (no 404s)

**Performance:**
- [ ] Lighthouse score >95
- [ ] Images optimized (<50KB each)
- [ ] Total page size <200KB (gzipped)

**SEO:**
- [ ] Meta tags complete (title, description, OG)
- [ ] Sitemap.xml created
- [ ] Robots.txt updated
- [ ] Schema.org markup added

**Routing:**
- [ ] Netlify.toml updated with routing rules
- [ ] Test routing locally with `netlify dev`
- [ ] Verify `/` → landing.html, `/app` → index.html

---

### Deployment Steps

**Step 1: Commit Changes**

```bash
git add docs/sprints/sprint-14/
git add public/landing.html public/landing.css public/landing.js
git add public/assets/landing/
git add netlify.toml sitemap.xml robots.txt
git commit -m "feat: Add static landing page (Sprint 14)

- Create landing.html with hero, features, FAQ sections
- Add responsive CSS matching privacy.html design system
- Configure Netlify routing (/ → landing, /app → React)
- Add SEO meta tags, sitemap.xml, robots.txt
- Optimize images (WebP, <50KB each)
- Target: <1s FCP, >95 Lighthouse score

Sprint 14 implementation complete.
```

**Step 2: Push to GitHub**

```bash
git push origin main
```

**Step 3: Netlify Auto-Deploy**

- Netlify detects push to `main` branch
- Builds and deploys automatically
- Monitor deployment at https://app.netlify.com/sites/ritemark/deploys

**Step 4: Verify Production**

```bash
# Test landing page
curl -I https://ritemark.app/

# Test React app routing
curl -I https://ritemark.app/app

# Test privacy page
curl -I https://ritemark.app/privacy
```

**Step 5: Submit to Google Search Console**

- Log in to Google Search Console
- Submit sitemap: https://ritemark.app/sitemap.xml
- Request indexing for homepage

---

## 📈 Post-Launch Monitoring

### First 24 Hours

**Traffic:**
- [ ] Monitor Netlify Analytics (pageviews, unique visitors)
- [ ] Check for 404 errors or broken links
- [ ] Verify all routes working (`/`, `/app`, `/privacy`, `/terms`)

**Performance:**
- [ ] Run Lighthouse audit on production URL
- [ ] Check Core Web Vitals in Google Search Console
- [ ] Monitor Netlify CDN response times

**Conversions:**
- [ ] Track "Start Writing Free" CTA clicks (Plausible)
- [ ] Monitor new OAuth sign-ins in app logs
- [ ] Calculate conversion rate (CTA clicks / total visitors)

---

### Sprint 15 Optimization Tasks

**After MVP Landing Page Deployed:**

**A/B Testing:**
- Test 3 headline variants
- Test CTA button text ("Start Writing Free" vs "Try RiteMark Free")
- Test feature card order (which features shown first?)

**Content Enhancements:**
- Add 30-60s demo video
- Collect beta user testimonials (3-5 quotes)
- Add social proof section (GitHub stars, user count)
- Create comparison table (RiteMark vs Notion/Typora)

**Technical Enhancements:**
- Set up email capture form (newsletter signups)
- Implement Plausible Analytics (if not in MVP)
- Add blog section for SEO content
- Optimize images further (lazy loading, responsive images)

---

## ✅ Definition of Done

**Sprint 14 is COMPLETE when ALL of these are true:**

### Functional Completeness
- [ ] Static landing page deployed at `ritemark.app/`
- [ ] React app accessible at `ritemark.app/app`
- [ ] All CTAs redirect correctly
- [ ] Privacy and Terms links working
- [ ] No broken images or 404 errors

### Performance Targets
- [ ] First Contentful Paint (FCP) <1 second
- [ ] Lighthouse Performance score >95
- [ ] Total page size <200KB (gzipped)
- [ ] All images WebP format (<50KB each)

### Content Completeness
- [ ] Hero headline and subheadline finalized
- [ ] 5 feature cards with descriptions
- [ ] 5 FAQ questions answered
- [ ] Footer with Privacy/Terms/GitHub/Contact links

### SEO Completeness
- [ ] Meta tags complete (title, description, OG, Twitter)
- [ ] Sitemap.xml submitted to Google Search Console
- [ ] Robots.txt configured
- [ ] Schema.org markup added
- [ ] All images have alt text

### Quality Assurance
- [ ] Tested on 3 desktop browsers (Chrome, Safari, Firefox)
- [ ] Tested on 2 mobile browsers (iOS Safari, Android Chrome)
- [ ] Lighthouse accessibility score >95
- [ ] No console errors
- [ ] Full user flow tested (landing → app → OAuth → editor)

### Documentation
- [ ] Sprint 14 README.md complete
- [ ] Implementation plan documented
- [ ] Roadmap.md updated with Sprint 14 completion
- [ ] Sprint 15 plan created (optimization phase)

---

## 📚 References

**Research Documents:**
- `/docs/research/landing-page/landing-page-master-plan.md` - Executive summary
- `/docs/research/landing-page/landing-page-content-strategy.md` - Copy guide
- `/docs/research/landing-page/competitor-analysis.md` - Best practices
- `/docs/research/landing-page/technical-integration.md` - Architecture decisions
- `/docs/research/landing-page/ux-flow-design.md` - User journey

**Existing Assets:**
- `/public/privacy.html` - Design system reference
- `/public/terms.html` - Design system reference
- `/src/components/WelcomeScreen.tsx` - OAuth entry point (no changes needed)

**External Resources:**
- W3C HTML Validator: https://validator.w3.org/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Squoosh Image Optimizer: https://squoosh.app/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

---

**Implementation Status:** 📋 Ready to Start
**Estimated Completion:** 2-3 days (18 hours)
**Next Sprint:** Sprint 15 - Landing Page Optimization
**Created:** October 21, 2025
