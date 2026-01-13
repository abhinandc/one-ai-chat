# EdgeVault Production Deployment Guide

**Target:** Production deployment with AES-256-GCM encryption
**Estimated Time:** 30 minutes

---

## ⚠️ Pre-Deployment Checklist

### 1. Environment Preparation
```bash
# ✅ Ensure you have:
- [ ] Supabase CLI installed
- [ ] openssl installed
- [ ] Node.js/npm installed
- [ ] Production database access
- [ ] Supabase project admin access
```

### 2. Key Generation
```bash
# Generate production encryption key
./scripts/setup-edgevault-encryption.sh

# ✅ Save key to secure location:
- [ ] Stored in team's password manager (1Password/LastPass)
- [ ] Backed up to secure location
- [ ] NOT committed to git
- [ ] NOT shared via email/Slack
```

### 3. Supabase Configuration
```bash
# ✅ Configure Edge Function secrets:
- [ ] Go to: Supabase Dashboard → Settings → Edge Functions
- [ ] Add secret: EDGE_VAULT_ENCRYPTION_KEY = [generated key]
- [ ] Verify secret is set: supabase secrets list
```

### 4. Deploy Edge Function
```bash
# Deploy the edge-vault function
supabase functions deploy edge-vault

# ✅ Verify deployment:
- [ ] Function appears in: supabase functions list
- [ ] No deployment errors in logs
- [ ] Function is accessible via HTTPS
```

### 5. Test Encryption
```bash
# Test encryption endpoint
curl -X POST \
  'https://[PROJECT_ID].supabase.co/functions/v1/edge-vault' \
  -H 'Authorization: Bearer [USER_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"action":"encrypt","credentials":{"test":"value"}}'

# ✅ Expected response:
# {"encrypted":"[long base64 string]"}

# ✅ Verify:
- [ ] Response contains "encrypted" field
- [ ] Encrypted string is 200+ characters
- [ ] No errors in function logs
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Edge Function
```bash
# From project root
cd /mnt/nas/projects/one-ai-chat

# Deploy edge-vault function
supabase functions deploy edge-vault

# Check deployment
supabase functions list

# Expected output:
# NAME         DEPLOYED  VERSION
# edge-vault   Yes       [version]
```

### Step 2: Verify RLS Policies
```sql
-- Check RLS is enabled on credentials table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'edge_vault_credentials';

-- Expected: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'edge_vault_credentials';

-- Expected: Multiple policies for INSERT, UPDATE, DELETE, SELECT
```

### Step 3: Test Credential Creation
```typescript
// In browser console or test script
import { edgeVaultService } from '@/services/edgeVaultService';
import { supabase } from '@/integrations/supabase';

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Create test credential
const credential = await edgeVaultService.createCredential({
  integration_type: 'custom',
  label: 'Production Test',
  credentials: {
    test_key: 'test_value_' + Date.now()
  }
}, user.id);

console.log('Created:', credential.id);

// Verify encryption (should be long base64 string)
console.log('Encrypted:', credential.encrypted_credentials.substring(0, 50) + '...');

// Decrypt and verify
const decrypted = await edgeVaultService.getDecryptedCredentials(
  credential.id,
  user.id
);
console.log('Decrypted:', decrypted);

// Clean up
await edgeVaultService.deleteCredential(credential.id, user.id);
console.log('✅ Test passed');
```

### Step 4: Monitor Logs
```bash
# Watch Edge Function logs
supabase functions logs edge-vault --tail

# Look for:
# ✅ No error messages
# ✅ Successful encryption/decryption operations
# ❌ Any "Missing EDGE_VAULT_ENCRYPTION_KEY" errors
# ❌ Any decryption failures
```

---

## 🔄 Migration (If Existing Credentials)

### Option A: Automatic Migration (Recommended)
**No action needed.** Legacy credentials are automatically migrated on first access.

**When it happens:**
- User accesses existing credential
- Service detects base64 format
- Service re-encrypts with AES-256-GCM
- Service updates database
- User gets decrypted credentials
- Future accesses use AES-256-GCM

### Option B: Proactive Migration (Optional)
Migrate all credentials immediately without waiting for user access.

```bash
# Preview migration (dry run)
npx tsx scripts/migrate-edgevault-credentials.ts --dry-run

