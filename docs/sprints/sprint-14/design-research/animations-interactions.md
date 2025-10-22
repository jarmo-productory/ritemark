# Animation & Micro-Interactions Research (2025)

## Executive Summary

This document provides actionable guidance for implementing delightful, performant, and accessible animations for the RiteMark landing page. All recommendations follow 2025 best practices and prioritize GPU-accelerated performance with full accessibility support.

**Key Findings:**
- CSS scroll-driven animations (2025) run on compositor thread, eliminating jank
- Animation sweet spot: 200-400ms for most interactions
- GPU-accelerated properties: `transform`, `opacity` (avoid `width`, `height`, `box-shadow`)
- `prefers-reduced-motion` is now baseline across all browsers (Oct 2025)
- Lottie animations are 600% smaller than GIFs but require optimization
- View Transitions API achieved baseline browser support (Oct 2025)

---

## 1. 10 Specific Micro-Interactions for RiteMark Landing Page

### 1.1 Hero Section Button Hover
**Effect:** Scale + shadow lift + color shift
**Duration:** 250ms
**Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard)

```css
.cta-button {
  position: relative;
  transform: translateY(0);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
}

.cta-button:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 100ms;
}

/* Accessibility: Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .cta-button {
    transition: box-shadow 200ms ease;
  }
  .cta-button:hover {
    transform: none;
  }
}
```

### 1.2 Feature Card Scroll Reveal
**Effect:** Fade-in + slide-up on scroll
**Duration:** 400ms
**Trigger:** When 20% of card is visible

```css
/* 2025: CSS Scroll-Driven Animations (GPU-accelerated) */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card {
  animation: fadeSlideUp linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}

/* Reduced motion: Fade only, no slide */
@media (prefers-reduced-motion: reduce) {
  .feature-card {
    animation: none;
    opacity: 1;
  }
}
```

### 1.3 Navigation Link Underline
**Effect:** Slide-in underline on hover
**Duration:** 300ms
**Easing:** `ease-out` (fast entrance)

```css
.nav-link {
  position: relative;
  color: #374151;
  text-decoration: none;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 300ms ease-out;
}

.nav-link:hover::after {
  width: 100%;
}

/* Focus state for keyboard navigation */
.nav-link:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 4px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-link::after {
    transition-duration: 0ms;
  }
}
```

### 1.4 Testimonial Card Magnetic Hover
**Effect:** Card follows cursor within bounds
**Duration:** 200ms (responsive feel)
**Technology:** Framer Motion (React)

```tsx
import { motion, useMotionValue, useSpring } from 'motion/react';

export function TestimonialCard({ children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Limit movement to 20px
    x.set((e.clientX - centerX) * 0.1);
    y.set((e.clientY - centerY) * 0.1);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="testimonial-card"
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
```

### 1.5 Loading Skeleton Screen
**Effect:** Pulse animation with gradient shimmer
**Duration:** 1.5s loop (perceived performance)
**Purpose:** Reduce perceived load time

```css
@keyframes skeletonPulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes skeletonShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation:
    skeletonPulse 1.5s ease-in-out infinite,
    skeletonShimmer 2s linear infinite;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: #f0f0f0;
  }
}
```

### 1.6 Success/Error Feedback Toast
**Effect:** Slide in from top + bounce
**Duration:** 400ms entrance, 300ms exit
**Easing:** Elastic for entrance, ease-in for exit

