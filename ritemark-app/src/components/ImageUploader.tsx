import React, { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Progress } from './ui/progress'
import { AlertCircle } from 'lucide-react'
import { uploadImageToDrive } from '../services/drive/DriveImageUpload'

interface ImageUploaderProps {
  onUpload: (url: string, alt?: string) => void
  onCancel: () => void
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, onCancel }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [altText, setAltText] = useState('')

  const validateFile = (file: File): boolean => {
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)')
      return false
    }

    // Supported formats
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Unsupported format (use JPG, PNG, GIF, or WebP)')
      return false
    }

    return true
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!validateFile(selectedFile)) return

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setError('')
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Upload to Google Drive
      const url = await uploadImageToDrive(file)

      clearInterval(progressInterval)
      setProgress(100)

      // Call onUpload with the Drive URL and alt text
      onUpload(url, altText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          ) : (
            <>
              {preview && (
                <div className="border rounded-lg overflow-hidden">
                  <img src={preview} alt="Preview" className="max-w-full h-auto" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Alt Text (for accessibility)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image..."
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={uploading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {uploading && (
                <Progress value={progress} />
              )}

              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Insert Image'}
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={uploading}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
