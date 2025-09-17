# Technical Specifications: WYSIWYG Markdown Editor

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │  Cloud Storage   │    │  Collaboration  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ WYSIWYG     │ │◄──►│ │ Google Drive │ │◄──►│ │ Real-time   │ │
│ │ Editor      │ │    │ │ API          │ │    │ │ Sync        │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Mobile PWA  │ │    │ │ Authentication│ │    │ │ Conflict    │ │
│ │ Interface   │ │    │ │ (OAuth 2.0)  │ │    │ │ Resolution  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Architecture
```typescript
// Core application structure
src/
├── components/
│   ├── editor/
│   │   ├── WYSIWYGEditor.tsx          # Main editor component
│   │   ├── Toolbar.tsx                # Floating formatting toolbar
│   │   ├── SlashCommands.tsx          # Quick formatting via /
│   │   └── EmojiPicker.tsx            # Emoji selection
│   ├── ui/
│   │   ├── Header.tsx                 # App header with document title
│   │   ├── StatusBar.tsx              # Save status, word count
│   │   ├── ShareButton.tsx            # Google Drive sharing
│   │   └── UserProfile.tsx            # User authentication state
│   └── mobile/
│       ├── MobileToolbar.tsx          # Touch-optimized toolbar
│       └── GestureHandler.tsx         # Touch gestures
├── services/
│   ├── GoogleDriveService.ts          # Cloud storage operations
│   ├── AuthService.ts                 # OAuth 2.0 authentication
│   ├── DocumentService.ts             # Document CRUD operations
│   └── SyncService.ts                 # Real-time synchronization
├── hooks/
│   ├── useGoogleDrive.ts              # Drive integration hook
│   ├── useAutoSave.ts                 # Auto-save functionality
│   ├── useMobileDetection.ts          # Mobile/desktop detection
│   └── useCollaboration.ts            # Real-time collaboration
└── utils/
    ├── markdownProcessor.ts           # Markdown conversion utilities
    ├── mobileOptimization.ts          # Mobile-specific optimizations
    └── performanceMonitoring.ts       # Performance tracking
```

---

## 📝 Editor Implementation

### Milkdown Configuration
```typescript
// WYSIWYGEditor.tsx core implementation
import { Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { tooltip } from '@milkdown/plugin-tooltip';
import { slash } from '@milkdown/plugin-slash';
import { emoji } from '@milkdown/plugin-emoji';

export const WYSIWYGEditor: React.FC<EditorProps> = ({
  initialContent,
  onChange,
  onSave
}) => {
  const editor = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        // Hide all markdown syntax from view
        ctx.set(rootCtx, root);

        // Consumer-friendly configuration
        ctx.set(tooltipConfig.key, {
          showOnSelection: true,
          hideOnBlur: true,
          mobileOptimized: true
        });

        // Slash commands for quick formatting
        ctx.set(slashConfig.key, {
          items: [
            { title: 'Heading 1', command: 'heading1' },
            { title: 'Heading 2', command: 'heading2' },
            { title: 'Bold Text', command: 'bold' },
            { title: 'Bullet List', command: 'bulletList' },
            { title: 'Numbered List', command: 'orderedList' },
            { title: 'Quote', command: 'blockquote' }
          ]
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(tooltip)
      .use(slash)
      .use(emoji)
  );

  // Auto-save implementation
  useAutoSave({
    content: editor.markdown,
    interval: 3000, // 3 seconds
    onSave: handleCloudSave
  });

  return (
    <div className="editor-container">
      <div ref={editor.root} className="wysiwyg-editor" />
      <StatusBar />
    </div>
  );
};
```

