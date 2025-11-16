# Find & Replace Widget Implementation

**Sprint**: 29 - Phase 3A: Smart Find-and-Replace
**Priority**: HIGH
**Complexity**: Medium
**Status**: Planning

---

## 🎯 Overview

Transform the current single-instance `replaceText` tool into an intelligent **Find & Replace Widget** that:
- Finds **ALL** occurrences (not just the first one - current bug)
- Shows preview with match count
- Preserves case (User→Customer, user→customer, USER→CUSTOMER)
- Supports whole word matching and case sensitivity options
- Provides interactive UI for user confirmation

**Current Problem**: AI tool `replaceText` only replaces the first occurrence, missing subsequent matches.

**Solution**: Widget-based system with preview → user confirmation → batch execution.

---

## 🏗️ Architecture: Widget System

### Core Widget Interface

Location: `/src/services/ai/widgets/core/types.ts`

```typescript
/**
 * Base interface for all AI chat widgets
 * Widgets are interactive UI components that the AI can render
 * for complex operations requiring user confirmation
 */
export interface ChatWidget {
  /**
   * Unique widget type identifier
   * Used by registry to instantiate correct widget component
   */
  type: string

  /**
   * Widget configuration data
   * Passed from AI tool executor to widget component
   */
  data: unknown

  /**
   * Callback executed when user confirms widget action
   * Returns success/failure result
   */
  onExecute: (data: unknown) => Promise<{ success: boolean; message: string }>

  /**
   * Optional callback when user cancels widget
   */
  onCancel?: () => void
}

/**
 * Find & Replace Widget specific data structure
 */
export interface FindReplaceWidgetData {
  searchTerm: string
  replacement: string
  options: {
    matchCase: boolean
    wholeWord: boolean
    preserveCase: boolean
    scope: 'document' | 'selection'
  }
  matches: Array<{
    text: string
    from: number
    to: number
    context: string  // Surrounding text for preview
  }>
}
```

### Widget Registry

Location: `/src/services/ai/widgets/core/registry.ts`

```typescript
import { ChatWidget } from './types'
import { FindReplaceWidget } from '../find-replace'

/**
 * Global registry of available widget types
 * Maps widget type string to React component
 */
type WidgetComponent = React.ComponentType<{
  widget: ChatWidget
  onComplete: (result: { success: boolean; message: string }) => void
}>

const widgetRegistry = new Map<string, WidgetComponent>()

/**
 * Register a widget component
 */
export function registerWidget(type: string, component: WidgetComponent): void {
  widgetRegistry.set(type, component)
}

/**
 * Get widget component by type
 */
export function getWidget(type: string): WidgetComponent | undefined {
  return widgetRegistry.get(type)
}

/**
 * Initialize all built-in widgets
 * Called on app startup
 */
export function initializeWidgets(): void {
  registerWidget('find-replace', FindReplaceWidget)
  // Future widgets: 'multi-step-workflow', 'web-search-results', etc.
}
```

### Widget Renderer

Location: `/src/services/ai/widgets/core/WidgetRenderer.tsx`

```typescript
import React from 'react'
import { ChatWidget } from './types'
import { getWidget } from './registry'

interface WidgetRendererProps {
  widget: ChatWidget
  onComplete: (result: { success: boolean; message: string }) => void
}

/**
 * Universal widget renderer component
 * Looks up widget type in registry and renders appropriate component
 */
export function WidgetRenderer({ widget, onComplete }: WidgetRendererProps) {
  const WidgetComponent = getWidget(widget.type)

  if (!WidgetComponent) {
    return (
      <div className="widget-error">
        <p>Unknown widget type: {widget.type}</p>
      </div>
    )
  }

  return <WidgetComponent widget={widget} onComplete={onComplete} />
}
```

---

## 🔧 Find & Replace Widget Implementation

### Widget Component

Location: `/src/services/ai/widgets/find-replace/FindReplaceWidget.tsx`

