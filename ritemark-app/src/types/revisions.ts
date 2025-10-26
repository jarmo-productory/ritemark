/**
 * Google Drive Revisions API Type Definitions
 * Sprint 17: Version History Feature
 * @see https://developers.google.com/drive/api/v3/reference/revisions
 */

/**
 * User information for revision authors
 */
export interface DriveUser {
  displayName: string
  emailAddress: string
  photoLink?: string
  kind?: string
  me?: boolean
  permissionId?: string
}

/**
 * Single revision metadata from Google Drive API v3
 */
export interface DriveRevision {
  /** Revision ID */
  id: string

  /** MIME type of the revision */
  mimeType: string

  /** Last modification time (ISO 8601 format) */
  modifiedTime: string

  /** Whether to keep this revision forever */
  keepForever: boolean

  /** Whether this is the published revision */
  published?: boolean

  /** Link to download the revision content */
  downloadUrl?: string

  /** Size of the revision in bytes */
  size?: string

  /** Original filename if different from current */
  originalFilename?: string

  /** MD5 checksum of revision content */
  md5Checksum?: string

  /** User who last modified this revision */
  lastModifyingUser?: DriveUser

  /** Export links for Google Workspace files */
  exportLinks?: Record<string, string>
}

/**
 * Response from Drive API revisions.list endpoint
 */
export interface DriveRevisionListResponse {
  /** List of revisions */
  revisions: DriveRevision[]

  /** Token for next page of results */
  nextPageToken?: string

  /** API resource kind */
  kind?: string
}

/**
 * Options for restoring a revision
 */
export interface RestoreRevisionOptions {
  /** File ID to restore */
  fileId: string

  /** Revision ID to restore from */
  revisionId: string

  /** Access token for authentication */
  accessToken: string

  /** Optional callback for progress updates */
  onProgress?: (status: 'fetching' | 'restoring' | 'complete') => void
}

/**
 * Options for listing revisions
 */
export interface ListRevisionsOptions {
  /** File ID to get revisions for */
  fileId: string

  /** Access token for authentication */
  accessToken: string

  /** Maximum number of revisions to return per page */
  pageSize?: number

  /** Page token for pagination */
  pageToken?: string
}

/**
 * Result from revision restore operation
 */
export interface RestoreRevisionResult {
  success: boolean
  error?: string
  restoredContent?: string
}

/**
 * Default fields to request from Revisions API
 */
export const DEFAULT_REVISION_FIELDS = [
  'id',
  'modifiedTime',
  'lastModifyingUser(displayName,emailAddress,photoLink)',
  'size',
  'keepForever',
  'mimeType',
  'md5Checksum',
  'originalFilename',
].join(',')

/**
 * Maximum number of revisions to fetch per page
 */
export const MAX_REVISIONS_PAGE_SIZE = 1000

/**
 * Default page size for revision listing
 */
export const DEFAULT_REVISIONS_PAGE_SIZE = 100
