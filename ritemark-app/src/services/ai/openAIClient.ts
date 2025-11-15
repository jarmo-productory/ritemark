import OpenAI from 'openai'
import { Editor } from '@tiptap/react'
import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'
import { ToolExecutor } from './toolExecutor'
import { findTextInDocument } from './textSearch'
import { apiKeyManager } from './apiKeyManager'
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
  controller?: AbortController
}

/**
 * User intent detection for chat vs edit modes
 * Analyzes user message to determine if they want to discuss or edit
 */
export type UserIntent = 'discussion' | 'edit'

/**
 * Analyze user intent from message content
 * Returns 'discussion' for brainstorming/questions, 'edit' for document changes
 * Defaults to 'discussion' if ambiguous (safer - prevents unwanted edits)
 */
export function analyzeIntent(message: string): UserIntent {
  const discussionKeywords = [
    'what do you think', 'help me brainstorm', 'should i', 'how can i',
    'explain', 'why', 'what if', 'tell me about', 'thoughts on',
    'can you help', 'any ideas', 'suggestions for', 'what about',
    'how would you', 'do you think', 'is it good', 'feedback on'
  ]

  const editKeywords = [
    // English
    'replace', 'add', 'insert', 'delete', 'fix', 'change', 'update',
    'write', 'create', 'remove', 'modify', 'rewrite', 'rephrase',
    'make it', 'turn this into', 'convert', 'transform',
    // Estonian
    'asenda', 'lisa', 'kustuta', 'paranda', 'muuda', 'kirjuta', 'eemalda',
    // Swedish
    'ersätt', 'lägg till', 'ta bort', 'ändra', 'skriv',
    // German
    'ersetzen', 'hinzufügen', 'löschen', 'ändern', 'schreiben',
    // Patterns (language-agnostic)
    '-->', '→', '=>', 'to '  // Common replacement patterns
  ]

  const messageLower = message.toLowerCase()

  // Check for discussion keywords first (higher priority)
  if (discussionKeywords.some(kw => messageLower.includes(kw))) {
    return 'discussion'
  }

  // Check for edit keywords
  if (editKeywords.some(kw => messageLower.includes(kw))) {
    return 'edit'
  }

  // Default to discussion if ambiguous (safer - prevents unwanted edits)
  return 'discussion'
}

/**
 * Tool specification for OpenAI function calling
 * Defines the replaceText tool that the AI can invoke
 */
const replaceTextTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'replaceText',
    description: 'Replace a specific text string in the document with new text',
    parameters: {
      type: 'object',
      properties: {
        searchText: {
          type: 'string',
          description: 'The exact text to find and replace in the document'
        },
        newText: {
          type: 'string',
          description: 'The replacement text that will replace the search text'
        }
      },
      required: ['searchText', 'newText']
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
 * Tool specification for findAndReplaceAll
 * Allows AI to replace ALL occurrences of a term with intelligent case preservation
 */
const findAndReplaceAllTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'findAndReplaceAll',
    description: 'Find ALL occurrences of a term and replace with new text, preserving case when possible. Use this for bulk renaming/replacement operations.',
    parameters: {
      type: 'object',
      properties: {
        searchPattern: {
          type: 'string',
          description: 'Text pattern to find (case-insensitive by default)'
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
              description: 'Case-sensitive matching (default: false)'
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only - prevents replacing "user" in "username" (default: false)'
            },
            preserveCase: {
              type: 'boolean',
              description: 'Preserve original case in replacement - "User" → "Customer", "user" → "customer", "USER" → "CUSTOMER" (default: true)'
            },
            scope: {
              type: 'string',
              enum: ['document', 'selection'],
              description: 'Search in full document or current selection (default: document)'
            }
          }
        }
      },
      required: ['searchPattern', 'replacement']
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
 * @param options - Optional configuration for streaming
 * @returns Result indicating success/failure with optional message
 *
 * @example
 * const result = await executeCommand("replace hello with goodbye", editor, selection)
 * if (result.success) {
 *   console.log(result.message) // "Replaced 'hello' with 'goodbye'"
 * } else {
 *   console.error(result.error) // "Text 'hello' not found in document"
 * }
 *
 * @example Streaming
 * const result = await executeCommand("write an intro", editor, selection, [], {
 *   stream: true,
 *   onStream: (chunk) => console.log(chunk)
 * })
 */
