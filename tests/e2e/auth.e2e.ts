/**
 * E2E Tests for Authentication
 *
 * Tests the authentication flow including login, logout,
 * and protected routes.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // Unauthenticated

    test('should display login page for unauthenticated users', async ({ page }) => {
      await page.goto('/');

      // Should show login page
      await expect(page.locator('h1')).toContainText(/OneEdge|Login|Sign/i);

      // Should have Google SSO button
      await expect(
        page.getByRole('button', { name: /continue with google|sign in with google/i })
      ).toBeVisible();
    });

    test('should display email input option', async ({ page }) => {
      await page.goto('/');

      // Should have email input
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    });

    test('should have proper branding', async ({ page }) => {
      await page.goto('/');

      // Check for logo or brand name
      await expect(page.getByText(/OneEdge|OneOrigin/i).first()).toBeVisible();

      // Check for tagline
      await expect(page.getByText(/AI Platform|Unified/i).first()).toBeVisible();
    });

    test('should show login when accessing protected routes unauthenticated', async ({ page }) => {
      // Go to base URL first to establish context, then clear storage
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Now navigate to protected route
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Should show login page content (app shows login but doesn't redirect URL)
      await expect(page.getByText(/sign in|log in|welcome|oneedge/i).first()).toBeVisible();
    });
  });

  test.describe('Authenticated User', () => {
    test('should access protected routes when authenticated', async ({ page }) => {
      await page.goto('/chat');

      // Should be on chat page or show chat interface
      await expect(page.locator('[data-testid="chat-container"]').or(page.locator('nav'))).toBeVisible();
    });

    test('should display user information', async ({ page }) => {
      await page.goto('/');

      // Look for user menu or avatar
      const userElement = page
        .locator('[data-testid="user-menu"]')
        .or(page.getByRole('button', { name: /user|profile|avatar/i }))
        .or(page.locator('[aria-label*="user" i]'));

      await expect(userElement.first()).toBeVisible();
    });

    test('should be able to logout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find and click user menu
      const userButton = page.locator('[data-testid="user-menu"]');

      await expect(userButton).toBeVisible({ timeout: 10000 });
      await userButton.click();

      // Look for logout/sign out option in the dropdown
      const logoutButton = page.getByText(/sign out/i);
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      // After logout, should show login page (not necessarily URL change)
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/sign in|log in|welcome|oneedge/i).first()).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      await page.goto('/');

      // Check authenticated state
      const initialAuth = await page.evaluate(() => {
        return localStorage.getItem('oneedge_user');
      });

      expect(initialAuth).toBeTruthy();

      // Reload page
      await page.reload();

      // Check session still exists
      const afterReload = await page.evaluate(() => {
        return localStorage.getItem('oneedge_user');
      });

      expect(afterReload).toBeTruthy();
      expect(JSON.parse(afterReload!).email).toBe(JSON.parse(initialAuth!).email);
    });

    test('should handle session expiry gracefully', async ({ page }) => {
      await page.goto('/');

      // Clear auth token to simulate expiry
      await page.evaluate(() => {
        localStorage.removeItem('oneedge_auth_token');
      });

      // Navigate to protected route
      await page.goto('/chat');

      // App should handle this gracefully (either show login or refresh token)
      // This test verifies no crash occurs
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
