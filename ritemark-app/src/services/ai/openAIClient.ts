import OpenAI from 'openai'
import { Editor } from '@tiptap/react'
import { ToolExecutor } from './toolExecutor'
import { findTextInDocument } from './textSearch'
import { apiKeyManager } from './apiKeyManager'

/**
 * OpenAI Client for AI-powered text editing
 * Uses GPT-5 Mini with function calling to execute editor commands
 */

export interface AICommandResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * Tool specification for OpenAI function calling
 * Defines the replaceText tool that the AI can invoke
 */
const replaceTextTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'replaceText',
    description: 'Replace a specific text string in the document',
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
 * Execute a user command using OpenAI function calling
 *
 * @param prompt - User's natural language command (e.g., "replace hello with goodbye")
 * @param editor - TipTap editor instance for document manipulation
 * @returns Result indicating success/failure with optional message
 *
 * @example
 * const result = await executeCommand("replace hello with goodbye", editor)
 * if (result.success) {
 *   console.log(result.message) // "Replaced 'hello' with 'goodbye'"
 * } else {
 *   console.error(result.error) // "Text 'hello' not found in document"
 * }
 */
export async function executeCommand(
  prompt: string,
  editor: Editor
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
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // Call OpenAI API with function calling
      const response = await openai.chat.completions.create(
        {
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that helps users edit their documents. Use the replaceText tool to make changes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          tools: [replaceTextTool],
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
        // AI didn't understand the command or didn't call a tool
        const aiMessage = response.choices[0]?.message?.content
        return {
          success: false,
          error: aiMessage || "I didn't understand that command. Try something like 'replace hello with goodbye'."
        }
      }

      // Parse tool call arguments
      let args: { searchText: string; newText: string }
      try {
        // Type assertion for tool call (OpenAI SDK type issue)
        const functionCall = toolCall as any
        args = JSON.parse(functionCall.function.arguments)
      } catch (parseError) {
        console.error('Failed to parse tool call arguments:', parseError)
        return {
          success: false,
          error: 'Failed to parse AI response. Please try again.'
        }
      }

      // Validate arguments
      if (!args.searchText || !args.newText) {
        return {
          success: false,
          error: 'Invalid tool arguments: missing searchText or newText'
        }
      }

      // Find text in document using text search utility
      const position = findTextInDocument(editor, args.searchText)

      if (!position) {
        return {
          success: false,
          error: `Text "${args.searchText}" not found in document`
        }
      }

      // Execute tool via ToolExecutor
      const executor = new ToolExecutor(editor)
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
          message: `Replaced "${args.searchText}" with "${args.newText}"`
        }
      } else {
        return {
          success: false,
          error: `Failed to replace text. Make sure "${args.searchText}" exists in the document.`
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out. Please try again.'
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
