/**
 * Sprint 20 Phase 4: React Integration - SettingsContext
 *
 * Provides settings state and sync operations to all components
 * Integrates with SettingsSyncService for cross-device persistence
 */

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react'
import type { UserSettings } from '../types/settings'

/**
 * Settings context interface
 * Exposes settings state, sync status, and CRUD operations
 */
export interface SettingsContextType {
  /** Current user settings (null if not loaded yet) */
  settings: UserSettings | null

  /** Loading state (initial load from cache/Drive) */
  loading: boolean

  /** Syncing state (background sync in progress) */
  syncing: boolean

  /** Error state (last sync error, null if no error) */
  error: Error | null

  /** Save settings (local + cloud sync) */
  saveSettings: (settings: UserSettings) => Promise<void>

  /** Load settings (cache-first, then Drive) */
  loadSettings: () => Promise<void>

  /** Trigger manual sync (bidirectional last-write-wins) */
  syncSettings: () => Promise<void>

  /** Delete settings (local + cloud) */
  deleteSettings: () => Promise<void>

  /** Last successful sync timestamp (milliseconds since epoch) */
  lastSyncTime: number | null
}

/**
 * Settings context (must be used within SettingsProvider)
 */
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

/**
 * Settings provider props
 */
interface SettingsProviderProps {
  children: React.ReactNode
}

/**
 * SettingsProvider Component
 *
 * Wraps app to provide settings state and sync functionality
 * Automatically starts background sync after authentication
 *
 * Usage:
 * <AuthProvider>
 *   <SettingsProvider>
 *     <App />
 *   </SettingsProvider>
 * </AuthProvider>
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // State management
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  // Initialize SettingsSyncService (lazy import to avoid circular dependencies)
  const syncService = useMemo(() => {
    // Placeholder: Import actual service when implemented
    // import { SettingsSyncService } from '../services/settings/SettingsSyncService'
    // return new SettingsSyncService()

    // Temporary mock service for type safety until real service is implemented
    return {
      loadSettings: async (): Promise<UserSettings | null> => {
        console.warn('[SettingsContext] SettingsSyncService not implemented yet')
        return null
      },
      saveSettings: async (_settings: UserSettings): Promise<void> => {
        console.warn('[SettingsContext] SettingsSyncService not implemented yet')
      },
      syncSettings: async (): Promise<void> => {
        console.warn('[SettingsContext] SettingsSyncService not implemented yet')
      },
      deleteSettings: async (): Promise<void> => {
        console.warn('[SettingsContext] SettingsSyncService not implemented yet')
      },
      startAutoSync: (): void => {
        console.warn('[SettingsContext] SettingsSyncService not implemented yet')
      },
      stopAutoSync: (): void => {
        console.warn('[SettingsContext] SettingsSyncService not implemented yet')
      },
      getLastSyncTime: (): number | null => {
        return null
      },
    }
  }, [])

  // Load settings on mount and start auto-sync
  useEffect(() => {
    // Load settings from cache/Drive
    loadSettings()

    // Start background sync (every 30 seconds)
    syncService.startAutoSync()

    // Cleanup: stop auto-sync on unmount
    return () => {
      syncService.stopAutoSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  /**
   * Load settings (cache-first strategy)
   * Tries IndexedDB cache first for instant load, then syncs in background
   */
  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loaded = await syncService.loadSettings()
      setSettings(loaded)
      setLastSyncTime(syncService.getLastSyncTime())

      console.log('[SettingsContext] Settings loaded successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load settings')
      setError(error)
      console.error('[SettingsContext] Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }, [syncService])

  /**
   * Save settings (local + cloud sync)
   * Updates timestamp and uploads to Drive AppData (encrypted)
   */
  const saveSettings = useCallback(
    async (newSettings: UserSettings) => {
      setSyncing(true)
      setError(null)

      try {
        await syncService.saveSettings(newSettings)
        setSettings(newSettings)
        setLastSyncTime(Date.now())

        console.log('[SettingsContext] Settings saved successfully')
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to save settings')
        setError(error)
        console.error('[SettingsContext] Failed to save settings:', error)
        throw error // Re-throw so UI can handle error
      } finally {
        setSyncing(false)
      }
    },
    [syncService]
  )

  /**
   * Trigger manual sync (bidirectional)
   * Compares local vs remote timestamps and resolves conflicts (last-write-wins)
   */
  const syncSettings = useCallback(async () => {
    setSyncing(true)
    setError(null)

    try {
      await syncService.syncSettings()

      // Reload settings after sync to reflect any remote changes
      const updated = await syncService.loadSettings()
      if (updated) {
        setSettings(updated)
      }

      setLastSyncTime(Date.now())
      console.log('[SettingsContext] Settings synced successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sync settings')
      setError(error)
      console.error('[SettingsContext] Failed to sync settings:', error)
    } finally {
      setSyncing(false)
    }
  }, [syncService])

  /**
   * Delete settings (local + cloud)
   * Removes from IndexedDB cache and Google Drive AppData
   */
  const deleteSettings = useCallback(async () => {
    setSyncing(true)
    setError(null)

    try {
      await syncService.deleteSettings()
      setSettings(null)
      setLastSyncTime(null)

      console.log('[SettingsContext] Settings deleted successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete settings')
      setError(error)
      console.error('[SettingsContext] Failed to delete settings:', error)
      throw error
    } finally {
      setSyncing(false)
    }
  }, [syncService])

  // Context value
  const value: SettingsContextType = {
    settings,
    loading,
    syncing,
    error,
    saveSettings,
    loadSettings,
    syncSettings,
    deleteSettings,
    lastSyncTime,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
