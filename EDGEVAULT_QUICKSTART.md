# EdgeVault Quick Start Guide

**Get secure credential encryption running in 5 minutes.**

---

## 🚀 Quick Setup

### 1. Generate Encryption Key

```bash
./scripts/setup-edgevault-encryption.sh
```

This will:
- Generate a secure 256-bit encryption key
- Show you where to configure it
- Test the encryption (optional)

### 2. Configure Supabase

**Option A: Supabase Dashboard (Production)**
1. Go to your project: https://supabase.com/dashboard
2. Settings → Edge Functions → Secrets
3. Add secret: `EDGE_VAULT_ENCRYPTION_KEY` = `[your generated key]`

**Option B: CLI (Development)**
```bash
supabase secrets set EDGE_VAULT_ENCRYPTION_KEY='[your key]'
```

### 3. Deploy Edge Function

```bash
supabase functions deploy edge-vault
```

### 4. Test It Works

```typescript
import { edgeVaultService } from '@/services/edgeVaultService';

// Create a credential
const credential = await edgeVaultService.createCredential({
  integration_type: 'slack',
  label: 'My Workspace',
  credentials: { token: 'xoxb-...' }
}, userId);

console.log('Credential created:', credential.id);

// Decrypt when needed
const decrypted = await edgeVaultService.getDecryptedCredentials(
  credential.id,
  userId
);

console.log('Token:', decrypted.token);
```

---

## 🔄 Migrating Legacy Credentials

If you have existing base64-encoded credentials:

### Automatic Migration (Recommended)
Legacy credentials are automatically migrated on first access. No action needed.

### Manual Migration (Optional)
To proactively migrate all credentials:

```bash
# Dry run (preview only)
npx tsx scripts/migrate-edgevault-credentials.ts --dry-run

# Migrate all users
npx tsx scripts/migrate-edgevault-credentials.ts

# Migrate specific user
npx tsx scripts/migrate-edgevault-credentials.ts --user-id [USER_ID]
```

---

## 📖 Usage Examples

### Create Credential

```typescript
const credential = await edgeVaultService.createCredential({
  integration_type: 'n8n',
  label: 'Production Instance',
  credentials: {
    url: 'https://n8n.company.com',
    api_key: 'n8n_api_xxxxxxxxxxxx'
  }
}, userId);
```

### List Credentials

```typescript
const credentials = await edgeVaultService.getCredentials(userId);

credentials.forEach((cred) => {
  console.log(`${cred.label} (${cred.integration_type})`);
  // Note: encrypted_credentials field is encrypted, don't try to use it directly
});
```

### Decrypt Credential

```typescript
// Only decrypt when you need to use the credentials
const decrypted = await edgeVaultService.getDecryptedCredentials(
  credentialId,
  userId
);

// Use the credentials
await fetch(decrypted.url, {
  headers: { 'X-API-Key': decrypted.api_key }
});

// Credentials are automatically cleared from memory after use
```

### Validate Credential

```typescript
// Test if credentials still work
const isValid = await edgeVaultService.validateCredential(
  credentialId,
  userId
);

if (!isValid) {
  console.log('Credential expired or invalid');
}
```

### Update Credential

```typescript
await edgeVaultService.updateCredential(credentialId, userId, {
  label: 'Updated Label',
  credentials: { api_key: 'new-key-here' }
});
```

### Delete Credential

```typescript
await edgeVaultService.deleteCredential(credentialId, userId);
```

---

## 🛡️ Security Checklist

Before going to production:

- [ ] Encryption key generated with `openssl rand -hex 32`
- [ ] Key stored in Supabase Edge Function secrets (not git)
- [ ] Different keys for dev/staging/production
- [ ] Edge Functions deployed: `supabase functions list`
- [ ] Test credential creation/decryption works
- [ ] Legacy credentials migrated (if any)
- [ ] Key backed up in secure password manager
- [ ] RLS policies enabled on `edge_vault_credentials` table
- [ ] HTTPS enforced for all API calls

---

## 🐛 Troubleshooting

### "Failed to encrypt credentials"

**Problem:** Edge Function not accessible

**Solution:**
```bash
# Check if function is deployed
supabase functions list

# Deploy if missing
supabase functions deploy edge-vault

# Check logs
supabase functions logs edge-vault
```

### "Missing EDGE_VAULT_ENCRYPTION_KEY"

**Problem:** Encryption key not set in Edge Function environment

**Solution:**
```bash
# Set the key
supabase secrets set EDGE_VAULT_ENCRYPTION_KEY='[your key]'

# Verify it's set
supabase secrets list
```

### "Decryption returned empty credentials"

**Problem:** Wrong encryption key or corrupted data

**Solution:**
1. Verify key matches what was used for encryption
2. Check if credential was manually edited in database
3. Try recreating the credential

### "Credential not found or access denied"

**Problem:** RLS policy blocking access

**Solution:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'edge_vault_credentials';

-- Check user owns the credential
SELECT user_id, label
FROM edge_vault_credentials
WHERE id = '[CREDENTIAL_ID]';
```

---

## 📚 Learn More

- **Full Documentation:** [EDGEVAULT_SECURITY.md](./EDGEVAULT_SECURITY.md)
- **Edge Function Code:** [supabase/functions/edge-vault/](./supabase/functions/edge-vault/)
- **Service Code:** [src/services/edgeVaultService.ts](./src/services/edgeVaultService.ts)

---

## 🆘 Support

**Questions or issues?**
- Check [EDGEVAULT_SECURITY.md](./EDGEVAULT_SECURITY.md) for detailed documentation
- Review function logs: `supabase functions logs edge-vault`
- Contact: security@oneorigin.us

---

**Last Updated:** January 9, 2026
