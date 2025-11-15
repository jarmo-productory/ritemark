import { Editor } from '@tiptap/react'
import type { EditorSelection } from '@/types/editor'
import { findTextInDocument } from './textSearch'
import { marked } from 'marked'

export interface ToolCall {
  tool: string
  arguments: Record<string, any>
}

export interface ToolExecutionResult {
  success: boolean
  message?: string
  error?: string
  count?: number
}

interface ReplaceTextArgs {
  from: number
  to: number
  newText: string
}

interface InsertTextArgs {
  position:
    | { type: 'absolute'; location: 'start' | 'end' }
    | { type: 'relative'; anchor: string; placement: 'before' | 'after' }
    | { type: 'selection' }
  content: string
}

interface FindAndReplaceAllArgs {
  searchPattern: string
  replacement: string
  options?: {
    matchCase?: boolean
    wholeWord?: boolean
    preserveCase?: boolean
    scope?: 'document' | 'selection'
  }
}

/**
 * Preserve case from original text in replacement
 * Examples:
 * - "User" + "customer" → "Customer" (capitalize first)
 * - "user" + "customer" → "customer" (lowercase)
 * - "USER" + "customer" → "CUSTOMER" (uppercase)
 */
function preserveCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement

  // All uppercase
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return replacement.toUpperCase()
  }

  // All lowercase
  if (original === original.toLowerCase()) {
    return replacement.toLowerCase()
  }

  // First letter uppercase (Title Case)
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase()
  }

  // Default: return replacement as-is
  return replacement.toLowerCase()
}

export class ToolExecutor {
  private editor: Editor
  private selection: EditorSelection

  constructor(editor: Editor, selection: EditorSelection) {
    this.editor = editor
    this.selection = selection
  }

  execute(toolCall: ToolCall): boolean | ToolExecutionResult {
    switch (toolCall.tool) {
      case 'replaceText':
        return this.replaceText(toolCall.arguments as ReplaceTextArgs)
      case 'insertText':
        return this.insertText(toolCall.arguments as InsertTextArgs)
      case 'findAndReplaceAll':
        return this.findAndReplaceAll(toolCall.arguments as FindAndReplaceAllArgs)
      default:
        console.error(`Unknown tool: ${toolCall.tool}`)
        return false
    }
  }

