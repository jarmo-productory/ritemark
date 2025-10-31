/**
 * Google OAuth 2.0 Service with PKCE Flow
 * Sprint 7: Google OAuth Implementation
 * Sprint 19: Token encryption + user identity extraction
 *
 * ARCHITECTURE NOTE (Sprint 19):
 * ================================
 * This service contains TWO OAuth flow implementations:
 *
 * 1. **ACTIVE (Sprint 19)**: getUserInfo() - Used by WelcomeScreen.tsx
 *    - Extracts user.sub from Google userinfo endpoint
 *    - Called AFTER Google Identity Services (GIS) tokenClient provides access token
 *    - Browser-only OAuth flow (no refresh tokens)
 *
 * 2. **FUTURE (Sprint 20)**: Authorization Code Flow methods - NOT YET WIRED
 *    - initiateOAuthFlow() - Generates authorization URL
 *    - handleCallback() - Processes OAuth callback
 *    - exchangeCodeForTokens() - Exchanges code for tokens (requires Netlify Functions backend)
 *    - These methods are SCAFFOLDING for Sprint 20 backend implementation
 *    - Will enable 6-month sessions with refresh tokens
 *
 * SPRINT 20 MIGRATION PATH:
 * - WelcomeScreen will detect backend availability (Netlify Functions)
 * - If backend available → Authorization Code Flow (this service)
 * - If backend unavailable → GIS tokenClient (current Sprint 19 path)
 *
 * See: /docs/sprints/sprint-20/README.md for backend implementation details
 */

import type {
  GoogleUser,
  OAuthTokens,
  AuthResult,
  OAuthConfig,
  OAuthCallbackParams,
  OAuthState,
  AuthError,
} from '../../types/auth';
import { OAUTH_SCOPES, AUTH_ERRORS } from '../../types/auth';
import { PKCEGenerator } from './pkceGenerator';
import { TokenManagerEncrypted } from './TokenManagerEncrypted';

const OAUTH_STATE_KEY = 'ritemark_oauth_state';

export class GoogleAuth {
  private clientId: string;
  private redirectUri: string;
  private scopes: string[];
  private pkceGenerator: PKCEGenerator;
  private tokenManager: TokenManagerEncrypted;

  constructor(config: OAuthConfig) {
    // Validate required config (unless mock mode)
    if (!config.clientId && !config.useMockOAuth) {
      throw new Error('Google OAuth client ID is required')
    }

    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.scopes = config.scopes || [...OAUTH_SCOPES];
    this.pkceGenerator = new PKCEGenerator();
    this.tokenManager = new TokenManagerEncrypted();

    // Initialize: Check for stored refresh token and attempt to restore session
    this.initializeWithStoredTokens().catch((error) => {
      console.warn('Failed to initialize with stored tokens:', error);
    });
  }

  /**
   * Initialize authentication with stored refresh token (if available)
   * Attempts to restore session on app load
   * Token persistence across browser restarts
   */
  private async initializeWithStoredTokens(): Promise<void> {
    const refreshToken = await this.tokenManager.getRefreshToken();

    if (!refreshToken) {
      console.log('📭 No stored refresh token found');
      return;
    }

    console.log('🔄 Found stored refresh token, attempting to restore session...');

    // Check if tokens are expired
    if (!this.tokenManager.isTokenExpired()) {
      console.log('✅ Existing tokens still valid');
      return;
    }

    // Token expired, try to refresh
    const result = await this.tokenManager.refreshAccessToken();

    if (result.success) {
      console.log('✅ Session restored with stored refresh token');
    } else {
      console.warn('❌ Failed to restore session, user must re-authenticate');
      this.tokenManager.clearTokens();
    }
  }

  /**
   * Initiate OAuth 2.0 login flow with PKCE
   * Returns authorization URL and redirects user to Google OAuth consent screen
   */
  async login(): Promise<string> {
    try {
      // Generate PKCE challenge
      const pkceChallenge = await this.pkceGenerator.generateChallenge();

      // Generate state parameter for CSRF protection
      const state = this.pkceGenerator.generateState();

      // Store state and code verifier for callback validation
      const oauthState: OAuthState = {
        state,
        codeVerifier: pkceChallenge.codeVerifier,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(oauthState));

      // Build OAuth authorization URL
      const authUrl = this.buildAuthorizationUrl(state, pkceChallenge.codeChallenge);

      // Redirect to Google OAuth (in browser, not in tests)
      if (typeof window !== 'undefined' && !this.isTestEnvironment()) {
        window.location.href = authUrl;
      }

      // Return URL for testing
      return authUrl;
    } catch (error) {
      console.error('OAuth login failed:', error);
      throw this.createAuthError(
        AUTH_ERRORS.CONFIGURATION_ERROR,
        'Failed to initiate OAuth flow',
        false
      );
    }
  }

  /**
   * Check if running in test environment
   */
  private isTestEnvironment(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  }

