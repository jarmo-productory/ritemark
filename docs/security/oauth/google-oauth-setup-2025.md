# Google Cloud Console OAuth Application Setup Guide 2025

## Overview

This comprehensive guide covers the complete process of setting up OAuth 2.0 applications in Google Cloud Console for JavaScript applications with Google Drive API integration, updated for 2025 requirements and best practices.

## 1. Step-by-Step OAuth 2.0 Client Creation Process

### Step 1: Access Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Go to **APIs & Services > Credentials**

### Step 2: Create OAuth Client ID
1. Click **"+ Create Credentials"**
2. Select **"OAuth client ID"**
3. Choose **"Web application"** as the application type
4. Enter a descriptive name for your OAuth client

### Step 3: Configure Client Settings
- **Client Type**: Web application (for JavaScript apps)
- **Security**: JavaScript applications are considered "public clients" - they cannot securely store secrets as they reside on user devices
- **Client Secret Handling**: For clients created after June 2025, client secrets are only visible once during creation

> **⚠️ Critical 2025 Update**: Client secrets are only visible and downloadable at creation time. Download and store them securely immediately.

## 2. Required APIs to Enable

### Enable Google Drive API
1. Go to **APIs & Services > Library**
2. Search for **"Google Drive API"**
3. Click **Enable**

### Additional APIs (if needed)
- **Google Picker API** - For file picker functionality
- **Google Workspace APIs** - For extended functionality
- **Google Identity Services** - For modern authentication flows

### API Scope Configuration
Navigate to **APIs & Services > OAuth consent screen** to configure scopes:

```javascript
// Recommended scopes for Drive integration
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',  // Recommended: Per-file access
  'https://www.googleapis.com/auth/drive.appfolder'  // App-specific folder access
];

// Full access scope (use sparingly)
// 'https://www.googleapis.com/auth/drive'  // Full Drive access - requires verification
```

## 3. Authorized JavaScript Origins Configuration

### Development Configuration
```
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:5173
```

### Production Configuration
```
https://yourdomain.com
https://www.yourdomain.com
https://app.yourdomain.com
```

### Key Requirements
- **HTTPS Required**: All production origins must use HTTPS
- **Localhost Exception**: HTTP allowed for localhost during development
- **Exact Matching**: Origins must match exactly (including ports)
- **Multiple Environments**: Add all necessary development and staging environments

## 4. Redirect URI Best Practices

### Development Redirect URIs
```
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
http://127.0.0.1:3000/auth/google/callback
```

### Production Redirect URIs
```
https://yourdomain.com/auth/callback
https://app.yourdomain.com/auth/google/callback
https://www.yourdomain.com/oauth/callback
```

### Configuration Best Practices
1. **Exact Match Required**: URLs must match exactly in your application code
2. **Trailing Slash Sensitivity**: `http://localhost:3000` vs `http://localhost:3000/` are different
3. **Separate Clients**: Use different OAuth client IDs for development and production
4. **Path Specificity**: Include the full callback path, not just the domain

### Common Patterns
```javascript
// React Router callback
https://yourapp.com/auth/callback

// Next.js API route
https://yourapp.com/api/auth/callback/google

// Express.js route
https://yourapp.com/oauth/google/callback
```

## 5. OAuth Consent Screen Configuration Requirements

### Basic Information
- **App Name**: Clear, descriptive application name
- **User Support Email**: Valid support email address
- **Developer Contact Information**: Required email for Google notifications

### Required Links for Production Apps
- **App Domain**: Primary domain of your application
- **Home Page**: Publicly accessible page describing your app
- **Privacy Policy**: Must be hosted on same domain as home page
- **Terms of Service**: Optional but recommended

### User Type Configuration
- **Internal**: For Google Workspace organizations only
- **External**: For public applications (requires verification for production)

### Scopes Declaration
```javascript
// Configure in OAuth consent screen
const requiredScopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];
```

## 6. Domain Verification Requirements for Production Apps

