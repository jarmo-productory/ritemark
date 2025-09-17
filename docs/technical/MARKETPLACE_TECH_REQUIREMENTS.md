# Google Workspace Marketplace Technical Requirements & Architecture Changes

*Analysis by Marketplace Integration Architect - September 11, 2025*

## Executive Summary

This document outlines the specific technical changes required to transform our current Netlify-based standalone markdown editor into a Google Workspace Marketplace app. The transition requires significant architectural shifts from a standard web app to a deeply integrated Workspace application with specific file handling, OAuth, and deployment requirements.

**Key Changes Required:**
- Replace standalone OAuth with Marketplace-specific authentication flow
- Implement Google Drive file handler integration for .md files
- Add App Script manifest for Marketplace distribution  
- Restructure hosting strategy for Marketplace compliance
- Expand OAuth scopes for deeper Workspace integration
- Implement Marketplace-specific UI patterns

---

## 1. Fundamental Architecture Differences: Standalone vs Marketplace App

### Current State: Standalone Web Application
```javascript
// Current approach - standard OAuth flow
const GOOGLE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.file',
  redirectUri: window.location.origin,
  responseType: 'code',
  accessType: 'offline'
};
```

### Required Change: Marketplace-Integrated Application

```javascript
// Marketplace approach - embedded authentication
const MARKETPLACE_CONFIG = {
  // Different client registration through Google Cloud Console
  clientId: process.env.REACT_APP_MARKETPLACE_CLIENT_ID,
  
  // Marketplace-specific scopes
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/script.container.ui',
    'https://www.googleapis.com/auth/drive.install'  // Marketplace-specific
  ],
  
  // Different authentication flow
  authType: 'marketplace',
  installationType: 'domain' // or 'individual'
};
```

### Key Architectural Differences

| Aspect | Standalone App | Marketplace App |
|--------|----------------|-----------------|
| **Authentication** | Standard OAuth 2.0 | Marketplace OAuth with admin consent |
| **File Access** | User-selected files only | Right-click integration for .md files |
| **Installation** | Direct URL access | Admin installs for domain/users |
| **UI Context** | Independent web app | Embedded in Google Workspace UI |
| **Distribution** | Direct hosting (Netlify) | Google Workspace Marketplace store |
| **Permissions** | User grants individual access | Admin grants domain-wide access |

---

## 2. Google Drive File Handler Integration Requirements

### File Handler Manifest Configuration

**New File Required:** `manifest.json` for Apps Script integration
```json
{
  "name": "Advanced Markdown Editor",
  "version": "1.0.0",
  "description": "Professional markdown editor with Google Drive integration",
  "oauthScopes": [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/drive.install"
  ],
  "executionApi": {
    "access": "ANYONE"
  },
  "webapp": {
    "access": "ANYONE_ANONYMOUS",
    "executeAs": "USER_DEPLOYING"
  },
  "urlFetchWhitelist": [
    "https://your-marketplace-app-domain.com"
  ],
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Drive",
        "serviceId": "drive",
        "version": "v3"
      }
    ]
  }
}
```

### File Handler Implementation

