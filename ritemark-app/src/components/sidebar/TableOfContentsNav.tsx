import { useState, useEffect, useCallback, useRef } from 'react'
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
  // pos no longer required for DOM-based measurement; kept for type stability
  pos?: number
  // stable index within combined h1..h6 NodeList for DOM lookup
  domIndex: number
}

interface TableOfContentsNavProps {
  editor?: TipTapEditor | null
  content?: string
}

export function TableOfContentsNav({ editor, content }: TableOfContentsNavProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const updateHeadingsRef = useRef<() => void>(() => {})
  const editorRef = useRef<TipTapEditor | null>(null)
  const rootElementRef = useRef<HTMLElement | null>(null)

  // Slugify helper for generating stable IDs
  const slugify = useCallback((text: string): string => {
    // Normalize diacritics, keep unicode letters/numbers and dashes
    const normalized = text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    return normalized
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
  }, [])

  // Keep editorRef in sync with editor prop and cache root DOM element
  useEffect(() => {
    editorRef.current = editor || null

    // Cache the root DOM element when editor is live
    if (editor && !editor.isDestroyed) {
      try {
        const view = (editor as any).view
        if (view && view.dom) {
          rootElementRef.current = view.dom as HTMLElement
        }
      } catch {
        // Silently handle - view may not be mounted yet
      }
    }
  }, [editor])

  // Extract headings from DOM - works even when editor is destroyed
  const collectHeadings = useCallback((): Heading[] => {
    let root: HTMLElement | null = null
    const currentEditor = editorRef.current

    // Try to get root from live editor first
    if (currentEditor && !currentEditor.isDestroyed) {
      try {
        const view = (currentEditor as any).view
        if (view && view.dom) {
          root = view.dom as HTMLElement
        }
      } catch {
        // Silently handle - view may not be accessible
      }
    }

    // Fallback: use cached root element (works even when editor is destroyed)
    if (!root && rootElementRef.current) {
      root = rootElementRef.current
    }

    // Last resort: try to find ProseMirror element in DOM
    if (!root) {
      const proseMirrorEl = document.querySelector('.ProseMirror') as HTMLElement | null
      if (proseMirrorEl) {
        root = proseMirrorEl
        rootElementRef.current = proseMirrorEl // Cache it for next time
      }
    }

    if (!root) {
      return []
    }

    const nodeList = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const results: Heading[] = []
    const usedIds = new Set<string>()

    Array.from(nodeList).forEach((el, idx) => {
      const level = parseInt(el.tagName.substring(1))
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ')
      if (!text) {
        return
      }

      const baseId = `heading-${level}-${slugify(text)}`
      let id = baseId
      let counter = 1
      while (usedIds.has(id)) {
        id = `${baseId}-${counter}`
        counter++
      }
      usedIds.add(id)

      results.push({ id, level, textContent: text, domIndex: idx })
    })

    return results
  }, [slugify])

  // Stable update function that collects and sets headings
  const updateHeadings = useCallback(() => {
    const newHeadings = collectHeadings()
    setHeadings(newHeadings)
  }, [collectHeadings])

  // Keep a stable ref to the update function for event handlers
  useEffect(() => {
    updateHeadingsRef.current = updateHeadings
  }, [updateHeadings])

  // PRIMARY: Subscribe to editor events when editor is live (fast, real-time updates)
  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }

    // Check if view is ready for initial extraction
    let viewReady = false
    try {
      viewReady = !!(editor as any).view && !!(editor as any).view.dom
    } catch {
      // View not accessible yet
    }

    // Initial extraction only if view is ready
    if (viewReady) {
      requestAnimationFrame(() => {
        updateHeadingsRef.current()
      })
    }

    // Event handlers for live editor
    const handleUpdate = () => {
      requestAnimationFrame(() => {
        updateHeadingsRef.current()
      })
    }

    const handleTransaction = () => {
      requestAnimationFrame(() => {
        updateHeadingsRef.current()
      })
    }

    const handleCreate = () => {
      requestAnimationFrame(() => {
        updateHeadingsRef.current()
      })
    }

    editor.on('create', handleCreate)
    editor.on('update', handleUpdate)
    editor.on('transaction', handleTransaction)

    return () => {
      editor.off('create', handleCreate)
      editor.off('update', handleUpdate)
      editor.off('transaction', handleTransaction)
    }
  }, [editor])

  // FALLBACK: Update headings when content changes (handles destroyed editor case)
  useEffect(() => {
    if (!content) {
      return
    }

    // Delay to ensure TipTap has rendered the content to DOM
    const timer = setTimeout(() => {
      updateHeadingsRef.current()
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [content])

  // Track active heading based on DOM positions
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

      let root: HTMLElement | null = null
      try {
        root = ((editor as any).view?.dom ?? null) as HTMLElement | null
      } catch {
        return
      }
      if (!root) return
      const allNodes = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
      for (const heading of headings) {
        const el = allNodes[heading.domIndex] as Element | undefined
        if (!el) continue

        const rect = el.getBoundingClientRect()
        const headingTop = rect.top + scrollY

        // Check if heading is currently visible in viewport
        const isVisible = headingTop >= viewportTop && headingTop <= viewportBottom

        if (isVisible) {
          if (!topmostVisibleHeading || headingTop < (topmostVisibleHeading as any).top) {
            topmostVisibleHeading = { id: heading.id, top: headingTop }
          }
        }

        if (headingTop <= viewportTop) {
          lastPassedHeading = heading.id
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

  // Simple DOM-based scroll navigation
  const scrollToHeading = (heading: Heading, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Use same fallback logic as collectHeadings for reliability
    let root: HTMLElement | null = null

    // Try to get root from live editor first
    if (editor && !editor.isDestroyed) {
      try {
        const view = (editor as any).view
        if (view && view.dom) {
          root = view.dom as HTMLElement
        }
      } catch {
        // Silently handle - view may not be accessible
      }
    }

    // Fallback: use cached root element (works even when editor is destroyed)
    if (!root && rootElementRef.current) {
      root = rootElementRef.current
    }

    // Last resort: try to find ProseMirror element in DOM
    if (!root) {
      const proseMirrorEl = document.querySelector('.ProseMirror') as HTMLElement | null
      if (proseMirrorEl) {
        root = proseMirrorEl
        rootElementRef.current = proseMirrorEl // Cache it for next time
      }
    }

    if (!root) return
    const allHeadings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const element = allHeadings[heading.domIndex] as Element | undefined
    if (!element) return

    const rect = element.getBoundingClientRect()
    const elementTop = rect.top + window.scrollY
    const targetScroll = Math.max(0, elementTop - 64)

    const currentScroll = window.scrollY
    const scrollDiff = Math.abs(currentScroll - targetScroll)

    if (scrollDiff < 5) {
      setActiveId(heading.id)
      return
    }

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })

    setActiveId(heading.id)
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
