#!/bin/bash
# LifeOS1 Supabase Migration Script
# Usage: ./scripts/migrate.sh

set -e

echo "🗄️  LifeOS1 Supabase Migration"
echo "=============================="

# Check if Supabase CLI is available
if ! command -v npx supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npx supabase --version || echo "Supabase CLI will be installed via npx"
fi

# Link to project (if not already linked)
echo ""
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref mhvcdstgkyplhzjptgfr

# Push migrations
echo ""
echo "📤 Pushing migrations to Supabase..."
npx supabase db push --project-ref mhvcdstgkyplhzjptgfr

echo ""
echo "✅ Migrations applied successfully!"
echo "   Verify at: https://supabase.com/dashboard/project/mhvcdstgkyplhzjptgfr/editor"