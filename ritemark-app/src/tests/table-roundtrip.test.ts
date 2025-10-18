/**
 * Table Round-Trip Test
 * Tests that tables can be converted to markdown and back without data loss
 * This verifies the complete cycle: Editor HTML → Markdown → Parsed HTML → Editor
 */

import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'
import { marked } from 'marked'
import { describe, it, expect, beforeEach } from 'vitest'

describe('GFM Table Round-Trip Conversion', () => {
  let turndownService: TurndownService

  beforeEach(() => {
    // Replicate the exact setup from Editor.tsx
    turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**'
    })

    turndownService.use(tables)

    // Custom rule to escape pipe characters
    turndownService.addRule('tableCellWithPipeEscape', {
      filter: ['th', 'td'],
      replacement: function (content, node) {
        const escapedContent = content.replace(/\|/g, '\\|')
        const index = node.parentNode ? Array.prototype.indexOf.call(node.parentNode.childNodes, node) : 0
        const prefix = index === 0 ? '| ' : ' '
        return prefix + escapedContent + ' |'
      }
    })

    // Configure marked for GFM tables
    marked.setOptions({
      breaks: true,
      gfm: true
    })
  })

  it('should preserve table structure in round-trip conversion', async () => {
    // Original HTML table from TipTap editor
    const originalHtml = '<table><thead><tr><th>Name</th><th>Age</th><th>City</th></tr></thead><tbody><tr><td>Alice</td><td>30</td><td>NYC</td></tr><tr><td>Bob</td><td>25</td><td>LA</td></tr></tbody></table>'

    // Step 1: Convert to markdown (save to file)
    const markdown = turndownService.turndown(originalHtml)
    expect(markdown).toContain('| Name | Age | City |')
    expect(markdown).toContain('| --- | --- | --- |')
    expect(markdown).toContain('| Alice | 30 | NYC |')

    // Step 2: Parse markdown back to HTML (load from file)
    const htmlFromMarkdown = await marked(markdown, { async: true })

    // Step 3: Verify structure is preserved (not exact HTML match, but data integrity)
    expect(htmlFromMarkdown).toContain('Alice')
    expect(htmlFromMarkdown).toContain('30')
    expect(htmlFromMarkdown).toContain('NYC')
    expect(htmlFromMarkdown).toContain('Bob')
    expect(htmlFromMarkdown).toContain('25')
    expect(htmlFromMarkdown).toContain('LA')
    expect(htmlFromMarkdown).toContain('<table>')
    expect(htmlFromMarkdown).toContain('</table>')
  })

  it('should preserve pipe characters in round-trip conversion', async () => {
    const htmlWithPipes = '<table><thead><tr><th>Command</th><th>Output</th></tr></thead><tbody><tr><td>echo "a | b"</td><td>Prints a | b</td></tr></tbody></table>'

    // Convert to markdown
    const markdown = turndownService.turndown(htmlWithPipes)
    expect(markdown).toContain('\\|') // Pipes should be escaped

    // Parse back to HTML
    const htmlFromMarkdown = await marked(markdown, { async: true })

    // Verify content is preserved (pipes should be unescaped)
    expect(htmlFromMarkdown).toContain('a | b')
    expect(htmlFromMarkdown).toContain('Prints a | b')
  })

  it('should preserve formatting in cells during round-trip', async () => {
    const htmlWithFormatting = '<table><thead><tr><th>Feature</th><th>Status</th></tr></thead><tbody><tr><td><strong>Tables</strong></td><td><em>Complete</em></td></tr></tbody></table>'

    // Convert to markdown
    const markdown = turndownService.turndown(htmlWithFormatting)
    expect(markdown).toContain('**Tables**')
    expect(markdown).toContain('*Complete*')

    // Parse back to HTML
    const htmlFromMarkdown = await marked(markdown, { async: true })

    // Verify formatting is preserved
    expect(htmlFromMarkdown).toMatch(/<strong>Tables<\/strong>|<b>Tables<\/b>/)
    expect(htmlFromMarkdown).toMatch(/<em>Complete<\/em>|<i>Complete<\/i>/)
  })

  it('should handle empty cells in round-trip conversion', async () => {
    const htmlWithEmptyCells = '<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>1</td><td></td><td>3</td></tr><tr><td></td><td>2</td><td></td></tr></tbody></table>'

    // Convert to markdown
    const markdown = turndownService.turndown(htmlWithEmptyCells)

    // Parse back to HTML
    const htmlFromMarkdown = await marked(markdown, { async: true })

    // Verify table structure is maintained (data integrity)
    expect(htmlFromMarkdown).toContain('<table>')
    expect(htmlFromMarkdown).toContain('</table>')
  })

  it('should generate valid GFM markdown format', () => {
    const html = '<table><thead><tr><th>Col1</th><th>Col2</th></tr></thead><tbody><tr><td>Data1</td><td>Data2</td></tr></tbody></table>'

    const markdown = turndownService.turndown(html)

    // Verify GFM format compliance
    const lines = markdown.trim().split('\n')
    expect(lines[0]).toBe('| Col1 | Col2 |')
    expect(lines[1]).toBe('| --- | --- |')
    expect(lines[2]).toBe('| Data1 | Data2 |')
  })
})
