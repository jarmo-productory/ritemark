# Sprint 6: Enhanced TipTap Editor Features Research

**Research Goal**: Comprehensive analysis of TipTap enhanced editor features for WYSIWYG markdown editing
**Focus Areas**: Code blocks, ordered lists, text selection, modern markdown features, accessibility
**Design Philosophy**: Maintain "Johnny Ive invisible interface" while adding powerful functionality
**Target Completion**: Sprint 6 Implementation Phase

## 📋 Executive Summary

This research provides comprehensive analysis of TipTap's enhanced editor capabilities for Sprint 6 implementation. Based on extensive investigation of TipTap 3.4.3+ features, the findings reveal robust support for advanced editing functionality while maintaining excellent accessibility and performance standards.

**Key Findings:**
- **Code Blocks**: TipTap offers multiple syntax highlighting solutions with CodeBlockLowlight being the recommended approach
- **Ordered Lists**: Native extension with excellent UX patterns and keyboard shortcuts
- **Text Selection**: Built on ProseMirror's robust selection system with comprehensive API controls
- **Accessibility**: Strong WCAG 2.1 compliance with dedicated accessibility features
- **Performance**: Optimized architecture with specific performance guidance for complex features

## 🔬 Technical Analysis

### 1. Code Block Implementation with Syntax Highlighting

#### TipTap Code Block Extensions Overview

TipTap provides three primary approaches for code block implementation:

**1. Basic CodeBlock Extension**
- ✅ Simple implementation
- ❌ No built-in syntax highlighting
- ❌ Requires additional CSS styling
- **Use Case**: Minimal code display without highlighting needs

**2. CodeBlockLowlight Extension (RECOMMENDED)**
- ✅ Built on lowlight/highlight.js ecosystem
- ✅ Extensive language support
- ✅ Active maintenance and updates
- ✅ Performance optimized
- **Dependencies**: `lowlight`, `highlight.js`

**3. CodeBlockShiki Extension (Alternative)**
- ✅ Modern Shiki-based highlighting
- ✅ VS Code-quality themes
- ❌ Larger bundle size
- ❌ Async loading complexity
- **Dependencies**: `shiki`, `tiptap-extension-code-block-shiki`

#### Implementation Complexity Assessment

**CodeBlockLowlight Setup (Recommended):**
```typescript
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'

// Complexity: LOW
const lowlight = createLowlight(common)

// Configuration
CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'plaintext'
})
```

**Key Technical Considerations:**
- **Extension Conflicts**: Must disable StarterKit's default codeBlock to avoid duplicate extension warnings
- **CSS Requirements**: Syntax highlighting requires additional CSS styling (highlight.js themes)
- **Language Loading**: Languages can be loaded on-demand for performance optimization
- **Bundle Impact**: Core lowlight + common languages ≈ 150KB additional bundle size

#### UX Patterns for Code Blocks

**Markdown-Style Entry:**
- Type ``` (three backticks + space) → auto-converts to code block
- Type ```javascript → creates JavaScript code block with syntax highlighting
- Type ~~~ (three tildes + space) → alternative syntax for code blocks

