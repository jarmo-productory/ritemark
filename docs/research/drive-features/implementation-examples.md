# Implementation Examples - Code Snippets for RiteMark

## 🎯 Share Button Component

### Basic Share Button (Desktop)

```tsx
// components/toolbar/ShareButton.tsx
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ShareModal } from './ShareModal';

export function ShareButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        aria-label="Share document with others"
        aria-haspopup="dialog"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Mobile Responsive Share Button

```tsx
// components/toolbar/ResponsiveShareButton.tsx
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ShareModal } from './ShareModal';
import { useState } from 'react';

export function ResponsiveShareButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleShare = async () => {
    // Mobile: Use native Web Share API
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'RiteMark Document',
          text: 'Check out this document',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Desktop: Open modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        size={isMobile ? 'icon' : 'sm'}
        onClick={handleShare}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        aria-label="Share document"
      >
        <Share2 className={isMobile ? 'w-5 h-5' : 'w-4 h-4 mr-2'} />
        {!isMobile && 'Share'}
      </Button>

      {!isMobile && (
        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
```

### Share Modal Component

```tsx
// components/toolbar/ShareModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useDriveFile } from '@/hooks/useDriveFile';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { fileId, shareFile } = useDriveFile();
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<'reader' | 'writer'>('reader');

  const shareUrl = `${window.location.origin}/doc/${fileId}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await shareFile({ role: permission, type: 'anyone' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                aria-label="Copy share link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Permission Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Permission</label>
            <Select value={permission} onValueChange={(v: any) => setPermission(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">Can view</SelectItem>
                <SelectItem value="writer">Can edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            className="w-full"
            variant="primary"
          >
            Share with anyone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔄 Sync Status Indicator

### Basic Sync Indicator

```tsx
// components/toolbar/SyncIndicator.tsx
import { Check, Loader2, CloudOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncIndicatorProps {
  status: SyncStatus;
  progress?: number; // 0-100 for syncing state
  lastSyncTime?: Date;
  onRetry?: () => void;
}

export function SyncIndicator({
  status,
  progress = 0,
  lastSyncTime,
  onRetry,
}: SyncIndicatorProps) {
  const icons = {
    synced: Check,
    syncing: Loader2,
    offline: CloudOff,
    error: AlertCircle,
  };

  const colors = {
    synced: 'text-green-600',
    syncing: 'text-yellow-600',
    offline: 'text-gray-600',
    error: 'text-red-600',
  };

  const messages = {
    synced: 'All changes saved to Drive',
    syncing: `Saving... ${progress}%`,
    offline: 'Offline - changes saved locally',
    error: 'Sync failed',
  };

  const Icon = icons[status];

  return (
    <div
      className="flex items-center gap-2 text-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon
        className={cn(
          'w-4 h-4',
          colors[status],
          status === 'syncing' && 'animate-spin'
        )}
      />
      <span className={cn('font-medium', colors[status])}>
        {messages[status]}
      </span>

      {lastSyncTime && status === 'synced' && (
        <span className="text-gray-500 text-xs">
          · {formatRelativeTime(lastSyncTime)}
        </span>
      )}

      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="text-blue-600 hover:text-blue-700 text-xs underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
```

### Y.js Integration for Real-Time Status

```tsx
// hooks/useSyncStatus.ts
import { useEffect, useState } from 'react';
import { useYjsProvider } from '@/contexts/YjsContext';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function useSyncStatus() {
  const provider = useYjsProvider();
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!provider) return;

    const handleStatus = ({ status: yjsStatus }: { status: string }) => {
      switch (yjsStatus) {
        case 'connected':
          setStatus('synced');
          setLastSyncTime(new Date());
          break;
        case 'disconnected':
          setStatus('offline');
          break;
        default:
          setStatus('syncing');
      }
    };

    const handleSync = ({ synced }: { synced: boolean }) => {
      if (synced) {
        setStatus('synced');
        setLastSyncTime(new Date());
        setProgress(100);
      } else {
        setStatus('syncing');
      }
    };

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);

    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
    };
  }, [provider]);

  return { status, lastSyncTime, progress };
}
```

### Sync Indicator in Header

```tsx
// components/toolbar/Header.tsx
import { SyncIndicator } from './SyncIndicator';
import { ShareButton } from './ShareButton';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function Header() {
  const { status, lastSyncTime, progress } = useSyncStatus();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b">
      {/* Left side: Menu + Title */}
      <div className="flex items-center gap-4">
        <MenuButton />
        <DocumentTitle />
      </div>

      {/* Center: Sync Status */}
      <div className="flex-1 flex justify-center">
        <SyncIndicator
          status={status}
          progress={progress}
          lastSyncTime={lastSyncTime}
        />
      </div>

      {/* Right side: Share Button */}
      <div className="flex items-center gap-2">
        <ShareButton />
      </div>
    </header>
  );
}
```

---

## 📜 Version History Component

### Version History Panel

```tsx
// components/version-history/VersionHistoryPanel.tsx
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, RotateCcw } from 'lucide-react';
import { useDriveVersions } from '@/hooks/useDriveVersions';
import { VersionListItem } from './VersionListItem';
import { VersionPreview } from './VersionPreview';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
}

