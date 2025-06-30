
import FirecrawlApp from '@mendable/firecrawl-js';
import type { FAQItem } from '@/types/faq';

interface CrawlResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export class CrawlerService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const testApp = new FirecrawlApp({ apiKey });
      const testResponse = await testApp.scrapeUrl('https://example.com');
      return testResponse.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async crawlWebsite(url: string): Promise<CrawlResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      // First, try to find FAQ-specific pages
      const faqUrls = this.generateFAQUrls(url);
      const crawlResults = [];

      // Crawl the main URL and FAQ-specific URLs
      for (const targetUrl of [url, ...faqUrls]) {
        try {
          const response = await this.firecrawlApp.scrapeUrl(targetUrl, {
            formats: ['markdown', 'html'],
            includeTags: ['h1', 'h2', 'h3', 'h4', 'p', 'div', 'section', 'details', 'summary'],
            excludeTags: ['nav', 'footer', 'header', 'script', 'style']
          });

          if (response.success) {
            crawlResults.push({
              url: targetUrl,
              content: response.markdown || response.html || '',
              metadata: response.metadata
            });
          }
        } catch (error) {
          console.log(`Failed to crawl ${targetUrl}:`, error);
          // Continue with other URLs
        }
      }

      return { success: true, data: crawlResults };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to crawl website' 
      };
    }
  }

  private static generateFAQUrls(baseUrl: string): string[] {
    const domain = new URL(baseUrl).origin;
    const faqPaths = [
      '/faq',
      '/faqs',
      '/support',
      '/help',
      '/questions',
      '/support/faq',
      '/help/faq',
      '/customer-support',
      '/knowledge-base'
    ];

    return faqPaths.map(path => `${domain}${path}`);
  }
}
