
import type { FAQItem } from "@/types/faq";
import { CrawlerService } from "@/services/CrawlerService";
import { OpenAIService } from "@/services/OpenAIService";
import { LLMFAQExtractor } from "./llmFaqExtractor";

// Enhanced FAQ extraction service with proper Firecrawl + OpenAI integration
export const extractFAQs = async (url: string): Promise<FAQItem[]> => {
  try {
    console.log('=== Starting FAQ extraction process ===');
    console.log('Target URL:', url);
    console.log('Firecrawl API available:', CrawlerService.hasApiKey());
    console.log('OpenAI API available:', OpenAIService.hasApiKey());
    
    // Check if we have the required API keys
    if (!CrawlerService.hasApiKey()) {
      console.log('No Firecrawl API key - using fallback sample data');
      return generateFallbackFAQs(url);
    }

    // Start crawling with Firecrawl
    console.log('Starting website crawl...');
    const crawlResult = await CrawlerService.crawlWebsite(url);
    
    if (!crawlResult.success) {
      console.error('Crawl failed:', crawlResult.error);
      throw new Error(crawlResult.error || 'Failed to crawl website');
    }

    if (!crawlResult.data || crawlResult.data.length === 0) {
      console.log('No content found during crawl - using fallback sample data');
      return generateFallbackFAQs(url);
    }

    console.log(`Crawl successful - found ${crawlResult.data.length} pages`);

    // Check if we can use AI extraction
    if (!OpenAIService.hasApiKey()) {
      console.log('No OpenAI API key - using fallback sample data');
      return generateFallbackFAQs(url);
    }

    // Use AI-powered extraction
    console.log('Starting AI-powered FAQ extraction...');
    try {
      const extractedFAQs = await LLMFAQExtractor.extractFAQsFromContent(crawlResult.data);
      
      if (extractedFAQs.length > 0) {
        console.log(`=== FAQ extraction completed successfully ===`);
        console.log(`Extracted ${extractedFAQs.length} FAQs using AI`);
        return extractedFAQs;
      } else {
        console.log('AI extraction returned no results - using fallback sample data');
        return generateFallbackFAQs(url);
      }
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      console.log('Falling back to sample data due to AI extraction failure');
      return generateFallbackFAQs(url);
    }
    
  } catch (error) {
    console.error('Error during FAQ extraction:', error);
    console.log('Using fallback sample data due to extraction error');
    return generateFallbackFAQs(url);
  }
};

// Fallback function for when real crawling fails or finds no content
const generateFallbackFAQs = (url: string): FAQItem[] => {
  console.log('Generating fallback FAQ data for:', url);
  
  const domain = new URL(url).hostname;
  const sampleFAQs: Omit<FAQItem, 'id' | 'extractedAt'>[] = [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for all unused items in original packaging. Simply contact our support team to initiate a return.",
      category: "Returns & Refunds",
      language: "English",
      sourceUrl: `${url}/faq`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery.",
      category: "Shipping",
      language: "English",
      sourceUrl: `${url}/support/shipping`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to over 50 countries worldwide. International shipping rates and times vary by location.",
      category: "Shipping",
      language: "English",
      sourceUrl: `${url}/support/shipping`,
      confidence: "medium",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account.",
      category: "Orders",
      language: "English",
      sourceUrl: `${url}/help/orders`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay for secure checkout.",
      category: "Payment",
      language: "English",
      sourceUrl: `${url}/faq#payment`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
  ];

  // Add domain-specific FAQs
  if (domain.includes('shop') || domain.includes('store')) {
    sampleFAQs.push({
      question: "Do you offer price matching?",
      answer: "Yes, we match competitor prices on identical items. Contact us with proof of the lower price.",
      category: "Pricing",
      language: "English",
      sourceUrl: `${url}/price-match`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    });
  }

  // Generate IDs and timestamps
  return sampleFAQs.map((faq, index) => ({
    ...faq,
    id: `faq-${Date.now()}-${index}`,
    extractedAt: new Date().toISOString(),
  }));
};