# Review output:
# - How many credentials will be migrated
# - Which users are affected
# - Any potential errors

# Execute migration
npx tsx scripts/migrate-edgevault-credentials.ts

# Expected output:
# ╔════════════════════════════════════════════════════════════╗
# ║       EdgeVault Credential Migration                       ║
# ╚════════════════════════════════════════════════════════════╝
#
# Users processed:        X
# Total credentials:      Y
# Successfully migrated:  Z
# Failed:                 0
#
# ✅ Migration completed successfully!
```

---

## 🧪 Validation Tests

### Test 1: Encryption Works
```bash
# Create a credential via UI
# 1. Go to Automations page
# 2. Add new integration (e.g., Slack)
# 3. Enter credentials
# 4. Save

# Verify in database
SELECT id, label, substring(encrypted_credentials, 1, 50) as preview
FROM edge_vault_credentials
ORDER BY created_at DESC
LIMIT 1;

# ✅ Should see:
# - Long base64 string (200+ chars)
# - NOT readable JSON
```

### Test 2: Decryption Works
```bash
# Use the credential in an automation
# 1. Configure automation with the credential
# 2. Run automation
# 3. Check automation logs

# ✅ Should see:
# - Automation successfully accessed credential
# - No decryption errors
# - API calls succeeded
```

### Test 3: RLS Works
```sql
-- Try to access another user's credential (should fail)
SELECT * FROM edge_vault_credentials
WHERE user_id != auth.uid()
LIMIT 1;

-- ✅ Should return: 0 rows (RLS blocks access)
```

### Test 4: Integrity Check
```sql
-- Try to manually modify encrypted credential
UPDATE edge_vault_credentials
SET encrypted_credentials = 'tampered_data'
WHERE id = '[SOME_CREDENTIAL_ID]';

-- Now try to decrypt via API
-- ✅ Should fail with: "Failed to decrypt credential"
-- ✅ GCM authentication tag detects tampering
```

---

## 🔐 Security Verification

### 1. Key Storage
```bash
# ✅ Verify key is NOT in git
git grep -i "EDGE_VAULT_ENCRYPTION_KEY" .env .env.local .env.production

# Should return: nothing (key not committed)

# ✅ Verify key is in Supabase secrets
supabase secrets list

# Should show: EDGE_VAULT_ENCRYPTION_KEY (without actual value)
```

### 2. Database Encryption
```sql
-- ✅ Check all credentials are encrypted
SELECT
  id,
  label,
  integration_type,
  CASE
    WHEN encrypted_credentials ~ '^[A-Za-z0-9+/=]{200,}$' THEN '✅ Encrypted'
    WHEN encrypted_credentials LIKE 'eyJ%' THEN '⚠️ Legacy (will auto-migrate)'
    ELSE '❌ Invalid format'
  END as encryption_status
FROM edge_vault_credentials;

-- Goal: All should be "✅ Encrypted" or "⚠️ Legacy"
```

### 3. Edge Function Security
```bash
# ✅ Test authentication required
curl -X POST \
  'https://[PROJECT_ID].supabase.co/functions/v1/edge-vault' \
  -H 'Content-Type: application/json' \
  -d '{"action":"decrypt","credential_id":"test"}'

# Expected: 401 Unauthorized (authentication required)

# ✅ Test authorization enforced
# (Use valid token for User A, try to access User B's credential)
curl -X POST \
  'https://[PROJECT_ID].supabase.co/functions/v1/edge-vault' \
  -H 'Authorization: Bearer [USER_A_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"action":"decrypt","credential_id":"[USER_B_CREDENTIAL_ID]"}'

