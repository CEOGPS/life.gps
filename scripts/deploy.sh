#!/bin/bash
# LifeOS1 Build, Deploy & Verify Script
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 LifeOS1 Build & Deploy Pipeline"
echo "=================================="

# Step 1: Type check
echo ""
echo "📝 Step 1: TypeScript type checking..."
pnpm run lint
npx tsc --noEmit
echo "✅ Type check passed"

# Step 2: Build
echo ""
echo "🔨 Step 2: Building production bundle..."
pnpm run build
echo "✅ Build completed"

# Step 3: Deploy to Cloudflare Pages
echo ""
echo "☁️  Step 3: Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=lifeos1
echo "✅ Deployment completed"

# Step 4: Verify deployment
echo ""
echo "🔍 Step 4: Verifying deployment..."
DEPLOY_URL="https://lifeos1.pages.dev"
echo "   Waiting 5 seconds for CDN propagation..."
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Deployment verified: $DEPLOY_URL returns HTTP 200"
else
    echo "⚠️  Warning: $DEPLOY_URL returned HTTP $HTTP_CODE"
    echo "   Please verify manually at $DEPLOY_URL"
fi

echo ""
echo "🎉 Pipeline complete!"
echo "   Dashboard: https://lifeos1.pages.dev"
echo "   Worker API: https://lifeos1-api.ceogps.workers.dev"