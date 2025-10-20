/**
 * DriveImageUpload - Google Drive Image Upload Service
 * Sprint 11: Table Image Support
 *
 * Features:
 * - Upload images to Google Drive with size validation
 * - Auto-create "RiteMark Images" folder for organization
 * - Set public permissions for shareable image URLs
 * - Integration with driveClient for authenticated requests
 * - Placeholder for future compression (Phase 6)
 */

import { driveClient } from './driveClient';
import type { DriveFile } from '../../types/drive';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGES_FOLDER_NAME = 'RiteMark Images';

/**
 * Upload an image file to Google Drive and return shareable URL
 * @param file - Image file to upload
 * @returns Shareable Google Drive URL for the image
 * @throws Error if file is too large or upload fails
 */
export async function uploadImageToDrive(file: File): Promise<string> {
  // 1. Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File too large (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
  }

  // 2. Compress image
  const compressedFile = await compressImage(file);

  // 3. Get or create images folder
  const imagesFolderId = await getImagesFolder();

  // 4. Upload to Drive using multipart upload
  const metadata = {
    name: file.name,
    mimeType: compressedFile.type,
    parents: [imagesFolderId],
  };

  const boundary = '-------314159265358979323846264';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Convert file to base64 for upload
  const fileContent = await fileToBase64(compressedFile);

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${compressedFile.type}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadResponse = (await driveClient['makeRequest'](
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  )) as DriveFile;

  const fileId = uploadResponse.id;

  // 5. Set file permissions to allow public access
  await driveClient['makeRequest'](
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    }
  );

  // 6. Return shareable URL optimized for embedding
  // As of Jan 2024, Google Drive requires /thumbnail endpoint for embedding
  // sz parameter: w{width} or w{width}-h{height}, max recommended: w2000
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
}

/**
 * Get or create the "RiteMark Images" folder in Google Drive
 * @returns Folder ID
 */
async function getImagesFolder(): Promise<string> {
  // Search for existing folder
  const query = `name='${IMAGES_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchResponse = await driveClient.listFiles({
    q: query,
    pageSize: 1,
  });

  // Return existing folder if found
  if (searchResponse.files && searchResponse.files.length > 0) {
    return searchResponse.files[0].id;
  }

  // Create new folder if not found
  const createResponse = (await driveClient['makeRequest'](
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: IMAGES_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  )) as DriveFile;

  return createResponse.id;
}

/**
 * Compress image file using browser-image-compression
 * @param file - Original image file
 * @returns Compressed file (WebP format, max 1MB)
 */
async function compressImage(file: File): Promise<File> {
  try {
    const imageCompression = (await import('browser-image-compression')).default;

    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.85,
      exifOrientation: 1,
    });
  } catch (error) {
    console.error('Compression failed, using original file:', error);
    return file;
  }
}

/**
 * Convert File to base64 string
 * @param file - File to convert
 * @returns Base64 encoded string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
