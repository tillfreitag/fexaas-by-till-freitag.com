
import FirecrawlApp from '@mendable/firecrawl-js';
import { logger, sanitizeErrorMessage } from '@/utils/securityConfig';
import { validateUrl, rateLimiter } from '@/utils/inputValidation';
import { sanitizeApiResponse } from '@/utils/secureApiClient';
import { CrawlResult, ProcessedPage } from '@/types/crawler';
import { ApiKeyManager } from './ApiKeyManager';
import { ContentProcessor } from './ContentProcessor';

export class FirecrawlClient {
  private static firecrawlApp: FirecrawlApp | null = null;

  private static getApp(): FirecrawlApp {
    const apiKey = ApiKeyManager.getApiKey();
    if (!apiKey) {
      throw new Error('Firecrawl API key not found');
    }

    if (!this.firecrawlApp) {
      this.firecrawlApp = new FirecrawlApp({ apiKey });
    }
    return this.firecrawlApp;
  }

  static async crawlWebsite(url: string): Promise<CrawlResult> {
    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      logger.error('Invalid URL:', urlValidation.error);
      return { success: false, error: urlValidation.error };
    }

    if (!ApiKeyManager.hasApiKey()) {
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
      const app = this.getApp();
      logger.info(`Starting crawl for: ${url}`);

      // More conservative crawl configuration to avoid network errors
      const crawlResponse = await app.crawlUrl(url, {
        limit: 20, // Reduced to 20 pages - good balance between comprehensive and reliable
        scrapeOptions: {
          formats: ['markdown', 'html'], // Include both formats
          includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article', 'details', 'summary', 'dl', 'dt', 'dd', 'li', 'span', 'main'],
          excludeTags: ['nav', 'footer', 'header', 'script', 'style', 'aside', 'form', 'button', 'input', 'select', 'textarea'],
          onlyMainContent: true, // Focus on main content area
          waitFor: 2000 // Wait 2 seconds for dynamic content to load
        },
        allowBackwardLinks: false,
        allowExternalLinks: false
      });

      logger.debug('Firecrawl crawl response received');
      console.log('Raw Firecrawl response:', crawlResponse);

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
      const processedPages = ContentProcessor.processPages(sanitizedResponse.data);
      const filteredData = ContentProcessor.filterValidPages(processedPages);

      logger.info(`Successfully processed ${processedPages.length} pages`);

      // If still no content, try a direct scrape of the main URL
      if (filteredData.length === 0) {
        return await this.tryDirectScrape(url);
      }

      return { success: true, data: filteredData };

    } catch (error) {
      logger.error('Error during Firecrawl crawl:', error);
      
      // If we get a network error, try a more conservative approach
      if (error instanceof Error && error.message.includes('Network Error')) {
        console.log('Network error detected, trying direct scrape as fallback...');
        return await this.tryDirectScrape(url);
      }
      
      return { 
        success: false, 
        error: sanitizeErrorMessage(error)
      };
    }
  }

  private static async tryDirectScrape(url: string): Promise<CrawlResult> {
    console.log('No content found via crawl, trying direct scrape...');
    
    try {
      const app = this.getApp();
      const scrapeResponse = await app.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article'],
        excludeTags: ['nav', 'footer', 'header', 'script', 'style'],
        onlyMainContent: true,
        waitFor: 3000
      });

      if (scrapeResponse.success && scrapeResponse.markdown) {
        const scrapedContent = scrapeResponse.markdown || '';
        if (scrapedContent.trim().length > 10) {
          console.log(`Direct scrape successful: ${scrapedContent.length} characters`);
          return { 
            success: true, 
            data: [{
              url: url,
              content: scrapedContent.trim(),
              metadata: scrapeResponse.metadata || {}
            }]
          };
        }
      }
    } catch (scrapeError) {
      console.log('Direct scrape also failed:', scrapeError);
    }

    return { 
      success: false, 
      error: 'No readable content found. The website may be blocking crawlers, require JavaScript to load content, or have content behind authentication.' 
    };
  }
}
