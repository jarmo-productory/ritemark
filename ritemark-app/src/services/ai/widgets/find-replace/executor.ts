/**
 * Find & Replace Executor
 *
 * Deterministic algorithm for finding and replacing text in TipTap editor.
 * Handles case preservation, whole word matching, and position management.
 */

import type { Editor } from '@tiptap/react'
import type { FindMatch, FindReplaceArgs } from './types'

/**
 * Find all matches in the document using ProseMirror positions
 * CRITICAL: Uses doc.descendants() to get proper ProseMirror positions
 * Plain text positions would be incorrect (don't account for node boundaries)
 */
export function findAllMatches(
  editor: Editor,
  searchPattern: string,
  options: FindReplaceArgs['options'] = {}
): FindMatch[] {
  const { matchCase = false, wholeWord = false } = options
  const matches: FindMatch[] = []

  // Build regex pattern
  let pattern = searchPattern
  if (wholeWord) {
    pattern = `\\b${escapeRegex(pattern)}\\b`
  } else {
    pattern = escapeRegex(pattern)
  }

  const flags = matchCase ? 'g' : 'gi'
  const regex = new RegExp(pattern, flags)

  // Get editor state and document
  const { state } = editor
  const { doc } = state

  // Traverse ProseMirror document nodes to get correct positions
  doc.descendants((node, pos) => {
    // Only process text nodes
    if (!node.isText) return

    const text = node.text || ''

    // Find all matches in this text node
    let match: RegExpExecArray | null
    // Reset regex lastIndex for each node
    regex.lastIndex = 0

    while ((match = regex.exec(text)) !== null) {
      // Calculate ProseMirror positions (pos = node start position)
      const from = pos + match.index
      const to = from + match[0].length
      const matchedText = match[0]

      // Get context (30 chars before and after within this text node)
      const contextStart = Math.max(0, match.index - 30)
      const contextEnd = Math.min(text.length, match.index + match[0].length + 30)
      const context =
        (contextStart > 0 ? '...' : '') +
        text.slice(contextStart, match.index) +
        '【' +
        matchedText +
        '】' +
        text.slice(match.index + match[0].length, contextEnd) +
        (contextEnd < text.length ? '...' : '')

      matches.push({
        from, // ✅ ProseMirror position (includes node boundaries)
        to, // ✅ ProseMirror position
        text: matchedText,
        context
      })
    }
  })

  return matches
}

/**
 * Replace all matches with new text
 * Returns number of replacements made
 */
export function replaceAllMatches(
  editor: Editor,
  matches: FindMatch[],
  replacement: string,
  preserveCase: boolean = false
): number {
  if (matches.length === 0) {
    return 0
  }

  // Sort matches by position (descending) to maintain correct positions
  const sortedMatches = [...matches].sort((a, b) => b.from - a.from)

  // Replace in reverse order to prevent position shifts
  // CRITICAL: Execute each replacement individually (not chained)
  // because chaining doesn't update positions correctly
  let successCount = 0

  for (const match of sortedMatches) {
    const replacementText = preserveCase ? preserveCaseTransform(match.text, replacement) : replacement

    try {
      // Execute each replacement immediately (not chained)
      editor
        .chain()
        .focus()
        .insertContentAt({ from: match.from, to: match.to }, replacementText)
        .run()
      successCount++
    } catch (err) {
      console.error('[FindReplace] Failed to replace match:', err)
    }
  }

  return successCount
}

/**
 * Preserve case from original text when replacing
 *
 * Examples:
 * - User + customer → Customer
 * - user + customer → customer
 * - USER + customer → CUSTOMER
 * - UsEr + customer → Customer (title case if first char is uppercase)
 */
function preserveCaseTransform(original: string, replacement: string): string {
  if (!original || !replacement) {
    return replacement
  }

  // All uppercase
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return replacement.toUpperCase()
  }

  // All lowercase
  if (original === original.toLowerCase()) {
    return replacement.toLowerCase()
  }

  // Title case (first char uppercase)
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase()
  }

  // Default: lowercase
  return replacement.toLowerCase()
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
