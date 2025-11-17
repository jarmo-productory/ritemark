/**
 * Widget Renderer
 *
 * Generic React component that renders any widget plugin.
 * Handles widget lifecycle, state management, and user interactions.
 */

import { useState, useEffect } from 'react'
import type { ChatWidget, WidgetPreview, WidgetResult, WidgetState } from './types'
import { RephraseWidgetUI } from '../rephrase/RephraseWidgetUI'
import type { RephraseWidget } from '../rephrase/RephraseWidget'

export interface WidgetRendererProps {
  widget: ChatWidget
  onComplete?: (result: WidgetResult) => void
  onCancel?: () => void
}

/**
 * Generic widget renderer component
 * Wraps any widget with standard UI chrome (header, actions, state)
 */
export function WidgetRenderer({ widget, onComplete, onCancel }: WidgetRendererProps) {
  const [state, setState] = useState<WidgetState>(widget.state)
  const [preview, setPreview] = useState<WidgetPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize widget on mount
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        setState('initializing')
        // Widget's initialize method generates the preview
        const previewData = await widget.initialize({})
        if (mounted) {
          setPreview(previewData)
          setState('ready')
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize widget')
          setState('error')
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [widget])

  // Handle execute button click
  const handleExecute = async () => {
    try {
      setState('executing')
      const result = await widget.execute()
      setState('completed')
      onComplete?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed')
      setState('error')
    }
  }

  // Handle cancel button click
  const handleCancel = () => {
    widget.cancel()
    setState('cancelled')
    onCancel?.()
  }

  // Render different states
  if (state === 'initializing') {
    return (
      <div className="widget-container widget-loading">
        <div className="widget-spinner">Loading preview...</div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="widget-container widget-error">
        <div className="widget-error-message">{error}</div>
        <button onClick={handleCancel} className="widget-button widget-button-secondary">
          Close
        </button>
      </div>
    )
  }

  if (state === 'cancelled') {
    return (
      <div className="widget-container widget-cancelled">
        <div className="widget-message">Cancelled</div>
      </div>
    )
  }

  if (state === 'completed') {
    return null // Don't show widget after completion (result shown in chat)
  }

  // Ready or executing state - show widget-specific UI or generic preview

  // Rephrase widget - uses built-in Dialog component (like AuthErrorDialog pattern)
  if (widget.type === 'rephrase') {
    return (
      <RephraseWidgetUI
        open={state === 'ready' || state === 'executing'}
        widget={widget as RephraseWidget}
        onExecute={handleExecute}
        onCancel={handleCancel}
      />
    )
  }

  // Generic widget UI (for findReplace, etc.)
  return (
    <div className={`widget-container widget-${state}`}>
      <div className="widget-header">
        <span className="widget-type">{widget.type}</span>
      </div>

      {preview && (
        <div className="widget-preview">
          <div className="widget-preview-count">
            {preview.count === 0 ? (
              <span className="widget-preview-empty">No matches found</span>
            ) : (
              <span className="widget-preview-found">
                Found {preview.count} occurrence{preview.count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {preview.samples && preview.samples.length > 0 && (
            <ul className="widget-preview-samples">
              {preview.samples.map((sample, i) => (
                <li key={i} className="widget-preview-sample">
                  {sample}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="widget-actions">
        <button
          onClick={handleCancel}
          className="widget-button widget-button-secondary"
          disabled={state === 'executing'}
        >
          Cancel
        </button>
        <button
          onClick={handleExecute}
          className="widget-button widget-button-primary"
          disabled={state === 'executing' || preview?.count === 0}
        >
          {state === 'executing'
            ? `${widget.actionLabel || 'Processing'}...`
            : preview?.count
              ? `${widget.actionLabel || 'Apply'} (${preview.count})`
              : widget.actionLabel || 'Apply'}
        </button>
      </div>
    </div>
  )
}
