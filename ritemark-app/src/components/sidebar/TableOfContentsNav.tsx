import { useState, useEffect, useCallback } from 'react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { Editor as TipTapEditor } from '@tiptap/react'

interface Heading {
  id: string
  level: number
  textContent: string
  pos: number
}

interface TableOfContentsNavProps {
  editor?: TipTapEditor | null
}

export function TableOfContentsNav({ editor }: TableOfContentsNavProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Slugify helper for generating stable IDs
  const slugify = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
  }, [])

  // Extract headings from ProseMirror document state (not DOM)
  const collectHeadings = useCallback((): Heading[] => {
    if (!editor) return []

    const headings: Heading[] = []
    const usedIds = new Set<string>()

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level || 1
        const textContent = node.textContent.trim()

        if (textContent) {
          const baseId = `heading-${level}-${slugify(textContent)}`
          let id = baseId
          let counter = 1

          // Ensure unique IDs by adding counter if needed
          while (usedIds.has(id)) {
            id = `${baseId}-${counter}`
            counter++
          }

          usedIds.add(id)
          headings.push({
            id,
            level,
            textContent,
            pos
          })
        }
      }
    })

    return headings
  }, [editor, slugify])

  // Update headings when editor content changes
  useEffect(() => {
    if (!editor) return

    const updateHeadings = () => {
      const newHeadings = collectHeadings()
      setHeadings(newHeadings)
    }

    // Initial extraction
    updateHeadings()

    // Subscribe to editor updates (no polling needed)
    editor.on('update', updateHeadings)

    return () => {
      editor.off('update', updateHeadings)
    }
  }, [editor, collectHeadings])

  // Track active heading based on scroll position using ProseMirror coordinates
  useEffect(() => {
    if (!editor || headings.length === 0) return

    const updateActiveHeading = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const viewportTop = scrollY
      const viewportBottom = scrollY + viewportHeight

      let currentActiveId = '' // Start with no active heading
      let topmostVisibleHeading = null
      let lastPassedHeading = null

      for (const heading of headings) {
        try {
          // Use ProseMirror's coordsAtPos for accurate positioning
          const coords = editor.view.coordsAtPos(heading.pos)
          const headingTop = coords.top + scrollY

          // Check if heading is currently visible in viewport
          const isVisible = headingTop >= viewportTop && headingTop <= viewportBottom

          if (isVisible) {
            // If heading is visible and it's the topmost one we've seen
            if (!topmostVisibleHeading || headingTop < topmostVisibleHeading.top) {
              topmostVisibleHeading = { id: heading.id, top: headingTop }
            }
          }

          // Track the last heading that was passed (above current viewport)
          if (headingTop <= viewportTop) {
            lastPassedHeading = heading.id
          }
        } catch {
          // Fallback: if coordsAtPos fails, continue with next heading
          continue
        }
      }

      // Google's logic: Use topmost visible heading, or if none visible, use last passed heading
      if (topmostVisibleHeading) {
        currentActiveId = topmostVisibleHeading.id
      } else if (lastPassedHeading) {
        currentActiveId = lastPassedHeading
      }
      // If no headings are visible and none were passed, currentActiveId remains empty

      setActiveId(currentActiveId)
    }

    // Initial active heading detection
    updateActiveHeading()

    // Listen to scroll events
    window.addEventListener('scroll', updateActiveHeading, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateActiveHeading)
    }
  }, [editor, headings])

  // ProseMirror state-based scroll navigation
  const scrollToHeading = (heading: Heading, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (!editor) return

    try {
      // Validate position is within document bounds
      const docSize = editor.state.doc.content.size
      if (heading.pos < 0 || heading.pos > docSize) {
        console.warn('Heading position out of bounds, refreshing headings')
        return
      }

      // Ensure editor is focused and has valid selection before getting coordinates
      if (!editor.state.selection || !editor.view.state) {
        console.warn('Editor not ready for position calculation')
        return
      }

      // Get the exact position of the heading using ProseMirror coordinates
      const coords = editor.view.coordsAtPos(heading.pos)
      const headingTop = coords.top + window.scrollY
      const targetScrollPosition = Math.max(0, headingTop - 10) // Minimal 10px offset for precise top positioning

      // Manual scroll to ensure heading goes to top of page
      window.scrollTo({
        top: targetScrollPosition,
        behavior: 'smooth'
      })

      // Set selection to the heading for editor focus
      // Use a safe position inside the heading node (pos + 1 ensures we're inside the text)
      const safePos = Math.min(heading.pos + 1, docSize - 1)
      editor
        .chain()
        .focus()
        .setTextSelection(safePos)
        .run()

      // Update active heading immediately for UI feedback
      setActiveId(heading.id)
    } catch {
      // Fallback: try TipTap's built-in scroll if coordinate calculation fails
      try {
        editor
          .chain()
          .focus()
          .setTextSelection(heading.pos)
          .scrollIntoView()
          .run()
        setActiveId(heading.id)
      } catch {
        // Silently handle any position errors
      }
    }
  }

  // Don't render if no headings (Invisible Interface philosophy)
  if (headings.length === 0) {
    return null
  }

  return (
    <SidebarMenu>
      {headings.map((heading) => (
        <SidebarMenuItem key={heading.id}>
          <SidebarMenuButton
            onClick={(event) => scrollToHeading(heading, event)}
            isActive={activeId === heading.id}
            className={`toc-level-${heading.level} ${
              heading.level === 1 ? 'pl-2' : 
              heading.level === 2 ? 'pl-4' : 
              heading.level === 3 ? 'pl-6' : 
              heading.level === 4 ? 'pl-8' : 
              heading.level === 5 ? 'pl-10' : 
              'pl-12'
            }`}
            aria-current={activeId === heading.id ? 'location' : undefined}
          >
            <span className="truncate">{heading.textContent}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