```typescript
import React, { useState } from 'react'
import { ChatWidget, FindReplaceWidgetData } from '../core/types'
import { Search, Replace, X, CheckCircle2 } from 'lucide-react'
import './styles.module.css'

interface FindReplaceWidgetProps {
  widget: ChatWidget
  onComplete: (result: { success: boolean; message: string }) => void
}

export function FindReplaceWidget({ widget, onComplete }: FindReplaceWidgetProps) {
  const data = widget.data as FindReplaceWidgetData
  const [isExecuting, setIsExecuting] = useState(false)

  const matchCount = data.matches.length

  const handleReplaceAll = async () => {
    setIsExecuting(true)

    try {
      const result = await widget.onExecute(data)
      onComplete(result)
    } catch (error) {
      onComplete({
        success: false,
        message: error instanceof Error ? error.message : 'Replace operation failed'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCancel = () => {
    widget.onCancel?.()
    onComplete({
      success: false,
      message: 'Find and replace cancelled by user'
    })
  }

  return (
    <div className="find-replace-widget">
      {/* Header */}
      <div className="widget-header">
        <div className="widget-icon">
          <Replace className="w-4 h-4" />
        </div>
        <h4 className="widget-title">Find & Replace</h4>
      </div>

      {/* Preview */}
      <div className="widget-content">
        {/* Search Info */}
        <div className="search-info">
          <div className="info-row">
            <span className="label">Find:</span>
            <code className="search-term">{data.searchTerm}</code>
          </div>
          <div className="info-row">
            <span className="label">Replace with:</span>
            <code className="replacement">{data.replacement}</code>
          </div>
        </div>

        {/* Match Count */}
        <div className="match-summary">
          <Search className="w-4 h-4" />
          <span className="match-count">
            {matchCount === 0 ? 'No matches found' : `${matchCount} match${matchCount === 1 ? '' : 'es'} found`}
          </span>
        </div>

        {/* Options */}
        {(data.options.matchCase || data.options.wholeWord || data.options.preserveCase) && (
          <div className="options-summary">
            {data.options.matchCase && <span className="option-badge">Match case</span>}
            {data.options.wholeWord && <span className="option-badge">Whole word</span>}
            {data.options.preserveCase && <span className="option-badge">Preserve case</span>}
          </div>
        )}

        {/* Match Preview (first 3 matches) */}
        {matchCount > 0 && (
          <div className="match-preview">
            <p className="preview-title">Preview:</p>
            {data.matches.slice(0, 3).map((match, index) => (
              <div key={index} className="match-item">
                <span className="match-number">{index + 1}.</span>
                <span className="match-context">
                  {highlightMatch(match.context, match.text, data.replacement)}
                </span>
              </div>
            ))}
            {matchCount > 3 && (
              <p className="more-matches">
                ... and {matchCount - 3} more match{matchCount - 3 === 1 ? '' : 'es'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="widget-actions">
        <button
          onClick={handleCancel}
          className="btn btn-secondary"
          disabled={isExecuting}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleReplaceAll}
          className="btn btn-primary"
          disabled={isExecuting || matchCount === 0}
        >
          {isExecuting ? (
            <>
              <div className="spinner" />
              Replacing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Replace All ({matchCount})
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * Highlight matched text in context preview
 * Shows: "...before [old] after..." → "...before [new] after..."
 */
function highlightMatch(context: string, oldText: string, newText: string): React.ReactNode {
  const parts = context.split(oldText)
  return (
    <>
      {parts[0]}
      <span className="match-old">{oldText}</span>
      <span className="match-arrow">→</span>
      <span className="match-new">{newText}</span>
      {parts[1]}
    </>
  )
}
```

### Widget Executor

Location: `/src/services/ai/widgets/find-replace/executor.ts`

