# RiteMark Drive API Integration Guide

**Sprint 8 Implementation Reference**
**Date:** October 5, 2025

This guide provides specific implementation patterns for integrating Google Drive API v3 into RiteMark's WYSIWYG markdown editor.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RiteMark Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Milkdown    │────────▶│ Y.js CRDT    │                  │
│  │  Editor      │         │  Document    │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                          │
│                                   ▼                          │
│                          ┌────────────────┐                  │
│                          │  Drive Service │                  │
│                          │   (NEW)        │                  │
│                          └────────┬───────┘                  │
│                                   │                          │
│  ┌──────────────┐                 │                          │
│  │ Auth Context │─────OAuth Token─┤                          │
│  │ (EXISTING)   │                 │                          │
│  └──────────────┘                 │                          │
│                                   ▼                          │
└───────────────────────────────────┼───────────────────────────┘
                                    │
                        ┌───────────▼────────────┐
                        │  Google Drive API v3   │
                        │  (gapi.client.drive)   │
                        └────────────────────────┘
```

---

## File Structure

```
src/
├── services/
│   └── drive/
│       ├── DriveService.ts          # Main service class
│       ├── DriveFileCache.ts        # Caching layer
│       ├── DriveErrorHandler.ts     # Error handling
│       ├── DriveTypes.ts            # TypeScript types
│       └── gapiLoader.ts            # GAPI library loader
├── hooks/
│   ├── useDriveFiles.ts             # List files hook
│   ├── useDriveFile.ts              # Single file operations
│   └── useDriveSave.ts              # Auto-save hook
├── components/
│   └── drive/
│       ├── DriveFilePicker.tsx      # File selection dialog
│       ├── DriveSaveIndicator.tsx   # Save status UI
│       ├── DriveErrorBoundary.tsx   # Error handling
│       └── DriveShareDialog.tsx     # Sharing controls
└── types/
    └── drive.ts                      # Extend existing types
```

---

## Step-by-Step Implementation

### Step 1: GAPI Library Loader

**File:** `/src/services/drive/gapiLoader.ts`

```typescript
/**
 * GAPI Library Loader
 * Handles Google API client library initialization
 */

let gapiLoaded = false;
let gapiLoadPromise: Promise<void> | null = null;

export const loadGapi = (): Promise<void> => {
  // Return existing promise if already loading
  if (gapiLoadPromise) return gapiLoadPromise;

  // Return immediately if already loaded
  if (gapiLoaded) return Promise.resolve();

  gapiLoadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
      gapiLoaded = true;
      resolve();
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Initialize GAPI client
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
            ],
          });
          gapiLoaded = true;
          resolve();
        } catch (error) {
          reject(new Error(`GAPI initialization failed: ${error}`));
        }
      });
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google API client library'));
    };

    document.body.appendChild(script);
  });

  return gapiLoadPromise;
};

export const isGapiLoaded = (): boolean => gapiLoaded;

export const setAccessToken = (accessToken: string): void => {
  if (!gapiLoaded) {
    throw new Error('GAPI not loaded. Call loadGapi() first.');
  }
  window.gapi.client.setToken({ access_token: accessToken });
};
```

### Step 2: TypeScript Type Definitions

**File:** `/src/services/drive/DriveTypes.ts`

```typescript
/**
 * Drive API Type Definitions for RiteMark
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  trashed: boolean;
  starred: boolean;
  parents?: string[];
  shared?: boolean;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
}

export interface DriveFileListParams {
  pageSize?: number;
  pageToken?: string;
  q?: string; // Search query
  fields?: string;
  orderBy?: string;
  spaces?: string;
}

export interface DriveFileListResult {
  files: DriveFile[];
  nextPageToken?: string;
  hasMore: boolean;
}

export interface CreateFileParams {
  name: string;
  content: string;
  mimeType: string;
  parents?: string[];
  description?: string;
}

export interface UpdateFileParams {
  fileId: string;
  content?: string;
  name?: string;
  mimeType?: string;
  starred?: boolean;
}

export interface DrivePermission {
  id: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  displayName?: string;
}

export interface ShareFileParams {
  fileId: string;
  email: string;
  role: 'reader' | 'writer' | 'commenter';
  sendNotificationEmail?: boolean;
}

// Error types
export class DriveError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'DriveError';
  }
}

export const DRIVE_ERROR_CODES = {
  NOT_INITIALIZED: 'DRIVE_NOT_INITIALIZED',
  NO_ACCESS_TOKEN: 'DRIVE_NO_ACCESS_TOKEN',
  FILE_NOT_FOUND: 'DRIVE_FILE_NOT_FOUND',
  PERMISSION_DENIED: 'DRIVE_PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED: 'DRIVE_RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'DRIVE_NETWORK_ERROR',
  UNKNOWN_ERROR: 'DRIVE_UNKNOWN_ERROR',
} as const;
```

### Step 3: File Cache Implementation

**File:** `/src/services/drive/DriveFileCache.ts`

```typescript
/**
 * Drive File Cache
 * Simple in-memory cache with TTL for Drive API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DriveFileCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL: number;

  constructor(ttlMinutes: number = 5) {
    this.TTL = ttlMinutes * 60 * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
```

### Step 4: Error Handler with Exponential Backoff

**File:** `/src/services/drive/DriveErrorHandler.ts`

```typescript
/**
 * Drive Error Handler
 * Handles API errors with exponential backoff retry logic
 */

