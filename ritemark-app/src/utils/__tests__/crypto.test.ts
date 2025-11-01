/**
 * Web Crypto API Tests
 * Token Encryption Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateEncryptionKey,
  encryptData,
  decryptData,
  encryptToken,
  decryptToken,
} from '../crypto';

describe('Web Crypto API Utilities', () => {
  describe('generateEncryptionKey', () => {
    it('should generate a non-extractable AES-256-GCM key', async () => {
      const key = await generateEncryptionKey();

      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.type).toBe('secret');
      expect(key.extractable).toBe(false); // Non-extractable for security
      expect(key.algorithm.name).toBe('AES-GCM');
      expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt a string successfully', async () => {
      const plaintext = 'my-secret-refresh-token-12345';
      const key = await generateEncryptionKey();

      // Encrypt
      const encrypted = await encryptData(plaintext, key);
      expect(encrypted.encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv.length).toBe(12); // 12 bytes for GCM mode

      // Decrypt
      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt with wrong key', async () => {
      const plaintext = 'secret-data';
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();

      const encrypted = await encryptData(plaintext, key1);

      // Attempting to decrypt with different key should throw
      await expect(decryptData(encrypted, key2)).rejects.toThrow(
        'Failed to decrypt data'
      );
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = 'same-text';
      const key = await generateEncryptionKey();

      const encrypted1 = await encryptData(plaintext, key);
      const encrypted2 = await encryptData(plaintext, key);

      // Different IVs should produce different ciphertexts
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
      expect(encrypted1.encrypted).not.toEqual(encrypted2.encrypted);

      // But both should decrypt to same plaintext
      expect(await decryptData(encrypted1, key)).toBe(plaintext);
      expect(await decryptData(encrypted2, key)).toBe(plaintext);
    });
  });

  describe('encryptToken and decryptToken', () => {
    it('should encrypt and decrypt a token', async () => {
      const token = 'ya29.a0AfH6SMBx...'; // Simulated Google OAuth token

      const { encrypted, iv, key } = await encryptToken(token);

      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(key).toBeInstanceOf(CryptoKey);

      const decrypted = await decryptToken(encrypted, iv, key);
      expect(decrypted).toBe(token);
    });

    it('should handle long tokens (512 characters)', async () => {
      const longToken = 'x'.repeat(512);

      const { encrypted, iv, key } = await encryptToken(longToken);
      const decrypted = await decryptToken(encrypted, iv, key);

      expect(decrypted).toBe(longToken);
      expect(decrypted.length).toBe(512);
    });

    it('should handle special characters in tokens', async () => {
      const specialToken = 'token-with-special_chars.~!@#$%^&*()+=[]{}|;:"<>?,/';

      const { encrypted, iv, key } = await encryptToken(specialToken);
      const decrypted = await decryptToken(encrypted, iv, key);

      expect(decrypted).toBe(specialToken);
    });
  });
});
