# OAuth Redirect URI Mismatch - Debug Request for GPT-5

## Problem Statement

We're implementing backend OAuth2 Authorization Code Flow with Netlify Functions. When testing on preview deploys, the OAuth flow completes successfully but redirects to the **production URL** instead of the **preview deploy URL**, causing Google OAuth to reject with `redirect_uri_mismatch`.

## Architecture

**Frontend OAuth Initiation** (`ritemark-app/src/components/WelcomeScreen.tsx:222`):
```typescript
const redirectUri = `${window.location.origin}/.netlify/functions/auth-callback`
// Preview: https://deploy-preview-11--ritemark.netlify.app/.netlify/functions/auth-callback
// Production: https://ritemark.netlify.app/.netlify/functions/auth-callback

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', clientId)
authUrl.searchParams.set('redirect_uri', redirectUri)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', scope)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')

window.location.href = authUrl.toString()
```

**Backend OAuth Callback** (`netlify/functions/auth-callback.ts`):
```typescript
// Environment variable detection (ATTEMPTED FIX)
const FRONTEND_URL = process.env.URL ||
  process.env.NETLIFY_SITE_URL ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173'

// OAuth2 client initialization
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  `${FRONTEND_URL}/.netlify/functions/auth-callback`
)

// Exchange code for tokens
const { tokens } = await oauth2Client.getToken(code)

// Final redirect (THIS IS WHERE THE ISSUE OCCURS)
return redirect(FRONTEND_URL, {
  access_token: tokens.access_token,
  expires_in: '3600',
  token_type: 'Bearer',
  user_id: userId
})
```

## What We've Tried

### Attempt 1: Use `DEPLOY_PREVIEW_URL`
```typescript
const FRONTEND_URL = process.env.DEPLOY_PREVIEW_URL || ...
```
**Result**: Variable doesn't exist in Netlify, fell back to production URL

### Attempt 2: Use `URL`
```typescript
const FRONTEND_URL = process.env.URL || ...
```
**Result**: Still redirects to production URL (`https://ritemark.netlify.app`)

## Current Behavior

**User Testing Flow:**
1. ✅ Opens preview deploy: `https://deploy-preview-11--ritemark.netlify.app/app`
2. ✅ Clicks "Sign in with Google"
3. ✅ Redirects to Google OAuth with correct preview URL in redirect_uri
4. ✅ User grants permissions on Google consent screen
5. ✅ Google redirects to: `https://deploy-preview-11--ritemark.netlify.app/.netlify/functions/auth-callback?code=...`
6. ✅ Backend receives callback and exchanges code for tokens
7. ❌ Backend redirects to: `https://ritemark.netlify.app/?access_token=...` (WRONG!)
8. ❌ Error: `redirect_uri_mismatch` because OAuth flow started on preview URL but ended on production URL

## Questions for GPT-5

1. **Environment Variable Issue**: Why would `process.env.URL` in Netlify Functions resolve to production URL when running on a preview deploy?

2. **Netlify Functions Context**: Do Netlify Functions have access to different environment variables than the build process? Should we be reading the URL from the request instead?

3. **Alternative Solutions**: Should we:
   - Parse the callback URL from `event.headers.host`?
   - Pass the frontend URL as a state parameter in the OAuth flow?
   - Use Netlify's context object to detect deploy type?

4. **OAuth2 Client Issue**: Does `google.auth.OAuth2` require the redirect_uri to match exactly what was used in the initial auth request? Could this be causing the issue?

5. **Debugging Strategy**: How can we log/inspect what `process.env.URL` actually resolves to during a preview deploy Function execution?

## Expected Behavior

When testing on preview deploy `https://deploy-preview-11--ritemark.netlify.app`:
- Backend should detect it's running on preview deploy
- Backend should redirect to: `https://deploy-preview-11--ritemark.netlify.app/?access_token=...`
- User should land back on preview deploy, logged in successfully

## Environment Details

- **Platform**: Netlify (Serverless Functions with esbuild)
- **OAuth Library**: googleapis@159.0.0 (OAuth2 client)
- **Frontend**: React + Vite (deployed to Netlify)
- **Backend**: Netlify Functions (Node.js)
- **Deployment**: Preview deploy from GitHub PR

## Repository Structure

```
/
├── netlify/
│   └── functions/
│       └── auth-callback.ts        ← Backend OAuth callback handler
├── ritemark-app/
│   └── src/
│       └── components/
│           └── WelcomeScreen.tsx   ← Frontend OAuth initiator
└── netlify.toml                    ← Netlify config
```

## Request for GPT-5

Please analyze this OAuth flow and identify:
1. Why `process.env.URL` might be resolving to production URL in preview deploy Functions
2. The correct way to detect the current deployment URL in Netlify Functions
3. Alternative approaches to ensure the OAuth callback redirects to the correct URL
4. Any missing configuration in our setup

Thank you!