  private replaceText(args: ReplaceTextArgs): boolean {
    const { from, to, newText } = args

    // Validate parameters
    if (from < 0 || to < from || to > this.editor.state.doc.content.size) {
      console.error('Invalid range')
      return false
    }

    // Execute TipTap command
    return this.editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, newText)
      .run()
  }

  private insertText(args: InsertTextArgs): boolean {
    let insertPosition: number

    // Resolve position strategy to TipTap position
    switch (args.position.type) {
      case 'absolute':
        if (args.position.location === 'start') {
          insertPosition = 1 // Position 1 is after doc node
        } else {
          // End of document
          insertPosition = this.editor.state.doc.content.size - 1
        }
        break

      case 'relative': {
        // Use text search to find anchor
        const anchorPos = findTextInDocument(this.editor, args.position.anchor)
        if (!anchorPos) {
          console.error(`[insertText] Anchor text not found: "${args.position.anchor}"`)
          return false
        }

        // Insert before or after the found text
        insertPosition =
          args.position.placement === 'after' ? anchorPos.to : anchorPos.from
        break
      }

      case 'selection': {
        // Insert at current selection
        const { to } = this.editor.state.selection
        insertPosition = to
        break
      }

      default:
        console.error('[insertText] Unknown position type')
        return false
    }

    // Validate position
    const docSize = this.editor.state.doc.content.size
    if (insertPosition < 0 || insertPosition > docSize) {
      console.error(
        `[insertText] Invalid position ${insertPosition} (doc size: ${docSize})`
      )
      return false
    }

    // Convert markdown to HTML for TipTap
    let htmlContent: string
    try {
      htmlContent = marked(args.content, { breaks: true, gfm: true }) as string
      console.log(`[insertText] Converted markdown to HTML (${args.content.length} → ${htmlContent.length} chars)`)
    } catch (error) {
      console.error('[insertText] Markdown conversion error:', error)
      // Fallback to raw content if markdown parsing fails
      htmlContent = args.content
    }

    // Execute insertion with TipTap
    const success = this.editor
      .chain()
      .focus()
      .insertContentAt(insertPosition, htmlContent)
      .run()

    if (success) {
      console.log(
        `[insertText] Inserted ${htmlContent.length} chars at position ${insertPosition} (${args.position.type})`
      )
    } else {
      console.error('[insertText] TipTap command failed')
    }

    return success
  }

  private findAndReplaceAll(args: FindAndReplaceAllArgs): ToolExecutionResult {
    const { searchPattern, replacement, options = {} } = args
    const {
      matchCase = false,
      wholeWord = false,
      preserveCase: shouldPreserveCase = true,
      scope = 'document'
    } = options

    console.log(`[findAndReplaceAll] Searching for "${searchPattern}", replacing with "${replacement}"`, {
      matchCase,
      wholeWord,
      preserveCase: shouldPreserveCase,
      scope
    })

    // Get search range based on scope
    let searchFrom = 0
    let searchTo = this.editor.state.doc.content.size

    if (scope === 'selection' && !this.selection.isEmpty) {
      searchFrom = this.selection.from
      searchTo = this.selection.to
      console.log(`[findAndReplaceAll] Searching within selection: ${searchFrom}-${searchTo}`)
    }

    // Get document text for searching
    const docText = this.editor.state.doc.textBetween(searchFrom, searchTo, '\n')

    // Build regex pattern
    let pattern = searchPattern
    if (wholeWord) {
      // Word boundary regex: \b doesn't work well with non-ASCII, so use more robust pattern
      pattern = `(?:^|\\s|[^\\w])${escapeRegex(searchPattern)}(?=$|\\s|[^\\w])`
    } else {
      pattern = escapeRegex(searchPattern)
    }

    const flags = matchCase ? 'g' : 'gi'
    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch (e) {
      console.error('[findAndReplaceAll] Invalid regex pattern:', e)
      return {
        success: false,
        error: `Invalid search pattern: ${searchPattern}`
      }
    }

    // Find all matches
    const matches: Array<{ from: number; to: number; text: string }> = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(docText)) !== null) {
      const matchText = match[0]
      const matchStart = match.index
      const matchEnd = matchStart + matchText.length

      // Convert relative position to absolute document position
      const absFrom = searchFrom + matchStart
      const absTo = searchFrom + matchEnd

      matches.push({
        from: absFrom,
        to: absTo,
        text: matchText
      })

      console.log(`[findAndReplaceAll] Found match at ${absFrom}-${absTo}: "${matchText}"`)
    }

    if (matches.length === 0) {
      return {
        success: false,
        error: `Pattern "${searchPattern}" not found in ${scope}`,
        count: 0
      }
    }

    console.log(`[findAndReplaceAll] Found ${matches.length} matches, replacing...`)

    // Replace all matches in reverse order (to maintain positions)
    let successCount = 0
    const chain = this.editor.chain().focus()

    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i]
      const replacementText = shouldPreserveCase
        ? preserveCase(match.text, replacement)
        : replacement

      console.log(`[findAndReplaceAll] Replacing "${match.text}" with "${replacementText}" at ${match.from}-${match.to}`)

      chain.insertContentAt({ from: match.from, to: match.to }, replacementText)
      successCount++
    }

    const success = chain.run()

    if (success) {
      return {
        success: true,
        message: `Replaced ${successCount} occurrence(s) of "${searchPattern}" with "${replacement}"`,
        count: successCount
      }
    } else {
      return {
        success: false,
        error: 'Failed to execute replacements',
        count: 0
      }
    }
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