**New Component:** `GoogleDriveFileHandler.tsx`
```typescript
interface FileHandlerConfig {
  mimeTypes: string[];
  fileExtensions: string[];
  handlerName: string;
  actionLabel: string;
}

class GoogleDriveFileHandler {
  private readonly config: FileHandlerConfig = {
    mimeTypes: [
      'text/markdown',
      'text/x-markdown',
      'application/octet-stream' // For .md files without proper MIME type
    ],
    fileExtensions: ['.md', '.markdown', '.mdown'],
    handlerName: 'Advanced Markdown Editor',
    actionLabel: 'Open with Advanced Markdown Editor'
  };

  // Register as file handler during app initialization
  async registerFileHandler(): Promise<void> {
    if (!gapi.client.drive) {
      throw new Error('Google Drive API not initialized');
    }

    // This runs when app is installed to domain
    const fileHandlerRegistration = {
      kind: 'drive#app',
      name: this.config.handlerName,
      objectType: 'file',
      primaryMimeType: 'text/markdown',
      secondaryMimeTypes: this.config.mimeTypes,
      primaryFileExtension: '.md',
      secondaryFileExtensions: this.config.fileExtensions.slice(1),
      openUrlTemplate: `${window.location.origin}/edit?fileId={ids}&userId={userId}`,
      createUrl: `${window.location.origin}/create?userId={userId}`,
      supportsCreate: true,
      supportsImport: true,
      supportsMultiOpen: false,
      supportsOfflineCreate: false,
      hasDriveWideScope: false,
      useByDefault: false
    };

    // Register with Drive API
    await gapi.client.drive.apps.insert({
      resource: fileHandlerRegistration
    });
  }

  // Handle file opening from right-click context menu
  async handleFileOpen(fileId: string, userId: string): Promise<void> {
    try {
      // Verify user has access to file
      const fileMetadata = await gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,permissions'
      });

      // Validate file type
      if (!this.isMarkdownFile(fileMetadata.result)) {
        throw new Error('File is not a supported markdown format');
      }

      // Load file content
      const fileContent = await this.loadFileContent(fileId);
      
      // Initialize editor with content
      this.initializeEditor(fileContent, fileMetadata.result);
      
    } catch (error) {
      console.error('Failed to open file:', error);
      this.showError('Unable to open file. Please check permissions and file format.');
    }
  }

  private isMarkdownFile(fileMetadata: any): boolean {
    const { mimeType, name } = fileMetadata;
    
    return this.config.mimeTypes.includes(mimeType) || 
           this.config.fileExtensions.some(ext => name.toLowerCase().endsWith(ext));
  }

  private async loadFileContent(fileId: string): Promise<string> {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    
    return response.body;
  }
}
```

### URL Parameter Handling for File Opening

**Modified:** `src/App.tsx` to handle Marketplace URL parameters
```typescript
// New URL parameter parsing for Marketplace integration
interface MarketplaceUrlParams {
  fileId?: string;
  userId?: string;
  action?: 'open' | 'create';
  folderId?: string;
}

function useMarketplaceParams(): MarketplaceUrlParams {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      fileId: params.get('fileId') || undefined,
      userId: params.get('userId') || undefined,
      action: (params.get('action') as 'open' | 'create') || 'open',
      folderId: params.get('folderId') || undefined
    };
  }, [window.location.search]);
}

// Modified App component to handle Marketplace launching
function App() {
  const marketplaceParams = useMarketplaceParams();
  const [isMarketplaceMode, setIsMarketplaceMode] = useState(false);
  
  useEffect(() => {
    // Detect if launched from Marketplace
    if (marketplaceParams.fileId || marketplaceParams.userId) {
      setIsMarketplaceMode(true);
      
      if (marketplaceParams.action === 'open' && marketplaceParams.fileId) {
        // Open specific file
        handleMarketplaceFileOpen(marketplaceParams.fileId, marketplaceParams.userId);
      } else if (marketplaceParams.action === 'create') {
        // Create new file in specified folder
        handleMarketplaceFileCreate(marketplaceParams.folderId, marketplaceParams.userId);
      }
    }
  }, [marketplaceParams]);

  // ... rest of App component
}
```

---

## 3. OAuth Scopes & Permissions Changes

### Current OAuth Implementation
```javascript
// Current minimal scopes
const CURRENT_SCOPES = [
  'https://www.googleapis.com/auth/drive.file' // Only user-selected files
];
```

### Required Marketplace OAuth Scopes
```javascript
// Expanded scopes for Marketplace integration
const MARKETPLACE_SCOPES = [
  // Core Drive access - same as current
  'https://www.googleapis.com/auth/drive.file',
  
  // NEW: Required for Marketplace app embedding
  'https://www.googleapis.com/auth/script.container.ui',
  
  // NEW: Required for file handler registration
  'https://www.googleapis.com/auth/drive.install',
  
  // OPTIONAL: For enhanced Drive integration (use cautiously)
  'https://www.googleapis.com/auth/drive.readonly', // If needed for file browsing
  
  // OPTIONAL: For Google Docs integration
  'https://www.googleapis.com/auth/documents.currentonly'
];
```

