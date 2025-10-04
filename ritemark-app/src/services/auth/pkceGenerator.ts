/**
 * PKCE (Proof Key for Code Exchange) Generator
 * Implements OAuth 2.0 PKCE with S256 challenge method
 * Sprint 7: Google OAuth Security Implementation
 */

import type { PKCEChallenge } from '../../types/auth';

export class PKCEGenerator {
  /**
   * Generate a cryptographically secure random string
   * @param length - Length of the random string (128 recommended)
   * @returns Base64URL-encoded random string
   */
  private generateSecureRandom(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Base64URL encode (without padding)
   * @param buffer - ArrayBuffer or Uint8Array to encode
   * @returns Base64URL-encoded string
   */
  private base64URLEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate SHA-256 hash of the code verifier
   * @param codeVerifier - The code verifier string
   * @returns Base64URL-encoded SHA-256 hash
   */
  private async sha256(codeVerifier: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    return crypto.subtle.digest('SHA-256', data);
  }

  /**
   * Generate complete PKCE challenge for OAuth flow
   * @returns PKCEChallenge object with verifier and challenge
   */
  async generateChallenge(): Promise<PKCEChallenge> {
    // Generate cryptographically secure random code verifier (128 bytes = 43-128 chars base64url)
    const codeVerifier = this.generateSecureRandom(96);

    // Create SHA-256 hash of the verifier
    const digest = await this.sha256(codeVerifier);

    // Base64URL encode the hash
    const codeChallenge = this.base64URLEncode(digest);

    return {
      codeVerifier,
      codeChallenge,
      method: 'S256',
    };
  }

  /**
   * Validate PKCE challenge format
   * @param challenge - PKCEChallenge to validate
   * @returns true if valid, false otherwise
   */
  validateChallenge(challenge: PKCEChallenge): boolean {
    if (!challenge.codeVerifier || !challenge.codeChallenge) {
      return false;
    }

    if (challenge.method !== 'S256') {
      return false;
    }

    // Verify base64url format (alphanumeric, -, _)
    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    if (!base64UrlPattern.test(challenge.codeVerifier) ||
        !base64UrlPattern.test(challenge.codeChallenge)) {
      return false;
    }

    // Verify minimum length requirements
    if (challenge.codeVerifier.length < 43 || challenge.codeVerifier.length > 128) {
      return false;
    }

    if (challenge.codeChallenge.length !== 43) {
      return false;
    }

    return true;
  }

  /**
   * Generate secure random state parameter for CSRF protection
   * @returns Random state string
   */
  generateState(): string {
    return this.generateSecureRandom(32);
  }
}

export const pkceGenerator = new PKCEGenerator();
