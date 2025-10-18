# Sprint 2: Advanced Google Cloud CI/CD Integration

## Sprint Overview
**Duration**: 3 days  
**Goal**: Replace manual CLASP deployment with automated Apps Script API CI/CD pipeline  
**Deliverable**: Professional CI/CD for both Netlify and Google Apps Script using service account authentication  
**Risk Level**: 🟢 LOW (95% success probability)

---

## Background & Motivation

Sprint 1 established a solid foundation but CLASP deployment failed due to:
- ❌ GitHub Actions secret masking issues with `.clasp.json` files
- ❌ Credential file dependencies creating deployment brittleness  
- ❌ Limited control over deployment versioning and rollbacks
- ❌ Manual deployment process not suitable for production workflows

**Audit-approved solution:**
✅ **Apps Script API deployment** - Direct programmatic control  
✅ **Standard Google Cloud Project** - Full GCP feature access (new project required)  
✅ **Service Account JSON authentication** - Secure, automated credentials  
✅ **Professional GitHub Actions** - Enterprise-grade CI/CD tooling

---

## Sprint Scope

### Core Deliverables (Audit-Approved)
1. **NEW Standard GCP Project**: Create new standard Google Cloud project (cannot convert existing default)
2. **Apps Script API Integration**: Replace CLASP with googleapis Node.js library 
3. **Service Account JSON Authentication**: Store in GitHub Secrets (2 secrets only)
4. **Professional GitHub Actions**: google-github-actions/auth@v2 integration
5. **Version Management**: Git tags → Apps Script versions + rollback capability

### Success Criteria
- ✅ NEW standard Google Cloud project created and configured
- ✅ Apps Script API enabled with service account permissions
- ✅ Apps Script project switched to new GCP project  
- ✅ GitHub Actions deploys using Apps Script API (zero CLASP dependency)
- ✅ Automatic deployment versioning with Git tags
- ✅ Manual rollback workflow implemented
- ✅ Both Netlify and Google Apps Script deployments fully automated
- ✅ Professional error handling and deployment notifications

### Technology Stack (Final)
- **Google Cloud Project**: ritemark-gas-project (NEW standard project)
- **Authentication**: Service Account JSON (GOOGLE_CREDENTIALS secret)
- **API Library**: googleapis Node.js package  
- **GitHub Actions**: google-github-actions/auth@v2
- **Apps Script ID**: 1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4

---

## Technical Implementation (3-Day Plan)

### Day 1: Foundation Setup (4-6 hours)
**Goal**: New Google Cloud Project + Apps Script API Access

#### Step 1: Create NEW Standard GCP Project
```bash
# Create new standard project (cannot convert existing default)
gcloud projects create ritemark-gas-project --name="Ritemark Google Apps Script"
gcloud config set project ritemark-gas-project

# Get project number for Apps Script linking
gcloud projects describe ritemark-gas-project --format="value(projectNumber)"
```

#### Step 2: Enable Required APIs
```bash
# Enable Apps Script API (CRITICAL)
gcloud services enable script.googleapis.com

# Enable supporting APIs
gcloud services enable iam.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

#### Step 3: Create Service Account
```bash
# Create service account for CI/CD
gcloud iam service-accounts create ritemark-cicd \
  --display-name="Ritemark CI/CD Service Account" \
  --description="Service account for automated Apps Script deployment"

# Grant minimal required permissions
gcloud projects add-iam-policy-binding ritemark-gas-project \
  --member="serviceAccount:ritemark-cicd@ritemark-gas-project.iam.gserviceaccount.com" \
  --role="roles/script.developer"

# Generate service account key
gcloud iam service-accounts keys create ./ritemark-cicd-key.json \
  --iam-account=ritemark-cicd@ritemark-gas-project.iam.gserviceaccount.com
```

#### Step 4: Link Apps Script to NEW Standard Project
1. Open Apps Script project: `https://script.google.com/d/1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4/edit`
2. Go to Project Settings → Google Cloud Platform (GCP) Project
3. Click "Change project" and enter the NEW project number
4. Confirm the link and verify API access

#### Step 5: Test API Access Manually
```bash
# Test Apps Script API access with service account
node -e "
const { google } = require('googleapis');
const credentials = require('./ritemark-cicd-key.json');
const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/script.projects'] });
const script = google.script({ version: 'v1', auth });
script.projects.get({ scriptId: '1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4' })
  .then(res => console.log('✅ API access working:', res.data.title))
  .catch(err => console.error('❌ API access failed:', err.message));
"
```

**Day 1 Success Criteria**: Can call Apps Script API from command line with service account