### Enhanced OAuth Implementation for Marketplace

**New File:** `src/services/MarketplaceAuthService.ts`
```typescript
export interface MarketplaceAuthConfig {
  clientId: string;
  scopes: string[];
  discoveryDocs: string[];
  installationType: 'domain' | 'individual';
}

export class MarketplaceAuthService {
  private readonly config: MarketplaceAuthConfig;
  private authInstance: gapi.auth2.GoogleAuth | null = null;
  
  constructor(config: MarketplaceAuthConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Load Google API
    await new Promise((resolve, reject) => {
      gapi.load('auth2:client:drive', {
        callback: resolve,
        onerror: reject
      });
    });

    // Initialize client
    await gapi.client.init({
      clientId: this.config.clientId,
      scope: this.config.scopes.join(' '),
      discoveryDocs: this.config.discoveryDocs
    });

    this.authInstance = gapi.auth2.getAuthInstance();
  }

  // Different auth flow for Marketplace apps
  async authenticate(): Promise<gapi.auth2.GoogleUser> {
    if (!this.authInstance) {
      throw new Error('Auth not initialized');
    }

    // Check if already signed in (common in Marketplace context)
    if (this.authInstance.isSignedIn.get()) {
      return this.authInstance.currentUser.get();
    }

    // Marketplace apps often have different auth flow
    // Check if this is an admin installation
    if (this.config.installationType === 'domain') {
      // Domain-wide installation - user should already be authenticated
      const currentUser = this.authInstance.currentUser.get();
      if (!currentUser.hasGrantedScopes(this.config.scopes.join(' '))) {
        throw new Error('Insufficient permissions. Please contact your administrator.');
      }
      return currentUser;
    }

    // Individual installation - standard auth flow
    return await this.authInstance.signIn({
      scope: this.config.scopes.join(' ')
    });
  }

  // Enhanced permission checking for Marketplace
  hasRequiredPermissions(): boolean {
    if (!this.authInstance?.isSignedIn.get()) {
      return false;
    }

    const currentUser = this.authInstance.currentUser.get();
    return currentUser.hasGrantedScopes(this.config.scopes.join(' '));
  }

  // Register app as file handler (runs on installation)
  async registerAsFileHandler(): Promise<void> {
    const fileHandler = new GoogleDriveFileHandler();
    await fileHandler.registerFileHandler();
  }
}
```

### Permission Management UI

**New Component:** `src/components/marketplace/PermissionManager.tsx`
```typescript
interface PermissionManagerProps {
  requiredScopes: string[];
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  requiredScopes,
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'requesting'>('checking');
  
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const authService = new MarketplaceAuthService({
      clientId: process.env.REACT_APP_MARKETPLACE_CLIENT_ID!,
      scopes: requiredScopes,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      installationType: 'individual' // This would be determined dynamically
    });

    try {
      await authService.initialize();
      
      if (authService.hasRequiredPermissions()) {
        setPermissionStatus('granted');
        onPermissionGranted();
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionStatus('denied');
    }
  };

  const requestPermissions = async () => {
    setPermissionStatus('requesting');
    
    try {
      const authService = new MarketplaceAuthService({
        clientId: process.env.REACT_APP_MARKETPLACE_CLIENT_ID!,
        scopes: requiredScopes,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        installationType: 'individual'
      });
      
      await authService.authenticate();
      setPermissionStatus('granted');
      onPermissionGranted();
    } catch (error) {
      console.error('Permission request failed:', error);
      setPermissionStatus('denied');
      onPermissionDenied();
    }
  };

  if (permissionStatus === 'checking') {
    return (
      <div className="permission-manager checking">
        <div className="spinner" />
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (permissionStatus === 'granted') {
    return null; // Permissions granted, render main app
  }

  return (
    <div className="permission-manager">
      <div className="permission-request">
        <h2>Permissions Required</h2>
        <p>This app needs permission to:</p>
        <ul>
          <li>Access and edit your markdown files (.md) in Google Drive</li>
          <li>Create new markdown files in Google Drive</li>
          <li>Register as a file handler for .md files</li>
        </ul>
        <button 
          onClick={requestPermissions}
          disabled={permissionStatus === 'requesting'}
          className="permission-grant-button"
        >
          {permissionStatus === 'requesting' ? 'Requesting...' : 'Grant Permissions'}
        </button>
      </div>
    </div>
  );
};
```

