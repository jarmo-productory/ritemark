# Sprint 6: Enhanced Editor Features

**Sprint Goal**: Add code blocks, ordered lists, and text selection improvements (ultra-small increment)
**Status**: 🎯 ACTIVE
**AI Development Rule**: Maximum 1 PR - single feature set only
**Success Criteria**: Users can format code seamlessly, numbered lists work intuitively, text selection feels responsive

## 🎯 Sprint Objectives (Ultra-Small Increment)

### Primary Goal
Enhance the existing TipTap WYSIWYG editor with essential formatting features while maintaining the Johnny Ive invisible interface philosophy.

### Success Criteria (Single Feature Set Only)
- [ ] Code blocks with syntax highlighting for multiple languages
- [ ] Ordered/numbered lists with proper nesting and continuation
- [ ] Enhanced text selection UX with improved visual feedback
- [ ] Keyboard shortcuts for all new features
- [ ] Mobile-responsive implementation maintained
- [ ] Invisible interface philosophy preserved throughout

## 📋 Sprint Tasks

### 1. Research/Audit Phase
**Status**: 🟡 IN PROGRESS

**Analysis Tasks**:
- [x] Analyzed current Editor.tsx implementation and TipTap configuration
- [x] Reviewed existing ordered list implementation (already configured but needs enhancement)
- [x] Identified required TipTap extensions for code blocks and syntax highlighting
- [x] Researched text selection UX best practices for WYSIWYG editors
- [ ] Audit mobile touch interactions for new features
- [ ] Document keyboard shortcut patterns for consistency

**Key Findings**:
- **Current State**: OrderedList extension already installed and configured
- **Code Block Gaps**: No code block support currently implemented
- **Selection UX**: Basic browser selection styling present but could be enhanced
- **Extension Needs**: `@tiptap/extension-code-block-lowlight` for syntax highlighting
- **Architecture**: Clean foundation in place for adding new features

### 2. Plan Sprint Phase
**Status**: ✅ COMPLETED

**Sprint Planning Tasks**:
- [x] Define code block user experience (language selection, formatting)
- [x] Plan enhanced ordered list behavior (nesting, numbering styles)
- [x] Design text selection improvements (visual feedback, touch handling)
- [x] Establish keyboard shortcuts for new features
- [x] Plan mobile-first implementation approach
- [x] Define testing strategy for new features

**Key Planning Decisions (Based on Codex Q&A)**:

