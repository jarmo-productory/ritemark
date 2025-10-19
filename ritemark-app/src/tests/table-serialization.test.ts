/**
 * GFM Table Serialization Test
 * Tests HTML to Markdown conversion for tables using turndown-plugin-gfm
 * with custom pipe escaping rule
 */

import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'
import { describe, it, expect, beforeEach } from 'vitest'

describe('GFM Table Serialization', () => {
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

    // Enable GFM tables plugin
    turndownService.use(tables)

    // Override the tableCell rule to escape pipe characters (same as Editor.tsx)
    turndownService.addRule('tableCellWithPipeEscape', {
      filter: ['th', 'td'],
      replacement: function (content, node) {
        // Escape pipe characters to prevent breaking table structure
        const escapedContent = content.replace(/\|/g, '\\|')

        // Replicate the original cell formatting logic from turndown-plugin-gfm
        // Table cells always have a parent (tr), so this is safe
        const index = node.parentNode ? Array.prototype.indexOf.call(node.parentNode.childNodes, node) : 0
        const prefix = index === 0 ? '| ' : ' '
        return prefix + escapedContent + ' |'
      }
    })
  })

  it('should convert basic HTML table to GFM format', () => {
    const html = '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr><tr><td>Bob</td><td>25</td></tr></tbody></table>'

    const markdown = turndownService.turndown(html)

    expect(markdown).toContain('| Name | Age |')
    expect(markdown).toContain('| --- | --- |')
    expect(markdown).toContain('| Alice | 30 |')
    expect(markdown).toContain('| Bob | 25 |')
  })

  it('should escape pipe characters in cell content', () => {
    const html = '<table><thead><tr><th>Command</th><th>Description</th></tr></thead><tbody><tr><td>echo "hello | world"</td><td>Prints text with pipe</td></tr></tbody></table>'

    const markdown = turndownService.turndown(html)

    // Turndown-plugin-gfm should escape pipe characters as \|
    expect(markdown).toContain('\\|')
    expect(markdown).toContain('| Command | Description |')
    expect(markdown).toContain('| --- | --- |')
  })

  it('should handle empty cells', () => {
    const html = '<table><thead><tr><th>Col1</th><th>Col2</th></tr></thead><tbody><tr><td></td><td>Data</td></tr><tr><td>Data</td><td></td></tr></tbody></table>'

    const markdown = turndownService.turndown(html)

    expect(markdown).toContain('| Col1 | Col2 |')
    expect(markdown).toContain('| --- | --- |')
    expect(markdown).toContain('|  | Data |')
    expect(markdown).toContain('| Data |  |')
  })

  it('should handle tables with multiple rows and columns', () => {
    const html = `
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Status</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tables</td>
            <td>In Progress</td>
            <td>High</td>
          </tr>
          <tr>
            <td>Links</td>
            <td>Complete</td>
            <td>High</td>
          </tr>
          <tr>
            <td>Images</td>
            <td>Planned</td>
            <td>Medium</td>
          </tr>
        </tbody>
      </table>
    `

    const markdown = turndownService.turndown(html)

    expect(markdown).toContain('| Feature | Status | Priority |')
    expect(markdown).toContain('| --- | --- | --- |')
    expect(markdown).toContain('| Tables | In Progress | High |')
    expect(markdown).toContain('| Links | Complete | High |')
    expect(markdown).toContain('| Images | Planned | Medium |')
  })

  it('should handle cells with formatting', () => {
    const html = '<table><thead><tr><th>Name</th><th>Description</th></tr></thead><tbody><tr><td><strong>Bold</strong></td><td><em>Italic</em></td></tr></tbody></table>'

    const markdown = turndownService.turndown(html)

    expect(markdown).toContain('| Name | Description |')
    expect(markdown).toContain('| --- | --- |')
    expect(markdown).toContain('| **Bold** | *Italic* |')
  })

  it('should produce GFM-compliant header separator', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>1</td><td>2</td><td>3</td></tr></tbody></table>'

    const markdown = turndownService.turndown(html)

    // GFM requires at least one dash per column, separated by pipes
    expect(markdown).toMatch(/\|\s*---\s*\|/)
  })
})