```typescript
import { Editor } from '@tiptap/react'
import { FindReplaceWidgetData } from '../core/types'

/**
 * Find all occurrences of search term in document
 * Returns array of match positions with context
 */
export function findAllMatches(
  editor: Editor,
  searchTerm: string,
  options: FindReplaceWidgetData['options']
): FindReplaceWidgetData['matches'] {
  const docText = editor.getText()
  const matches: FindReplaceWidgetData['matches'] = []

  // Build regex based on options
  let pattern = searchTerm

  // Escape special regex characters
  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Whole word matching: wrap in word boundaries
  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`
  }

  // Case sensitivity
  const flags = options.matchCase ? 'g' : 'gi'
  const regex = new RegExp(pattern, flags)

  // Find all matches
  let match: RegExpExecArray | null
  while ((match = regex.exec(docText)) !== null) {
    const matchText = match[0]
    const matchStart = match.index
    const matchEnd = matchStart + matchText.length

    // Get context (20 chars before and after)
    const contextStart = Math.max(0, matchStart - 20)
    const contextEnd = Math.min(docText.length, matchEnd + 20)
    const context = docText.substring(contextStart, contextEnd)

    matches.push({
      text: matchText,
      from: textOffsetToDocPosition(editor, matchStart),
      to: textOffsetToDocPosition(editor, matchEnd),
      context: context.length < contextEnd - contextStart ? context : `...${context}...`
    })
  }

  return matches
}

/**
 * Replace all matches with new text
 * Preserves case if option is enabled
 */
export function replaceAllMatches(
  editor: Editor,
  data: FindReplaceWidgetData
): { success: boolean; message: string } {
  const { matches, replacement, options } = data

  if (matches.length === 0) {
    return { success: false, message: 'No matches found to replace' }
  }

  // Sort matches in reverse order (bottom to top)
  // This prevents position shifts from affecting subsequent replacements
  const sortedMatches = [...matches].sort((a, b) => b.from - a.from)

  let successCount = 0

  // Execute replacements from bottom to top
  for (const match of sortedMatches) {
    let newText = replacement

    // Case preservation logic
    if (options.preserveCase) {
      newText = preserveCase(match.text, replacement)
    }

    // Execute TipTap replace command
    const success = editor
      .chain()
      .focus()
      .insertContentAt({ from: match.from, to: match.to }, newText)
      .run()

    if (success) {
      successCount++
    }
  }

  if (successCount === matches.length) {
    return {
      success: true,
      message: `Replaced ${successCount} occurrence${successCount === 1 ? '' : 's'} of "${data.searchTerm}" with "${replacement}"`
    }
  } else if (successCount > 0) {
    return {
      success: true,
      message: `Replaced ${successCount} of ${matches.length} occurrences (some failed)`
    }
  } else {
    return {
      success: false,
      message: 'Failed to replace any occurrences'
    }
  }
}

/**
 * Convert text offset to TipTap document position
 * Accounts for node boundaries in ProseMirror document
 */
function textOffsetToDocPosition(editor: Editor, textOffset: number): number {
  // Simple MVP approach: Add 1 for document start
  // Works for single-paragraph documents
  return textOffset + 1

  // Advanced approach for multi-paragraph documents (future enhancement):
  // See textOffsetToDocPositionAdvanced in textSearch.ts
}

/**
 * Preserve case pattern from original text
 *
 * Examples:
 * - preserveCase("User", "customer") → "Customer"
 * - preserveCase("user", "customer") → "customer"
 * - preserveCase("USER", "customer") → "CUSTOMER"
 * - preserveCase("UsEr", "customer") → "Customer" (default to title case for mixed)
 */
export function preserveCase(original: string, replacement: string): string {
  // All uppercase
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase()
  }

  // All lowercase
  if (original === original.toLowerCase()) {
    return replacement.toLowerCase()
  }

  // Title case (first letter uppercase)
  if (original[0] === original[0].toUpperCase() && original.slice(1) === original.slice(1).toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase()
  }

  // Mixed case - default to title case
  return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase()
}
```

### Widget Utilities

Location: `/src/services/ai/widgets/find-replace/utils.ts`

```typescript
/**
 * Validate search term and replacement
 * Returns error message if invalid, null if valid
 */
export function validateFindReplaceInput(
  searchTerm: string,
  replacement: string
): string | null {
  if (!searchTerm || searchTerm.trim() === '') {
    return 'Search term cannot be empty'
  }

  if (searchTerm === replacement) {
    return 'Search term and replacement are identical - no changes needed'
  }

  if (searchTerm.length > 1000) {
    return 'Search term too long (max 1000 characters)'
  }

  if (replacement.length > 1000) {
    return 'Replacement text too long (max 1000 characters)'
  }

  return null
}

/**
 * Estimate impact of find & replace operation
 * Returns safety warning for large-scale replacements
 */
