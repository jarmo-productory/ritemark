/**
 * Google Drive API Type Definitions for RiteMark
 * Based on Google Drive API v3 REST responses
 */

/**
 * Core file metadata from Google Drive API v3
 * @see https://developers.google.com/drive/api/v3/reference/files
 */
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string // ISO 8601 format
  createdTime: string // ISO 8601 format
  size?: string // Size in bytes as string
  parents?: string[] // Parent folder IDs
  webViewLink?: string // Link to view file in Drive UI

  // Additional useful metadata
  description?: string
  starred?: boolean
  trashed?: boolean
  version?: string
  owners?: Array<{
    emailAddress: string
    displayName: string
    photoLink?: string
  }>
  lastModifyingUser?: {
    emailAddress: string
    displayName: string
    photoLink?: string
  }
  capabilities?: {
    canEdit?: boolean
    canComment?: boolean
    canShare?: boolean
    canDelete?: boolean
  }
}

/**
 * Real-time sync status for Drive operations
 */
export interface DriveSyncStatus {
  status: 'synced' | 'saving' | 'offline' | 'error'
  lastSaved?: string // ISO 8601 timestamp
  error?: string

  // Convenience aliases
  isSynced?: boolean
  isSaving?: boolean
  isOffline?: boolean
  hasError?: boolean
}

/**
 * Drive API error with retry information
 */
export interface DriveError {
  code: string
  message: string
  status?: number // HTTP status code
  retryable?: boolean

  // Additional error context
  details?: unknown
  reason?: string
  location?: string
  locationType?: string

  // Convenience alias
  recoverable?: boolean
}

/**
 * Standard Drive API error codes
 * Based on Google Drive API v3 error responses
 */
