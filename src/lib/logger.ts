/**
 * Logger Service - Centralized Logging with Security Features
 *
 * SECURITY ARCHITECTURE:
 * ======================
 * - Development-only console output
 * - Production error tracking ready (Sentry integration placeholder)
 * - Automatic sanitization of sensitive data
 * - Structured log levels: error, warn, info, debug
 *
 * USAGE:
 * ======
 * import { logger } from '@/lib/logger';
 *
 * logger.error('Operation failed', error, { userId: 'abc' });
 * logger.warn('Deprecated API usage');
 * logger.info('User signed in', { email: user.email });
 * logger.debug('Request payload', { data });
 *
 * @module lib/logger
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

// Patterns to detect and sanitize sensitive data
const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // API keys and tokens
  { pattern: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g, replacement: '[JWT_TOKEN]' },
  { pattern: /sk-[A-Za-z0-9]{20,}/g, replacement: '[API_KEY]' },
  { pattern: /xoxb-[A-Za-z0-9-]+/g, replacement: '[SLACK_TOKEN]' },
  { pattern: /xoxp-[A-Za-z0-9-]+/g, replacement: '[SLACK_TOKEN]' },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, replacement: '[GITHUB_TOKEN]' },
  { pattern: /gho_[A-Za-z0-9]{36}/g, replacement: '[GITHUB_TOKEN]' },
  { pattern: /Bearer\s+[A-Za-z0-9-_.~+/]+=*/gi, replacement: 'Bearer [REDACTED]' },

  // Passwords and secrets
  { pattern: /"password"\s*:\s*"[^"]+"/gi, replacement: '"password": "[REDACTED]"' },
  { pattern: /"secret"\s*:\s*"[^"]+"/gi, replacement: '"secret": "[REDACTED]"' },
  { pattern: /"api_key"\s*:\s*"[^"]+"/gi, replacement: '"api_key": "[REDACTED]"' },
  { pattern: /"apiKey"\s*:\s*"[^"]+"/gi, replacement: '"apiKey": "[REDACTED]"' },
  { pattern: /"token"\s*:\s*"[^"]+"/gi, replacement: '"token": "[REDACTED]"' },
  { pattern: /"access_token"\s*:\s*"[^"]+"/gi, replacement: '"access_token": "[REDACTED]"' },
  { pattern: /"refresh_token"\s*:\s*"[^"]+"/gi, replacement: '"refresh_token": "[REDACTED]"' },

  // Email addresses (partial redaction)
  { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '[EMAIL]@$2' },

  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_NUMBER]' },

  // Encrypted credentials (base64 that looks like our encrypted data)
  { pattern: /encrypted_credentials["']?\s*[:=]\s*["'][A-Za-z0-9+/=]{50,}["']/gi, replacement: 'encrypted_credentials: "[ENCRYPTED]"' },
];

// Sensitive field names to redact in objects
const SENSITIVE_FIELDS = new Set([
  'password',
  'secret',
  'token',
  'api_key',
  'apiKey',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'authorization',
  'credentials',
  'encrypted_credentials',
  'private_key',
  'privateKey',
  'client_secret',
  'clientSecret',
]);

/**
 * Sanitize a string value by replacing sensitive patterns
 */
function sanitizeString(value: string): string {
  let result = value;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Deep sanitize an object, redacting sensitive fields
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      stack: obj.stack ? sanitizeString(obj.stack) : undefined,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Format log arguments for output
 */
function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => sanitizeObject(arg));
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * Check if we're in test mode
 */
function isTest(): boolean {
  return import.meta.env.MODE === 'test' || typeof import.meta.env.VITEST !== 'undefined';
}

/**
 * Send error to production error tracking service
 * Production error tracking can be integrated here (e.g., Sentry)
 */
function sendToErrorTracking(
  level: LogLevel,
  message: string,
  error?: unknown,
  context?: LogContext
): void {
  // Production error tracking integration point
  // When ready, integrate with your preferred error tracking service
  void level;
  void message;
  void error;
  void context;
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
  /**
   * Log an error message
   * @param message - Error description
   * @param error - Optional error object
   * @param context - Optional context data
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    const sanitizedError = error ? sanitizeObject(error) : undefined;

    if (isDevelopment() || isTest()) {
      console.error(`[ERROR] ${message}`, ...(sanitizedError ? [sanitizedError] : []), ...(sanitizedContext ? [sanitizedContext] : []));
    }

    // Always send errors to production tracking
    if (!isDevelopment() && !isTest()) {
      sendToErrorTracking('error', message, error, context as LogContext);
    }
  },

  /**
   * Log a warning message
   * @param message - Warning description
   * @param context - Optional context data
   */
  warn(message: string, context?: LogContext): void {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;

    if (isDevelopment() || isTest()) {
      console.warn(`[WARN] ${message}`, ...(sanitizedContext ? [sanitizedContext] : []));
    }

    // Send warnings to production tracking if they seem important
    if (!isDevelopment() && !isTest()) {
      sendToErrorTracking('warn', message, undefined, context);
    }
  },

  /**
   * Log an informational message
   * @param message - Info description
   * @param context - Optional context data
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment()) {
      const sanitizedContext = context ? sanitizeObject(context) : undefined;
      console.info(`[INFO] ${message}`, ...(sanitizedContext ? [sanitizedContext] : []));
    }
    // Info logs are not sent to production tracking
  },

  /**
   * Log a debug message (development only)
   * @param message - Debug description
   * @param context - Optional context data
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment()) {
      const sanitizedContext = context ? sanitizeObject(context) : undefined;
      console.debug(`[DEBUG] ${message}`, ...(sanitizedContext ? [sanitizedContext] : []));
    }
    // Debug logs are never sent to production
  },

  /**
   * Log with a specific prefix (useful for service-specific logging)
   * @param prefix - Service or component prefix
   */
  withPrefix(prefix: string) {
    return {
      error: (message: string, error?: unknown, context?: LogContext) =>
        logger.error(`[${prefix}] ${message}`, error, context),
      warn: (message: string, context?: LogContext) =>
        logger.warn(`[${prefix}] ${message}`, context),
      info: (message: string, context?: LogContext) =>
        logger.info(`[${prefix}] ${message}`, context),
      debug: (message: string, context?: LogContext) =>
        logger.debug(`[${prefix}] ${message}`, context),
    };
  },

  /**
   * Create a child logger with additional default context
   * @param defaultContext - Context to include in all logs
   */
  child(defaultContext: LogContext) {
    return {
      error: (message: string, error?: unknown, context?: LogContext) =>
        logger.error(message, error, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...defaultContext, ...context }),
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...defaultContext, ...context }),
    };
  },
};

// Create prefixed loggers for common services
export const edgeVaultLogger = logger.withPrefix('EdgeVault');
export const authLogger = logger.withPrefix('Auth');
export const chatLogger = logger.withPrefix('Chat');
export const apiLogger = logger.withPrefix('API');

export default logger;