### Toolbar Implementation
```typescript
// Toolbar.tsx - Consumer-friendly formatting
export const Toolbar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 50
        });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const toolbarItems = [
    { icon: Bold, label: 'Bold', action: 'bold', shortcut: '⌘B' },
    { icon: Italic, label: 'Italic', action: 'italic', shortcut: '⌘I' },
    { icon: List, label: 'Bullet List', action: 'bulletList' },
    { icon: ListOrdered, label: 'Numbered List', action: 'orderedList' },
    { icon: Quote, label: 'Quote', action: 'blockquote' },
    { icon: Link, label: 'Link', action: 'link' }
  ];

  return (
    <div
      className={cn(
        "toolbar-floating",
        isVisible ? "visible" : "hidden"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)'
      }}
    >
      {toolbarItems.map((item) => (
        <ToolbarButton
          key={item.action}
          icon={item.icon}
          label={item.label}
          onClick={() => executeCommand(item.action)}
          className="toolbar-button-mobile-friendly"
        />
      ))}
    </div>
  );
};
```

---

## ☁️ Cloud Integration

### Google Drive Service
```typescript
// GoogleDriveService.ts
export class GoogleDriveService {
  private gapi: any;
  private authInstance: any;

  async initialize() {
    await new Promise((resolve) => {
      gapi.load('auth2:client', resolve);
    });

    await gapi.client.init({
      apiKey: process.env.VITE_GOOGLE_API_KEY,
      clientId: process.env.VITE_GOOGLE_CLIENT_ID,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scope: 'https://www.googleapis.com/auth/drive.file'
    });

    this.authInstance = gapi.auth2.getAuthInstance();
  }

  async authenticate(): Promise<boolean> {
    if (this.authInstance.isSignedIn.get()) {
      return true;
    }

    try {
      await this.authInstance.signIn();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async createDocument(title: string, content: string): Promise<string> {
    const metadata = {
      name: `${title}.md`,
      parents: ['appDataFolder'], // Keeps files organized
    };

    const media = {
      mimeType: 'text/markdown',
      body: content
    };

    const response = await gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files',
      method: 'POST',
      params: {
        uploadType: 'multipart'
      },
      headers: {
        'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
      },
      body: this.buildMultipartBody(metadata, media)
    });

    return response.result.id;
  }

  async updateDocument(fileId: string, content: string): Promise<void> {
    await gapi.client.request({
      path: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: {
        uploadType: 'media'
      },
      headers: {
        'Content-Type': 'text/markdown'
      },
      body: content
    });
  }

  async listRecentDocuments(limit: number = 10): Promise<DriveFile[]> {
    const response = await gapi.client.drive.files.list({
      q: "mimeType='text/markdown'",
      orderBy: 'modifiedTime desc',
      pageSize: limit,
      fields: 'files(id, name, modifiedTime, thumbnailLink)'
    });

    return response.result.files;
  }

  // Real-time collaboration support
  async watchDocument(fileId: string, callback: (changes: any) => void): Promise<void> {
    // Implement Google Drive Changes API for real-time updates
    const channelId = `${fileId}-${Date.now()}`;

    await gapi.client.drive.changes.watch({
      pageToken: await this.getStartPageToken(),
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${window.location.origin}/api/drive-webhook`
      }
    });
  }
}
```

### Auto-Save Implementation
```typescript
// useAutoSave.ts
export const useAutoSave = ({
  content,
  interval = 3000,
  onSave
}: AutoSaveOptions) => {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debouncedSave = useCallback(
    debounce(async (contentToSave: string) => {
      if (!contentToSave.trim()) return;

      setSaveStatus('saving');

      try {
        await onSave(contentToSave);
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        setSaveStatus('error');
        // Implement retry logic
        setTimeout(() => {
          debouncedSave(contentToSave);
        }, 5000);
      }
    }, interval),
    [onSave, interval]
  );

  useEffect(() => {
    if (content) {
      debouncedSave(content);
    }
  }, [content, debouncedSave]);

  // Offline support
  useEffect(() => {
    const handleOnline = () => {
      // Sync any pending changes when coming back online
      const pendingChanges = localStorage.getItem('pending-changes');
      if (pendingChanges) {
        debouncedSave(pendingChanges);
        localStorage.removeItem('pending-changes');
      }
    };

    const handleOffline = () => {
      // Store changes locally when offline
      localStorage.setItem('pending-changes', content);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [content, debouncedSave]);

  return { saveStatus, lastSaved };
};
```

---

## 📱 Mobile Optimization

### Responsive Design System
```css
/* Mobile-first responsive design */
.editor-container {
  /* Base mobile styles */
  padding: 16px 12px;
  min-height: 100vh;

  /* Touch-friendly interactive elements */
  .toolbar-button {
    min-width: 44px;
    min-height: 44px;
    padding: 12px;
    border-radius: 8px;

    /* Proper touch feedback */
    transition: all 0.2s ease;
    &:active {
      transform: scale(0.95);
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  /* Responsive breakpoints */
  @media (min-width: 640px) {
    padding: 24px 20px;
  }

  @media (min-width: 768px) {
    padding: 32px 48px;
    max-width: 700px;
    margin: 0 auto;
  }

  @media (min-width: 1024px) {
    padding: 40px 64px;
  }
}

/* Mobile-specific editor styles */
.wysiwyg-editor {
  font-size: 16px; /* Prevents zoom on iOS */
  line-height: 1.6;

  /* Mobile typography optimization */
  @media (max-width: 640px) {
    h1 { font-size: 1.875rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }

    /* Larger touch targets for links */
    a {
      padding: 4px 2px;
      margin: -4px -2px;
    }
  }
}

/* Virtual keyboard handling */
.editor-with-keyboard {
  /* Adjust layout when virtual keyboard is visible */
  @supports (-webkit-touch-callout: none) {
    /* iOS specific adjustments */
    .toolbar-floating {
      position: fixed;
      z-index: 1000;
    }
  }
}
```

### Touch Gesture Implementation
```typescript
// GestureHandler.tsx
export const GestureHandler: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsScrolling(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    // Detect if user is scrolling vs gesturing
    if (deltaY > deltaX && deltaY > 10) {
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart || isScrolling) {
      setTouchStart(null);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Swipe gestures for quick actions
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
      if (deltaX > 0) {
        // Swipe right - undo
        document.execCommand('undo');
      } else {
        // Swipe left - redo
        document.execCommand('redo');
      }
    }

    // Double-tap to select paragraph
    const now = Date.now();
    if (now - (this.lastTap || 0) < 300) {
      selectParagraph(e.target);
    }
    this.lastTap = now;

    setTouchStart(null);
  };

  useEffect(() => {
    const element = document.querySelector('.wysiwyg-editor');
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, isScrolling]);

  return <>{children}</>;
};
```

### PWA Configuration
```json
// public/manifest.json
{
  "name": "RiteMark - WYSIWYG Markdown Editor",
  "short_name": "RiteMark",
  "description": "Google Docs for markdown - without the markdown",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["productivity", "writing", "collaboration"],
  "shortcuts": [
    {
      "name": "New Document",
      "short_name": "New Doc",
      "description": "Create a new document",
      "url": "/new",
      "icons": [
        {
          "src": "/icons/new-document.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

---

## ⚡ Performance Optimization

### Bundle Size Management
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    // Code splitting for better performance
    splitVendorChunkPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunks for large dependencies
          'editor': ['@milkdown/core', '@milkdown/preset-commonmark'],
          'google': ['googleapis', 'google-auth-library'],
          'ui': ['lucide-react', '@radix-ui/react-slot']
        }
      }
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable tree shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  },
  // Performance monitoring
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});
```

### Lazy Loading Implementation
```typescript
// Lazy load components for better initial load time
const WYSIWYGEditor = lazy(() => import('./components/editor/WYSIWYGEditor'));
const GoogleDriveService = lazy(() => import('./services/GoogleDriveService'));

// Performance monitoring
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Core Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }, []);

  // Custom performance metrics
  const markPerformance = (name: string) => {
    performance.mark(name);
  };

  const measurePerformance = (name: string, start: string, end?: string) => {
    performance.measure(name, start, end);
  };

  return { markPerformance, measurePerformance };
};
```

### Service Worker for Offline Support
```typescript
// public/sw.js - Service Worker for offline functionality
const CACHE_NAME = 'ritemark-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingChanges());
  }
});

