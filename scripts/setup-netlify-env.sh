#!/bin/bash
# Sprint 20 - Netlify Environment Variables Setup Script

echo "🔧 Sprint 20: Netlify Environment Variables Setup"
echo "================================================"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Install with:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

echo "✅ Netlify CLI found"
echo ""

# Check if logged in
if ! netlify status &> /dev/null; then
    echo "❌ Not logged in to Netlify. Run:"
    echo "   netlify login"
    exit 1
fi

echo "✅ Netlify authenticated"
echo ""

# Get Google Client Secret
echo "📋 Step 1: Get Google Client Secret"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials"
echo "   2. Find: 730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv"
echo "   3. Copy the Client Secret"
echo ""
read -p "   Paste Client Secret here: " CLIENT_SECRET

if [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Client Secret cannot be empty"
    exit 1
fi

echo ""
echo "🚀 Setting environment variables..."
echo ""

# Set GOOGLE_CLIENT_ID
echo "   Setting GOOGLE_CLIENT_ID..."
netlify env:set GOOGLE_CLIENT_ID "730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com" --silent

# Set GOOGLE_CLIENT_SECRET
echo "   Setting GOOGLE_CLIENT_SECRET..."
netlify env:set GOOGLE_CLIENT_SECRET "$CLIENT_SECRET" --silent

# Set FRONTEND_URL
echo "   Setting FRONTEND_URL..."
netlify env:set FRONTEND_URL "https://ritemark.netlify.app" --silent

echo ""
echo "✅ Environment variables configured!"
echo ""

# Update local .env file
echo "📝 Updating local .env file..."
cat > .env << ENVEOF
# Netlify Functions Environment Variables (Sprint 20 - Phase 0)
GOOGLE_CLIENT_ID=730176557860-qpl0a6va0jcpi6s351hgv3afqqt01psv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=$CLIENT_SECRET
FRONTEND_URL=http://localhost:8888
ENVEOF

echo "✅ Local .env file updated"
echo ""

echo "📊 Current environment variables:"
netlify env:list

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "   1. Add Netlify callback URIs to Google Cloud Console (see docs/sprints/sprint-20/google-cloud-setup.md)"
echo "   2. Test backend OAuth: netlify dev"
echo ""
