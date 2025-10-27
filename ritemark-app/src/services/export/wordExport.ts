/**
 * Word (.docx) export service - TipTap JSON to DOCX conversion
 * Converts TipTap's native JSON format directly to Word using docx library
 * This gives us full control over formatting and eliminates all markdown parsing issues
 */

import type { JSONContent } from '@tiptap/core'

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
 * Export TipTap JSON content to Word (.docx) file
 * Uses docx library which works natively in browsers
 *
 * @param jsonContent - TipTap JSON from editor.getJSON()
 * @param options - Export options including document title
 */
export async function exportToWord(
  jsonContent: JSONContent,
  options: WordExportOptions
): Promise<WordExportResult> {
  try {
    // Lazy load docx library (browser-compatible)
    const docx = await import('docx')

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, LevelFormat, ShadingType, Table, TableRow, TableCell, WidthType } = docx

    // Convert TipTap JSON nodes to docx paragraphs
    const children: any[] = []

    if (jsonContent.content) {
      for (const node of jsonContent.content) {
        const paragraphs = convertNodeToParagraph(node, { Paragraph, TextRun, HeadingLevel, AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType })
        children.push(...paragraphs)
      }
    }

    // Create document with Calibri as default font
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
              size: 22, // 11pt (size is in half-points)
            },
          },
        },
      },
      numbering: {
        // Provide numbering configuration for ordered and bullet lists
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: '%1.',
                alignment: AlignmentType.LEFT,
              },
            ],
          },
          {
            reference: 'default-bullets',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '\u25CF',
                alignment: AlignmentType.LEFT,
              },
            ],
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      }],
    })

    // Generate .docx blob
    const blob = await Packer.toBlob(doc)

    // Trigger browser download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = `${sanitizeFilename(options.documentTitle)}.docx`
    link.download = filename

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
 * Convert TipTap JSON node to docx Paragraph
 */
function convertNodeToParagraph(node: JSONContent, classes: any): any[] {
  const { Paragraph, TextRun, HeadingLevel, ShadingType, Table, TableRow, TableCell, WidthType } = classes
  const paragraphs: any[] = []

  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 1
      const headingLevel = level === 1 ? HeadingLevel.HEADING_1 :
                          level === 2 ? HeadingLevel.HEADING_2 :
                          HeadingLevel.HEADING_3

      paragraphs.push(new Paragraph({
        text: getTextContent(node),
        heading: headingLevel,
        spacing: {
          before: 240,
          after: 120,
        },
      }))
      break
    }

    case 'paragraph': {
      if (node.content && node.content.length > 0) {
        const runs = node.content.map(child => convertInlineNode(child, { TextRun }))
        paragraphs.push(new Paragraph({
          children: runs.flat(),
          spacing: {
            after: 120,
          },
        }))
      } else {
        paragraphs.push(new Paragraph({}))
      }
      break
    }

    case 'bulletList': {
      if (node.content) {
        for (const listItem of node.content) {
          if (listItem.type === 'listItem' && listItem.content) {
            for (const para of listItem.content) {
              if (para.type === 'paragraph') {
                const runs = para.content ? para.content.map(child => convertInlineNode(child, { TextRun })).flat() : []
                paragraphs.push(new Paragraph({
                  children: runs,
                  numbering: {
                    reference: 'default-bullets',
                    level: 0,
                  },
                  spacing: {
                    before: 0,
                    after: 0,
                  },
                }))
              }
            }
          }
        }
      }
      break
    }

    case 'orderedList': {
      if (node.content) {
        for (const listItem of node.content) {
          if (listItem.type === 'listItem' && listItem.content) {
            for (const para of listItem.content) {
              if (para.type === 'paragraph') {
                const runs = para.content ? para.content.map(child => convertInlineNode(child, { TextRun })).flat() : []
                paragraphs.push(new Paragraph({
                  children: runs,
                  numbering: {
                    reference: 'default-numbering',
                    level: 0,
                  },
                  spacing: {
                    before: 0,
                    after: 0,
                  },
                }))
              }
            }
          }
        }
      }
      break
    }

    case 'codeBlock': {
      const code = getTextContent(node)
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text: code,
          font: 'Courier New',
          size: 20,
        })],
        shading: {
          type: ShadingType.CLEAR,
          color: 'auto',
          fill: 'F0F0F0',
        },
        spacing: {
          after: 120,
        },
      }))
      break
    }

    case 'blockquote': {
      if (node.content) {
        for (const child of node.content) {
          const childParas = convertNodeToParagraph(child, classes)
          paragraphs.push(...childParas.map((p: any) => {
            p.indent = { left: 720 }
            return p
          }))
        }
      }
      break
    }

    case 'table': {
      // Convert TipTap table -> docx Table
      const rows: any[] = []
      if (node.content) {
        for (const row of node.content) {
          if (row.type !== 'tableRow' || !row.content) continue

          const cells: any[] = []
          for (const cell of row.content) {
            if (cell.type !== 'tableCell' && cell.type !== 'tableHeader') continue

            // Convert cell content to paragraphs
            const paraChildren: any[] = []
            if (cell.content) {
              for (const child of cell.content) {
                paraChildren.push(...convertNodeToParagraph(child, classes))
              }
            } else {
              paraChildren.push(new Paragraph({}))
            }

            cells.push(new TableCell({
              children: paraChildren.length ? paraChildren : [new Paragraph({})],
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }))
          }
          rows.push(new TableRow({ children: cells }))
        }
      }

      const table = new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })

      // Add a little spacing before/after table using blank paragraphs
      if (rows.length) {
        paragraphs.push(new Paragraph({}))
        paragraphs.push(table)
        paragraphs.push(new Paragraph({}))
      }
      break
    }

    default:
      // Handle unknown node types gracefully
      if (node.content) {
        for (const child of node.content) {
          paragraphs.push(...convertNodeToParagraph(child, classes))
        }
      }
  }

  return paragraphs
}

/**
 * Convert inline TipTap nodes to docx TextRun
 */
function convertInlineNode(node: JSONContent, classes: any): any[] {
  const { TextRun } = classes
  const runs: any[] = []

  if (node.type === 'text') {
    const text = node.text || ''
    const marks = node.marks || []

    const style: any = {}

    for (const mark of marks) {
      switch (mark.type) {
        case 'bold':
          style.bold = true
          break
        case 'italic':
          style.italics = true
          break
        case 'code':
          style.font = 'Courier New'
          break
        case 'strike':
          style.strike = true
          break
      }
    }

    runs.push(new TextRun({ text, ...style }))
  } else if (node.type === 'hardBreak') {
    runs.push(new TextRun({ break: 1 }))
  }

  return runs
}

/**
 * Get plain text content from a node
 */
function getTextContent(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text || ''
  }

  if (node.content) {
    return node.content.map(child => getTextContent(child)).join('')
  }

  return ''
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