```tsx
import { motion, AnimatePresence } from 'motion/react';

export function Toast({ message, type, onClose }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          className={`toast toast--${type}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: 0.4
            }
          }}
          exit={{
            y: -100,
            opacity: 0,
            transition: { duration: 0.3, ease: 'easeIn' }
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 1.7 Parallax Scroll Hero Background
**Effect:** Background image moves slower than content (depth)
**Speed Ratio:** 0.5x (50% of scroll speed)
**Technology:** CSS scroll-driven animation

```css
.hero-background {
  position: absolute;
  inset: 0;
  background-image: url('/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  animation: parallaxScroll linear;
  animation-timeline: scroll(root);
}

@keyframes parallaxScroll {
  to {
    transform: translateY(50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-background {
    animation: none;
  }
}
```

### 1.8 SVG Logo Draw-On Effect
**Effect:** Logo paths draw on page load
**Duration:** 2s (memorable entrance)
**Technology:** CSS stroke-dasharray animation

```html
<svg class="logo" viewBox="0 0 200 100">
  <path class="logo-path" d="M..." stroke="#667eea" fill="none" stroke-width="2"/>
</svg>
```

```css
.logo-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: logoDrawOn 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes logoDrawOn {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-path {
    animation-duration: 0.1s; /* Near-instant for reduced motion */
  }
}
```

### 1.9 Gradient Button Background Animation
**Effect:** Animated gradient on hover
**Duration:** 3s loop (subtle, continuous)
**Performance:** GPU-accelerated via `background-position`

```css
.gradient-button {
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 50%,
    #667eea 100%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  transition: background-position 300ms ease-out;
}

.gradient-button:hover {
  background-position: 100% 0%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .gradient-button {
    animation: none;
    background-size: 100% 100%;
  }
}
```

### 1.10 Focus Ring Animation (Accessibility)
**Effect:** Pulsing focus indicator for keyboard navigation
**Duration:** 1.5s loop
**Purpose:** Help keyboard users see current focus

```css
.focusable:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 4px;
  border-radius: 4px;
  animation: focusPulse 1.5s ease-in-out infinite;
}

@keyframes focusPulse {
  0%, 100% { outline-color: #667eea; }
  50% { outline-color: #a78bfa; }
}

@media (prefers-reduced-motion: reduce) {
  .focusable:focus-visible {
    animation: none;
    outline-color: #667eea;
  }
}
```

---

## 2. Disney's 12 Principles Adapted for Web (2025)

### Applied Principles for RiteMark:

1. **Squash & Stretch** → Button active states (scale down on click)
2. **Anticipation** → Hover lift before click (prepare user)
3. **Staging** → Animate one element at a time (avoid chaos)
4. **Follow Through** → Spring animations with overshoot
5. **Ease In/Out** → Natural acceleration curves
   - **Ease-out** (fast → slow): Entrances, expanding
   - **Ease-in** (slow → fast): Exits, collapsing
   - **Ease-in-out**: State changes
6. **Secondary Action** → Shadow moves with button hover
7. **Timing** → 200-400ms for most UI, 100ms instant feedback

---

## 3. Modern Animation Trends (2025)

### 3.1 CSS Scroll-Driven Animations (Baseline 2025)
**Browser Support:** Chrome 111+, Firefox 144+, Safari 18+ (Oct 2025)

**Why Use:**
- Runs on compositor thread (no jank)
- No JavaScript event listeners (better performance)
- GPU-accelerated by default

**Implementation:**
```css
.scroll-fade {
  animation: fadeIn linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 3.2 View Transitions API (Baseline Oct 2025)
**Browser Support:** Chrome 111+, Edge 111+, Firefox 144+, Safari 18+

**Use Case:** Smooth page transitions without flicker

```javascript
// Same-document transition (SPA)
document.startViewTransition(() => {
  // Update DOM
  updateContent();
});

// CSS to control transition
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3.3 Lottie Animations (Optimized)
**Use Case:** Complex After Effects animations

**Performance Tips:**
- Use dotLottie format (90% smaller file size)
- Lazy load Lottie player (saves 90KB on initial load)
- Limit to 1-2 complex animations per page

**Implementation:**
```bash
# Convert to dotLottie
npx @lottiefiles/lottie-cli convert animation.json --format dotlottie
```

```tsx
import { DotLottiePlayer } from '@dotlottie/react-player';

export function HeroAnimation() {
  return (
    <DotLottiePlayer
      src="/animations/hero.lottie"
      autoplay
      loop
      style={{ width: '400px', height: '400px' }}
    />
  );
}
```

### 3.4 Cursor Interactions (Magnetic Effects)
**Trend:** Custom cursors that respond to hover

```tsx
import { motion } from 'motion/react';
import { useMotionValue } from 'motion/react';

export function MagneticCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      style={{
        x: cursorX,
        y: cursorY,
      }}
    />
  );
}
```

---

## 4. CSS vs JavaScript Animations (Decision Matrix)

### Use CSS Animations When:
✅ Simple state changes (hover, focus, active)
✅ Scroll-triggered animations (2025: use CSS scroll-driven)
✅ Looping animations (loading spinners)
✅ Transitions between two states
✅ Performance is critical (GPU-accelerated by default)

```css
/* CSS: Best for simple transitions */
.button {
  transition: transform 200ms ease-out;
}
.button:hover {
  transform: scale(1.05);
}
```

### Use JavaScript (Framer Motion/GSAP) When:
✅ Complex orchestration (multiple elements in sequence)
✅ Physics-based animations (spring, inertia)
✅ Gesture-based interactions (drag, swipe)
✅ Dynamic animations based on user input
✅ Timeline control (pause, reverse, seek)

```tsx
/* Framer Motion: Best for complex interactions */
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragElastic={0.2}
  whileTap={{ scale: 0.95 }}
/>
```

---

## 5. Performance Best Practices

### 5.1 GPU-Accelerated Properties (FAST)
✅ `transform` (translate, scale, rotate)
✅ `opacity`
✅ `filter` (some)

**Why:** These properties composite on GPU without triggering layout/paint.

```css
/* ✅ GOOD: GPU-accelerated */
.fast-animation {
  transform: translateY(0);
  opacity: 1;
  transition: transform 300ms, opacity 300ms;
}

.fast-animation:hover {
  transform: translateY(-10px);
  opacity: 0.8;
}
```

### 5.2 CPU-Intensive Properties (SLOW)
❌ `width`, `height` (triggers layout)
❌ `top`, `left`, `margin`, `padding` (triggers layout)
❌ `box-shadow` (triggers paint)
❌ `background` (triggers paint)
❌ `color` (triggers paint)

```css
/* ❌ BAD: Triggers layout reflow */
.slow-animation {
  width: 100px;
  transition: width 300ms;
}

.slow-animation:hover {
  width: 200px; /* Browser recalculates layout! */
}

/* ✅ BETTER: Use transform scale */
.fast-animation {
  transform: scaleX(1);
  transform-origin: left center;
  transition: transform 300ms;
}

.fast-animation:hover {
  transform: scaleX(2); /* GPU-composited */
}
```

### 5.3 will-change Property (Use Sparingly)
**Purpose:** Hint to browser that property will animate
**Cost:** Increases memory usage, creates new layer

```css
/* ✅ Use for frequently animated elements */
.animated-card {
  will-change: transform;
}

/* ❌ DON'T use on every element */
* {
  will-change: transform; /* Kills performance! */
}
```

**Best Practice:** Add `will-change` on hover, remove after animation:

```css
.card:hover {
  will-change: transform;
}

.card:not(:hover) {
  will-change: auto;
}
```

### 5.4 Mobile Optimization
**Rule:** Reduce motion complexity on slow devices

```css
/* Desktop: Complex animations */
@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
  .feature-card {
    animation: complexBounce 800ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
}

/* Mobile: Simpler, faster animations */
@media (max-width: 767px) {
  .feature-card {
    animation: simpleFade 400ms ease-out;
  }
}
```

---

## 6. Accessibility: prefers-reduced-motion

### What It Does
Detects if user enabled "Reduce Motion" in OS settings:
- **macOS:** System Settings > Accessibility > Display > Reduce motion
- **Windows:** Settings > Ease of Access > Display > Show animations
- **iOS/Android:** Accessibility > Motion settings

### Browser Support (2025)
✅ Baseline across all browsers (Chrome, Firefox, Safari, Edge)

### Implementation Patterns

#### Pattern 1: Disable All Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Pattern 2: Replace Motion with Fade (Recommended)
```css
.card {
  animation: slideUp 600ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    animation: fadeIn 200ms ease-out; /* Still animated, just no motion */
  }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Pattern 3: Instant for Critical Actions
```css
.button {
  transition: background-color 300ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition-duration: 0.01ms; /* Effectively instant */
  }
}
```

### Framer Motion Integration
```tsx
import { motion, useReducedMotion } from 'motion/react';

export function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.5 }}
    >
      Content
    </motion.div>
  );
}
```

---

## 7. Library Recommendations

### 7.1 CSS-Only (Best for Performance)
**Use When:** Simple transitions, scroll animations, hover effects

**Pros:**
- Zero JavaScript bundle size
- GPU-accelerated by default
- Declarative syntax

**Cons:**
- Limited control (no pause/reverse)
- Complex orchestration requires JavaScript

### 7.2 Framer Motion (Recommended for RiteMark)
**Use When:** React app with complex interactions

**Pros:**
- Declarative React API
- Spring physics built-in
- Gesture support (drag, tap, hover)
- 40KB gzipped (reasonable size)
- Excellent TypeScript support

**Installation:**
```bash
npm install motion
```

**Example:**
```tsx
import { motion } from 'motion/react';

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click Me
</motion.button>
```

### 7.3 GSAP + ScrollTrigger (For Advanced Scroll)
**Use When:** Complex scroll-linked animations, timeline control

**Pros:**
- Industry standard (used by Apple, Google)
- Powerful timeline API
- ScrollTrigger plugin for scroll animations
- Works with any framework

**Cons:**
- Larger bundle size (47KB gzipped)
- Imperative API (not React-native)

**Installation:**
```bash
npm install gsap
```

**Example:**
```javascript
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.to('.feature-card', {
  opacity: 1,
  y: 0,
  duration: 0.8,
  stagger: 0.2,
  scrollTrigger: {
    trigger: '.features-section',
    start: 'top 80%',
    end: 'bottom 20%',
    toggleActions: 'play none none reverse'
  }
});
```

### 7.4 Lottie (For Complex Illustrations)
**Use When:** After Effects animations, brand animations

**Pros:**
- Vector-based (scalable)
- 600% smaller than GIFs
- Interactive controls

**Cons:**
- Requires optimization (dotLottie format)
- Creates many DOM elements (performance impact)

**Installation:**
```bash
npm install @dotlottie/react-player
```

---

## 8. Animation Timeline for RiteMark Landing Page

### Page Load Sequence (First 3 seconds)

**0ms - 100ms: Critical Content**
- Hero text fades in (instant, no delay)
- Navigation appears (no animation, accessibility)

**100ms - 500ms: Logo Draw-On**
- SVG logo paths draw on screen (2s duration)
- Creates memorable entrance

**500ms - 1000ms: Hero CTA**
- Primary button slides up + fades in (400ms)
- Secondary button follows with 100ms stagger

**1000ms - 2000ms: Background Elements**
- Parallax background starts (scroll-linked)
- Gradient overlay animates subtly

### Scroll-Triggered Animations

**Features Section (scroll to 20% visible):**
- Each feature card: fade + slide up (400ms)
- Stagger: 100ms between cards
- Icons pulse on appear (once)

**Testimonials Section (scroll to 30% visible):**
- Cards fade in (no slide, accessibility)
- Magnetic hover activates after appear

**CTA Section (scroll to 50% visible):**
- Background gradient animates
- Button pulses gently (attention-grabbing)

### User Interaction Animations

**Button Hover (instant response):**
- Transform: 0ms (feels instant)
- Shadow: 250ms ease-out
- Color: 200ms linear

**Form Input Focus:**
- Border color: 150ms ease-out
- Label slide up: 200ms cubic-bezier
- Error shake: 400ms (if validation fails)

**Success Toast:**
- Slide in: 400ms spring
- Auto-dismiss: After 3s
- Slide out: 300ms ease-in

---

## 9. Copy-Pastable Code Snippets

### Snippet 1: Button with All States
```css
.button {
  /* Base styles */
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;

  /* Animation properties */
  transform: translateY(0) scale(1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
}

.button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition-duration: 100ms;
}

