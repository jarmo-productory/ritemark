import OpenAI from 'openai'
import { Editor } from '@tiptap/react'
import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'
import { ToolExecutor } from './toolExecutor'
import { apiKeyManager } from './apiKeyManager'
import { widgetRegistry } from './widgets'
import type { ChatWidget } from './widgets'
import type { EditorSelection } from '@/types/editor'

/**
 * Initialize TurndownService for HTML to Markdown conversion
 * Same configuration as Editor component to ensure consistency
 */
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**'
})
turndownService.use(tables)

/**
 * OpenAI Client for AI-powered text editing
 * Uses GPT-5 Mini with function calling to execute editor commands
 */

export interface AICommandResult {
  success: boolean
  message?: string
  error?: string
  widget?: ChatWidget  // Widget to display (instead of immediate execution)
}

/**
 * Tool specification for rephraseText
 * AI-powered text rephrasing with modal preview
 */
const rephraseTextTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'rephraseText',
    description:
      'Rephrase/rewrite the SELECTED text. Use when user wants to modify selected text (make longer, shorter, simpler, more formal, etc). ONLY works when text is selected (selection.isEmpty must be false).',
    parameters: {
      type: 'object',
      properties: {
        newText: {
          type: 'string',
          description: 'The rephrased/rewritten version of the selected text'
        },
        style: {
          type: 'string',
          description:
            'Style applied to the text (e.g., "longer", "shorter", "simpler", "formal", "casual", "professional")',
          enum: ['longer', 'shorter', 'simpler', 'formal', 'casual', 'professional']
        }
      },
      required: ['newText']
    }
  }
}

/**
 * Tool specification for findAndReplaceAll
 * Widget-based find and replace with preview
 */
const findAndReplaceAllTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'findAndReplaceAll',
    description: 'Find ALL occurrences of text and replace with new text. Shows preview before execution. Supports case preservation and whole word matching.',
    parameters: {
      type: 'object',
      properties: {
        searchPattern: {
          type: 'string',
          description: 'Text to search for (will find ALL occurrences)'
        },
        replacement: {
          type: 'string',
          description: 'Replacement text'
        },
        options: {
          type: 'object',
          properties: {
            matchCase: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)'
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)'
            },
            preserveCase: {
              type: 'boolean',
              description: 'Preserve original case (User→Customer, user→customer, USER→CUSTOMER) (default: true)'
            }
          }
        }
      },
      required: ['searchPattern', 'replacement']
    }
  }
}

/**
 * Tool specification for insertText
 * Allows AI to add new content at specific positions
 */
const insertTextTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'insertText',
    description:
      'Insert NEW text at a specific position in the document (does not replace existing text). Use this to add content, write new sections, or expand the document.',
    parameters: {
      type: 'object',
      properties: {
        position: {
          type: 'object',
          description: 'Where to insert the text (choose one strategy)',
          oneOf: [
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['absolute'] },
                location: {
                  type: 'string',
                  enum: ['start', 'end'],
                  description: 'Insert at document start or end'
                }
              },
              required: ['type', 'location']
            },
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['relative'] },
                anchor: {
                  type: 'string',
                  description:
                    'Text to search for as reference point (e.g., "Introduction", "first paragraph")'
                },
                placement: {
                  type: 'string',
                  enum: ['before', 'after'],
                  description: 'Insert before or after the anchor text'
                }
              },
              required: ['type', 'anchor', 'placement']
            },
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['selection'] }
              },
              required: ['type'],
              description: 'Insert at current editor selection/cursor'
            }
          ]
        },
        content: {
          type: 'string',
          description:
            'The text to insert. ALWAYS use markdown formatting: ## for headings, **bold**, *italic*, - for lists, > for quotes, etc. The editor will automatically render it.'
        }
      },
      required: ['position', 'content']
    }
  }
}

/**
 * Initialize OpenAI client with API key from encrypted storage
 * Note: No .env.local fallback to prevent unexpected billing
 * Note: dangerouslyAllowBrowser: true is required for client-side usage
 */
async function createOpenAIClient(): Promise<OpenAI | null> {
  // Get API key from encrypted storage (user-provided only)
  const apiKey = await apiKeyManager.getAPIKey()

  if (!apiKey) {
    console.error('[OpenAI] No API key configured. Please add your API key in Settings → General.')
    return null
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  })
}

/**
 * Conversation message for OpenAI API
 */
