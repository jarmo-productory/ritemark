# Sprint 6: Enhanced Editor Features - Research Report

## Executive Summary

This comprehensive research report analyzes TipTap/ProseMirror extensions and capabilities for Sprint 6 "Enhanced Editor Features". The current RiteMark editor uses TipTap 3.4.3 with StarterKit, custom list configurations, and Table of Contents integration. Our research identifies key opportunities for code blocks with syntax highlighting, text selection improvements, and additional core formatting features while maintaining the Johnny Ive invisible interface design philosophy.

## Current Editor Implementation Analysis

### Existing Extensions
- **StarterKit** (3.4.3): Core editing functionality with custom configurations
- **BulletList/OrderedList/ListItem**: Custom-configured list extensions
- **Placeholder**: Dynamic placeholder text support
- **Headings**: All levels (H1-H6) with custom styling
- **Link**: Currently disabled to avoid duplicate extension warnings

### Architecture Strengths
- Clean, invisible interface design with extensive CSS customization
- Mobile-first responsive design (18px font, 1.7 line-height)
- Custom list behavior with intelligent enter key handling
- Professional typography with system font stack
- Selection styling with subtle blue highlight (rgba(59, 130, 246, 0.1))

### Integration Points
- Table of Contents system using ProseMirror state-based navigation
- Event-driven content updates
- Mobile-optimized touch interactions

## Research Findings

### 1. Code Block Implementation

#### Extension Analysis: @tiptap/extension-code-block-lowlight

**Latest Version**: 3.4.3 (actively maintained, published 1 day ago)
**Bundle Size**: Core lowlight ~12.7 kB gzipped, language definitions 300-500 bytes each

**Key Features**:
- Triple backtick (```) and triple tilde (~~~) triggers
- Language specification support (e.g., ```javascript)
- Automatic language detection via lowlight
- Custom language configuration capability
- CSS styling required for visual highlighting

**Implementation Requirements**:
```javascript
import { lowlight } from 'lowlight'
import { createLowlight } from 'lowlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

// Must disable StarterKit's codeBlock to avoid conflicts
StarterKit.configure({
  codeBlock: false
})

// Add CodeBlockLowlight with language support
CodeBlockLowlight.configure({
  lowlight: createLowlight(common), // or specific languages
})
```

**Johnny Ive Interface Considerations**:
- Invisible language selector appearing on hover/focus
- Minimal visual chrome with rounded corners
- Subtle background differentiation (light gray, not harsh borders)
- Copy button that appears only on interaction
- Mobile-friendly language selection via touch

#### Alternative: @tiptap/extension-code-block

**Bundle Size**: Smaller (~5kB), no syntax highlighting
**Best For**: Simple code blocks without syntax highlighting needs
**Pros**: Lighter weight, simpler implementation
**Cons**: No syntax highlighting, less developer-friendly

#### Syntax Highlighting Library Comparison

| Library | Core Size (Gzipped) | Performance | Language Support | Mobile-Friendly |
|---------|-------------------|-------------|------------------|-----------------|
| **Lowlight/Prism** | 2KB core + 300-500B/lang | ⭐⭐⭐⭐⭐ Fast | 200+ languages | ⭐⭐⭐⭐ Good |
| **Highlight.js** | 28KB (common) to 188KB (full) | ⭐⭐⭐ Moderate | 185+ languages | ⭐⭐⭐ Good |
| **Prism (direct)** | 2KB core + languages | ⭐⭐⭐⭐⭐ Fast | 200+ languages | ⭐⭐⭐⭐ Good |

**Recommendation**: **Lowlight with Prism** for optimal balance of performance, size, and language support.

### 2. Text Selection Improvements

#### Current Capabilities
- Basic ProseMirror selection with custom blue highlighting
- Selection commands (selectAll, deleteSelection)
- Focus/blur management
- Mobile touch selection support

#### Enhancement Opportunities

**Available Extensions**:
- **BubbleMenu**: Context-sensitive formatting toolbar (250ms debounce)
- **FloatingMenu**: Appears in empty paragraphs for quick formatting
- **Selection-based Extensions**: Custom selection behavior modifications

**Multi-Cursor Status**:
❌ **Not Available** - Multi-cursor editing (VSCode-style) is not supported in TipTap/ProseMirror as of 2024. Active community discussions show demand but no implementation.

**Achievable Improvements**:
1. **Enhanced Selection Visual Feedback**
   - Better selection handles on mobile
   - Improved selection boundaries visualization
   - Custom selection colors for different content types

2. **Selection-Based Context Menus**
   - BubbleMenu for text formatting (bold, italic, link)
   - Smart context awareness (show code formatting for inline code)
   - Touch-optimized menu positioning