### Google Search Console Verification
1. Access [Google Search Console](https://search.google.com/search-console)
2. Add your domain property
3. Verify ownership using one of these methods:
   - HTML file upload
   - HTML tag in head section
   - DNS record
   - Google Analytics
   - Google Tag Manager

### Verification Requirements
- **All Associated Domains**: Verify domains used in:
  - Home page URL
  - Privacy policy URL
  - Terms of service URL
  - Authorized redirect URIs
  - Authorized JavaScript origins

### Brand Verification Process
1. **Publish App**: Change from "Testing" to "Production"
2. **Submit for Verification**: Click "Prepare for Verification"
3. **Brand Information**: App name and logo verification
4. **Scope Review**: Sensitive/restricted scopes require additional review

### Verification Timeline
- **Non-sensitive scopes**: Lighter "brand verification" process
- **Sensitive/restricted scopes**: Full app verification required
- **Timeline**: Verification can take several weeks

## 7. Environment-Specific Configuration Strategies

### Environment Variables Structure
```bash
# Development (.env.development)
REACT_APP_GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
REACT_APP_GOOGLE_SCOPES=https://www.googleapis.com/auth/drive.file

# Production (.env.production)
REACT_APP_GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_REDIRECT_URI=https://yourapp.com/auth/callback
REACT_APP_GOOGLE_SCOPES=https://www.googleapis.com/auth/drive.file
```

### Best Practices for Environment Variables
1. **Prefix Convention**: Use `REACT_APP_` for Create React App or framework-specific prefixes
2. **No Secrets in Frontend**: Never include client secrets in JavaScript applications
3. **Environment Separation**: Use different OAuth client IDs for each environment
4. **Uppercase with Underscores**: Follow `UPPER_CASE_WITH_UNDERSCORES` convention
5. **Validation**: Always validate environment variables are set before use

### Configuration Management
```javascript
// config/oauth.js
const getOAuthConfig = () => {
  const config = {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI,
    scopes: process.env.REACT_APP_GOOGLE_SCOPES?.split(',') || [
      'https://www.googleapis.com/auth/drive.file'
    ]
  };

  // Validation
  if (!config.clientId) {
    throw new Error('REACT_APP_GOOGLE_CLIENT_ID is required');
  }
  if (!config.redirectUri) {
    throw new Error('REACT_APP_GOOGLE_REDIRECT_URI is required');
  }

  return config;
};

export default getOAuthConfig;
```

### Deployment Platforms Configuration

#### Vercel
```bash
# Add via Vercel CLI or dashboard
vercel env add REACT_APP_GOOGLE_CLIENT_ID production
vercel env add REACT_APP_GOOGLE_REDIRECT_URI production
```

#### Netlify
```bash
# netlify.toml
[build.environment]
  REACT_APP_GOOGLE_CLIENT_ID = "your-client-id"
  REACT_APP_GOOGLE_REDIRECT_URI = "https://yourapp.netlify.app/auth/callback"
```

#### Google Cloud Run
```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project/app
        env:
        - name: REACT_APP_GOOGLE_CLIENT_ID
          value: "your-client-id"
        - name: REACT_APP_GOOGLE_REDIRECT_URI
          value: "https://yourapp-123-uc.a.run.app/auth/callback"
```

## Implementation Example

### JavaScript OAuth Flow
```javascript
// oauth.js
import { getOAuthConfig } from './config/oauth';

class GoogleOAuth {
  constructor() {
    this.config = getOAuthConfig();
    this.initGoogleAPI();
  }

  async initGoogleAPI() {
    await new Promise((resolve) => {
      window.gapi.load('auth2', resolve);
    });

    this.authInstance = window.gapi.auth2.init({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri
    });
  }

  async signIn() {
    try {
      const authUser = await this.authInstance.signIn();
      const accessToken = authUser.getAuthResponse().access_token;
      return { success: true, accessToken };
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      return { success: false, error };
    }
  }

  async signOut() {
    await this.authInstance.signOut();
  }
}

export default GoogleOAuth;
```

## Security Considerations

### Client-Side Security
1. **No Client Secrets**: JavaScript apps are public clients
2. **HTTPS in Production**: Always use HTTPS for production
3. **Origin Validation**: Strict origin checking by Google
4. **Token Storage**: Use secure storage for access tokens
5. **Scope Minimization**: Request only necessary scopes

### Production Checklist
- [ ] OAuth client configured for production domain
- [ ] HTTPS enabled and certificates valid
- [ ] Domain ownership verified in Search Console
- [ ] Privacy policy and terms of service published
- [ ] App submitted for verification (if using sensitive scopes)
- [ ] Environment variables configured correctly
- [ ] Redirect URIs match exactly
- [ ] Error handling implemented for OAuth failures

## Common Issues and Troubleshooting

### Redirect URI Mismatch
- **Error**: `redirect_uri_mismatch`
- **Solution**: Ensure exact match between app code and Google Cloud Console

### Origin Mismatch
- **Error**: `origin_mismatch`
- **Solution**: Add exact origin (including port) to Authorized JavaScript Origins

### Client ID Not Found
- **Error**: `invalid_client`
- **Solution**: Verify client ID is correct and environment variables are set

### Scope Verification Required
- **Error**: App needs verification
- **Solution**: Use `drive.file` scope or submit app for verification

## 2025 Updates Summary

1. **Client Secret Visibility**: Only visible once during creation (June 2025+)
2. **Enhanced Security**: Stricter domain verification requirements
3. **Scope Policies**: Preference for minimal scopes like `drive.file`
4. **Verification Process**: Streamlined for non-sensitive scopes
5. **Environment Migration**: Firebase `functions.config` deprecated by end of 2025

This guide provides a complete foundation for setting up OAuth 2.0 with Google Cloud Console for JavaScript applications in 2025, ensuring security, compliance, and best practices.