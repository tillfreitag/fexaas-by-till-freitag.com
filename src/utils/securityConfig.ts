
// Security configuration and utilities
export const SECURITY_CONFIG = {
  // Content Security Policy for production
  CSP_DIRECTIVES: {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'connect-src': "'self' https://api.openai.com https://api.firecrawl.dev",
    'img-src': "'self' data: https:",
    'font-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'"
  },

  // Security headers for production
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },

  // API limits and timeouts
  API_LIMITS: {
    MAX_URL_LENGTH: 2048,
    MAX_CONTENT_LENGTH: 50000,
    REQUEST_TIMEOUT: 30000,
    MAX_RETRIES: 3
  }
};

// Environment-based logging
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    // Always log errors, but sanitize in production
    if (import.meta.env.DEV) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },

  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};

// Sanitize error messages for user display
export const sanitizeErrorMessage = (error: any): string => {
  if (import.meta.env.DEV) {
    return error?.message || 'An unexpected error occurred';
  }
  
  // Generic error messages for production
  if (error?.message?.includes('API')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return 'Something went wrong. Please try again.';
};