export function estimateReplaceImpact(matchCount: number): {
  isSafe: boolean
  warning?: string
} {
  if (matchCount === 0) {
    return { isSafe: true }
  }

  if (matchCount > 100) {
    return {
      isSafe: false,
      warning: `⚠️ This will replace ${matchCount} occurrences. This is a large operation that cannot be undone easily. Consider using Ctrl+Z to undo if needed.`
    }
  }

  if (matchCount > 50) {
    return {
      isSafe: true,
      warning: `⚠️ This will replace ${matchCount} occurrences. Use Ctrl+Z to undo if needed.`
    }
  }

  return { isSafe: true }
}
```

### Widget Styles

Location: `/src/services/ai/widgets/find-replace/styles.module.css`

```css
.find-replace-widget {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.widget-icon {
  color: var(--color-primary);
}

.widget-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}

.widget-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.label {
  color: var(--color-muted-foreground);
  min-width: 90px;
}

.search-term,
.replacement {
  background: var(--color-muted);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
}

.match-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: var(--color-muted);
  border-radius: 6px;
  font-size: 13px;
}

.match-count {
  font-weight: 500;
}

.options-summary {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.option-badge {
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.match-preview {
  background: var(--color-muted);
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
}

.preview-title {
  font-weight: 500;
  margin-bottom: 6px;
}

.match-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-family: 'Monaco', 'Courier New', monospace;
}

.match-number {
  color: var(--color-muted-foreground);
  min-width: 20px;
}

.match-context {
  flex: 1;
}

.match-old {
  background: rgba(239, 68, 68, 0.2);
  color: rgb(220, 38, 38);
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: 500;
}

.match-arrow {
  color: var(--color-muted-foreground);
  margin: 0 4px;
}

.match-new {
  background: rgba(34, 197, 94, 0.2);
  color: rgb(22, 163, 74);
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: 500;
}

.more-matches {
  color: var(--color-muted-foreground);
  font-style: italic;
  margin-top: 6px;
  margin-bottom: 0;
}

.widget-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-foreground);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-muted);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## 🔌 Integration with OpenAI Client

### Updated AI Tool Definition

Location: `/src/services/ai/openAIClient.ts`

```typescript
// NEW TOOL: Find and Replace All (replaces single-instance replaceText)
const findAndReplaceAllTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'findAndReplaceAll',
    description: 'Find all occurrences of a term and replace them intelligently. Shows preview before executing. Use this for bulk text replacements.',
    parameters: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          description: 'Text to find (e.g., "customer", "old brand name", "v1")'
        },
        replacement: {
          type: 'string',
          description: 'Text to replace with (e.g., "user", "new brand name", "v2")'
        },
        options: {
          type: 'object',
          description: 'Search and replace options',
          properties: {
            matchCase: {
              type: 'boolean',
              description: 'Case-sensitive matching (default: false)',
              default: false
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: true)',
              default: true
            },
            preserveCase: {
              type: 'boolean',
              description: 'Preserve original case pattern (User→Customer, user→customer, USER→CUSTOMER)',
              default: true
            },
            scope: {
              type: 'string',
              enum: ['document', 'selection'],
              description: 'Where to search (document = entire document, selection = only selected text)',
              default: 'document'
            }
          }
        }
      },
      required: ['searchTerm', 'replacement']
    }
  }
}
```

### Tool Execution Handler

```typescript
import { findAllMatches, replaceAllMatches } from './widgets/find-replace/executor'
import { validateFindReplaceInput } from './widgets/find-replace/utils'
import { ChatWidget, FindReplaceWidgetData } from './widgets/core/types'

/**
 * Handle findAndReplaceAll tool call from AI
 * Returns a widget for user confirmation
 */
function handleFindAndReplaceAll(
  args: any,
  editor: Editor
): { widget: ChatWidget } | { error: string } {
  const { searchTerm, replacement, options = {} } = args

  // Validate input
  const validationError = validateFindReplaceInput(searchTerm, replacement)
  if (validationError) {
    return { error: validationError }
  }

  // Set default options
  const findOptions = {
    matchCase: options.matchCase ?? false,
    wholeWord: options.wholeWord ?? true,
    preserveCase: options.preserveCase ?? true,
    scope: (options.scope ?? 'document') as 'document' | 'selection'
  }

  // Find all matches
  const matches = findAllMatches(editor, searchTerm, findOptions)

  // Create widget data
  const widgetData: FindReplaceWidgetData = {
    searchTerm,
    replacement,
    options: findOptions,
    matches
  }

  // Return widget for rendering
  return {
    widget: {
      type: 'find-replace',
      data: widgetData,
      onExecute: async (data) => {
        return replaceAllMatches(editor, data as FindReplaceWidgetData)
      },
      onCancel: () => {
        console.log('[FindReplace] User cancelled operation')
      }
    }
  }
}
```

