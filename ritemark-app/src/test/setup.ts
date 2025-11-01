import '@testing-library/jest-dom'
import { webcrypto } from 'crypto'

// Polyfill Web Crypto API for tests (Node.js doesn't have it by default)
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  })
}
