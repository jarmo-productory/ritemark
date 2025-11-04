import { Editor } from '@tiptap/react'

export interface Position {
  from: number
  to: number
}

/**
 * Find text in document and return TipTap position
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

  // Find text offset (case-insensitive, first occurrence)
  const lowerPlainText = plainText.toLowerCase()
  const lowerSearchText = searchText.toLowerCase()
  const textOffset = lowerPlainText.indexOf(lowerSearchText)

  if (textOffset === -1) {
    return null // Text not found
  }

  // Convert text offset to TipTap document position
  const docFrom = textOffsetToDocPosition(textOffset)
  const docTo = docFrom + searchText.length

  return { from: docFrom, to: docTo }
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
