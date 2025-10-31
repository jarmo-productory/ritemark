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
  private refreshTimerId: number | null = null; // Auto-refresh timer ID

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
        localStorage.setItem(STORAGE_KEYS.SCOPE_VERSION, String(OAUTH_SCOPE_VERSION));
      }
      // Note: No refresh token in browser-only OAuth (Sprint 19) - this is expected

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
   * Refresh access token via backend (Sprint 20 - Phase 0)
   * Uses Netlify Function for 6-month sessions with server-side refresh tokens
   */
  private async refreshAccessTokenViaBackend(userId: string): Promise<TokenRefreshResult> {
    try {
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[TokenManager] Backend refresh failed:', errorData);

        // Check if refresh token expired (re-auth required)
        if (errorData.error === 'refresh_token_not_found' || errorData.error === 'refresh_token_expired') {
          this.clearTokens();
          return {
            success: false,
            error: this.createAuthError(
              AUTH_ERRORS.REFRESH_FAILED,
              'Session expired. Please sign in again.',
              true
            ),
          };
        }

        throw new Error(errorData.message || 'Backend token refresh failed');
      }

      const tokenData = await response.json();

      // Backend returns only access token (refresh token stays server-side)
      const newTokens: OAuthTokens = {
        access_token: tokenData.access_token,
        accessToken: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        tokenType: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      };

      // Store new access token (no refresh token - stays server-side)
      this.accessToken = newTokens.accessToken;
      this.accessTokenExpiry = newTokens.expiresAt;

      // Schedule next refresh
      if (newTokens.expiresAt) {
        this.scheduleTokenRefresh(newTokens.expiresAt);
      }

      console.log('[TokenManager] Backend refresh successful');

      return { success: true, tokens: newTokens };
    } catch (error) {
      console.error('[TokenManager] Backend refresh error:', error);
      return {
        success: false,
        error: this.createAuthError(
          AUTH_ERRORS.REFRESH_FAILED,
          error instanceof Error ? error.message : 'Backend token refresh failed',
          true
        ),
      };
    }
  }

  /**
   * Refresh access token (browser-only fallback)
   * Sprint 19: Direct Google OAuth refresh (if no backend)
   */
  private async refreshAccessTokenBrowserOnly(): Promise<TokenRefreshResult> {
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

      console.log('[TokenManager] Browser-only refresh successful');

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
   * Refresh access token with automatic backend/browser-only fallback
   * Sprint 20: Try backend first, fall back to browser-only
   */
  async refreshAccessToken(): Promise<TokenRefreshResult> {
    // Check if backend is available
    const { checkBackendHealth } = await import('../../utils/backendHealth');
    const backendAvailable = await checkBackendHealth();

    if (backendAvailable) {
      // Try backend refresh first (6-month sessions)
      console.log('[TokenManager] Backend available, using server-side refresh');

      // Get user ID for backend refresh
      const { userIdentityManager } = await import('./tokenManager');
      const userInfo = userIdentityManager.getUserInfo();

      if (userInfo?.userId) {
        const result = await this.refreshAccessTokenViaBackend(userInfo.userId);

        if (result.success) {
          return result;
        }

        console.warn('[TokenManager] Backend refresh failed, falling back to browser-only');
      } else {
        console.warn('[TokenManager] No user ID found, falling back to browser-only');
      }
    } else {
      console.log('[TokenManager] Backend unavailable, using browser-only refresh');
    }

    // Fallback to browser-only refresh (Sprint 19)
    return this.refreshAccessTokenBrowserOnly();
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    // Clear existing timer if any
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    const refreshTime = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER;

    if (refreshTime > 0) {
      this.refreshTimerId = setTimeout(() => {
        this.refreshAccessToken().catch((error) => {
          console.error('Auto-refresh failed:', error);
        });
      }, refreshTime) as unknown as number;
    }
  }

  /**
   * Check if stored tokens have the latest scope version
   * Force re-authorization when scopes change
   * @returns true if re-authorization required
   */
  private requiresReauthorization(): boolean {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.SCOPE_VERSION);
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

    // Clear auto-refresh timer
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    // Clear scope version
    localStorage.removeItem(STORAGE_KEYS.SCOPE_VERSION);

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