### Day 2: CI/CD Pipeline (6-8 hours)
**Goal**: Automated GitHub Actions deployment

#### Step 1: Add GitHub Secrets
```bash
# Copy service account JSON content
cat ./ritemark-cicd-key.json

# Add to GitHub repository secrets:
# GOOGLE_CREDENTIALS = {"type":"service_account",...}
# APPS_SCRIPT_ID = 1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4
```

#### Step 2: Install googleapis Dependency
```bash
# Add googleapis to project
npm install googleapis
```

#### Step 3: Create Apps Script API Deployment Script
**File**: `scripts/gas-deploy.js`
```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployToAppsScript() {
  // Load service account credentials from GitHub Secrets
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  
  // Initialize Auth
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/script.projects']
  });
  
  const script = google.script({ version: 'v1', auth });
  const scriptId = process.env.APPS_SCRIPT_ID;
  
  try {
    // Read built files
    const files = await readProjectFiles();
    
    console.log(`📦 Updating Apps Script project: ${scriptId}`);
    
    // Update script content
    await script.projects.updateContent({
      scriptId,
      requestBody: { files }
    });
    
    console.log('✅ Apps Script deployment successful');
    
  } catch (error) {
    console.error('❌ Apps Script deployment failed:', error.message);
    throw error;
  }
}

async function readProjectFiles() {
  const distPath = './gas/dist';
  const files = [];
  
  // Read HTML file
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    files.push({
      name: 'index',
      type: 'HTML',
      source: fs.readFileSync(path.join(distPath, 'index.html'), 'utf8')
    });
  }
  
  // Read JavaScript bundle
  if (fs.existsSync(path.join(distPath, 'bundle.js'))) {
    files.push({
      name: 'bundle',
      type: 'SERVER_JS',
      source: fs.readFileSync(path.join(distPath, 'bundle.js'), 'utf8')
    });
  }
  
  // Add appsscript.json
  files.push({
    name: 'appsscript',
    type: 'JSON',
    source: fs.readFileSync('./gas/appsscript.json', 'utf8')
  });
  
  return files;
}

if (require.main === module) {
  deployToAppsScript().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { deployToAppsScript };
```

#### Step 4: Create GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Netlify and Google Apps Script

on:
  push:
    branches: [main]
    paths: ['src/**', 'public/**', 'package.json', 'vite.config.ts', 'gas/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run quality checks
        run: |
          npm run type-check
          npm run lint

      - name: Build for web
        run: npm run build

      - name: Build for Google Apps Script
        run: npm run build:gas

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            dist/
            gas/dist/
          retention-days: 7

  deploy-netlify:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}

      - name: Netlify deployment success
        run: echo "✅ Netlify deployment completed"

  deploy-gas:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install googleapis
        run: npm install googleapis

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GOOGLE_CREDENTIALS }}

      - name: Deploy to Google Apps Script
        env:
          APPS_SCRIPT_ID: ${{ secrets.APPS_SCRIPT_ID }}
        run: node scripts/gas-deploy.js

      - name: Apps Script deployment success
        run: echo "✅ Google Apps Script deployment completed"
```

#### Step 5: Test End-to-End Deployment
```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Test Apps Script API deployment"
git push origin main

# Monitor GitHub Actions workflow
gh run list
gh run watch
```

**Day 2 Success Criteria**: Push to main triggers successful automated deployment to both platforms

### Day 3: Version Management & Polish (4-6 hours)
**Goal**: Professional CI/CD features

#### Step 1: Create Git Tag-Based Versioning
**File**: `scripts/create-version.js`
```javascript
const { execSync } = require('child_process');

function createVersion() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const version = `v${timestamp}`;
  
  try {
    // Create and push Git tag
    execSync(`git tag ${version}`, { stdio: 'inherit' });
    execSync(`git push origin ${version}`, { stdio: 'inherit' });
    
    console.log(`✅ Created version: ${version}`);
    return version;
  } catch (error) {
    console.error('❌ Version creation failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  createVersion();
}

module.exports = { createVersion };
```

#### Step 2: Enhanced Deployment with Versioning
Update `scripts/gas-deploy.js` to include version tracking:
```javascript
// Add to gas-deploy.js
const { createVersion } = require('./create-version');

async function deployToAppsScript() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/script.projects']
  });
  
  const script = google.script({ version: 'v1', auth });
  const scriptId = process.env.APPS_SCRIPT_ID;
  
  try {
    const files = await readProjectFiles();
    
    console.log(`📦 Updating Apps Script project: ${scriptId}`);
    
    await script.projects.updateContent({
      scriptId,
      requestBody: { files }
    });
    
    // Create version tag after successful deployment
    if (process.env.CI) {
      const version = createVersion();
      console.log(`🏷️ Tagged deployment: ${version}`);
    }
    
    console.log('✅ Apps Script deployment successful');
    
  } catch (error) {
    console.error('❌ Apps Script deployment failed:', error.message);
    throw error;
  }
}
```

#### Step 3: Simple Rollback Script
**File**: `scripts/rollback.js`
```javascript
const { execSync } = require('child_process');