import { DriveError, DRIVE_ERROR_CODES } from './DriveTypes';

export const parseGapiError = (error: any): DriveError => {
  const status = error?.status || error?.result?.error?.code;
  const message = error?.result?.error?.message || error?.message || 'Unknown error';

  // Rate limit errors
  if (
    status === 403 &&
    (message.includes('rate limit') || message.includes('quota'))
  ) {
    return new DriveError(
      'Too many requests. Please wait a moment.',
      DRIVE_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      403,
      true // retryable
    );
  }

  // Rate limit (alternative code)
  if (status === 429) {
    return new DriveError(
      'Too many requests. Please wait a moment.',
      DRIVE_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429,
      true
    );
  }

  // File not found
  if (status === 404) {
    return new DriveError(
      'File not found',
      DRIVE_ERROR_CODES.FILE_NOT_FOUND,
      404,
      false
    );
  }

  // Permission denied
  if (status === 403) {
    return new DriveError(
      'Permission denied. You may not have access to this file.',
      DRIVE_ERROR_CODES.PERMISSION_DENIED,
      403,
      false
    );
  }

  // Network errors
  if (status === 0 || message.includes('network')) {
    return new DriveError(
      'Network error. Please check your connection.',
      DRIVE_ERROR_CODES.NETWORK_ERROR,
      0,
      true
    );
  }

  // Unknown error
  return new DriveError(
    message,
    DRIVE_ERROR_CODES.UNKNOWN_ERROR,
    status,
    false
  );
};

export const exponentialBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const driveError = parseGapiError(error);

      // Don't retry non-retryable errors
      if (!driveError.retryable || attempt === maxRetries - 1) {
        throw driveError;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new DriveError(
    'Max retries exceeded',
    DRIVE_ERROR_CODES.UNKNOWN_ERROR,
    undefined,
    false
  );
};
```

### Step 5: Main Drive Service

**File:** `/src/services/drive/DriveService.ts`

```typescript
/**
 * Google Drive Service
 * Main service class for Drive API operations
 */

import { loadGapi, setAccessToken, isGapiLoaded } from './gapiLoader';
import { DriveFileCache } from './DriveFileCache';
import { exponentialBackoff, parseGapiError } from './DriveErrorHandler';
import type {
  DriveFile,
  DriveFileListParams,
  DriveFileListResult,
  CreateFileParams,
  UpdateFileParams,
  ShareFileParams,
  DrivePermission,
} from './DriveTypes';
import { DriveError, DRIVE_ERROR_CODES } from './DriveTypes';

export class DriveService {
  private cache: DriveFileCache;
  private initialized = false;

  constructor() {
    this.cache = new DriveFileCache(5); // 5 minute cache
  }

  /**
   * Initialize Drive service with access token
   */
  async initialize(accessToken: string): Promise<void> {
    if (!accessToken) {
      throw new DriveError(
        'Access token is required',
        DRIVE_ERROR_CODES.NO_ACCESS_TOKEN
      );
    }

    try {
      await loadGapi();
      setAccessToken(accessToken);
      this.initialized = true;
    } catch (error) {
      throw new DriveError(
        'Failed to initialize Drive service',
        DRIVE_ERROR_CODES.NOT_INITIALIZED
      );
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !isGapiLoaded()) {
      throw new DriveError(
        'Drive service not initialized',
        DRIVE_ERROR_CODES.NOT_INITIALIZED
      );
    }
  }

