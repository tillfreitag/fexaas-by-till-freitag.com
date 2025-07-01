
import FirecrawlApp from '@mendable/firecrawl-js';

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
    console.log('Firecrawl API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing Firecrawl API key...');
      const testApp = new FirecrawlApp({ apiKey });
      const testResponse = await testApp.scrapeUrl('https://example.com');
      console.log('Firecrawl API key test result:', testResponse.success);
      return testResponse.success;
    } catch (error) {
      console.error('Error testing Firecrawl API key:', error);
      return false;
    }
  }

  static async crawlWebsite(url: string): Promise<CrawlResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('Firecrawl API key not found');
      return { success: false, error: 'Firecrawl API key not found' };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      console.log(`Starting crawl for: ${url}`);

      // Use crawlUrl for proper website crawling (multiple pages)
      const crawlResponse = await this.firecrawlApp.crawlUrl(url, {
        limit: 10, // Crawl up to 10 pages
        scrapeOptions: {
          formats: ['markdown'],
          includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article', 'details', 'summary', 'dl', 'dt', 'dd'],
          excludeTags: ['nav', 'footer', 'header', 'script', 'style', 'aside', 'form', 'button']
        }
      });

      console.log('Firecrawl crawl response:', crawlResponse);

      if (!crawlResponse.success) {
        console.error('Firecrawl crawl failed:', crawlResponse);
        // Fix: Check if crawlResponse has error property by checking success first
        const errorMessage = 'error' in crawlResponse ? crawlResponse.error : 'Failed to crawl website';
        return { 
          success: false, 
          error: errorMessage || 'Failed to crawl website' 
        };
      }

      // Transform the response to match our expected format
      const crawlData = crawlResponse.data?.map((page: any) => ({
        url: page.metadata?.sourceURL || page.url || url,
        content: page.markdown || page.content || '',
        metadata: page.metadata || {}
      })) || [];

      console.log(`Successfully crawled ${crawlData.length} pages`);
      
      // Filter out pages with minimal content
      const filteredData = crawlData.filter((page: any) => 
        page.content && page.content.length > 100
      );

      console.log(`Filtered to ${filteredData.length} pages with substantial content`);

      return { success: true, data: filteredData };

    } catch (error) {
      console.error('Error during Firecrawl crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to crawl website' 
      };
    }
  }
}
