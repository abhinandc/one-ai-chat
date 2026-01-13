/**
 * Test Utilities for OneEdge
 *
 * Provides wrapper components, custom render functions,
 * and utilities for testing React components.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

// All providers wrapper for comprehensive testing
export const AllProviders: React.FC<WrapperProps> = ({
  children,
  initialEntries = ['/'],
}) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system">
        <MemoryRouter initialEntries={initialEntries}>
          {children}
          <Toaster />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Minimal providers for unit tests
export const MinimalProviders: React.FC<WrapperProps> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Query providers only (for hook testing)
export const QueryProviders: React.FC<WrapperProps> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  wrapper?: 'all' | 'minimal' | 'query' | 'none';
}

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { initialEntries = ['/'], wrapper = 'all', ...renderOptions } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    switch (wrapper) {
      case 'all':
        return <AllProviders initialEntries={initialEntries}>{children}</AllProviders>;
      case 'minimal':
        return <MinimalProviders>{children}</MinimalProviders>;
      case 'query':
        return <QueryProviders>{children}</QueryProviders>;
      case 'none':
      default:
        return <>{children}</>;
    }
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Custom matchers and assertions
export const expectToBeLoading = (element: HTMLElement) => {
  expect(element).toHaveAttribute('aria-busy', 'true');
};

export const expectToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled();
};

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));

// Mock navigation
export const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock user for authenticated tests
export const mockAuthenticatedUser = {
  email: 'test@example.com',
  name: 'Test User',
  givenName: 'Test',
  familyName: 'User',
  picture: 'https://example.com/avatar.jpg',
};

// Setup authenticated state
export const setupAuthenticatedState = () => {
  localStorage.setItem('oneedge_user', JSON.stringify(mockAuthenticatedUser));
  localStorage.setItem('oneai_api_key', 'test-api-key');
};

// Clear authenticated state
export const clearAuthenticatedState = () => {
  localStorage.removeItem('oneedge_user');
  localStorage.removeItem('oneai_api_key');
};

// Accessibility testing helper
export const checkA11y = async (container: HTMLElement) => {
  // Basic accessibility checks
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    expect(img).toHaveAttribute('alt');
  });

  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.hasAttribute('aria-label');
    const hasTitle = button.hasAttribute('title');
    expect(hasText || hasAriaLabel || hasTitle).toBeTruthy();
  });

  const links = container.querySelectorAll('a');
  links.forEach((link) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.hasAttribute('aria-label');
    expect(hasText || hasAriaLabel).toBeTruthy();
  });
};

// Debug helper
export const debugElement = (element: HTMLElement) => {
  console.log('Element:', element.tagName);
  console.log('Classes:', element.className);
  console.log('Attributes:', Array.from(element.attributes).map((a) => `${a.name}="${a.value}"`));
  console.log('Text:', element.textContent?.slice(0, 100));
  console.log('HTML:', element.outerHTML.slice(0, 500));
};

// Import vi for mocking
import { vi } from 'vitest';