---

## 🎨 UI/UX Flow

### User Journey

```
1. User sends message: "Replace all 'customer' with 'user'"

2. AI calls findAndReplaceAll tool

3. Widget appears in chat:
   ┌─────────────────────────────────────┐
   │ 🔄 Find & Replace                   │
   ├─────────────────────────────────────┤
   │ Find: customer                      │
   │ Replace with: user                  │
   │                                     │
   │ 🔍 14 matches found                 │
   │                                     │
   │ ✓ Whole word  ✓ Preserve case      │
   │                                     │
   │ Preview:                            │
   │ 1. ...the [customer] portal...     │
   │      ...the [user] portal...       │
   │ 2. ...Customer support team...     │
   │      ...User support team...       │
   │ 3. ...CUSTOMER ID field...         │
   │      ...USER ID field...           │
   │ ... and 11 more matches            │
   │                                     │
   │         [Cancel] [Replace All (14)]│
   └─────────────────────────────────────┘

4. User clicks "Replace All (14)"

5. Widget executes replacements:
   - Replaces from bottom to top (prevents position shifts)
   - Preserves case for each match
   - Shows "Replacing..." spinner

6. Success message:
   "✅ Replaced 14 occurrences of 'customer' with 'user'"

7. Widget disappears, normal chat resumes
```

### Edge Cases

#### No Matches Found
```
┌─────────────────────────────────────┐
│ 🔄 Find & Replace                   │
├─────────────────────────────────────┤
│ Find: customr                       │
│ Replace with: user                  │
│                                     │
│ 🔍 No matches found                 │
│                                     │
│                         [Cancel]    │
└─────────────────────────────────────┘
```

#### Large Replacement (>50 matches)
```
┌─────────────────────────────────────┐
│ 🔄 Find & Replace                   │
├─────────────────────────────────────┤
│ Find: the                           │
│ Replace with: a                     │
│                                     │
│ ⚠️  127 matches found               │
│                                     │
│ ⚠️ This will replace 127 occurrences│
│ Use Ctrl+Z to undo if needed.      │
│                                     │
│         [Cancel] [Replace All (127)]│
└─────────────────────────────────────┘
```

---

## 📝 Code Examples

### Example 1: Basic Find & Replace

**User Input**: "Replace 'hello' with 'hi'"

**AI Tool Call**:
```typescript
{
  name: 'findAndReplaceAll',
  arguments: {
    searchTerm: 'hello',
    replacement: 'hi',
    options: {
      matchCase: false,
      wholeWord: true,
      preserveCase: true,
      scope: 'document'
    }
  }
}
```

**Widget Data**:
```typescript
{
  type: 'find-replace',
  data: {
    searchTerm: 'hello',
    replacement: 'hi',
    options: { matchCase: false, wholeWord: true, preserveCase: true, scope: 'document' },
    matches: [
      { text: 'Hello', from: 1, to: 6, context: '...Hello world...' },
      { text: 'hello', from: 45, to: 50, context: '...say hello to...' },
      { text: 'HELLO', from: 89, to: 94, context: '...HELLO THERE...' }
    ]
  },
  onExecute: async (data) => replaceAllMatches(editor, data),
  onCancel: () => console.log('Cancelled')
}
```

**Execution Result**:
- "Hello world" → "Hi world" (preserved title case)
- "say hello to" → "say hi to" (preserved lowercase)
- "HELLO THERE" → "HI THERE" (preserved uppercase)

### Example 2: Case-Sensitive Replacement

