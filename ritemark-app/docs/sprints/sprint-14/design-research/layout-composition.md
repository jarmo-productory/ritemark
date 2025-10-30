# Layout Composition & Grid Systems Research
## Modern Landing Page Design for RiteMark (2025)

**Research Date:** October 22, 2025
**Researcher:** Research Agent
**Sprint:** Sprint 14 - Landing Page Design
**Status:** ✅ Complete

---

## 📋 Executive Summary

This research document provides comprehensive guidelines for creating a modern, visually balanced landing page layout for RiteMark using 2025 best practices. Key recommendations:

- **Grid System:** CSS Grid for page structure + Flexbox for components
- **Spacing Scale:** 8pt system (4, 8, 16, 24, 32, 48, 64, 96, 128px)
- **Container Width:** Max 1280px with responsive padding
- **Breakpoints:** Mobile-first (640px, 768px, 1024px, 1280px)
- **Layout Style:** Bento grid + asymmetric hero for modern appeal

---

## 🎯 Table of Contents

1. [Grid Systems Overview](#grid-systems-overview)
2. [Composition Principles](#composition-principles)
3. [8pt Spacing System](#8pt-spacing-system)
4. [Modern Layout Patterns (2025)](#modern-layout-patterns-2025)
5. [CSS Grid vs Flexbox Decision Matrix](#css-grid-vs-flexbox-decision-matrix)
6. [RiteMark Recommended Grid System](#ritemark-recommended-grid-system)
7. [Hero Section Layout Variations](#hero-section-layout-variations)
8. [Complete Section Breakdown](#complete-section-breakdown)
9. [Responsive Strategy](#responsive-strategy)
10. [Implementation Code Examples](#implementation-code-examples)

---

## 1. Grid Systems Overview

### 1.1 Traditional 12-Column Grid (Bootstrap/Tailwind)

**When to Use:**
- Complex multi-column layouts
- When team is familiar with Bootstrap/Tailwind
- Need for quick prototyping with framework utilities

**Strengths:**
- Industry standard, well-documented
- Easy to learn and implement
- Good for consistent column-based layouts

**Limitations:**
- Can feel rigid and predictable
- All designs start to look similar
- Harder to create unique, asymmetric layouts

**Example:**
```css
/* Traditional 12-column grid */
.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
}

.col-6 {
  grid-column: span 6; /* Half width */
}

.col-4 {
  grid-column: span 4; /* Third width */
}
```

### 1.2 CSS Grid (Modern Approach)

**When to Use:**
- Two-dimensional layouts (rows AND columns)
- Complex page structures
- When you need precise control over placement
- Asymmetric layouts and bento grids

**Strengths:**
- Ultimate flexibility and power
- Clean, semantic code
- Built-in alignment and gap controls
- Responsive without media queries (using minmax, auto-fit)

**Example:**
```css
/* Modern CSS Grid */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  padding: 48px 24px;
}

/* Named grid areas for semantic layouts */
.page-layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  grid-template-columns: 250px 1fr 1fr;
  gap: 24px;
}
```

### 1.3 Flexbox (Component-Level)

**When to Use:**
- One-dimensional layouts (row OR column)
- Navigation menus, toolbars
- Centering content
- Responsive component layouts

**Strengths:**
- Simple and intuitive
- Perfect for UI components
- Excellent browser support
- Works from content out (flexible sizing)

**Example:**
```css
/* Flexbox for navigation */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.nav-links {
  display: flex;
  gap: 32px;
  align-items: center;
}
```

### 1.4 Bento Grid Layouts (2025 Trend)

**What It Is:**
- Inspired by Japanese bento boxes and Apple's iOS widgets
- Organized, stylish blocks with varying sizes
- Modular tiles that create visual hierarchy

**When to Use:**
- Feature showcases
- Dashboard-style layouts
- Portfolio grids
- Modern SaaS landing pages (Notion, Linear, Figma)

**Strengths:**
- Visually interesting and modern
- Each section gets its own identity
- Excellent for showcasing multiple features
- Naturally responsive

**Example:**
```css
/* Bento grid layout */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
  grid-auto-flow: dense; /* Fill gaps intelligently */
}

.bento-item-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item-wide {
  grid-column: span 2;
  grid-row: span 1;
}

.bento-item-tall {
  grid-column: span 1;
  grid-row: span 2;
}
```

### 1.5 Asymmetric Grids (Breaking the Grid)

**What It Is:**
- Intentional breaking of traditional grid rules
- Different column widths and alignments
- Creates dynamic, unique layouts

**When to Use:**
- Creative portfolios
- Modern tech companies (Stripe, Vercel)
- When you want to stand out
- Editorial/magazine-style layouts

**Benefits:**
- 20% increase in user engagement (research shows)
- Memorable and distinctive
- Guides user's eye through the page

**Caution:**
- Still needs underlying structure
- Don't sacrifice usability for aesthetics
- Maintain visual balance

---

## 2. Composition Principles

### 2.1 Rule of Thirds

**Concept:**
Divide your layout into 9 equal parts (3×3 grid). Place important elements at intersection points for visual interest.

**Application:**
- Place CTAs at intersection points
- Position hero images at 1/3 or 2/3 points
- Avoid centering everything (static and boring)

**Visual:**
```
┌─────┬─────┬─────┐
│  •  │     │  •  │  • = Power points
├─────┼─────┼─────┤     (visual interest)
│     │     │     │
├─────┼─────┼─────┤
│  •  │     │  •  │
└─────┴─────┴─────┘
```

### 2.2 Golden Ratio (1.618)

**Concept:**
Mathematical ratio found in nature (Fibonacci sequence). Creates naturally pleasing proportions.

**Application:**
- Content area vs sidebar: 846px : 520px ≈ 1.618
- Headline size vs body text: 48px : 30px ≈ 1.6
- Section heights and spacing

**Example:**
```css
/* Golden ratio in practice */
.content-with-sidebar {
  display: grid;
  grid-template-columns: 1.618fr 1fr; /* 61.8% : 38.2% */
  gap: 32px;
}

.hero-section {
  min-height: 618px; /* If viewport is ~1000px */
}
```

**Fibonacci Grid:**
- Grid with 13 or 21 columns (Fibonacci numbers)
- More organic than 12-column grid
- Used by Apple, Twitter, Pepsi

### 2.3 Symmetry vs Asymmetry

**Symmetry:**
- **When:** Professional services, finance, corporate
- **Feeling:** Trust, stability, formality
- **Example:** Centered hero, balanced features

**Asymmetry:**
- **When:** Creative agencies, tech startups, modern SaaS
- **Feeling:** Dynamic, interesting, innovative
- **Example:** Diagonal sections, offset grids

**Best Practice:**
Use asymmetry within symmetrical structure (controlled chaos).

### 2.4 Visual Weight and Balance

**Heavy Elements:**
- Dark colors
- Large size
- Dense content
- Images and media

**Light Elements:**
- White space
- Light colors
- Minimal content
- Text

**Balancing Act:**
```
Heavy (image) ←→ Light (whitespace + small CTA)
     ⚖️ Still feels balanced
```

**Example Layout:**
```css
/* Asymmetric balance */
.hero {
  display: grid;
  grid-template-columns: 2fr 3fr; /* Lighter content gets more space */
  align-items: center;
}

.hero-text {
  /* Heavy text content on left (40%) */
  padding-right: 64px;
}

.hero-visual {
  /* Light visual element on right (60%) */
  /* More space balances the visual weight */
}
```

### 2.5 Negative Space (Breathing Room)

**Why It Matters:**
- Reduces cognitive load
- Creates focus
- Conveys premium/quality
- Improves readability

**Guidelines:**
- Minimum 48px padding around sections
- 64-96px between major sections
- 16-24px between related elements
- 8-12px within components

**Apple's Approach:**
```css
/* Generous spacing = premium feel */
.section {
  padding: 96px 24px; /* Lots of vertical space */
  max-width: 980px;   /* Narrow content = more whitespace */
  margin: 0 auto;
}
```

---

## 3. 8pt Spacing System

### 3.1 Why 8pt?

**Reasons:**
1. **Scalability:** Most screen sizes divisible by 8 (1280, 1920, 2560)
2. **Visual Balance:** Right size for human perception
3. **Developer Friendly:** Easy to calculate (no decimals)
4. **Consistency:** Prevents spacing chaos

### 3.2 Recommended Spacing Scale

```css
/* Tailwind-style spacing scale (all multiples of 4 or 8) */
:root {
  --space-1: 4px;    /* Tight spacing */
  --space-2: 8px;    /* Component padding */
  --space-3: 12px;   /* Small gaps */
  --space-4: 16px;   /* Default gap */
  --space-6: 24px;   /* Medium gap */
  --space-8: 32px;   /* Large gap */
  --space-12: 48px;  /* Section padding */
  --space-16: 64px;  /* Large section padding */
  --space-24: 96px;  /* Extra large sections */
  --space-32: 128px; /* Hero sections */
}
```

### 3.3 Usage Guidelines

| Spacing | Use Case | Example |
|---------|----------|---------|
| **4px** | Icon margins, tight layouts | Button icon + text |
| **8px** | Component internal padding | Input fields, badges |
| **12px** | Small gaps between items | List items, tags |
| **16px** | Default gap | Card padding, grid gaps |
| **24px** | Medium spacing | Between paragraphs, card margins |
| **32px** | Large gaps | Between sections (mobile) |
| **48px** | Section padding | Container padding |
| **64px** | Large section spacing | Between major sections (desktop) |
| **96px** | Extra large spacing | Hero section padding |
| **128px** | Hero sections | Top/bottom hero padding |

### 3.4 Implementation

```css
/* Utility classes (Tailwind-inspired) */
.p-1  { padding: 4px; }
.p-2  { padding: 8px; }
.p-4  { padding: 16px; }
.p-6  { padding: 24px; }
.p-8  { padding: 32px; }
.p-12 { padding: 48px; }
.p-16 { padding: 64px; }

.gap-4  { gap: 16px; }
.gap-6  { gap: 24px; }
.gap-8  { gap: 32px; }

/* Or use CSS variables */
.section {
  padding: var(--space-16) var(--space-6);
}
```

### 3.5 Typography Line Height (4pt)

For more precise typography control, use 4pt increments for line heights:

```css
.heading-xl {
  font-size: 48px;
  line-height: 56px; /* 48 + 8 (4pt × 2) */
}

.body {
  font-size: 16px;
  line-height: 24px; /* 16 + 8 (4pt × 2) = 1.5 ratio */
}
```

---

## 4. Modern Layout Patterns (2025)

### 4.1 Hero + Bento Grid Hybrid (Recommended for RiteMark)

**Structure:**
1. **Hero Section:** Asymmetric split (60% text, 40% visual)
2. **Features:** Bento grid (varying tile sizes)
3. **Social Proof:** Horizontal scrolling cards
4. **FAQ:** Accordion layout
5. **Footer:** Multi-column grid

**Why This Works:**
- Modern and trendy (Notion, Linear, Figma use this)
- Showcases features visually
- Keeps users engaged
- Responsive and mobile-friendly

**Layout Code:**
```css
/* Hero section */
.hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 64px;
  align-items: center;
  min-height: 600px;
  padding: 96px 24px;
}

/* Bento grid features */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 240px;
  gap: 16px;
  padding: 64px 24px;
}

.feature-large {
  grid-column: span 2;
  grid-row: span 2;
}

.feature-wide {
  grid-column: span 2;
}
```

### 4.2 Split-Screen Layouts (50/50)

**When to Use:**
- Product comparisons
- Before/after showcases
- Dual CTAs

**Example:**
```css
.split-screen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

.split-left {
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
}

.split-right {
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 4.3 Diagonal Sections (Breaking Rectangles)

**Trend:** Creating visual interest with diagonal cuts

**Implementation:**
```css
.diagonal-section {
  position: relative;
  padding: 128px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  clip-path: polygon(0 0, 100% 8%, 100% 100%, 0 92%);
}
```

### 4.4 Card-Based Designs

**Guidelines:**
- Use subtle shadows (not heavy drop shadows)
- 8-12px border radius
- Hover states with elevation
- White background on light gray page

**Example:**
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### 4.5 Infinite Scroll vs Pagination

**Infinite Scroll:**
- **Pros:** Engaging, modern, mobile-friendly
- **Cons:** Hard to reach footer, SEO challenges
- **Best for:** Social feeds, image galleries

**Pagination:**
- **Pros:** User control, better SEO, clear endpoints
- **Cons:** More clicks, interrupts flow
- **Best for:** E-commerce, search results, blogs

**For RiteMark Landing Page:**
Use **single-page scroll** with sticky navigation (no need for pagination/infinite).

### 4.6 Sticky Navigation (Transparency + Blur)

**Modern Approach:**
```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.3s ease;
}

.navbar.scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

---

## 5. CSS Grid vs Flexbox Decision Matrix

### Quick Decision Tree:

```
Do you need to control BOTH rows AND columns?
├─ YES → Use CSS Grid
└─ NO → Do you need one direction (row OR column)?
   ├─ YES → Use Flexbox
   └─ NO → Use normal flow
```

### Detailed Comparison:

| Feature | CSS Grid | Flexbox |
|---------|----------|---------|
| **Dimensions** | 2D (rows + columns) | 1D (row or column) |
| **Use Case** | Page layouts | Component layouts |
| **Content Flow** | Layout-first (define grid, place items) | Content-first (items flex to fill) |
| **Best For** | Complex page structures | Navigation, toolbars, cards |
| **Browser Support** | Excellent (2025) | Excellent (2025) |
| **Learning Curve** | Steeper | Easier |
| **Alignment** | Powerful (justify-items, align-items) | Simple (justify-content, align-items) |
| **Gap Property** | ✅ Built-in | ✅ Built-in |
| **Responsive** | `auto-fit`, `minmax()` | `flex-wrap`, `flex-grow` |

### When to Use Each:

**CSS Grid:**
- ✅ Overall page layout
- ✅ Bento grids and feature showcases
- ✅ Multi-column sections
- ✅ Complex dashboard layouts
- ✅ Image galleries with varying sizes

**Flexbox:**
- ✅ Navigation menus
- ✅ Centering content (vertical/horizontal)
- ✅ Card layouts (simple rows/columns)
- ✅ Button groups
- ✅ Form layouts
- ✅ Lists with consistent spacing

**Combine Both:**
```css
/* Grid for page structure */
.page {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 24px;
}

/* Flexbox for navigation inside grid */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

---

## 6. RiteMark Recommended Grid System

### 6.1 Grid Choice: Hybrid Approach

**Recommendation:**
- **CSS Grid** for page-level layout (sections, hero, features)
- **Flexbox** for components (navbar, cards, buttons)
- **8pt spacing system** for all spacing
- **Bento grid** for feature showcase

**Rationale:**
- Modern, flexible, and powerful
- Matches 2025 best practices
- Allows unique, asymmetric layouts
- Great for responsive design
- No framework lock-in (future-proof)

### 6.2 Base Grid System

```css
/* Root container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 48px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 64px;
  }
}

/* Grid utilities */
.grid {
  display: grid;
  gap: 24px;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive grid (auto-adjusts) */
.grid-auto {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### 6.3 Spacing Utilities

```css
/* Padding utilities */
.p-4  { padding: 16px; }
.p-6  { padding: 24px; }
.p-8  { padding: 32px; }
.p-12 { padding: 48px; }
.p-16 { padding: 64px; }

.py-12 { padding-top: 48px; padding-bottom: 48px; }
.py-16 { padding-top: 64px; padding-bottom: 64px; }
.py-24 { padding-top: 96px; padding-bottom: 96px; }

.px-6 { padding-left: 24px; padding-right: 24px; }

/* Gap utilities */
.gap-4  { gap: 16px; }
.gap-6  { gap: 24px; }
.gap-8  { gap: 32px; }
.gap-12 { gap: 48px; }
```

---

## 7. Hero Section Layout Variations

### Option A: Asymmetric Split (60/40) - RECOMMENDED ⭐

**Pros:**
- Modern and dynamic
- Great visual balance
- Draws eye to content first
- Works well with large imagery

**Cons:**
- Slightly harder to make responsive
- Needs careful balance

**Layout:**
```
┌─────────────────────────┬───────────────┐
│                         │               │
│   Headline              │               │
│   Subheading            │    Visual     │
│                         │   (40% wide)  │
│   CTA Buttons           │               │
│   (60% wide)            │               │
│                         │               │
└─────────────────────────┴───────────────┘
```

**Code:**
```css
.hero {
  display: grid;
  grid-template-columns: 1.5fr 1fr; /* 60/40 split */
  gap: 64px;
  align-items: center;
  min-height: 600px;
  padding: 96px 24px;
}

.hero-content {
  max-width: 580px;
}

.hero-visual {
  position: relative;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 48px;
    min-height: auto;
    padding: 64px 24px;
  }
}
```

---

### Option B: Centered Content (Classic)

**Pros:**
- Safe and proven
- Easy to implement
- Works for all content types
- Very responsive-friendly

**Cons:**
- Less distinctive
- Can feel generic
- Harder to stand out

**Layout:**
```
┌──────────────────────────────────────┐
│                                      │
│            Headline                  │
│          Subheading                  │
│                                      │
│         [CTA] [CTA]                  │
│                                      │
│      ┌──────────────────┐            │
│      │                  │            │
│      │     Visual       │            │
│      │                  │            │
│      └──────────────────┘            │
│                                      │
└──────────────────────────────────────┘
```

**Code:**
```css
.hero-centered {
  text-align: center;
  padding: 128px 24px 96px;
  max-width: 800px;
  margin: 0 auto;
}

.hero-visual {
  margin-top: 64px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}
```

---

### Option C: Full-Width Background + Overlay Text

**Pros:**
- Highly visual and impactful
- Great for brand imagery
- Immersive experience

**Cons:**
- Needs high-quality images
- Text readability challenges
- Image optimization critical

**Layout:**
```
┌──────────────────────────────────────┐
│  ╔════════════════════════════════╗  │
│  ║  Background Image/Video        ║  │
│  ║                                ║  │
│  ║    Headline (white text)       ║  │
│  ║    Subheading                  ║  │
│  ║    [CTA]                       ║  │
│  ║                                ║  │
│  ╚════════════════════════════════╝  │
└──────────────────────────────────────┘
```

**Code:**
```css
.hero-fullwidth {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: url('/hero-bg.jpg') center/cover;
}

.hero-fullwidth::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.8) 0%,
    rgba(118, 75, 162, 0.8) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  color: white;
  max-width: 700px;
  padding: 0 24px;
}
```

---

### Recommendation for RiteMark:

**Use Option A (Asymmetric 60/40)** because:
1. Modern and distinctive (matches 2025 trends)
2. Great balance between text and visual
3. Allows for compelling editor screenshot/demo
4. More interesting than centered layouts
5. Used by successful SaaS products (Notion, Linear, Figma)

---

## 8. Complete Section Breakdown

### 8.1 Navigation Bar

**Layout:**
```
┌──────────────────────────────────────┐
│ [Logo]      [Links]      [CTA]       │
└──────────────────────────────────────┘
```

**Structure:**
- Flexbox layout
- Sticky positioning with blur effect
- Height: 64px
- Padding: 16px 24px

**Code:**
```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nav-links {
  display: flex;
  gap: 32px;
  align-items: center;
}

@media (max-width: 768px) {
  .nav-links {
    display: none; /* Mobile menu toggle */
  }
}
```

---

### 8.2 Hero Section

**Layout:** Asymmetric 60/40 split (see Option A above)

**Key Elements:**
- Headline (H1): 48-56px font size
- Subheading (P): 18-20px font size
- Primary CTA button
- Secondary link/button
- Visual: Editor screenshot or animation

**Spacing:**
- Top/bottom padding: 96px (desktop), 64px (mobile)
- Gap between text and visual: 64px
- Gap between headline and subheading: 16px
- Gap between subheading and CTAs: 32px

---

### 8.3 Features Section (Bento Grid)

**Layout:**
```
┌─────────┬─────────┬─────────┬─────────┐
│         │         │         │         │
│  Large  │  Small  │  Wide   │  Wide   │
│  2x2    │   1x1   │   2x1   │   2x1   │
│         ├─────────┼─────────┼─────────┤
│         │  Small  │  Tall   │  Small  │
│         │   1x1   │   1x2   │   1x1   │
└─────────┴─────────┴─────────┴─────────┘
```

**Structure:**
- CSS Grid with 4 columns
- Row height: 240px
- Gap: 16px
- Items span different sizes

**Code:**
```css
.features-bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 240px;
  gap: 16px;
  padding: 64px 24px;
  max-width: 1280px;
  margin: 0 auto;
}

.feature-large {
  grid-column: span 2;
  grid-row: span 2;
}

.feature-wide {
  grid-column: span 2;
  grid-row: span 1;
}

.feature-tall {
  grid-column: span 1;
  grid-row: span 2;
}

.feature-small {
  grid-column: span 1;
  grid-row: span 1;
}

/* Each feature card */
.feature-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Responsive */
@media (max-width: 1024px) {
  .features-bento {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 280px;
  }

  .feature-large,
  .feature-wide,
  .feature-tall {
    grid-column: span 1;
    grid-row: span 1;
  }
}

@media (max-width: 640px) {
  .features-bento {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 24px;
  }
}
```

---

### 8.4 Social Proof / Testimonials

**Layout:** Horizontal scrolling cards (mobile-friendly)

**Code:**
```css
.testimonials {
  padding: 64px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.testimonials::-webkit-scrollbar {
  display: none;
}

.testimonials-track {
  display: flex;
  gap: 24px;
  padding: 0 24px;
}

.testimonial-card {
  min-width: 350px;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

---

### 8.5 FAQ Section

**Layout:** Accordion (single column)

**Code:**
```css
.faq-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 64px 24px;
}

.faq-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 24px 0;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  font-size: 18px;
}

.faq-answer {
  margin-top: 16px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.6;
}
```

---

### 8.6 Footer

**Layout:** Multi-column grid

**Code:**
```css
.footer {
  background: #1a1a1a;
  color: white;
  padding: 64px 24px 32px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  max-width: 1280px;
  margin: 0 auto 48px;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
}
```

---

## 9. Responsive Strategy

### 9.1 Mobile-First Approach (Recommended)

**Why Mobile-First:**
- 70% of web traffic is mobile (2025)
- Better for performance (less CSS)
- Forces you to prioritize content
- Easier to add than remove

**Strategy:**
1. Design for 375px first (iPhone baseline)
2. Add tablet styles at 768px
3. Add desktop styles at 1024px
4. Add large desktop at 1280px

### 9.2 Breakpoints

```css
/* Mobile-first breakpoints */

/* Base styles: Mobile (375px - 639px) */
.container {
  padding: 0 16px;
}

/* Small tablets (640px+) */
@media (min-width: 640px) {
  .container {
    padding: 0 24px;
  }
}

/* Tablets (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 0 48px;
  }

  .hero {
    grid-template-columns: 1fr 1fr;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 0 64px;
  }

  .features-bento {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Large desktop (1280px+) */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

### 9.3 Container Widths

| Breakpoint | Container Max-Width | Padding |
|------------|---------------------|---------|
| **Mobile** (< 640px) | 100% | 16px |
| **Tablet** (640px - 767px) | 100% | 24px |
| **Desktop** (768px - 1023px) | 100% | 48px |
| **Large** (1024px - 1279px) | 100% | 64px |
| **XL** (1280px+) | 1280px | 64px (auto margins) |

### 9.4 Responsive Typography Scale

```css
/* Mobile base */
h1 { font-size: 32px; line-height: 40px; }
h2 { font-size: 28px; line-height: 36px; }
h3 { font-size: 24px; line-height: 32px; }
p  { font-size: 16px; line-height: 24px; }

/* Tablet (768px+) */
@media (min-width: 768px) {
  h1 { font-size: 40px; line-height: 48px; }
  h2 { font-size: 32px; line-height: 40px; }
  h3 { font-size: 28px; line-height: 36px; }
  p  { font-size: 18px; line-height: 28px; }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  h1 { font-size: 56px; line-height: 64px; }
  h2 { font-size: 40px; line-height: 48px; }
  h3 { font-size: 32px; line-height: 40px; }
  p  { font-size: 18px; line-height: 28px; }
}
```

### 9.5 Responsive Grid Adjustments

```css
/* Features grid - responsive */
.features-bento {
  /* Mobile: 1 column */
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 640px) {
  /* Small tablet: 2 columns */
  .features-bento {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  /* Desktop: 4 columns */
  .features-bento {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}
```

---

## 10. Implementation Code Examples

### 10.1 Complete Landing Page Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RiteMark - WYSIWYG Markdown Editor</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <!-- Navigation -->
  <nav class="navbar">
    <div class="container navbar-inner">
      <div class="logo">RiteMark</div>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#docs">Docs</a>
      </div>
      <button class="btn-primary">Get Started</button>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-content">
        <h1>Google Docs for Markdown</h1>
        <p class="hero-subheading">
          Beautiful WYSIWYG editing with markdown output.
          Real-time collaboration built for modern teams.
        </p>
        <div class="hero-ctas">
          <button class="btn-primary btn-lg">Start Writing Free</button>
          <a href="#demo" class="btn-secondary">Watch Demo</a>
        </div>
      </div>
      <div class="hero-visual">
        <img src="/editor-preview.png" alt="RiteMark Editor" />
      </div>
    </div>
  </section>

  <!-- Features (Bento Grid) -->
  <section class="features-section">
    <div class="container">
      <h2 class="section-title">Everything you need</h2>
      <div class="features-bento">

        <div class="feature-card feature-large">
          <h3>WYSIWYG Editing</h3>
          <p>Visual editing that feels like Google Docs</p>
        </div>

        <div class="feature-card feature-small">
          <h3>Real-time Sync</h3>
        </div>

        <div class="feature-card feature-wide">
          <h3>Cloud Storage</h3>
          <p>Google Drive integration</p>
        </div>

        <div class="feature-card feature-wide">
          <h3>Collaboration</h3>
          <p>Work together in real-time</p>
        </div>

        <div class="feature-card feature-small">
          <h3>Markdown Output</h3>
        </div>

        <div class="feature-card feature-tall">
          <h3>Mobile First</h3>
          <p>Optimized for all devices</p>
        </div>

        <div class="feature-card feature-small">
          <h3>Offline Mode</h3>
        </div>

      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq-section">
    <div class="container">
      <h2 class="section-title">Frequently Asked Questions</h2>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question">
            What is RiteMark?
          </div>
          <div class="faq-answer">
            RiteMark is a WYSIWYG markdown editor designed for non-technical users...
          </div>
        </div>
        <!-- More FAQ items -->
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-grid">
      <div class="footer-col">
        <h4>RiteMark</h4>
        <p>WYSIWYG Markdown Editor for modern teams</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#docs">Documentation</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="#about">About</a></li>
          <li><a href="#blog">Blog</a></li>
          <li><a href="#careers">Careers</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="#privacy">Privacy</a></li>
          <li><a href="#terms">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 RiteMark. All rights reserved.</p>
    </div>
  </footer>

</body>
</html>
```

### 10.2 Complete CSS Implementation

```css
/* ===========================
   CSS RESET & BASE STYLES
   =========================== */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Spacing scale (8pt system) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  --space-32: 128px;

  /* Container widths */
  --container-max: 1280px;

  /* Colors */
  --primary: #667eea;
  --primary-dark: #5568d3;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --bg-light: #f7f7f7;
  --border-light: rgba(0, 0, 0, 0.1);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  font-family: var(--font-sans);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ===========================
   CONTAINER
   =========================== */

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--space-12);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 var(--space-16);
  }
}

/* ===========================
   NAVIGATION
   =========================== */

.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.navbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.nav-links {
  display: none;
  gap: var(--space-8);
  align-items: center;
}

.nav-links a {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--primary);
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
  }
}

/* ===========================
   BUTTONS
   =========================== */

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-lg {
  padding: 16px 32px;
  font-size: 18px;
}

.btn-secondary {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
}

/* ===========================
   HERO SECTION
   =========================== */

.hero {
  padding: var(--space-24) 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
}

@media (min-width: 768px) {
  .hero-inner {
    grid-template-columns: 1.5fr 1fr;
    gap: var(--space-16);
  }
}

.hero-content {
  max-width: 580px;
}

h1 {
  font-size: 40px;
  line-height: 48px;
  font-weight: 800;
  margin-bottom: var(--space-4);
}

@media (min-width: 1024px) {
  h1 {
    font-size: 56px;
    line-height: 64px;
  }
}

.hero-subheading {
  font-size: 18px;
  line-height: 28px;
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
}

.hero-ctas {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.hero-visual img {
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* ===========================
   FEATURES SECTION (BENTO GRID)
   =========================== */

.features-section {
  padding: var(--space-16) 0;
  background: white;
}

.section-title {
  text-align: center;
  font-size: 40px;
  font-weight: 700;
  margin-bottom: var(--space-16);
}

.features-bento {
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: auto;
  gap: var(--space-6);
}

@media (min-width: 640px) {
  .features-bento {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .features-bento {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 240px;
    gap: 16px;
  }

  .feature-large {
    grid-column: span 2;
    grid-row: span 2;
  }

  .feature-wide {
    grid-column: span 2;
    grid-row: span 1;
  }

  .feature-tall {
    grid-column: span 1;
    grid-row: span 2;
  }

  .feature-small {
    grid-column: span 1;
    grid-row: span 1;
  }
}

.feature-card {
  background: var(--bg-light);
  border-radius: 12px;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.feature-card h3 {
  font-size: 24px;
  margin-bottom: var(--space-2);
}

.feature-card p {
  color: var(--text-secondary);
  font-size: 16px;
}

/* ===========================
   FAQ SECTION
   =========================== */

.faq-section {
  padding: var(--space-16) 0;
  background: var(--bg-light);
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: white;
  border-radius: 12px;
  padding: var(--space-6);
  margin-bottom: var(--space-4);
}

.faq-question {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: var(--space-3);
  cursor: pointer;
}

.faq-answer {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===========================
   FOOTER
   =========================== */

.footer {
  background: #1a1a1a;
  color: white;
  padding: var(--space-16) 0 var(--space-8);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  margin-bottom: var(--space-12);
}

@media (min-width: 768px) {
  .footer-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: var(--space-12);
  }
}

.footer-col h4 {
  margin-bottom: var(--space-4);
  font-size: 16px;
  font-weight: 600;
}

.footer-col ul {
  list-style: none;
}

.footer-col ul li {
  margin-bottom: var(--space-2);
}

.footer-col a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: white;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--space-6);
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}
```

---

## 📊 Summary & Quick Reference

### Final Recommendations for RiteMark:

1. **Grid System:** CSS Grid for layout + Flexbox for components
2. **Spacing:** 8pt system (4, 8, 16, 24, 32, 48, 64, 96, 128px)
3. **Container:** Max-width 1280px with responsive padding
4. **Breakpoints:** 640px, 768px, 1024px, 1280px (mobile-first)
5. **Hero Layout:** Asymmetric 60/40 split (text/visual)
6. **Features:** Bento grid with varying tile sizes
7. **Navigation:** Sticky with blur effect
8. **Typography:** Scale from 16px (mobile) to 18px (desktop) for body

### Key Metrics:

- **Mobile padding:** 16-24px
- **Desktop padding:** 48-64px
- **Section spacing:** 64-96px between major sections
- **Component spacing:** 16-32px within sections
- **Grid gap:** 16-24px for tight layouts, 32-48px for spacious

### Resources for Continued Learning:

- **CSS Grid:** https://cssgridgarden.com
- **Bento Grids:** https://bentogrids.com
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Awwwards:** https://awwwards.com (design inspiration)
- **Figma Community:** Search "bento grid" and "landing page"

---

**Next Steps:**
1. Review this document with design/development team
2. Create wireframes based on recommended layouts
3. Build prototype in Figma or code
4. Test responsive behavior across devices
5. Iterate based on user feedback

---

**Document Status:** ✅ Complete
**Last Updated:** October 22, 2025
**Approved By:** Research Agent
**Sprint:** Sprint 14