  /**
   * List files from Google Drive
   */
  async listFiles(params: DriveFileListParams = {}): Promise<DriveFileListResult> {
    this.ensureInitialized();

    const cacheKey = `file-list-${JSON.stringify(params)}`;
    const cached = this.cache.get<DriveFileListResult>(cacheKey);
    if (cached) return cached;

    const result = await exponentialBackoff(async () => {
      const response = await window.gapi.client.drive.files.list({
        pageSize: params.pageSize || 100,
        pageToken: params.pageToken,
        q: params.q || "mimeType='text/markdown' and trashed=false",
        fields: params.fields || 'nextPageToken, files(id, name, createdTime, modifiedTime, size, mimeType, iconLink, starred)',
        orderBy: params.orderBy || 'modifiedTime desc',
        spaces: params.spaces || 'drive',
      });

      return {
        files: response.result.files || [],
        nextPageToken: response.result.nextPageToken,
        hasMore: !!response.result.nextPageToken,
      };
    });

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Create new file in Google Drive
   */
  async createFile(params: CreateFileParams): Promise<DriveFile> {
    this.ensureInitialized();

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadata = {
      name: params.name,
      mimeType: params.mimeType,
      parents: params.parents || [],
      description: params.description || 'Created with RiteMark',
      appProperties: {
        'ritemark.version': '1.0.0',
        'ritemark.createdAt': new Date().toISOString(),
      },
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${params.mimeType}\r\n\r\n` +
      params.content +
      closeDelim;

    const file = await exponentialBackoff(async () => {
      const response = await window.gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: {
          uploadType: 'multipart',
          fields: 'id, name, createdTime, modifiedTime, webViewLink, mimeType',
        },
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      return response.result;
    });

    // Invalidate file list cache
    this.cache.invalidatePattern('^file-list-');

    return file;
  }

  /**
   * Read file content from Google Drive
   */
  async readFile(fileId: string): Promise<string> {
    this.ensureInitialized();

    const cacheKey = `file-content-${fileId}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const content = await exponentialBackoff(async () => {
      const response = await window.gapi.client.drive.files.get({
        fileId,
        alt: 'media',
      });

      return response.body;
    });

    this.cache.set(cacheKey, content);
    return content;
  }

  /**
   * Update file in Google Drive
   */
  async updateFile(params: UpdateFileParams): Promise<DriveFile> {
    this.ensureInitialized();

    // Update metadata only if needed
    if (params.name || params.starred !== undefined) {
      await exponentialBackoff(async () => {
        await window.gapi.client.drive.files.update({
          fileId: params.fileId,
          resource: {
            name: params.name,
            starred: params.starred,
          },
        });
      });
    }

    // Update content if provided
    if (params.content !== undefined) {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        mimeType: params.mimeType || 'text/markdown',
        appProperties: {
          'ritemark.lastModifiedAt': new Date().toISOString(),
        },
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${metadata.mimeType}\r\n\r\n` +
        params.content +
        closeDelim;

      await exponentialBackoff(async () => {
        await window.gapi.client.request({
          path: `/upload/drive/v3/files/${params.fileId}`,
          method: 'PATCH',
          params: {
            uploadType: 'multipart',
          },
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });
      });
    }

    // Get updated file metadata
    const file = await exponentialBackoff(async () => {
      const response = await window.gapi.client.drive.files.get({
        fileId: params.fileId,
        fields: 'id, name, modifiedTime, webViewLink, mimeType',
      });

      return response.result;
    });

    // Invalidate caches
    this.cache.invalidate(`file-content-${params.fileId}`);
    this.cache.invalidatePattern('^file-list-');

    return file;
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    this.ensureInitialized();

    await exponentialBackoff(async () => {
      await window.gapi.client.drive.files.delete({ fileId });
    });

    // Invalidate caches
    this.cache.invalidate(`file-content-${fileId}`);
    this.cache.invalidatePattern('^file-list-');
  }

  /**
   * Move file to trash (recoverable delete)
   */
  async trashFile(fileId: string): Promise<void> {
    this.ensureInitialized();

    await exponentialBackoff(async () => {
      await window.gapi.client.drive.files.update({
        fileId,
        resource: { trashed: true },
      });
    });

    this.cache.invalidatePattern('^file-list-');
  }

  /**
   * Share file with user
   */
  async shareFile(params: ShareFileParams): Promise<DrivePermission> {
    this.ensureInitialized();

    const permission = await exponentialBackoff(async () => {
      const response = await window.gapi.client.drive.permissions.create({
        fileId: params.fileId,
        resource: {
          type: 'user',
          role: params.role,
          emailAddress: params.email,
        },
        sendNotificationEmail: params.sendNotificationEmail ?? true,
      });

      return response.result;
    });

    return permission;
  }

  /**
   * List file permissions
   */
  async listPermissions(fileId: string): Promise<DrivePermission[]> {
    this.ensureInitialized();

    const result = await exponentialBackoff(async () => {
      const response = await window.gapi.client.drive.permissions.list({
        fileId,
        fields: 'permissions(id, emailAddress, role, displayName, type)',
      });

      return response.result.permissions || [];
    });

    return result;
  }

  /**
   * Remove file permission
   */
  async removePermission(fileId: string, permissionId: string): Promise<void> {
    this.ensureInitialized();

    await exponentialBackoff(async () => {
      await window.gapi.client.drive.permissions.delete({
        fileId,
        permissionId,
      });
    });
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let driveServiceInstance: DriveService | null = null;

export const getDriveService = (): DriveService => {
  if (!driveServiceInstance) {
    driveServiceInstance = new DriveService();
  }
  return driveServiceInstance;
};
```

---

## React Hooks

### Hook: useDriveFiles

**File:** `/src/hooks/useDriveFiles.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { getDriveService } from '../services/drive/DriveService';
import { useAuth } from './useAuth';
import type { DriveFile, DriveFileListParams } from '../services/drive/DriveTypes';

export const useDriveFiles = (params?: DriveFileListParams) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getAccessToken } = useAuth();

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const driveService = getDriveService();
      await driveService.initialize(token);

      const result = await driveService.listFiles(params);
      setFiles(result.files);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load files'));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, params]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    loading,
    error,
    refresh: loadFiles,
  };
};
```

### Hook: useDriveFile

**File:** `/src/hooks/useDriveFile.ts`

```typescript
import { useState, useCallback } from 'react';
import { getDriveService } from '../services/drive/DriveService';
import { useAuth } from './useAuth';

export const useDriveFile = (fileId?: string) => {
  const [content, setContent] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getAccessToken } = useAuth();

  const loadFile = useCallback(async (id?: string) => {
    const targetId = id || fileId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const driveService = getDriveService();
      await driveService.initialize(token);

      const fileContent = await driveService.readFile(targetId);
      setContent(fileContent);

      // Optionally load metadata
      const response = await window.gapi.client.drive.files.get({
        fileId: targetId,
        fields: 'id, name, modifiedTime, createdTime',
      });
      setMetadata(response.result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load file'));
    } finally {
      setLoading(false);
    }
  }, [fileId, getAccessToken]);

  const saveFile = useCallback(async (newContent: string, id?: string) => {
    const targetId = id || fileId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const driveService = getDriveService();
      await driveService.initialize(token);

      await driveService.updateFile({
        fileId: targetId,
        content: newContent,
      });

      setContent(newContent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save file'));
    } finally {
      setLoading(false);
    }
  }, [fileId, getAccessToken]);

  return {
    content,
    metadata,
    loading,
    error,
    loadFile,
    saveFile,
  };
};
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/services/drive/DriveService.test.ts
import { DriveService } from '../../../src/services/drive/DriveService';

describe('DriveService', () => {
  let driveService: DriveService;

  beforeEach(() => {
    driveService = new DriveService();
  });

  it('should require initialization before use', async () => {
    await expect(driveService.listFiles()).rejects.toThrow('not initialized');
  });

  it('should list files after initialization', async () => {
    // Mock GAPI responses
    // Test implementation
  });
});
```

---

## Next Implementation Steps

1. **Week 1:** Implement core service (`DriveService.ts`, `gapiLoader.ts`)
2. **Week 2:** Add React hooks and basic UI components
3. **Week 3:** Integrate with Milkdown editor for auto-save
4. **Week 4:** Add file picker, sharing, and advanced features

**Status:** Ready for Sprint 8 implementation ✅
