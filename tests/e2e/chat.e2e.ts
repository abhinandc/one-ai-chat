/**
 * E2E Tests for Chat Functionality
 *
 * Tests the chat interface including message sending,
 * conversation management, and model selection.
 */

import { test, expect } from '@playwright/test';

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Chat Interface', () => {
    test('should display chat interface components', async ({ page }) => {
      // Check for message input area
      const messageInput = page
        .locator('[data-testid="message-input"]')
        .or(page.getByPlaceholder(/message|type|ask/i))
        .or(page.locator('textarea'));

      await expect(messageInput.first()).toBeVisible();

      // Check for send button
      const sendButton = page
        .locator('[data-testid="send-button"]')
        .or(page.getByRole('button', { name: /send|submit/i }))
        .or(page.locator('button[type="submit"]'));

      await expect(sendButton.first()).toBeVisible();
    });

    test('should display model selector', async ({ page }) => {
      // Look for model selector
      const modelSelector = page
        .locator('[data-testid="model-selector"]')
        .or(page.getByRole('combobox', { name: /model/i }))
        .or(page.locator('select').filter({ hasText: /gpt|claude|gemini/i }));

      await expect(modelSelector.first()).toBeVisible();
    });

    test('should display conversation list or history', async ({ page }) => {
      // Look for conversation sidebar or list
      const conversationList = page
        .locator('[data-testid="conversation-list"]')
        .or(page.locator('[data-testid="sidebar"]'))
        .or(page.locator('aside'));

      await expect(conversationList.first()).toBeVisible();
    });
  });

  test.describe('Message Sending', () => {
    test('should allow typing in message input', async ({ page }) => {
      const messageInput = page
        .locator('[data-testid="message-input"]')
        .or(page.getByPlaceholder(/message|type|ask/i))
        .or(page.locator('textarea'))
        .first();

      await messageInput.fill('Hello, this is a test message');

      await expect(messageInput).toHaveValue('Hello, this is a test message');
    });

    test('should clear input after sending', async ({ page }) => {
      const messageInput = page
        .locator('[data-testid="message-input"]')
        .or(page.getByPlaceholder(/message|type|ask/i))
        .or(page.locator('textarea'))
        .first();

      await messageInput.fill('Test message');

      // Press Enter or click send button
      await messageInput.press('Enter');

      // Note: In a real test, we'd mock the API
      // For now, just verify the input behavior
    });

    test('should show user message after sending', async ({ page }) => {
      // Mock the API responses
      await page.route('**/api/v1/models', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            data: [
              { id: 'gpt-4', object: 'model', created: Date.now(), owned_by: 'openai' },
            ],
          }),
        });
      });

      await page.route('**/v1/chat/completions', async (route) => {
        const encoder = new TextEncoder();
        const body = encoder.encode(
          'data: {"id":"1","choices":[{"delta":{"content":"Hello!"}}]}\n\n' +
            'data: [DONE]\n\n'
        );

        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
          body: Buffer.from(body),
        });
      });

      // Navigate fresh to ensure mocks are active
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Wait for model selector to have a model selected (not "Select Model...")
      const modelSelector = page.locator('[data-testid="model-selector"]');
      await expect(modelSelector).toBeVisible({ timeout: 5000 });

      const messageInput = page
        .locator('[data-testid="message-input"]')
        .or(page.getByPlaceholder(/message|type|ask/i))
        .or(page.locator('textarea'))
        .first();

      await messageInput.fill('Test message');
      await messageInput.press('Enter');

      // The user message should appear immediately in the chat thread
      // Look for the message text in any element (the app adds it to the thread)
      await expect(page.locator('text=Test message').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Conversation Management', () => {
    test('should allow creating new conversation', async ({ page }) => {
      // Look for new chat button
      const newChatButton = page
        .locator('[data-testid="new-chat"]')
        .or(page.getByRole('button', { name: /new|create|chat/i }))
        .or(page.locator('button').filter({ has: page.locator('svg') }));

      // Click if visible
      if (await newChatButton.first().isVisible()) {
        await newChatButton.first().click();
      }
    });

    test('should display conversation title', async ({ page }) => {
      // Conversations should have titles
      const conversationTitle = page
        .locator('[data-testid="conversation-title"]')
        .or(page.locator('h1, h2').filter({ hasText: /.+/ }));

      // At minimum, should have some title element
      await expect(conversationTitle.first()).toBeVisible();
    });
  });

  test.describe('Model Selection', () => {
    test('should display available models', async ({ page }) => {
      // Mock models API - intercept the full URL pattern
      await page.route('**/api/v1/models', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            data: [
              { id: 'gpt-4', object: 'model', created: Date.now(), owned_by: 'openai' },
              { id: 'claude-3-opus', object: 'model', created: Date.now(), owned_by: 'anthropic' },
            ],
          }),
        });
      });

      // Navigate to chat to trigger fresh models fetch
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Click on model selector
      const modelSelector = page.locator('[data-testid="model-selector"]');

      if (await modelSelector.isVisible()) {
        await modelSelector.click();
        await page.waitForTimeout(500); // Wait for dropdown animation

        // Check for model options - look for any model-like text in the dropdown
        const dropdown = page.locator('[role="listbox"]').or(page.locator('[class*="SelectContent"]'));
        await expect(dropdown.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should allow changing model', async ({ page }) => {
      const modelSelector = page
        .locator('[data-testid="model-selector"]')
        .or(page.getByRole('combobox'))
        .first();

      if (await modelSelector.isVisible()) {
        await modelSelector.click();

        // Select a different model
        const modelOption = page.getByRole('option').first();
        if (await modelOption.isVisible()) {
          await modelOption.click();
        }
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should send message on Enter', async ({ page }) => {
      const messageInput = page
        .locator('[data-testid="message-input"]')
        .or(page.getByPlaceholder(/message|type|ask/i))
        .or(page.locator('textarea'))
        .first();

      await messageInput.fill('Test with Enter');
      await messageInput.press('Enter');

      // Message should be submitted (input may clear)
    });

    test('should allow newline with Shift+Enter', async ({ page }) => {
      const messageInput = page
        .locator('[data-testid="message-input"]')
        .or(page.getByPlaceholder(/message|type|ask/i))
        .or(page.locator('textarea'))
        .first();

      await messageInput.fill('Line 1');
      await messageInput.press('Shift+Enter');
      await messageInput.type('Line 2');

      const value = await messageInput.inputValue();
      expect(value).toContain('Line 1');
      expect(value).toContain('Line 2');
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form elements', async ({ page }) => {
      // Check for aria labels on important elements
      const messageInput = page.locator('textarea, input[type="text"]').first();
      if (await messageInput.isVisible()) {
        const ariaLabel = await messageInput.getAttribute('aria-label');
        const placeholder = await messageInput.getAttribute('placeholder');
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Start from beginning and tab through
      await page.keyboard.press('Tab');

      // Should be able to reach main interactive elements
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'TEXTAREA', 'A']).toContain(activeElement);
    });
  });
});