function rollbackToVersion(targetVersion) {
  try {
    console.log(`🔄 Rolling back to ${targetVersion}...`);
    
    // Checkout the target version
    execSync(`git checkout ${targetVersion}`, { stdio: 'inherit' });
    
    // Create new branch from target version
    const rollbackBranch = `rollback-${targetVersion}-${Date.now()}`;
    execSync(`git checkout -b ${rollbackBranch}`, { stdio: 'inherit' });
    
    // Push rollback branch
    execSync(`git push origin ${rollbackBranch}`, { stdio: 'inherit' });
    
    console.log(`✅ Rollback branch created: ${rollbackBranch}`);
    console.log('Create PR from this branch to main to complete rollback');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

const targetVersion = process.argv[2];
if (!targetVersion) {
  console.error('Usage: node scripts/rollback.js <version-tag>');
  process.exit(1);
}

rollbackToVersion(targetVersion);
```

#### Step 4: Enhanced Error Handling and Notifications
Update `.github/workflows/deploy.yml` to include better error handling:
```yaml
      - name: Deploy to Google Apps Script
        env:
          APPS_SCRIPT_ID: ${{ secrets.APPS_SCRIPT_ID }}
        run: |
          if node scripts/gas-deploy.js; then
            echo "✅ Google Apps Script deployment successful"
            echo "🌐 Netlify: https://ritemark.netlify.app/"
            echo "📄 Apps Script: https://script.google.com/d/${{ secrets.APPS_SCRIPT_ID }}/edit"
          else
            echo "❌ Google Apps Script deployment failed"
            exit 1
          fi
```

**Day 3 Success Criteria**: Complete professional CI/CD pipeline with version management and rollback capability

---

## 📋 **Manual Tasks for User vs Claude Automation**

### ✅ **What Claude Does Automatically (95% of work)**
- Create Google Cloud project via `gcloud` CLI
- Enable all APIs via `gcloud services enable`
- Create service account + permissions via `gcloud` CLI
- Generate service account key file
- Create all deployment scripts (`scripts/gas-deploy.js`, workflows, etc.)
- Test API access via command line
- Install npm dependencies and test deployments

### ⚠️ **What YOU Must Do Manually (~10 minutes total)**

#### **🔗 Manual Task 1: Link Apps Script to New GCP Project (Day 1)**
**Why Manual**: Apps Script console requires browser interaction

**Your Steps**:
1. Open: https://script.google.com/d/1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4/edit
2. Click ⚙️ (Project Settings)
3. Under "Google Cloud Platform (GCP) Project": Click "Change project"
4. Enter the **project number** (Claude will provide after creating project)
5. Click "Set project"
6. ✅ Verify: "This script is currently associated with GCP project: ritemark-gas-project"

#### **🔧 Manual Task 2: Enable Apps Script API (Day 1)**
**Why Manual**: Browser-only setting

**Your Steps**:
1. Go to: https://script.google.com/home/usersettings
2. Toggle "Google Apps Script API" to **ON**
3. ✅ Verify: Shows "Google Apps Script API: On"

#### **🔑 Manual Task 3: Add GitHub Secrets (Day 2)**
**Why Manual**: GitHub web interface required

**Your Steps**:
1. Go to: https://github.com/jarmo-productory/ritemark/settings/secrets/actions
2. Click "New repository secret"
3. Add **GOOGLE_CREDENTIALS** (Claude will provide the complete JSON)
4. Add **APPS_SCRIPT_ID**: `1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4`

**🕐 Total Manual Time**: ~10 minutes across 3 days

---

## Required GitHub Secrets (Only 2 New Secrets)

### Sprint 2 Secrets:
```bash
# Google Cloud Service Account JSON Key
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"ritemark-gas-project",...}

# Apps Script Project ID
APPS_SCRIPT_ID=1yP2OjKRYPu3NJ91Y0zdYS4iFSyhtbv11FHXW8ZCPKTvt7jwdontBKuU4
```

### Existing Secrets (from Sprint 1):
```bash
NETLIFY_SITE_ID=existing-site-id
NETLIFY_AUTH_TOKEN=existing-auth-token
```

## Package.json Updates

Add these scripts to package.json:
```json
{
  "scripts": {
    "deploy:gas": "node scripts/gas-deploy.js",
    "rollback": "node scripts/rollback.js",
    "create-version": "node scripts/create-version.js"
  },
  "dependencies": {
    "googleapis": "^159.0.0"
  }
}
```

---

## Acceptance Criteria (Sprint 2)

### Foundation Requirements (Day 1)
- [ ] **NEW Standard GCP Project**: ritemark-gas-project created and configured
- [ ] **Apps Script API Access**: Enabled and working with service account
- [ ] **Apps Script Migration**: Project successfully linked to new GCP project
- [ ] **Manual API Test**: Can deploy via command line using service account

### CI/CD Requirements (Day 2)  
- [ ] **GitHub Secrets**: GOOGLE_CREDENTIALS and APPS_SCRIPT_ID configured
- [ ] **Apps Script API Pipeline**: Automated deployment using googleapis library
- [ ] **Zero CLASP Dependency**: No .clasp files in GitHub Actions
- [ ] **Dual Platform Success**: Both Netlify and Apps Script deploy automatically

### Professional Features (Day 3)
- [ ] **Version Management**: Git tags created for each deployment
- [ ] **Rollback Capability**: Can rollback to previous version via script
- [ ] **Error Handling**: Clear success/failure notifications
- [ ] **Documentation**: Deployment URLs displayed after success

### Final Verification
- [ ] **Push to Main**: Triggers successful deployment to both platforms
- [ ] **No Manual Steps**: Completely automated from Git push to live deployment
- [ ] **Professional Output**: Clear logging and deployment status
- [ ] **Rollback Tested**: Can successfully rollback using provided script

---

## Definition of Done

### Sprint Complete When:
1. **Google Cloud Project** upgraded to standard with Apps Script API enabled
2. **Service account** configured with appropriate permissions
3. **Apps Script API deployment** replaces CLASP entirely
4. **GitHub Actions** deploys to both platforms automatically
5. **Version management** system tracks all deployments
6. **Rollback workflow** enables quick recovery from issues
7. **Documentation** updated with new deployment procedures

### Benefits Achieved:
- ✅ **No more credential file issues** - Service account tokens only
- ✅ **Professional CI/CD pipeline** - Enterprise-grade deployment process
- ✅ **Version control** - Full deployment history and rollback capability
- ✅ **Better error handling** - Clear deployment status and issue resolution
- ✅ **Scalable foundation** - Ready for complex multi-environment deployments

---

## Next Sprint Preparation

### Outcomes for Sprint 3:
- **Professional CI/CD**: Enterprise-grade deployment pipeline established
- **Deployment Confidence**: Reliable, repeatable deployment process
- **Version Management**: Full control over releases and rollbacks
- **Foundation for Features**: Robust platform ready for feature development

### Sprint 3 Focus Areas:
- **Google Drive API Integration**: File management and authentication
- **OAuth 2.0 Implementation**: User authentication and authorization
- **Markdown Editor Foundation**: Core editing functionality
- **File Management UI**: Drive integration interface

---

**Sprint Start**: Convert to standard GCP project and enable Apps Script API  
**Sprint End**: Fully automated, professional CI/CD pipeline for dual-platform deployment

---

## Troubleshooting: Apps Script API PERMISSION_DENIED (Service Account)

### Symptoms
- API error during `script.projects.updateContent`: `PERMISSION_DENIED` with message `User has not enabled the Apps Script API. Enable it by visiting https://script.google.com/home/usersettings`.
- Service account authenticates, files enumerate correctly, but write/update calls fail.

### Root Cause
- The Apps Script API requires a real Google user identity who has explicitly enabled the “Google Apps Script API” in their user settings. A bare service account is not a “user” and cannot toggle that setting. When you call the API as a pure service account, the backend rejects the request at the per-user permission check, producing the above error.

### Two Working Fixes
- Option A (Recommended for Workspace): Domain‑wide Delegation (DWD) and User Impersonation
  - The service account impersonates a Workspace user (subject) who:
    - Has the Apps Script API enabled in user settings
    - Has edit access to the Apps Script project
  - Result: Calls execute “as” that user and pass the per‑user API check.
- Option B (No Admin access / Gmail accounts): User OAuth (3‑legged) with Refresh Token
  - Authenticate as a real user once, capture a refresh token, store it in GitHub Secrets, and use it in CI.

> Note: Workload Identity Federation (WIF) only changes how the CI obtains a service account credential. It does not satisfy the “real user has enabled Apps Script API” requirement. You still need DWD impersonation or user OAuth.

### Option A — Domain‑wide Delegation (Workspace)
1) Admin console: turn on Apps Script services
- Admin > Apps > Additional Google services > Google Apps Script API → ON for everyone

