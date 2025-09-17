# Google Drive Integration Architecture

## Overview

This document outlines the comprehensive component architecture for the standalone Google Drive integration in Ritemark. The architecture follows modern React patterns with clean separation of concerns, type safety, and testable components.

## Architectural Shift

**FROM:** Apps Script + Service accounts + Complex hybrid architecture
**TO:** Pure React frontend + Google Drive API + Browser OAuth

## Architecture Principles

- **Clean Separation of Concerns**: Services, hooks, and components have distinct responsibilities
- **Reusable Service Abstractions**: Drive operations abstracted into reusable services
- **Type-Safe Interfaces**: Full TypeScript coverage with strict typing
- **Modern React Patterns**: Hooks, context, and functional components
- **Error Handling**: Comprehensive error boundaries and loading states
- **Testable Components**: Isolated, mockable services and pure components
- **Responsive UX**: Mobile-first design with progressive enhancement

## Component Architecture Overview

```
src/
├── services/           # Core Drive integration services
│   ├── GoogleAuth.ts      # OAuth 2.0 authentication
│   ├── DriveAPI.ts        # Drive API client wrapper
│   └── FilePicker.ts      # Google File Picker integration
├── hooks/              # React hooks for Drive operations
│   ├── useGoogleDrive.ts  # Main Drive integration hook
│   ├── useAuth.ts         # Authentication hook
│   └── useFilePicker.ts   # File picker hook
├── components/         # UI components
│   ├── DriveFilePicker.tsx    # File picker component
│   ├── DriveFileManager.tsx   # File management UI
│   ├── SaveLoadControls.tsx   # Save/load controls
│   └── AuthButton.tsx         # Authentication button
├── context/           # React contexts
│   └── GoogleDriveContext.tsx # Drive state management
├── types/             # TypeScript definitions
│   ├── drive.ts          # Drive API types
│   ├── auth.ts           # Authentication types
│   └── ui.ts             # UI component types
└── utils/             # Utility functions
    ├── driveHelpers.ts   # Drive-specific utilities
    └── constants.ts      # Drive API constants
```

## Service Layer Design

### 1. GoogleAuth Service (`src/services/GoogleAuth.ts`)

**Responsibilities:**
- Handle OAuth 2.0 flow with Google
- Manage access tokens and refresh logic
- Provide authentication status

**Key Methods:**
- `initialize()` - Initialize Google Identity Services
- `signIn()` - Trigger OAuth flow
- `signOut()` - Sign out user
- `getAccessToken()` - Get current access token
- `isSignedIn()` - Check authentication status

### 2. DriveAPI Service (`src/services/DriveAPI.ts`)

**Responsibilities:**
- Wrap Google Drive API calls
- Handle file operations (CRUD)
- Manage API error handling and retries

**Key Methods:**
- `listFiles()` - List Drive files with filtering
- `getFile()` - Get file metadata and content
- `createFile()` - Create new file
- `updateFile()` - Update existing file
- `deleteFile()` - Delete file
- `searchFiles()` - Search files by query

### 3. FilePicker Service (`src/services/FilePicker.ts`)

**Responsibilities:**
- Integrate Google File Picker
- Handle file selection UI
- Manage picker configuration

**Key Methods:**
- `initialize()` - Initialize picker
- `showPicker()` - Display file picker dialog
- `configure()` - Set picker options

## React Hooks Design

### 1. useGoogleDrive Hook (`src/hooks/useGoogleDrive.ts`)

**Purpose:** Main hook for Drive operations

**Returns:**
- `isAuthenticated` - Authentication status
- `isLoading` - Loading state
- `error` - Error state
- `files` - List of user files
- `currentFile` - Currently opened file
- `saveFile()` - Save file function
- `loadFile()` - Load file function
- `createNewFile()` - Create new file function
- `deleteFile()` - Delete file function

### 2. useAuth Hook (`src/hooks/useAuth.ts`)

**Purpose:** Authentication state management

**Returns:**
- `user` - Current user info
- `isSignedIn` - Sign-in status
- `signIn()` - Sign in function
- `signOut()` - Sign out function
- `isLoading` - Auth loading state

### 3. useFilePicker Hook (`src/hooks/useFilePicker.ts`)

**Purpose:** File picker integration

**Returns:**
- `showPicker()` - Show picker function
- `isPickerReady` - Picker initialization status
- `selectedFiles` - Selected files from picker

## Component Specifications

### 1. DriveFilePicker Component

**Purpose:** File selection and management interface

