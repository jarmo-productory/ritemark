# Component Design: React + Milkdown WYSIWYG Editor

## Component Hierarchy Overview

This document details the React component architecture for the Milkdown-based WYSIWYG editor, emphasizing clean separation of concerns and optimal user experience for non-technical users.

## Application Component Tree

```
App
├── AuthProvider
│   ├── GoogleOAuthHandler
│   └── SessionManager
├── ErrorBoundary
├── AppLayout
│   ├── Header
│   │   ├── DocumentTitle
│   │   ├── ShareButton
│   │   └── UserMenu
│   ├── EditorContainer
│   │   ├── Toolbar
│   │   │   ├── FormattingGroup
│   │   │   ├── InsertGroup
│   │   │   └── ActionGroup
│   │   ├── Editor (Milkdown Wrapper)
│   │   │   ├── CollaborationLayer
│   │   │   ├── AIAssistantLayer
│   │   │   └── EditorContent
│   │   └── StatusBar
│   │       ├── SaveStatus
│   │       ├── CollaboratorList
│   │       └── WordCount
│   └── Sidebar (Optional)
│       ├── DocumentOutline
│       └── AIPanel
├── Modals
│   ├── ShareDialog
│   ├── SettingsDialog
│   └── AIAssistantDialog
└── OfflineIndicator
```

## Core Component Specifications

### App Component
```typescript
// src/components/App.tsx
interface AppProps {
  initialDocumentId?: string;
  userId?: string;
}

export function App({ initialDocumentId, userId }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(null);

  useEffect(() => {
    // Initialize Google OAuth
    initializeAuth().then(setIsAuthenticated);
  }, []);

  useEffect(() => {
    // Load initial document if provided
    if (initialDocumentId && isAuthenticated) {
      loadDocument(initialDocumentId).then(setCurrentDocument);
    }
  }, [initialDocumentId, isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthenticationScreen onAuthenticated={setIsAuthenticated} />;
  }

  return (
    <ErrorBoundary fallback={<ErrorScreen />}>
      <AuthProvider userId={userId}>
        <AppLayout>
          {currentDocument ? (
            <EditorContainer document={currentDocument} />
          ) : (
            <DocumentSelector onSelect={setCurrentDocument} />
          )}
        </AppLayout>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### EditorContainer Component
```typescript
// src/components/editor/EditorContainer.tsx
interface EditorContainerProps {
  document: DocumentData;
  readOnly?: boolean;
  showToolbar?: boolean;
  showStatusBar?: boolean;
}

export function EditorContainer({
  document,
  readOnly = false,
  showToolbar = true,
  showStatusBar = true
}: EditorContainerProps) {
  const [editor, setEditor] = useState<MilkdownEditor | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Initialize Milkdown editor
  const { editorRef, loading, error } = useEditor({
    documentId: document.id,
    initialContent: document.content,
    readOnly,
    onCollaboratorsChange: setCollaborators,
    onSaveStatusChange: setSaveStatus,
    plugins: [
      'essential-formatting',
      'collaboration',
      'auto-save',
      'ai-assistance' // Future feature
    ]
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Ctrl+S': () => saveDocument(),
    'Ctrl+/': () => showCommandPalette(),
    'Ctrl+Shift+Space': () => triggerAICompletion() // Future
  });

  if (loading) return <EditorSkeleton />;
  if (error) return <EditorError error={error} />;

  return (
    <div className="editor-container">
      {showToolbar && (
        <Toolbar
          editor={editorRef.current}
          simplified={!document.isAdvancedUser}
          onAction={handleToolbarAction}
        />
      )}

      <div className="editor-content-area">
        <Editor
          ref={editorRef}
          document={document}
          collaborators={collaborators}
        />

        <CollaborationLayer
          collaborators={collaborators}
          onCursorChange={handleCursorChange}
        />

        {/* Future AI features */}
        <AIAssistantLayer
          editor={editorRef.current}
          enabled={document.aiEnabled}
        />
      </div>

      {showStatusBar && (
        <StatusBar
          saveStatus={saveStatus}
          collaborators={collaborators}
          wordCount={getWordCount()}
        />
      )}
    </div>
  );
}
```

### Toolbar Component (Simplified for Non-Technical Users)
```typescript
// src/components/editor/Toolbar.tsx
interface ToolbarAction {
  id: string;
  type: 'button' | 'dropdown' | 'separator';
  icon?: React.ComponentType;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  items?: ToolbarAction[]; // For dropdown
}