2) Enable Domain‑wide Delegation on the service account
- In Google Cloud Console: IAM & Admin > Service Accounts > ritemark-cicd
  - Edit > Show Domain‑wide Delegation > Enable
  - Copy the “Client ID” value

3) Grant scopes in Admin console
- Admin > Security > Access and data control > API controls > Domain‑wide delegation > Add new
- Client ID: [from step 2]
- OAuth scopes:
  - `https://www.googleapis.com/auth/script.projects`
  - (Optional) Add Drive scopes only if your pipeline needs Drive operations

4) Choose an impersonated user
- Pick a Workspace user email, e.g. `deployer@your-domain.com`
- Requirements:
  - User setting ON: https://script.google.com/home/usersettings
  - Editor or Owner of the Apps Script project (share the project with this user)

5) Update CI secrets
- Add secret `GAS_IMPERSONATED_USER=deployer@your-domain.com`

6) Update deployment code to impersonate the user
```js
// scripts/gas-deploy.js (Auth section)
const { google } = require('googleapis');

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const impersonatedUser = process.env.GAS_IMPERSONATED_USER; // e.g. deployer@your-domain.com

// Option A: Use JWT with subject (impersonation)
const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/script.projects'],
  subject: impersonatedUser,
});

const script = google.script({ version: 'v1', auth });
```