#### **Code Block UX Strategy**
- **Language Detection**: Hybrid approach - autodetect from ``` syntax, manual picker on focus
- **Copy Button**: Progressive disclosure on hover (invisible by default, Johnny Ive compliant)
- **Visual Treatment**: Language label appears top-right on hover, minimal dropdown for selection

#### **Keyboard Shortcuts (Cross-Platform Safe)**
- **Code Block**: `Mod+Shift+C` (Mod = Cmd on Mac, Ctrl on Windows)
- **Ordered List**: `Mod+Shift+7` (number 7 universal across layouts)
- **Bullet List**: `Mod+Shift+8` (number 8 universal across layouts)
- **List Navigation**: `Tab` / `Shift+Tab` (standard expectations)
- **Language Picker**: `Mod+L` (when cursor in code block)

#### **Text Selection Scope (Mobile-Realistic)**
- **In Scope**: Enhanced visual styling, better desktop selection, focus management
- **Out of Scope**: Custom mobile handles (iOS/Android restrictions), multi-cursor support

#### **Settings Button Foundation (Sprint 7 Prep)**
- **Visual Strategy**: Always present at 15% opacity (discoverable but subtle)
- **Hover State**: 80% opacity for clear interaction feedback
- **Future States**: 40% when auth needed, 25% when authenticated
- **Position**: Fixed top-right (20px from edges)

### 3. Code Phase (Single PR Implementation)
**Status**: ⏳ PENDING

**Ultra-Small Implementation Plan**:

#### **Step 1**: Code Block Implementation
- [ ] **Install dependencies**:
  - [ ] `@tiptap/extension-code-block-lowlight`
  - [ ] `lowlight` for syntax highlighting
  - [ ] Language definition packages (js, html, css, python, etc.)
- [ ] **Configure CodeBlockLowlight extension**:
  - [ ] Add to Editor extensions array
  - [ ] Configure supported languages
  - [ ] Set up language autodetection
- [ ] **Implement code block styling**:
  - [ ] Dark theme code blocks with proper contrast
  - [ ] Language label display
  - [ ] Copy button for code blocks
  - [ ] Mobile-responsive code block layout

#### **Step 2**: Enhanced Ordered Lists
- [ ] **Improve existing OrderedList configuration**:
  - [ ] Add nested numbering styles (1, a, i, etc.)
  - [ ] Implement proper list continuation after paragraphs
  - [ ] Add keyboard shortcuts for list manipulation
- [ ] **List UX enhancements**:
  - [ ] Tab/Shift+Tab for indent/outdent
  - [ ] Smart Enter behavior for list continuation
  - [ ] List type conversion (bullet ↔ ordered)

#### **Step 3**: Text Selection Improvements
- [ ] **Enhanced selection styling**:
  - [ ] Improved visual feedback for text selection
  - [ ] Touch-friendly selection handles on mobile
  - [ ] Multi-paragraph selection improvements
- [ ] **Selection behavior enhancements**:
  - [ ] Double-click word selection refinements
  - [ ] Triple-click paragraph selection
  - [ ] Keyboard selection improvements (Shift+Arrow)

#### **Step 4**: Keyboard Shortcuts Integration
- [ ] **Implement consistent shortcuts**:
  - [ ] `Cmd+Shift+C` / `Ctrl+Shift+C` for code blocks
  - [ ] `Cmd+Shift+7` / `Ctrl+Shift+7` for ordered lists
  - [ ] `Cmd+Shift+8` / `Ctrl+Shift+8` for bullet lists
  - [ ] `Tab` / `Shift+Tab` for list indentation
  - [ ] `Cmd+L` / `Ctrl+L` for language picker (in code blocks)

#### **Step 5**: Settings Button Foundation (Sprint 7 Prep)
- [ ] **Add settings button infrastructure**:
  - [ ] Create SettingsButton component with 15% opacity
  - [ ] Position fixed top-right (20px from edges)
  - [ ] Implement hover state (80% opacity)
  - [ ] Add basic icon (gear or three dots)
- [ ] **Prepare for future states**:
  - [ ] Add opacity state management hooks
  - [ ] Create settings context for auth state
  - [ ] Ensure no interference with writing experience

**SCOPE LIMIT**: Essential formatting features + settings foundation - NO floating toolbars, NO complex menus, NO additional editor chrome

### 4. Testing/Validation Phase
**Status**: ⏳ PENDING

**Testing Strategy (Merge Blockers vs Follow-ups)**:

#### **Merge Blockers (Must Pass for PR)**:
- [ ] **Core Functionality**:
  - [ ] Code blocks create and render correctly (JS/CSS/HTML)
  - [ ] Syntax highlighting works for 3 core languages
  - [ ] Keyboard shortcuts function on Mac/Windows (`Mod+Shift+C`, `Mod+Shift+7`)
  - [ ] Lists indent/outdent properly with Tab/Shift+Tab
  - [ ] No TypeScript errors or build failures
  - [ ] Mobile basic functionality works (touch, scroll)

- [ ] **Settings Button Foundation**:
  - [ ] Settings button appears at 15% opacity
  - [ ] Hover state works (80% opacity)
  - [ ] No interference with writing experience
  - [ ] Positioned correctly (top-right, 20px margins)

#### **Follow-up Testing (Not Merge Blockers)**:
- [ ] **Enhanced Features**:
  - [ ] Copy button comprehensive testing
  - [ ] All 20+ programming languages
  - [ ] Advanced keyboard navigation edge cases
  - [ ] Cross-browser compatibility (Firefox, Safari)

- [ ] **Quality Assurance**:
  - [ ] Accessibility audit (screen readers)
  - [ ] Performance with large documents
  - [ ] Mobile device testing across iOS/Android

#### **Quick Validation Script**:
```typescript
// Sprint 6 validation checklist
const sprintValidation = {
  codeBlocks: '```js\nconsole.log("test")\n```',
  orderedList: '1. First\n2. Second\n\t1. Nested',
  shortcuts: ['Cmd+Shift+C', 'Cmd+Shift+7', 'Tab'],
  settingsButton: 'opacity: 0.15, hover: 0.8',
  mobile: 'Basic touch interaction works'
}
```

### 5. Cleanup Phase
**Status**: ⏳ PENDING

**Cleanup Checklist**:
- [ ] Remove development artifacts and console logs
- [ ] Ensure component naming reflects functionality accurately
- [ ] Validate TypeScript types for new extensions
- [ ] Performance optimization for syntax highlighting
- [ ] Accessibility compliance (ARIA labels, keyboard navigation)
- [ ] Mobile touch interaction optimization

### 6. Commit Phase
**Status**: ⏳ PENDING

**Deployment Checklist**:
- [ ] Build and type checking validation
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance benchmarking with code-heavy documents
- [ ] User acceptance testing for new features

## 🎨 Design Specifications (Johnny Ive Philosophy)

### Visual Principles
- **Invisible Interface**: New features integrate seamlessly without visual clutter
- **Contextual Appearance**: Code blocks and lists appear naturally in writing flow
- **Consistent Typography**: Maintain document hierarchy and reading experience
- **Touch-First Design**: All features optimized for mobile interaction

### Code Block Design
```css
.wysiwyg-editor .ProseMirror pre {
  background: #1f2937 !important;
  color: #f9fafb !important;
  border-radius: 8px !important;
  padding: 1rem !important;
  margin: 1em 0 !important;
  overflow-x: auto !important;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.wysiwyg-editor .ProseMirror pre code {
  background: none !important;
  padding: 0 !important;
  font-size: inherit !important;
  color: inherit !important;
}

.code-block-language {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 12px;
  color: #9ca3af;
  opacity: 0.7;
}
```

### Enhanced List Styling
```css
.wysiwyg-editor .ProseMirror ol.tiptap-ordered-list {
  counter-reset: list-counter;
}

.wysiwyg-editor .ProseMirror ol.tiptap-ordered-list > li {
  counter-increment: list-counter;
  position: relative;
}

.wysiwyg-editor .ProseMirror ol.tiptap-ordered-list > li::before {
  content: counter(list-counter) ".";
  font-weight: 600;
  color: #6b7280;
  margin-right: 0.5em;
}

/* Nested list styling */
.wysiwyg-editor .ProseMirror ol ol {
  list-style-type: lower-alpha;
}

.wysiwyg-editor .ProseMirror ol ol ol {
  list-style-type: lower-roman;
}
```

### Text Selection Enhancements
```css
.wysiwyg-editor .ProseMirror ::selection {
  background: rgba(59, 130, 246, 0.15) !important;
  border-radius: 2px !important;
}

.wysiwyg-editor .ProseMirror ::-moz-selection {
  background: rgba(59, 130, 246, 0.15) !important;
}

/* Enhanced mobile selection */
@media (max-width: 768px) {
  .wysiwyg-editor .ProseMirror ::selection {
    background: rgba(59, 130, 246, 0.2) !important;
  }
}
```

## 🛠 Technical Architecture

### TipTap Extensions Configuration
```typescript
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import python from 'highlight.js/lib/languages/python'

// Register languages
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('python', python)

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false, // Disable default to use enhanced version
      bulletList: false,
      orderedList: false,
      listItem: false,
    }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'plaintext',
      HTMLAttributes: {
        class: 'tiptap-code-block',
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: 'tiptap-ordered-list',
      },
      keepMarks: true,
      keepAttributes: true,
    }),
    // ... other extensions
  ],
})
```

### Keyboard Shortcuts Integration
```typescript
editorProps: {
  handleKeyDown: (view, event): boolean => {
    // Code block creation
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'C') {
      return editor?.commands.toggleCodeBlock() || false
    }

    // Ordered list
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === '&') { // Shift+7
      return editor?.commands.toggleOrderedList() || false
    }

    // List indentation
    if (event.key === 'Tab') {
      const { selection } = view.state
      const { $from } = selection

      if ($from.parent.type.name === 'listItem') {
        if (event.shiftKey) {
          return editor?.commands.liftListItem('listItem') || false
        } else {
          return editor?.commands.sinkListItem('listItem') || false
        }
      }
    }

    // Existing Enter key handling for lists
    if (event.key === 'Enter') {
      const { selection } = view.state
      const { $from } = selection

      if ($from.parent.type.name === 'listItem') {
        const isEmpty = $from.parent.textContent.trim() === ''
        if (isEmpty) {
          return editor?.commands.liftListItem('listItem') || false
        }
      }
    }

    return false
  },
}
```

### Package Dependencies
```json
{
  "dependencies": {
    "@tiptap/extension-code-block-lowlight": "^3.4.3",
    "lowlight": "^3.1.0",
    "highlight.js": "^11.11.1"
  }
}
```

## 📊 Success Metrics

### Functional Requirements
- [ ] Code blocks with syntax highlighting for 5+ languages
- [ ] Ordered lists with proper nesting (3 levels minimum)
- [ ] Enhanced text selection with improved visual feedback
- [ ] Keyboard shortcuts work consistently across platforms
- [ ] Mobile touch interactions feel natural
- [ ] All features integrate with existing TOC navigation

### User Experience Requirements
- [ ] Code formatting feels effortless and intuitive
- [ ] List creation and management is discoverable
- [ ] Text selection provides clear visual feedback
- [ ] No visual clutter or interface complexity added
- [ ] Mobile experience maintains touch-friendly design
- [ ] Features enhance rather than disrupt writing flow

### Technical Requirements
- [ ] TypeScript types properly defined for new extensions
- [ ] Performance remains smooth with syntax highlighting
- [ ] Accessibility standards maintained (keyboard navigation, ARIA)
- [ ] Build process handles new dependencies correctly
- [ ] No console errors or warnings introduced

## 🎯 Definition of Done

### Technical Implementation
- [ ] CodeBlockLowlight extension integrated with 5+ languages
- [ ] Enhanced OrderedList configuration with nesting support
- [ ] Improved text selection styling and behavior
- [ ] Keyboard shortcuts implemented for all new features
- [ ] Mobile-responsive design validated for new features
- [ ] TypeScript types and interfaces properly defined

### User Experience Achievement
- [ ] Johnny Ive invisible interface philosophy maintained
- [ ] Code block creation and editing feels natural
- [ ] List management is intuitive and discoverable
- [ ] Text selection provides appropriate visual feedback
- [ ] Mobile touch interactions optimized
- [ ] No additional visual complexity introduced

### Quality Standards
- [ ] All features properly typed with TypeScript
- [ ] Accessibility features implemented (ARIA labels, keyboard navigation)
- [ ] Performance benchmarked with code-heavy documents
- [ ] Cross-browser compatibility validated
- [ ] Mobile device testing completed across iOS and Android
- [ ] 1 PR maximum - focused feature enhancement

## 📈 Sprint Success Indicators

- **Code Block Usage**: Users can create and edit code seamlessly
- **List Management**: Numbered lists feel as natural as Google Docs
- **Selection UX**: Text selection provides clear, responsive feedback
- **Keyboard Efficiency**: Power users can work without touching mouse
- **Mobile Experience**: Touch interactions feel native and responsive
- **Technical Quality**: Zero performance degradation with new features

## 🔧 Implementation Strategy

### Phase 1: Foundation (Day 1)
1. Install and configure syntax highlighting dependencies
2. Set up CodeBlockLowlight extension with core languages
3. Implement basic code block styling

### Phase 2: Enhancement (Day 2)
1. Enhance OrderedList configuration for better nesting
2. Implement keyboard shortcuts for all features
3. Add text selection improvements

### Phase 3: Polish (Day 3)
1. Mobile optimization and touch interaction refinement
2. Performance optimization for large documents
3. Accessibility compliance verification

### Testing Strategy
- **Unit Tests**: TipTap extension configuration and behavior
- **Integration Tests**: Feature interaction with existing editor
- **User Experience Tests**: Manual testing of writing workflows
- **Performance Tests**: Large documents with heavy code block usage
- **Mobile Tests**: Touch interaction validation on real devices

---

**Sprint Owner**: AI Development Team
**Start Date**: September 16, 2025
**Target Completion**: September 19, 2025 (3-day sprint)
**Next Sprint**: Sprint 7 - Google OAuth Setup

## 🎉 Sprint 6 Roadmap Integration

### Milestone Progress
- **Milestone 1: Visual Editor** (Sprint 3-6) - 🎯 83% Complete
  - ✅ Sprint 3: Basic Text Editor Component (COMPLETED)
  - ✅ Sprint 4: WYSIWYG Editor with TipTap (COMPLETED)
  - ✅ Sprint 5: Document Structure & Navigation (COMPLETED)
  - 🎯 Sprint 6: Enhanced Editor Features (ACTIVE)

### Strategic Position
Sprint 6 completes **Milestone 1: Visual Editor** by adding essential formatting capabilities that make RiteMark competitive with mainstream editors while maintaining its unique markdown-output advantage. This establishes the complete foundation for **Milestone 2: Cloud Collaboration** starting with Sprint 7.

**Key Success Factors**:
1. **Feature Completeness**: Code blocks and enhanced lists complete core formatting needs
2. **UX Excellence**: Invisible interface philosophy maintained throughout
3. **Mobile Optimization**: Touch-first design ensures broad accessibility
4. **Performance**: Syntax highlighting doesn't impact editor responsiveness
5. **Integration**: All features work seamlessly with existing TOC navigation

---

**Next Steps**: Upon Sprint 6 completion, begin Sprint 7 planning for Google OAuth integration, starting the cloud collaboration milestone.