3. **Keyboard Selection Enhancements**
   - Word/paragraph selection shortcuts
   - Selection state persistence
   - Improved selection boundaries for complex content

**Implementation Approach**:
```javascript
import { BubbleMenu } from '@tiptap/extension-bubble-menu'

BubbleMenu.configure({
  element: bubbleMenuElement,
  tippyOptions: {
    duration: 100,
    placement: 'top',
  },
})
```

### 3. Editor Capability Gap Analysis

#### Missing Core Features from StarterKit

**StarterKit 3.4.3 Includes**:
- Blockquote, BulletList, CodeBlock, Document, HardBreak
- Heading, HorizontalRule, ListItem, OrderedList, Paragraph, Text
- Bold, Code, Italic, Link, Strike, Underline
- Dropcursor, Gapcursor, History, ListKeymap, TrailingNode

**Critical Missing Features**:

1. **Table Support**
   - Extension: `@tiptap/extension-table`
   - Bundle size: ~15kB
   - Features: Table creation, row/column management, cell formatting
   - Mobile considerations: Responsive table scrolling, touch-friendly resize

2. **Image Support**
   - Extension: `@tiptap/extension-image`
   - Bundle size: ~8kB
   - Features: Image insertion, resizing, alt text, captions
   - Integration: Drag & drop, paste support, Google Drive integration

3. **Enhanced Link Management**
   - Current link extension disabled due to conflicts
   - Need link editing interface, auto-linking, link previews
   - Mobile-friendly link creation/editing

4. **Media Extensions**
   - YouTube: `@tiptap/extension-youtube` (~5kB)
   - General video embedding capabilities
   - Audio support for multimedia content

5. **Text Formatting Enhancements**
   - Subscript/Superscript: `@tiptap/extension-subscript`, `@tiptap/extension-superscript`
   - Color/Highlight: `@tiptap/extension-color`, `@tiptap/extension-highlight`
   - Text alignment: `@tiptap/extension-text-align`

#### Mobile-Specific Improvements Needed

**Touch Experience**:
- Larger touch targets for formatting buttons
- Swipe gestures for content navigation
- Touch-optimized selection handles
- Responsive toolbar that adapts to screen size

**Performance Optimizations**:
- Virtual scrolling for large documents
- Lazy loading of editor extensions
- Optimized re-rendering for mobile hardware

### 4. Technical Integration Analysis

#### Bundle Size Impact Assessment

**Current Bundle Baseline**:
- @tiptap/starter-kit: ~85kB minified+gzipped
- Current implementation: ~90kB with custom extensions

**Proposed Additions Impact**:
```
Code Block (Lowlight): +12.7kB + languages (300-500B each)
Table Extension: +15kB
Image Extension: +8kB
BubbleMenu: +5kB
Additional formatting: +10kB

Total Impact: ~50kB additional (56% increase)
Final Size: ~140kB (still reasonable for rich editor)
```

#### Performance Considerations

**Optimization Strategies**:
1. **Lazy Loading**: Load extensions on-demand
2. **Language Selection**: Only include needed syntax highlighting languages
3. **Tree Shaking**: Proper ES6 module imports
4. **Code Splitting**: Separate editor features by route/usage

**Integration with Existing Systems**:
- **Table of Contents**: New headings in tables/code blocks need TOC integration
- **Google Drive Sync**: Image handling requires Drive API integration
- **Mobile Performance**: Touch event optimization for new extensions

#### Conflict Resolution

**Known Conflicts**:
1. **StarterKit CodeBlock vs CodeBlockLowlight**: Disable StarterKit version
2. **Link Extension**: Resolve duplicate warnings with proper configuration
3. **List Extensions**: Ensure custom list behavior compatibility

**Testing Requirements**:
- Cross-browser compatibility (Safari, Chrome, Firefox)
- Mobile device testing (iOS Safari, Android Chrome)
- Performance testing with large documents
- Accessibility testing with screen readers

### 5. Johnny Ive Invisible Interface Design Implementation

#### Design Philosophy Application

**Core Principles**:
- Remove visible UI chrome until needed
- Progressive disclosure of functionality
- Intuitive gesture-based interactions
- Typography-focused content presentation

**Code Block Interface Design**:
```css
/* Invisible interface approach */
.code-block {
  border: none;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  transition: all 0.2s ease;
}

.code-block:hover {
  background: rgba(0,0,0,0.04);
}

.code-block .language-selector {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.code-block:focus-within .language-selector,
.code-block:hover .language-selector {
  opacity: 1;
}
```

