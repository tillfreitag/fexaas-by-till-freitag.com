
import { ProcessedPage } from '@/types/crawler';
import { logger } from '@/utils/securityConfig';

export class ContentProcessor {
  static processPages(crawlData: any[]): ProcessedPage[] {
    return crawlData?.map((page: any) => {
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
        url: page.metadata?.sourceURL || page.url,
        content: content,
        metadata: page.metadata || {}
      };
    }) || [];
  }

  static filterValidPages(pages: ProcessedPage[]): ProcessedPage[] {
    // Log content details before filtering
    pages.forEach((page: any, index: number) => {
      console.log(`Page ${index + 1} before filtering:`, {
        url: page.url,
        contentLength: page.content?.length || 0,
        contentPreview: page.content?.substring(0, 300) + '...',
      });
    });

    // More lenient content filtering
    const filteredData = pages.filter((page: any) => {
      const hasContent = page.content && 
                        typeof page.content === 'string' && 
                        page.content.trim().length > 10; // Very lenient - just 10 chars
      
      if (!hasContent) {
        console.log(`Filtering out page with ${page.content?.length || 0} characters:`, page.url);
      }
      
      return hasContent;
    });

    logger.info(`Filtered to ${filteredData.length} pages with content`);
    return filteredData;
  }
}
