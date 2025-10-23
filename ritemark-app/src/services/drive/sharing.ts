/**
 * Drive Sharing Service - Sprint 15 (Simplified)
 *
 * Simple approach: Opens file in Google Drive where user can click native Share button.
 * No complex ShareClient API - just opens the file URL directly.
 *
 * Usage:
 * ```typescript
 * import { openShareDialog } from '@/services/drive/sharing';
 *
 * openShareDialog({
 *   fileId: 'abc123',
 *   onSuccess: () => toast.success('Opening file in Drive'),
 *   onError: (error) => toast.error(error.message)
 * });
 * ```
 */

import { driveClient } from './driveClient';

/**
 * Configuration options for sharing
 */
export interface ShareOptions {
  /** Google Drive file ID to share */
  fileId: string;

  /** Optional success callback */
  onSuccess?: () => void;

  /** Optional error callback */
  onError?: (error: Error) => void;
}

/**
 * Share permission configuration for programmatic sharing
 */
export interface SharePermission {
  /** Permission type */
  type: 'user' | 'group' | 'domain' | 'anyone';

  /** Permission role */
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';

  /** Email address (required for user/group types) */
  emailAddress?: string;

  /** Domain name (required for domain type) */
  domain?: string;

  /** Allow file discovery in domain (for domain type) */
  allowFileDiscovery?: boolean;

  /** Permission expiration time (ISO 8601 format) */
  expirationTime?: string;
}

/**
 * Opens file in Google Drive (user can click Share button there)
 *
 * Simple strategy: Just open the file in Drive, let user handle sharing.
 * Works reliably on all devices and browsers.
 *
 * @param options - Share configuration
 */
export function openShareDialog(options: ShareOptions): void {
  const { fileId, onSuccess, onError } = options;

  try {
    if (!fileId) {
      throw new Error('No file ID provided');
    }

    // Simple: Just open file in Google Drive
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

    window.open(fileUrl, '_blank', 'noopener,noreferrer');

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to open file in Drive';
    const shareError = new Error(errorMessage);

    if (onError) {
      onError(shareError);
    } else {
      console.error('Share error:', shareError);
    }
  }
}

/**
 * Create a share permission programmatically
 *
 * Used for:
 * - Sharing with specific email addresses
 * - Creating "Anyone with link" permissions
 * - Setting custom permission roles
 *
 * @param fileId - Google Drive file ID
 * @param permission - Permission configuration
 * @returns Permission object with ID
 * @throws Error if permission creation fails
 */
export async function createSharePermission(
  fileId: string,
  permission: SharePermission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    const response = await driveClient['makeRequest'](
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission),
      }
    );

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create permission';
    throw new Error(`Share permission error: ${errorMessage}`);
  }
}

/**
 * List all permissions for a file
 *
 * @param fileId - Google Drive file ID
 * @returns Array of permissions
 * @throws Error if listing fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listSharePermissions(fileId: string): Promise<any[]> {
  try {
    const response = await driveClient['makeRequest'](
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=permissions(id,type,role,emailAddress,displayName,photoLink)`,
      {
        method: 'GET',
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as { permissions: any[] };

    return response.permissions || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list permissions';
    throw new Error(`List permissions error: ${errorMessage}`);
  }
}

/**
 * Remove a share permission
 *
 * @param fileId - Google Drive file ID
 * @param permissionId - Permission ID to remove
 * @throws Error if removal fails
 */
export async function removeSharePermission(
  fileId: string,
  permissionId: string
): Promise<void> {
  try {
    await driveClient['makeRequest'](
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`,
      {
        method: 'DELETE',
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove permission';
    throw new Error(`Remove permission error: ${errorMessage}`);
  }
}

/**
 * Create "Anyone with link" permission
 *
 * Convenience function for making files publicly shareable.
 * Sets permission to "reader" by default.
 *
 * @param fileId - Google Drive file ID
 * @param role - Permission role (default: 'reader')
 * @returns Permission object
 */
export async function shareWithAnyone(
  fileId: string,
  role: 'reader' | 'writer' | 'commenter' = 'reader'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return createSharePermission(fileId, {
    type: 'anyone',
    role: role,
  });
}

/**
 * Share file with specific email address
 *
 * Sends share notification email to recipient.
 *
 * @param fileId - Google Drive file ID
 * @param email - Recipient email address
 * @param role - Permission role (default: 'writer')
 * @returns Permission object
 */
export async function shareWithUser(
  fileId: string,
  email: string,
  role: 'owner' | 'writer' | 'commenter' | 'reader' = 'writer'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return createSharePermission(fileId, {
    type: 'user',
    role: role,
    emailAddress: email,
  });
}

/**
 * Check if file can be shared by current user
 *
 * Checks Drive file capabilities.
 *
 * @param fileId - Google Drive file ID
 * @returns true if user can share file
 */
export async function canShareFile(fileId: string): Promise<boolean> {
  try {
    const response = await driveClient['makeRequest'](
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=capabilities(canShare)`,
      {
        method: 'GET',
      }
    ) as { capabilities?: { canShare?: boolean } };

    return response.capabilities?.canShare ?? false;
  } catch (error) {
    console.error('Failed to check share capability:', error);
    return false;
  }
}
