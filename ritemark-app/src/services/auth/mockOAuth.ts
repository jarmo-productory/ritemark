/**
 * Mock OAuth Service for Development and Testing
 * Sprint 7: Google OAuth Development
 */

import type { GoogleUser, OAuthTokens, AuthResult, OAuthCallbackParams } from '../../types/auth';

const MOCK_USER: GoogleUser = {
  id: 'mock-user-123',
  email: 'developer@ritemark.dev',
  name: 'RiteMark Developer',
  picture: 'https://via.placeholder.com/150',
  verified_email: true,
  emailVerified: true,
};

const MOCK_DELAY = 1000; // Simulate network delay

export class MockOAuth {
  /**
   * Simulate OAuth login flow
   * @returns Mock user after simulated delay
   */
  async login(): Promise<AuthResult> {
    console.log('[MockOAuth] Simulating login flow...');

    await this.simulateDelay();

    const tokens = this.generateMockTokens();

    return {
      success: true,
      user: MOCK_USER,
      tokens,
    };
  }

  /**
   * Simulate OAuth callback handling
   * @param params - Callback parameters
   * @returns Mock authentication result
   */
  async handleCallback(params: OAuthCallbackParams): Promise<AuthResult> {
    console.log('[MockOAuth] Simulating callback handling...', params);

    // Simulate error scenario
    if (params.error) {
      return {
        success: false,
        error: {
          code: params.error,
          message: params.error_description || 'Mock OAuth error',
          retryable: true,
          recoverable: true,
        },
      };
    }

    await this.simulateDelay();

    const tokens = this.generateMockTokens();

    return {
      success: true,
      user: MOCK_USER,
      tokens,
    };
  }

  /**
   * Simulate logout
   */
  async logout(): Promise<void> {
    console.log('[MockOAuth] Simulating logout...');
    await this.simulateDelay();
  }

  /**
   * Get mock access token
   * @returns Mock access token
   */
  async getAccessToken(): Promise<string> {
    return 'mock-access-token-' + Date.now();
  }

  /**
   * Generate mock OAuth tokens
   */
  private generateMockTokens(): OAuthTokens {
    const now = Date.now();
    const expiresIn = 3600; // 1 hour in seconds

    return {
      // Standard OAuth properties
      access_token: 'mock-access-token-' + now,
      refresh_token: 'mock-refresh-token-' + now,
      id_token: 'mock-id-token-' + now,
      expires_in: expiresIn,
      token_type: 'Bearer',
      scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      // Convenience aliases
      accessToken: 'mock-access-token-' + now,
      refreshToken: 'mock-refresh-token-' + now,
      idToken: 'mock-id-token-' + now,
      expiresAt: now + expiresIn * 1000,
      tokenType: 'Bearer',
    };
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  }

  /**
   * Simulate random failure (10% chance)
   */
  async simulateRandomFailure(): Promise<AuthResult> {
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: {
          code: 'mock_random_error',
          message: 'Simulated random OAuth failure',
          retryable: true,
          recoverable: true,
        },
      };
    }

    return this.login();
  }

  /**
   * Simulate token refresh
   */
  async refreshToken(): Promise<OAuthTokens> {
    console.log('[MockOAuth] Simulating token refresh...');
    await this.simulateDelay();
    return this.generateMockTokens();
  }
}

/**
 * Create mock OAuth instance for testing
 */
export function createMockOAuth(): MockOAuth {
  return new MockOAuth();
}

/**
 * Mock factory for unit tests
 * Note: This requires importing vitest's vi in test files
 */
export const mockOAuthFactory = {
  login: {
    success: true,
    user: MOCK_USER,
    tokens: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'openid email profile',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer',
    },
  },
  logout: undefined,
  getAccessToken: 'mock-access-token',
  handleCallback: {
    success: true,
    user: MOCK_USER,
  },
};
