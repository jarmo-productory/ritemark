# Copy-Paste Integration Guide

## Quick Steps

### 1. Update Desktop Navigation (line ~689)

**FIND:**
```html
<nav class="nav" role="navigation" aria-label="Main navigation">
  <a href="#features" class="nav-link">Features</a>
  <a href="#how-it-works" class="nav-link">How It Works</a>
  <a href="#faq" class="nav-link">FAQ</a>
</nav>
```

**REPLACE WITH:**
```html
<nav class="nav" role="navigation" aria-label="Main navigation">
  <a href="#features" class="nav-link">Features</a>
  <a href="#how-it-works" class="nav-link">What's New</a>
  <a href="#security" class="nav-link">Security</a>
  <a href="#faq" class="nav-link">FAQ</a>
</nav>
```

---

### 2. Update Mobile Navigation (line ~707)

**FIND:**
```html
<nav class="mobile-nav" id="mobile-nav" role="navigation" aria-label="Mobile navigation">
  <a href="#features" class="mobile-nav-link">Features</a>
  <a href="#how-it-works" class="mobile-nav-link">How It Works</a>
  <a href="#faq" class="mobile-nav-link">FAQ</a>
  <a href="/app" class="mobile-nav-cta">Start Writing Free</a>
</nav>
```

**REPLACE WITH:**
```html
<nav class="mobile-nav" id="mobile-nav" role="navigation" aria-label="Mobile navigation">
  <a href="#features" class="mobile-nav-link">Features</a>
  <a href="#how-it-works" class="mobile-nav-link">What's New</a>
  <a href="#security" class="mobile-nav-link">Security</a>
  <a href="#faq" class="mobile-nav-link">FAQ</a>
  <a href="/app" class="mobile-nav-cta">Start Writing Free</a>
</nav>
```

---

### 3. Insert Security Section (BEFORE Footer, line ~1002)

**FIND THIS LINE:**
```html
  <!-- Footer -->
  <footer class="footer">
```

**INSERT THIS ENTIRE BLOCK BEFORE IT:**

*(Copy the complete contents of `/Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/security-section.html`)*

**OR use this command to see the content:**
```bash
cat /Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/security-section.html
```

---

## Verification

After making changes, verify:

1. **Navigation links work:**
   - Click "Security" in header → scrolls to #security section
   - Mobile menu also has "Security" link

2. **Section renders correctly:**
   - 6 security cards display
   - 3 trust badges display
   - Security contact info displays

3. **Responsive layout:**
   - Desktop (1024px+): 3 columns
   - Tablet (640px+): 2 columns
   - Mobile: 1 column

4. **Hover effects:**
   - Cards lift on hover
   - Border color changes
   - Links underline

## Test in Browser

```bash
# Start development server (if not already running)
cd /Users/jarmotuisk/Projects/ritemark/ritemark-app
npm run dev

# Open in browser
open http://localhost:5173/landing.html
```

## CSS Already Applied

✅ Security styles have been automatically appended to `/ritemark-app/dist/landing.css`

No manual CSS work needed!

---

## File Locations

- **HTML to edit**: `/Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/landing.html`
- **Security HTML**: `/Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/security-section.html`
- **CSS (auto-updated)**: `/Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/landing.css`
- **Backup**: `/Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/landing.html.backup`

---

**Quick Command to View Security HTML:**
```bash
cat /Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/security-section.html
```

**Quick Command to Restore Backup (if needed):**
```bash
cp /Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/landing.html.backup /Users/jarmotuisk/Projects/ritemark/ritemark-app/dist/landing.html
```
