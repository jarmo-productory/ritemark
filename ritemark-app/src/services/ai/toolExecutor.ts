import { Editor } from '@tiptap/react'

export interface ToolCall {
  tool: string
  arguments: Record<string, any>
}

interface ReplaceTextArgs {
  from: number
  to: number
  newText: string
}

export class ToolExecutor {
  private editor: Editor

  constructor(editor: Editor) {
    this.editor = editor
  }

  execute(toolCall: ToolCall): boolean {
    switch (toolCall.tool) {
      case 'replaceText':
        return this.replaceText(toolCall.arguments as ReplaceTextArgs)
      default:
        console.error(`Unknown tool: ${toolCall.tool}`)
        return false
    }
  }

  private replaceText(args: ReplaceTextArgs): boolean {
    const { from, to, newText } = args

    // Validate parameters
    if (from < 0 || to < from || to > this.editor.state.doc.content.size) {
      console.error('Invalid range')
      return false
    }

    // Execute TipTap command
    return this.editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, newText)
      .run()
  }
}
