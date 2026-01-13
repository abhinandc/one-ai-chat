#!/bin/bash
# Script to apply automation templates seed data
# Usage: ./scripts/seed-automation-templates.sh

set -e

echo "========================================"
echo "Seeding Automation Templates"
echo "========================================"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Must run from project root directory"
    exit 1
fi

echo ""
echo "This will insert 13 automation templates into your database:"
echo "  - GSuite: 5 templates"
echo "  - Slack: 3 templates"
echo "  - Jira: 3 templates"
echo "  - Google Chat: 2 templates"
echo ""

# Prompt for confirmation
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Applying seed data..."

# Apply the seed file using psql via Supabase
npx supabase db seed

echo ""
echo "========================================"
echo "Templates seeded successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Navigate to /automations"
echo "  3. Click the 'Templates' tab"
echo "  4. You should see 13 pre-built templates"
echo ""
