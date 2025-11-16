# Sprint 29 Scope Clarification

**Date**: 2025-01-16
**Status**: ✅ Clarified

---

## 🎯 What We're Building

**Sprint 29 builds an EXTENSIBLE widget system but implements ONLY ONE widget.**

### What's IN SCOPE (Sprint 29)

✅ **Widget Plugin Architecture (Extensible)**
- Core widget system that CAN support many widgets
- `WidgetPlugin` base class (abstract interface)
- `WidgetRegistry` for plugin management
- `WidgetRenderer` for displaying widgets in chat
- Designed for extensibility, not just single use

✅ **FindReplaceWidget (ONLY WIDGET)**
- Find and replace with preview
- Deterministic `findAndReplace.ts` algorithm
- User control (preview → approve → execute)
- Replaces ALL occurrences (not just first)
- Migration from old `replaceText` direct-execution tool

---

## ❌ What's OUT OF SCOPE (Future Work)

The following are **NOT** being implemented in Sprint 29:

❌ **InsertTextWidget**
- Existing `insertText` tool remains AS-IS
- Will be converted to widget in Sprint 30

❌ **DeleteTextWidget**
- Future feature (Sprint 31+)

❌ **FormatTextWidget**
- Future feature (Sprint 31+)

❌ **TableEditorWidget**
- Future feature (Sprint 32+)

❌ **ImageUploaderWidget**
- Future feature (Sprint 32+)

❌ **Advanced FindReplace Features**
- Case preservation (future)
- Regex support (future)
- Partial execution (future)
- Whole word matching (future - unless time permits)

---

## 📁 Folder Structure (Sprint 29)

### What EXISTS After Sprint 29

```
src/services/ai/widgets/
├── core/                           # Extensible widget system
│   ├── types.ts
│   ├── WidgetPlugin.ts
│   ├── WidgetRegistry.ts
│   └── WidgetRenderer.tsx
├── find-replace/                   # ONLY widget
│   ├── index.ts
│   ├── FindReplaceWidget.tsx
│   ├── executor.ts
│   └── types.ts
└── index.ts
```

### What DOES NOT EXIST Yet (Future)

```
# These folders DO NOT EXIST after Sprint 29:
src/services/ai/widgets/
├── insert-text/          # ❌ Not created yet
├── delete-text/          # ❌ Not created yet
├── format-text/          # ❌ Not created yet
├── table-editor/         # ❌ Not created yet
└── image-upload/         # ❌ Not created yet
```

---

## 🏗️ Architecture Philosophy

**"Build for Many, Implement One"**

### Why We Build Extensible System First

1. **Avoid Refactoring Later**: Building extensible architecture from start prevents massive refactors
2. **Proof of Concept**: First widget validates architecture decisions
3. **Clear Patterns**: Subsequent widgets follow established patterns
4. **Single Responsibility**: Each widget isolated in its own folder

### Why Only One Widget Initially

1. **Validate Architecture**: Ensure plugin system works before scaling
2. **User Feedback**: Test FindReplace with users before adding more widgets
3. **Incremental Complexity**: Master one widget before adding others
4. **Risk Management**: Smaller scope = lower risk of failure

---

## 📊 Phase Breakdown (Clarified)

### Phase 1: Widget Plugin System (Foundation)
**Goal**: Build extensible infrastructure
- Create `WidgetPlugin` base class
- Create `WidgetRegistry`
- Update `ToolExecutor`
- Add widget rendering in chat
- **Note**: System SUPPORTS many widgets, but NONE implemented yet

### Phase 2: FindReplaceWidget (ONLY WIDGET)
**Goal**: Implement ONLY FindReplaceWidget
- Create `FindReplaceWidget` component
- Implement deterministic find/replace algorithm
- Preview UI, user controls, execution
- **CRITICAL**: This is the ONLY widget in Sprint 29

### Phase 3: Migration from Old `replaceText`
**Goal**: Replace direct-execution `replaceText` with widget
- Update tool definitions
- Deprecate old direct-execution code
- **IMPORTANT**: `insertText` tool remains AS-IS (not converted yet)

### Phase 4: Testing & Documentation
**Goal**: Production-ready quality
- Unit tests for algorithm
- Component tests for UI
- Integration tests
- Browser validation
- Documentation

---

## ✅ Success Criteria (Sprint 29)

### Must-Have
- [ ] Widget plugin system working (extensible for future widgets)
- [ ] `FindReplaceWidget` implemented
- [ ] Preview before execution
- [ ] User approval required
- [ ] Deterministic algorithm
- [ ] Bulk operations (replace ALL)
- [ ] Old `replaceText` migrated

### Out of Scope
- ❌ InsertTextWidget (existing tool remains AS-IS)
- ❌ DeleteTextWidget
- ❌ FormatTextWidget
- ❌ Advanced features (case preservation, regex, etc.)

### Stretch Goals (Only if Time Permits)
- [ ] Basic case preservation
- [ ] Whole word matching toggle
- [ ] Match highlighting in editor

---

## 🚀 Future Roadmap

### Sprint 30: InsertTextWidget
- Convert existing `insertText` tool to widget
- Preview where text will be inserted
- User control over insertion

### Sprint 31: DeleteTextWidget + FormatTextWidget
- New delete functionality with preview
- Formatting (bold, italic, headings) with preview

### Sprint 32+: Advanced Features
- TableEditorWidget
- ImageUploaderWidget
- Advanced FindReplace features (regex, case preservation)

---

## 💡 Key Takeaways

1. **Extensible Architecture**: System supports many widgets
2. **Single Implementation**: Only ONE widget in Sprint 29
3. **Gradual Migration**: Existing tools remain until converted
4. **User-Centric**: Validate with users before scaling
5. **Clear Separation**: Each widget in its own isolated folder

---

**Last Updated**: 2025-01-16
**Status**: Ready for implementation
