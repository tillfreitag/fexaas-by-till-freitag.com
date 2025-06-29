
import type { FAQItem } from "@/types/faq";

interface CrawledContent {
  url: string;
  content: string;
  metadata?: any;
}

export class RealFAQExtractor {
  static extractFAQsFromContent(crawledData: CrawledContent[]): FAQItem[] {
    const faqs: FAQItem[] = [];
    
    for (const data of crawledData) {
      const extractedFAQs = this.parseContentForFAQs(data.content, data.url);
      faqs.push(...extractedFAQs);
    }

    // Remove duplicates and enhance with metadata
    return this.postProcessFAQs(faqs);
  }

  private static parseContentForFAQs(content: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];
    
    // Method 1: Look for Q&A patterns in markdown
    const qaPatterns = [
      /(?:^|\n)#+\s*(.+\?)\s*\n+((?:(?!\n#+)[^\n]+\n?)+)/gm,
      /(?:^|\n)\*\*(.+\?)\*\*\s*\n+((?:(?!\n\*\*)[^\n]+\n?)+)/gm,
      /(?:^|\n)Q:\s*(.+)\s*\n+A:\s*((?:(?!\nQ:)[^\n]+\n?)+)/gm
    ];

    for (const pattern of qaPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const question = match[1].trim();
        const answer = match[2].trim();
        
        if (this.isValidFAQ(question, answer)) {
          faqs.push(this.createFAQItem(question, answer, sourceUrl));
        }
      }
    }

    // Method 2: Look for structured lists
    const listPattern = /(?:^|\n)(?:\d+\.|[-*])\s*(.+\?)\s*\n+((?:(?!\n(?:\d+\.|[-*]))[^\n]+\n?)+)/gm;
    let match;
    while ((match = listPattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      
      if (this.isValidFAQ(question, answer)) {
        faqs.push(this.createFAQItem(question, answer, sourceUrl));
      }
    }

    return faqs;
  }

  private static isValidFAQ(question: string, answer: string): boolean {
    // Basic validation rules
    return (
      question.length > 10 &&
      answer.length > 20 &&
      question.includes('?') &&
      !question.toLowerCase().includes('lorem ipsum') &&
      !answer.toLowerCase().includes('lorem ipsum')
    );
  }

  private static createFAQItem(question: string, answer: string, sourceUrl: string): FAQItem {
    return {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: question.replace(/[#*]/g, '').trim(),
      answer: answer.replace(/[#*]/g, '').trim(),
      category: this.categorizeQuestion(question),
      sourceUrl,
      confidence: this.calculateConfidence(question, answer),
      isIncomplete: answer.length < 50,
      isDuplicate: false,
      extractedAt: new Date().toISOString(),
    };
  }

  private static categorizeQuestion(question: string): string {
    const categories = {
      'Shipping': ['ship', 'deliver', 'shipping', 'delivery', 'tracking', 'package'],
      'Returns & Refunds': ['return', 'refund', 'exchange', 'money back', 'cancel'],
      'Payment': ['pay', 'payment', 'credit card', 'billing', 'charge', 'cost', 'price'],
      'Account': ['account', 'login', 'password', 'profile', 'register', 'sign up'],
      'Support': ['help', 'support', 'contact', 'customer service', 'assistance'],
      'Technical': ['technical', 'bug', 'error', 'not working', 'browser', 'mobile'],
      'General': ['what', 'how', 'when', 'where', 'why']
    };

    const lowerQuestion = question.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private static calculateConfidence(question: string, answer: string): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Question quality indicators
    if (question.includes('?')) score += 2;
    if (question.length > 20) score += 1;
    if (question.toLowerCase().match(/\b(what|how|when|where|why|can|do|does|is|are)\b/)) score += 1;
    
    // Answer quality indicators
    if (answer.length > 100) score += 2;
    if (answer.includes('.')) score += 1;
    if (answer.toLowerCase().match(/\b(yes|no|you can|we offer|our|the)\b/)) score += 1;
    
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  private static postProcessFAQs(faqs: FAQItem[]): FAQItem[] {
    // Remove duplicates based on question similarity
    const uniqueFAQs: FAQItem[] = [];
    const seenQuestions = new Set<string>();

    for (const faq of faqs) {
      const normalizedQuestion = faq.question.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      if (!seenQuestions.has(normalizedQuestion)) {
        seenQuestions.add(normalizedQuestion);
        uniqueFAQs.push(faq);
      } else {
        // Mark as duplicate
        const existingFAQ = uniqueFAQs.find(f => 
          f.question.toLowerCase().replace(/[^a-z0-9\s]/g, '') === normalizedQuestion
        );
        if (existingFAQ) {
          existingFAQ.isDuplicate = true;
        }
      }
    }

    return uniqueFAQs;
  }
}
