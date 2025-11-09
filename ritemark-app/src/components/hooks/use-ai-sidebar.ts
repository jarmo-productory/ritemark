import { useState, useCallback } from 'react'

/**
 * Storage key for AI sidebar state persistence
 */
const AI_SIDEBAR_STATE_KEY = 'ai-sidebar-state'

/**
 * Valid sidebar state values
 */
type SidebarState = 'expanded' | 'collapsed'

/**
 * Custom hook for managing AI chat sidebar expand/collapse state
 *
 * Features:
 * - Persists state to localStorage
 * - Default state: collapsed (maximizes editor space)
 * - Tracks animation state to prevent rapid toggles
 * - Provides toggle function with animation coordination
 *
 * @param defaultState - Optional default state (defaults to 'collapsed')
 * @returns Sidebar state and control functions
 */
export function useAISidebar(defaultState: SidebarState = 'collapsed') {
  /**
   * Load initial state from localStorage or use default
   */
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AI_SIDEBAR_STATE_KEY)
      if (saved === 'expanded' || saved === 'collapsed') {
        return saved === 'expanded'
      }
    } catch (error) {
      console.warn('[useAISidebar] Failed to load state from localStorage:', error)
    }
    return defaultState === 'expanded'
  })

  /**
   * Track animation state to prevent UI jank during transitions
   */
  const [isAnimating, setIsAnimating] = useState(false)

  /**
   * Toggle sidebar between expanded and collapsed states
   * Coordinates animation timing and localStorage persistence
   */
  const toggleSidebar = useCallback(() => {
    setIsAnimating(true)
    setIsExpanded(prev => {
      const newState = !prev

      // Persist to localStorage
      try {
        localStorage.setItem(
          AI_SIDEBAR_STATE_KEY,
          newState ? 'expanded' : 'collapsed'
        )
      } catch (error) {
        console.warn('[useAISidebar] Failed to save state to localStorage:', error)
      }

      return newState
    })

    // Reset animating flag after transition completes
    // 300ms width transition + 50ms buffer
    setTimeout(() => setIsAnimating(false), 350)
  }, [])

  /**
   * Expand the sidebar (if currently collapsed)
   */
  const expand = useCallback(() => {
    if (!isExpanded) {
      toggleSidebar()
    }
  }, [isExpanded, toggleSidebar])

  /**
   * Collapse the sidebar (if currently expanded)
   */
  const collapse = useCallback(() => {
    if (isExpanded) {
      toggleSidebar()
    }
  }, [isExpanded, toggleSidebar])

  return {
    isExpanded,
    isAnimating,
    toggleSidebar,
    expand,
    collapse,
  }
}

/**
 * Reset sidebar state to default (collapsed)
 * Useful for document switches or logout
 */
export function resetAISidebarState() {
  try {
    localStorage.setItem(AI_SIDEBAR_STATE_KEY, 'collapsed')
  } catch (error) {
    console.warn('[resetAISidebarState] Failed to reset state:', error)
  }
}
