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
    try {
      const available = await checkBackendHealth()
      setBackendAvailable(available)
    } catch (error) {
      console.error('[BackendHealth] Health check failed:', error)
      setBackendAvailable(false)
    } finally {
      setIsChecking(false)
    }
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