const ESSENTIAL_ACTIONS: ToolbarAction[] = [
  // Text formatting
  { id: 'bold', type: 'button', icon: BoldIcon, label: 'Bold', shortcut: 'Ctrl+B' },
  { id: 'italic', type: 'button', icon: ItalicIcon, label: 'Italic', shortcut: 'Ctrl+I' },
  { id: 'underline', type: 'button', icon: UnderlineIcon, label: 'Underline', shortcut: 'Ctrl+U' },

  { id: 'separator1', type: 'separator' },

  // Lists
  { id: 'bullet-list', type: 'button', icon: BulletListIcon, label: 'Bullet List' },
  { id: 'number-list', type: 'button', icon: NumberListIcon, label: 'Numbered List' },

  { id: 'separator2', type: 'separator' },

  // Headings (simplified)
  {
    id: 'headings',
    type: 'dropdown',
    icon: HeadingIcon,
    label: 'Headings',
    items: [
      { id: 'heading-1', type: 'button', label: 'Large Heading (H1)' },
      { id: 'heading-2', type: 'button', label: 'Medium Heading (H2)' },
      { id: 'heading-3', type: 'button', label: 'Small Heading (H3)' },
      { id: 'paragraph', type: 'button', label: 'Normal Text' }
    ]
  },

  { id: 'separator3', type: 'separator' },

  // Link (essential for documents)
  { id: 'link', type: 'button', icon: LinkIcon, label: 'Add Link' },
];

const ADVANCED_ACTIONS: ToolbarAction[] = [
  { id: 'separator4', type: 'separator' },

  // Advanced features (hidden by default)
  { id: 'table', type: 'button', icon: TableIcon, label: 'Insert Table' },
  { id: 'image', type: 'button', icon: ImageIcon, label: 'Insert Image' },
  { id: 'code', type: 'button', icon: CodeIcon, label: 'Code Block' },
];

export function Toolbar({ editor, simplified = true, onAction }: ToolbarProps) {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  // Update active states based on cursor position
  useEffect(() => {
    if (!editor) return;

    const updateActiveStates = () => {
      const states = {
        bold: editor.isActive('strong'),
        italic: editor.isActive('em'),
        underline: editor.isActive('underline'),
        'bullet-list': editor.isActive('bulletList'),
        'number-list': editor.isActive('orderedList'),
        'heading-1': editor.isActive('heading', { level: 1 }),
        'heading-2': editor.isActive('heading', { level: 2 }),
        'heading-3': editor.isActive('heading', { level: 3 }),
        link: editor.isActive('link')
      };

      setActiveStates(states);
    };

    editor.on('selectionUpdate', updateActiveStates);
    return () => editor.off('selectionUpdate', updateActiveStates);
  }, [editor]);

  const actions = simplified ? ESSENTIAL_ACTIONS : [...ESSENTIAL_ACTIONS, ...ADVANCED_ACTIONS];

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting toolbar">
      <div className="toolbar-content">
        {actions.map((action) => (
          <ToolbarItem
            key={action.id}
            action={action}
            active={activeStates[action.id]}
            onClick={(actionId) => handleAction(actionId, onAction)}
          />
        ))}

        {/* AI Assistant toggle (future feature) */}
        <div className="toolbar-section">
          <ToolbarButton
            id="ai-assistant"
            icon={SparkleIcon}
            label="AI Assistant"
            onClick={() => onAction('toggle-ai')}
            disabled={!editor}
          />
        </div>
      </div>
    </div>
  );
}

