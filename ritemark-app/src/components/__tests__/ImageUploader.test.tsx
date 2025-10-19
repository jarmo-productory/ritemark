import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageUploader } from '../ImageUploader'
import { uploadImageToDrive } from '../../services/drive/DriveImageUpload'

// Mock the DriveImageUpload service
vi.mock('../../services/drive/DriveImageUpload', () => ({
  uploadImageToDrive: vi.fn(),
}))

describe('ImageUploader Component', () => {
  const mockOnUpload = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders file picker initially', () => {
    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    expect(screen.getByText('Upload Image')).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()
  })

  it('shows preview after file selection', async () => {
    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    const file = new File(['dummy content'], 'test-image.png', { type: 'image/png' })
    const input = screen.getByLabelText('Choose File').querySelector('input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Describe this image...')).toBeInTheDocument()
    })
  })

  it('validates file size (max 10MB)', async () => {
    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    const input = screen.getByLabelText('Choose File').querySelector('input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByText('File too large (max 10MB)')).toBeInTheDocument()
    })
  })

  it('validates file format', async () => {
    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText('Choose File').querySelector('input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(screen.getByText(/Unsupported format/)).toBeInTheDocument()
    })
  })

  it('calls uploadImageToDrive and onUpload on successful upload', async () => {
    const mockDriveUrl = 'https://drive.google.com/uc?id=123'
    vi.mocked(uploadImageToDrive).mockResolvedValue(mockDriveUrl)

    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('Choose File').querySelector('input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Describe this image...')).toBeInTheDocument()
    })

    const altInput = screen.getByPlaceholderText('Describe this image...')
    fireEvent.change(altInput, { target: { value: 'Test image description' } })

    const uploadButton = screen.getByText('Insert Image')
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(uploadImageToDrive).toHaveBeenCalledWith(file)
      expect(mockOnUpload).toHaveBeenCalledWith(mockDriveUrl, 'Test image description')
    })
  })

  it('handles upload errors gracefully', async () => {
    vi.mocked(uploadImageToDrive).mockRejectedValue(new Error('Upload failed'))

    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText('Choose File').querySelector('input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Insert Image')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText('Insert Image')
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button clicked', async () => {
    render(<ImageUploader onUpload={mockOnUpload} onCancel={mockOnCancel} />)

    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText('Choose File').querySelector('input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })
})
