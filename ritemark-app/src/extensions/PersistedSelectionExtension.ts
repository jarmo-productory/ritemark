import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface PersistedSelectionOptions {
  onSelectionChange?: (from: number, to: number) => void
}

// Export the plugin key so it can be used by the helper function
export const persistedSelectionPluginKey = new PluginKey('persistedSelection')

export const PersistedSelectionExtension = Extension.create<PersistedSelectionOptions>({
  name: 'persistedSelection',

  addProseMirrorPlugins() {
    const pluginKey = persistedSelectionPluginKey

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            console.log('[PersistedSelectionExtension] Plugin initialized')
            return DecorationSet.empty
          },
          apply(tr, oldState, _oldEditorState, newEditorState) {
            // Check for meta transaction to set persisted selection
            const meta = tr.getMeta(pluginKey)

            if (meta && meta.type === 'setPersistedSelection') {
              const { from, to } = meta
              console.log('[PersistedSelectionExtension] Meta received:', { from, to })

              // Clear decorations if null
              if (from === null || to === null) {
                console.log('[PersistedSelectionExtension] Clearing decorations')
                return DecorationSet.empty
              }

              // Create decorations immediately
              if (from >= 0 && to > from && to <= newEditorState.doc.content.size) {
                try {
                  const decoration = Decoration.inline(from, to, {
                    class: 'persisted-selection-highlight'
                  })
                  const newDecorations = DecorationSet.create(newEditorState.doc, [decoration])
                  console.log('[PersistedSelectionExtension] Created decorations in apply:', from, '-', to)
                  return newDecorations
                } catch (error) {
                  console.error('[PersistedSelectionExtension] Error creating decoration:', error)
                  return DecorationSet.empty
                }
              }

              return DecorationSet.empty
            }

            // Map existing decorations through document changes
            if (tr.docChanged) {
              console.log('[PersistedSelectionExtension] Doc changed, mapping decorations')
              return oldState.map(tr.mapping, tr.doc)
            }

            // Preserve existing decorations
            return oldState
          }
        },
        props: {
          decorations(state) {
            const decorations = pluginKey.getState(state)
            const count = decorations ? decorations.find().length : 0
            console.log('[PersistedSelectionExtension] Returning decorations from props, count:', count)
            return decorations
          }
        }
      })
    ]
  }
})

// Helper function to set persisted selection from outside
export function setPersistedSelection(editor: any, from: number | null, to: number | null) {
  console.log('[setPersistedSelection] Called with:', { from, to })

  if (!editor || !editor.view) {
    console.error('[setPersistedSelection] Editor or view not available')
    return
  }

  try {
    const tr = editor.view.state.tr.setMeta(persistedSelectionPluginKey, {
      type: 'setPersistedSelection',
      from,
      to
    })

    editor.view.dispatch(tr)
    console.log('[setPersistedSelection] Transaction dispatched successfully')
  } catch (error) {
    console.error('[setPersistedSelection] Error dispatching transaction:', error)
  }
}
