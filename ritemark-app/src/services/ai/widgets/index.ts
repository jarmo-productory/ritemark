/**
 * AI Widgets - Main Entry Point
 *
 * Registers all widget plugins and exports public API
 */

import { widgetRegistry } from './core'
import { findReplacePlugin } from './find-replace'
import { rephraseWidgetPlugin } from './rephrase'

// Register all widgets
widgetRegistry.register(findReplacePlugin)
widgetRegistry.register(rephraseWidgetPlugin)

// Export public API
export { widgetRegistry } from './core'
export { WidgetRenderer } from './core'
export type { ChatWidget, WidgetPlugin, WidgetResult, WidgetPreview } from './core/types'

// Export individual widgets
export { findReplacePlugin } from './find-replace'
export { rephraseWidgetPlugin } from './rephrase'