**User Input**: "Replace 'API' with 'api' (case-sensitive)"

**AI Tool Call**:
```typescript
{
  name: 'findAndReplaceAll',
  arguments: {
    searchTerm: 'API',
    replacement: 'api',
    options: {
      matchCase: true,      // Case-sensitive
      wholeWord: false,     // Match partial words
      preserveCase: false,  // Don't preserve (user wants lowercase)
      scope: 'document'
    }
  }
}
```

**Result**:
- "API documentation" → "api documentation" (exact match)
- "api documentation" → "api documentation" (no change, lowercase 'api' not matched)
- "GRAPHQL_API_KEY" → "GRAPHQL_API_KEY" (no change, 'API' in uppercase not matched alone)

### Example 3: Whole Word Matching

**User Input**: "Replace 'user' with 'customer' (whole words only)"

**Without `wholeWord: true`**:
```
"user experience" → "customer experience" ✓
"username field" → "customername field" ✗ (WRONG!)
```

**With `wholeWord: true` (default)**:
```
"user experience" → "customer experience" ✓
"username field" → "username field" ✓ (no change, 'user' is not a whole word)
```

---

## 🚀 Implementation Checklist

### Phase 1: Core Widget System (1-2 days)
- [ ] Create `/src/services/ai/widgets/core/` directory
- [ ] Implement `types.ts` - ChatWidget interface
- [ ] Implement `registry.ts` - Widget registry
- [ ] Implement `WidgetRenderer.tsx` - Universal renderer
- [ ] Add widget initialization to app startup

### Phase 2: Find & Replace Widget (2-3 days)
- [ ] Create `/src/services/ai/widgets/find-replace/` directory
- [ ] Implement `executor.ts`:
  - [ ] `findAllMatches()` - Find all occurrences
  - [ ] `replaceAllMatches()` - Execute replacements
  - [ ] `preserveCase()` - Case preservation logic
  - [ ] `textOffsetToDocPosition()` - Position conversion
- [ ] Implement `utils.ts`:
  - [ ] `validateFindReplaceInput()` - Input validation
  - [ ] `estimateReplaceImpact()` - Safety warnings
- [ ] Implement `FindReplaceWidget.tsx` - React component
- [ ] Implement `styles.module.css` - Widget styles

### Phase 3: Integration (1-2 days)
- [ ] Add `findAndReplaceAllTool` to OpenAI client
- [ ] Update tool executor to handle widget returns
- [ ] Integrate `WidgetRenderer` into AIChatSidebar
- [ ] Update chat message types to support widgets
- [ ] Add widget rendering in message list

### Phase 4: Testing (1-2 days)
- [ ] Test basic find & replace (lowercase, uppercase, title case)
- [ ] Test case preservation (User→Customer, user→customer, USER→CUSTOMER)
- [ ] Test whole word matching ("user" vs "username")
- [ ] Test case-sensitive matching
- [ ] Test large replacements (>50 matches, >100 matches)
- [ ] Test edge cases (no matches, identical search/replace)
- [ ] Test cancellation
- [ ] Test position accuracy in multi-paragraph documents

### Phase 5: Polish (1 day)
- [ ] Add loading states and animations
- [ ] Add keyboard shortcuts (Enter to confirm, Esc to cancel)
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] Add analytics tracking (widget usage, success rate)
- [ ] Update documentation
- [ ] Add user guide tips

**Total Estimated Time**: 5-8 days

---

## 🧪 Test Cases

### Test 1: Basic Replacement
```typescript
describe('Find & Replace Widget', () => {
  it('should find and replace all occurrences', async () => {
    const editor = createEditor('Hello world. Hello everyone. HELLO THERE.')
    const matches = findAllMatches(editor, 'hello', {
      matchCase: false,
      wholeWord: true,
      preserveCase: true,
      scope: 'document'
    })

    expect(matches).toHaveLength(3)
    expect(matches[0].text).toBe('Hello')
    expect(matches[1].text).toBe('Hello')
    expect(matches[2].text).toBe('HELLO')

    const result = replaceAllMatches(editor, {
      searchTerm: 'hello',
      replacement: 'hi',
      options: { matchCase: false, wholeWord: true, preserveCase: true, scope: 'document' },
      matches
    })

    expect(result.success).toBe(true)
    expect(editor.getText()).toBe('Hi world. Hi everyone. HI THERE.')
  })
})
```

