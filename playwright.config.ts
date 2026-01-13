/**
 * Playwright Configuration for OneEdge
 *
 * Configuration for End-to-End testing with Playwright.
 * Supports headed mode for visual verification and CI mode for automation.
 */

import { defineConfig, devices } from '@playwright/test';

// Environment variables
const baseURL = process.env.BASE_URL || 'http://localhost:5000';
const isCI = !!process.env.CI;
const isHeaded = !isCI || process.env.HEADED === 'true';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file pattern
  testMatch: '**/*.e2e.ts',

  // Timeout settings
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  // Parallel execution
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,

  // Reporters
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
    ['json', { outputFile: 'reports/playwright/results.json' }],
    ['junit', { outputFile: 'reports/playwright/junit.xml' }],
  ],

  // Global setup and teardown
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  // Output directory for artifacts
  outputDir: 'test-results/',

  // Shared settings
  use: {
    // Base URL for navigation
    baseURL,

    // Browser context options
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    // Trace settings
    trace: isCI ? 'on-first-retry' : 'on',

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Video settings
    video: isCI ? 'retain-on-failure' : 'on',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // User agent
    userAgent: 'OneEdge-E2E-Test/1.0',

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Permissions
    permissions: ['clipboard-read', 'clipboard-write'],

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },

    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: !isCI,

    // Headed mode setting
    headless: !isHeaded,

    // Slow down actions for visual debugging
    launchOptions: {
      slowMo: isHeaded && !isCI ? 50 : 0,
    },
  },

  // Browser projects
  // Note: Firefox and WebKit are commented out as they require additional installation
  // Run `pnpm exec playwright install firefox webkit` to enable cross-browser testing
  projects: [
    // Authentication setup project
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Desktop Chrome (primary)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Dark mode testing
    {
      name: 'chromium-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Desktop Firefox (requires: pnpm exec playwright install firefox)
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: '.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // Desktop Safari (requires: pnpm exec playwright install webkit)
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: '.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // Mobile Safari (requires: pnpm exec playwright install webkit)
    // {
    //   name: 'mobile-safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //     storageState: '.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // Web server configuration
  webServer: process.env.NO_WEBSERVER
    ? undefined
    : {
        command: process.env.WEB_COMMAND || 'pnpm dev',
        url: process.env.WEB_URL || baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },

  // Metadata
  metadata: {
    'test-type': 'e2e',
    platform: process.platform,
    node: process.version,
  },
});
