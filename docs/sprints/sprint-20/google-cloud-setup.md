# Google Cloud Console Setup - Sprint 20 Backend OAuth

## OAuth 2.0 Client Configuration

**Client ID:** `730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com`

### Required Changes

You need to add the following **Authorized redirect URIs** to support Netlify Functions backend OAuth:

#### Production URIs
```
https://ritemark.netlify.app/.netlify/functions/auth-callback
```

#### Development URIs
```
http://localhost:8888/.netlify/functions/auth-callback
```

#### Preview Deploy URIs (Pattern)
```
https://deploy-preview-*--ritemark.netlify.app/.netlify/functions/auth-callback
```

---

## Step-by-Step Instructions

### 1. Open Google Cloud Console
Navigate to: https://console.cloud.google.com/apis/credentials

### 2. Find Your OAuth 2.0 Client ID
- Look for: `730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv`
- Click on it to edit

### 3. Add Authorized Redirect URIs

**Current URIs** (Sprint 19 - Browser-only OAuth):
- `http://localhost:5173`
- `https://ritemark.netlify.app`

**Add these NEW URIs** (Sprint 20 - Backend OAuth):
- `http://localhost:8888/.netlify/functions/auth-callback`
- `https://ritemark.netlify.app/.netlify/functions/auth-callback`

**Optional** (for Netlify preview deploys):
- `https://deploy-preview-*--ritemark.netlify.app/.netlify/functions/auth-callback`

> **Note:** Wildcard URIs may not be supported. If not, add specific preview deploy URLs as needed.

### 4. Copy Client Secret
- While in the OAuth client settings, locate the **Client Secret**
- Click "Show" or "Copy" to get the secret value
- You'll need this for Netlify environment variables (Task 0.7)

### 5. Save Changes
- Click **Save** at the bottom of the page
- Wait 5-10 minutes for changes to propagate

---

## Verification

After adding URIs, verify the configuration:

1. **Netlify Dev** (http://localhost:8888):
   - OAuth flow should redirect to Netlify Function callback
   - No "redirect_uri_mismatch" errors

2. **Production** (https://ritemark.netlify.app):
   - OAuth flow should use backend Authorization Code Flow
   - 6-month sessions via server-side refresh tokens

---

## Current OAuth Scopes

Ensure these scopes are enabled:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/drive.appdata`

---

## Troubleshooting

### Error: redirect_uri_mismatch
**Cause:** URI not in authorized list
**Fix:** Add the exact URI shown in error message to Google Cloud Console

### Error: invalid_client
**Cause:** Client Secret incorrect or not set
**Fix:** Verify GOOGLE_CLIENT_SECRET in Netlify environment variables

### Error: access_denied
**Cause:** User declined OAuth consent
**Fix:** User needs to re-authorize with all requested scopes
