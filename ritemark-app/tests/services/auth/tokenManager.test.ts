/**
 * Unit Tests for Token Manager
 * Sprint 7: OAuth Token Management Testing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenManager } from '../../../src/services/auth/tokenManager';
import type { OAuthTokens } from '../../../src/types/auth';

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let mockTokens: OAuthTokens;

  beforeEach(() => {
    tokenManager = new TokenManager();

    mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      idToken: 'mock-id-token',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      tokenType: 'Bearer',
      scope: 'openid email profile',
    };

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Token Storage', () => {
    it('should store tokens successfully', async () => {
      await tokenManager.storeTokens(mockTokens);

      const retrievedToken = await tokenManager.getAccessToken();
      expect(retrievedToken).toBe(mockTokens.accessToken);
    });

    it('should store refresh token separately', async () => {
      await tokenManager.storeTokens(mockTokens);

      const refreshToken = tokenManager.getRefreshToken();
      expect(refreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('Token Retrieval', () => {
    it('should retrieve valid access token', async () => {
      await tokenManager.storeTokens(mockTokens);

      const token = await tokenManager.getAccessToken();
      expect(token).toBe(mockTokens.accessToken);
    });

    it('should return null for expired token', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      await tokenManager.storeTokens(expiredTokens);

      const token = await tokenManager.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return null when no tokens stored', async () => {
      const token = await tokenManager.getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe('Token Expiry', () => {
    it('should detect expired tokens', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresAt: Date.now() - 1000,
      };

      await tokenManager.storeTokens(expiredTokens);

      const isExpired = tokenManager.isTokenExpired();
      expect(isExpired).toBe(true);
    });

    it('should detect valid tokens', async () => {
      await tokenManager.storeTokens(mockTokens);

      const isExpired = tokenManager.isTokenExpired();
      expect(isExpired).toBe(false);
    });

    it('should get token expiry time', async () => {
      await tokenManager.storeTokens(mockTokens);

      const expiry = tokenManager.getTokenExpiry();
      expect(expiry).toBe(mockTokens.expiresAt);
    });
  });

  describe('Token Clearing', () => {
    it('should clear all tokens', async () => {
      await tokenManager.storeTokens(mockTokens);

      tokenManager.clearTokens();

      const token = await tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();

      expect(token).toBeNull();
      expect(refreshToken).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should handle refresh failure when no refresh token', async () => {
      const tokensWithoutRefresh = {
        ...mockTokens,
        refreshToken: undefined,
      };

      await tokenManager.storeTokens(tokensWithoutRefresh);

      const result = await tokenManager.refreshAccessToken();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
