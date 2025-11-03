/**
 * Environment Variable Validation Service
 * Sprint 22 - Developer Experience Improvement
 *
 * Purpose:
 * - Validate all required environment variables at app startup
 * - Provide helpful error messages with setup instructions
 * - Prevent runtime errors from missing configuration
 * - Type-safe access to environment variables
 *
 * Usage:
 * Import { ENV } from '@/config/env'
 * const clientId = ENV.GOOGLE_CLIENT_ID  // Guaranteed to exist
 */

/**
 * Get required environment variable with validation
 * Throws error with helpful message if variable is missing
 */
function getRequiredEnv(key: string): string {
  const value = import.meta.env[key]
  
  if (!value || value === 'undefined' || value === 'your-client-id-here' || value.includes('your-') || value.includes('-here')) {
    throw new Error(
      `❌ Missing or invalid environment variable: ${key}\n\n` +
      `Please add ${key} to your .env.local file:\n` +
      `${key}=actual_value_here\n\n` +
      `See ritemark-app/.env.example for complete setup instructions.\n\n` +
      `Common issues:\n` +
      `- .env.local file doesn't exist (copy from .env.example)\n` +
      `- ${key} is set to placeholder value\n` +
      `- Shell environment variable is overriding .env.local (run: env | grep ${key})\n` +
      `- Need to restart dev server after creating .env.local\n`
    )
  }
  
  return value
}

/**
 * Get optional environment variable with default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  const value = import.meta.env[key]
  return value || defaultValue
}

/**
 * Get boolean environment variable
 */
function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key]
  if (!value) return defaultValue
  return value === 'true' || value === '1'
}

/**
 * Validated environment variables
 * All required variables are guaranteed to exist
 * Access via: ENV.GOOGLE_CLIENT_ID instead of import.meta.env.VITE_GOOGLE_CLIENT_ID
 */
export const ENV = {
  // Required: Google OAuth Client ID
  GOOGLE_CLIENT_ID: getRequiredEnv('VITE_GOOGLE_CLIENT_ID'),
  
  // Optional: OAuth configuration
  OAUTH_REDIRECT_URI: getOptionalEnv('VITE_OAUTH_REDIRECT_URI', 'http://localhost:5173'),
  USE_MOCK_OAUTH: getBooleanEnv('VITE_USE_MOCK_OAUTH', false),
  
  // Optional: Feature flags
  USE_SIDEBAR_SCAFFOLD: getBooleanEnv('VITE_USE_SIDEBAR_SCAFFOLD', false),
  
  // Environment detection
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
} as const

/**
 * Type-safe environment variable access
 * Ensures all variables are defined at compile time
 */
export type Environment = typeof ENV

/**
 * Validate environment on module load
 * This runs immediately when the app starts, before React renders
 * Catches missing env vars early with helpful error messages
 */
try {
  // Trigger validation by accessing ENV object
  const validation = ENV.GOOGLE_CLIENT_ID
  
  console.log('✅ Environment variables validated successfully')
  console.log('[ENV] Google Client ID:', ENV.GOOGLE_CLIENT_ID.substring(0, 20) + '...')
  console.log('[ENV] Environment:', ENV.MODE)
} catch (error) {
  console.error('❌ Environment validation failed!')
  console.error(error)
  
  // Show user-friendly error in browser
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 30px;
        background: #fee;
        border: 2px solid #c00;
        border-radius: 8px;
      ">
        <h1 style="color: #c00; margin-top: 0;">⚠️ Configuration Error</h1>
        <pre style="
          background: #fff;
          padding: 20px;
          border-radius: 4px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        ">${error instanceof Error ? error.message : 'Unknown error'}</pre>
        <p><strong>Need help?</strong> Check <code>ritemark-app/.env.example</code> for setup instructions.</p>
      </div>
    `
  }
  
  throw error
}
