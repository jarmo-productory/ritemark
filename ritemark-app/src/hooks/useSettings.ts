/**
 * Sprint 20 Phase 4: React Integration - useSettings Hook
 *
 * Custom hook for accessing settings context
 * Throws error if used outside SettingsProvider
 */

import { useContext } from 'react'
import { SettingsContext, type SettingsContextType } from '../contexts/SettingsContext'

/**
 * useSettings Hook
 *
 * Provides access to settings state and sync operations
 * Must be used within SettingsProvider tree
 *
 * @throws {Error} If used outside SettingsProvider
 *
 * @example
 * ```tsx
 * function SettingsModal() {
 *   const { settings, saveSettings, syncing } = useSettings()
 *
 *   const handleThemeChange = async (theme: 'light' | 'dark') => {
 *     await saveSettings({
 *       ...settings!,
 *       preferences: {
 *         ...settings!.preferences,
 *         theme
 *       }
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <p>Current theme: {settings?.preferences?.theme}</p>
 *       <button onClick={() => handleThemeChange('dark')} disabled={syncing}>
 *         Switch to Dark Mode
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }

  return context
}
