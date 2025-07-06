
import { validateApiKey } from '@/utils/inputValidation';
import { logger } from '@/utils/securityConfig';
import FirecrawlApp from '@mendable/firecrawl-js';

export class ApiKeyManager {
  private static readonly API_KEY_STORAGE_KEY = 'firecrawl_api_key';

  static saveApiKey(apiKey: string): void {
    const validation = validateApiKey(apiKey, 'firecrawl');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey.trim());
    logger.info('Firecrawl API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    const validation = validateApiKey(apiKey, 'firecrawl');
    if (!validation.isValid) {
      logger.error('Invalid API key format:', validation.error);
      return false;
    }

    try {
      logger.info('Testing Firecrawl API key...');
      const testApp = new FirecrawlApp({ apiKey });
      const testResponse = await testApp.scrapeUrl('https://example.com');
      
      const isValid = testResponse.success;
      logger.info('Firecrawl API key test result:', isValid);
      return isValid;
    } catch (error) {
      logger.error('Error testing Firecrawl API key:', error);
      return false;
    }
  }
}
