/**
 * AutoSaveManager - Handles automatic saving with debouncing
 *
 * Features:
 * - Fixed 3-second debounce to prevent rapid API calls
 * - Queue management for pending saves
 * - Handles concurrent edits during save operations
 * - Force save capability for explicit user actions
 * - Clean resource management on destroy
 */

export interface AutoSaveOptions {
  /**
   * Debounce time in milliseconds
   * @default 3000 (3 seconds)
   */
  debounceMs?: number;
}

export interface SaveResult {
  success: boolean;
  error?: Error;
  timestamp: number;
}

export class AutoSaveManager {
  private saveTimer: NodeJS.Timeout | null = null;
  private pendingContent: string | null = null;
  private isSaving = false;
  private readonly debounceMs: number;
  private lastSaveTime = 0;
  private fileId: string | null;

  /**
   * Creates an AutoSaveManager instance
   *
   * @param fileId - Google Drive file ID (null for new files)
   * @param onSave - Callback function to execute the actual save operation
   * @param options - Configuration options
   */
  constructor(
    fileId: string | null,
    private readonly onSave: (content: string) => Promise<void>,
    options: AutoSaveOptions = {}
  ) {
    this.fileId = fileId;
    this.debounceMs = options.debounceMs ?? 3000;
  }

  /**
   * Schedule a save operation with debouncing
   * If called multiple times within debounce window, only the last content is saved
   *
   * @param content - Content to save
   */
  scheduleSave(content: string): void {
    this.pendingContent = content;

    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    // Schedule new save
    this.saveTimer = setTimeout(() => {
      this.executeSave();
    }, this.debounceMs);
  }

  /**
   * Execute the pending save operation
   * Handles concurrent edits during save by re-scheduling if new content arrives
   *
   * @returns Promise that resolves with save result
   */
  async executeSave(): Promise<SaveResult> {
    // No pending content to save
    if (!this.pendingContent) {
      return {
        success: true,
        timestamp: Date.now(),
      };
    }

    // Already saving - new content will be handled by next save
    if (this.isSaving) {
      return {
        success: false,
        error: new Error('Save already in progress'),
        timestamp: Date.now(),
      };
    }

    // Capture content to save and clear pending
    const contentToSave = this.pendingContent;
    this.pendingContent = null;
    this.isSaving = true;

    try {
      await this.onSave(contentToSave);
      this.lastSaveTime = Date.now();

      return {
        success: true,
        timestamp: this.lastSaveTime,
      };
    } catch (error) {
      // If save failed, restore content to pending for retry
      if (!this.pendingContent) {
        this.pendingContent = contentToSave;
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
      };
    } finally {
      this.isSaving = false;

      // If new content arrived during save, schedule another save
      if (this.pendingContent && this.pendingContent !== contentToSave) {
        this.scheduleSave(this.pendingContent);
      }
    }
  }

  /**
   * Force an immediate save, bypassing debounce
   * Useful for explicit save actions (e.g., user clicks "Save" button)
   *
   * @returns Promise that resolves with save result
   */
  async forceSave(): Promise<SaveResult> {
    // Clear any pending debounced save
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    // Execute save immediately
    return this.executeSave();
  }

  /**
   * Check if there are pending unsaved changes
   *
   * @returns True if there are pending changes
   */
  hasPendingChanges(): boolean {
    return this.pendingContent !== null || this.isSaving;
  }

  /**
   * Get time since last successful save
   *
   * @returns Milliseconds since last save, or -1 if never saved
   */
  getTimeSinceLastSave(): number {
    if (this.lastSaveTime === 0) {
      return -1;
    }
    return Date.now() - this.lastSaveTime;
  }

  /**
   * Update the file ID (e.g., after creating a new file)
   *
   * @param fileId - New Google Drive file ID
   */
  setFileId(fileId: string): void {
    this.fileId = fileId;
  }

  /**
   * Get current file ID
   *
   * @returns Current file ID or null
   */
  getFileId(): string | null {
    return this.fileId;
  }

  /**
   * Clean up resources and cancel pending saves
   * Should be called when component unmounts or manager is no longer needed
   */
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.pendingContent = null;
    this.isSaving = false;
  }
}
