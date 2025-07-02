
import { SECURITY_CONFIG } from './securityConfig';

// URL validation with security checks
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  if (url.length > SECURITY_CONFIG.API_LIMITS.MAX_URL_LENGTH) {
    return { isValid: false, error: 'URL is too long' };
  }

  // Check for malicious patterns
  const maliciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /ftp:/i,
    /<script/i,
    /on\w+=/i
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(url)) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Check for localhost/private IPs in production
    if (!import.meta.env.DEV) {
      const hostname = urlObj.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^0\./
      ];

      for (const pattern of privatePatterns) {
        if (pattern.test(hostname)) {
          return { isValid: false, error: 'Private network URLs are not allowed' };
        }
      }
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// API key validation
export const validateApiKey = (apiKey: string, keyType: 'openai' | 'firecrawl'): { isValid: boolean; error?: string } => {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key is required' };
  }

  const trimmedKey = apiKey.trim();

  if (keyType === 'openai') {
    if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 20) {
      return { isValid: false, error: 'Invalid OpenAI API key format' };
    }
  } else if (keyType === 'firecrawl') {
    if (!trimmedKey.startsWith('fc-') || trimmedKey.length < 20) {
      return { isValid: false, error: 'Invalid Firecrawl API key format' };
    }
  }

  return { isValid: true };
};

// Content validation
export const validateContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Content is required' };
  }

  if (content.length > SECURITY_CONFIG.API_LIMITS.MAX_CONTENT_LENGTH) {
    return { isValid: false, error: 'Content is too large' };
  }

  return { isValid: true };
};

// Rate limiting helper (simple client-side implementation)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
