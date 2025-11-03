/**
 * Keyboard Shortcuts Modal
 * Displays all available keyboard shortcuts in the app
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    keys: string
    description: string
  }>
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Editor Shortcuts',
    shortcuts: [
      { keys: '⌘/Ctrl + B', description: 'Bold' },
      { keys: '⌘/Ctrl + I', description: 'Italic' },
      { keys: '⌘/Ctrl + K', description: 'Insert link' },
      { keys: '⌘/Ctrl + Z', description: 'Undo' },
      { keys: '⌘/Ctrl + Shift + Z', description: 'Redo' },
    ],
  },
  {
    title: 'Document Shortcuts',
    shortcuts: [
      { keys: '⌘/Ctrl + S', description: 'Save to Drive' },
      { keys: '⌘/Ctrl + Shift + S', description: 'Save as new file' },
      { keys: '⌘/Ctrl + O', description: 'Open from Drive' },
      { keys: '⌘/Ctrl + Shift + H', description: 'Version history' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: '⌘/Ctrl + /', description: 'Toggle TOC' },
      { keys: 'Esc', description: 'Close dialog/modal' },
    ],
  },
]

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and edit faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
