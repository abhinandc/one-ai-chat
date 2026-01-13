# OneEdge Authentication - Test Plan

## Overview

This document outlines the testing strategy for the Supabase Auth migration.

## Prerequisites

- [ ] Supabase Google OAuth configured (see SUPABASE_AUTH_MIGRATION.md)
- [ ] Google Cloud Console redirect URIs configured
- [ ] Supabase Site URL and Redirect URLs configured
- [ ] `app_users` table exists with RLS policies
- [ ] Environment variables set in `.env`

## Test Environments

### Local Development
- URL: http://localhost:5173
- Supabase: https://vzrnxiowtshzspybrxeq.supabase.co
- Google Client ID: 373908156464-backo99qegd190e3duh54biihe5tg6i9...

### Production
- URL: https://edge.oneorigin.us
- Supabase: https://vzrnxiowtshzspybrxeq.supabase.co
- Google Client ID: Same as development

## Test Cases

### TC-001: Google Sign-In (Happy Path)

**Preconditions**: User is logged out

**Steps**:
1. Navigate to http://localhost:5173
2. Verify login page displays with "Continue with Google" button
3. Click "Continue with Google (oneorigin.us)"
4. Verify redirect to Google OAuth consent screen
5. Select @oneorigin.us Google account
6. Verify redirect to /auth/callback
7. Verify loading state displays ("Completing Sign In...")
8. Verify redirect to dashboard (/)
9. Verify user avatar/name displays in TopBar

**Expected Results**:
- No errors in console
- Session stored in localStorage (`oneedge-auth-token`)
- User profile stored in localStorage (`oneedge_user`)
- User entry created in `app_users` table
- Real-time subscriptions established

**Test Data**:
```javascript
// Check localStorage
localStorage.getItem('oneedge-auth-token') // Should contain Supabase session
localStorage.getItem('oneedge_user') // Should contain user profile JSON

// Check Supabase
// app_users table should have new row with user's email
```

---

### TC-002: Email/Password Sign-In (Backward Compatibility)

**Preconditions**: User has email/password account

**Steps**:
1. Navigate to http://localhost:5173
2. Enter email in "Work Email" field
3. Enter password in "Password" field
4. Click "Sign In" button
5. Verify redirect to dashboard

**Expected Results**:
- Session established via Supabase Auth
- Same behavior as Google sign-in

---

### TC-003: Session Persistence

**Preconditions**: User is logged in

**Steps**:
1. Refresh the page
2. Verify no redirect to login
3. Verify user remains authenticated
4. Verify user profile still displays

**Expected Results**:
- Session persists across page refresh
- No flash of login page
- User data loads immediately

---

### TC-004: Multi-Tab Session Sync

**Preconditions**: User is logged in

**Steps**:
1. Open OneEdge in Tab A
2. Open OneEdge in Tab B (same browser)
3. In Tab B, click logout
4. Switch to Tab A
5. Verify Tab A also logs out automatically

**Expected Results**:
- Auth state syncs across tabs
- Both tabs show login page after logout

---

### TC-005: Logout

**Preconditions**: User is logged in

**Steps**:
1. Click user avatar/menu in TopBar
2. Click "Logout" button
3. Verify redirect to login page
4. Verify session cleared from localStorage
5. Attempt to navigate to /chat
6. Verify redirect to login page

**Expected Results**:
- Session cleared
- User redirected to login
- Protected routes inaccessible

**Verification**:
```javascript
// Should be null after logout
localStorage.getItem('oneedge-auth-token')
localStorage.getItem('oneedge_user')
```

---

### TC-006: OAuth Error Handling (Invalid Credentials)

**Preconditions**: User is logged out

**Steps**:
1. Manually navigate to: `/auth/callback?error=access_denied&error_description=User%20denied%20access`
2. Verify error message displays
3. Verify redirect to login after 3 seconds

**Expected Results**:
- Error message: "Authentication Failed"
- Description: "User denied access"
- Auto-redirect to login

---

### TC-007: Session Expiry and Refresh

**Preconditions**: User is logged in

**Steps**:
1. Wait for session to approach expiry (or manually expire in DevTools)
2. Perform an action (e.g., send a chat message)
3. Verify session automatically refreshes
4. Verify action completes successfully

**Expected Results**:
- Session refreshes transparently
- No user interruption
- No forced logout

---

### TC-008: Virtual Keys Fetching

**Preconditions**: User is logged in, has virtual keys in EdgeAdmin

**Steps**:
1. Sign in successfully
2. Navigate to /models page
3. Verify models display (fetched via virtual keys)
4. Open browser DevTools → Network tab
5. Verify query to `virtual_keys` table

**Expected Results**:
- Virtual keys fetched after authentication
- Models display correctly
- Query uses user's email as filter

**Verification Query**:
```sql
SELECT * FROM virtual_keys WHERE user_email = 'user@oneorigin.us';
```

---

### TC-009: EdgeAdmin Invite Flow

**Preconditions**: User has pending invite in EdgeAdmin

**Steps**:
1. EdgeAdmin admin sends invite to new user
2. New user receives email with link
3. User clicks link in email
4. Verify redirect to OneEdge login
5. User signs in with Google
6. Verify virtual keys allocated by EdgeAdmin are available
7. Verify user can access assigned models

