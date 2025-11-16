/**
 * Rephrase Widget
 *
 * AI-powered text rephrasing widget with modal preview.
 * Shows original vs rephrased text side-by-side before replacement.
 */

import type { Editor } from '@tiptap/react'
import type {
  ChatWidget,
  WidgetState,
  WidgetPreview,
  WidgetResult,
  WidgetDisplayMode
} from '../core/types'
import type { RephraseArgs, RephrasePreview } from './types'

export class RephraseWidget implements ChatWidget {
  id: string
  type = 'rephrase'
  state: WidgetState = 'initializing'
  displayMode: WidgetDisplayMode = 'modal' // Always use modal for rephrase

  private editor: Editor
  private args: RephraseArgs
  private preview: RephrasePreview | null = null
  private originalSelection: { from: number; to: number } | null = null

  constructor(editor: Editor, args: RephraseArgs) {
    this.id = `rephrase-${Date.now()}`
    this.editor = editor
    this.args = args
  }

  async initialize(args: unknown): Promise<WidgetPreview> {
    this.state = 'initializing'

    try {
      // Use this.args instead of parameter (WidgetRenderer calls with empty object)
      console.log('[RephraseWidget] Initializing with this.args:', this.args)
      const rephraseArgs = this.args as RephraseArgs

      // Validate rephraseArgs has required fields
      if (!rephraseArgs || !rephraseArgs.newText) {
        console.error('[RephraseWidget] Missing newText in args:', rephraseArgs)
        throw new Error('Missing rephrased text from AI. Please try again.')
      }

      // Get current selection
      const { from, to } = this.editor.state.selection
      const originalText = this.editor.state.doc.textBetween(from, to, ' ')

      // Validate selection exists
      if (!originalText || originalText.trim().length === 0) {
        throw new Error('No text selected. Please select text to rephrase.')
      }

      // Store selection positions
      this.originalSelection = { from, to }

      // Calculate word counts (safe now after validation)
      const originalWordCount = originalText.split(/\s+/).filter(Boolean).length
      const newWordCount = rephraseArgs.newText.split(/\s+/).filter(Boolean).length

      // Create preview
      this.preview = {
        originalText,
        originalWordCount,
        newText: rephraseArgs.newText,
        newWordCount,
        style: rephraseArgs.style
      }

      this.state = 'ready'

      return {
        count: 1, // Always replacing 1 selection
        estimatedChanges: {
          modifications: 1
        }
      }
    } catch (error) {
      this.state = 'error'
      console.error('[RephraseWidget] Initialization failed:', error)
      throw error
    }
  }

  getPreview(): WidgetPreview | null {
    if (!this.preview) return null

    return {
      count: 1,
      estimatedChanges: {
        modifications: 1
      }
    }
  }

  /**
   * Get rephrase-specific preview data
   * Used by RephraseWidgetUI component
   */
  getRephrasePreview(): RephrasePreview | null {
    return this.preview
  }

  async execute(): Promise<WidgetResult> {
    if (!this.preview || !this.originalSelection) {
      return {
        success: false,
        message: 'No preview available. Cannot execute.'
      }
    }

    this.state = 'executing'

    try {
      const { from, to } = this.originalSelection

      // Replace selected text with rephrased version
      this.editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, this.preview.newText)
        .run()

      this.state = 'completed'

      return {
        success: true,
        message: `Rephrased text (${this.preview.originalWordCount} → ${this.preview.newWordCount} words)`,
        changes: 1
      }
    } catch (error) {
      this.state = 'error'
      console.error('[RephraseWidget] Execution failed:', error)

      return {
        success: false,
        message: 'Failed to rephrase text. Please try again.'
      }
    }
  }

  cancel(): void {
    this.state = 'cancelled'
  }

  destroy(): void {
    // Cleanup if needed
    this.preview = null
    this.originalSelection = null
  }
}
