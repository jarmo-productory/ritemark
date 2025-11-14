import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { checkBackendHealth } from '@/utils/backendHealth'

/**
 * Sprint 22 - Performance Optimization
 *
 * Backend Health Context
 *
 * Purpose:
 * - Check backend availability once per session (not per component mount)
 * - Reduce unnecessary network requests
 * - Share backend status across all components
 *
 * Usage:
 * const { backendAvailable, isChecking, recheckHealth } = useBackendHealth()
 */

interface BackendHealthContextValue {
  backendAvailable: boolean | null
  isChecking: boolean
  recheckHealth: () => Promise<void>
}

const BackendHealthContext = createContext<BackendHealthContextValue | undefined>(undefined)

interface BackendHealthProviderProps {
  children: ReactNode
}

export function BackendHealthProvider({ children }: BackendHealthProviderProps) {
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  const recheckHealth = async () => {
    setIsChecking(true)
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const available = await checkBackendHealth()

        if (available) {
          console.log('[BackendHealth] ✅ Backend available')
          setBackendAvailable(true)
          setIsChecking(false)
          return
        }

        attempts++

        // Wait 1 second between attempts (except after last attempt)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        attempts++

        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    console.log('[BackendHealth] Using browser-only OAuth (backend unavailable)')
    setBackendAvailable(false)
    setIsChecking(false)
  }

  // Check backend health on mount
  useEffect(() => {
    recheckHealth()
  }, [])

  return (
    <BackendHealthContext.Provider value={{ backendAvailable, isChecking, recheckHealth }}>
      {children}
    </BackendHealthContext.Provider>
  )
}

/**
 * Hook to access backend health status
 */
export function useBackendHealth() {
  const context = useContext(BackendHealthContext)
  if (context === undefined) {
    throw new Error('useBackendHealth must be used within BackendHealthProvider')
  }
  return context
}
