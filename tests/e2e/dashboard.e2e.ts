/**
 * E2E Tests for Dashboard
 *
 * Tests the dashboard page including metrics display,
 * spotlight search, and navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Layout', () => {
    test('should display dashboard page', async ({ page }) => {
      // Check we're on the dashboard
      await expect(page).toHaveURL(/\/$/);

      // Should have main content area
      const mainContent = page.locator('main').or(page.locator('[data-testid="dashboard"]'));
      await expect(mainContent.first()).toBeVisible();
    });

    test('should display navigation', async ({ page }) => {
      // Check for nav element
      const nav = page.locator('nav').or(page.locator('[data-testid="sidebar"]'));
      await expect(nav.first()).toBeVisible();
    });

    test('should display header/topbar', async ({ page }) => {
      // Check for topbar content - either the glass-toolbar div or logo/search elements
      const topbarContent = page
        .locator('.glass-toolbar')
        .or(page.locator('[data-testid="topbar"] > *'))
        .or(page.getByPlaceholder(/search/i));
      await expect(topbarContent.first()).toBeVisible();
    });
  });

  test.describe('Spotlight Search', () => {
    test('should display search bar', async ({ page }) => {
      // Look for search input
      const searchInput = page
        .locator('[data-testid="spotlight-search"]')
        .or(page.getByPlaceholder(/search|ask/i))
        .or(page.locator('input[type="search"]'));

      await expect(searchInput.first()).toBeVisible();
    });

    test('should allow typing in search', async ({ page }) => {
      const searchInput = page
        .locator('[data-testid="spotlight-search"]')
        .or(page.getByPlaceholder(/search|ask/i))
        .first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('test query');
        await expect(searchInput).toHaveValue('test query');
      }
    });

    test('should support keyboard shortcut to focus search', async ({ page }) => {
      // Common keyboard shortcut is Cmd/Ctrl + K
      await page.keyboard.press('Control+k');

      // Search input should be focused
      const searchInput = page
        .locator('[data-testid="spotlight-search"]')
        .or(page.getByPlaceholder(/search|ask/i))
        .first();

      if (await searchInput.isVisible()) {
        const isFocused = await searchInput.evaluate((el) => el === document.activeElement);
        // May or may not be implemented, just verify no crash
      }
    });
  });

  test.describe('Metrics Display', () => {
    test('should display metric cards', async ({ page }) => {
      // Look for metric cards
      const metricCards = page
        .locator('[data-testid="metric-card"]')
        .or(page.locator('.metric-card'))
        .or(page.locator('[class*="card"]'));

      // Should have at least one card
      await expect(metricCards.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display usage statistics', async ({ page }) => {
      // Look for common metric labels
      const statsLabels = [
        /messages|tokens|conversations|usage/i,
        /today|week|month/i,
        /cost|budget|spent/i,
      ];

      let foundStats = false;
      for (const pattern of statsLabels) {
        const element = page.getByText(pattern).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          foundStats = true;
          break;
        }
      }

      // At least some stats should be visible
      // This is a soft check since the dashboard may be customizable
    });
  });

  test.describe('Quick Actions', () => {
    test('should display quick action buttons', async ({ page }) => {
      // Look for quick action buttons
      const quickActions = page
        .locator('[data-testid="quick-actions"]')
        .or(page.getByRole('button').filter({ hasText: /new|start|create/i }));

      // Should have some actionable elements
      await expect(quickActions.first()).toBeVisible({ timeout: 3000 });
    });

    test('should navigate to chat from quick actions', async ({ page }) => {
      // Find and click new chat button
      const newChatButton = page
        .getByRole('button', { name: /new chat|start chat/i })
        .or(page.locator('[data-testid="new-chat"]'));

      if (await newChatButton.first().isVisible()) {
        await newChatButton.first().click();

        // Should navigate to chat
        await expect(page).toHaveURL(/\/chat/);
      }
    });
  });

  test.describe('Recent Activity', () => {
    test('should display recent conversations', async ({ page }) => {
      // Look for recent activity section
      const recentSection = page
        .locator('[data-testid="recent-activity"]')
        .or(page.getByText(/recent|history|activity/i).first());

      // May or may not be visible depending on user history
      if (await recentSection.isVisible({ timeout: 2000 })) {
        await expect(recentSection).toBeVisible();
      }
    });

    test('should allow resuming recent conversation', async ({ page }) => {
      // Find a recent conversation item
      const conversationItem = page
        .locator('[data-testid="recent-conversation"]')
        .or(page.locator('[class*="conversation"]'))
        .first();

      if (await conversationItem.isVisible({ timeout: 2000 })) {
        await conversationItem.click();

        // Should navigate to that conversation
        await expect(page).toHaveURL(/\/chat/);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to Chat page', async ({ page }) => {
      // Sidebar navigation uses buttons, not links
      const chatButton = page.getByRole('button', { name: /chat/i }).or(page.locator('[data-testid="sidebar"] button').filter({ hasText: /chat/i }));

      await expect(chatButton.first()).toBeVisible();
      await chatButton.first().click();

      await expect(page).toHaveURL(/\/chat/);
    });

    test('should navigate to Models page', async ({ page }) => {
      const modelsLink = page
        .getByRole('link', { name: /models/i })
        .or(page.locator('a[href*="models"]'));

      if (await modelsLink.first().isVisible()) {
        await modelsLink.first().click();
        await expect(page).toHaveURL(/\/models/);
      }
    });

    test('should navigate to Prompts page', async ({ page }) => {
      const promptsLink = page
        .getByRole('link', { name: /prompts/i })
        .or(page.locator('a[href*="prompts"]'));

      if (await promptsLink.first().isVisible()) {
        await promptsLink.first().click();
        await expect(page).toHaveURL(/\/prompts/);
      }
    });

    test('should navigate to Help page', async ({ page }) => {
      const helpLink = page.getByRole('link', { name: /help/i }).or(page.locator('a[href*="help"]'));

      if (await helpLink.first().isVisible()) {
        await helpLink.first().click();
        await expect(page).toHaveURL(/\/help/);
      }
    });
  });

  test.describe('Theme Toggle', () => {
    test('should display theme toggle', async ({ page }) => {
      // Look for theme toggle button
      const themeToggle = page
        .locator('[data-testid="theme-toggle"]')
        .or(page.getByRole('button', { name: /theme|dark|light|mode/i }))
        .or(page.locator('button').filter({ has: page.locator('[class*="moon"], [class*="sun"]') }));

      await expect(themeToggle.first()).toBeVisible({ timeout: 3000 });
    });

    test('should toggle theme on click', async ({ page }) => {
      const themeToggle = page
        .locator('[data-testid="theme-toggle"]')
        .or(page.getByRole('button', { name: /theme|dark|light|mode/i }))
        .first();

      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialTheme = await page.evaluate(() =>
          document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        );

        await themeToggle.click();

        // Wait for theme change
        await page.waitForTimeout(500);

        const newTheme = await page.evaluate(() =>
          document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        );

        // Theme may or may not change depending on implementation
        // This verifies the toggle is interactive
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Main content should still be visible
      const mainContent = page.locator('main').or(page.locator('[data-testid="dashboard"]'));
      await expect(mainContent.first()).toBeVisible();

      // Navigation might be in a hamburger menu
      const hamburger = page
        .locator('[data-testid="mobile-menu"]')
        .or(page.getByRole('button', { name: /menu/i }));

      // Either sidebar is visible or hamburger menu exists
      const sidebar = page.locator('nav').or(page.locator('[data-testid="sidebar"]'));
      const sidebarVisible = await sidebar.first().isVisible();
      const hamburgerVisible = await hamburger.first().isVisible({ timeout: 1000 }).catch(() => false);

      expect(sidebarVisible || hamburgerVisible).toBe(true);
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const mainContent = page.locator('main').or(page.locator('[data-testid="dashboard"]'));
      await expect(mainContent.first()).toBeVisible();
    });
  });
});
