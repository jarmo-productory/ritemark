/**
 * User Identity Extraction Tests
 * Verifies Google user.sub storage and retrieval
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { userIdentityManager } from './tokenManager';

describe('User Identity Manager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('stores user identity correctly', () => {
    const userId = '123456789';
    const email = 'test@example.com';

    userIdentityManager.storeUserInfo(userId, email);

    const stored = userIdentityManager.getUserInfo();
    expect(stored).not.toBeNull();
    expect(stored?.userId).toBe(userId);
    expect(stored?.email).toBe(email);
    expect(stored?.createdAt).toBeLessThanOrEqual(Date.now());
  });

  test('returns null when no user info stored', () => {
    const userInfo = userIdentityManager.getUserInfo();
    expect(userInfo).toBeNull();
  });

  test('clears user info on logout', () => {
    userIdentityManager.storeUserInfo('123', 'test@example.com');
    expect(userIdentityManager.getUserInfo()).not.toBeNull();

    userIdentityManager.clearUserInfo();
    expect(userIdentityManager.getUserInfo()).toBeNull();
  });

  test('persists across page reloads (localStorage)', () => {
    const userId = 'stable-user-id-123';
    const email = 'user@example.com';

    userIdentityManager.storeUserInfo(userId, email);

    // Simulate page reload by getting fresh instance
    const retrieved = userIdentityManager.getUserInfo();
    expect(retrieved?.userId).toBe(userId);
    expect(retrieved?.email).toBe(email);
  });

  test('handles JSON parsing errors gracefully', () => {
    // Store invalid JSON
    localStorage.setItem('ritemark_user_info', 'invalid-json{{{');

    const userInfo = userIdentityManager.getUserInfo();
    expect(userInfo).toBeNull();
  });
});
