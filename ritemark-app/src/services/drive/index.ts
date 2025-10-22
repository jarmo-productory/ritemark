/**
 * Google Drive Services
 *
 * Provides Drive API integration including:
 * - Auto-save management with debouncing
 * - Drive client for file operations (to be implemented)
 * - File picker integration (to be implemented)
 */

export { AutoSaveManager } from './autoSaveManager';
export type { AutoSaveOptions, SaveResult } from './autoSaveManager';
export { uploadImageToDrive } from './DriveImageUpload';
export {
  openShareDialog,
  createSharePermission,
  listSharePermissions,
  removeSharePermission,
  shareWithAnyone,
  shareWithUser,
  canShareFile,
} from './sharing';
export type { ShareOptions, SharePermission } from './sharing';
