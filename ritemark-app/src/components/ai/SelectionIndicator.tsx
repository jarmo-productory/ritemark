import { Sparkles, Info, X, Quote } from 'lucide-react'
import type { EditorSelection } from '@/types/editor'

interface SelectionIndicatorProps {
  selection?: EditorSelection
  onClearSelection?: () => void
}

export function SelectionIndicator({ selection, onClearSelection }: SelectionIndicatorProps) {
  console.log('[SelectionIndicator] Received selection:', selection)

  // Immediately hide when no selection
  if (!selection || selection.isEmpty || !selection.text.trim()) {
    return null // Changed from info card to null for immediate disappearance
  }

  // Visual constraints for large selections
  const maxPreviewLength = 200
  const text = selection.text
  const isTruncated = text.length > maxPreviewLength
  const previewText = isTruncated ? text.substring(0, maxPreviewLength) + '...' : text
  const charCount = text.length
  const wordCount = selection.wordCount

  return (
    <div className="border-b bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-amber-200/50 dark:border-amber-800/50">
        <div className="flex items-center space-x-2">
          <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
            Selected Text
          </span>
        </div>
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
          </button>
        )}
      </div>

      {/* Rich Preview Card */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Preview Text */}
        <div className="bg-white dark:bg-gray-900 rounded-md border border-amber-200 dark:border-amber-800/50 p-2.5 max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
            {previewText}
          </p>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-amber-800 dark:text-amber-200">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            </span>
            <span className="text-amber-600 dark:text-amber-400">•</span>
            <span className="font-medium">{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
          </div>
          {isTruncated && (
            <span className="text-amber-600 dark:text-amber-400 italic">
              +{charCount - maxPreviewLength} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