---

## 4. App Script Manifest Requirements

### Creating the App Script Integration

**New File:** `appscript/appsscript.json`
```json
{
  "timeZone": "America/New_York",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Drive",
        "serviceId": "drive",
        "version": "v3"
      },
      {
        "userSymbol": "AdminDirectory",
        "serviceId": "admin",
        "version": "directory_v1"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "DOMAIN"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/drive.install"
  ]
}
```

**New File:** `appscript/Code.js` (Apps Script bridge)
```javascript
// Apps Script integration for Marketplace
function onInstall(e) {
  onOpen(e);
  registerFileHandler();
}

function onOpen(e) {
  // Register menu items or initialize app
  console.log('Markdown Editor installed');
}

function registerFileHandler() {
  // Register as file handler for .md files
  const registration = {
    name: 'Advanced Markdown Editor',
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    fileExtensions: ['.md', '.markdown'],
    openUrl: getWebAppUrl() + '?fileId={fileId}&userId={userId}',
    createUrl: getWebAppUrl() + '?action=create&userId={userId}',
    supportsCreate: true,
    supportsImport: true
  };
  
  // This would integrate with Drive API to register handler
  Drive.Apps.insert(registration);
}

function getWebAppUrl() {
  // Return the deployed web app URL
  return 'https://your-marketplace-app.netlify.app';
}

// Handle file operations from Drive context
function openFile(fileId, userId) {
  const url = `${getWebAppUrl()}?fileId=${fileId}&userId=${userId}&action=open`;
  return HtmlService.createRedirectUrl(url);
}

function createFile(userId, folderId) {
  const url = `${getWebAppUrl()}?userId=${userId}&folderId=${folderId}&action=create`;
  return HtmlService.createRedirectUrl(url);
}
```

### Marketplace SDK Configuration

**New File:** `marketplace-config.json`
```json
{
  "name": "Advanced Markdown Editor",
  "description": "Professional markdown editor with Google Drive integration, real-time collaboration, and advanced formatting features.",
  "version": "1.0.0",
  "category": "productivity",
  "subcategory": "document_editing",
  "shortDescription": "Edit markdown files directly in Google Drive with professional features",
  "detailedDescription": "Transform your Google Drive into a powerful markdown editing environment. Features include:\n\n• Direct integration with Google Drive\n• Professional markdown editor with live preview\n• Syntax highlighting and table support\n• Real-time collaboration\n• Export to PDF, HTML, and more\n• Mobile-responsive design\n• Auto-save functionality",
  
  "developer": {
    "name": "Your Company Name",
    "email": "support@yourcompany.com",
    "website": "https://yourcompany.com",
    "supportUrl": "https://yourcompany.com/support",
    "privacyPolicyUrl": "https://yourcompany.com/privacy",
    "termsOfServiceUrl": "https://yourcompany.com/terms"
  },
  
  "pricing": {
    "type": "freemium",
    "freeFeatures": ["Basic markdown editing", "Google Drive integration", "Auto-save"],
    "paidFeatures": ["Real-time collaboration", "Advanced exports", "Premium themes"],
    "pricingUrl": "https://yourcompany.com/pricing"
  },
  
  "screenshots": [
    "https://yourcompany.com/images/screenshot1.png",
    "https://yourcompany.com/images/screenshot2.png",
    "https://yourcompany.com/images/screenshot3.png"
  ],
  
  "icon": "https://yourcompany.com/images/icon-128x128.png",
  
  "integration": {
    "type": "webapp",
    "url": "https://your-marketplace-app.netlify.app",
    "fileHandlers": [
      {
        "mimeTypes": ["text/markdown", "text/x-markdown"],
        "fileExtensions": [".md", ".markdown"],
        "verb": "open_with"
      }
    ]
  },
  
  "permissions": {
    "oauth_scopes": [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/script.container.ui"
    ],
    "justification": "Required for editing markdown files in Google Drive and providing integrated user experience"
  }
}
```

