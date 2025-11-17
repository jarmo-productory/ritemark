/**
 * Find & Replace Widget
 *
 * Interactive widget for finding and replacing text in the document.
 * Provides preview before execution and handles case preservation.
 */

import type { Editor } from '@tiptap/react'
import type { ChatWidget, WidgetPreview, WidgetResult, WidgetState } from '../core/types'
import type { FindReplaceArgs, FindMatch } from './types'
import { findAllMatches, replaceAllMatches } from './executor'

export class FindReplaceWidget implements ChatWidget {
  // Widget metadata
  id: string
  type = 'Find & Replace'
  actionLabel = 'Replace All'

  // Widget state
  state: WidgetState = 'initializing'

  // Editor context
  private editor: Editor
  private args: FindReplaceArgs

  // Preview data
  private matches: FindMatch[] = []
  private preview: WidgetPreview | null = null

  constructor(editor: Editor, args: FindReplaceArgs) {
    this.id = `find-replace-${Date.now()}`
    this.editor = editor
    this.args = args
  }

  /**
   * Initialize widget - find all matches and generate preview
   */
  async initialize(): Promise<WidgetPreview> {
    try {
      // Find all matches in document
      this.matches = findAllMatches(
        this.editor,
        this.args.searchPattern,
        this.args.options
      )

      // Generate preview with samples
      const samples = this.matches.slice(0, 5).map((m) => m.context)

      this.preview = {
        count: this.matches.length,
        samples,
        estimatedChanges: {
          modifications: this.matches.length
        }
      }

      this.state = 'ready'
      return this.preview
    } catch (err) {
      this.state = 'error'
      throw new Error(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  /**
   * Get current preview
   */
  getPreview(): WidgetPreview | null {
    return this.preview
  }

  /**
   * Execute the find and replace operation
   */
  async execute(): Promise<WidgetResult> {
    if (this.state !== 'ready') {
      return {
        success: false,
        message: 'Widget not ready for execution',
        errors: ['Widget must be in ready state']
      }
    }

    if (this.matches.length === 0) {
      return {
        success: false,
        message: 'No matches found',
        changes: 0
      }
    }

    try {
      this.state = 'executing'

      // Execute replacement
      const count = replaceAllMatches(
        this.editor,
        this.matches,
        this.args.replacement,
        this.args.options?.preserveCase ?? true  // Default to preserving case
      )

      this.state = 'completed'

      return {
        success: true,
        message: `Replaced ${count} occurrence${count !== 1 ? 's' : ''} of "${this.args.searchPattern}" with "${this.args.replacement}"`,
        changes: count
      }
    } catch (err) {
      this.state = 'error'
      return {
        success: false,
        message: 'Replacement failed',
        errors: [err instanceof Error ? err.message : 'Unknown error']
      }
    }
  }

  /**
   * Cancel the widget
   */
  cancel(): void {
    this.state = 'cancelled'
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.matches = []
    this.preview = null
  }
}
