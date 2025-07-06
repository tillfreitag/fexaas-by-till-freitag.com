
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

      // Enhanced crawl configuration for better content extraction
      const crawlResponse = await this.firecrawlApp.crawlUrl(url, {
        limit: 5, // Reduced to 5 pages for more focused crawling
        scrapeOptions: {
          formats: ['markdown', 'html'], // Include both formats
          includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article', 'details', 'summary', 'dl', 'dt', 'dd', 'li', 'span', 'main'],
          excludeTags: ['nav', 'footer', 'header', 'script', 'style', 'aside', 'form', 'button', 'input', 'select', 'textarea'],
          onlyMainContent: true, // Focus on main content area
          removeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside'],
          waitFor: 2000 // Wait 2 seconds for dynamic content to load
        },
        allowBackwardCrawling: false,
        allowExternalContentLinks: false
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
      const crawlData = sanitizedResponse.data?.map((page: any) => {
        // Try to get content from multiple sources
        let content = '';
        
        if (page.markdown && page.markdown.trim().length > 0) {
          content = page.markdown.trim();
        } else if (page.content && page.content.trim().length > 0) {
          content = page.content.trim();
        } else if (page.html && page.html.trim().length > 0) {
          // Basic HTML to text conversion as fallback
          content = page.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        return {
          url: page.metadata?.sourceURL || page.url || url,
          content: content,
          metadata: page.metadata || {}
        };
      }) || [];

      logger.info(`Successfully processed ${crawlData.length} pages`);
      
      // Log content details before filtering
      crawlData.forEach((page: any, index: number) => {
        console.log(`Page ${index + 1} before filtering:`, {
          url: page.url,
          contentLength: page.content?.length || 0,
          contentPreview: page.content?.substring(0, 300) + '...',
          hasMarkdown: !!page.markdown,
          hasHtml: !!page.html
        });
      });

      // More lenient content filtering
      const filteredData = crawlData.filter((page: any) => {
        const hasContent = page.content && 
                          typeof page.content === 'string' && 
                          page.content.trim().length > 20; // Very lenient - just 20 chars
        
        if (!hasContent) {
          console.log(`Filtering out page with ${page.content?.length || 0} characters:`, page.url);
        }
        
        return hasContent;
      });

      logger.info(`Filtered to ${filteredData.length} pages with content`);

      // If still no content, try a direct scrape of the main URL
      if (filteredData.length === 0) {
        console.log('No content found via crawl, trying direct scrape...');
        
        try {
          const scrapeResponse = await this.firecrawlApp.scrapeUrl(url, {
            formats: ['markdown', 'html'],
            includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article'],
            excludeTags: ['nav', 'footer', 'header', 'script', 'style'],
            onlyMainContent: true,
            waitFor: 3000
          });

          if (scrapeResponse.success && scrapeResponse.data) {
            const scrapedContent = scrapeResponse.data.markdown || scrapeResponse.data.content || '';
            if (scrapedContent.trim().length > 20) {
              console.log(`Direct scrape successful: ${scrapedContent.length} characters`);
              return { 
                success: true, 
                data: [{
                  url: url,
                  content: scrapedContent.trim(),
                  metadata: scrapeResponse.data.metadata || {}
                }]
              };
            }
          }
        } catch (scrapeError) {
          console.log('Direct scrape also failed:', scrapeError);
        }
      }

      if (filteredData.length === 0) {
        return { 
          success: false, 
          error: 'No readable content found. The website may be blocking crawlers, require JavaScript to load content, or have content behind authentication.' 
        };
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