### Test 2: Case Preservation
```typescript
it('should preserve case patterns', () => {
  expect(preserveCase('User', 'customer')).toBe('Customer')
  expect(preserveCase('user', 'customer')).toBe('customer')
  expect(preserveCase('USER', 'customer')).toBe('CUSTOMER')
  expect(preserveCase('UsEr', 'customer')).toBe('Customer') // Mixed → Title case
})
```

### Test 3: Whole Word Matching
```typescript
it('should match whole words only', () => {
  const editor = createEditor('user username user_id')
  const matches = findAllMatches(editor, 'user', {
    matchCase: false,
    wholeWord: true,
    preserveCase: false,
    scope: 'document'
  })

  expect(matches).toHaveLength(1) // Only "user", not "username" or "user_id"
  expect(matches[0].text).toBe('user')
})
```

### Test 4: No Matches
```typescript
it('should handle no matches gracefully', () => {
  const editor = createEditor('Hello world')
  const matches = findAllMatches(editor, 'goodbye', {
    matchCase: false,
    wholeWord: true,
    preserveCase: false,
    scope: 'document'
  })

  expect(matches).toHaveLength(0)

  const result = replaceAllMatches(editor, {
    searchTerm: 'goodbye',
    replacement: 'bye',
    options: { matchCase: false, wholeWord: true, preserveCase: false, scope: 'document' },
    matches
  })

  expect(result.success).toBe(false)
  expect(result.message).toContain('No matches found')
})
```

---

## 🎯 Success Metrics

### Functional Requirements
- ✅ Finds ALL occurrences (not just first one)
- ✅ Shows preview with match count
- ✅ Preserves case correctly (User→Customer, user→customer, USER→CUSTOMER)
- ✅ Supports whole word matching
- ✅ Supports case-sensitive matching
- ✅ Executes replacements from bottom to top (prevents position shifts)
- ✅ Shows clear success/failure messages
- ✅ Allows cancellation

### UX Requirements
- ✅ Widget appears inline in chat
- ✅ Preview shows first 3 matches
- ✅ Clear "Replace All (N)" button
- ✅ Loading state during execution
- ✅ No page freezing during large replacements
- ✅ Accessible via keyboard (Tab, Enter, Esc)
- ✅ Works with screen readers (ARIA labels)

### Performance Requirements
- ✅ Finds matches in <100ms for 10,000-word documents
- ✅ Replaces 100+ matches in <500ms
- ✅ No UI freezing during execution
- ✅ Memory-efficient (no document cloning)

---

## 🔮 Future Enhancements

### Phase 2: Regex Support
Allow advanced users to use regex patterns:
```typescript
{
  searchTerm: '/user_(\\d+)/g',  // Regex pattern
  replacement: 'customer_$1',    // Capture group reference
  options: {
    isRegex: true
  }
}
```

### Phase 3: Undo/Redo Integration
Integrate with TipTap's undo stack:
```typescript
// After replacement
editor.commands.setMeta('findReplaceOperation', {
  matchCount: matches.length,
  searchTerm,
  replacement
})
```

### Phase 4: Scope Selection
Allow replacing only within user's text selection:
```typescript
{
  options: {
    scope: 'selection'  // Only search/replace in selected text
  }
}
```

### Phase 5: History & Favorites
Save frequently used find/replace pairs:
```typescript
const savedReplacements = [
  { searchTerm: 'customer', replacement: 'user', frequency: 12 },
  { searchTerm: 'v1', replacement: 'v2', frequency: 8 }
]
```

---

## 📚 References

- TipTap Editor API: https://tiptap.dev/api/editor
- ProseMirror Document Model: https://prosemirror.net/docs/guide/
- React Hook Patterns: https://react.dev/reference/react
- Regex in JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions

---

**Status**: ✅ Ready for implementation
**Estimated Effort**: 5-8 days
**Risk Level**: Low (isolated widget system, no breaking changes)
**Dependencies**: None (uses existing TipTap editor)
