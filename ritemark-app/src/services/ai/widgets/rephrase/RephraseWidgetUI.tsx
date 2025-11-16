/**
 * Rephrase Widget UI Component
 *
 * Modal dialog showing original vs rephrased text comparison
 */

import { useState, useEffect } from 'react'
import type { RephraseWidget } from './RephraseWidget'
import type { RephrasePreview } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'

interface RephraseWidgetUIProps {
  open: boolean
  widget: RephraseWidget
  onExecute: () => Promise<void>
  onCancel: () => void
}

export function RephraseWidgetUI({ open, widget, onExecute, onCancel }: RephraseWidgetUIProps) {
  const [preview, setPreview] = useState<RephrasePreview | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    const rephrasePreview = widget.getRephrasePreview()
    setPreview(rephrasePreview)
  }, [widget])

  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      await onExecute()
    } finally {
      setIsExecuting(false)
    }
  }

  if (!preview) {
    return null
  }

  const wordDiff = preview.newWordCount - preview.originalWordCount

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Rephrase Selection</DialogTitle>
            {preview.style && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {preview.style}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Original Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Original</span>
              <span className="text-xs text-muted-foreground">
                {preview.originalWordCount} {preview.originalWordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
            <div className="p-3 rounded-md border bg-muted/30 text-sm leading-relaxed min-h-[80px] max-h-[200px] overflow-y-auto">
              {preview.originalText}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center justify-center py-2">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Rephrased Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">Rephrased</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {preview.newWordCount} {preview.newWordCount === 1 ? 'word' : 'words'}
                </span>
                {wordDiff !== 0 && (
                  <span className={`text-xs ${wordDiff > 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {wordDiff > 0 ? '+' : ''}{wordDiff}
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-md border border-primary/20 bg-primary/5 text-sm leading-relaxed min-h-[80px] max-h-[200px] overflow-y-auto">
              {preview.newText}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isExecuting} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleExecute} disabled={isExecuting || widget.state !== 'ready'} className="flex-1">
            {isExecuting ? 'Replacing...' : 'Replace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
