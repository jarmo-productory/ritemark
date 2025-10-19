/**
 * DriveClient - Google Drive REST API Wrapper
 * Sprint 8: Google Drive API Integration
 *
 * Features:
 * - Browser-native fetch() for API calls
 * - Exponential backoff with retry logic
 * - 401 token expiry handling with re-auth prompt
 * - Rate limiting error handling (403, 429)
 * - XSS prevention through filename sanitization
 */

import { tokenManager } from '../auth/tokenManager';
import type {
  DriveFile,
  DriveError,
  DriveFileList,
  CreateFileRequest,
  UpdateFileRequest,
  ListFilesOptions,
  RetryConfig,
} from '../../types/drive';
import { DRIVE_ERRORS } from '../../types/drive';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

export class DriveClient {
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Create a new file in Google Drive with multipart upload
   * @param request - File creation request
   * @returns Created file metadata
   */
  async createFile(request: CreateFileRequest): Promise<DriveFile> {
    const sanitizedName = this.sanitizeFilename(request.name);
    const mimeType = request.mimeType || 'text/markdown';

    const metadata = {
      name: sanitizedName,
      mimeType,
      parents: request.parents,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      request.content +
      closeDelimiter;

    const url = `${UPLOAD_API_BASE}/files?uploadType=multipart`;

    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      return response as DriveFile;
    });
  }

  /**
   * Update existing file content
   * @param request - File update request
   * @returns Updated file metadata
   */
  async updateFile(request: UpdateFileRequest): Promise<DriveFile> {
    const url = `${UPLOAD_API_BASE}/files/${request.fileId}?uploadType=media`;

    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'text/markdown',
        },
        body: request.content,
      });

      // If name update requested, make separate metadata update
      if (request.name) {
        const sanitizedName = this.sanitizeFilename(request.name);
        const metadataUrl = `${DRIVE_API_BASE}/files/${request.fileId}`;
        return this.makeRequest(metadataUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: sanitizedName }),
        }) as Promise<DriveFile>;
      }

      return response as DriveFile;
    });
  }

  /**
   * Get file metadata
   * @param fileId - File ID
   * @param fields - Optional fields to return
   * @returns File metadata
   */
  async getFile(fileId: string, fields?: string): Promise<DriveFile> {
    const fieldsParam = fields || 'id,name,mimeType,size,createdTime,modifiedTime,parents';
    const url = `${DRIVE_API_BASE}/files/${fileId}?fields=${encodeURIComponent(fieldsParam)}`;

    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(url, {
        method: 'GET',
      });

      return response as DriveFile;
    });
  }

  /**
   * List files in Drive
   * @param options - Query options
   * @returns List of files
   */
  async listFiles(options: ListFilesOptions = {}): Promise<DriveFileList> {
    const params = new URLSearchParams({
      pageSize: String(options.pageSize || 100),
      fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents)',
    });

    if (options.pageToken) {
      params.append('pageToken', options.pageToken);
    }
    if (options.orderBy) {
      params.append('orderBy', options.orderBy);
    }
    if (options.q) {
      params.append('q', options.q);
    }

    const url = `${DRIVE_API_BASE}/files?${params.toString()}`;

    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(url, {
        method: 'GET',
      });

      return response as DriveFileList;
    });
  }

  /**
   * Delete a file
   * @param fileId - File ID to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    const url = `${DRIVE_API_BASE}/files/${fileId}`;

    return this.executeWithRetry(async () => {
      await this.makeRequest(url, {
        method: 'DELETE',
      });
    });
  }

  /**
   * Rename a file in Google Drive
   * @param fileId - File ID to rename
   * @param newName - New file name
   * @returns Updated file metadata
   */
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    const sanitizedName = this.sanitizeFilename(newName);
    const url = `${DRIVE_API_BASE}/files/${fileId}`;

    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sanitizedName,
        }),
      });

      return response as DriveFile;
    });
  }

  /**
   * Make authenticated request to Drive API
   * @param url - API endpoint URL
   * @param options - Fetch options
   * @returns Parsed JSON response
   */
  private async makeRequest(url: string, options: RequestInit): Promise<unknown> {
    const accessToken = await tokenManager.getAccessToken();
    if (!accessToken) {
      throw this.createError(
        DRIVE_ERRORS.TOKEN_EXPIRED,
        'No access token available',
        401,
        false
      );
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Handle 401 - Token expired, prompt for re-authentication
    if (response.status === 401) {
      const userWantsReAuth = confirm(
        'Your session expired. Click OK to sign in again and continue saving your work.'
      );

      if (userWantsReAuth) {
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/?reauth=true&return=${returnUrl}`;
      }

      throw this.createError(
        DRIVE_ERRORS.TOKEN_EXPIRED,
        'Access token expired. User declined re-authentication.',
        401,
        false
      );
    }

    // Handle 403 - Permission denied or rate limit
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const isRateLimit = JSON.stringify(errorData).includes('rateLimitExceeded');

      throw this.createError(
        isRateLimit ? DRIVE_ERRORS.RATE_LIMIT_EXCEEDED : DRIVE_ERRORS.PERMISSION_DENIED,
        isRateLimit ? 'Rate limit exceeded' : 'Permission denied',
        403,
        isRateLimit // Rate limit errors are retryable
      );
    }

    // Handle 429 - Rate limit
    if (response.status === 429) {
      throw this.createError(
        DRIVE_ERRORS.RATE_LIMIT_EXCEEDED,
        'Too many requests',
        429,
        true
      );
    }

    // Handle 404 - File not found
    if (response.status === 404) {
      throw this.createError(
        DRIVE_ERRORS.FILE_NOT_FOUND,
        'File not found',
        404,
        false
      );
    }

    // Handle 500+ server errors
    if (response.status >= 500) {
      throw this.createError(
        DRIVE_ERRORS.SERVER_ERROR,
        `Server error: ${response.status}`,
        response.status,
        true
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createError(
        DRIVE_ERRORS.INVALID_REQUEST,
        (errorData as { message?: string }).message || `Request failed: ${response.status}`,
        response.status,
        false
      );
    }

    // Return empty object for 204 No Content (DELETE operations)
    if (response.status === 204) {
      return {};
    }

    return response.json();
  }

  /**
   * Execute request with exponential backoff retry logic
   * @param fn - Function to execute
   * @returns Result from function
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: DriveError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const driveError = error as DriveError;
        lastError = driveError;

        // Don't retry non-retryable errors
        if (!driveError.retryable || attempt === this.retryConfig.maxRetries) {
          throw driveError;
        }

        // Calculate exponential backoff with jitter
        const exponentialDelay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        const jitter = Math.random() * 1000;
        const delay = exponentialDelay + jitter;

        console.warn(
          `Request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
          driveError
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sanitize filename to prevent XSS
   * @param filename - Raw filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
      .replace(/^\.+/, '') // Remove leading dots
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Create standardized Drive error
   */
  private createError(
    code: string,
    message: string,
    status: number,
    retryable: boolean
  ): DriveError {
    return {
      code,
      message,
      status,
      retryable,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const driveClient = new DriveClient();