---

## 5. Hosting Strategy Changes for Marketplace

### Current Hosting: Netlify Standalone
```yaml
# Current Netlify configuration
build:
  command: "npm run build"
  publish: "dist"
  
headers:
  /*:
    X-Frame-Options: DENY  # This needs to change for Marketplace
    Content-Security-Policy: "default-src 'self'"  # This needs updating
```

### Required Hosting Changes for Marketplace

**Modified:** `netlify.toml`
```toml
[build]
  command = "npm run build:marketplace"
  publish = "dist"

# IMPORTANT: Marketplace apps need to be embeddable
[[headers]]
  for = "/*"
  [headers.values]
    # CHANGED: Allow embedding in Google Workspace
    X-Frame-Options = "ALLOW-FROM https://workspace.google.com https://docs.google.com https://drive.google.com"
    
    # UPDATED: CSP for Marketplace integration
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'nonce-{NONCE}' https://apis.google.com https://accounts.google.com;
      connect-src 'self' https://www.googleapis.com https://accounts.google.com https://content.googleapis.com;
      img-src 'self' data: https: blob:;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      frame-ancestors https://workspace.google.com https://docs.google.com https://drive.google.com;
    """
    
    # Security headers maintained
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Marketplace-specific redirects
[[redirects]]
  from = "/marketplace-auth"
  to = "/auth/marketplace"
  status = 200

[[redirects]]
  from = "/file/:fileId"
  to = "/?fileId=:fileId&source=marketplace"
  status = 200
```

**New Build Script:** `package.json` addition
```json
{
  "scripts": {
    "build:marketplace": "cross-env REACT_APP_BUILD_TARGET=marketplace npm run build",
    "build:standalone": "cross-env REACT_APP_BUILD_TARGET=standalone npm run build"
  }
}
```

### Environment Variables for Marketplace

**Updated:** Environment configuration
```bash
# Existing variables
REACT_APP_GOOGLE_CLIENT_ID=standalone_client_id
REACT_APP_API_KEY=your_api_key

# NEW: Marketplace-specific variables
REACT_APP_MARKETPLACE_CLIENT_ID=marketplace_client_id
REACT_APP_BUILD_TARGET=marketplace
REACT_APP_MARKETPLACE_APP_ID=your_marketplace_app_id
REACT_APP_APPS_SCRIPT_ID=your_apps_script_id

# NEW: Enhanced security for Marketplace
REACT_APP_CSP_NONCE=auto-generated
REACT_APP_ALLOWED_ORIGINS=workspace.google.com,docs.google.com,drive.google.com
```

### Conditional Build Configuration

**Modified:** `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isMarketplace = process.env.REACT_APP_BUILD_TARGET === 'marketplace';

export default defineConfig({
  plugins: [
    react(),
    // Conditional plugins based on build target
    ...(isMarketplace ? [
      // Marketplace-specific plugins
      {
        name: 'marketplace-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Allow embedding in development
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            next();
          });
        }
      }
    ] : [])
  ],
  
  define: {
    __IS_MARKETPLACE__: JSON.stringify(isMarketplace),
    __BUILD_TARGET__: JSON.stringify(process.env.REACT_APP_BUILD_TARGET || 'standalone')
  },
  
  build: {
    rollupOptions: {
      output: {
        // Marketplace apps benefit from smaller initial chunks
        manualChunks: isMarketplace ? {
          vendor: ['react', 'react-dom'],
          google: ['@google-cloud/storage'], // If using Google APIs
          editor: ['milkdown'] // Editor-specific code
        } : undefined
      }
    }
  }
});
```

---

## 6. UI/UX Changes for Marketplace Integration

### Marketplace-Aware UI Components

**New Component:** `src/components/marketplace/MarketplaceLayout.tsx`
```typescript
interface MarketplaceLayoutProps {
  isEmbedded: boolean;
  children: React.ReactNode;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  isEmbedded,
  children
}) => {
  return (
    <div className={`app-layout ${isEmbedded ? 'embedded' : 'standalone'}`}>
      {/* Conditional header - hide when embedded */}
      {!isEmbedded && (
        <Header />
      )}
      
      <main className={`main-content ${isEmbedded ? 'embedded-main' : ''}`}>
        {children}
      </main>
      
      {/* Conditional footer - hide when embedded */}
      {!isEmbedded && (
        <Footer />
      )}
    </div>
  );
};
```