# Expected: 403 Forbidden (authorization denied)
```

---

## 📊 Monitoring

### Metrics to Track
```sql
-- Credential creation rate
SELECT
  date_trunc('day', created_at) as day,
  COUNT(*) as credentials_created
FROM edge_vault_credentials
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;

-- Validation failure rate
SELECT
  integration_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
  ROUND(100.0 * SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate
FROM edge_vault_credentials
GROUP BY integration_type;

-- Recent validation attempts
SELECT
  id,
  label,
  integration_type,
  status,
  last_validated_at
FROM edge_vault_credentials
ORDER BY last_validated_at DESC
LIMIT 10;
```

### Alerts to Configure
- ❌ **High decryption failure rate** (> 5%)
- ❌ **Edge Function errors** (any)
- ❌ **Unusual access patterns** (bulk downloads)
- ⚠️ **Legacy credentials detected** (manual migration needed)

---

## 🚨 Rollback Plan

### If Issues Arise

**1. Edge Function Issues**
```bash
# Rollback to previous version
supabase functions delete edge-vault --version [PREVIOUS_VERSION]

# Or redeploy from git
git checkout [PREVIOUS_COMMIT]
supabase functions deploy edge-vault
```

**2. Key Issues**
```bash
# If wrong key was set, update it
supabase secrets set EDGE_VAULT_ENCRYPTION_KEY='[CORRECT_KEY]'

# Note: This will NOT affect existing credentials
# (they were encrypted with the original key)
```

**3. Database Issues**
```sql
-- If RLS is blocking legitimate access
ALTER TABLE edge_vault_credentials DISABLE ROW LEVEL SECURITY;

-- WARNING: Only do this temporarily while debugging
-- Re-enable ASAP: ALTER TABLE edge_vault_credentials ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Edge Function deployed successfully
- [ ] Encryption key configured in Supabase
- [ ] Test credential created and decrypted
- [ ] No errors in function logs
- [ ] RLS policies verified working
- [ ] .gitignore updated (no keys committed)

### Short-term (Week 1)
- [ ] Monitor Edge Function logs daily
- [ ] Check for any decryption failures
- [ ] Verify all new credentials are encrypted
- [ ] (Optional) Run migration script for legacy credentials
- [ ] Update team documentation

### Long-term (Month 1+)
- [ ] Review credential validation failure rates
- [ ] Audit access patterns
- [ ] Document any issues encountered
- [ ] Schedule first key rotation (12 months)
- [ ] Train team on EdgeVault usage

---

## 📞 Support

### If You Encounter Issues

**1. Check Logs**
```bash
supabase functions logs edge-vault --tail
```

**2. Verify Configuration**
```bash
# Check secrets
supabase secrets list

# Check function deployment
supabase functions list
```

**3. Test Encryption Manually**
```bash
# Test encrypt action
curl -X POST 'https://[PROJECT].supabase.co/functions/v1/edge-vault' \
  -H 'Authorization: Bearer [TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"action":"encrypt","credentials":{"test":"value"}}'
```

**4. Consult Documentation**
- **Quick Start:** [EDGEVAULT_QUICKSTART.md](./EDGEVAULT_QUICKSTART.md)
- **Security Guide:** [EDGEVAULT_SECURITY.md](./EDGEVAULT_SECURITY.md)
- **Implementation Summary:** [SECURITY_FIX_SUMMARY.md](./SECURITY_FIX_SUMMARY.md)

**5. Contact Team**
- Email: security@oneorigin.us
- Critical issues: Immediate response

---

## 📝 Change Log

**v1.0.0 - January 9, 2026**
- Initial production deployment
- AES-256-GCM encryption implemented
- Legacy base64 migration support
- Comprehensive security documentation

---

**Deployment prepared by:** Claude (Backend Agent)
**Last updated:** January 9, 2026
**Next review:** Post-deployment (7 days)