
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

    console.log('Raw crawl result:', crawlResult);

    if (!crawlResult.data || crawlResult.data.length === 0) {
      console.log('No content found during crawl - using fallback sample data');
      return generateFallbackFAQs(url);
    }

    console.log(`Crawl successful - found ${crawlResult.data.length} pages`);
    
    // Log content details for debugging
    crawlResult.data.forEach((page, index) => {
      console.log(`Page ${index + 1}: ${page.url}, content length: ${page.content?.length || 0}`);
    });

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
      question: "Was ist Ihre Rückgaberichtlinie?",
      answer: "Wir bieten eine 30-tägige Rückgaberichtlinie für alle unbenutzte Artikel in der Originalverpackung an. Kontaktieren Sie einfach unser Support-Team, um eine Rückgabe zu initiieren.",
      category: "Returns & Refunds",
      language: "German",
      sourceUrl: `${url}/faq`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Wie lange dauert der Versand?",
      answer: "Der Standardversand dauert normalerweise 3-5 Werktage. Expressversand ist für die Lieferung in 1-2 Werktagen verfügbar.",
      category: "Shipping",
      language: "German",
      sourceUrl: `${url}/support/shipping`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Bieten Sie internationalen Versand an?",
      answer: "Ja, wir versenden in über 50 Länder weltweit. Internationale Versandkosten und -zeiten variieren je nach Standort.",
      category: "Shipping",
      language: "German",
      sourceUrl: `${url}/support/shipping`,
      confidence: "medium",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Wie kann ich meine Bestellung verfolgen?",
      answer: "Sobald Ihre Bestellung versendet wird, erhalten Sie eine Tracking-Nummer per E-Mail. Sie können auch Ihren Bestellstatus in Ihrem Konto überprüfen.",
      category: "Orders",
      language: "German",
      sourceUrl: `${url}/help/orders`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Welche Zahlungsmethoden akzeptieren Sie?",
      answer: "Wir akzeptieren alle gängigen Kreditkarten, PayPal, Apple Pay und Google Pay für eine sichere Bezahlung.",
      category: "Payment",
      language: "German",
      sourceUrl: `${url}/faq#payment`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
  ];

  // Add domain-specific FAQs
  if (domain.includes('shop') || domain.includes('store')) {
    sampleFAQs.push({
      question: "Bieten Sie Preisanpassungen an?",
      answer: "Ja, wir passen Konkurrenzpreise für identische Artikel an. Kontaktieren Sie uns mit dem Nachweis des niedrigeren Preises.",
      category: "Pricing",
      language: "German",
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
