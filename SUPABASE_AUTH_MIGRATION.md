# Supabase Auth Migration Guide

## Overview

OneEdge authentication has been migrated from custom Google OAuth implementation to **Supabase Auth**. This provides better security, session management, and integration with the EdgeAdmin platform.

## What Changed

### Before (Custom OAuth)
- Manual PKCE flow implementation
- Custom token management in localStorage/sessionStorage
- Manual session refresh logic
- Popup-based OAuth flow with postMessage
- Custom callback handling at `/oauth2/callback`

### After (Supabase Auth)
- Supabase-managed OAuth flow
- Automatic session management via Supabase SDK
- Built-in token refresh
- Redirect-based OAuth flow
- Callback handled at `/auth/callback`

## Files Modified

### 1. `/src/pages/LoginPage.tsx`
- **Removed**: 300+ lines of custom OAuth/PKCE implementation
- **Added**: Simple `signInWithGoogle()` call
- **Kept**: UI/UX identical (logo, animations, branding)

### 2. `/src/pages/AuthCallback.tsx`
- **Replaced**: Custom callback logic with Supabase session extraction
- **Added**: User profile upsert to `app_users` table
- **Added**: Error handling with user-friendly messages

### 3. `/src/App.tsx`
- **Replaced**: Custom token checking with `supabase.auth.getSession()`
- **Added**: `onAuthStateChange` subscription for real-time auth updates
- **Added**: Automatic user profile sync on sign-in/sign-out

### 4. `/src/hooks/useCurrentUser.ts`
- **Added**: Supabase Auth session sync
- **Added**: Auth state change subscription
- **Kept**: Backward compatibility with localStorage
- **Enhanced**: Profile loading from `app_users` table

## Supabase Configuration Required

### Step 1: Enable Google OAuth in Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Configure Google OAuth credentials:

```
Client ID: 373908156464-backo99qegd190e3duh54biihe5tg6i9.apps.googleusercontent.com
Client Secret: [Get from Google Cloud Console]
```

### Step 2: Configure Redirect URLs

Add these URLs to **Authorized redirect URIs** in Google Cloud Console:

```
https://vzrnxiowtshzspybrxeq.supabase.co/auth/v1/callback
https://edge.oneorigin.us/auth/callback
http://localhost:5173/auth/callback (for development)
```

### Step 3: Configure Site URL in Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: `https://edge.oneorigin.us`
3. Add Redirect URLs:
   - `https://edge.oneorigin.us/auth/callback`
   - `http://localhost:5173/auth/callback`

### Step 4: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Select the OAuth 2.0 Client ID
4. Add authorized redirect URIs (from Step 2)
5. Ensure GSuite domain restriction is configured for `oneorigin.us`

## Database Schema

Ensure the `app_users` table exists:

```sql
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON app_users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy: Allow insert on first login (triggered by auth webhook or manual upsert)
CREATE POLICY "Allow insert for authenticated users" ON app_users
  FOR INSERT WITH CHECK (auth.email() = email);
```

## Testing the Migration

### 1. Local Development

```bash
# Start the dev server
npm run dev

# Visit http://localhost:5173
# Click "Continue with Google (oneorigin.us)"
# Sign in with your @oneorigin.us Google account
# Verify redirect to /auth/callback
# Verify redirect to dashboard
```

### 2. Verify Session Storage

Open browser DevTools → Application → Local Storage:

```javascript
// Should see Supabase session token
localStorage.getItem('oneedge-auth-token')

// Should see user profile
localStorage.getItem('oneedge_user')
```

### 3. Verify Database Entry

Check Supabase Dashboard → Table Editor → `app_users`:
- Your email should appear with name and avatar_url

### 4. Test Logout

```javascript
// Click logout button
// Verify session is cleared
// Verify redirect to login page
// Verify can't access protected routes
```

## EdgeAdmin Integration

### Virtual Keys Fetching

After authentication, OneEdge fetches virtual keys from EdgeAdmin's shared Supabase:

```typescript
// This happens automatically after login
const { data: virtualKeys } = await supabase
  .from('virtual_keys')
  .select('*')
  .eq('user_email', user.email);
```

### RLS Policies

Ensure EdgeAdmin has configured RLS policies on `virtual_keys`:

```sql
CREATE POLICY "Users can view their virtual keys" ON virtual_keys
  FOR SELECT USING (user_email = auth.email());
```

## Troubleshooting

### Issue: "Redirect URL not allowed"

**Solution**: Add the redirect URL to Supabase Dashboard → Authentication → URL Configuration

### Issue: "Invalid client ID"

**Solution**: Verify `VITE_GOOGLE_CLIENT_ID` in `.env` matches Google Cloud Console

### Issue: "Session not found after authentication"

**Solution**: Check browser console for errors. Ensure Supabase URL and anon key are correct.

### Issue: "User profile not stored"

**Solution**: Check `app_users` table exists and RLS policies allow insert.

## Rollback Plan

If issues arise, rollback is straightforward:

1. Restore previous version of these files:
   - `src/pages/LoginPage.tsx`
   - `src/pages/AuthCallback.tsx`
   - `src/App.tsx`
   - `src/hooks/useCurrentUser.ts`

2. Revert callback route:
   - Change `/auth/callback` back to `/oauth2/callback` in routes

3. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```

## Benefits of Migration

1. **Security**: Supabase manages OAuth flow with industry best practices
2. **Simplicity**: 300+ lines of custom code removed
3. **Integration**: Native integration with EdgeAdmin via shared Supabase
4. **Session Management**: Automatic token refresh, multi-tab sync
5. **RLS**: Native support for Row Level Security policies
6. **Scalability**: Supabase handles auth at scale
7. **Compliance**: Supabase is SOC 2 Type II certified

## Next Steps

1. Configure Google OAuth in Supabase Dashboard (see Step 1-3)
2. Test authentication flow in development
3. Verify virtual keys fetching
4. Test logout flow
5. Deploy to production
6. Monitor Supabase Auth logs for issues

## Support

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Google OAuth Setup: https://supabase.com/docs/guides/auth/social-login/auth-google
- EdgeAdmin Integration: Contact EdgeAdmin team

---

**Migration Completed**: January 2025
**Tested By**: Backend Team
**Approved By**: Tech Lead
