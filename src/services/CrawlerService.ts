
import FirecrawlApp from '@mendable/firecrawl-js';
import { logger, sanitizeErrorMessage } from '@/utils/securityConfig';
import { validateApiKey, validateUrl, rateLimiter } from '@/utils/inputValidation';
import { sanitizeApiResponse } from '@/utils/secureApiClient';

interface CrawlResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export class CrawlerService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    const validation = validateApiKey(apiKey, 'firecrawl');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey.trim());
    this.firecrawlApp = new FirecrawlApp({ apiKey: apiKey.trim() });
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

    // Rate limiting check
    if (!rateLimiter.canMakeRequest('firecrawl-test')) {
      logger.warn('Rate limit exceeded for API key testing');
      throw new Error('Too many requests. Please wait before trying again.');
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

  static async crawlWebsite(url: string): Promise<CrawlResult> {
    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      logger.error('Invalid URL:', urlValidation.error);
      return { success: false, error: urlValidation.error };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      logger.error('Firecrawl API key not found');
      return { success: false, error: 'Firecrawl API key not found' };
    }

    // Rate limiting check
    if (!rateLimiter.canMakeRequest('firecrawl-crawl')) {
      const error = 'Too many requests. Please wait before trying again.';
      logger.warn('Rate limit exceeded for crawling');
      return { success: false, error };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      logger.info(`Starting crawl for: ${url}`);

      // Use crawlUrl for proper website crawling (multiple pages)
      const crawlResponse = await this.firecrawlApp.crawlUrl(url, {
        limit: 10, // Crawl up to 10 pages
        scrapeOptions: {
          formats: ['markdown'],
          includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article', 'details', 'summary', 'dl', 'dt', 'dd'],
          excludeTags: ['nav', 'footer', 'header', 'script', 'style', 'aside', 'form', 'button']
        }
      });

      logger.debug('Firecrawl crawl response received');

      if (!crawlResponse.success) {
        logger.error('Firecrawl crawl failed');
        const errorMessage = 'error' in crawlResponse ? crawlResponse.error : 'Failed to crawl website';
        return { 
          success: false, 
          error: sanitizeErrorMessage({ message: errorMessage })
        };
      }

      // Sanitize and transform the response
      const sanitizedResponse = sanitizeApiResponse(crawlResponse);
      const crawlData = sanitizedResponse.data?.map((page: any) => ({
        url: page.metadata?.sourceURL || page.url || url,
        content: page.markdown || page.content || '',
        metadata: page.metadata || {}
      })) || [];

      logger.info(`Successfully crawled ${crawlData.length} pages`);
      
      // Log content details before filtering
      crawlData.forEach((page: any, index: number) => {
        console.log(`Page ${index + 1} before filtering:`, {
          url: page.url,
          contentLength: page.content?.length || 0,
          contentPreview: page.content?.substring(0, 200) + '...'
        });
      });

      // Filter out pages with minimal content - be more lenient
      const filteredData = crawlData.filter((page: any) => {
        const hasContent = page.content && 
                          typeof page.content === 'string' && 
                          page.content.trim().length > 50; // Reduced from 100 to 50
        
        if (!hasContent) {
          console.log(`Filtering out page with ${page.content?.length || 0} characters:`, page.url);
        }
        
        return hasContent;
      });

      logger.info(`Filtered to ${filteredData.length} pages with substantial content`);

      // If no pages pass the filter, try to include at least one page with any content
      if (filteredData.length === 0 && crawlData.length > 0) {
        console.log('No pages passed filtering, including pages with any content...');
        const anyContentData = crawlData.filter((page: any) => 
          page.content && typeof page.content === 'string' && page.content.trim().length > 10
        );
        
        if (anyContentData.length > 0) {
          logger.info(`Including ${anyContentData.length} pages with minimal content to avoid empty result`);
          return { success: true, data: anyContentData };
        }
      }

      return { success: true, data: filteredData };

    } catch (error) {
      logger.error('Error during Firecrawl crawl:', error);
      return { 
        success: false, 
        error: sanitizeErrorMessage(error)
      };
    }
  }
}
