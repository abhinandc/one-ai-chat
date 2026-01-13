/**
 * EdgeVault Legacy Credential Migration Script
 *
 * This script migrates all base64-encoded credentials to AES-256-GCM encryption.
 *
 * Usage:
 *   # Migrate all users
 *   npx tsx scripts/migrate-edgevault-credentials.ts
 *
 *   # Migrate specific user
 *   npx tsx scripts/migrate-edgevault-credentials.ts --user-id [USER_ID]
 *
 *   # Dry run (preview only)
 *   npx tsx scripts/migrate-edgevault-credentials.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const userIdIndex = args.indexOf('--user-id');
const targetUserId = userIdIndex !== -1 ? args[userIdIndex + 1] : null;

/**
 * Detect if a credential is using legacy base64 encoding
 */
function isLegacyBase64(encrypted: string): boolean {
  try {
    if (encrypted.startsWith('eyJ') && encrypted.length < 500) {
      const decoded = atob(encrypted);
      JSON.parse(decoded);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Encrypt credentials via Edge Function
 */
async function encryptViaEdgeFunction(credentials: Record<string, unknown>): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/edge-vault`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({
      action: 'encrypt',
      credentials,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Edge Function error: ${error}`);
  }

  const result = await response.json();
  return result.encrypted;
}

/**
 * Migrate a single credential
 */
async function migrateCredential(
  credentialId: string,
  userId: string,
  legacyEncrypted: string
): Promise<boolean> {
  try {
    console.log(`  Migrating credential: ${credentialId}`);

    // Decode legacy base64
    const decoded = atob(legacyEncrypted);
    const credentials = JSON.parse(decoded);

    if (isDryRun) {
      console.log(`    [DRY RUN] Would re-encrypt ${Object.keys(credentials).length} fields`);
      return true;
    }

    // Re-encrypt with AES-256-GCM
    const encrypted = await encryptViaEdgeFunction(credentials);

    // Update in database
    const { error } = await supabase
      .from('edge_vault_credentials')
      .update({ encrypted_credentials: encrypted })
      .eq('id', credentialId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    console.log(`    ✅ Successfully migrated`);
    return true;
  } catch (error) {
    console.error(`    ❌ Migration failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Migrate all credentials for a user
 */
async function migrateUser(userId: string): Promise<{ total: number; migrated: number; failed: number }> {
  console.log(`\n📦 Processing user: ${userId}`);

  // Fetch all credentials for user
  const { data: credentials, error } = await supabase
    .from('edge_vault_credentials')
    .select('id, encrypted_credentials, label, integration_type')
    .eq('user_id', userId);

  if (error) {
    console.error(`  ❌ Failed to fetch credentials:`, error.message);
    return { total: 0, migrated: 0, failed: 0 };
  }

  if (!credentials || credentials.length === 0) {
    console.log(`  No credentials found`);
    return { total: 0, migrated: 0, failed: 0 };
  }

  // Find legacy credentials
  const legacyCredentials = credentials.filter((c) => isLegacyBase64(c.encrypted_credentials));

  console.log(`  Total credentials: ${credentials.length}`);
  console.log(`  Legacy (base64): ${legacyCredentials.length}`);
  console.log(`  Already encrypted: ${credentials.length - legacyCredentials.length}`);

  if (legacyCredentials.length === 0) {
    console.log(`  ✅ No migration needed`);
    return { total: credentials.length, migrated: 0, failed: 0 };
  }

  // Migrate each legacy credential
  let migrated = 0;
  let failed = 0;

  for (const credential of legacyCredentials) {
    const success = await migrateCredential(credential.id, userId, credential.encrypted_credentials);
    if (success) {
      migrated++;
    } else {
      failed++;
    }
  }

  console.log(`  📊 Results: ${migrated} migrated, ${failed} failed`);
  return { total: credentials.length, migrated, failed };
}

/**
 * Main migration function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       EdgeVault Credential Migration                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  let stats = {
    totalUsers: 0,
    totalCredentials: 0,
    totalMigrated: 0,
    totalFailed: 0,
  };

  if (targetUserId) {
    // Migrate single user
    console.log(`🎯 Target: Single user (${targetUserId})`);
    const result = await migrateUser(targetUserId);
    stats.totalUsers = 1;
    stats.totalCredentials = result.total;
    stats.totalMigrated = result.migrated;
    stats.totalFailed = result.failed;
  } else {
    // Migrate all users
    console.log(`🎯 Target: All users with credentials`);

    // Get all users who have credentials
    const { data: userIds, error } = await supabase
      .from('edge_vault_credentials')
      .select('user_id')
      .order('user_id');

    if (error) {
      console.error('❌ Failed to fetch users:', error.message);
      process.exit(1);
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(userIds?.map((u) => u.user_id) || [])];
    stats.totalUsers = uniqueUserIds.length;

    console.log(`Found ${uniqueUserIds.length} users with credentials\n`);

    // Migrate each user
    for (const userId of uniqueUserIds) {
      const result = await migrateUser(userId);
      stats.totalCredentials += result.total;
      stats.totalMigrated += result.migrated;
      stats.totalFailed += result.failed;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   MIGRATION SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Users processed:        ${stats.totalUsers}`);
  console.log(`Total credentials:      ${stats.totalCredentials}`);
  console.log(`Successfully migrated:  ${stats.totalMigrated}`);
  console.log(`Failed:                 ${stats.totalFailed}`);
  console.log('');

  if (isDryRun) {
    console.log('🔍 DRY RUN - No changes were made');
    console.log('   Remove --dry-run flag to perform actual migration');
  } else if (stats.totalFailed > 0) {
    console.log('⚠️  Some credentials failed to migrate');
    console.log('   Check the logs above for details');
    process.exit(1);
  } else if (stats.totalMigrated > 0) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log('ℹ️  No legacy credentials found - nothing to migrate');
  }

  console.log('');
}

// Run migration
main().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