export function VersionHistoryPanel({ isOpen, onClose, fileId }: VersionHistoryPanelProps) {
  const { versions, loading, restoreVersion } = useDriveVersions(fileId);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const handleRestore = async () => {
    if (!selectedVersion) return;

    const confirmed = window.confirm(
      'Are you sure you want to restore this version? Your current version will be saved in history.'
    );

    if (confirmed) {
      await restoreVersion(selectedVersion);
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        {selectedVersion && (
          <Button
            onClick={handleRestore}
            className="w-full mt-4"
            variant="primary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore this version
          </Button>
        )}

        <ScrollArea className="h-[calc(100vh-200px)] mt-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading versions...
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <VersionListItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersion === version.id}
                  onClick={() => setSelectedVersion(version.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
```

### Version List Item

```tsx
// components/version-history/VersionListItem.tsx
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface Version {
  id: string;
  modifiedTime: string;
  lastModifyingUser: {
    displayName: string;
    photoLink?: string;
  };
  size: number;
}

interface VersionListItemProps {
  version: Version;
  isSelected: boolean;
  onClick: () => void;
}

export function VersionListItem({ version, isSelected, onClick }: VersionListItemProps) {
  const timestamp = new Date(version.modifiedTime);
  const relativeTime = formatRelativeTime(timestamp);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg text-left transition-colors',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
        isSelected && 'bg-blue-50 border border-blue-200'
      )}
      aria-label={`Version from ${relativeTime} by ${version.lastModifyingUser.displayName}`}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {version.lastModifyingUser.photoLink ? (
            <img
              src={version.lastModifyingUser.photoLink}
              alt={version.lastModifyingUser.displayName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {version.lastModifyingUser.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Version Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {relativeTime}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {version.lastModifyingUser.displayName}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatFileSize(version.size)}
          </div>
        </div>

        {/* Document Icon */}
        <FileText className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

  if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (isYesterday) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### Google Drive Version History Hook

```tsx
// hooks/useDriveVersions.ts
import { useState, useEffect } from 'react';
import { useDriveApi } from '@/contexts/DriveContext';

interface Version {
  id: string;
  modifiedTime: string;
  lastModifyingUser: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  size: number;
}

export function useDriveVersions(fileId: string) {
  const driveApi = useDriveApi();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [fileId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await driveApi.files.listRevisions({
        fileId,
        fields: 'revisions(id,modifiedTime,lastModifyingUser,size)',
        pageSize: 100,
      });

      setVersions(response.result.revisions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (revisionId: string) => {
    try {
      // Download the specific revision
      const response = await driveApi.files.getRevision({
        fileId,
        revisionId,
        alt: 'media',
      });

      // Update the current file with the revision content
      await driveApi.files.update({
        fileId,
        media: {
          mimeType: 'text/markdown',
          body: response.body,
        },
      });

      // Reload versions to reflect the change
      await loadVersions();
    } catch (error) {
      console.error('Failed to restore version:', error);
      throw error;
    }
  };

  return { versions, loading, restoreVersion, reload: loadVersions };
}
```

### Keyboard Shortcut for Version History

```tsx
// hooks/useVersionHistoryShortcut.ts
import { useEffect } from 'react';

export function useVersionHistoryShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + Option/Alt + Shift + H
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (modifierKey && event.altKey && event.shiftKey && event.key === 'h') {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
```

### File Menu Integration

```tsx
// components/menu/FileMenu.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { VersionHistoryPanel } from '../version-history/VersionHistoryPanel';

export function FileMenu({ fileId }: { fileId: string }) {
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">File</Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem>New Document</DropdownMenuItem>
          <DropdownMenuItem>Open from Drive</DropdownMenuItem>
          <DropdownMenuItem>Save to Drive</DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            Share...
            <span className="ml-auto text-xs text-gray-500">⌘⇧S</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setVersionHistoryOpen(true)}>
            <Clock className="w-4 h-4 mr-2" />
            Version History
            <span className="ml-auto text-xs text-gray-500">⌘⌥⇧H</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem>Download as Markdown</DropdownMenuItem>
          <DropdownMenuItem>Export as PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <VersionHistoryPanel
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        fileId={fileId}
      />
    </>
  );
}
```

---

## 🧪 Testing Examples

### Share Button Tests

```tsx
// __tests__/ShareButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from '@/components/toolbar/ShareButton';

describe('ShareButton', () => {
  it('renders share button with correct text', () => {
    render(<ShareButton />);
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('opens share modal on click', async () => {
    render(<ShareButton />);

    const button = screen.getByRole('button', { name: /share/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/share document/i)).toBeInTheDocument();
    });
  });

  it('is keyboard accessible', () => {
    render(<ShareButton />);

    const button = screen.getByRole('button', { name: /share/i });
    button.focus();

    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<ShareButton />);

    const button = screen.getByRole('button', { name: /share/i });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
```

### Sync Indicator Tests

```tsx
// __tests__/SyncIndicator.test.tsx
import { render, screen } from '@testing-library/react';
import { SyncIndicator } from '@/components/toolbar/SyncIndicator';

describe('SyncIndicator', () => {
  it('shows synced state correctly', () => {
    render(<SyncIndicator status="synced" />);
    expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
  });

  it('shows syncing state with progress', () => {
    render(<SyncIndicator status="syncing" progress={67} />);
    expect(screen.getByText(/saving... 67%/i)).toBeInTheDocument();
  });

  it('shows offline state', () => {
    render(<SyncIndicator status="offline" />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const onRetry = jest.fn();
    render(<SyncIndicator status="error" onRetry={onRetry} />);

    expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('announces status changes to screen readers', () => {
    const { rerender } = render(<SyncIndicator status="synced" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');

    rerender(<SyncIndicator status="syncing" progress={50} />);
    expect(screen.getByText(/saving.../i)).toBeInTheDocument();
  });
});
```

### Version History Tests

```tsx
// __tests__/VersionHistoryPanel.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionHistoryPanel } from '@/components/version-history/VersionHistoryPanel';

const mockVersions = [
  {
    id: '1',
    modifiedTime: new Date().toISOString(),
    lastModifyingUser: { displayName: 'John Doe', emailAddress: 'john@example.com' },
    size: 1024,
  },
  {
    id: '2',
    modifiedTime: new Date(Date.now() - 3600000).toISOString(),
    lastModifyingUser: { displayName: 'Jane Smith', emailAddress: 'jane@example.com' },
    size: 2048,
  },
];

jest.mock('@/hooks/useDriveVersions', () => ({
  useDriveVersions: () => ({
    versions: mockVersions,
    loading: false,
    restoreVersion: jest.fn(),
  }),
}));

describe('VersionHistoryPanel', () => {
  it('renders version list', async () => {
    render(
      <VersionHistoryPanel
        isOpen={true}
        onClose={jest.fn()}
        fileId="test-file-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });
  });

  it('shows restore button when version selected', async () => {
    render(
      <VersionHistoryPanel
        isOpen={true}
        onClose={jest.fn()}
        fileId="test-file-id"
      />
    );

    const versionItem = screen.getByText(/john doe/i).closest('button');
    fireEvent.click(versionItem!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /restore this version/i })).toBeInTheDocument();
    });
  });

  it('shows confirmation before restoring', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <VersionHistoryPanel
        isOpen={true}
        onClose={jest.fn()}
        fileId="test-file-id"
      />
    );

    const versionItem = screen.getByText(/john doe/i).closest('button');
    fireEvent.click(versionItem!);

    const restoreButton = await screen.findByRole('button', { name: /restore/i });
    fireEvent.click(restoreButton);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('restore this version')
    );
  });
});
```

---

## 🎨 Styling with Tailwind CSS

### Share Button Styles

```tsx
// Tailwind classes for share button
const shareButtonClasses = cn(
  // Base styles
  'inline-flex items-center justify-center gap-2',
  'px-4 py-2 rounded-md',
  'font-medium text-sm',
  'transition-colors duration-200',

  // Primary blue color
  'bg-blue-600 text-white',
  'hover:bg-blue-700',
  'active:bg-blue-800',

  // Focus ring
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

  // Disabled state
  'disabled:opacity-50 disabled:cursor-not-allowed',

  // Mobile responsive
  'sm:px-3 sm:py-1.5'
);
```

### Sync Indicator Styles

```tsx
// Sync status badge variants
const syncBadgeVariants = {
  synced: cn(
    'bg-green-50 border border-green-200',
    'text-green-700'
  ),
  syncing: cn(
    'bg-yellow-50 border border-yellow-200',
    'text-yellow-700'
  ),
  offline: cn(
    'bg-gray-50 border border-gray-200',
    'text-gray-700'
  ),
  error: cn(
    'bg-red-50 border border-red-200',
    'text-red-700'
  ),
};

// Apply to indicator
<div className={cn(
  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
  syncBadgeVariants[status]
)}>
  {/* Indicator content */}
</div>
```

---

**Implementation Examples Complete**
**Version:** 1.0
**Last Updated:** October 21, 2025