const syncPendingChanges = async () => {
  const pendingChanges = await getStoredChanges();

  for (const change of pendingChanges) {
    try {
      await syncToGoogleDrive(change);
      await removeStoredChange(change.id);
    } catch (error) {
      console.error('Sync failed:', error);
      // Will retry on next sync event
    }
  }
};
```

---

## 🧪 Testing Strategy

### Component Testing
```typescript
// __tests__/WYSIWYGEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WYSIWYGEditor } from '../components/editor/WYSIWYGEditor';

describe('WYSIWYGEditor', () => {
  test('hides markdown syntax from user', async () => {
    render(<WYSIWYGEditor initialContent="# Hello World" />);

    // User should see formatted heading, not markdown syntax
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
    expect(screen.queryByText('# Hello World')).not.toBeInTheDocument();
  });

  test('toolbar appears on text selection', async () => {
    render(<WYSIWYGEditor initialContent="Select this text" />);

    // Select text
    const textElement = screen.getByText('Select this text');
    fireEvent.mouseUp(textElement);

    // Toolbar should be visible
    await screen.findByRole('toolbar');
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
  });

  test('mobile toolbar is touch-friendly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(<WYSIWYGEditor />);

    const boldButton = screen.getByLabelText('Bold');
    const styles = getComputedStyle(boldButton);

    // Check minimum touch target size (44px)
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
  });
});
```

### Integration Testing
```typescript
// __tests__/GoogleDriveIntegration.test.tsx
import { GoogleDriveService } from '../services/GoogleDriveService';

