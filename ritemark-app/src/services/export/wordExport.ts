/**
 * Word (.docx) export service with lazy loading
 * Dynamically imports conversion library only when needed
 */

export interface WordExportOptions {
  documentTitle: string
  author?: string
  createdAt?: string
}

export interface WordExportResult {
  success: boolean
  error?: string
}

/**
 * Export markdown to Word (.docx) file
 * Uses dynamic import for lazy loading (~500 KB library)
 */
export async function exportToWord(
  markdown: string,
  options: WordExportOptions
): Promise<WordExportResult> {
  try {
    // Lazy load Word conversion library
    // CRITICAL: Only loads on first Word export (not in initial bundle)
    const { convertMarkdownToDocx } = await import('@mohtasham/md-to-docx')

    // Convert markdown to .docx
    const docxBlob = await convertMarkdownToDocx(markdown, {
      documentType: 'document',
      style: {
        titleSize: 24,
        headingSpacing: 240,
        paragraphSpacing: 240,
        lineSpacing: 1.15,
        paragraphSize: 12,
        paragraphAlignment: 'LEFT'
      }
    })

    // Trigger browser download
    // Note: convertMarkdownToDocx already returns a Blob
    const url = URL.createObjectURL(docxBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizeFilename(options.documentTitle)}.docx`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    URL.revokeObjectURL(url)

    return { success: true }

  } catch (error) {
    console.error('Word export failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    }
  }
}

/**
 * Sanitize filename for safe download
 * Removes invalid characters for Windows/Mac/Linux
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars
    .replace(/\s+/g, '_')            // Replace spaces with underscores
    .substring(0, 200)               // Limit length (leave room for .docx)
}
