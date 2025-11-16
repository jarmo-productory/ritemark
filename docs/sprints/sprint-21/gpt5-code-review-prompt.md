# GPT-5 Code Review: RiteMark Auto-Open & Drive Sync Issues

## Context

RiteMark is a WYSIWYG markdown editor with Google Drive integration. We recently implemented Sprint 21 features:
1. **"Pick up where you left off"** - Auto-open last edited file on app startup
2. **Settings sync** - Cross-device settings via Google Drive AppData
3. **Auto-save** - 3-second debounced save to Google Drive

## Critical Issues Reported by User

### Issue 1: Table of Contents Not Updating
**Symptom:** TOC doesn't always update when headings are modified in the editor
**Suspected cause:** React hooks not triggering, stale closures, or missing dependencies

### Issue 2: Auto-Save Occasionally Fails
**Symptom:** File shows "Saved" indicator but changes aren't persisted to Drive
**Suspected cause:** Race condition between auto-open and auto-save initialization, or useEffect dependency issues

### Issue 3: Auto-Open Not Working After Refresh
**Symptom:** Despite toggle being ON and file ID saved in settings, page refresh doesn't reopen the document
**Suspected cause:** Settings not loaded before auto-open check, or race condition in multiple useEffects

## Code Sections to Review

### 1. App.tsx - Auto-Open Implementation

```typescript
// Auto-open last file on app startup (after authentication loads)
const hasAutoOpened = useRef(false)

useEffect(() => {
  // Only auto-open ONCE per session
  if (hasAutoOpened.current) {
    return
  }

  const shouldAutoOpen =
    settings?.preferences?.autoOpenLastFile &&
    settings?.preferences?.lastOpenedFileId &&
    isAuthenticated &&
    !fileId

  if (shouldAutoOpen) {
    const lastFileId = settings.preferences.lastOpenedFileId!
    const lastFileName = settings.preferences.lastOpenedFileName || 'Last opened file'

    console.log('[App] Auto-opening last file:', lastFileId, lastFileName)

    // Load file content from Drive (same as handleFileSelect)
    const autoLoadFile = async () => {
      try {
        console.log('[App] Loading file content from Drive...')
        const { metadata, content: fileContent } = await loadFile(lastFileId)

        console.log('[App] ✅ File loaded successfully:', metadata.name, `(${fileContent.length} chars)`)
        setFileId(metadata.id)
        setTitle(metadata.name)
        setContent(fileContent)
        setIsNewDocument(false)
        setShowWelcomeScreen(false)
      } catch (error) {
        console.error('[App] ❌ Failed to auto-open file:', error)
        setShowWelcomeScreen(true)
      }
    }

    autoLoadFile()
    hasAutoOpened.current = true // Mark as auto-opened to prevent repeats
  }
}, [isAuthenticated, settings?.preferences?.autoOpenLastFile, settings?.preferences?.lastOpenedFileId, fileId, loadFile])
```

**Questions:**
- Is `loadFile` stable or does it change on every render?
- Does auto-open trigger before settings are fully loaded?
- Race condition: auto-open sets `fileId` → triggers Drive sync hook → but content might not be ready?

### 2. App.tsx - File Tracking Implementation

```typescript
// Track last opened file for "Pick up where you left off" feature
useEffect(() => {
  const trackLastOpenedFile = async () => {
    // Only track if feature is enabled and we have a file open
    if (!fileId || !settings?.preferences?.autoOpenLastFile) {
      return
    }

    // Prevent saving if file ID hasn't actually changed
    if (settings?.preferences?.lastOpenedFileId === fileId) {
      return
    }

    try {
      // Update settings with last opened file ID
      const updatedSettings = {
        ...settings,
        preferences: {
          ...settings.preferences,
          lastOpenedFileId: fileId,
          lastOpenedFileName: title,
        },
        timestamp: Date.now()
      }

      await saveSettings(updatedSettings)
      console.log('[App] Saved last opened file:', fileId, title)
    } catch (error) {
      console.error('[App] Failed to save last opened file:', error)
    }
  }

  trackLastOpenedFile()
}, [fileId, title]) // ✅ FIXED - Only depend on fileId and title, not settings!
```

**Questions:**
- Is `saveSettings` stable or does it trigger re-renders?
- Does `saveSettings` mutate settings state, causing the auto-open useEffect to re-run?
- Missing dependencies: `settings` and `saveSettings` not in array - could cause stale closure bugs

### 3. useDriveSync.ts - Auto-Save Hook

