/**
 * Widget Plugin System - Core Types
 *
 * Defines the base interface for all AI-powered widgets.
 * Widgets are interactive UI components that preview and execute AI operations.
 */

import type { Editor } from '@tiptap/react'

/**
 * Widget execution result
 */
export interface WidgetResult {
  success: boolean
  message: string
  changes?: number
  errors?: string[]
}

/**
 * Widget preview information
 * Shows user what will happen before execution
 */
export interface WidgetPreview {
  count: number           // How many items found/affected
  samples?: string[]      // Sample matches (first 3-5)
  estimatedChanges?: {
    additions?: number
    deletions?: number
    modifications?: number
  }
}

/**
 * Widget state during lifecycle
 */
export type WidgetState =
  | 'initializing'   // Loading preview
  | 'ready'          // Preview ready, waiting for user action
  | 'executing'      // Currently executing
  | 'completed'      // Successfully completed
  | 'cancelled'      // User cancelled
  | 'error'          // Error occurred

/**
 * Widget display mode
 * Determines how widget is rendered in UI
 */
export type WidgetDisplayMode =
  | 'inline'   // Rendered inline in sidebar (default)
  | 'modal'    // Rendered in modal dialog (for larger content)

/**
 * Base interface for all chat widgets
 *
 * Lifecycle:
 * 1. Widget created with AI tool call arguments
 * 2. initialize() called to generate preview
 * 3. User sees preview in chat
 * 4. User clicks "Execute" or "Cancel"
 * 5. execute() or cancel() called
 * 6. Result shown in chat
 */
export interface ChatWidget {
  // Widget metadata
  id: string
  type: string

  // Widget state
  state: WidgetState

  // Display mode (inline in sidebar or modal dialog)
  displayMode?: WidgetDisplayMode

  // Initialize widget (load preview)
  initialize(args: unknown): Promise<WidgetPreview>

  // Get current preview
  getPreview(): WidgetPreview | null

  // Execute the widget operation
  execute(): Promise<WidgetResult>

  // Cancel the widget
  cancel(): void

  // Cleanup
  destroy(): void
}

/**
 * Widget plugin metadata
 * Used for registration and discovery
 */
export interface WidgetMetadata {
  id: string                    // Unique widget ID (e.g., 'findReplace')
  name: string                  // Display name (e.g., 'Find & Replace')
  description: string           // What this widget does
  toolName: string              // OpenAI tool name that triggers this widget
  icon?: string                 // Icon name (optional)
}

/**
 * Widget factory function
 * Creates widget instances with editor context
 */
export type WidgetFactory = (
  editor: Editor,
  args: unknown
) => ChatWidget

/**
 * Widget plugin definition
 * Combines metadata with factory function
 */
export interface WidgetPlugin {
  metadata: WidgetMetadata
  factory: WidgetFactory
}

/**
 * Widget renderer props
 * Props passed to widget React components
 */
export interface WidgetRendererProps {
  widget: ChatWidget
  onExecute: () => Promise<void>
  onCancel: () => void
}
