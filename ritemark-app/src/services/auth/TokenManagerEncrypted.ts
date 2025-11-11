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
import { reportError } from '../../utils/errorReporter';

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
   *
   * Sprint 26 Fix: Check if backend is available before attempting token refresh.
   * Browser-only OAuth (localhost:5173) has NO backend, so refresh will always fail.
   * Don't attempt refresh if no backend - just return null and let user re-authenticate.
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      console.warn('[TokenManager] ❌ No access token in memory');
      return null;
    }

    // Check if token is expired
    if (this.accessTokenExpiry && this.accessTokenExpiry <= Date.now()) {
      console.log('[TokenManager] 🔄 Access token expired, checking backend availability...');

      // Sprint 26 Fix: Check if backend is available before attempting refresh
      // Browser-only OAuth has no refresh capability - tokens expire in 1 hour
      const backendAvailable = await this.checkBackendAvailable();

      if (!backendAvailable) {
        console.warn('[TokenManager] ❌ Browser-only OAuth detected - no backend refresh available');
        console.warn('[TokenManager] 🚪 User must re-authenticate manually');
        return null; // Will trigger logout and re-authentication dialog
      }

      console.log('[TokenManager] ✅ Backend available, attempting token refresh');
      const refreshResult = await this.refreshAccessToken();

      console.log('[TokenManager] 🔍 Token refresh result', {
        success: refreshResult.success,
        hasNewToken: !!refreshResult.tokens?.accessToken,
        error: refreshResult.error?.message || null,
        newExpiresAt: refreshResult.tokens?.expiresAt ? new Date(refreshResult.tokens.expiresAt).toISOString() : null
      });

      if (!refreshResult.success) {
        console.error('[TokenManager] ❌ Token refresh failed, reporting error');
        reportError(
          new Error(refreshResult.error?.message || 'Token refresh failed'),
          'TokenManagerEncrypted.getAccessToken'
        );
      } else {
        console.log('[TokenManager] ✅ Token refreshed successfully');
      }

      return refreshResult.success ? refreshResult.tokens?.accessToken || null : null;
    }

    // Token is valid - return silently (no log spam)
    return this.accessToken;
  }

  /**
   * Check if backend is available for token refresh
   *
   * Sprint 26: Browser-only OAuth (localhost:5173) has no backend.
   * Don't attempt refresh if backend is unavailable.
   */
  private async checkBackendAvailable(): Promise<boolean> {
    console.log('[TokenManager] 🔍 Checking backend availability...');

    try {
      // Quick health check to refresh-token endpoint
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'HEAD', // Lightweight check, no body
      });

      // Sprint 27 Fix: 405 Method Not Allowed means endpoint exists but HEAD not supported
      // This is VALID - backend refresh endpoint exists, it just requires POST
      const isAvailable = response.ok || response.status === 401 || response.status === 403 || response.status === 405;

      console.log('[TokenManager] 🔍 Backend health check result', {
        available: isAvailable,
        status: response.status,
        statusText: response.statusText,
        endpoint: '/.netlify/functions/refresh-token',
        interpretation: response.status === 405 ? 'Backend exists (requires POST)' : 'Normal response'
      });

      // Backend is available if we get any valid response (even 401/403/405)
      // We just need to know the endpoint exists
      return isAvailable;
    } catch (error) {
      // Network error means no backend
      console.warn('[TokenManager] ❌ Backend health check failed:', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error
      });
      return false;
    }
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
      console.error('[TokenManager] Failed to retrieve refresh token:', error);
      if (error instanceof Error) {
        reportError(error, 'TokenManagerEncrypted.getRefreshToken');
      }
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
    console.log('[TokenManager] 🔄 Calling backend refresh endpoint...', {
      userId: userId,
      endpoint: '/.netlify/functions/refresh-token',
      method: 'POST'
    });

    try {
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      console.log('[TokenManager] 🔍 Backend response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[TokenManager] ❌ Backend refresh failed', {
          status: response.status,
          error: errorData.error || 'Unknown error',
          message: errorData.message || 'No message',
          errorData: errorData
        });

        // Check if refresh token expired (re-auth required)
        if (errorData.error === 'refresh_token_not_found' || errorData.error === 'refresh_token_expired') {
          console.warn('[TokenManager] 🚪 Refresh token expired/not found, clearing tokens');
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

      console.log('[TokenManager] 🔍 Backend returned new token', {
        hasAccessToken: !!tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      });

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
      this.accessToken = newTokens.accessToken ?? null;
      this.accessTokenExpiry = newTokens.expiresAt ?? null;

      // Schedule next refresh
      if (newTokens.expiresAt) {
        this.scheduleTokenRefresh(newTokens.expiresAt);
      }

      console.log('[TokenManager] ✅ Backend refresh successful - new token stored in memory');

      return { success: true, tokens: newTokens };
    } catch (error) {
      console.error('[TokenManager] ❌ Backend refresh error:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      });
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
    console.log('[TokenManager] 🔄 refreshAccessToken() called - starting token refresh process');

    // Check if backend is available
    const { checkBackendHealth } = await import('../../utils/backendHealth');
    const backendAvailable = await checkBackendHealth();

    console.log('[TokenManager] 🔍 Backend health check result', {
      backendAvailable: backendAvailable,
      willTryBackend: backendAvailable
    });

    if (backendAvailable) {
      // Try backend refresh first (6-month sessions)
      console.log('[TokenManager] 🔄 Backend available, using server-side refresh');

      // Get user ID for backend refresh
      const { userIdentityManager } = await import('./tokenManager');
      const userInfo = userIdentityManager.getUserInfo();

      console.log('[TokenManager] 🔍 User ID retrieval', {
        foundUserInfo: !!userInfo,
        userId: userInfo?.userId || 'NOT FOUND',
        willProceed: !!userInfo?.userId
      });

      if (userInfo?.userId) {
        console.log('[TokenManager] 🔄 Attempting backend refresh with userId:', userInfo.userId);
        const result = await this.refreshAccessTokenViaBackend(userInfo.userId);

        if (result.success) {
          console.log('[TokenManager] ✅ Backend refresh succeeded');
          return result;
        }

        console.warn('[TokenManager] ⚠️  Backend refresh failed, falling back to browser-only', {
          error: result.error?.message
        });
      } else {
        console.warn('[TokenManager] ⚠️  No user ID found, falling back to browser-only');
      }
    } else {
      console.log('[TokenManager] ⚠️  Backend unavailable, using browser-only refresh');
    }

    // Fallback to browser-only refresh (Sprint 19)
    console.log('[TokenManager] 🔄 Attempting browser-only refresh (fallback)');
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
    // Log token clearing event (critical for debugging logout issues)
    console.warn('[TokenManager] clearTokens() called - user will be logged out');

    // Report to AI monitoring with stack trace to see where it was called from
    const clearEvent = new Error('Tokens cleared - user logged out');
    reportError(clearEvent, 'TokenManagerEncrypted.clearTokens');

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
        console.error('[TokenManager] Failed to clear IndexedDB tokens:', error);
      });
    }).catch(error => {
      console.error('[TokenManager] Failed to init DB for token clearing:', error);
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
