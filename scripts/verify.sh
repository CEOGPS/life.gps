#!/bin/bash
# LifeOS1 Verify Deployment Script
# Usage: ./scripts/verify.sh

set -e

PAGES_URL="https://lifeos1.pages.dev"
WORKER_URL="https://lifeos1-api.ceogps.workers.dev"

echo "🔍 LifeOS1 Deployment Verification"
echo "=================================="

# Check Pages deployment
echo ""
echo "📄 Checking Cloudflare Pages: $PAGES_URL"
PAGES_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PAGES_URL" --max-time 10 || echo "000")
if [ "$PAGES_CODE" = "200" ]; then
    echo "✅ Pages: HTTP 200 OK"
else
    echo "❌ Pages: HTTP $PAGES_CODE"
fi

# Check Worker deployment
echo ""
echo "⚙️  Checking Worker API: $WORKER_URL"
WORKER_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/api/health" --max-time 10 || echo "000")
if [ "$WORKER_CODE" = "200" ] || [ "$WORKER_CODE" = "404" ]; then
    echo "✅ Worker: Responding (HTTP $WORKER_CODE)"
else
    echo "⚠️  Worker: HTTP $WORKER_CODE (may be expected if no /health endpoint)"
fi

# Check specific endpoints
echo ""
echo "🔌 Testing API endpoints..."

ENDPOINTS=(
    "/api/finance/balances"
    "/api/llm/invoke"
    "/api/youtube/search?q=test"
)

for endpoint in "${ENDPOINTS[@]}"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL$endpoint" --max-time 10 || echo "000")
    if [ "$CODE" = "200" ] || [ "$CODE" = "400" ] || [ "$CODE" = "401" ]; then
        echo "✅ $endpoint: HTTP $CODE"
    else
        echo "⚠️  $endpoint: HTTP $CODE"
    fi
done

echo ""
echo "🎉 Verification complete!"
echo "   Dashboard: $PAGES_URL"
echo "   Worker API: $WORKER_URL"