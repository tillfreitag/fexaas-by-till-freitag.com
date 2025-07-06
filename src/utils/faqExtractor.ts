
import type { FAQItem } from "@/types/faq";
import { CrawlerService } from "@/services/CrawlerService";
import { OpenAIService } from "@/services/OpenAIService";
import { LLMFAQExtractor } from "./llmFaqExtractor";

// Enhanced FAQ extraction service with proper error handling
export const extractFAQs = async (url: string): Promise<FAQItem[]> => {
  console.log('=== Starting FAQ extraction process ===');
  console.log('Target URL:', url);
  console.log('Firecrawl API available:', CrawlerService.hasApiKey());
  console.log('OpenAI API available:', OpenAIService.hasApiKey());
  
  // Check if we have the required API keys
  if (!CrawlerService.hasApiKey()) {
    console.error('Firecrawl API key missing');
    throw new Error('Firecrawl API key is required to crawl websites. Please set up your API key first.');
  }

  // Start crawling with Firecrawl
  console.log('Starting website crawl...');
  const crawlResult = await CrawlerService.crawlWebsite(url);
  
  if (!crawlResult.success) {
    console.error('Crawl failed:', crawlResult.error);
    throw new Error(`Failed to crawl website: ${crawlResult.error || 'Unknown crawling error'}`);
  }

  console.log('Raw crawl result:', crawlResult);

  if (!crawlResult.data || crawlResult.data.length === 0) {
    console.error('No content found from crawl');
    throw new Error('No content found on the website. The website might be blocking crawlers, have dynamic content that requires JavaScript, or the content might be behind authentication. Please try a different URL.');
  }

  console.log(`Crawl successful - found ${crawlResult.data.length} pages`);
  
  // Log content details for debugging
  crawlResult.data.forEach((page, index) => {
    console.log(`Page ${index + 1}: ${page.url}, content length: ${page.content?.length || 0}, content preview:`, page.content?.substring(0, 300) + '...');
  });

  // Check if we can use AI extraction
  if (!OpenAIService.hasApiKey()) {
    console.error('OpenAI API key missing');
    throw new Error('OpenAI API key is required for FAQ extraction. Please set up your OpenAI API key to continue.');
  }

  // Use AI-powered extraction
  console.log('Starting AI-powered FAQ extraction...');
  console.log(`Sending ${crawlResult.data.length} pages to OpenAI for processing`);
  
  try {
    const extractedFAQs = await LLMFAQExtractor.extractFAQsFromContent(crawlResult.data);
    
    if (extractedFAQs.length === 0) {
      console.warn('No FAQs extracted by AI');
      throw new Error('No FAQs could be extracted from this website. The content might not contain FAQ-style information, or the AI was unable to identify relevant Q&A pairs. Try a website with clearer FAQ sections or customer support content.');
    }

    console.log(`=== FAQ extraction completed successfully ===`);
    console.log(`Extracted ${extractedFAQs.length} FAQs using AI`);
    return extractedFAQs;
  } catch (aiError) {
    console.error('AI extraction failed:', aiError);
    throw aiError;
  }
};
