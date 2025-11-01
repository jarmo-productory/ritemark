/**
 * SettingsSyncService Tests
 * Sprint 20 Phase 1-4: Cross-Device Settings Sync
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsSyncService } from '../SettingsSyncService';
import type { UserSettings } from '../../../types/settings';
import { DEFAULT_USER_SETTINGS } from '../../../types/settings';

// Mock dependencies
vi.mock('idb', () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));

vi.mock('../../auth/TokenManagerEncrypted', () => ({
  tokenManagerEncrypted: {
    getAccessToken: vi.fn(() => Promise.resolve('mock-access-token')),
  },
}));

vi.mock('../../../utils/settingsEncryption', () => ({
  encryptSettings: vi.fn((settings: UserSettings) =>
    Promise.resolve({
      encryptedData: 'mock-encrypted-data',
      iv: 'mock-iv',
      version: settings.version,
      timestamp: settings.timestamp,
      userId: settings.userId,
    })
  ),
  decryptSettings: vi.fn(() =>
    Promise.resolve({
      ...DEFAULT_USER_SETTINGS,
      userId: 'test-user-123',
      timestamp: Date.now(),
    })
  ),
}));

describe('SettingsSyncService', () => {
  let service: SettingsSyncService;

  beforeEach(() => {
    service = new SettingsSyncService();
    vi.clearAllMocks();
  });

  it('should create service instance', () => {
    expect(service).toBeDefined();
    expect(service.isSyncing()).toBe(false);
    expect(service.getLastSyncTime()).toBeNull();
  });

  it('should have core API methods', () => {
    expect(typeof service.saveSettings).toBe('function');
    expect(typeof service.loadSettings).toBe('function');
    expect(typeof service.syncSettings).toBe('function');
    expect(typeof service.deleteSettings).toBe('function');
    expect(typeof service.startAutoSync).toBe('function');
    expect(typeof service.stopAutoSync).toBe('function');
  });

  it('should have status methods', () => {
    expect(typeof service.getLastSyncTime).toBe('function');
    expect(typeof service.isSyncing).toBe('function');
    expect(typeof service.forceSyncNow).toBe('function');
  });

  it('should initialize with correct state', () => {
    expect(service.isSyncing()).toBe(false);
    expect(service.getLastSyncTime()).toBeNull();
  });
});