export const DRIVE_ERRORS = {
  // Network and connectivity errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',

  // Authentication and authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // File operation errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TRASHED: 'FILE_TRASHED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  DUPLICATE_FILE: 'DUPLICATE_FILE',

  // Quota and rate limiting errors
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',

  // Operation errors
  CONFLICT: 'CONFLICT',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  INVALID_OPERATION: 'INVALID_OPERATION',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const

export type DriveErrorCode = typeof DRIVE_ERRORS[keyof typeof DRIVE_ERRORS]

/**
 * Google Picker API types
 * @see https://developers.google.com/picker/docs/reference
 */

/**
 * Google Picker Builder configuration
 */
export interface PickerBuilder {
  addView(view: PickerView): PickerBuilder
  setOAuthToken(token: string): PickerBuilder
  setDeveloperKey(key: string): PickerBuilder
  setCallback(callback: (data: PickerCallbackData) => void): PickerBuilder
  setOrigin(origin: string): PickerBuilder
  setTitle(title: string): PickerBuilder
  setLocale(locale: string): PickerBuilder
  setMaxItems(maxItems: number): PickerBuilder
  enableFeature(feature: PickerFeature): PickerBuilder
  disableFeature(feature: PickerFeature): PickerBuilder
  setAppId(appId: string): PickerBuilder
  build(): PickerInstance
}

/**
 * Google Picker View configuration
 */
export interface PickerView {
  setMimeTypes(mimeTypes: string): PickerView
  setIncludeFolders(includeFolders: boolean): PickerView
  setSelectFolderEnabled(enabled: boolean): PickerView
  setParent(parent: string): PickerView
}

/**
 * Document selected from Google Picker
 */
export interface PickerDocument {
  id: string
  name: string
  mimeType: string
  description?: string
  type: string
  url?: string
  embedUrl?: string
  iconUrl?: string
  serviceId?: string
  lastEditedUtc?: number
  parentId?: string
  sizeBytes?: number
}

/**
 * Google Picker callback data
 */
export interface PickerCallbackData {
  action: 'picked' | 'cancel' | 'loaded'
  docs?: PickerDocument[]
  viewToken?: string[]
}

/**
 * Google Picker instance
 */
export interface PickerInstance {
  setVisible(visible: boolean): void
  isVisible(): boolean
  dispose(): void
}

/**
 * Google Picker features
 */
export type PickerFeature =
  | 'MULTISELECT_ENABLED'
  | 'NAV_HIDDEN'
  | 'MINE_ONLY'
  | 'SUPPORT_DRIVES'
  | 'SUPPORT_TEAM_DRIVES'

/**
 * Drive file operation result
 */
export interface DriveOperationResult {
  success: boolean
  file?: DriveFile
  error?: DriveError
}

/**
 * Drive file list result
 */
export interface DriveFileListResult {
  success: boolean
  files?: DriveFile[]
  nextPageToken?: string
  error?: DriveError
}

/**
 * Drive file metadata update
 */
export interface DriveFileUpdate {
  name?: string
  description?: string
  starred?: boolean
  trashed?: boolean
  parents?: string[]
}

/**
 * Drive file creation parameters
 */
export interface DriveFileCreate {
  name: string
  mimeType?: string
  parents?: string[]
  description?: string
  content?: string | Blob
}

/**
 * Drive API query parameters
 */
export interface DriveQueryParams {
  q?: string // Query string
  pageSize?: number
  pageToken?: string
  orderBy?: string
  spaces?: string
  fields?: string
  includeItemsFromAllDrives?: boolean
  supportsAllDrives?: boolean
}

/**
 * Drive service interface
 */
export interface IDriveService {
  // File operations
  getFile(fileId: string): Promise<DriveFile>
  listFiles(params?: DriveQueryParams): Promise<DriveFileListResult>
  createFile(params: DriveFileCreate): Promise<DriveOperationResult>
  updateFile(fileId: string, updates: DriveFileUpdate): Promise<DriveOperationResult>
  deleteFile(fileId: string): Promise<boolean>

  // Content operations
  getFileContent(fileId: string): Promise<string>
  updateFileContent(fileId: string, content: string): Promise<boolean>

  // Sync operations
  getSyncStatus(): DriveSyncStatus
  syncFile(fileId: string): Promise<boolean>
}

/**
 * Drive context type for React context
 */
export interface DriveContextType {
  currentFile: DriveFile | null
  syncStatus: DriveSyncStatus
  isLoading: boolean
  error: DriveError | null

  // File operations
  openFile: (fileId: string) => Promise<void>
  saveFile: () => Promise<void>
  createFile: (name: string, content?: string) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>

  // Picker
  showFilePicker: () => Promise<PickerDocument[] | null>

  // State management
  clearError: () => void
  setSyncStatus: (status: DriveSyncStatus) => void
}

/**
 * Drive provider props
 */
export interface DriveProviderProps {
  children: React.ReactNode
  autoSave?: boolean
  autoSaveInterval?: number // milliseconds
  onFileChange?: (file: DriveFile | null) => void
  onSyncStatusChange?: (status: DriveSyncStatus) => void
}

/**
 * Drive hook return type
 */
export type UseDriveReturn = DriveContextType

/**
 * Markdown MIME type constant
 */
export const MARKDOWN_MIME_TYPE = 'text/markdown'

/**
 * Supported file MIME types
 */
export const SUPPORTED_MIME_TYPES = [
  'text/markdown',
  'text/plain',
  'application/octet-stream', // For .md files without proper MIME type
] as const

/**
 * Drive API scopes
 */
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // Per-file access (recommended)
] as const

/**
 * Default Drive query fields
 */
export const DEFAULT_FILE_FIELDS = [
  'id',
  'name',
  'mimeType',
  'modifiedTime',
  'createdTime',
  'size',
  'parents',
  'webViewLink',
  'owners',
  'lastModifyingUser',
  'capabilities',
].join(',')

/**
 * Component Props for Drive UI Components
 */

export interface DriveFileBrowserProps {
  onFileSelect: (file: DriveFile) => void
  onClose: () => void
}

export interface DriveFilePickerProps {
  onFileSelect: (file: DriveFile) => void
  onClose: () => void
}


/**
 * Type aliases for DriveClient compatibility
 */

export type CreateFileRequest = DriveFileCreate
export type UpdateFileRequest = {
  fileId: string
  content: string
  name?: string
}
export type ListFilesOptions = Omit<DriveQueryParams, 'fields' | 'spaces' | 'includeItemsFromAllDrives' | 'supportsAllDrives'>
export type DriveFileList = Omit<DriveFileListResult, 'success' | 'error'>

/**
 * Retry configuration for API requests
 */
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}
