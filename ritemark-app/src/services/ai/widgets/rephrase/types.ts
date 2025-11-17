/**
 * Rephrase Widget Types
 *
 * Tool arguments and interfaces for AI-powered text rephrasing
 */

/**
 * Arguments passed from OpenAI function call
 */
export interface RephraseArgs {
  newText: string
  style?: 'longer' | 'shorter' | 'simpler' | 'formal' | 'casual' | 'professional'
}

/**
 * Rephrase preview data
 */
export interface RephrasePreview {
  originalText: string
  originalWordCount: number
  newText: string
  newWordCount: number
  style?: string
}
