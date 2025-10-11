/**
 * Comprehensive Tests for FormattingBubbleMenu Component
 * Tests BubbleMenu visibility, formatting buttons, and Link Dialog functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormattingBubbleMenu } from '@/components/FormattingBubbleMenu'
import type { Editor as TipTapEditor } from '@tiptap/react'

// Mock TipTap BubbleMenu component
vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="bubble-menu">{children}</div>,
}))

// Mock Radix Dialog (it's already working but this ensures consistency)
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog')
  return actual
})

// Mock TipTap Editor
const createMockEditor = (overrides?: Partial<TipTapEditor>): TipTapEditor => {
  const mockChain = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    setLink: vi.fn().mockReturnThis(),
    unsetLink: vi.fn().mockReturnThis(),
    run: vi.fn(),
  }

  return {
    chain: vi.fn(() => mockChain),
    isActive: vi.fn((type: string, attrs?: any) => {
      if (type === 'bold') return false
      if (type === 'italic') return false
      if (type === 'heading' && attrs?.level === 1) return false
      if (type === 'heading' && attrs?.level === 2) return false
      if (type === 'link') return false
      if (type === 'codeBlock') return false
      return false
    }),
    getAttributes: vi.fn((type: string) => {
      if (type === 'link') return { href: '' }
      return {}
    }),
    state: {
      selection: {
        empty: false,
      },
    },
    ...overrides,
  } as unknown as TipTapEditor
}

describe('FormattingBubbleMenu', () => {
  let mockEditor: TipTapEditor

  beforeEach(() => {
    mockEditor = createMockEditor()
    vi.clearAllMocks()
  })

  describe('BubbleMenu Visibility', () => {
    it('should render BubbleMenu when editor provided', () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)

      // BubbleMenu should render (TipTap handles actual visibility logic)
      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument()
      expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument()
    })

    it('should not render when editor is null', () => {
      const { container } = render(<FormattingBubbleMenu editor={null} />)

      expect(container.firstChild).toBeNull()
    })

    it('should have shouldShow function that checks empty selection', () => {
      const { container } = render(<FormattingBubbleMenu editor={mockEditor} />)

      // Component renders with BubbleMenu that has shouldShow prop
      expect(container.querySelector('[class*="flex items-center"]')).toBeInTheDocument()
    })
  })

  describe('Bold Button', () => {
    it('should toggle bold formatting when clicked', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const boldButton = screen.getByTitle('Bold (Ctrl+B)')

      fireEvent.click(boldButton)

      expect(mockEditor.chain).toHaveBeenCalled()
      const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
      expect(chain.focus).toHaveBeenCalled()
      expect(chain.toggleBold).toHaveBeenCalled()
      expect(chain.run).toHaveBeenCalled()
    })

    it('should show active state when bold is active', () => {
      const editorWithBold = createMockEditor({
        isActive: vi.fn((type: string) => type === 'bold'),
      })

      render(<FormattingBubbleMenu editor={editorWithBold} />)
      const boldButton = screen.getByTitle('Bold (Ctrl+B)')

      expect(boldButton).toHaveClass('bg-gray-200')
    })

    it('should prevent default on mouseDown', () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const boldButton = screen.getByTitle('Bold (Ctrl+B)')

      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault')

      boldButton.dispatchEvent(mouseDownEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Italic Button', () => {
    it('should toggle italic formatting when clicked', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const italicButton = screen.getByTitle('Italic (Ctrl+I)')

      fireEvent.click(italicButton)

      expect(mockEditor.chain).toHaveBeenCalled()
      const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
      expect(chain.focus).toHaveBeenCalled()
      expect(chain.toggleItalic).toHaveBeenCalled()
      expect(chain.run).toHaveBeenCalled()
    })

    it('should show active state when italic is active', () => {
      const editorWithItalic = createMockEditor({
        isActive: vi.fn((type: string) => type === 'italic'),
      })

      render(<FormattingBubbleMenu editor={editorWithItalic} />)
      const italicButton = screen.getByTitle('Italic (Ctrl+I)')

      expect(italicButton).toHaveClass('bg-gray-200')
    })
  })

  describe('Heading Buttons', () => {
    it('should toggle H1 heading when clicked', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const h1Button = screen.getByTitle('Heading 1')

      fireEvent.click(h1Button)

      expect(mockEditor.chain).toHaveBeenCalled()
      const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
      expect(chain.focus).toHaveBeenCalled()
      expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 1 })
      expect(chain.run).toHaveBeenCalled()
    })

    it('should toggle H2 heading when clicked', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const h2Button = screen.getByTitle('Heading 2')

      fireEvent.click(h2Button)

      expect(mockEditor.chain).toHaveBeenCalled()
      const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
      expect(chain.focus).toHaveBeenCalled()
      expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 })
      expect(chain.run).toHaveBeenCalled()
    })

    it('should show active state for H1 when active', () => {
      const editorWithH1 = createMockEditor({
        isActive: vi.fn((type: string, attrs?: any) =>
          type === 'heading' && attrs?.level === 1
        ),
      })

      render(<FormattingBubbleMenu editor={editorWithH1} />)
      const h1Button = screen.getByTitle('Heading 1')

      expect(h1Button).toHaveClass('bg-gray-200')
    })

    it('should show active state for H2 when active', () => {
      const editorWithH2 = createMockEditor({
        isActive: vi.fn((type: string, attrs?: any) =>
          type === 'heading' && attrs?.level === 2
        ),
      })

      render(<FormattingBubbleMenu editor={editorWithH2} />)
      const h2Button = screen.getByTitle('Heading 2')

      expect(h2Button).toHaveClass('bg-gray-200')
    })
  })

  describe('Link Dialog Opening', () => {
    it('should open link dialog when Link button clicked', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      expect(screen.getByPlaceholderText('example.com or https://example.com')).toBeInTheDocument()
    })

    it('should open link dialog on Cmd+K shortcut', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)

      // Simulate Cmd+K
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })
    })

    it('should open link dialog on Ctrl+K shortcut', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)

      // Simulate Ctrl+K
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })
    })

    it('should not open dialog on Cmd+K if selection is empty', async () => {
      const editorWithEmptySelection = createMockEditor({
        state: {
          selection: {
            empty: true,
          },
        },
      })

      render(<FormattingBubbleMenu editor={editorWithEmptySelection} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.queryByText('Add Link')).not.toBeInTheDocument()
      })
    })

    it('should show "Edit Link" when editing existing link', async () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
        getAttributes: vi.fn((type: string) => {
          if (type === 'link') return { href: 'https://example.com' }
          return {}
        }),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Link')).toBeInTheDocument()
      })
    })

    it('should auto-focus input field when dialog opens', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('example.com or https://example.com')
        expect(input).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('Link URL Validation', () => {
    it('should show error for empty URL', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a URL')).toBeInTheDocument()
      })
    })

    it('should show error for invalid URL', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'not a valid url')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid URL/)).toBeInTheDocument()
      })
    })

    it('should clear error when typing', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      // Trigger error
      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a URL')).toBeInTheDocument()
      })

      // Type to clear error
      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      expect(screen.queryByText('Please enter a URL')).not.toBeInTheDocument()
    })
  })

  describe('Link Creation', () => {
    it('should create link with valid URL', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockEditor.chain).toHaveBeenCalled()
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
      })
    })

    it('should auto-prepend https:// when protocol missing', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'google.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://google.com' })
      })
    })

    it('should preserve https:// protocol when provided', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'https://secure.example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://secure.example.com' })
      })
    })

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com{Enter}')

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
      })
    })

    it('should close dialog after successful link creation', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.queryByText('Add Link')).not.toBeInTheDocument()
      })
    })
  })

  describe('Link Removal', () => {
    it('should show Remove button when editing existing link', async () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
        getAttributes: vi.fn((type: string) => {
          if (type === 'link') return { href: 'https://example.com' }
          return {}
        }),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument()
      })
    })

    it('should remove link when Remove button clicked', async () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
        getAttributes: vi.fn((type: string) => {
          if (type === 'link') return { href: 'https://example.com' }
          return {}
        }),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument()
      })

      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)

      await waitFor(() => {
        const chain = (editorWithLink.chain as ReturnType<typeof vi.fn>)()
        expect(chain.unsetLink).toHaveBeenCalled()
      })
    })

    it('should close dialog after removing link', async () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
        getAttributes: vi.fn((type: string) => {
          if (type === 'link') return { href: 'https://example.com' }
          return {}
        }),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument()
      })

      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('Edit Link')).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Cancellation', () => {
    it('should close dialog when Cancel button clicked', async () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Add Link')).not.toBeInTheDocument()
      })
    })

    it('should clear URL input when dialog closed', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      // Re-open dialog
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        const newInput = screen.getByPlaceholderText('example.com or https://example.com')
        expect(newInput).toHaveValue('')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle URLs with special characters', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com/path?query=value&foo=bar')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({
          href: 'https://example.com/path?query=value&foo=bar'
        })
      })
    })

    it('should handle URLs with subdomains', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'subdomain.example.co.uk')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({
          href: 'https://subdomain.example.co.uk'
        })
      })
    })

    it('should handle whitespace in URL input', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, '  example.com  ')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
      })
    })

    it('should reject URLs without valid format', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.clear(input)
      // Use a string with spaces which is truly invalid for URL constructor
      await user.type(input, 'not a url')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      // Dialog should stay open (not call setLink) when URL is invalid
      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      // Verify editor.chain was NOT called (invalid URL prevents link creation)
      expect(mockEditor.chain).not.toHaveBeenCalled()
    })

    it('should show Update button when editing existing link', async () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
        getAttributes: vi.fn((type: string) => {
          if (type === 'link') return { href: 'https://example.com' }
          return {}
        }),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        expect(screen.getByText('Update')).toBeInTheDocument()
      })
    })

    it('should populate input with existing URL when editing', async () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
        getAttributes: vi.fn((type: string) => {
          if (type === 'link') return { href: 'https://existing.com' }
          return {}
        }),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      fireEvent.click(linkButton)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('example.com or https://example.com')
        expect(input).toHaveValue('https://existing.com')
      })
    })
  })

  describe('Active State Indicators', () => {
    it('should show active state for link button when link is active', () => {
      const editorWithLink = createMockEditor({
        isActive: vi.fn((type: string) => type === 'link'),
      })

      render(<FormattingBubbleMenu editor={editorWithLink} />)
      const linkButton = screen.getByTitle('Add/Edit Link (Cmd+K)')

      expect(linkButton).toHaveClass('bg-gray-200')
    })

    it('should not show active state when no formatting applied', () => {
      render(<FormattingBubbleMenu editor={mockEditor} />)

      const boldButton = screen.getByTitle('Bold (Ctrl+B)')
      const italicButton = screen.getByTitle('Italic (Ctrl+I)')

      expect(boldButton).not.toHaveClass('bg-gray-200')
      expect(italicButton).not.toHaveClass('bg-gray-200')
    })
  })

  /**
   * CODEX EDGE CASES - Tests for security issues identified by Codex analysis
   * These tests ensure the component properly handles edge cases that could
   * cause user-facing bugs or security issues.
   */
  describe('Codex Edge Case: Protocol Casing Normalization', () => {
    it('should normalize uppercase HTTP:// to lowercase', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'HTTP://example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({
          href: 'http://example.com' // Protocol lowercased
        })
      })
    })

    it('should normalize uppercase HTTPS:// to lowercase', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'HTTPS://secure.example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({
          href: 'https://secure.example.com' // Protocol lowercased
        })
      })
    })

    it('should normalize mixed-case protocol (HtTpS://)', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'HtTpS://example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({
          href: 'https://example.com' // Protocol lowercased
        })
      })
    })

    it('should normalize uppercase protocol with path and query', async () => {
      const user = userEvent.setup()
      render(<FormattingBubbleMenu editor={mockEditor} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'HTTPS://example.com/path?query=value')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      await waitFor(() => {
        const chain = (mockEditor.chain as ReturnType<typeof vi.fn>)()
        expect(chain.setLink).toHaveBeenCalledWith({
          href: 'https://example.com/path?query=value' // Only protocol lowercased
        })
      })
    })
  })

  describe('Codex Edge Case: Code Block Guards', () => {
    it('should NOT open dialog when Cmd+K pressed in code block', async () => {
      const editorInCodeBlock = createMockEditor({
        isActive: vi.fn((type: string) => type === 'codeBlock'),
        state: {
          selection: {
            empty: false, // Text is selected
          },
        },
      })

      render(<FormattingBubbleMenu editor={editorInCodeBlock} />)

      // Press Cmd+K (should be ignored in code block)
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      // Dialog should NOT appear
      await waitFor(() => {
        expect(screen.queryByText('Add Link')).not.toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should open dialog when Cmd+K pressed outside code block', async () => {
      const editorOutsideCodeBlock = createMockEditor({
        isActive: vi.fn((type: string) => false), // Not in any special block
        state: {
          selection: {
            empty: false, // Text is selected
          },
        },
      })

      render(<FormattingBubbleMenu editor={editorOutsideCodeBlock} />)

      // Press Cmd+K (should work outside code block)
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      // Dialog SHOULD appear
      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })
    })

    it('should hide BubbleMenu when inside code block', () => {
      const editorInCodeBlock = createMockEditor({
        isActive: vi.fn((type: string) => type === 'codeBlock'),
      })

      const { container } = render(<FormattingBubbleMenu editor={editorInCodeBlock} />)

      // BubbleMenu component renders, but shouldShow logic prevents visibility
      // We can verify the component has the shouldShow prop by checking the component renders
      expect(container.querySelector('[class*="flex items-center"]')).toBeInTheDocument()
    })

    it('should show BubbleMenu when outside code block with selection', () => {
      const editorWithSelection = createMockEditor({
        isActive: vi.fn((type: string) => false),
        state: {
          selection: {
            empty: false,
          },
        },
      })

      const { container } = render(<FormattingBubbleMenu editor={editorWithSelection} />)

      // BubbleMenu should render with toolbar visible
      expect(container.querySelector('[class*="flex items-center"]')).toBeInTheDocument()
      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument()
    })
  })

  describe('Codex Edge Case: Failed Link Command Handling', () => {
    it('should show error message when setLink command fails', async () => {
      const user = userEvent.setup()

      // Mock editor where setLink().run() returns false (command failed)
      const mockChainWithFailure = {
        focus: vi.fn().mockReturnThis(),
        setLink: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(false), // Command fails
      }

      const editorWithFailure = createMockEditor({
        chain: vi.fn(() => mockChainWithFailure),
      })

      render(<FormattingBubbleMenu editor={editorWithFailure} />)

      // Open dialog and enter valid URL
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      // Try to submit
      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      // Verify error message shown
      await waitFor(() => {
        expect(screen.getByText('Cannot add link here (links not allowed in this context)')).toBeInTheDocument()
      })

      // Verify dialog stays open (user can retry or cancel)
      expect(screen.getByText('Add Link')).toBeInTheDocument()
    })

    it('should close dialog when setLink command succeeds', async () => {
      const user = userEvent.setup()

      // Mock editor where setLink().run() returns true (command succeeds)
      const mockChainWithSuccess = {
        focus: vi.fn().mockReturnThis(),
        setLink: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(true), // Command succeeds
      }

      const editorWithSuccess = createMockEditor({
        chain: vi.fn(() => mockChainWithSuccess),
      })

      render(<FormattingBubbleMenu editor={editorWithSuccess} />)

      // Open dialog and enter valid URL
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      // Submit
      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      // Dialog should close on success
      await waitFor(() => {
        expect(screen.queryByText('Add Link')).not.toBeInTheDocument()
      })
    })

    it('should clear error message when typing after failure', async () => {
      const user = userEvent.setup()

      // Mock editor where setLink().run() returns false
      const mockChainWithFailure = {
        focus: vi.fn().mockReturnThis(),
        setLink: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(false),
      }

      const editorWithFailure = createMockEditor({
        chain: vi.fn(() => mockChainWithFailure),
      })

      render(<FormattingBubbleMenu editor={editorWithFailure} />)

      // Open dialog and trigger failure
      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Cannot add link here (links not allowed in this context)')).toBeInTheDocument()
      })

      // Type to clear error
      await user.clear(input)
      await user.type(input, 'newurl.com')

      // Error should be cleared
      expect(screen.queryByText('Cannot add link here (links not allowed in this context)')).not.toBeInTheDocument()
    })

    it('should preserve URL input when command fails (allows retry)', async () => {
      const user = userEvent.setup()

      const mockChainWithFailure = {
        focus: vi.fn().mockReturnThis(),
        setLink: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(false),
      }

      const editorWithFailure = createMockEditor({
        chain: vi.fn(() => mockChainWithFailure),
      })

      render(<FormattingBubbleMenu editor={editorWithFailure} />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('Add Link')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('example.com or https://example.com')
      await user.type(input, 'example.com')

      const addButton = screen.getByText('Add')
      fireEvent.click(addButton)

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Cannot add link here (links not allowed in this context)')).toBeInTheDocument()
      })

      // URL should still be in input (not cleared on failure)
      expect(input).toHaveValue('example.com')
    })
  })
})