// Mock Google API
const mockGapi = {
  load: jest.fn(),
  client: {
    init: jest.fn(),
    drive: {
      files: {
        create: jest.fn(),
        update: jest.fn(),
        list: jest.fn()
      }
    }
  },
  auth2: {
    getAuthInstance: jest.fn()
  }
};

global.gapi = mockGapi;

describe('Google Drive Integration', () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    service = new GoogleDriveService();
    jest.clearAllMocks();
  });

  test('creates document with markdown content', async () => {
    mockGapi.client.drive.files.create.mockResolvedValue({
      result: { id: 'test-file-id' }
    });

    const fileId = await service.createDocument('Test Doc', '# Hello World');

    expect(fileId).toBe('test-file-id');
    expect(mockGapi.client.drive.files.create).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          name: 'Test Doc.md'
        }),
        media: expect.objectContaining({
          mimeType: 'text/markdown',
          body: '# Hello World'
        })
      })
    );
  });

  test('handles offline mode gracefully', async () => {
    // Simulate offline
    mockGapi.client.drive.files.update.mockRejectedValue(new Error('Network error'));

    const result = await service.updateDocument('test-id', 'content');

    // Should store changes locally for later sync
    expect(localStorage.getItem('pending-changes')).toBeTruthy();
  });
});
```

### Performance Testing
```typescript
// __tests__/Performance.test.tsx
import { performance } from 'perf_hooks';

describe('Performance Metrics', () => {
  test('editor loads within performance budget', async () => {
    const startTime = performance.now();

    // Lazy load editor component
    const { WYSIWYGEditor } = await import('../components/editor/WYSIWYGEditor');

    const loadTime = performance.now() - startTime;

    // Should load within 100ms
    expect(loadTime).toBeLessThan(100);
  });

  test('bundle size stays within limits', () => {
    // This would be integrated with build process
    const bundleSize = getBundleSize(); // Mock function

    // Main bundle should be under 500KB
    expect(bundleSize.main).toBeLessThan(500 * 1024);

    // Total should be under 1MB
    expect(bundleSize.total).toBeLessThan(1024 * 1024);
  });

  test('mobile performance meets Core Web Vitals', async () => {
    // Mock mobile environment
    mockMobileDevice();

    const metrics = await measureCoreWebVitals();

    // Core Web Vitals thresholds
    expect(metrics.LCP).toBeLessThan(2500); // Largest Contentful Paint
    expect(metrics.FID).toBeLessThan(100);  // First Input Delay
    expect(metrics.CLS).toBeLessThan(0.1);  // Cumulative Layout Shift
  });
});
```

This technical specification provides a comprehensive foundation for implementing the WYSIWYG markdown editor with a focus on mobile-first design, cloud integration, and consumer-friendly user experience.