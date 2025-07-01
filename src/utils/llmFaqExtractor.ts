
import type { FAQItem } from "@/types/faq";
import { OpenAIService } from "@/services/OpenAIService";

interface CrawledContent {
  url: string;
  content: string;
  metadata?: any;
}

interface LLMFAQResponse {
  question: string;
  answer: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

export class LLMFAQExtractor {
  static async extractFAQsFromContent(crawledData: CrawledContent[]): Promise<FAQItem[]> {
    const faqs: FAQItem[] = [];
    
    for (const data of crawledData) {
      try {
        console.log(`Processing content from ${data.url}, length: ${data.content.length}`);
        
        // Clean and prepare content
        const cleanedContent = this.cleanContent(data.content);
        
        if (cleanedContent.length < 100) {
          console.log('Content too short, skipping...');
          continue;
        }

        // Extract FAQs using OpenAI
        const llmFAQs = await OpenAIService.extractFAQs(cleanedContent, data.url);
        
        // Convert to FAQItem format
        const processedFAQs = llmFAQs.map((faq: LLMFAQResponse) => 
          this.createFAQItem(faq, data.url)
        );

        faqs.push(...processedFAQs);
        
      } catch (error) {
        console.error(`Error processing content from ${data.url}:`, error);
        continue;
      }
    }

    // Remove duplicates and post-process
    return this.postProcessFAQs(faqs);
  }

  private static cleanContent(content: string): string {
    // Remove common website noise
    let cleaned = content
      // Remove navigation and footer patterns
      .replace(/\n\s*(Home|About|Contact|Privacy|Terms|Login|Sign up|Menu|Search|Newsletter|Subscribe|Follow us)\s*\n/gi, '\n')
      // Remove copyright and legal text
      .replace(/\n\s*(Copyright|©|All rights reserved|Terms of Service|Privacy Policy).*\n/gi, '\n')
      // Remove social media links
      .replace(/\n\s*(Facebook|Twitter|Instagram|LinkedIn|YouTube)\s*\n/gi, '\n')
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove markdown artifacts that might confuse the LLM
      .replace(/^\s*[#*-]{1,3}\s*/gm, '')
      .trim();

    return cleaned;
  }

  private static createFAQItem(llmFAQ: LLMFAQResponse, sourceUrl: string): FAQItem {
    return {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: llmFAQ.question.trim(),
      answer: llmFAQ.answer.trim(),
      category: llmFAQ.category || 'General',
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
      }
    }

    console.log(`Final processed FAQs: ${uniqueFAQs.length}`);
    return uniqueFAQs;
  }
}
