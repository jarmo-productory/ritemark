/**
 * Download utility for browser file downloads
 * Provides simple interface for triggering file downloads
 */

/**
 * Sanitize filename for safe download
 * Removes invalid characters for Windows/Mac/Linux
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars
    .replace(/\s+/g, '_')            // Replace spaces with underscores
    .substring(0, 200)               // Limit length (leave room for extension)
}

/**
 * Download markdown content as .md file
 * Triggers browser download with sanitized filename
 *
 * @param content - Markdown content to download
 * @param filename - Base filename (without .md extension)
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  // Remove .md extension if already present (avoid double .md.md)
  const cleanFilename = filename.replace(/\.md$/i, '')

  link.href = url
  link.download = `${sanitizeFilename(cleanFilename)}.md`

  // Append to body, click, and cleanup
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Cleanup object URL
  URL.revokeObjectURL(url)
}

/**
 * Check if browser supports file downloads
 * All modern browsers support this, but good to check
 */
export function isDownloadSupported(): boolean {
  return typeof document !== 'undefined' && typeof Blob !== 'undefined'
}
