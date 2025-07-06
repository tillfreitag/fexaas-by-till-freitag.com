
import { CrawlResult } from '@/types/crawler';
import { ApiKeyManager } from './crawler/ApiKeyManager';
import { FirecrawlClient } from './crawler/FirecrawlClient';
import { rateLimiter } from '@/utils/inputValidation';
import { logger } from '@/utils/securityConfig';

export class CrawlerService {
  static saveApiKey(apiKey: string): void {
    ApiKeyManager.saveApiKey(apiKey);
  }

  static getApiKey(): string | null {
    return ApiKeyManager.getApiKey();
  }

  static hasApiKey(): boolean {
    return ApiKeyManager.hasApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    // Rate limiting check
    if (!rateLimiter.canMakeRequest('firecrawl-test')) {
      logger.warn('Rate limit exceeded for API key testing');
      throw new Error('Too many requests. Please wait before trying again.');
    }

    return ApiKeyManager.testApiKey(apiKey);
  }

  static async crawlWebsite(url: string): Promise<CrawlResult> {
    return FirecrawlClient.crawlWebsite(url);
  }
}