.button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 4px;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .button {
    transition: box-shadow 200ms ease;
  }
  .button:hover,
  .button:active {
    transform: none;
  }
}
```

### Snippet 2: Scroll Fade-In Cards (CSS Only)
```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  /* CSS Scroll-Driven Animation (2025) */
  animation: fadeSlideUp linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}

/* Stagger effect for multiple cards */
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 100ms; }
.card:nth-child(3) { animation-delay: 200ms; }

@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Snippet 3: Loading Skeleton with Shimmer
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
  border-radius: 8px;
}

/* Skeleton shapes */
.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: #f0f0f0;
  }
}
```

### Snippet 4: Magnetic Button (Framer Motion)
```tsx
import { motion, useMotionValue, useSpring } from 'motion/react';

export function MagneticButton({ children, ...props }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Magnetic pull (max 20px)
    const maxDistance = 20;
    x.set(Math.min(maxDistance, (e.clientX - centerX) * 0.2));
    y.set(Math.min(maxDistance, (e.clientY - centerY) * 0.2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      {...props}
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
```

### Snippet 5: Parallax Scroll Background
```css
.parallax-section {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.parallax-background {
  position: absolute;
  inset: 0;
  background-image: url('/hero-bg.jpg');
  background-size: cover;
  background-position: center;

  /* CSS Scroll-Driven Parallax */
  animation: parallaxMove linear;
  animation-timeline: scroll(root);
}

@keyframes parallaxMove {
  to {
    transform: translateY(50%);
  }
}

.parallax-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .parallax-background {
    animation: none;
  }
}
```

---

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Install Framer Motion: `npm install motion`
- [ ] Create global animation CSS variables
- [ ] Implement `prefers-reduced-motion` base styles
- [ ] Add focus-visible styles for keyboard navigation

### Phase 2: Micro-Interactions (Week 1-2)
- [ ] Button hover/active states (all CTAs)
- [ ] Navigation link underlines
- [ ] Form input focus animations
- [ ] Loading skeleton screens

### Phase 3: Scroll Animations (Week 2)
- [ ] Feature cards scroll reveal (CSS scroll-driven)
- [ ] Testimonials fade-in
- [ ] Parallax hero background
- [ ] CTA section entrance

### Phase 4: Advanced Interactions (Week 3)
- [ ] Magnetic hover on testimonial cards
- [ ] SVG logo draw-on effect
- [ ] Success/error toast notifications
- [ ] Gradient button animations

### Phase 5: Performance Optimization (Week 3-4)
- [ ] Audit with Lighthouse (animations <50ms impact)
- [ ] Test on mobile devices (reduce complexity if needed)
- [ ] Optimize Lottie files (dotLottie format)
- [ ] Lazy load animation libraries

### Phase 6: Accessibility Testing (Week 4)
- [ ] Test with reduced motion enabled (macOS/Windows)
- [ ] Keyboard navigation (focus states visible)
- [ ] Screen reader compatibility (animations don't block content)
- [ ] Seizure risk audit (no rapid flashing >3Hz)

---

## 11. Performance Metrics (Target Goals)

### Lighthouse Performance
- **Target:** >90 score (with all animations)
- **Animation Impact:** <50ms on Total Blocking Time
- **First Contentful Paint:** <1.8s
- **Largest Contentful Paint:** <2.5s

### Animation Performance
- **Frame Rate:** 60fps (16.67ms per frame)
- **Jank:** <5% frames dropped
- **CPU Usage:** <30% during animations
- **Memory:** <50MB for animation libraries

### Bundle Size
- **Framer Motion:** 40KB gzipped (acceptable)
- **GSAP + ScrollTrigger:** 47KB gzipped (use sparingly)
- **Lottie Player:** 30KB + animation files (lazy load)
- **Total Animation Budget:** <150KB

---

## 12. Resources & References

### Official Documentation
- [Framer Motion Docs](https://motion.dev/)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [MDN: CSS Scroll-Driven Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### Performance Tools
- [Chrome DevTools Performance Panel](https://developer.chrome.com/docs/devtools/performance/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Learning Resources
- [Motion Guide](https://motion.mighty.guide/) - Framer Motion course
- [GSAP Learning](https://gsap.com/resources/learn/) - Official tutorials
- [CSS Scroll Effects](https://prismic.io/blog/css-scroll-effects) - 50 examples
- [Lottie Optimization](https://lottiefiles.com/optimize-your-lottie-animation-pages)

### Inspiration
- [Awwwards](https://www.awwwards.com/) - Award-winning web animations
- [Codrops](https://tympanus.net/codrops/) - Creative coding tutorials
- [Motion Examples](https://examples.motion.dev/react) - 300+ Motion examples

---

## Conclusion

This research document provides a complete foundation for implementing delightful, performant, and accessible animations on the RiteMark landing page. All recommendations follow 2025 best practices and prioritize:

1. **Performance:** GPU-accelerated properties, CSS scroll-driven animations
2. **Accessibility:** Full `prefers-reduced-motion` support, focus states
3. **Modern Stack:** Framer Motion for React, CSS-first approach
4. **User Experience:** 200-400ms timing, natural easing curves

**Next Steps:**
1. Review implementation checklist with development team
2. Set up animation performance budget
3. Begin Phase 1 implementation (foundation)
4. Test early and often with real users

---

**Document Version:** 1.0
**Last Updated:** October 22, 2025
**Research Agent:** Claude (Researcher role)
**Status:** Complete - Ready for implementation
