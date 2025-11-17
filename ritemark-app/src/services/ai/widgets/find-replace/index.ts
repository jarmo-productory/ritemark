/**
 * Find & Replace Widget - Public API
 */

import type { Editor } from '@tiptap/react'
import type { WidgetPlugin } from '../core/types'
import { FindReplaceWidget } from './FindReplaceWidget'
import type { FindReplaceArgs } from './types'

/**
 * Widget plugin definition
 */
export const findReplacePlugin: WidgetPlugin = {
  metadata: {
    id: 'findReplace',
    name: 'Find & Replace',
    description: 'Find and replace text in the document with preview',
    toolName: 'findAndReplaceAll',  // OpenAI tool name
    icon: 'replace'
  },
  factory: (editor: Editor, args: unknown) => {
    return new FindReplaceWidget(editor, args as FindReplaceArgs)
  }
}

// Export widget class and types
export { FindReplaceWidget } from './FindReplaceWidget'
export type { FindReplaceArgs, FindMatch } from './types'
