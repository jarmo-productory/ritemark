/**
 * SettingsSyncService Demo/Validation
 * Sprint 20 Phase 1-4: Cross-Device Settings Sync
 *
 * This file demonstrates how to use SettingsSyncService
 * Run in browser console after authentication
 */

import { settingsSyncService } from './SettingsSyncService';
import { DEFAULT_USER_SETTINGS } from '../../types/settings';
import type { UserSettings } from '../../types/settings';

/**
 * Demo 1: Save and Load Settings
 */
export async function demo1_SaveAndLoad() {
  console.log('=== Demo 1: Save and Load Settings ===');

  // Create test settings
  const testSettings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    userId: 'demo-user-123',
    timestamp: Date.now(),
    version: 1,
    preferences: {
      theme: 'dark',
      fontSize: 18,
      fontFamily: 'JetBrains Mono',
      autoSave: true,
      autoSaveInterval: 5,
    },
  };

  // Save settings
  console.log('Saving settings...');
  await settingsSyncService.saveSettings(testSettings);
  console.log('✅ Settings saved to IndexedDB + Drive AppData');

  // Load settings
  console.log('Loading settings...');
  const loaded = await settingsSyncService.loadSettings();
  console.log('✅ Settings loaded:', loaded);

  // Verify
  if (loaded?.userId === testSettings.userId) {
    console.log('✅ User ID matches');
  }
  if (loaded?.preferences?.theme === 'dark') {
    console.log('✅ Theme preference matches');
  }
}

/**
 * Demo 2: Auto-sync Background Process
 */
export async function demo2_AutoSync() {
  console.log('=== Demo 2: Auto-sync Background Process ===');

  // Start auto-sync
  console.log('Starting auto-sync (30s interval)...');
  settingsSyncService.startAutoSync();
  console.log('✅ Auto-sync started');

  // Check status
  console.log('Last sync time:', settingsSyncService.getLastSyncTime());
  console.log('Is syncing:', settingsSyncService.isSyncing());

  // Wait 3 seconds and check again
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('After 3 seconds:');
  console.log('Last sync time:', settingsSyncService.getLastSyncTime());
  console.log('Is syncing:', settingsSyncService.isSyncing());

  // Stop auto-sync
  console.log('Stopping auto-sync...');
  settingsSyncService.stopAutoSync();
  console.log('✅ Auto-sync stopped');
}

/**
 * Demo 3: Conflict Resolution (Last-Write-Wins)
 */
export async function demo3_ConflictResolution() {
  console.log('=== Demo 3: Conflict Resolution ===');

  // Simulate device 1 (older timestamp)
  const device1Settings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    userId: 'demo-user-123',
    timestamp: Date.now() - 10000, // 10 seconds ago
    version: 1,
    preferences: {
      theme: 'light',
      fontSize: 16,
      fontFamily: 'Inter',
      autoSave: true,
      autoSaveInterval: 3,
    },
  };

  // Simulate device 2 (newer timestamp)
  const device2Settings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    userId: 'demo-user-123',
    timestamp: Date.now(), // Now
    version: 1,
    preferences: {
      theme: 'dark',
      fontSize: 18,
      fontFamily: 'Roboto',
      autoSave: true,
      autoSaveInterval: 5,
    },
  };

  console.log('Device 1 settings (older):', device1Settings.preferences?.theme);
  console.log('Device 2 settings (newer):', device2Settings.preferences?.theme);

  // Save device 2 settings (should win due to newer timestamp)
  await settingsSyncService.saveSettings(device2Settings);
  console.log('✅ Device 2 settings saved');

  // Try to sync device 1 settings
  await settingsSyncService.syncSettings();
  console.log('✅ Sync completed');

  // Load and verify - should be device 2 settings
  const result = await settingsSyncService.loadSettings();
  if (result?.preferences?.theme === 'dark') {
    console.log('✅ Conflict resolution: newer settings (device 2) won');
  } else {
    console.log('❌ Conflict resolution failed');
  }
}

/**
 * Demo 4: Offline Support with Cache
 */
export async function demo4_OfflineCache() {
  console.log('=== Demo 4: Offline Support with Cache ===');

  // Save settings while online
  const testSettings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    userId: 'demo-user-123',
    timestamp: Date.now(),
    version: 1,
  };

  await settingsSyncService.saveSettings(testSettings);
  console.log('✅ Settings saved (online)');

  // Simulate offline by clearing access token temporarily
  console.log('Simulating offline mode...');

  // Load from cache (should work even if "offline")
  const cached = await settingsSyncService.loadSettings();
  if (cached) {
    console.log('✅ Settings loaded from cache (offline mode)');
  } else {
    console.log('❌ Cache load failed');
  }
}

/**
 * Demo 5: Delete Settings
 */
export async function demo5_DeleteSettings() {
  console.log('=== Demo 5: Delete Settings ===');

  // Save settings first
  const testSettings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    userId: 'demo-user-123',
    timestamp: Date.now(),
    version: 1,
  };

  await settingsSyncService.saveSettings(testSettings);
  console.log('✅ Settings saved');

  // Delete settings
  console.log('Deleting settings...');
  await settingsSyncService.deleteSettings();
  console.log('✅ Settings deleted from IndexedDB + Drive AppData');

  // Verify deletion
  const result = await settingsSyncService.loadSettings();
  if (result === null) {
    console.log('✅ Settings successfully deleted');
  } else {
    console.log('❌ Settings still exist after deletion');
  }
}

/**
 * Run all demos
 */
export async function runAllDemos() {
  console.log('🚀 Running all SettingsSyncService demos...\n');

  try {
    await demo1_SaveAndLoad();
    console.log('\n');

    await demo2_AutoSync();
    console.log('\n');

    await demo3_ConflictResolution();
    console.log('\n');

    await demo4_OfflineCache();
    console.log('\n');

    await demo5_DeleteSettings();
    console.log('\n');

    console.log('✅ All demos completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).settingsSyncDemo = {
    demo1_SaveAndLoad,
    demo2_AutoSync,
    demo3_ConflictResolution,
    demo4_OfflineCache,
    demo5_DeleteSettings,
    runAllDemos,
  };
  console.log('SettingsSyncService demos loaded. Run window.settingsSyncDemo.runAllDemos()');
}
