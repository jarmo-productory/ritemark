/**
 * Token Manager - Secure OAuth Token Storage and Refresh
 * Sprint 7: Google OAuth Implementation
 */

import type { OAuthTokens, TokenRefreshResult, AuthError } from '../../types/auth';
import { AUTH_ERRORS } from '../../types/auth';

const STORAGE_KEYS = {
  TOKENS: 'ritemark_oauth_tokens',
  TOKEN_EXPIRY: 'ritemark_token_expiry',
  REFRESH_TOKEN: 'ritemark_refresh_token',
} as const;

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export class TokenManager {
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
   * Note: This is a placeholder - actual implementation requires backend or Google OAuth library
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

    // TODO: Implement actual token refresh with Google OAuth
    // For now, return failure to trigger re-authentication
    console.warn('Token refresh not yet implemented, user must re-authenticate');
    return {
      success: false,
      error: this.createAuthError(
        AUTH_ERRORS.REFRESH_FAILED,
        'Token refresh requires re-authentication',
        true
      ),
    };
  }

  /**
   * Schedule automatic token refresh before expiry
   * @param expiresAt - Token expiry timestamp
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    const refreshTime = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER;

    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshAccessToken().catch((_error) => {
          console.error('Automatic token refresh failed:', _error);
        });
      }, refreshTime);
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    sessionStorage.removeItem(STORAGE_KEYS.TOKENS);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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
