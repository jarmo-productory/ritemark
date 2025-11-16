# Environment Variables Status - Sprint 20 Phase 0

## Netlify Production Environment

### ✅ Already Configured (Sprint 19)
- `VITE_GOOGLE_CLIENT_ID` - OAuth client ID for frontend
- `VITE_OAUTH_REDIRECT_URI` - Browser OAuth redirect
- `VITE_USE_MOCK_OAUTH` - Mock OAuth flag
- `NODE_VERSION` - Build environment
- `HUSKY` - Git hooks control

### ⚠️ REQUIRED for Sprint 20 (Backend OAuth)

#### 1. GOOGLE_CLIENT_ID
**Status:** ❌ NOT SET
**Action Required:** Run setup script or manually add via Dashboard
**Value:** `730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com`

#### 2. GOOGLE_CLIENT_SECRET ⚠️ SENSITIVE
**Status:** ❌ NOT SET
**Action Required:** Get from Google Cloud Console, then add via setup script
**Security:** Never commit, never expose to browser

#### 3. FRONTEND_URL
**Status:** ❌ NOT SET
**Action Required:** Set to production URL
**Value:** `https://ritemark.netlify.app`

---

## Setup Method

### Quick Setup (Recommended)
```bash
# Run automated setup script
./scripts/setup-netlify-env.sh
```

### Manual Setup
See: `docs/sprints/sprint-20/netlify-env-setup.md`

---

## Google Cloud Console

### ⚠️ REQUIRED: Add Netlify Callback URIs

**Status:** ❌ NOT CONFIGURED

**Action Required:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth Client: `730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv`
3. Add these Authorized redirect URIs:
   - `http://localhost:8888/.netlify/functions/auth-callback` (development)
   - `https://ritemark.netlify.app/.netlify/functions/auth-callback` (production)

**See:** `docs/sprints/sprint-20/google-cloud-setup.md`

---

## Local Development

### ✅ Already Configured
- `.env` file created in project root
- Template ready with CLIENT_ID

### ⚠️ REQUIRED: Add Client Secret
```bash
# Edit .env file and replace placeholder:
GOOGLE_CLIENT_SECRET=<your-actual-secret-here>
```

---

## Testing Readiness

### Before Testing Backend OAuth:
- [ ] GOOGLE_CLIENT_ID set in Netlify
- [ ] GOOGLE_CLIENT_SECRET set in Netlify
- [ ] FRONTEND_URL set in Netlify
- [ ] Netlify callback URI added to Google Cloud Console
- [ ] Local .env file has CLIENT_SECRET

### Then Run:
```bash
netlify dev
# Backend OAuth should work on http://localhost:8888
```

---

## Deployment Checklist

Before deploying feature branch:
- [ ] All Netlify env vars configured
- [ ] Google Cloud Console URIs updated
- [ ] Local testing passed with `netlify dev`
- [ ] Browser-only fallback still works (tested ✅)