export async function executeCommand(
  prompt: string,
  editor: Editor,
  selection: EditorSelection,
  conversationHistory: ConversationMessage[] = [],
  options?: {
    stream?: boolean
    onStream?: (chunk: string) => void
  }
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
1. **replaceText** - Replace existing text with new text (for fixing, improving, updating)
   - When searching: Use EXACT RENDERED TEXT (no markdown syntax)
   - When replacing: Use plain text or markdown as needed

2. **insertText** - Add NEW content at a position (for adding, writing new sections, expanding)
   - ALWAYS use markdown formatting in content parameter
   - Examples: "## Heading", "**bold text**", "*italic*", "- list item", "> quote"
   - The editor automatically renders markdown - you don't need a separate formatting tool

3. **findAndReplaceAll** - Replace ALL occurrences of a term (bulk operations)
   - Use for renaming concepts: "replace all 'user' with 'customer'"
   - Preserves case by default: "User" → "Customer", "user" → "customer", "USER" → "CUSTOMER"
   - Options: matchCase (case-sensitive), wholeWord (avoid partial matches), preserveCase (default: true)
   - Returns count of replacements made

**Your Task**: Choose the appropriate tool based on user intent:
- Use **replaceText** when modifying a single occurrence (e.g., "fix this typo", "change that sentence")
- Use **findAndReplaceAll** when replacing multiple occurrences (e.g., "replace all X with Y", "rename X to Y throughout")
- Use **insertText** when adding new content (e.g., "add examples", "write conclusion", "insert summary")
- For insertText: ALWAYS include markdown formatting (headings, bold, lists, etc.)

**Critical Rules**:
- replaceText searchText: Use EXACT RENDERED TEXT from document (no markdown)
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

      // Detect user intent (discussion vs edit)
      const userIntent = analyzeIntent(prompt)
      console.log(`[OpenAI] Detected intent: ${userIntent}`)

      console.log(`[OpenAI] Sending request with ${messages.length} messages (${conversationHistory.length} history)`)
      const startTime = Date.now()

      // Call OpenAI API with conditional tools based on intent
      const response = await openai.chat.completions.create(
        {
          model: 'gpt-5-mini',
          messages,
          // Discussion mode: No tools (pure conversation)
          // Edit mode: Provide editing tools
          tools: userIntent === 'discussion' ? undefined : [replaceTextTool, insertTextTool, findAndReplaceAllTool],
          tool_choice: userIntent === 'discussion' ? undefined : 'auto'
        },
        {
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      console.log(`[OpenAI] Response received in ${duration}ms`)

      // Discussion mode: Return AI's text response directly
      if (userIntent === 'discussion') {
        const aiMessage = response.choices[0]?.message?.content
        return {
          success: true,
          controller,
          message: aiMessage || 'No response from AI'
        }
      }

      // Edit mode: Extract and execute tool call
      const toolCall = response.choices[0]?.message?.tool_calls?.[0]

      if (!toolCall) {
        // AI didn't understand the command or didn't call a tool
        const aiMessage = response.choices[0]?.message?.content
        return {
          success: false,
          controller: controller,
          error: aiMessage || "I didn't understand that command. Try something like 'replace hello with goodbye'."
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
          controller,
          error: 'Failed to parse AI response. Please try again.'
        }
      }

      // Execute ToolExecutor
      const executor = new ToolExecutor(editor, selection)

      // Handle replaceText tool
      if (toolName === 'replaceText') {
        // Validate replaceText arguments
        if (!args.searchText || !args.newText) {
          return {
            success: false,
          controller,
            error: 'Invalid tool arguments: missing searchText or newText'
          }
        }

        // Find text in document using text search utility
        const position = findTextInDocument(editor, args.searchText)

        if (!position) {
          return {
            success: false,
          controller,
            error: `Text "${args.searchText}" not found in document`
          }
        }

        // Execute replaceText via ToolExecutor
        const success = executor.execute({
          tool: 'replaceText',
          arguments: {
            from: position.from,
            to: position.to,
            newText: args.newText
          }
        })

        if (success) {
          return {
            success: true,
          controller,
            message: `Replaced "${args.searchText}" with "${args.newText}"`
          }
        } else {
          return {
            success: false,
          controller,
            error: `Failed to replace text. Make sure "${args.searchText}" exists in the document.`
          }
        }
      }

      // Handle insertText tool
      if (toolName === 'insertText') {
        // Validate insertText arguments
        if (!args.position || !args.content) {
          return {
            success: false,
          controller,
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
          controller,
            message
          }
        } else {
          return {
            success: false,
          controller,
            error: 'Failed to insert text. Please try again.'
          }
        }
      }

      // Handle findAndReplaceAll tool
      if (toolName === 'findAndReplaceAll') {
        // Validate findAndReplaceAll arguments
        if (!args.searchPattern || !args.replacement) {
          return {
            success: false,
          controller,
            error: 'Invalid tool arguments: missing searchPattern or replacement'
          }
        }

        // Execute findAndReplaceAll via ToolExecutor
        const result = executor.execute({
          tool: 'findAndReplaceAll',
          arguments: args
        })

        // Type guard: result can be boolean or ToolExecutionResult
        if (typeof result === 'boolean') {
          if (result) {
            return {
              success: true,
              controller,
              message: `Replaced occurrence(s) of "${args.searchPattern}"`
            }
          } else {
            return {
              success: false,
              controller,
              error: `Failed to replace text. Pattern "${args.searchPattern}" not found in document.`
            }
          }
        }

        // result is ToolExecutionResult
        if (result.success) {
          return {
            success: true,
            controller,
            message: result.message || `Replaced ${result.count || 0} occurrence(s) of "${args.searchPattern}"`
          }
        } else {
          return {
            success: false,
            controller,
            error: result.error || `Failed to replace text. Pattern "${args.searchPattern}" not found in document.`
          }
        }
      }

      // Unknown tool
      return {
        success: false,
          controller,
        error: `Unknown tool: ${toolName}`
      }
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          controller,
          error: 'Request cancelled. You can try again or modify your command.',
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
      model: 'gpt-5-mini',
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
