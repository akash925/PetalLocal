#!/bin/bash

# Neon Database Setup Script
# This script helps set up the Neon database integration for FarmDirect

echo "🚀 FarmDirect Neon Database Setup"
echo "================================="

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set. Please set your current database URL."
    exit 1
fi

if [ -z "$NEON_DATABASE_URL" ]; then
    echo "❌ NEON_DATABASE_URL is not set. Please set your Neon database URL."
    echo "📝 Get your Neon database URL from: https://console.neon.tech/"
    exit 1
fi

echo "✅ Environment variables configured"
echo "📊 Current Database: $DATABASE_URL"
echo "🎯 Target Database: $NEON_DATABASE_URL"

# Generate fresh migrations
echo ""
echo "🔄 Generating fresh migrations..."
npm run db:generate

# Push schema to Neon database
echo ""
echo "📤 Pushing schema to Neon database..."
NEON_DATABASE_URL=$NEON_DATABASE_URL npm run db:push

# Run the data migration script
echo ""
echo "🚚 Starting data migration..."
tsx scripts/setup-neon.ts

# Verify the setup
echo ""
echo "🔍 Verifying setup..."
tsx scripts/verify-neon.ts

echo ""
echo "✅ Neon database setup complete!"
echo "🔧 Next steps:"
echo "   1. Update your DATABASE_URL environment variable to use Neon"
echo "   2. Restart your application"
echo "   3. Test the application functionality"
echo ""
echo "📚 Commands available:"
echo "   - npm run neon:setup     # Run full setup"
echo "   - npm run neon:migrate   # Generate and push migrations"
echo "   - npm run neon:backup    # Create backup only"
echo "   - npm run seed           # Seed the database"