  /**
   * Handle OAuth callback after user authorization
   * @param params - Callback URL parameters
   * @returns AuthResult with user and tokens
   */
  async handleCallback(params: OAuthCallbackParams): Promise<AuthResult> {
    try {
      // Check for OAuth error in callback
      if (params.error) {
        return this.handleOAuthError(params.error, params.error_description);
      }

      // Validate authorization code and state
      if (!params.code || !params.state) {
        throw this.createAuthError(
          AUTH_ERRORS.INVALID_CODE,
          'Missing authorization code or state',
          true
        );
      }

      // Retrieve and validate stored state
      const storedState = this.getStoredState();
      if (!storedState || storedState.state !== params.state) {
        throw this.createAuthError(
          AUTH_ERRORS.INVALID_STATE,
          'State parameter mismatch - possible CSRF attack',
          false
        );
      }

      // Check state timestamp (max 10 minutes old)
      if (Date.now() - storedState.timestamp > 10 * 60 * 1000) {
        throw this.createAuthError(
          AUTH_ERRORS.INVALID_STATE,
          'OAuth state expired',
          true
        );
      }

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(
        params.code,
        storedState.codeVerifier
      );

      // Retrieve user profile
      const user = await this.getUserProfile(tokens.accessToken || tokens.access_token || '');

      // Store user identity (user.sub) for cross-device sync
      const { userIdentityManager } = await import('./tokenManager');
      userIdentityManager.storeUserInfo(user.id, user.email);

      // Store tokens securely
      await this.tokenManager.storeTokens(tokens);

      // Clean up OAuth state
      this.clearStoredState();

      return {
        success: true,
        user,
        tokens,
      };
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      this.clearStoredState();

      // Check if error is already an AuthError (has code, message, retryable, recoverable)
      const isAuthError = error && typeof error === 'object' && 'code' in error && 'message' in error && 'retryable' in error && 'recoverable' in error;

      return {
        success: false,
        error: isAuthError
          ? (error as AuthError)
          : this.createAuthError(
              AUTH_ERRORS.CONFIGURATION_ERROR,
              error instanceof Error ? error.message : 'OAuth callback failed',
              true
            ),
      };
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    this.tokenManager.clearTokens();
    this.clearStoredState();
  }

  /**
   * Get current access token
   * @returns Access token or null if not authenticated
   */
  async getAccessToken(): Promise<string | null> {
    return this.tokenManager.getAccessToken();
  }

  /**
   * Check if user is currently authenticated
   * Check scope version and force re-auth if outdated
   * @returns True if valid tokens exist, false otherwise
   */
  isAuthenticated(): boolean {
    // Check scope version first (Force re-auth if scopes changed)
    if (this.tokenManager.checkAndClearOutdatedTokens()) {
      return false; // Tokens cleared, user must re-authenticate
    }

    const tokens = sessionStorage.getItem('ritemark_oauth_tokens');
    return !!tokens;
  }

  /**
   * Build Google OAuth authorization URL
   */
  private buildAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen for refresh token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * Note: This requires backend implementation or @react-oauth/google library
   */
   
  private async exchangeCodeForTokens(
    _code: string,
    _codeVerifier: string
  ): Promise<OAuthTokens> {
    // TODO: Implement actual token exchange
    // This should be done via backend or using @react-oauth/google library
    // For development, this is a placeholder

    console.warn('Token exchange not fully implemented - using placeholder');

    // Placeholder response (in production, this would be a real API call)
    throw this.createAuthError(
      AUTH_ERRORS.CONFIGURATION_ERROR,
      'Token exchange requires backend implementation',
      false
    );
  }

  /**
   * Retrieve user profile from Google API
   * Extract stable user.sub for cross-device identity
   */
  private async getUserProfile(accessToken: string): Promise<GoogleUser> {
    try {
      // Use OpenID Connect endpoint to get user.sub (stable user ID)
      const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();

      // data.sub is the stable user ID (consistent across devices and sessions)
      return {
        id: data.sub,
        email: data.email,
        name: data.name,
        picture: data.picture,
        verified_email: data.email_verified || false,
        emailVerified: data.email_verified || false,
      };
    } catch (_error) {
      console.error('Failed to fetch user profile:', _error);
      throw this.createAuthError(
        AUTH_ERRORS.NETWORK_ERROR,
        'Failed to retrieve user profile',
        true
      );
    }
  }

  /**
   * Handle OAuth error from callback
   */
   
  private handleOAuthError(error: string, description?: string): AuthResult {
    const errorMap: Record<string, { code: string; recoverable: boolean }> = {
      access_denied: { code: AUTH_ERRORS.USER_CANCELLED, recoverable: true },
      invalid_request: { code: AUTH_ERRORS.CONFIGURATION_ERROR, recoverable: false },
      unauthorized_client: { code: AUTH_ERRORS.CONFIGURATION_ERROR, recoverable: false },
      unsupported_response_type: { code: AUTH_ERRORS.CONFIGURATION_ERROR, recoverable: false },
    };

    const errorInfo = errorMap[error] || {
      code: AUTH_ERRORS.CONFIGURATION_ERROR,
      recoverable: true,
    };

    return {
      success: false,
      error: {
        code: errorInfo.code,
        message: description || error,
        retryable: errorInfo.recoverable,
        recoverable: errorInfo.recoverable,
      },
    };
  }

  /**
   * Get stored OAuth state
   */
  private getStoredState(): OAuthState | null {
    try {
      const stateJson = sessionStorage.getItem(OAUTH_STATE_KEY);
      if (!stateJson) {
        return null;
      }
      return JSON.parse(stateJson);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear stored OAuth state
   */
  private clearStoredState(): void {
    sessionStorage.removeItem(OAUTH_STATE_KEY);
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
}

/**
 * Create GoogleAuth instance with environment configuration
 */
export function createGoogleAuth(): GoogleAuth {
  const config: OAuthConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || window.location.origin,
    scopes: [...OAUTH_SCOPES],
    useMockOAuth: import.meta.env.VITE_USE_MOCK_OAUTH === 'true',
  };

  if (!config.clientId && !config.useMockOAuth) {
    console.warn('Google Client ID not configured, OAuth will not work');
  }

  return new GoogleAuth(config);
}
