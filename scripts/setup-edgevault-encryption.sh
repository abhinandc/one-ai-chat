#!/bin/bash
#
# EdgeVault Encryption Setup Script
#
# This script helps you:
# 1. Generate a secure 256-bit encryption key
# 2. Configure the Supabase Edge Function environment
# 3. Verify the encryption is working
#
# Usage: ./scripts/setup-edgevault-encryption.sh
#

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          EdgeVault Encryption Setup                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl is not installed"
    echo "   Install it with: sudo apt-get install openssl (Ubuntu/Debian)"
    echo "   or: brew install openssl (macOS)"
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Warning: Supabase CLI not found"
    echo "   Install it from: https://supabase.com/docs/guides/cli"
    echo ""
fi

echo "📦 Step 1: Generating 256-bit encryption key..."
echo ""

# Generate hex key (32 bytes = 256 bits)
HEX_KEY=$(openssl rand -hex 32)

# Generate base64 key as alternative
BASE64_KEY=$(openssl rand -base64 32 | head -c 44)

echo "✅ Encryption key generated successfully!"
echo ""
echo "┌────────────────────────────────────────────────────────────┐"
echo "│                   ENCRYPTION KEY (HEX)                     │"
echo "├────────────────────────────────────────────────────────────┤"
echo "│ $HEX_KEY │"
echo "└────────────────────────────────────────────────────────────┘"
echo ""
echo "Alternative format (Base64):"
echo "$BASE64_KEY"
echo ""

# Warning about key security
echo "⚠️  IMPORTANT SECURITY NOTICE:"
echo "   • NEVER commit this key to git"
echo "   • NEVER share this key via email/Slack/etc."
echo "   • Store in a secure password manager"
echo "   • Use different keys for dev/staging/production"
echo ""

# Provide instructions for different deployment methods
echo "📝 Step 2: Configure the encryption key"
echo ""
echo "Choose your deployment method:"
echo ""
echo "A) Supabase Dashboard (Recommended for production):"
echo "   1. Go to: https://supabase.com/dashboard/project/[PROJECT_ID]/settings/functions"
echo "   2. Click 'Edge Functions' → 'Manage secrets'"
echo "   3. Add secret:"
echo "      Name:  EDGE_VAULT_ENCRYPTION_KEY"
echo "      Value: $HEX_KEY"
echo "   4. Save and deploy functions"
echo ""

echo "B) Supabase CLI (For local development):"
echo "   Run this command:"
echo "   supabase secrets set EDGE_VAULT_ENCRYPTION_KEY='$HEX_KEY'"
echo ""

echo "C) Environment file (Local dev only - NOT for production):"
echo "   Create file: .env.local"
echo "   Add line: EDGE_VAULT_ENCRYPTION_KEY=$HEX_KEY"
echo "   ⚠️  DO NOT commit .env.local to git!"
echo ""

# Test encryption if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo ""
    echo "🧪 Step 3: Test encryption (optional)"
    echo ""
    read -p "Would you like to test the encryption now? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Testing Edge Function encryption..."

        # Set secret temporarily for test
        supabase secrets set EDGE_VAULT_ENCRYPTION_KEY="$HEX_KEY" --project-ref "${PROJECT_REF:-local}"

        # Test payload
        TEST_PAYLOAD='{"action":"encrypt","credentials":{"test":"value"}}'

        echo "Calling edge-vault function..."
        RESPONSE=$(curl -s -X POST \
            "${SUPABASE_URL:-http://localhost:54321}/functions/v1/edge-vault" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-}" \
            -H "Content-Type: application/json" \
            -d "$TEST_PAYLOAD")

        if echo "$RESPONSE" | grep -q "encrypted"; then
            echo "✅ Encryption test successful!"
            echo "Response: $RESPONSE"
        else
            echo "❌ Encryption test failed"
            echo "Response: $RESPONSE"
            echo ""
            echo "Troubleshooting:"
            echo "1. Ensure Edge Functions are deployed: supabase functions deploy"
            echo "2. Check function logs: supabase functions logs edge-vault"
            echo "3. Verify the key was set correctly: supabase secrets list"
        fi
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Review EDGEVAULT_SECURITY.md for full documentation"
echo "   2. Deploy Edge Functions: supabase functions deploy"
echo "   3. Test credential creation in the app"
echo "   4. (Optional) Migrate legacy credentials: npm run migrate:edgevault"
echo ""

# Save key to temporary file (for backup purposes)
KEY_FILE=".edgevault-key-$(date +%Y%m%d-%H%M%S).txt"
echo "$HEX_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"
echo "🔐 Encryption key backed up to: $KEY_FILE"
echo "   Move this file to a secure location and delete it from this directory"
echo ""

exit 0
