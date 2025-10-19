import ResizableImageExtension from 'tiptap-extension-resize-image'

export const ImageExtension = ResizableImageExtension.configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: {
    class: 'tiptap-image',
    loading: 'lazy',
    decoding: 'async',
  },
})