export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Execute a user command using OpenAI function calling
 *
 * @param prompt - User's natural language command (e.g., "replace hello with goodbye")
 * @param editor - TipTap editor instance for document manipulation
 * @param selection - Current editor selection context (REQUIRED)
 * @param conversationHistory - Previous messages for context (optional)
 * @returns Result indicating success/failure with optional message
 *
 * @example
 * const result = await executeCommand("replace hello with goodbye", editor, selection)
 * if (result.success) {
 *   console.log(result.message) // "Replaced 'hello' with 'goodbye'"
 * } else {
 *   console.error(result.error) // "Text 'hello' not found in document"
 * }
 */
export async function executeCommand(
  prompt: string,
  editor: Editor,
  selection: EditorSelection,
  conversationHistory: ConversationMessage[] = []
): Promise<AICommandResult> {
  // Validate API key
  const openai = await createOpenAIClient()
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API key not configured. Please add your API key in Settings → General.'
    }
  }

  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'Please provide a command'
    }
  }

  try {
    // Get plain text from editor (matches what text search uses)
    const plainText = editor.getText()
    const wordCount = plainText.split(/\s+/).filter(Boolean).length

    // Build system message with full document and selection context
    const systemMessage = {
      role: 'system' as const,
      content: `You are editing a document.

**Full Document Content** (${wordCount} words, rendered text):
\`\`\`
${plainText}
\`\`\`

**Currently Selected Text**: ${selection.isEmpty ? 'None' : `"${selection.text}"`}

**CRITICAL - Text Format**:
- The content above is RENDERED TEXT, not markdown source
- No markdown syntax appears (no ##, no **, no *, no \\_)
- This is exactly what the user sees in the editor
- When searching, use the EXACT TEXT as shown above

**Text Search Strategy**:
- System uses multiple search strategies automatically:
  1. Exact match (fast, case-insensitive)
  2. Markdown-normalized (removes escapes like \\. \\* \\_)
  3. Unicode-normalized (handles special chars like õ, ü, ä)
- You MUST provide text exactly as it appears in the rendered content
- Examples:
  - Search for "ETTEVÕTTE KRITEERIUMID" not "## ETTEVÕTTE KRITEERIUMID"
  - Search for "1. Item" not "1\\. Item"
  - Special characters (õ, ü, ä, ñ) work correctly

**Document Context**:
- When user says "this document", they mean the full content above
- When user says "this" or "selected text", they mean the selected portion
- Document may contain non-English text (Estonian, Swedish, German, etc.)

**Available Tools**:
1. **rephraseText** - Rephrase/rewrite SELECTED text (modal widget with preview)
   - ONLY use when text is SELECTED (selection.isEmpty === false)
   - Use for: "make this longer", "simplify this", "rewrite formally", "make it shorter"
   - AI generates new version, shows original vs new in modal preview
   - User confirms replacement

2. **findAndReplaceAll** - Find and replace ALL occurrences of text (widget-based with preview)
   - Shows preview with count and samples before execution
   - User confirms replacement in UI widget
   - Supports case-sensitive search, whole word matching, case preservation
   - When searching: Use EXACT RENDERED TEXT (no markdown syntax)

3. **insertText** - Add NEW content at a position (for adding, writing new sections, expanding)
   - ALWAYS use markdown formatting in content parameter
   - Examples: "## Heading", "**bold text**", "*italic*", "- list item", "> quote"
   - The editor automatically renders markdown - you don't need a separate formatting tool

**CRITICAL - When to Use Tools vs Conversational Response**:

Use tools ONLY when user explicitly wants to EDIT the document:
- "replace X with Y" → findAndReplaceAll
- "make this longer/shorter/simpler" (with selection) → rephraseText
- "add examples after this" → insertText
- "write a conclusion" → insertText
- "change all mentions of X to Y" → findAndReplaceAll

Respond conversationally (NO TOOLS) when user:
- Asks questions: "what does X mean?", "explain Y", "mida see tähendab?"
- Wants information: "tell me about...", "what is...", "mis on..."
- Brainstorming: "give me ideas for...", "suggest topics..."
- Discussion: "what do you think about...", "how can I improve..."
- Requests advice: "should I...", "is this correct..."

**If unclear whether user wants to edit or discuss, PREFER CONVERSATIONAL RESPONSE.**

**Tool Selection Guide**:
- Use **rephraseText** when user wants to MODIFY SELECTED text (e.g., "make this longer", "simplify", "rewrite more formally")
  - CRITICAL: Check if selection.isEmpty === false BEFORE using this tool
  - Generate the rephrased version and include it in newText parameter
- Use **findAndReplaceAll** when user wants to replace text globally (e.g., "replace X with Y", "change all X to Y", "asenda X Y-ga")
- Use **insertText** when adding new content (e.g., "add examples", "write conclusion", "insert summary")
- For insertText: ALWAYS include markdown formatting (headings, bold, lists, etc.)

**Critical Rules**:
- findAndReplaceAll searchPattern: Use EXACT RENDERED TEXT from document (no markdown)
- insertText content: USE MARKDOWN FORMATTING (## headings, **bold**, - lists)
- Never create a separate formatting tool - markdown handles all styling`
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 second timeout (longer for complex operations)

    try {
      // Build messages array: system + conversation history + current prompt
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        systemMessage,
        ...conversationHistory,
        {
          role: 'user',
          content: prompt
        }
      ]

      const startTime = Date.now()

      // Call OpenAI API with function calling
      // Using gpt-5-nano (fastest model) for quick intent detection and tool selection
      const response = await openai.chat.completions.create(
        {
          model: 'gpt-5-nano',
          messages,
          tools: [rephraseTextTool, findAndReplaceAllTool, insertTextTool],
          tool_choice: 'auto'
        },
        {
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      // Extract tool call from response
      const toolCall = response.choices[0]?.message?.tool_calls?.[0]

      if (!toolCall) {
        // AI chose to respond conversationally (brainstorming/discussion mode)
        const aiMessage = response.choices[0]?.message?.content
        return {
          success: true,
          message: aiMessage || "I can help you brainstorm ideas or edit your document. What would you like to do?"
        }
      }

      // Parse tool call (extract tool name and arguments)
      let toolName: string
      let args: any
      try {
        // Type assertion for tool call (OpenAI SDK type issue)
        const functionCall = toolCall as any
        toolName = functionCall.function.name
        args = JSON.parse(functionCall.function.arguments)
      } catch (parseError) {
        console.error('Failed to parse tool call arguments:', parseError)
        return {
          success: false,
          error: 'Failed to parse AI response. Please try again.'
        }
      }

      // Check if this tool has a widget
      const widgetPlugin = widgetRegistry.findByToolName(toolName)
      if (widgetPlugin) {
        // Create widget instead of executing immediately
        const widget = widgetPlugin.factory(editor, args)
        return {
          success: true,
          widget
        }
      }

      // Execute ToolExecutor (legacy tools without widgets)
      const executor = new ToolExecutor(editor, selection)

      // Handle insertText tool
      if (toolName === 'insertText') {
        // Validate insertText arguments
        if (!args.position || !args.content) {
          return {
            success: false,
            error: 'Invalid tool arguments: missing position or content'
          }
        }

        // Execute insertText via ToolExecutor
        const success = executor.execute({
          tool: 'insertText',
          arguments: args
        })

        if (success) {
          // Build user-friendly message based on position strategy
          let message = `Inserted content `
          if (args.position.type === 'absolute') {
            message += `at document ${args.position.location}`
          } else if (args.position.type === 'relative') {
            message += `${args.position.placement} "${args.position.anchor}"`
          } else if (args.position.type === 'selection') {
            message += `at cursor position`
          }

          return {
            success: true,
            message
          }
        } else {
          return {
            success: false,
            error: 'Failed to insert text. Please try again.'
          }
        }
      }

      // Unknown tool
      return {
        success: false,
        error: `Unknown tool: ${toolName}`
      }
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out after 90 seconds. The AI may be processing a complex request. Please try a simpler command or try again.'
        }
      }

      throw error // Re-throw for outer catch block
    }
  } catch (error: any) {
    // Handle OpenAI API errors
    if (error?.status === 401) {
      return {
        success: false,
        error: 'Invalid API key. Please check your API key in Settings → General.'
      }
    }

    if (error?.status === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again in a moment.'
      }
    }

    if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
      return {
        success: false,
        error: 'OpenAI service is temporarily unavailable. Please try again later.'
      }
    }

    // Network or unknown errors
    console.error('OpenAI API error:', error)
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Test OpenAI connection
 * Useful for validating API key during setup
 */
export async function testConnection(): Promise<AICommandResult> {
  const openai = await createOpenAIClient()
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API key not configured. Please add your API key in Settings.'
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    })

    if (response.choices[0]?.message?.content) {
      return {
        success: true,
        message: 'OpenAI connection successful'
      }
    }

    return {
      success: false,
      error: 'Unexpected response from OpenAI'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Connection test failed'
    }
  }
}
