/**
 * OAuth 2.0 Type Definitions for RiteMark
 */

export interface OAuthTokens {
  // Real OAuth2 access token (from google.accounts.oauth2.initTokenClient - for API calls)
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: 'Bearer'
  scope?: string

  // ID token (from @react-oauth/google GoogleLogin - for user identity only, NOT for API calls)
  id_token?: string

  // Convenience aliases for easier access
  accessToken?: string
  refreshToken?: string
  idToken?: string
  tokenType?: 'Bearer'
  expiresAt?: number
}

export interface PKCEChallenge {
  codeVerifier: string
  codeChallenge: string
  method: 'S256'
}

export interface OAuthState {
  state: string
  timestamp: number
  redirectUrl?: string
  codeVerifier: string
}

export interface GoogleUser {
  id: string
  sub?: string // Google user ID (from JWT token)
  email: string
  verified_email?: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string
  locale?: string
  // Convenience alias
  emailVerified?: boolean
}

export interface AuthResult {
  success: boolean
  user?: GoogleUser
  tokens?: OAuthTokens
  error?: AuthError
}

export interface AuthError {
  code: string
  message: string
  details?: unknown
  retryable?: boolean
  // Convenience alias
  recoverable?: boolean
}

// Changed from enum to const object to avoid TypeScript erasableSyntaxOnly error
export const AuthErrorCode = {
  USER_CANCELLED: 'USER_CANCELLED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_GRANT: 'INVALID_GRANT',
  INVALID_STATE: 'INVALID_STATE',
  INVALID_CODE: 'INVALID_CODE',
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_CLIENT_ID: 'MISSING_CLIENT_ID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  REFRESH_FAILED: 'REFRESH_FAILED',
  CSRF_DETECTED: 'CSRF_DETECTED',
  PKCE_VALIDATION_FAILED: 'PKCE_VALIDATION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode]

export interface OAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
  useMockOAuth: boolean
  enableDevTools?: boolean
}

export interface IAuthService {
  login(): Promise<GoogleUser>
  logout(): Promise<void>
  handleCallback(params: URLSearchParams): Promise<AuthResult>
  refreshToken(): Promise<string>
  isAuthenticated(): boolean
  getAccessToken(): Promise<string | null>
}

export interface ITokenManager {
  storeTokens(tokens: OAuthTokens): Promise<void>
  getAccessToken(): Promise<string | null>
  getRefreshToken(): Promise<string | null>
  clearTokens(): Promise<void>
  isTokenValid(): boolean
}

export interface IPKCEGenerator {
  generateChallenge(): Promise<PKCEChallenge>
  verifyChallenge(verifier: string, challenge: string): Promise<boolean>
}

export interface AuthContextType {
  user: GoogleUser | null
  userId: string | null // Google user.sub for rate limiting
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  error: string | null
  clearError: () => void
  getAccessToken?: () => Promise<string | null>
  refreshToken?: () => Promise<void>
}

export interface AuthProviderProps {
  children: React.ReactNode
  config?: Partial<OAuthConfig>
  onAuthChange?: (user: GoogleUser | null) => void
}

export type UseAuthReturn = AuthContextType

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'logout' | 'profile'
  onSuccess?: (user: GoogleUser) => void
  onError?: (error: AuthError) => void
}

export interface GoogleLoginButtonProps {
  onSuccess: (user: GoogleUser) => void
  onError: (error: AuthError) => void
  disabled?: boolean
  text?: string
  className?: string
}


// OAuth callback URL parameters
export interface OAuthCallbackParams {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

// Token refresh result
export interface TokenRefreshResult {
  success: boolean
  tokens?: OAuthTokens
  error?: AuthError
}

// OAuth scopes for Google APIs
export const OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata', // Cross-device settings sync
] as const

// Scope version for breaking changes (Added drive.appdata)
// Increment this when scopes change to force user re-authorization
export const OAUTH_SCOPE_VERSION = 2 // v1: drive.file only, v2: + drive.appdata

// Standard auth error codes
export const AUTH_ERRORS = {
  USER_CANCELLED: 'USER_CANCELLED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_GRANT: 'INVALID_GRANT',
  INVALID_STATE: 'INVALID_STATE',
  INVALID_CODE: 'INVALID_CODE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_CLIENT_ID: 'MISSING_CLIENT_ID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  REFRESH_FAILED: 'REFRESH_FAILED',
  CSRF_DETECTED: 'CSRF_DETECTED',
  PKCE_VALIDATION_FAILED: 'PKCE_VALIDATION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const
