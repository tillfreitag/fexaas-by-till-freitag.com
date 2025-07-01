
import type { FAQItem } from "@/types/faq";
import { CrawlerService } from "@/services/CrawlerService";
import { OpenAIService } from "@/services/OpenAIService";
import { LLMFAQExtractor } from "./llmFaqExtractor";

// Enhanced FAQ extraction service with LLM support
export const extractFAQs = async (url: string): Promise<FAQItem[]> => {
  try {
    console.log('Starting website crawl for:', url);
    
    // Use real crawler service
    const crawlResult = await CrawlerService.crawlWebsite(url);
    
    if (!crawlResult.success) {
      throw new Error(crawlResult.error || 'Failed to crawl website');
    }

    if (!crawlResult.data || crawlResult.data.length === 0) {
      console.log('No content found, using fallback sample data');
      return generateFallbackFAQs(url);
    }

    // Check if we have OpenAI API key for intelligent extraction
    if (OpenAIService.hasApiKey()) {
      console.log('Using AI-powered FAQ extraction');
      try {
        const extractedFAQs = await LLMFAQExtractor.extractFAQsFromContent(crawlResult.data);
        
        if (extractedFAQs.length > 0) {
          console.log(`Successfully extracted ${extractedFAQs.length} FAQs using AI`);
          return extractedFAQs;
        }
      } catch (error) {
        console.error('AI extraction failed, falling back to sample data:', error);
      }
    }

    console.log('No AI extraction available, using fallback sample data');
    return generateFallbackFAQs(url);
    
  } catch (error) {
    console.error('Error during FAQ extraction:', error);
    return generateFallbackFAQs(url);
  }
};

// Fallback function for when real crawling fails or finds no content
const generateFallbackFAQs = (url: string): FAQItem[] => {
  const domain = new URL(url).hostname;
  const sampleFAQs: Omit<FAQItem, 'id' | 'extractedAt'>[] = [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for all unused items in original packaging. Simply contact our support team to initiate a return.",
      category: "Returns & Refunds",
      sourceUrl: `${url}/faq`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery.",
      category: "Shipping",
      sourceUrl: `${url}/support/shipping`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to over 50 countries worldwide. International shipping rates and times vary by location.",
      category: "Shipping",
      sourceUrl: `${url}/support/shipping`,
      confidence: "medium",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account.",
      category: "Orders",
      sourceUrl: `${url}/help/orders`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay for secure checkout.",
      category: "Payment",
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
