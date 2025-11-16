/**
 * Rephrase Widget Plugin
 *
 * Exports widget for registration
 */

import type { WidgetPlugin } from '../core/types'
import { RephraseWidget } from './RephraseWidget'

export const rephraseWidgetPlugin: WidgetPlugin = {
  metadata: {
    id: 'rephrase',
    name: 'Rephrase Text',
    description: 'Rephrase selected text with AI (longer, shorter, simpler, formal, etc.)',
    toolName: 'rephraseText'
  },
  factory: (editor, args) => {
    // Don't call initialize here - WidgetRenderer will do it
    return new RephraseWidget(editor, args)
  }
}

export { RephraseWidget } from './RephraseWidget'
export { RephraseWidgetUI } from './RephraseWidgetUI'
export type { RephraseArgs, RephrasePreview } from './types'
