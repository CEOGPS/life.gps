#!/bin/bash
# LifeOS1 Worker Deploy Script
# Usage: ./scripts/deploy-worker.sh

set -e

echo "⚙️  LifeOS1 Worker Deployment"
echo "============================="

# Deploy the API worker
echo ""
echo "📦 Deploying worker: lifeos1-api..."
cd worker
npx wrangler deploy --config wrangler.worker.toml

echo ""
echo "✅ Worker deployed successfully!"
echo "   Worker URL: https://lifeos1-api.ceogps.workers.dev"