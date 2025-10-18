import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

/**
 * Table extensions bundle for TipTap editor
 * Provides table functionality with GFM markdown support
 *
 * Note: Table.configure() accepts HTMLAttributes directly (not nested)
 * The class 'tiptap-table-node' will be applied to <table> elements
 */
export const tableExtensions = [
  Table.configure({
    resizable: false, // CRITICAL: resizable: true breaks HTMLAttributes (TipTap bug #1766, #6176)
    HTMLAttributes: {
      class: 'tiptap-table-node',
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: 'tiptap-table-row',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'tiptap-table-cell',
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: 'tiptap-table-header',
    },
  }),
]