**New Styles:** `src/styles/marketplace.css`
```css
/* Marketplace-specific styling */
.app-layout.embedded {
  /* Remove margins/padding when embedded */
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
}

.embedded-main {
  /* Full viewport utilization when embedded */
  height: 100vh;
  padding: 0;
}

.marketplace-file-indicator {
  /* Show visual indicator when editing Drive files */
  background: #1a73e8;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.marketplace-save-status {
  /* Drive-specific save status */
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 16px;
  background: #f8f9fa;
  font-size: 14px;
}

.marketplace-save-status.saving {
  background: #e3f2fd;
  color: #1565c0;
}

.marketplace-save-status.saved {
  background: #e8f5e8;
  color: #2e7d32;
}

/* Responsive adjustments for embedded mode */
@media (max-width: 768px) {
  .app-layout.embedded .editor-toolbar {
    /* Compact toolbar for mobile embedded view */
    padding: 8px;
    flex-wrap: wrap;
  }
  
  .app-layout.embedded .editor-container {
    /* Optimize editor for embedded mobile */
    padding: 8px;
  }
}
```

### Context Detection and Adaptation

**New Hook:** `src/hooks/useMarketplaceContext.ts`
```typescript
interface MarketplaceContext {
  isEmbedded: boolean;
  isMarketplaceApp: boolean;
  currentFile: DriveFileInfo | null;
  userInfo: GoogleUserInfo | null;
  installationType: 'domain' | 'individual' | null;
}

interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  permissions: string[];
}

export function useMarketplaceContext(): MarketplaceContext {
  const [context, setContext] = useState<MarketplaceContext>({
    isEmbedded: false,
    isMarketplaceApp: false,
    currentFile: null,
    userInfo: null,
    installationType: null
  });

  useEffect(() => {
    // Detect if running in embedded context
    const isEmbedded = window.parent !== window;
    
    // Detect if launched from Marketplace
    const urlParams = new URLSearchParams(window.location.search);
    const isMarketplaceApp = urlParams.has('fileId') || urlParams.has('userId');
    
    // Get file info if available
    const fileId = urlParams.get('fileId');
    
    setContext(prev => ({
      ...prev,
      isEmbedded,
      isMarketplaceApp
    }));

    if (fileId) {
      loadFileInfo(fileId);
    }
  }, []);

  const loadFileInfo = async (fileId: string) => {
    try {
      const response = await gapi.client.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,parents,permissions'
      });
      
      setContext(prev => ({
        ...prev,
        currentFile: response.result as DriveFileInfo
      }));
    } catch (error) {
      console.error('Failed to load file info:', error);
    }
  };

  return context;
}
```

---

## 7. Implementation Timeline & Migration Strategy

### Phase 1: Foundation (Week 1)
**Days 1-2: Google Cloud Console Setup**
- Create new OAuth client for Marketplace
- Configure OAuth consent screen for external users
- Set up Apps Script project with proper scopes
- Register domain verification if needed

**Days 3-5: Core Integration Development**
- Implement MarketplaceAuthService
- Create GoogleDriveFileHandler
- Add URL parameter parsing for file opening
- Implement permission management UI

**Days 6-7: Testing & Validation**
- Test OAuth flows in Marketplace context
- Validate file handler registration
- Test embedding in Google Workspace UI
- Security audit of new authentication flows

### Phase 2: Enhanced Integration (Week 2)  
**Days 8-10: UI/UX Adaptation**
- Implement MarketplaceLayout component
- Add embedded mode styling
- Create marketplace-specific components
- Test responsive behavior in embedded context

**Days 11-12: Apps Script Integration**
- Complete Apps Script bridge implementation
- Test file handler registration
- Implement create new file functionality
- Test context menu integration

**Days 13-14: Deployment & Configuration**
- Update Netlify configuration for embedding
- Configure environment variables
- Test production deployment
- Validate CSP and security headers

