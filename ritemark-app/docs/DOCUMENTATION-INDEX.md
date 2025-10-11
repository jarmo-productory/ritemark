# RiteMark Documentation Index

## Overview

This document serves as a central index for all RiteMark documentation, organized by audience and purpose.

---

## 📚 User Documentation

Documentation for end users of the RiteMark editor.

### Getting Started
- **[Text Formatting Guide](user-guide/formatting.md)** - Complete guide to using the formatting toolbar
  - Bold, Italic, Headings
  - Link management (add, edit, remove)
  - Keyboard shortcuts
  - Troubleshooting

---

## 👨‍💻 Developer Documentation

Technical documentation for developers maintaining and extending RiteMark.

### Component Documentation
- **[FormattingBubbleMenu Component](components/FormattingBubbleMenu.md)** - Context-sensitive formatting toolbar
  - API Reference
  - Implementation details
  - URL validation & normalization
  - Code examples
  - Troubleshooting
  - Testing strategies

### Integration Guides
- **[Google Drive Integration Summary](DRIVE-INTEGRATION-SUMMARY.md)** - Drive API setup and usage
- **[Drive API Integration Analysis](drive-api-integration-analysis.md)** - Technical analysis
- **[Drive Integration Guide](drive-integration-guide.md)** - Step-by-step setup
- **[Drive Architecture Diagram](drive-architecture-diagram.md)** - System architecture

### Authentication & Security
- **[OAuth Testing Checklist](oauth-testing-checklist.md)** - OAuth2 validation steps
- **[OAuth Token Flow](oauth-token-flow.md)** - Token lifecycle documentation

### Services & APIs
- **[File Cache API](services/file-cache-api.md)** - Client-side file caching system

### Troubleshooting
- **[Google Picker 404 Fix](PICKER-404-FIX.md)** - Resolving picker loading issues

---

## 🔬 Research & Analysis

Background research and competitive analysis.

### Sprint Research
- **[Sprint 6: Enhanced Editor Research](research/sprint-06-enhanced-editor-research.md)**
- **[Sprint 6: Implementation Roadmap](research/sprint-06-implementation-roadmap.md)**

### UX Research
- **[Auto-Save UX Strategy 2025](research/auto-save-ux-strategy-2025.md)**
- **[File Management UX Patterns 2025](research/file-management-ux-patterns-2025.md)**
- **[File Management Competitive Analysis](research/file-management-competitive-analysis.md)**

### Technical Research
- **[Drive API Security 2025](research/drive-api-security-2025.md)**
- **[Mobile Drive API Research](research/mobile-drive-api-research.md)**
- **[Mobile Architecture Diagram](research/mobile-architecture-diagram.md)**
- **[Mobile Drive Summary](research/mobile-drive-summary.md)**

### Root Cause Analysis
- **[Google Picker 404 Root Cause Analysis](research/google-picker-404-root-cause-analysis.md)**

---

## 📋 Sprint Documentation

Project sprint tracking and postmortems.

- **[Sprint 9 Postmortem](sprints/sprint-09-postmortem.md)** - Lessons learned from Sprint 9

---

## 🛠️ Implementation Guides

Step-by-step implementation documentation.

- **[Drive Code Templates](drive-code-templates.md)** - Reusable Drive API code patterns
- **[Drive Integration Quick Reference](drive-integration-quick-reference.md)** - Quick lookup guide
- **[File Cache Implementation Summary](implementation-summary-filecache.md)** - Cache implementation details

---

## 📖 Documentation Standards

### For Component Documentation

All React component documentation should follow this structure:

1. **Overview** - Purpose and key features
2. **Dependencies** - Required packages and internal deps
3. **API Reference** - Props, state, methods
4. **Features** - Detailed feature descriptions
5. **Implementation Details** - Technical architecture
6. **Code Examples** - Usage examples
7. **Troubleshooting** - Common issues and solutions
8. **Accessibility** - A11y considerations
9. **Testing** - Test strategies and examples
10. **Related Documentation** - Links to related docs

### For User Documentation

All user-facing documentation should follow this structure:

1. **Clear Headlines** - Easy to scan
2. **Visual Hierarchy** - Use headings, lists, tables
3. **Step-by-Step Instructions** - Numbered lists with actions
4. **Examples** - Show don't tell
5. **Keyboard Shortcuts** - Highlight efficiency tips
6. **Troubleshooting** - Address common problems
7. **Next Steps** - Guide users to related features

---

## 📂 Documentation Organization

```
docs/
├── components/              # Component API documentation
│   └── FormattingBubbleMenu.md
├── user-guide/             # End-user documentation
│   └── formatting.md
├── research/               # Research and analysis
│   ├── sprint-06-*.md
│   ├── auto-save-*.md
│   ├── file-management-*.md
│   └── mobile-*.md
├── services/               # Service layer documentation
│   └── file-cache-api.md
├── sprints/                # Sprint tracking
│   └── sprint-09-postmortem.md
├── DOCUMENTATION-INDEX.md  # This file
├── DRIVE-INTEGRATION-SUMMARY.md
├── PICKER-404-FIX.md
├── oauth-*.md
└── drive-*.md
```

---

## 🔗 External Resources

### TipTap Documentation
- [TipTap Editor API](https://tiptap.dev/docs/editor/api/editor)
- [BubbleMenu Extension](https://tiptap.dev/docs/editor/api/extensions/bubble-menu)
- [Link Extension](https://tiptap.dev/docs/editor/api/marks/link)

### UI Libraries
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons](https://lucide.dev/)

### Google APIs
- [Google Drive API v3](https://developers.google.com/drive/api/v3/reference)
- [Google Picker API](https://developers.google.com/drive/picker)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Choose the right directory** based on audience (users vs. developers)
2. **Follow existing templates** for consistency
3. **Update this index** with a brief description and link
4. **Cross-reference** related documentation
5. **Include code examples** where applicable
6. **Add troubleshooting sections** for common issues

---

## 🎯 Quick Links

| I want to... | Go to... |
|--------------|----------|
| Learn how to format text as a user | [Text Formatting Guide](user-guide/formatting.md) |
| Understand the formatting component | [FormattingBubbleMenu Component](components/FormattingBubbleMenu.md) |
| Set up Google Drive integration | [Drive Integration Guide](drive-integration-guide.md) |
| Debug OAuth issues | [OAuth Testing Checklist](oauth-testing-checklist.md) |
| Fix Google Picker 404 errors | [Picker 404 Fix](PICKER-404-FIX.md) |
| Review Sprint 9 lessons | [Sprint 9 Postmortem](sprints/sprint-09-postmortem.md) |

---

**Last Updated:** 2025-10-11
**Maintained By:** RiteMark Development Team
