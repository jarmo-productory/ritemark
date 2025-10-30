/**
 * Web Crypto API Utilities for Token Encryption
 * Token Encryption with AES-256-GCM
 *
 * Security Features:
 * - AES-256-GCM encryption (AEAD mode)
 * - Non-extractable CryptoKey (browser-bound)
 * - Unique IV per encryption operation
 * - Zero external dependencies
 */

export interface EncryptedData {
  encrypted: Uint8Array;
  iv: Uint8Array;
}

/**
 * Generate AES-256-GCM encryption key
 * Key is non-extractable (cannot be exported from browser)
 *
 * @returns CryptoKey for encryption/decryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // AES-256 for maximum security
    },
    false, // Non-extractable (key bound to browser)
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param data - Plaintext string to encrypt
 * @param key - CryptoKey for encryption
 * @returns Encrypted data with IV
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  // Generate unique IV (Initialization Vector) for this encryption
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes = 96 bits for GCM

  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);

  // Encrypt with AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );

  return {
    encrypted: new Uint8Array(encrypted),
    iv,
  };
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encryptedData - Encrypted data with IV
 * @param key - CryptoKey for decryption
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, corrupted data)
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  try {
    // Decrypt with AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encryptedData.iv,
      },
      key,
      encryptedData.encrypted
    );

    // Decode bytes to plaintext
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - key mismatch or corrupted data');
  }
}

/**
 * Encrypt token (convenience wrapper)
 * Automatically generates encryption key and encrypts token
 *
 * @param token - Token string to encrypt
 * @returns Encrypted token with IV and key
 */
export async function encryptToken(token: string): Promise<{
  encrypted: Uint8Array;
  iv: Uint8Array;
  key: CryptoKey;
}> {
  const key = await generateEncryptionKey();
  const { encrypted, iv } = await encryptData(token, key);

  return { encrypted, iv, key };
}

/**
 * Decrypt token (convenience wrapper)
 *
 * @param encrypted - Encrypted token bytes
 * @param iv - Initialization Vector
 * @param key - Encryption key
 * @returns Decrypted token string
 */
export async function decryptToken(
  encrypted: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey
): Promise<string> {
  return await decryptData({ encrypted, iv }, key);
}
