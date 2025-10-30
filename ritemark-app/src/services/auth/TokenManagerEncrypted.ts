/**
 * Token Manager with IndexedDB Encryption
 * Encrypted Token Storage
 *
 * Security Architecture:
 * - Refresh tokens: Encrypted in IndexedDB (AES-256-GCM)
 * - Access tokens: Memory only (never persisted)
 * - Encryption key: Non-extractable CryptoKey (browser-bound)
 */

import type { OAuthTokens, TokenRefreshResult, AuthError } from '../../types/auth';
import { AUTH_ERRORS, OAUTH_SCOPE_VERSION } from '../../types/auth';
import { encryptToken, decryptToken } from '../../utils/crypto';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'ritemark-tokens';
const DB_VERSION = 1;
const STORE_NAME = 'tokens';
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// Storage keys
const STORAGE_KEYS = {
  SCOPE_VERSION: 'ritemark_scope_version', // Track scope version for re-auth
} as const;

interface StoredTokenData {
  encryptedRefreshToken: Uint8Array;
  iv: Uint8Array;
  encryptionKey: CryptoKey;
  expiresAt: number;
  tokenType: string;
  scope?: string;
  createdAt: number;
}

export class TokenManagerEncrypted {
  private db: IDBPDatabase | null = null;
  private accessToken: string | null = null; // Memory only - never persisted
  private accessTokenExpiry: number | null = null;
  private _idToken: string | null = null; // Memory only (reserved for future use)

  /**
   * Initialize IndexedDB connection
   */
  private async initDB(): Promise<IDBPDatabase> {
    if (this.db) {
      return this.db;
    }

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create tokens object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });

    // Request persistent storage
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }

    return this.db;
  }

  /**
   * Store OAuth tokens securely
   * - Access token: Stored in MEMORY only
   * - Refresh token: Encrypted in IndexedDB
   */
  async storeTokens(tokens: OAuthTokens): Promise<void> {
    try {
      const db = await this.initDB();

      // Store access token in MEMORY only
      this.accessToken = tokens.accessToken || tokens.access_token || null;
      this._idToken = tokens.idToken || tokens.id_token || null;
      this.accessTokenExpiry = tokens.expiresAt ||
        (tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null);

      // Encrypt and store refresh token in IndexedDB
      const refreshToken = tokens.refreshToken || tokens.refresh_token;
      if (refreshToken) {
        const { encrypted, iv, key } = await encryptToken(refreshToken);

        const tokenData: StoredTokenData = {
          encryptedRefreshToken: encrypted,
          iv,
          encryptionKey: key,
          expiresAt: this.accessTokenExpiry || 0,
          tokenType: tokens.tokenType || tokens.token_type || 'Bearer',
          scope: tokens.scope,
          createdAt: Date.now(),
        };

        await db.put(STORE_NAME, tokenData, 'current');

        // Store scope version for re-authorization detection
        sessionStorage.setItem(STORAGE_KEYS.SCOPE_VERSION, String(OAUTH_SCOPE_VERSION));
      } else {
        console.warn('No refresh token provided - only access token stored in memory');
      }

      // Schedule automatic token refresh
      if (this.accessTokenExpiry) {
        this.scheduleTokenRefresh(this.accessTokenExpiry);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw this.createStorageError('Failed to store authentication tokens');
    }
  }

  /**
   * Get access token from memory
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    // Check if token is expired
    if (this.accessTokenExpiry && this.accessTokenExpiry <= Date.now()) {
      const refreshResult = await this.refreshAccessToken();
      return refreshResult.success ? refreshResult.tokens?.accessToken || null : null;
    }

    return this.accessToken;
  }

  /**
   * Get refresh token from IndexedDB (decrypted)
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const db = await this.initDB();
      const tokenData = await db.get(STORE_NAME, 'current') as StoredTokenData | undefined;

      if (!tokenData) {
        return null;
      }

      // Decrypt refresh token
      const refreshToken = await decryptToken(
        tokenData.encryptedRefreshToken,
        tokenData.iv,
        tokenData.encryptionKey
      );

      return refreshToken;
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.accessToken || !this.accessTokenExpiry) {
      return true;
    }
    return this.accessTokenExpiry <= Date.now() + TOKEN_REFRESH_BUFFER;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<TokenRefreshResult> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      return {
        success: false,
        error: this.createAuthError(
          AUTH_ERRORS.REFRESH_FAILED,
          'No refresh token available',
          true
        ),
      };
    }

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh failed:', errorData);
        this.clearTokens();
        throw new Error(errorData.error_description || 'Token refresh failed');
      }

      const tokenData = await response.json();

      const newTokens: OAuthTokens = {
        access_token: tokenData.access_token,
        accessToken: tokenData.access_token,
        token_type: tokenData.token_type,
        tokenType: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scope: tokenData.scope,
        refresh_token: tokenData.refresh_token || refreshToken,
        refreshToken: tokenData.refresh_token || refreshToken,
      };

      await this.storeTokens(newTokens);

      return { success: true, tokens: newTokens };
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();

      return {
        success: false,
        error: this.createAuthError(
          AUTH_ERRORS.REFRESH_FAILED,
          error instanceof Error ? error.message : 'Token refresh failed',
          true
        ),
      };
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    const refreshTime = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER;

    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshAccessToken().catch((error) => {
          console.error('Auto-refresh failed:', error);
        });
      }, refreshTime);
    }
  }

  /**
   * Check if stored tokens have the latest scope version
   * Force re-authorization when scopes change
   * @returns true if re-authorization required
   */
  private requiresReauthorization(): boolean {
    const storedVersion = sessionStorage.getItem(STORAGE_KEYS.SCOPE_VERSION);
    const currentVersion = String(OAUTH_SCOPE_VERSION);

    if (!storedVersion || storedVersion !== currentVersion) {
      return true;
    }

    return false;
  }

  /**
   * Check tokens and clear if scope version outdated
   * Force re-auth when scopes change
   * @returns true if tokens were cleared
   */
  checkAndClearOutdatedTokens(): boolean {
    if (this.requiresReauthorization()) {
      this.clearTokens();
      return true;
    }
    return false;
  }

  /**
   * Clear all tokens (synchronous for backward compatibility)
   */
  clearTokens(): void {
    // Clear memory immediately
    this.accessToken = null;
    this._idToken = null;
    this.accessTokenExpiry = null;

    // Clear scope version
    sessionStorage.removeItem(STORAGE_KEYS.SCOPE_VERSION);

    // Clear IndexedDB asynchronously (fire-and-forget)
    this.initDB().then(db => {
      db.delete(STORE_NAME, 'current').catch(error => {
        console.error('Failed to clear IndexedDB tokens:', error);
      });
    }).catch(error => {
      console.error('Failed to init DB for token clearing:', error);
    });
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(): number | null {
    return this.accessTokenExpiry;
  }

  /**
   * Get ID token (reserved for future use)
   */
  getIdToken(): string | null {
    return this._idToken;
  }

  /**
   * Create auth error
   */
  private createAuthError(code: string, message: string, recoverable: boolean): AuthError {
    return {
      code,
      message,
      retryable: recoverable,
      recoverable,
    };
  }

  /**
   * Create storage error
   */
  private createStorageError(message: string): AuthError {
    return {
      code: AUTH_ERRORS.STORAGE_ERROR,
      message,
      retryable: false,
      recoverable: false,
    };
  }
}

export const tokenManagerEncrypted = new TokenManagerEncrypted();