// Individual toolbar item component
function ToolbarItem({ action, active, onClick }: ToolbarItemProps) {
  if (action.type === 'separator') {
    return <div className="toolbar-separator" />;
  }

  if (action.type === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <ToolbarButton
            id={action.id}
            icon={action.icon}
            label={action.label}
            active={active}
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {action.items?.map((item) => (
            <DropdownMenu.Item
              key={item.id}
              onClick={() => onClick(item.id)}
            >
              {item.label}
              {item.shortcut && (
                <span className="shortcut">{item.shortcut}</span>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu>
    );
  }

  return (
    <ToolbarButton
      id={action.id}
      icon={action.icon}
      label={action.label}
      shortcut={action.shortcut}
      active={active}
      disabled={action.disabled}
      onClick={() => onClick(action.id)}
    />
  );
}
```

### Editor Component (Milkdown Wrapper)
```typescript
// src/components/editor/Editor.tsx
interface EditorProps {
  document: DocumentData;
  collaborators: CollaboratorInfo[];
  className?: string;
  placeholder?: string;
}

export const Editor = React.forwardRef<MilkdownEditor, EditorProps>(
  ({ document, collaborators, className, placeholder }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [milkdownEditor, setMilkdownEditor] = useState<MilkdownEditor | null>(null);

    // Initialize Milkdown
    useEffect(() => {
      if (!editorRef.current) return;

      const initializeEditor = async () => {
        const editor = await Editor
          .make()
          .config((ctx) => {
            // Configure for non-technical users
            ctx.set('theme', 'clean-minimal');
            ctx.set('placeholder', placeholder || 'Start writing...');

            // Hide advanced features
            ctx.set('codeBlockLanguages', []); // No code highlighting
            ctx.set('mathEnabled', false);     // No LaTeX math
            ctx.set('diagramEnabled', false);  // No Mermaid diagrams
          })
          .use(commonmark)
          .use(gfm)
          .use(history)
          .use(collab.configure(ctx => {
            ctx.set(collabServiceKey, createCollaborationService(document.id));
          }))
          .create();

        setMilkdownEditor(editor);

        // Expose editor instance via ref
        if (ref && typeof ref !== 'function') {
          ref.current = editor;
        } else if (typeof ref === 'function') {
          ref(editor);
        }
      };

      initializeEditor().catch(console.error);

      return () => {
        milkdownEditor?.destroy();
      };
    }, [document.id, placeholder, ref]);

    // Update document content when it changes
    useEffect(() => {
      if (milkdownEditor && document.content) {
        milkdownEditor.action(replaceAll(document.content));
      }
    }, [milkdownEditor, document.content]);

    return (
      <div className={cn('editor-wrapper', className)}>
        <div
          ref={editorRef}
          className="milkdown-editor"
          data-testid="editor-content"
        />

        {/* Collaboration cursors */}
        {collaborators.map((collaborator) => (
          <CollaboratorCursor
            key={collaborator.id}
            collaborator={collaborator}
            editorElement={editorRef.current}
          />
        ))}
      </div>
    );
  }
);

Editor.displayName = 'Editor';
```

### CollaborationLayer Component
```typescript
// src/components/editor/CollaborationLayer.tsx
interface CollaborationLayerProps {
  collaborators: CollaboratorInfo[];
  onCursorChange?: (cursor: CursorInfo) => void;
}

export function CollaborationLayer({ collaborators, onCursorChange }: CollaborationLayerProps) {
  return (
    <div className="collaboration-layer">
      {/* User cursors */}
      {collaborators.map((collaborator) => (
        <CollaboratorCursor
          key={collaborator.id}
          collaborator={collaborator}
          onPositionChange={onCursorChange}
        />
      ))}

      {/* Selection highlights */}
      {collaborators.map((collaborator) =>
        collaborator.selection && (
          <SelectionHighlight
            key={`selection-${collaborator.id}`}
            selection={collaborator.selection}
            color={collaborator.color}
            user={collaborator}
          />
        )
      )}
    </div>
  );
}

// Individual collaborator cursor
function CollaboratorCursor({ collaborator, onPositionChange }: CollaboratorCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);

  // Position cursor based on collaborator's position in document
  useEffect(() => {
    if (cursorRef.current && collaborator.cursor) {
      const { top, left } = calculateCursorPosition(collaborator.cursor);

      cursorRef.current.style.transform = `translate(${left}px, ${top}px)`;

      onPositionChange?.({
        userId: collaborator.id,
        position: { top, left },
        timestamp: Date.now()
      });
    }
  }, [collaborator.cursor, onPositionChange]);

  if (!collaborator.cursor) return null;

  return (
    <div
      ref={cursorRef}
      className="collaborator-cursor"
      style={{ borderColor: collaborator.color }}
    >
      <div
        className="cursor-flag"
        style={{ backgroundColor: collaborator.color }}
      >
        <img
          src={collaborator.avatar}
          alt={collaborator.name}
          className="cursor-avatar"
        />
        <span className="cursor-name">{collaborator.name}</span>
      </div>
    </div>
  );
}
```

### StatusBar Component
```typescript
// src/components/editor/StatusBar.tsx
interface StatusBarProps {
  saveStatus: SaveStatus;
  collaborators: CollaboratorInfo[];
  wordCount?: number;
  className?: string;
}

export function StatusBar({ saveStatus, collaborators, wordCount, className }: StatusBarProps) {
  return (
    <div className={cn('status-bar', className)}>
      <div className="status-left">
        <SaveStatus status={saveStatus} />
        {wordCount && <WordCount count={wordCount} />}
      </div>

      <div className="status-right">
        <CollaboratorList collaborators={collaborators} />
        <NetworkStatus />
      </div>
    </div>
  );
}

// Save status indicator
function SaveStatus({ status }: { status: SaveStatus }) {
  const getStatusInfo = (status: SaveStatus) => {
    switch (status) {
      case 'saved':
        return { icon: CheckCircleIcon, text: 'Saved', className: 'text-green-600' };
      case 'saving':
        return { icon: ClockIcon, text: 'Saving...', className: 'text-yellow-600' };
      case 'error':
        return { icon: ExclamationTriangleIcon, text: 'Save failed', className: 'text-red-600' };
      default:
        return { icon: ClockIcon, text: 'Unknown', className: 'text-gray-600' };
    }
  };

  const { icon: Icon, text, className } = getStatusInfo(status);

  return (
    <div className={cn('save-status', className)}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Word count display
function WordCount({ count }: { count: number }) {
  return (
    <div className="word-count">
      <span className="text-sm text-gray-600">
        {count.toLocaleString()} words
      </span>
    </div>
  );
}

// Collaborator avatars
function CollaboratorList({ collaborators }: { collaborators: CollaboratorInfo[] }) {
  const maxVisible = 3;
  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const extraCount = collaborators.length - maxVisible;

  if (collaborators.length === 0) return null;

  return (
    <div className="collaborator-list">
      <div className="collaborator-avatars">
        {visibleCollaborators.map((collaborator) => (
          <Tooltip key={collaborator.id} content={collaborator.name}>
            <img
              src={collaborator.avatar}
              alt={collaborator.name}
              className="collaborator-avatar"
              style={{ borderColor: collaborator.color }}
            />
          </Tooltip>
        ))}

        {extraCount > 0 && (
          <Tooltip content={`+${extraCount} more`}>
            <div className="collaborator-extra">
              +{extraCount}
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
```

### Mobile-Responsive Components

#### MobileToolbar Component
```typescript
// src/components/editor/MobileToolbar.tsx
export function MobileToolbar({ editor, onAction }: MobileToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMobile } = useBreakpoint();

  if (!isMobile) return null;

  // Essential mobile actions only
  const mobileActions = [
    { id: 'bold', icon: BoldIcon, label: 'Bold' },
    { id: 'italic', icon: ItalicIcon, label: 'Italic' },
    { id: 'bullet-list', icon: BulletListIcon, label: 'List' },
    { id: 'link', icon: LinkIcon, label: 'Link' }
  ];

  const secondaryActions = [
    { id: 'heading-1', icon: H1Icon, label: 'Large Heading' },
    { id: 'heading-2', icon: H2Icon, label: 'Medium Heading' },
    { id: 'number-list', icon: NumberListIcon, label: 'Numbered List' },
    { id: 'undo', icon: UndoIcon, label: 'Undo' },
    { id: 'redo', icon: RedoIcon, label: 'Redo' }
  ];

  return (
    <div className="mobile-toolbar">
      <div className="primary-actions">
        {mobileActions.map((action) => (
          <TouchToolbarButton
            key={action.id}
            action={action}
            onClick={() => onAction(action.id)}
          />
        ))}

        <TouchToolbarButton
          action={{ id: 'more', icon: MoreIcon, label: 'More' }}
          onClick={() => setIsExpanded(!isExpanded)}
          active={isExpanded}
        />
      </div>

      {isExpanded && (
        <div className="secondary-actions">
          {secondaryActions.map((action) => (
            <TouchToolbarButton
              key={action.id}
              action={action}
              onClick={() => {
                onAction(action.id);
                setIsExpanded(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Touch-optimized toolbar button
function TouchToolbarButton({ action, active, onClick }: TouchToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'touch-toolbar-button',
        active && 'active'
      )}
      onClick={onClick}
      aria-label={action.label}
    >
      <action.icon className="w-5 h-5" />
    </button>
  );
}
```

### Error Boundary Components

#### EditorErrorBoundary
```typescript
// src/components/error/EditorErrorBoundary.tsx
interface EditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class EditorErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  EditorErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Editor error:', error, errorInfo);

    // Report error to monitoring service
    reportError({
      type: 'editor-crash',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <EditorErrorFallback
          error={this.state.error}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// Error fallback UI
function EditorErrorFallback({ error, onReload }: EditorErrorFallbackProps) {
  return (
    <div className="editor-error-fallback">
      <div className="error-content">
        <ExclamationTriangleIcon className="error-icon" />
        <h2>Something went wrong with the editor</h2>
        <p>We're sorry, but the editor encountered an unexpected error.</p>

        <div className="error-actions">
          <Button onClick={onReload} variant="primary">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
          >
            Reload Page
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <pre>{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
```

## Component Testing Strategies

### Editor Component Tests
```typescript
// src/components/editor/__tests__/Editor.test.tsx
describe('Editor Component', () => {
  const mockDocument = {
    id: 'test-doc-123',
    title: 'Test Document',
    content: 'Initial content',
    permissions: ['read', 'write']
  };

  beforeEach(() => {
    // Setup test environment
    setupMockGoogleDrive();
    setupMockWebSocket();
  });

  test('renders editor with initial content', async () => {
    render(<Editor document={mockDocument} collaborators={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Initial content')).toBeInTheDocument();
    });
  });

  test('applies bold formatting when toolbar button clicked', async () => {
    render(
      <EditorContainer document={mockDocument}>
        <Toolbar simplified />
        <Editor document={mockDocument} collaborators={[]} />
      </EditorContainer>
    );

    // Select text
    const editor = screen.getByTestId('editor-content');
    await userEvent.selectText(editor, 'Initial');

    // Click bold button
    const boldButton = screen.getByLabelText('Bold');
    await userEvent.click(boldButton);

    // Verify bold formatting applied
    await waitFor(() => {
      expect(editor).toContainHTML('<strong>Initial</strong>');
    });
  });

  test('shows collaborator cursors', async () => {
    const mockCollaborators = [
      {
        id: 'user-123',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        color: '#ff0000',
        cursor: { line: 0, column: 5 }
      }
    ];

    render(<Editor document={mockDocument} collaborators={mockCollaborators} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### Mobile Component Tests
```typescript
// src/components/editor/__tests__/MobileToolbar.test.tsx
describe('MobileToolbar Component', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  });

  test('shows only essential actions on mobile', () => {
    render(<MobileToolbar editor={mockEditor} onAction={mockOnAction} />);

    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('List')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByLabelText('More')).toBeInTheDocument();

    // Advanced actions should be hidden initially
    expect(screen.queryByLabelText('Large Heading')).not.toBeInTheDocument();
  });

  test('expands to show secondary actions when more button clicked', async () => {
    render(<MobileToolbar editor={mockEditor} onAction={mockOnAction} />);

    const moreButton = screen.getByLabelText('More');
    await userEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Large Heading')).toBeInTheDocument();
      expect(screen.getByLabelText('Medium Heading')).toBeInTheDocument();
      expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization Components

### LazyEditor Component
```typescript
// src/components/editor/LazyEditor.tsx
const EditorComponent = React.lazy(() => import('./Editor'));

export function LazyEditor(props: EditorProps) {
  return (
    <React.Suspense fallback={<EditorSkeleton />}>
      <EditorComponent {...props} />
    </React.Suspense>
  );
}

// Skeleton component for loading state
function EditorSkeleton() {
  return (
    <div className="editor-skeleton">
      <div className="skeleton-toolbar">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-button" />
        ))}
      </div>
      <div className="skeleton-editor">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="skeleton-line" />
        ))}
      </div>
    </div>
  );
}
```

### VirtualizedCollaboratorList
```typescript
// src/components/editor/VirtualizedCollaboratorList.tsx
// For handling large numbers of collaborators efficiently
export function VirtualizedCollaboratorList({ collaborators }: { collaborators: CollaboratorInfo[] }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const listRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for many collaborators
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;

      const { scrollTop, clientHeight } = listRef.current;
      const itemHeight = 40; // Height per collaborator item

      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(start + Math.ceil(clientHeight / itemHeight) + 2, collaborators.length);

      setVisibleRange({ start, end });
    };

    listRef.current?.addEventListener('scroll', handleScroll);
    return () => listRef.current?.removeEventListener('scroll', handleScroll);
  }, [collaborators.length]);

  const visibleCollaborators = collaborators.slice(visibleRange.start, visibleRange.end);

  return (
    <div ref={listRef} className="collaborator-list-container">
      <div style={{ height: collaborators.length * 40 }}>
        <div style={{ transform: `translateY(${visibleRange.start * 40}px)` }}>
          {visibleCollaborators.map((collaborator) => (
            <CollaboratorItem key={collaborator.id} collaborator={collaborator} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Conclusion

This component design provides a comprehensive, maintainable architecture for the Milkdown-based WYSIWYG editor. Key design principles:

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Composition**: Small, reusable components that compose into larger features
3. **Accessibility**: Built-in ARIA support and keyboard navigation
4. **Mobile-First**: Responsive design with touch-optimized interactions
5. **Performance**: Lazy loading, virtualization, and optimized re-renders
6. **Error Handling**: Comprehensive error boundaries and fallback UI
7. **Testing**: Components designed for easy unit and integration testing

The architecture supports:
- **Non-technical users**: Simplified UI with progressive disclosure
- **Collaboration**: Real-time editing with visual feedback
- **Mobile experience**: Touch-optimized mobile toolbar and interactions
- **Future AI features**: Extensible design for AI integration
- **Performance**: Optimized for fast loading and smooth interactions

This component structure provides a solid foundation that can evolve with user needs while maintaining code quality and performance.