**BubbleMenu Interface Design**:
```css
.bubble-menu {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  padding: 4px;
}

.bubble-menu button {
  border: none;
  background: transparent;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.bubble-menu button:hover {
  background: rgba(0,0,0,0.05);
}
```

#### Mobile-First Considerations

**Touch-Optimized Controls**:
- Minimum 44px touch targets
- Generous spacing between interactive elements
- Swipe gestures for formatting panels
- Long-press for context menus

**Responsive Behavior**:
- Collapsible toolbar on narrow screens
- Adaptive menu positioning
- Touch-friendly drag handles for tables/images

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. **Resolve Link Extension Conflicts**
   - Enable @tiptap/extension-link properly
   - Remove duplicate extension warnings
   - Test link functionality

2. **Code Block Implementation**
   - Install @tiptap/extension-code-block-lowlight
   - Configure lowlight with common languages (JS, CSS, HTML, Python, JSON)
   - Implement Johnny Ive interface design
   - Add copy-to-clipboard functionality

### Phase 2: Core Features (Week 2)
3. **Table Support**
   - Add @tiptap/extension-table
   - Implement responsive table design
   - Add mobile-friendly table editing

4. **Enhanced Text Selection**
   - Implement BubbleMenu for text formatting
   - Add selection visual improvements
   - Optimize touch selection experience

### Phase 3: Media & Polish (Week 3)
5. **Image Support**
   - Add @tiptap/extension-image
   - Integrate with Google Drive for image storage
   - Implement responsive image handling

6. **Performance Optimization**
   - Implement lazy loading for extensions
   - Optimize bundle size with tree shaking
   - Add performance monitoring

### Phase 4: Advanced Features (Week 4)
7. **Additional Formatting**
   - Add subscript/superscript support
   - Implement text alignment options
   - Add color/highlight capabilities

8. **Mobile Experience Enhancement**
   - Optimize touch interactions
   - Implement gesture controls
   - Add mobile-specific UI patterns

## Technical Specifications

### Dependencies to Add
```json
{
  "dependencies": {
    "@tiptap/extension-code-block-lowlight": "^3.4.3",
    "@tiptap/extension-table": "^3.4.3",
    "@tiptap/extension-image": "^3.4.3",
    "@tiptap/extension-bubble-menu": "^3.4.3",
    "@tiptap/extension-subscript": "^3.4.3",
    "@tiptap/extension-superscript": "^3.4.3",
    "@tiptap/extension-text-align": "^3.4.3",
    "lowlight": "^3.1.0"
  }
}
```

### Configuration Example
```javascript
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false, // Disable to use CodeBlockLowlight
    }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'plaintext',
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    BubbleMenu.configure({
      element: bubbleMenuRef.current,
    }),
  ],
})
```

## Risk Assessment

### High Priority Risks
1. **Bundle Size Impact**: 56% increase may affect mobile performance
   - Mitigation: Implement lazy loading and code splitting
2. **Mobile Touch Performance**: Additional extensions may impact responsiveness
   - Mitigation: Thorough mobile device testing and optimization
3. **Extension Conflicts**: Multiple extensions may conflict
   - Mitigation: Comprehensive testing and careful configuration

### Medium Priority Risks
1. **Learning Curve**: Complex features may confuse non-technical users
   - Mitigation: Progressive disclosure and intuitive defaults
2. **Accessibility Impact**: New features may break screen reader support
   - Mitigation: WCAG compliance testing for all new features

### Low Priority Risks
1. **Google Drive Integration**: Image storage complexity
   - Mitigation: Phase implementation with fallback options

## Success Metrics

### Performance Targets
- Bundle size increase < 60%
- First contentful paint < 2s on 3G
- Time to interactive < 3s on mobile

### User Experience Goals
- Code block creation in < 3 clicks/taps
- Table editing intuitive for non-technical users
- Mobile editing experience equivalent to desktop

### Technical Quality
- 95%+ test coverage for new features
- Zero accessibility regressions
- Cross-browser compatibility maintained

## Conclusion

The research reveals significant opportunities to enhance RiteMark's editor capabilities while maintaining its Johnny Ive invisible interface philosophy. The proposed roadmap prioritizes high-impact features (code blocks, tables, enhanced selection) while carefully managing bundle size and mobile performance. Key success factors include proper lazy loading implementation, thorough mobile testing, and maintaining the clean, invisible interface design that differentiates RiteMark from other markdown editors.

The modular nature of TipTap's extension system allows for incremental implementation and rollback capability if performance issues arise. With careful implementation following the provided roadmap, RiteMark can achieve its goal of becoming "Google Docs for Markdown" while maintaining superior mobile experience and invisible interface design.