### Phase 3: Marketplace Submission (Week 3)
**Days 15-17: Marketplace Preparation**
- Prepare app listing materials (screenshots, descriptions)
- Complete OAuth verification process
- Test with multiple Google accounts
- Document installation procedures

**Days 18-19: Submission & Review**
- Submit to Google Workspace Marketplace
- Address any initial feedback
- Prepare for approval process

**Day 20-21: Launch Preparation**
- Finalize launch materials
- Prepare user documentation
- Set up support channels

---

## 8. Risk Assessment & Mitigation Strategies

### Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **OAuth Scope Rejection** | Medium | High | Start with minimal scopes, request additional incrementally |
| **Embedding CSP Issues** | Medium | Medium | Thorough testing in Google Workspace context |
| **File Handler Conflicts** | Low | Medium | Unique MIME type handling, graceful fallbacks |
| **Performance in Embedded Mode** | Medium | Medium | Optimize for smaller viewport, lazy loading |

### Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Marketplace Approval Delay** | Medium | Medium | Submit early, maintain communication with Google |
| **Competition Response** | High | Low | Focus on unique value propositions (mobile UX, collaboration) |
| **User Adoption Challenges** | Medium | High | Clear onboarding, documentation, support |

### Security Considerations

**Enhanced Security for Marketplace:**
- **Token Storage**: Continue with encrypted localStorage approach
- **CSP Enhancement**: Strict CSP with nonce-based script loading
- **Origin Validation**: Validate requests come from Google domains
- **Audit Trail**: Log file access and modification events
- **Permission Validation**: Regular permission checks during use

---

## 9. Success Metrics & KPIs

### Technical Performance
- **Embed Load Time**: <3 seconds in Google Workspace context
- **File Operation Latency**: <2 seconds for open/save operations
- **Mobile Responsiveness**: Full functionality on mobile devices
- **Error Rate**: <2% for marketplace-specific operations

### User Adoption
- **Installation Rate**: Target 1,000 installations in first month
- **Active Usage**: >60% weekly active users post-installation  
- **File Handler Usage**: >40% of users accessing via right-click
- **User Retention**: >70% return usage within first week

### Business Metrics
- **Marketplace Rating**: Target >4.0 stars
- **Support Ticket Volume**: <5% of active users
- **Conversion Rate**: >8% free to paid upgrade
- **Revenue Target**: $5,000 MRR within 6 months

---

## 10. Future Enhancements & Roadmap

### Post-MVP Marketplace Features
1. **Advanced Collaboration** (Q1 2026)
   - Real-time multi-user editing
   - Comment and suggestion system
   - Version history integration

2. **Workspace Integration** (Q2 2026)
   - Google Docs import/export
   - Google Sheets data integration
   - Calendar integration for document planning

3. **Mobile App** (Q3 2026)  
   - Native Android/iOS apps
   - Offline editing capabilities
   - Push notification integration

4. **AI Features** (Q4 2026)
   - AI-powered writing assistance
   - Content suggestions and improvements
   - Template generation

---

## Conclusion

Transforming our standalone Netlify-based markdown editor into a Google Workspace Marketplace app requires significant architectural changes but offers substantial business opportunities. The key changes involve:

1. **Authentication**: Moving from standard OAuth to Marketplace-specific flows
2. **File Handling**: Implementing right-click integration for .md files
3. **Hosting**: Updating CSP and embedding policies for Workspace integration
4. **UI/UX**: Creating embedded-aware components and responsive layouts
5. **Distribution**: Adding Apps Script integration and Marketplace configuration

The 3-week implementation timeline is aggressive but achievable with focused execution. The potential to capture market share in the underserved Google Workspace markdown editing space makes this architectural investment strategically sound.

**Next Immediate Actions:**
1. Create new Google Cloud Console project for Marketplace OAuth
2. Begin MarketplaceAuthService implementation  
3. Set up Apps Script project with file handler registration
4. Update Netlify configuration for embedding support

The architecture changes position us to compete effectively against existing solutions while providing superior mobile experience and integration depth that current competitors lack.