```typescript
export function useDriveSync(
  fileId: string | null,
  title: string,
  content: string,
  options: UseDriveSyncOptions = {}
): UseDriveSyncReturn {
  const { onFileCreated, onAuthError, debounceMs = 3000 } = options

  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    status: 'synced',
    lastSaved: undefined,
    isSynced: true,
    isSaving: false,
    isOffline: false,
    hasError: false,
  })

  const autoSaveManager = useRef<AutoSaveManager | null>(null)
  const currentFileId = useRef<string | null>(fileId)

  // Update currentFileId when fileId prop changes
  useEffect(() => {
    currentFileId.current = fileId
    if (autoSaveManager.current && fileId) {
      autoSaveManager.current.setFileId(fileId)
    }
  }, [fileId])

  /**
   * Initialize auto-save manager with save function
   */
  useEffect(() => {
    const saveFunction = async (contentToSave: string) => {
      // ... save logic ...
    }

    autoSaveManager.current = new AutoSaveManager(fileId, saveFunction, {
      debounceMs,
    })

    return () => {
      autoSaveManager.current?.destroy()
      autoSaveManager.current = null
    }
  }, [fileId, debounceMs, onFileCreated, title])

  /**
   * Trigger auto-save on content change
   */
  useEffect(() => {
    if (content && autoSaveManager.current) {
      autoSaveManager.current.scheduleSave(content)
    }
  }, [content])
}
```

**Questions:**
- Race condition: Auto-save manager created with `fileId` dependency → when auto-open sets fileId, does it destroy and recreate the manager?
- Does the auto-save manager get destroyed before debounced save completes?
- Is there a race between content updates and auto-save initialization?

### 4. SettingsContext.tsx - Settings Loading

```typescript
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)

  // Use the actual SettingsSyncService singleton
  const syncService = useMemo(() => settingsSyncService, [])

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
  }, []) // Only run once on mount

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loaded = await syncService.loadSettings()
      setSettings(loaded)
      setLastSyncTime(syncService.getLastSyncTime())
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load settings')
      setError(error)
      console.error('[SettingsContext] Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }, [syncService])
}
```

**Questions:**
- Race condition: Is `settings` guaranteed to be loaded before App.tsx auto-open useEffect runs?
- Does the auto-open check run while `loading: true`, causing it to skip?
- Should there be a dependency on `loading` state in auto-open useEffect?

## Specific Review Requests

### 1. useEffect Dependency Arrays
Please analyze ALL useEffect hooks for:
- **Missing dependencies** → Stale closure bugs (ESLint warnings ignored?)
- **Unstable dependencies** → Infinite loops (functions recreated every render?)
- **Over-specified dependencies** → Unnecessary re-runs (entire objects instead of specific properties?)

### 2. Race Conditions
Identify race conditions between:
- Settings loading (`SettingsContext`) vs auto-open check (`App.tsx`)
- Auto-open setting fileId vs auto-save manager initialization (`useDriveSync`)
- File tracking saving settings vs auto-open reading settings
- Content updates vs auto-save scheduling

### 3. State Management Anti-Patterns
Look for:
- **setState inside useEffect without proper guards** → Potential infinite loops
- **Multiple useEffects modifying same state** → Unpredictable execution order
- **Ref vs state confusion** → `hasAutoOpened.current` prevents re-runs but also prevents recovery
- **Async state updates** → `saveSettings` completes after component unmounts?

### 4. Timing Issues
Check for:
- **Auto-open triggers before settings loaded** → Reads `null` settings
- **Auto-save manager destroyed before debounced save executes** → Lost changes
- **TOC update hooks missing dependencies** → Doesn't re-run when headings change
- **Settings sync conflicts** → Local changes overwritten by background sync?

### 5. React Hooks Rules Violations
Verify:
- **Hooks called conditionally** → Order changes between renders?
- **Hooks inside loops** → Unstable hook count?
- **useCallback/useMemo missing dependencies** → Stale closures?

## Expected Output

Please provide:

1. **Critical Bugs** - Issues that break core functionality
2. **Race Conditions** - Timing-dependent failures (hard to reproduce)
3. **Anti-Patterns** - Code that works but violates best practices
4. **Missing Safeguards** - Edge cases not handled (null checks, loading states, etc.)
5. **Recommended Fixes** - Concrete solutions with code examples

## Priority Areas

Focus on these flows:
1. **App startup → Settings load → Auto-open check → File load → Auto-save init**
2. **User edits content → TOC update → Auto-save trigger → Drive upload**
3. **User edits heading → TOC update (THIS IS BROKEN)**
4. **Page refresh → Settings restore → Auto-open (THIS IS BROKEN)**
5. **Background settings sync → Local state update → Re-render implications**

## Code Files to Analyze

All code is available in the context. Key files:
- `/src/App.tsx` - Main app component with auto-open logic
- `/src/hooks/useDriveSync.ts` - Auto-save hook
- `/src/contexts/SettingsContext.tsx` - Settings state management
- `/src/hooks/useSettings.ts` - Settings consumer hook
- `/src/services/settings/SettingsSyncService.ts` - Settings persistence
- `/src/components/sidebar/TableOfContents.tsx` - TOC component (if needed)

## Success Criteria

A successful review will:
- ✅ Explain WHY auto-open doesn't work after refresh
- ✅ Explain WHY auto-save occasionally fails
- ✅ Explain WHY TOC doesn't update when headings change
- ✅ Identify the root cause (race condition, stale closure, missing dependency, etc.)
- ✅ Provide working fix with proper useEffect dependencies
- ✅ Explain the execution order of all useEffects involved

---

**Note to GPT-5:** This is a production app used by real users. Please be thorough in identifying subtle timing bugs and React-specific gotchas. The developer has already fixed several infinite loop bugs by removing dependencies, but this may have introduced stale closure bugs instead.