**Visual Design Best Practices:**
- **Background**: Subtle gray background (#f8f9fa) for distinction
- **Borders**: Minimal 1px border with border-radius for modern appearance
- **Typography**: Monospace font (SF Mono, Monaco, 'Cascadia Code')
- **Padding**: Generous internal padding (1rem) for readability
- **Line Numbers**: Optional feature for complex code examples

### 2. Ordered/Numbered List Extensions and UX Patterns

#### TipTap OrderedList Extension Analysis

**Core Functionality:**
- ✅ Native HTML `<ol>` rendering
- ✅ Automatic numbering management
- ✅ Nested list support
- ✅ Seamless integration with BulletList
- ✅ Keyboard shortcut support

**Auto-formatting Behavior:**
```
Type "1." → Automatically converts to ordered list
Type "1)" → Alternative auto-conversion pattern
Tab → Increase nesting level
Shift+Tab → Decrease nesting level
Enter → Create new list item
Enter (on empty item) → Exit list
```

#### UX Pattern Analysis

**Industry Standard Patterns:**
- **Google Docs**: Auto-numbering with indent/outdent controls
- **Notion**: Type-ahead with immediate conversion
- **Microsoft Word**: Rich formatting with multiple numbering styles

**TipTap Implementation Strengths:**
- **Intuitive Keyboard Behavior**: Enter key creates new items, empty item + Enter exits list
- **Visual Feedback**: Immediate numbering updates on structural changes
- **Accessibility**: Semantic `<ol>` markup for screen readers
- **Mobile-Friendly**: Touch-optimized interactions

#### List Navigation and Keyboard UX

**Best Practice Keyboard Patterns:**
```typescript
// Enhanced list behavior patterns
handleKeyDown: (view, event) => {
  if (event.key === 'Enter') {
    const { $from } = view.state.selection
    if ($from.parent.type.name === 'listItem') {
      const isEmpty = $from.parent.textContent.trim() === ''
      if (isEmpty) {
        // Exit list on empty item + Enter
        return editor.commands.liftListItem('listItem')
      }
    }
  }

  if (event.key === 'Tab' && !event.shiftKey) {
    return editor.commands.sinkListItem('listItem')
  }

  if (event.key === 'Tab' && event.shiftKey) {
    return editor.commands.liftListItem('listItem')
  }

  return false
}
```

### 3. Text Selection Improvements and User Experience

#### ProseMirror Selection Foundation

TipTap is built on ProseMirror's robust selection system, providing:

**Selection Types:**
- **TextSelection**: Standard text cursor and ranges
- **NodeSelection**: Entire node selection (images, code blocks)
- **AllSelection**: Complete document selection
- **GapCursor**: Between-node cursor positioning

#### Selection API and Controls

**Programmatic Selection Management:**
```typescript
// Set cursor to specific position
editor.commands.setTextSelection(10)

// Select text range
editor.commands.setTextSelection({ from: 5, to: 10 })

// Focus management
editor.commands.focus()

// Selection state access
const { from, to } = editor.state.selection
const selectedText = editor.state.doc.textBetween(from, to)
```

#### UX Enhancement Opportunities

**Visual Selection Improvements:**
```css
/* Enhanced selection styling */
.ProseMirror ::selection {
  background: rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(1px);
}

/* Focus state improvements */
.ProseMirror:focus {
  outline: 2px solid rgba(59, 130, 246, 0.3);
  outline-offset: 2px;
}
```

**Selection Behavior Optimizations:**
- **Focus Restoration**: Automatic focus restoration after toolbar interactions
- **Command Chaining**: Batch selection operations for performance
- **Cross-Node Selection**: Improved behavior when selecting across different node types

### 4. Modern Markdown Features for WYSIWYG Editing

#### TipTap Modern Feature Set (2024)

**Core Markdown Features:**
- ✅ **Headings**: H1-H6 with # shortcuts
- ✅ **Lists**: Bullet and ordered with auto-formatting
- ✅ **Emphasis**: Bold (**text**) and italic (*text*)
- ✅ **Links**: Auto-linking with URL detection
- ✅ **Code**: Inline `code` and code blocks

**Enhanced Features Available:**
- ✅ **Tables**: Full table editing with TipTap Table extension
- ✅ **Task Lists**: Checkboxes with interactive behavior
- ✅ **Blockquotes**: > prefix auto-conversion
- ✅ **Horizontal Rules**: --- auto-conversion
- ✅ **Strikethrough**: ~~text~~ formatting

#### Table Implementation Analysis

**TipTap Table Extension:**
```typescript
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

// Configuration
Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: 'tiptap-table',
  },
})
```

**Table UX Patterns:**
- **Creation**: Type `| Column 1 | Column 2 |` → auto-converts to table
- **Navigation**: Tab/Shift+Tab between cells
- **Editing**: Click to edit, double-click to select cell
- **Resizing**: Drag column borders for width adjustment

#### Task List Implementation

**Task List Extension:**
```typescript
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

TaskList.configure({
  HTMLAttributes: {
    class: 'tiptap-task-list',
  },
})

TaskItem.configure({
  nested: true,
  HTMLAttributes: {
    class: 'tiptap-task-item',
  },
})
```

**Task List UX:**
- **Creation**: Type `- [ ]` → creates unchecked task
- **Completion**: Click checkbox to toggle state
- **Nesting**: Tab/Shift+Tab for hierarchical tasks
- **Persistence**: Checkbox states saved in markdown

### 5. Accessibility Considerations for Enhanced Features

#### WCAG 2.1 AA Compliance Requirements

**Keyboard Navigation Standards:**
- **Focus Management**: All interactive elements must be keyboard accessible
- **Tab Order**: Logical tab sequence through editor features
- **Escape Behavior**: Consistent escape routes from complex interactions
- **Shortcut Keys**: Industry-standard keyboard shortcuts (Alt+F10 for toolbar)

#### Screen Reader Compatibility

**Semantic Markup Requirements:**
```html
<!-- Code blocks -->
<pre role="region" aria-label="Code block" aria-describedby="code-lang">
  <code class="language-javascript" id="code-lang">
    // JavaScript code
  </code>
</pre>

<!-- Ordered lists -->
<ol role="list">
  <li role="listitem">First item</li>
  <li role="listitem">Second item</li>
</ol>

<!-- Task lists -->
<ul role="list" aria-label="Task list">
  <li role="listitem">
    <input type="checkbox" aria-label="Task: Complete research" />
    Complete research
  </li>
</ul>
```

#### ARIA Implementation Best Practices

**Essential ARIA Attributes:**
- **aria-label**: Descriptive labels for complex elements
- **aria-describedby**: Additional context for screen readers
- **aria-expanded**: State information for collapsible elements
- **role**: Semantic role clarification where needed

**TipTap Accessibility Features:**
- ✅ All features keyboard accessible
- ✅ Semantic markup generation
- ✅ Screen reader friendly output
- ✅ Focus management built-in
- ⚠️ Custom ARIA attributes may be needed for complex features

### 6. Performance Considerations

#### Bundle Size Impact Analysis

**Extension Size Estimates:**
- **CodeBlockLowlight**: ~150KB (including highlight.js common languages)
- **OrderedList**: ~5KB (minimal overhead)
- **Table**: ~25KB (full table functionality)
- **TaskList**: ~8KB (checkbox interactions)
- **Total Additional**: ~190KB for full feature set

#### Performance Optimization Strategies

**Code Splitting for Large Features:**
```typescript
// Dynamic import for syntax highlighting
const loadSyntaxHighlighting = async () => {
  const { CodeBlockLowlight } = await import('@tiptap/extension-code-block-lowlight')
  const { createLowlight, common } = await import('lowlight')
  return { CodeBlockLowlight, lowlight: createLowlight(common) }
}
```

**Memory Management:**
- **Event Listener Cleanup**: Proper cleanup of custom event listeners
- **Extension Lifecycle**: Graceful extension loading/unloading
- **Large Document Handling**: Virtualization for documents with many code blocks

#### Performance Monitoring

**Key Metrics to Track:**
- **Time to Interactive**: Initial editor load time
- **Typing Latency**: Keystroke response time
- **Memory Usage**: Heap size with enhanced features
- **Bundle Size**: JavaScript payload impact

## 🎨 User Experience Recommendations

### Johnny Ive Invisible Interface Philosophy

**Design Principles for Enhanced Features:**

1. **Contextual Appearance**
   - Code block language selector appears only on hover/focus
   - List controls (indent/outdent) visible only when needed
   - Table resize handles invisible until interaction

2. **Minimal Visual Weight**
   - Code blocks: Subtle background, no heavy borders
   - Lists: Clean typography hierarchy, minimal bullets
   - Tables: Borderless design with subtle cell separation

3. **Intuitive Interactions**
   - Auto-formatting over manual toolbar interactions
   - Keyboard shortcuts over mouse-dependent features
   - Progressive disclosure of advanced features

### Feature Integration Recommendations

**Code Blocks:**
- **Default State**: Clean monospace text on subtle background
- **Enhanced State**: Language label appears on hover (top-right corner)
- **Language Selection**: Minimal dropdown, auto-complete enabled
- **Copy Button**: Appears on hover, uses system clipboard API

**Ordered Lists:**
- **Visual Treatment**: Numbers inherit text color, clean typography
- **Nesting Indication**: Subtle indentation, no visual hierarchy noise
- **Auto-formatting**: Immediate conversion from "1." to ordered list
- **Mixed Lists**: Seamless conversion between bullet and ordered

**Text Selection:**
- **Selection Color**: Subtle blue with transparency
- **Multi-selection**: Support for non-contiguous selections
- **Selection Actions**: Context-sensitive floating menu
- **Keyboard Selection**: Full keyboard selection support

## 📊 Implementation Complexity Assessment

### Low Complexity (Sprint 6 Ready)
- **OrderedList Extension**: Already partially implemented, needs enhancement
- **Basic CodeBlock**: Simple implementation without syntax highlighting
- **Text Selection Improvements**: CSS and UX enhancements

### Medium Complexity (Sprint 6 Feasible)
- **CodeBlockLowlight**: Additional dependencies, CSS styling requirements
- **Enhanced List UX**: Keyboard behavior improvements
- **Table Basic**: Simple table implementation

### High Complexity (Future Sprints)
- **CodeBlockShiki**: Complex async loading, larger bundle impact
- **Advanced Tables**: Resizing, advanced editing features
- **Task Lists with Persistence**: State management complexity

## 🎯 Sprint 6 Recommendations

### Primary Features (Single PR Focus)
Based on complexity analysis and user value, recommend implementing in Sprint 6:

1. **Enhanced OrderedList Extension**
   - Improve existing implementation with better keyboard UX
   - Add auto-formatting for "1." → ordered list conversion
   - Enhance visual styling with Johnny Ive principles

2. **Basic CodeBlock with Highlighting**
   - Implement CodeBlockLowlight extension
   - Add essential syntax highlighting for JavaScript, CSS, HTML
   - Simple visual design with monospace typography

3. **Text Selection Improvements**
   - Enhanced selection styling
   - Focus management improvements
   - Better keyboard navigation support

### Implementation Strategy
- **Single PR Principle**: Focus on core functionality over advanced features
- **Progressive Enhancement**: Basic implementation that can be enhanced in future sprints
- **Mobile-First**: Ensure all features work excellently on touch devices
- **Accessibility-First**: WCAG 2.1 AA compliance from initial implementation

## 📋 Technical Requirements Summary

### Dependencies to Add
```json
{
  "@tiptap/extension-code-block-lowlight": "^3.4.3",
  "lowlight": "^3.1.0",
  "highlight.js": "^11.9.0"
}
```

### CSS Considerations
- **Syntax Highlighting Theme**: Add highlight.js theme CSS
- **Code Block Styling**: Monospace font, subtle background
- **List Enhancements**: Clean number styling, proper indentation
- **Selection Improvements**: Enhanced ::selection styling

### TypeScript Interfaces
```typescript
interface CodeBlockOptions {
  defaultLanguage: string
  HTMLAttributes: Record<string, any>
}

interface OrderedListOptions {
  HTMLAttributes: Record<string, any>
  keepMarks: boolean
  keepAttributes: boolean
}

interface ListKeyboardBehavior {
  enter: boolean
  tab: boolean
  shiftTab: boolean
  backspace: boolean
}
```

## 🔍 Quality Assurance Requirements

### Testing Strategy
- **Unit Tests**: Individual extension functionality
- **Integration Tests**: Feature interaction with existing editor
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Performance Tests**: Bundle size and runtime performance
- **Mobile Tests**: Touch interaction and responsive behavior

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Accessibility Tools**: NVDA, JAWS, VoiceOver compatibility

---

## 📚 References and Documentation

### TipTap Official Documentation
- [CodeBlockLowlight Extension](https://tiptap.dev/docs/editor/extensions/nodes/code-block-lowlight)
- [OrderedList Extension](https://tiptap.dev/docs/editor/extensions/nodes/ordered-list)
- [Accessibility Guide](https://tiptap.dev/docs/guides/accessibility)
- [Performance Guide](https://tiptap.dev/docs/guides/performance)

### Best Practices Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ProseMirror Selection Guide](https://prosemirror.net/docs/guide/#doc.selection)
- [Highlight.js Language Support](https://github.com/highlightjs/highlight.js/tree/main/src/languages)

### Community Resources
- [TipTap GitHub Discussions](https://github.com/ueberdosis/tiptap/discussions)
- [CodeBlock Extensions Comparison](https://stackoverflow.com/questions/77573628/how-do-you-highlight-codeblock-with-tiptap)
- [Accessibility Implementation Examples](https://github.com/ueberdosis/tiptap/issues/1046)

---

**Research Completed**: September 16, 2025
**Next Phase**: Sprint 6 Implementation Planning and Development
**Research Confidence**: High - Based on official documentation and community best practices