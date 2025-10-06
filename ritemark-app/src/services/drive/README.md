# Google Drive Services

This directory contains services for Google Drive API integration.

## AutoSaveManager

Handles automatic saving with debouncing to prevent excessive API calls.

### Features

- **Fixed 3-second debounce** - Prevents rapid API calls on every keystroke
- **Queue management** - Handles pending saves intelligently
- **Concurrent edit handling** - Manages edits that occur during save operations
- **Force save capability** - Allows immediate save for explicit user actions
- **Resource cleanup** - Proper cleanup on component unmount

### Basic Usage

```typescript
import { AutoSaveManager } from '@/services/drive';

// Create manager instance
const autoSaveManager = new AutoSaveManager(
  fileId, // Google Drive file ID (null for new files)
  async (content: string) => {
    // Your save logic here
    await driveClient.updateFile(fileId, content);
  }
);

// Schedule saves (debounced automatically)
editor.on('update', ({ editor }) => {
  const markdown = editor.storage.markdown.getMarkdown();
  autoSaveManager.scheduleSave(markdown);
});

// Force immediate save (bypasses debounce)
saveButton.onClick = async () => {
  const result = await autoSaveManager.forceSave();
  if (result.success) {
    showToast('Saved successfully');
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => autoSaveManager.destroy();
}, []);
```

### Advanced Usage

```typescript
// Custom debounce time (for testing)
const manager = new AutoSaveManager(fileId, onSave, {
  debounceMs: 5000, // 5 seconds
});

// Check for pending changes
if (manager.hasPendingChanges()) {
  showUnsavedIndicator();
}

// Check time since last save
const timeSinceLastSave = manager.getTimeSinceLastSave();
if (timeSinceLastSave > 60000) {
  showLastSavedLabel('Over a minute ago');
}

// Update file ID after creating new file
const newFileId = await driveClient.createFile(content);
manager.setFileId(newFileId);
```

### Network Handling

The AutoSaveManager uses a **fixed 3-second debounce** for all network conditions. Network-aware throttling was descoped due to iOS Safari limitations with the Navigator.connection API.

For handling slow networks or offline scenarios, implement exponential backoff in your `onSave` callback:

```typescript
const onSave = async (content: string) => {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      await driveClient.updateFile(fileId, content);
      return;
    } catch (error) {
      if (retries === maxRetries - 1) throw error;

      const backoffMs = Math.min(1000 * Math.pow(2, retries), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      retries++;
    }
  }
};
```

### API Reference

#### Constructor

```typescript
constructor(
  fileId: string | null,
  onSave: (content: string) => Promise<void>,
  options?: AutoSaveOptions
)
```

#### Methods

- `scheduleSave(content: string): void` - Schedule a save with debouncing
- `executeSave(): Promise<SaveResult>` - Execute pending save (internal use)
- `forceSave(): Promise<SaveResult>` - Force immediate save, bypass debounce
- `hasPendingChanges(): boolean` - Check if there are unsaved changes
- `getTimeSinceLastSave(): number` - Get milliseconds since last save (-1 if never saved)
- `setFileId(fileId: string): void` - Update file ID
- `getFileId(): string | null` - Get current file ID
- `destroy(): void` - Clean up resources

#### Types

```typescript
interface AutoSaveOptions {
  debounceMs?: number; // Default: 3000
}

interface SaveResult {
  success: boolean;
  error?: Error;
  timestamp: number;
}
```

## Coming Soon

- `DriveClient` - Core Google Drive API operations
- `FilePicker` - Google Drive file picker integration
- `DriveSync` - Real-time sync with Y.js integration
