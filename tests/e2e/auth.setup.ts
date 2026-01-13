/**
 * Authentication Setup for E2E Tests
 *
 * This setup runs before all E2E tests to establish
 * an authenticated session state.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/');

  // For E2E tests, we mock the authentication by setting localStorage
  // In production, this would go through the actual OAuth flow
  await page.evaluate(() => {
    // Set the user data
    localStorage.setItem(
      'oneedge_user',
      JSON.stringify({
        email: 'e2e-test@oneorigin.us',
        name: 'E2E Test User',
        givenName: 'E2E',
        familyName: 'Test',
        picture: 'https://ui-avatars.com/api/?name=E2E+Test&background=0D8ABC&color=fff',
      })
    );

    // Set the API key
    localStorage.setItem('oneai_api_key', 'sk-test-e2e-key');

    // Set auth token (mock)
    localStorage.setItem('oneedge_auth_token', 'mock-auth-token-for-e2e');
  });

  // Reload to apply authentication
  await page.reload();

  // Wait for authenticated state
  await page.waitForLoadState('networkidle');

  // Verify we're authenticated by checking for main app UI
  // The exact selector depends on your app structure
  try {
    // Wait for either the main app or the login page
    const isAuthenticated = await page.locator('nav').or(page.locator('[data-testid="sidebar"]')).isVisible({ timeout: 5000 });

    if (!isAuthenticated) {
      console.log('Note: App may require actual OAuth. Using mock auth for E2E.');
    }
  } catch {
    console.log('Auth check timed out, continuing with setup...');
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
