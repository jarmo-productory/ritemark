/**
 * Unit Tests for PKCE Generator
 * Sprint 7: OAuth Security Testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PKCEGenerator } from '../../../src/services/auth/pkceGenerator';

describe('PKCEGenerator', () => {
  let pkceGenerator: PKCEGenerator;

  beforeEach(() => {
    pkceGenerator = new PKCEGenerator();
  });

  describe('Challenge Generation', () => {
    it('should generate valid PKCE challenge', async () => {
      const challenge = await pkceGenerator.generateChallenge();

      expect(challenge.codeVerifier).toBeDefined();
      expect(challenge.codeChallenge).toBeDefined();
      expect(challenge.method).toBe('S256');
    });

    it('should generate unique code verifiers', async () => {
      const challenge1 = await pkceGenerator.generateChallenge();
      const challenge2 = await pkceGenerator.generateChallenge();

      expect(challenge1.codeVerifier).not.toBe(challenge2.codeVerifier);
      expect(challenge1.codeChallenge).not.toBe(challenge2.codeChallenge);
    });

    it('should generate base64url-encoded strings', async () => {
      const challenge = await pkceGenerator.generateChallenge();
      const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

      expect(base64UrlPattern.test(challenge.codeVerifier)).toBe(true);
      expect(base64UrlPattern.test(challenge.codeChallenge)).toBe(true);
    });

    it('should generate code verifier within length constraints', async () => {
      const challenge = await pkceGenerator.generateChallenge();

      expect(challenge.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(challenge.codeVerifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate SHA-256 challenge with correct length', async () => {
      const challenge = await pkceGenerator.generateChallenge();

      // SHA-256 base64url encoded is always 43 characters
      expect(challenge.codeChallenge.length).toBe(43);
    });
  });

  describe('Challenge Validation', () => {
    it('should validate correct PKCE challenge', async () => {
      const challenge = await pkceGenerator.generateChallenge();
      const isValid = pkceGenerator.validateChallenge(challenge);

      expect(isValid).toBe(true);
    });

    it('should reject invalid challenge method', () => {
      const invalidChallenge = {
        codeVerifier: 'valid-verifier-string-here',
        codeChallenge: 'valid-challenge-string',
        method: 'PLAIN' as 'S256',
      };

      const isValid = pkceGenerator.validateChallenge(invalidChallenge);
      expect(isValid).toBe(false);
    });

    it('should reject challenge with invalid characters', () => {
      const invalidChallenge = {
        codeVerifier: 'invalid+characters/here=',
        codeChallenge: 'valid-challenge-string-here-with-correct-length-of-43-chars',
        method: 'S256' as const,
      };

      const isValid = pkceGenerator.validateChallenge(invalidChallenge);
      expect(isValid).toBe(false);
    });
  });

  describe('State Generation', () => {
    it('should generate secure random state', () => {
      const state = pkceGenerator.generateState();

      expect(state).toBeDefined();
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate unique state values', () => {
      const state1 = pkceGenerator.generateState();
      const state2 = pkceGenerator.generateState();

      expect(state1).not.toBe(state2);
    });

    it('should generate base64url-encoded state', () => {
      const state = pkceGenerator.generateState();
      const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

      expect(base64UrlPattern.test(state)).toBe(true);
    });
  });
});
