# TOC Scroll Navigation Research - Technical Analysis

## Problem Summary
React TipTap editor Table of Contents component has inconsistent scroll behavior - it scrolls UP to headings above the viewport but fails to scroll DOWN to headings below the current position.

## Research Findings

### 1. TipTap/ProseMirror Specific Issues

#### Official TipTap TableOfContents Extension
- **Key Configuration**: Must set `scrollParent` configuration to the editor's DOM element
- **Example**: `TableOfContents.configure({ scrollParent: () => editor.view.dom })`
- **React Pattern**: Use `onUpdate` callback for state management

#### ProseMirror Editor Properties
Native scroll handling via editorProps:
```javascript
const editor = useEditor({
  editorProps: {
    scrollThreshold: 80,
    scrollMargin: 80,
  },
});
```

#### Known TipTap Issues
- `scrollIntoView()` doesn't work when ProseMirror has focus
- Solution: Blur the editor before scrolling
- Alternative: Find DOM node manually instead of using TipTap objects

### 2. ScrollIntoView Browser Inconsistencies

#### Common Problems
- **Partial scrolling**: "doesn't scroll all the way down, stays a few pixels from bottom"
- **Page movement**: "causing the whole page to move" in flexbox layouts
- **URL changes**: Adding '?' to URL in React applications
- **Browser differences**: Inconsistent behavior across Chrome, Firefox, Safari

#### Working Solutions

**Option 1: Use `block: 'nearest'`**
```javascript
element.scrollIntoView({
  behavior: 'smooth',
  block: 'nearest', // Instead of 'start' or 'center'
  inline: 'center'
})
```

**Option 2: Prevent Event Bubbling**
```javascript
onClick={(event) => {
  event.preventDefault()
  event.stopPropagation()
  scrollToHeading(element)
}}
```

**Option 3: Complete Configuration**
```javascript
element.scrollIntoView({
  behavior: 'smooth',
  inline: 'center',
  block: 'center' // More consistent across browsers
})
```

### 3. Fixed Sidebar + Flexbox Layout Issues

#### Root Cause
- Fixed positioning affects scroll context
- Flexbox justify-content can interfere with scroll calculations
- Scroll containers may not be correctly identified

#### CSS-Based Solutions

**Scroll Margin Approach:**
```css
html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px; /* Account for fixed headers */
}

h1, h2, h3, h4, h5, h6 {
  scroll-margin-top: 80px; /* Individual element offset */
}
```

**Modern Target Selector:**
```css
:target {
  scroll-margin-top: 80px;
}
```

#### Layout Fixes
- Use `overflow: clip` on over-scrolling parent elements
- For WebKit: Consider `Element.scrollIntoViewIfNeeded()` (non-standard)
- Identify correct scroll container (document.scrollingElement vs editor DOM)

### 4. Manual Scroll Calculation Patterns

#### Reliable Manual Method
```javascript
const scrollToElement = (element) => {
  // Use document.scrollingElement for proper scroll container
  const scroller = document.scrollingElement || document.documentElement
  const currentTop = scroller.scrollTop
  const targetTop = currentTop + element.getBoundingClientRect().top - offset

  scroller.scrollTo({
    top: targetTop,
    behavior: 'smooth'
  })
}
```

#### Alternative Calculation
```javascript
const elementRect = element.getBoundingClientRect()
const scrollTop = window.pageYOffset || document.documentElement.scrollTop
const elementTop = elementRect.top + scrollTop
window.scrollTo({ top: elementTop - 80, behavior: 'smooth' })
```

### 5. React-Specific Solutions

#### Component Lifecycle Timing
```javascript
// Use componentDidUpdate or useEffect with proper dependencies
useEffect(() => {
  if (shouldScroll) {
    requestAnimationFrame(() => {
      element.scrollIntoView({ block: "nearest", behavior: "smooth" })
    })
  }
}, [headings])
```

#### Event Handling Pattern
```javascript
const handleTOCClick = useCallback((element) => {
  // 1. Blur any focused element (especially ProseMirror)
  if (document.activeElement) {
    document.activeElement.blur()
  }

  // 2. Use requestAnimationFrame for timing
  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}, [])
```

## Recommended Solution Stack

### Priority 1: CSS-First Approach
1. Set `scroll-padding-top` on html element
2. Set `scroll-margin-top` on heading elements
3. Use native `scrollIntoView()` with `block: 'nearest'`

### Priority 2: JavaScript Enhancements
1. Blur ProseMirror editor before scrolling
2. Use `requestAnimationFrame` for timing
3. Prevent event bubbling with `preventDefault`

### Priority 3: Manual Fallback
1. Use `document.scrollingElement` as scroll container
2. Calculate position with `getBoundingClientRect()`
3. Apply manual offset for fixed elements

## Browser Support Notes
- Chrome: `block: 'nearest'` works well
- Firefox: May need `overflow: -moz-hidden-unscrollable`
- Safari: WebKit-specific `scrollIntoViewIfNeeded()` available
- Cross-browser: Manual calculation most reliable

## Implementation Status
Current implementation uses manual calculation but may benefit from CSS-first approach combined with ProseMirror-specific fixes (blur editor, proper timing).

---

**Sources**: Stack Overflow, MDN Web Docs, TipTap Documentation, DEV Community discussions
**Research Date**: September 15, 2025
**Status**: Active investigation - CSS + timing approach recommended