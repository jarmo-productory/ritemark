/**
 * Find & Replace Widget - Types
 */

/**
 * Arguments from OpenAI tool call
 */
export interface FindReplaceArgs {
  searchPattern: string
  replacement: string
  options?: {
    matchCase?: boolean
    wholeWord?: boolean
    preserveCase?: boolean
  }
}

/**
 * Single match result
 */
export interface FindMatch {
  from: number
  to: number
  text: string
  context: string  // Surrounding text for preview
}