7) Workflow env
```yaml
      - name: Deploy to Google Apps Script
        env:
          APPS_SCRIPT_ID: ${{ secrets.APPS_SCRIPT_ID }}
          GAS_IMPERSONATED_USER: ${{ secrets.GAS_IMPERSONATED_USER }}
        run: node scripts/gas-deploy.js
```

### Option B — User OAuth (3‑legged) without DWD
Use when you don’t have Workspace Admin or the script is owned by a consumer Gmail account.

1) Create OAuth client (type: Desktop app)
- Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID
- Record `client_id` and `client_secret`

2) Obtain a refresh token once (local machine)
```bash
npm i googleapis
node -e '
const {google} = require("googleapis");
const o = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");
const scopes=["https://www.googleapis.com/auth/script.projects"];
console.log("Auth URL:\n", o.generateAuthUrl({access_type:"offline",prompt:"consent",scope:scopes}));
'
# Open URL, approve, paste code:
node -e '
const {google} = require("googleapis");
const o = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");
o.getToken(process.env.AUTH_CODE).then(({tokens})=>console.log(tokens.refresh_token));
'
```

3) Store secrets in GitHub
- `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REFRESH_TOKEN`

4) Update deployment code
```js
// scripts/gas-deploy.js (Auth section for 3LO)
const { google } = require('googleapis');

const oAuth2 = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);
oAuth2.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

const script = google.script({ version: 'v1', auth: oAuth2 });
```

5) Workflow env
```yaml
      - name: Deploy to Google Apps Script (User OAuth)
        env:
          APPS_SCRIPT_ID: ${{ secrets.APPS_SCRIPT_ID }}
          OAUTH_CLIENT_ID: ${{ secrets.OAUTH_CLIENT_ID }}
          OAUTH_CLIENT_SECRET: ${{ secrets.OAUTH_CLIENT_SECRET }}
          OAUTH_REFRESH_TOKEN: ${{ secrets.OAUTH_REFRESH_TOKEN }}
        run: node scripts/gas-deploy.js
```

### FAQ / Notes
- User vs Service Account enablement: The “Apps Script API” toggle is per user, not per service account. Impersonation or user OAuth is required.
- OAuth Consent Screen: Not required for service accounts with DWD. Required for 3‑legged OAuth clients (configure and publish as needed).
- Sharing: The impersonated user must have Editor (or Owner) access to the Apps Script project (share the Drive file if necessary).
- Admin Disablement: If Admin disables the “Google Apps Script API” service, you’ll see a different error indicating admin restriction.
- Propagation: Admin DWD changes usually take effect within minutes; allow 5–15 minutes. OAuth toggle in user settings is immediate.

### Minimal Changes Checklist (Option A)
- [ ] Admin: Turn ON Google Apps Script API service
- [ ] Enable DWD on service account and add scope `script.projects`
- [ ] Share Apps Script project with impersonated user
- [ ] Add secret `GAS_IMPERSONATED_USER`
- [ ] Update auth code to use `subject`
- [ ] Re‑run the workflow; expect success on `projects.updateContent`
