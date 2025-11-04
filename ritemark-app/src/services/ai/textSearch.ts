import { Editor } from '@tiptap/react'

export interface Position {
  from: number
  to: number
}

/**
 * Normalize markdown text for fuzzy matching
 * Removes escape characters and normalizes whitespace
 * Fixes issues with markdown escapes like \. \* \_
 *
 * @param text Text to normalize
 * @returns Normalized text suitable for comparison
 */
export function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\\./g, '.')      // Remove escaped dots (## 1\. → ## 1.)
    .replace(/\\\*/g, '*')      // Remove escaped asterisks
    .replace(/\\_/g, '_')       // Remove escaped underscores
    .replace(/\\#/g, '#')       // Remove escaped hashes
    .replace(/\\\[/g, '[')      // Remove escaped brackets
    .replace(/\\\]/g, ']')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\s+/g, ' ')       // Normalize multiple spaces to single
    .trim()
}

/**
 * Normalize Unicode characters for consistent matching
 * Handles special characters like õ, ü, ä, ñ, etc.
 *
 * @param text Text to normalize
 * @returns Unicode-normalized text (NFD form)
 */
export function normalizeUnicode(text: string): string {
  // NFD (Canonical Decomposition) normalizes é → e + combining accent
  // Then toLowerCase() for case-insensitive matching
  return text.normalize('NFD').toLowerCase()
}

/**
 * Find text in document and return TipTap position
 * Uses progressive fallback strategy:
 * 1. Exact match (case-insensitive)
 * 2. Markdown-normalized match (removes escapes)
 * 3. Unicode-normalized match (handles special chars)
 *
 * @param editor TipTap editor instance
 * @param searchText Text to find (case-insensitive)
 * @returns Position { from, to } or null if not found
 */
export function findTextInDocument(
  editor: Editor,
  searchText: string
): Position | null {
  // Get plain text from editor
  const plainText = editor.getText()

  // Strategy 1: Try exact case-insensitive match first
  const lowerPlainText = plainText.toLowerCase()
  const lowerSearchText = searchText.toLowerCase()
  let textOffset = lowerPlainText.indexOf(lowerSearchText)

  if (textOffset !== -1) {
    console.log('[textSearch] Found with exact match')
    const docFrom = textOffsetToDocPosition(textOffset)
    const docTo = docFrom + searchText.length
    return { from: docFrom, to: docTo }
  }

  // Strategy 2: Try markdown-normalized search (removes escapes)
  const normalizedDoc = normalizeMarkdown(lowerPlainText)
  const normalizedSearch = normalizeMarkdown(lowerSearchText)
  textOffset = normalizedDoc.indexOf(normalizedSearch)

  if (textOffset !== -1) {
    console.log('[textSearch] Found with markdown normalization (removed escapes)')
    const docFrom = textOffsetToDocPosition(textOffset)
    const docTo = docFrom + searchText.length
    return { from: docFrom, to: docTo }
  }

  // Strategy 3: Try Unicode-normalized search (handles õ, ü, ä, etc.)
  const unicodeDoc = normalizeUnicode(normalizeMarkdown(plainText))
  const unicodeSearch = normalizeUnicode(normalizeMarkdown(searchText))
  textOffset = unicodeDoc.indexOf(unicodeSearch)

  if (textOffset !== -1) {
    console.log('[textSearch] Found with Unicode normalization (special chars)')
    const docFrom = textOffsetToDocPosition(textOffset)
    const docTo = docFrom + searchText.length
    return { from: docFrom, to: docTo }
  }

  console.log('[textSearch] Text not found after 3 strategies')
  console.log('[textSearch] Searched for:', searchText)
  console.log('[textSearch] In document:', plainText.substring(0, 200) + '...')

  return null // Text not found
}

/**
 * Convert text offset to TipTap document position
 * TipTap positions include node boundaries, text offsets don't
 *
 * MVP approach: Simple conversion with +1 for document start
 * Works for single-paragraph documents
 */
function textOffsetToDocPosition(textOffset: number): number {
  // Simple conversion (MVP approach)
  // Add 1 for document start position
  return textOffset + 1
}

/**
 * Advanced: Convert text offset to exact TipTap document position
 * Handles multi-paragraph documents correctly
 *
 * @param editor TipTap editor instance
 * @param textOffset Text offset in plain text
 * @returns Document position in TipTap format
 */
export function textOffsetToDocPositionAdvanced(
  editor: Editor,
  textOffset: number
): number {
  let currentOffset = 0
  let docPosition = 1 // Start at position 1 (after doc node)

  // Traverse document nodes
  editor.state.doc.descendants((node, pos) => {
    if (node.isText) {
      const textLength = node.text?.length || 0

      if (currentOffset + textLength > textOffset) {
        // Found the target node
        const offsetInNode = textOffset - currentOffset
        docPosition = pos + offsetInNode
        return false // Stop traversal
      }

      currentOffset += textLength
    }

    return true // Continue traversal
  })

  return docPosition
}
