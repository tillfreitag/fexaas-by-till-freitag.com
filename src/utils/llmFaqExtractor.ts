
import type { FAQItem } from "@/types/faq";
import { OpenAIService } from "@/services/OpenAIService";
import { logger, sanitizeErrorMessage } from "@/utils/securityConfig";
import { validateContent } from "@/utils/inputValidation";

interface CrawledContent {
  url: string;
  content: string;
  metadata?: any;
}

interface LLMFAQResponse {
  question: string;
  answer: string;
  category: string;
  language: string;
  confidence: 'high' | 'medium' | 'low';
}

export class LLMFAQExtractor {
  static async extractFAQsFromContent(crawledData: CrawledContent[]): Promise<FAQItem[]> {
    logger.info(`Processing ${crawledData.length} crawled pages for FAQ extraction`);
    
    const faqs: FAQItem[] = [];
    
    for (const data of crawledData) {
      try {
        logger.debug(`Processing page: ${data.url}, content length: ${data.content.length}`);
        
        // Validate content
        const contentValidation = validateContent(data.content);
        if (!contentValidation.isValid) {
          logger.warn(`Content validation failed for ${data.url}: ${contentValidation.error}`);
          continue;
        }

        // Clean and prepare content
        const cleanedContent = this.cleanContent(data.content);
        
        if (cleanedContent.length < 200) {
          logger.info(`Content too short (${cleanedContent.length} chars), skipping: ${data.url}`);
          continue;
        }

        logger.debug(`Sending ${cleanedContent.length} characters to OpenAI for extraction`);

        // Extract FAQs using OpenAI
        const llmFAQs = await OpenAIService.extractFAQs(cleanedContent, data.url);
        
        if (!llmFAQs || llmFAQs.length === 0) {
          logger.info(`No FAQs extracted from: ${data.url}`);
          continue;
        }

        logger.info(`OpenAI extracted ${llmFAQs.length} FAQs from: ${data.url}`);
        
        // Convert to FAQItem format with validation
        const processedFAQs = llmFAQs
          .filter((faq: LLMFAQResponse) => this.validateFAQResponse(faq))
          .map((faq: LLMFAQResponse) => this.createFAQItem(faq, data.url));

        faqs.push(...processedFAQs);
        
      } catch (error) {
        logger.error(`Error processing content from ${data.url}:`, error);
        continue;
      }
    }

    logger.info(`Total FAQs before post-processing: ${faqs.length}`);

    // Remove duplicates and post-process
    const finalFAQs = this.postProcessFAQs(faqs);
    
    logger.info(`Final FAQ count after post-processing: ${finalFAQs.length}`);
    
    return finalFAQs;
  }

  private static validateFAQResponse(faq: LLMFAQResponse): boolean {
    return !!(
      faq &&
      typeof faq.question === 'string' &&
      typeof faq.answer === 'string' &&
      faq.question.trim().length > 0 &&
      faq.answer.trim().length > 0 &&
      faq.question.length <= 500 &&
      faq.answer.length <= 2000
    );
  }

  private static cleanContent(content: string): string {
    // More gentle content cleaning to preserve FAQ-relevant content
    let cleaned = content
      // Remove excessive whitespace but preserve structure
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove obvious navigation patterns
      .replace(/\n\s*(Home|About|Contact|Privacy|Terms|Login|Sign up|Menu|Search)\s*\n/gi, '\n')
      // Remove social media noise
      .replace(/\n\s*(Follow us|Share|Like|Tweet)\s*\n/gi, '\n')
      // Clean up but don't be too aggressive
      .trim();

    return cleaned;
  }

  private static createFAQItem(llmFAQ: LLMFAQResponse, sourceUrl: string): FAQItem {
    return {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: llmFAQ.question.trim().substring(0, 500),
      answer: llmFAQ.answer.trim().substring(0, 2000),
      category: llmFAQ.category || 'General',
      language: llmFAQ.language || 'English',
      sourceUrl,
      confidence: llmFAQ.confidence || 'medium',
      isIncomplete: llmFAQ.answer.length < 30,
      isDuplicate: false,
      extractedAt: new Date().toISOString(),
    };
  }

  private static postProcessFAQs(faqs: FAQItem[]): FAQItem[] {
    // Remove duplicates based on question similarity
    const uniqueFAQs: FAQItem[] = [];
    const seenQuestions = new Set<string>();

    for (const faq of faqs) {
      const normalizedQuestion = faq.question.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!seenQuestions.has(normalizedQuestion)) {
        seenQuestions.add(normalizedQuestion);
        uniqueFAQs.push(faq);
      } else {
        logger.debug(`Duplicate question filtered out: ${faq.question}`);
      }
    }

    return uniqueFAQs;
  }
}
