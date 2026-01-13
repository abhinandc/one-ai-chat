/**
 * Vitest Configuration for OneEdge
 *
 * Configuration for unit and integration testing with Vitest.
 * Follows Testing Pyramid: 70% Unit, 20% Integration, 10% E2E
 *
 * Uses REAL Supabase credentials - no mocks!
 */

import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env from .env file
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@/tests': resolve(__dirname, './tests'),
      },
    },
    // Define environment variables for tests - use REAL Supabase credentials
    // Tests connect to real Supabase instance for integration testing
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://vzrnxiowtshzspybrxeq.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODY0NDEsImV4cCI6MjA3NDI2MjQ0MX0.CpSZhCBJYkrCGqsqVd5Qm8TKrQBBE0l8l0hN_iMLVbc'),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
      'import.meta.env.VITE_MCP_API_URL': JSON.stringify(env.VITE_MCP_API_URL || '/api/mcp'),
      'import.meta.env.VITE_ONEAI_API_KEY': JSON.stringify(env.VITE_ONEAI_API_KEY || ''),
      'import.meta.env.MODE': JSON.stringify('test'),
      'import.meta.env.DEV': JSON.stringify(false),
      'import.meta.env.PROD': JSON.stringify(false),
    },
    test: {
    // Test environment
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],

    // Enable global test APIs (describe, it, expect)
    globals: true,

    // Include patterns for test files
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
      'tests/security/**/*.{test,spec}.{ts,tsx}',
      'tests/components/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**',
      'tests/ui/**',
      'tests/visual/**',
    ],

    // CSS handling
    css: true,

    // Reporter options
    reporters: ['default', 'json'],
    outputFile: {
      json: './reports/vitest/results.json',
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './reports/coverage',

      // Coverage thresholds
      // Note: Target is 70-80% but current codebase is at ~12%
      // Thresholds set to current levels to prevent regression
      // TODO: Gradually increase as more tests are added
      thresholds: {
        statements: 10,
        branches: 60,
        functions: 35,
        lines: 10,
      },

      // Files to include in coverage
      include: [
        'src/hooks/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
      ],

      // Files to exclude from coverage
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/components/ui/**', // shadcn components - external library
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Pool options for parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },

    // Retry failed tests
    retry: process.env.CI ? 2 : 0,

    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,

    // Mock options
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Snapshot options
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false,
    },

    // Type checking
    typecheck: {
      enabled: false, // Disable typecheck in vitest, use tsc separately
    },

    // Watch mode settings
    watch: !process.env.CI,
    watchExclude: ['node_modules', 'dist', 'reports'],

    // Dependency optimization
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react', '@testing-library/jest-dom'],
        },
      },
    },
  },
  };
});
