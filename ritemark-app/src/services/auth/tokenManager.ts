/**
 * Token Manager - Secure OAuth Token Storage and Refresh
 * Sprint 7: Google OAuth Implementation
 */

import type { OAuthTokens, TokenRefreshResult, AuthError } from '../../types/auth';
import { AUTH_ERRORS, OAUTH_SCOPE_VERSION } from '../../types/auth';

const STORAGE_KEYS = {
  TOKENS: 'ritemark_oauth_tokens',
  TOKEN_EXPIRY: 'ritemark_token_expiry',
  REFRESH_TOKEN: 'ritemark_refresh_token',
  SCOPE_VERSION: 'ritemark_scope_version', // Track scope version for re-auth
} as const;

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export class TokenManager {
  /**
   * Check if stored tokens have the latest scope version
   * Force re-authorization when scopes change
   * @returns true if re-authorization required
   */
  private requiresReauthorization(): boolean {
    const storedVersion = sessionStorage.getItem(STORAGE_KEYS.SCOPE_VERSION);
    const currentVersion = String(OAUTH_SCOPE_VERSION);

    if (!storedVersion || storedVersion !== currentVersion) {
      console.warn(
        `🔄 Scope version changed (stored: ${storedVersion}, current: ${currentVersion}). Re-authorization required.`
      );
      return true;
    }

    return false;
  }

  /**
   * Check tokens and clear if scope version outdated
   * Force re-auth when drive.appdata scope added
   * @returns true if tokens were cleared
   */
  checkAndClearOutdatedTokens(): boolean {
    if (this.requiresReauthorization()) {
      console.log('🗑️  Clearing outdated tokens - new scopes require re-authorization');
      this.clearTokens();
      return true;
    }
    return false;
  }

  /**
   * Store OAuth tokens securely in sessionStorage
   * Note: Production should use httpOnly cookies, this is for development
   * @param tokens - OAuth tokens to store
   */
  async storeTokens(tokens: OAuthTokens): Promise<void> {
    try {
      // Store access token and metadata
      const tokenData = {
        accessToken: tokens.accessToken || tokens.access_token,
        idToken: tokens.idToken || tokens.id_token,
        tokenType: tokens.tokenType || tokens.token_type,
        scope: tokens.scope,
        expiresAt: tokens.expiresAt || (tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined),
      };

      sessionStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokenData));

      // Store refresh token separately (if available)
      const refreshToken = tokens.refreshToken || tokens.refresh_token;
      if (refreshToken) {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }

      // Store scope version (Track scope changes for re-auth)
      sessionStorage.setItem(STORAGE_KEYS.SCOPE_VERSION, String(OAUTH_SCOPE_VERSION));

      // Verify and log scope from token response (Validate drive.appdata)
      if (tokens.scope) {
        const hasAppDataScope = tokens.scope.includes('drive.appdata');
        const hasFileScope = tokens.scope.includes('drive.file');
        console.log(`✅ OAuth scopes granted:`, {
          'drive.file': hasFileScope,
          'drive.appdata': hasAppDataScope,
          full: tokens.scope,
        });

        if (!hasAppDataScope) {
          console.warn('⚠️  drive.appdata scope not granted - cross-device sync unavailable');
        }
      }

      // Set up automatic refresh timer
      if (tokenData.expiresAt) {
        this.scheduleTokenRefresh(tokenData.expiresAt);
      }
    } catch (_error) {
      console.error('Failed to store tokens:', _error);
      throw this.createStorageError('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve access token with automatic expiry validation
   * @returns Access token or null if expired/missing
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const tokenData = sessionStorage.getItem(STORAGE_KEYS.TOKENS);
      if (!tokenData) {
        return null;
      }

      const tokens: Partial<OAuthTokens> = JSON.parse(tokenData);

      // Check if token is expired
      if (tokens.expiresAt && tokens.expiresAt <= Date.now()) {
        console.warn('Access token expired, attempting refresh');
        const refreshResult = await this.refreshAccessToken();
        return refreshResult.success ? refreshResult.tokens?.accessToken || null : null;
      }

      // Return access token (check both snake_case and camelCase for compatibility)
      return tokens.accessToken || tokens.access_token || null;
    } catch (_error) {
      console.error('Failed to retrieve access token:', _error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   * @returns Refresh token or null if not available
   */
  getRefreshToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if access token is expired or expiring soon
   * @returns true if token needs refresh
   */
  isTokenExpired(): boolean {
    try {
      const tokenData = sessionStorage.getItem(STORAGE_KEYS.TOKENS);
      if (!tokenData) {
        return true;
      }

      const tokens: Partial<OAuthTokens> = JSON.parse(tokenData);
      if (!tokens.expiresAt) {
        return true;
      }

      // Consider token expired if it expires within the buffer period
      return tokens.expiresAt <= Date.now() + TOKEN_REFRESH_BUFFER;
    } catch (error) {
      return true;
    }
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation - new refresh token invalidates the old one
   * @returns TokenRefreshResult with new tokens or error
   */
  async refreshAccessToken(): Promise<TokenRefreshResult> {
    const refreshToken = this.getRefreshToken();
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
      // Get client ID from environment
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      // Exchange refresh token for new access token
      // Google OAuth endpoint: https://oauth2.googleapis.com/token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh failed:', errorData);

        // Clear invalid tokens
        this.clearTokens();

        throw new Error(errorData.error_description || 'Token refresh failed');
      }

      const tokenData = await response.json();

      // Build new tokens object
      const newTokens: OAuthTokens = {
        access_token: tokenData.access_token,
        accessToken: tokenData.access_token,
        token_type: tokenData.token_type,
        tokenType: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scope: tokenData.scope,
        // Google returns a new refresh token on rotation
        refresh_token: tokenData.refresh_token || refreshToken,
        refreshToken: tokenData.refresh_token || refreshToken,
      };

      // Store new tokens (this will schedule proactive refresh)
      await this.storeTokens(newTokens);

      console.log('✅ Token refreshed successfully, scheduled next refresh');

      return {
        success: true,
        tokens: newTokens,
      };
    } catch (error) {
      console.error('Token refresh error:', error);

      // Clear tokens on refresh failure
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
   * Schedule automatic token refresh before expiry
   * Proactive refresh: Runs 5 minutes before token expires
   * @param expiresAt - Token expiry timestamp
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    const refreshTime = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER;

    if (refreshTime > 0) {
      const minutes = Math.floor(refreshTime / 60000);
      console.log(`📅 Scheduled proactive token refresh in ${minutes} minutes`);

      setTimeout(async () => {
        console.log('⏰ Proactive token refresh triggered');
        const result = await this.refreshAccessToken();

        if (!result.success) {
          console.error('🚨 Proactive token refresh failed:', result.error);
          // Token refresh failure will clear tokens and user must re-authenticate
        }
      }, refreshTime);
    } else {
      console.warn('⚠️  Token already expired or expires soon, immediate refresh needed');
    }
  }

  /**
   * Refresh token if needed (reactive refresh)
   * Called before API requests to ensure token is valid
   * @returns Promise resolving to true if token is valid, false if refresh failed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    // Check if token is expired or expiring soon
    if (!this.isTokenExpired()) {
      return true; // Token is still valid
    }

    console.log('🔄 Token expired or expiring soon, refreshing...');

    // Attempt to refresh token
    const result = await this.refreshAccessToken();

    if (result.success) {
      console.log('✅ Reactive token refresh successful');
      return true;
    }

    console.error('❌ Reactive token refresh failed:', result.error);
    return false;
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    sessionStorage.removeItem(STORAGE_KEYS.TOKENS);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SCOPE_VERSION); // Clear scope version
  }

  /**
   * Get current token expiry time
   * @returns Expiry timestamp or null if no token
   */
  getTokenExpiry(): number | null {
    try {
      const tokenData = sessionStorage.getItem(STORAGE_KEYS.TOKENS);
      if (!tokenData) {
        return null;
      }

      const tokens: Partial<OAuthTokens> = JSON.parse(tokenData);
      return tokens.expiresAt || null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Create standardized auth error
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

export const tokenManager = new TokenManager();

// User identity storage interface
interface UserInfo {
  userId: string;      // Google user.sub - stable across devices
  email: string;       // For display only
  createdAt: number;   // Timestamp
}

// Add USER_INFO key
const USER_INFO_KEY = 'ritemark_user_info';

// User identity methods
export const userIdentityManager = {
  /**
   * Store user identity information
   * Used for rate limiting and cross-device sync
   * @param userId - Google user.sub (stable user ID)
   * @param email - User email (for display only)
   */
  storeUserInfo(userId: string, email: string): void {
    try {
      const userInfo: UserInfo = {
        userId,
        email,
        createdAt: Date.now(),
      };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      console.log('✅ User identity stored:', { userId, email });
    } catch (error) {
      console.error('Failed to store user info:', error);
    }
  },

  /**
   * Retrieve user identity information
   * @returns User info or null if not found
   */
  getUserInfo(): UserInfo | null {
    try {
      const userInfoStr = localStorage.getItem(USER_INFO_KEY);
      if (!userInfoStr) {
        return null;
      }
      return JSON.parse(userInfoStr) as UserInfo;
    } catch (error) {
      console.error('Failed to retrieve user info:', error);
      return null;
    }
  },

  /**
   * Clear user identity on logout
   */
  clearUserInfo(): void {
    localStorage.removeItem(USER_INFO_KEY);
    console.log('🗑️  User identity cleared');
  }
};
