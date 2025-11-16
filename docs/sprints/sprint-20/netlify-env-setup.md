# Netlify Environment Variables Setup - Sprint 20

## Required Environment Variables

Sprint 20 requires the following environment variables for Netlify Functions to work:

### 1. GOOGLE_CLIENT_ID
**Purpose:** OAuth client ID for backend Authorization Code Flow
**Source:** Google Cloud Console > APIs & Services > Credentials
**Value:** `730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com`
**Scope:** All (production + preview + development)

### 2. GOOGLE_CLIENT_SECRET ⚠️ SENSITIVE
**Purpose:** OAuth client secret for token exchange (backend only)
**Source:** Google Cloud Console > APIs & Services > Credentials
**Value:** `<get from Google Cloud Console>`
**Scope:** All (production + preview + development)
**Security:** Never commit to git, never expose to browser

### 3. FRONTEND_URL
**Purpose:** OAuth redirect target after authentication
**Values:**
- **Production:** `https://ritemark.netlify.app`
- **Preview:** `https://deploy-preview-{PR_NUMBER}--ritemark.netlify.app` (auto-set)
- **Development:** `http://localhost:8888` (Netlify Dev)

**Scope:** All

---

## Setup Instructions

### Option A: Netlify CLI (Recommended)

```bash
# Navigate to project root
cd /Users/jarmotuisk/Projects/ritemark

# Set GOOGLE_CLIENT_ID (if not already set)
netlify env:set GOOGLE_CLIENT_ID "730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com"

# Set GOOGLE_CLIENT_SECRET (get value from Google Cloud Console)
# Replace YOUR_CLIENT_SECRET_HERE with actual secret
netlify env:set GOOGLE_CLIENT_SECRET "YOUR_CLIENT_SECRET_HERE"

# Set FRONTEND_URL for production
netlify env:set FRONTEND_URL "https://ritemark.netlify.app"

# Verify environment variables
netlify env:list
```

### Option B: Netlify Dashboard

1. Go to: https://app.netlify.com/sites/ritemark/configuration/env
2. Click "Add a variable" for each:
   - Key: `GOOGLE_CLIENT_ID`
     - Value: `730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com`
     - Scopes: All

   - Key: `GOOGLE_CLIENT_SECRET`
     - Value: `<paste from Google Cloud Console>`
     - Scopes: All

   - Key: `FRONTEND_URL`
     - Value: `https://ritemark.netlify.app`
     - Scopes: Production only

3. Click "Save"

---

## Local Development (.env)

For local testing with `netlify dev`, create `.env` in project root:

```bash
# .env (already created)
GOOGLE_CLIENT_ID=730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret-here>
FRONTEND_URL=http://localhost:8888
```

> **Important:** `.env` is in `.gitignore` - never commit secrets!

---

## Verification

### Check Environment Variables
```bash
# Via CLI
netlify env:list

# Via Dashboard
https://app.netlify.com/sites/ritemark/configuration/env
```

### Test Backend Functions
```bash
# Start Netlify Dev
netlify dev

# Should see Functions loaded:
# ◈ Functions loaded from: netlify/functions
# ◈ auth-callback
# ◈ refresh-token
```

### Test OAuth Flow
1. Open http://localhost:8888
2. Click "Sign in with Google"
3. Should redirect to Google OAuth
4. After auth, should redirect to `http://localhost:8888/.netlify/functions/auth-callback`
5. Function should process and redirect to frontend with tokens

---

## Troubleshooting

### Error: "Missing environment variable"
**Fix:** Ensure all 3 variables are set in Netlify Dashboard

### Error: "Invalid client secret"
**Fix:** Verify GOOGLE_CLIENT_SECRET matches Google Cloud Console

### Functions not loading in Netlify Dev
**Fix:** Ensure `.env` file exists in project root with correct values

### redirect_uri_mismatch
**Fix:** Add callback URI to Google Cloud Console (see Task 0.6)
