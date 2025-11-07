import { Editor } from '@tiptap/react'
import type { EditorSelection } from '@/types/editor'
import { findTextInDocument } from './textSearch'
import { marked } from 'marked'

export interface ToolCall {
  tool: string
  arguments: Record<string, any>
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

export class ToolExecutor {
  private editor: Editor

  constructor(editor: Editor, _selection: EditorSelection) {
    this.editor = editor
    // selection parameter kept for future use, prefixed with _ to indicate intentionally unused
  }

  execute(toolCall: ToolCall): boolean {
    switch (toolCall.tool) {
      case 'replaceText':
        return this.replaceText(toolCall.arguments as ReplaceTextArgs)
      case 'insertText':
        return this.insertText(toolCall.arguments as InsertTextArgs)
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
}