**Props:**
```typescript
interface DriveFilePickerProps {
  onFileSelect: (file: DriveFile) => void;
  allowMultiple?: boolean;
  fileTypes?: string[];
  className?: string;
}
```

**Features:**
- Google File Picker integration
- Recent files display
- Search functionality
- File type filtering

### 2. DriveFileManager Component

**Purpose:** Complete file management interface

**Props:**
```typescript
interface DriveFileManagerProps {
  currentFile?: DriveFile;
  onFileChange: (file: DriveFile) => void;
  onFileCreate: () => void;
  onFileDelete: (fileId: string) => void;
  className?: string;
}
```

**Features:**
- File list with metadata
- Create/rename/delete operations
- Sorting and filtering
- Responsive grid/list view

### 3. SaveLoadControls Component

**Purpose:** Save and load controls for editor

**Props:**
```typescript
interface SaveLoadControlsProps {
  content: string;
  currentFile?: DriveFile;
  onSave: (content: string) => Promise<void>;
  onLoad: (content: string) => void;
  autoSave?: boolean;
  className?: string;
}
```

**Features:**
- Manual save/load buttons
- Auto-save indicator
- Save status feedback
- Keyboard shortcuts

### 4. AuthButton Component

**Purpose:** Authentication UI component

**Props:**
```typescript
interface AuthButtonProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Sign in/out button
- User profile display
- Loading states
- Error handling

## State Management

### GoogleDriveContext

**Purpose:** Global state management for Drive integration

**Context Value:**
```typescript
interface GoogleDriveContextValue {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;

  // Files
  files: DriveFile[];
  currentFile: DriveFile | null;

  // Operations
  saveFile: (content: string, filename?: string) => Promise<void>;
  loadFile: (fileId: string) => Promise<string>;
  createFile: (name: string, content?: string) => Promise<DriveFile>;
  deleteFile: (fileId: string) => Promise<void>;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
}
```

## Type Definitions

### Core Types (`src/types/drive.ts`)

```typescript
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: number;
  parents?: string[];
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface DriveApiResponse<T> {
  data: T;
  error?: DriveError;
}

export interface DriveError {
  code: number;
  message: string;
  status: string;
}
```

### Authentication Types (`src/types/auth.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthConfig {
  clientId: string;
  scope: string;
  discoveryDocs: string[];
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}
```

## Error Handling Strategy

### 1. Service Level Errors
- Network failures
- API quota exceeded
- Authentication errors
- Permission errors

### 2. Component Level Errors
- React Error Boundaries
- Graceful degradation
- User-friendly error messages
- Retry mechanisms

### 3. Error Recovery
- Automatic token refresh
- Retry with exponential backoff
- Fallback to local storage
- User notification system

## Loading States

### 1. Authentication Loading
- Initial OAuth flow
- Token refresh
- Sign-in/out operations

### 2. File Operations Loading
- File list loading
- File content loading
- Save operations
- File operations (create/delete)

### 3. UI Loading States
- Skeleton screens
- Progress indicators
- Disabled states
- Loading overlays

## Integration Points with Existing Editor

### 1. App.tsx Updates
- Add GoogleDriveProvider
- Integrate auth button
- Add save/load controls

### 2. Editor Component Integration
- Connect to Drive context
- Auto-save functionality
- File change detection
- Content synchronization

### 3. Menu Integration
- File menu items
- Recent files list
- Drive status indicator

## Security Considerations

### 1. OAuth 2.0 Security
- PKCE flow implementation
- Secure token storage
- Token expiration handling
- Scope limitation

### 2. API Security
- Request validation
- Error message sanitization
- Rate limiting awareness
- CORS configuration

## Performance Optimization

### 1. Caching Strategy
- File list caching
- Content caching
- Token caching
- Metadata caching

### 2. Lazy Loading
- Component lazy loading
- API lazy initialization
- File content lazy loading

### 3. Optimization Techniques
- Debounced auto-save
- Optimistic updates
- Background sync
- Memory management

## Testing Strategy

### 1. Unit Tests
- Service layer testing
- Hook testing
- Utility function testing

### 2. Integration Tests
- Component integration
- API integration
- Authentication flow

### 3. E2E Tests
- Complete user workflows
- Error scenarios
- Cross-browser testing

## Deployment Considerations

### 1. Environment Configuration
- Development vs production configs
- OAuth client IDs
- API endpoints
- Feature flags

### 2. Build Process
- TypeScript compilation
- Bundle optimization
- Asset management
- Environment variables

This architecture provides a solid foundation for the Google Drive integration while maintaining flexibility for future enhancements and ensuring excellent developer experience.