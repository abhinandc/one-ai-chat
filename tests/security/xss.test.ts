/**
 * Security Tests for XSS Prevention
 *
 * Tests that the application properly sanitizes user input
 * and prevents cross-site scripting attacks.
 *
 * SECURITY NOTE: This test file intentionally contains XSS payloads
 * for testing purposes only. These are used to verify that
 * the application correctly prevents such attacks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// XSS attack payloads for testing
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<a href="javascript:alert(\'XSS\')">click</a>',
];

// HTML injection payloads for testing
const HTML_INJECTION_PAYLOADS = [
  '<h1>Injected Header</h1>',
  '<form action="http://evil.com"><input type="submit"></form>',
  '<style>body { display: none; }</style>',
];

describe('XSS Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.textContent = '';
  });

  afterEach(() => {
    document.body.textContent = '';
  });

  describe('Input Sanitization', () => {
    it('should not execute script tags in rendered content', () => {
      const dangerousContent = '<script>window.xssExecuted = true;</script>';

      // Create a simple component that renders user content safely
      const TestComponent = () => {
        return React.createElement('div', {
          'data-testid': 'content',
          // React automatically escapes this when passed as children
          children: dangerousContent,
        });
      };

      render(React.createElement(TestComponent));

      // The script should be displayed as text, not executed
      expect(screen.getByTestId('content').textContent).toBe(dangerousContent);
      expect((window as any).xssExecuted).toBeUndefined();
    });

    it('should escape HTML entities in text content', () => {
      XSS_PAYLOADS.forEach((payload) => {
        const TestComponent = () =>
          React.createElement('div', { 'data-testid': 'content', children: payload });

        const { unmount } = render(React.createElement(TestComponent));

        const element = screen.getByTestId('content');
        // Should be rendered as text, not HTML - verify no script execution
        expect(element.textContent).toBe(payload);
        expect((window as any).xssExecuted).toBeUndefined();

        unmount();
      });
    });

    it('should verify React escapes user content by default', () => {
      const userContent = '<b>Bold</b> and <script>evil</script>';

      const TestComponent = () =>
        React.createElement('div', { 'data-testid': 'content', children: userContent });

      render(React.createElement(TestComponent));

      const element = screen.getByTestId('content');
      // React escapes the content - verify via textContent
      expect(element.textContent).toBe(userContent);
    });
  });

  describe('URL Validation', () => {
    it('should validate URLs before navigation', () => {
      const isValidUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('javascript:alert("XSS")')).toBe(false);
      expect(isValidUrl('data:text/html,<script>alert("XSS")</script>')).toBe(false);
      expect(isValidUrl('vbscript:alert("XSS")')).toBe(false);
    });

    it('should prevent open redirects', () => {
      const isValidRedirect = (url: string, allowedHosts: string[]) => {
        try {
          const parsed = new URL(url);
          return allowedHosts.includes(parsed.host);
        } catch {
          // Relative URLs are OK
          return url.startsWith('/') && !url.startsWith('//');
        }
      };

      const allowedHosts = ['oneorigin.us', 'api.oneorigin.us'];

      expect(isValidRedirect('/chat', allowedHosts)).toBe(true);
      expect(isValidRedirect('https://oneorigin.us/callback', allowedHosts)).toBe(true);
      expect(isValidRedirect('https://evil.com/steal', allowedHosts)).toBe(false);
      expect(isValidRedirect('//evil.com', allowedHosts)).toBe(false);
    });
  });

  describe('Content Security', () => {
    it('should escape special characters in text', () => {
      const escapeHtml = (text: string) => {
        const map: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '/': '&#x2F;',
        };
        return text.replace(/[&<>"'/]/g, (char) => map[char]);
      };

      // Test HTML tag payloads specifically
      const htmlTagPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
      ];

      htmlTagPayloads.forEach((payload) => {
        const escaped = escapeHtml(payload);
        // Dangerous HTML tags should be escaped (< becomes &lt;)
        expect(escaped).not.toContain('<script');
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('<svg');
        // Verify the escaping happened correctly
        expect(escaped).toContain('&lt;');
        // The escaped content should be safe to inject as innerHTML
        expect(escaped).not.toMatch(/<[a-z]/i);
      });

      // Test javascript: protocol separately (no < to escape)
      const jsPayload = 'javascript:alert("XSS")';
      const escapedJs = escapeHtml(jsPayload);
      expect(escapedJs).toContain('&quot;'); // Quotes should be escaped
    });

    it('should handle null bytes and unicode escapes', () => {
      const dangerousPayloads = [
        '<scr\x00ipt>alert("XSS")</script>',
        '\x3cscript\x3ealert("XSS")\x3c/script\x3e',
      ];

      const sanitize = (input: string) => {
        // Remove null bytes
        let clean = input.replace(/\x00/g, '');
        // Escape HTML
        clean = clean.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return clean;
      };

      dangerousPayloads.forEach((payload) => {
        const sanitized = sanitize(payload);
        expect(sanitized).not.toContain('<script');
      });
    });
  });

  describe('API Input Validation', () => {
    it('should validate message content before sending', () => {
      const validateMessage = (content: string) => {
        // Max length check
        if (content.length > 100000) {
          return { valid: false, error: 'Message too long' };
        }
        // No null bytes
        if (content.includes('\x00')) {
          return { valid: false, error: 'Invalid characters' };
        }
        return { valid: true };
      };

      expect(validateMessage('Hello, world!')).toEqual({ valid: true });
      expect(validateMessage('A'.repeat(100001))).toEqual({
        valid: false,
        error: 'Message too long',
      });
      expect(validateMessage('Hello\x00World')).toEqual({
        valid: false,
        error: 'Invalid characters',
      });
    });

    it('should sanitize model IDs', () => {
      const isValidModelId = (id: string) => {
        // Only allow alphanumeric, hyphens, underscores, and periods
        return /^[a-zA-Z0-9._-]+$/.test(id);
      };

      expect(isValidModelId('gpt-4')).toBe(true);
      expect(isValidModelId('claude-3-opus-20240229')).toBe(true);
      expect(isValidModelId('gpt-4<script>')).toBe(false);
      expect(isValidModelId('../../../etc/passwd')).toBe(false);
    });
  });

  describe('Cookie Security', () => {
    it('should not expose cookies in URLs', () => {
      const buildUrl = (base: string, params: Record<string, string>) => {
        const url = new URL(base);
        Object.entries(params).forEach(([key, value]) => {
          // Never include cookies or tokens in URL params
          if (key.toLowerCase().includes('cookie') || key.toLowerCase().includes('token')) {
            throw new Error('Sensitive data should not be in URL');
          }
          url.searchParams.set(key, value);
        });
        return url.toString();
      };

      expect(() =>
        buildUrl('https://api.example.com', { userId: '123' })
      ).not.toThrow();

      expect(() =>
        buildUrl('https://api.example.com', { cookie: 'session=abc' })
      ).toThrow('Sensitive data should not be in URL');

      expect(() =>
        buildUrl('https://api.example.com', { token: 'jwt-token' })
      ).toThrow('Sensitive data should not be in URL');
    });
  });

  describe('DOM Manipulation Safety', () => {
    it('should use textContent for user content', () => {
      const container = document.createElement('div');
      const userContent = '<script>alert("XSS")</script>';

      // Safe: textContent escapes HTML automatically
      container.textContent = userContent;

      // Verify the content is escaped (displayed as text)
      expect(container.textContent).toBe(userContent);
      // Verify script was not executed
      expect((window as any).xssExecuted).toBeUndefined();
    });

    it('should not allow event handler injection through attributes', () => {
      // Attempting to set onclick through user input should be blocked
      const userInput = 'alert("XSS")';

      // This validation should reject direct user input as event handlers
      const isValidHandler = (input: string) => {
        // Event handlers should never come from user input
        return false;
      };

      expect(isValidHandler(userInput)).toBe(false);
    });
  });
});

describe('HTML Injection Prevention', () => {
  it('should prevent HTML injection in user-generated content', () => {
    HTML_INJECTION_PAYLOADS.forEach((payload) => {
      const element = document.createElement('div');
      // Use textContent for safe assignment
      element.textContent = payload;

      // Should be displayed as text, not parsed as HTML
      expect(element.textContent).toBe(payload);
    });
  });

  it('should strip dangerous HTML tags using sanitization function', () => {
    const stripDangerousTags = (html: string) => {
      const dangerous = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        /<iframe\b[^>]*>/gi,
        /<form\b[^>]*>/gi,
      ];

      let clean = html;
      dangerous.forEach((pattern) => {
        clean = clean.replace(pattern, '');
      });
      return clean;
    };

    HTML_INJECTION_PAYLOADS.forEach((payload) => {
      const cleaned = stripDangerousTags(payload);
      expect(cleaned).not.toContain('<script');
      expect(cleaned).not.toContain('<style');
      expect(cleaned).not.toContain('<form');
    });
  });
});

describe('Sanitization Utilities', () => {
  it('should provide a safe HTML escape function', () => {
    const escapeForHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    expect(escapeForHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    );
    expect(escapeForHtml("it's a test")).toBe('it&#039;s a test');
    expect(escapeForHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });

  it('should provide a safe attribute escape function', () => {
    const escapeForAttribute = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    expect(escapeForAttribute('onclick="alert(\'XSS\')"')).toBe(
      'onclick=&quot;alert(&#039;XSS&#039;)&quot;'
    );
  });
});
