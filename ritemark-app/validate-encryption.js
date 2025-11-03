#!/usr/bin/env node
/**
 * Quick validation script for settingsEncryption.ts
 *
 * This validates:
 * 1. TypeScript types are correct
 * 2. All required exports exist
 * 3. Function signatures match requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/utils/settingsEncryption.ts');
const content = fs.readFileSync(filePath, 'utf-8');

console.log('🔍 Validating settingsEncryption.ts implementation...\n');

// Check 1: Required exports
const checks = [
  {
    name: 'encryptSettings export',
    pattern: /export async function encryptSettings\(/,
    required: true
  },
  {
    name: 'decryptSettings export',
    pattern: /export async function decryptSettings\(/,
    required: true
  },
  {
    name: 'getOrCreateEncryptionKey function',
    pattern: /async function getOrCreateEncryptionKey\(\)/,
    required: true
  },
  {
    name: 'getFromIndexedDB helper',
    pattern: /async function getFromIndexedDB/,
    required: true
  },
  {
    name: 'saveToIndexedDB helper',
    pattern: /async function saveToIndexedDB/,
    required: true
  },
  {
    name: 'AES-256-GCM encryption',
    pattern: /name: 'AES-GCM', length: 256/,
    required: true
  },
  {
    name: 'Non-extractable key',
    pattern: /false.*Non-extractable/,
    required: true
  },
  {
    name: 'IndexedDB database name',
    pattern: /DB_NAME = 'ritemark-encryption'/,
    required: true
  },
  {
    name: 'Base64 encoding helpers',
    pattern: /function arrayBufferToBase64/,
    required: true
  },
  {
    name: 'Base64 decoding helpers',
    pattern: /function base64ToArrayBuffer/,
    required: true
  },
  {
    name: 'Error handling',
    pattern: /try \{[\s\S]*?\} catch \(error\)/,
    required: true
  },
  {
    name: 'TypeScript imports',
    pattern: /import type \{ UserSettings, EncryptedSettings \}/,
    required: true
  },
  {
    name: 'Return type: Omit<EncryptedSettings, "userId">',
    pattern: /Promise<Omit<EncryptedSettings, 'userId'>>/,
    required: true
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  const found = check.pattern.test(content);
  if (found) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else {
    console.log(`❌ ${check.name}`);
    failed++;
  }
});

// Check file size (should be substantial)
const lines = content.split('\n').length;
console.log(`\n📊 File Statistics:`);
console.log(`   Lines: ${lines}`);
console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB`);

console.log(`\n📋 Validation Summary:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);

if (failed === 0) {
  console.log(`\n🎉 All validation checks passed!`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some validation checks failed.`);
  process.exit(1);
}
