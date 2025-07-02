
import { SECURITY_CONFIG, logger, sanitizeErrorMessage } from './securityConfig';

// Secure fetch wrapper with timeout and validation
export const secureFetch = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = SECURITY_CONFIG.API_LIMITS.REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'User-Agent': 'FEXaaS/1.0',
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      logger.error('Fetch error:', error.message);
    }
    
    throw error;
  }
};

// Validate API response structure
export const validateApiResponse = (response: any, expectedFields: string[]): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  return expectedFields.every(field => field in response);
};

// Sanitize API response data
export const sanitizeApiResponse = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeApiResponse(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    
    // Only include expected fields
    const allowedFields = [
      'question', 'answer', 'category', 'language', 'confidence',
      'url', 'content', 'metadata', 'success', 'data', 'error',
      'choices', 'message', 'usage'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        sanitized[key] = sanitizeApiResponse(value);
      }
    }

    return sanitized;
  }

  // For primitive values, return as-is but ensure strings are not too long
  if (typeof data === 'string' && data.length > 10000) {
    return data.substring(0, 10000) + '...';
  }

  return data;
};