**Expected Results**:
- Invite link redirects correctly
- First-time login creates `app_users` entry
- Virtual keys are accessible
- RLS policies allow access to user's keys

---

### TC-010: Network Error Handling

**Preconditions**: User is logged out

**Steps**:
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Click "Continue with Google"
4. Verify error message displays

**Expected Results**:
- User-friendly error message
- No uncaught exceptions
- Retry possible when network restored

---

### TC-011: First-Time User Profile Creation

**Preconditions**: New user, never logged in before

**Steps**:
1. Sign in with Google
2. Check Supabase Dashboard → `app_users` table
3. Verify new row created with:
   - email
   - name (from Google profile)
   - avatar_url (from Google profile)
   - created_at
   - updated_at

**Expected Results**:
- Profile created automatically on first login
- All fields populated from Google OAuth metadata

---

### TC-012: RLS Policy Verification

**Preconditions**: User is logged in

**Steps**:
1. Open browser DevTools → Console
2. Run:
   ```javascript
   const { data } = await supabase.from('app_users').select('*');
   console.log(data);
   ```
3. Verify only current user's profile returned
4. Run:
   ```javascript
   const { data } = await supabase.from('virtual_keys').select('*');
   console.log(data);
   ```
5. Verify only current user's virtual keys returned

**Expected Results**:
- RLS policies enforce data isolation
- Users can only see their own data
- No unauthorized access possible

---

### TC-013: Dark/Light Mode Theme Persistence

**Preconditions**: User is logged out

**Steps**:
1. On login page, toggle dark mode
2. Sign in with Google
3. Verify theme persists after redirect
4. Navigate to different pages
5. Verify theme remains consistent

**Expected Results**:
- Theme preference saved to localStorage
- Theme persists across authentication
- No theme flash/flicker

---

### TC-014: Console Error Check

**Preconditions**: None

**Steps**:
1. Open browser DevTools → Console
2. Clear console
3. Complete full authentication flow (login → dashboard → chat → logout → login)
4. Check for errors/warnings

**Expected Results**:
- No uncaught exceptions
- No 401/403 errors
- Only expected info/log messages

---

### TC-015: Mobile Responsive (Future)

**Preconditions**: User is logged out

**Steps**:
1. Open Chrome DevTools → Toggle device toolbar
2. Select mobile device (iPhone 14 Pro)
3. Navigate to login page
4. Verify login UI is responsive
5. Complete authentication flow
6. Verify callback page is responsive

**Expected Results**:
- Login page fully responsive
- Google button accessible on mobile
- Callback page displays correctly
- No horizontal scrolling

---

## Performance Tests

### PT-001: Authentication Speed

**Measurement**: Time from clicking "Continue with Google" to dashboard load

**Acceptance Criteria**: < 3 seconds (excluding Google consent screen)

**Steps**:
1. Clear cache and localStorage
2. Start timer
3. Click "Continue with Google"
4. Stop timer when dashboard renders

---

### PT-002: Session Restore Speed

**Measurement**: Time from page refresh to authenticated state

**Acceptance Criteria**: < 500ms

**Steps**:
1. User is logged in
2. Start timer
3. Refresh page
4. Stop timer when user profile displays

---

## Security Tests

### ST-001: Session Token Security

**Steps**:
1. Sign in
2. Extract session token from localStorage
3. Verify token is JWT format
4. Decode token (jwt.io)
5. Verify expiry time is reasonable
6. Verify token includes `sub` (user ID)

---

### ST-002: CSRF Protection

**Steps**:
1. Sign in
2. Attempt to forge auth callback request
3. Verify request is rejected

---

### ST-003: XSS Protection

**Steps**:
1. Attempt to inject script tags in login form
2. Verify scripts do not execute
3. Verify inputs are sanitized

---

## Test Execution Checklist

### Before Testing
- [ ] Pull latest code from main branch
- [ ] Install dependencies: `npm install`
- [ ] Verify `.env` file has correct values
- [ ] Start dev server: `npm run dev`
- [ ] Clear browser cache and localStorage

### During Testing
- [ ] Record results for each test case
- [ ] Screenshot any errors/issues
- [ ] Note console errors/warnings
- [ ] Measure performance metrics

### After Testing
- [ ] Summarize results in test report
- [ ] File bugs for any failures
- [ ] Verify critical path tests pass
- [ ] Approve for deployment (if all pass)

## Test Results Template

```markdown
## Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]
**Browser**: [Chrome/Firefox/Safari] [Version]

### Summary
- Total Test Cases: 15
- Passed: X
- Failed: Y
- Blocked: Z

### Failed Test Cases
- TC-XXX: [Description of failure]
  - Expected: [Expected result]
  - Actual: [Actual result]
  - Screenshot: [Link]

### Performance Metrics
- PT-001: X seconds
- PT-002: Y milliseconds

### Notes
[Any additional observations]

### Recommendation
☐ Approved for deployment
☐ Needs fixes before deployment
```

## Sign-Off

- [ ] Backend Lead: _______________
- [ ] Frontend Lead: _______________
- [ ] QA Lead: _______________
- [ ] Product Manager: _______________

---

**Last Updated**: January 2025
